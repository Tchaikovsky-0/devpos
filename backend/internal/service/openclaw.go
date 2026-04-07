package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/config"
	"xunjianbao-backend/internal/model"
)

// OpenClawService manages communication with the OpenClaw AI Agent service.
// When OpenClaw is unavailable it automatically falls back to the Python AI service.
type OpenClawService struct {
	db         *gorm.DB
	baseURL    string
	token      string
	httpClient *http.Client
	available  bool
	mu         sync.RWMutex
	lastCheck  time.Time

	// Fallback: Python AI service URL (reused from AIService)
	aiServiceURL string
}

// NewOpenClawService creates an OpenClawService from config.
func NewOpenClawService(db *gorm.DB, cfg *config.Config) *OpenClawService {
	return &OpenClawService{
		db:      db,
		baseURL: cfg.OpenClawURL,
		token:   cfg.OpenClawToken,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		aiServiceURL: cfg.AIServiceURL,
	}
}

// CheckHealth probes the /health endpoint and caches the result for 30 s.
func (s *OpenClawService) CheckHealth() bool {
	s.mu.RLock()
	if time.Since(s.lastCheck) < 30*time.Second {
		avail := s.available
		s.mu.RUnlock()
		return avail
	}
	s.mu.RUnlock()

	s.mu.Lock()
	defer s.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", s.baseURL+"/health", nil)
	if err != nil {
		s.available = false
		s.lastCheck = time.Now()
		return false
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.available = false
		s.lastCheck = time.Now()
		return false
	}
	defer resp.Body.Close()

	s.available = resp.StatusCode == http.StatusOK
	s.lastCheck = time.Now()
	return s.available
}

// Chat sends a message to OpenClaw (or falls back to Python AI service).
func (s *OpenClawService) Chat(ctx context.Context, message string, chatContext map[string]interface{}) (string, error) {
	messages := []map[string]string{
		{"role": "user", "content": message},
	}

	// Try OpenClaw first
	if s.CheckHealth() {
		result, err := s.callOpenClaw(ctx, messages, chatContext)
		if err == nil {
			return result, nil
		}
	}

	// Fallback to Python AI service
	return s.callPythonAI(ctx, messages, chatContext)
}

// ChatStream opens a streaming connection and returns a channel of content chunks.
func (s *OpenClawService) ChatStream(ctx context.Context, message string, chatContext map[string]interface{}) (<-chan string, error) {
	ch := make(chan string, 64)

	messages := []map[string]string{
		{"role": "user", "content": message},
	}

	go func() {
		defer close(ch)

		// Try OpenClaw streaming
		if s.CheckHealth() {
			err := s.streamOpenClaw(ctx, messages, chatContext, ch)
			if err == nil {
				return
			}
		}

		// Fallback: call Python AI and stream the full response
		result, err := s.callPythonAI(ctx, messages, chatContext)
		if err != nil {
			ch <- fmt.Sprintf("[error] %s", err.Error())
			return
		}
		// Emit in small chunks
		chunkSize := 20
		for i := 0; i < len(result); i += chunkSize {
			end := i + chunkSize
			if end > len(result) {
				end = len(result)
			}
			select {
			case <-ctx.Done():
				return
			case ch <- result[i:end]:
			}
		}
	}()

	return ch, nil
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func (s *OpenClawService) callOpenClaw(ctx context.Context, messages []map[string]string, chatContext map[string]interface{}) (string, error) {
	payload := map[string]interface{}{
		"messages": messages,
		"model":    "openclaw",
	}
	if chatContext != nil {
		payload["context"] = chatContext
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/v1/chat/completions", bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if s.token != "" {
		req.Header.Set("Authorization", "Bearer "+s.token)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("openclaw returned %d", resp.StatusCode)
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode: %w", err)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("empty choices")
	}

	return result.Choices[0].Message.Content, nil
}

func (s *OpenClawService) streamOpenClaw(ctx context.Context, messages []map[string]string, chatContext map[string]interface{}, ch chan<- string) error {
	payload := map[string]interface{}{
		"messages": messages,
		"model":    "openclaw",
		"stream":   true,
	}
	if chatContext != nil {
		payload["context"] = chatContext
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/v1/chat/completions", bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if s.token != "" {
		req.Header.Set("Authorization", "Bearer "+s.token)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("openclaw stream returned %d", resp.StatusCode)
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		payload := strings.TrimPrefix(line, "data: ")
		if payload == "[DONE]" {
			break
		}
		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(payload), &chunk); err != nil {
			continue
		}
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case ch <- chunk.Choices[0].Delta.Content:
			}
		}
	}

	return nil
}

func (s *OpenClawService) callPythonAI(ctx context.Context, messages []map[string]string, chatContext map[string]interface{}) (string, error) {
	payload := map[string]interface{}{
		"messages": messages,
	}
	if chatContext != nil {
		payload["context"] = chatContext
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.aiServiceURL+"/api/v1/chat", bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("python AI request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read body: %w", err)
	}

	var result struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("decode: %w", err)
	}

	return result.Message.Content, nil
}

// =========================================================================
// Mission CRUD (DB-backed)
// =========================================================================

// ListMissions lists missions for a tenant with pagination.
func (s *OpenClawService) ListMissions(ctx context.Context, tenantID string, page, pageSize int) ([]model.OpenClawMission, int64, error) {
	var missions []model.OpenClawMission
	var total int64

	q := s.db.WithContext(ctx).Where("tenant_id = ? AND deleted_at IS NULL", tenantID)
	q.Model(&model.OpenClawMission{}).Count(&total)

	offset := (page - 1) * pageSize
	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&missions).Error; err != nil {
		return nil, 0, err
	}
	return missions, total, nil
}

// GetMissionStatistics returns statistics for a tenant's missions.
func (s *OpenClawService) GetMissionStatistics(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	var total, pending, running, completed, failed int64
	base := s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID)
	base.Count(&total)
	base.Where("status = 'pending'").Count(&pending)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = 'running'", tenantID).Count(&running)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = 'completed'", tenantID).Count(&completed)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = 'failed'", tenantID).Count(&failed)

	return map[string]interface{}{
		"total":     total,
		"pending":   pending,
		"running":   running,
		"completed": completed,
		"failed":    failed,
	}, nil
}

// GetMission fetches a single mission.
func (s *OpenClawService) GetMission(ctx context.Context, tenantID string, id uint64) (*model.OpenClawMission, error) {
	var m model.OpenClawMission
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// CreateMission creates a new mission.
func (s *OpenClawService) CreateMission(ctx context.Context, tenantID, creatorID, creatorName string, req *model.CreateMissionRequest) (*model.OpenClawMission, error) {
	modules := ""
	if len(req.RelatedModules) > 0 {
		data, _ := json.Marshal(req.RelatedModules)
		modules = string(data)
	}
	m := &model.OpenClawMission{
		TenantID:       tenantID,
		Title:          req.Title,
		Status:         "pending",
		InspectionType: req.InspectionType,
		Sensitivity:    req.Sensitivity,
		RelatedModules: modules,
		CreatorID:      creatorID,
		CreatorName:    creatorName,
	}
	if err := s.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

// UpdateMission updates an existing mission.
func (s *OpenClawService) UpdateMission(ctx context.Context, tenantID string, id uint64, req *model.UpdateMissionRequest) (*model.OpenClawMission, error) {
	m, err := s.GetMission(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Summary != "" {
		updates["summary"] = req.Summary
	}
	if req.Score > 0 {
		updates["score"] = req.Score
	}
	if len(updates) > 0 {
		if err := s.db.WithContext(ctx).Model(m).Updates(updates).Error; err != nil {
			return nil, err
		}
	}
	return m, nil
}

// DeleteMission soft-deletes a mission.
func (s *OpenClawService) DeleteMission(ctx context.Context, tenantID string, id uint64) error {
	now := time.Now()
	return s.db.WithContext(ctx).
		Model(&model.OpenClawMission{}).
		Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).
		Update("deleted_at", now).Error
}

// =========================================================================
// Template CRUD (DB-backed)
// =========================================================================

// ListTemplates lists templates for a tenant.
func (s *OpenClawService) ListTemplates(ctx context.Context, tenantID string) ([]model.AutomationTemplate, error) {
	var templates []model.AutomationTemplate
	if err := s.db.WithContext(ctx).
		Where("(tenant_id = ? OR is_built_in = true) AND deleted_at IS NULL", tenantID).
		Order("created_at DESC").Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

// GetTemplate fetches a single template.
func (s *OpenClawService) GetTemplate(ctx context.Context, tenantID string, id uint64) (*model.AutomationTemplate, error) {
	var t model.AutomationTemplate
	if err := s.db.WithContext(ctx).
		Where("id = ? AND (tenant_id = ? OR is_built_in = true) AND deleted_at IS NULL", id, tenantID).
		First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

// CreateTemplate creates a new template.
func (s *OpenClawService) CreateTemplate(ctx context.Context, tenantID string, req *model.CreateTemplateRequest) (*model.AutomationTemplate, error) {
	actions := ""
	if len(req.Actions) > 0 {
		data, _ := json.Marshal(req.Actions)
		actions = string(data)
	}
	t := &model.AutomationTemplate{
		TenantID:      tenantID,
		Name:          req.Name,
		Description:   req.Description,
		Trigger:       req.Trigger,
		TriggerConfig: req.TriggerConfig,
		Actions:       actions,
		Enabled:       true,
	}
	if err := s.db.WithContext(ctx).Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

// UpdateTemplate updates an existing template.
func (s *OpenClawService) UpdateTemplate(ctx context.Context, tenantID string, id uint64, req *model.UpdateTemplateRequest) (*model.AutomationTemplate, error) {
	t, err := s.GetTemplate(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Trigger != "" {
		updates["trigger"] = req.Trigger
	}
	if req.TriggerConfig != "" {
		updates["trigger_config"] = req.TriggerConfig
	}
	if len(req.Actions) > 0 {
		data, _ := json.Marshal(req.Actions)
		updates["actions"] = string(data)
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}
	if len(updates) > 0 {
		if err := s.db.WithContext(ctx).Model(t).Updates(updates).Error; err != nil {
			return nil, err
		}
	}
	return t, nil
}

// DeleteTemplate soft-deletes a template.
func (s *OpenClawService) DeleteTemplate(ctx context.Context, tenantID string, id uint64) error {
	now := time.Now()
	return s.db.WithContext(ctx).
		Model(&model.AutomationTemplate{}).
		Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).
		Update("deleted_at", now).Error
}
