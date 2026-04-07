package service

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

// AlertRuleService manages alert rule CRUD and the rule evaluation engine.
type AlertRuleService struct {
	db                  *gorm.DB
	alertService        *AlertService
	notificationService *NotificationService
}

// NewAlertRuleService creates a new AlertRuleService.
func NewAlertRuleService(db *gorm.DB, alertSvc *AlertService, notifSvc *NotificationService) *AlertRuleService {
	return &AlertRuleService{
		db:                  db,
		alertService:        alertSvc,
		notificationService: notifSvc,
	}
}

// ---------- Request DTOs ----------

// CreateAlertRuleRequest is the payload for creating a new alert rule.
type CreateAlertRuleRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Type        string `json:"type" binding:"required"`
	Conditions  string `json:"conditions" binding:"required"` // JSON string
	Actions     string `json:"actions" binding:"required"`    // JSON string
	Severity    string `json:"severity"`
	Enabled     *bool  `json:"enabled"`
	CooldownSec *int   `json:"cooldown_sec"`
}

// UpdateAlertRuleRequest is the payload for updating an existing alert rule.
type UpdateAlertRuleRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Type        *string `json:"type"`
	Conditions  *string `json:"conditions"`
	Actions     *string `json:"actions"`
	Severity    *string `json:"severity"`
	Enabled     *bool   `json:"enabled"`
	CooldownSec *int    `json:"cooldown_sec"`
}

// ToggleAlertRuleRequest is the payload for enabling/disabling a rule.
type ToggleAlertRuleRequest struct {
	Enabled bool `json:"enabled"`
}

// AlertEvent represents an incoming event to evaluate against rules.
type AlertEvent struct {
	Metric   string  `json:"metric"`
	Value    float64 `json:"value"`
	StreamID *uint   `json:"stream_id"`
	Location string  `json:"location"`
	Message  string  `json:"message"`
}

// ---------- CRUD ----------

// CreateRule creates a new alert rule.
func (s *AlertRuleService) CreateRule(tenantID string, req CreateAlertRuleRequest) (*model.AlertRule, error) {
	// Validate JSON fields
	if err := validateConditionsJSON(req.Conditions); err != nil {
		return nil, fmt.Errorf("invalid conditions: %w", err)
	}
	if err := validateActionsJSON(req.Actions); err != nil {
		return nil, fmt.Errorf("invalid actions: %w", err)
	}

	rule := &model.AlertRule{
		TenantID:    tenantID,
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Conditions:  req.Conditions,
		Actions:     req.Actions,
		Severity:    defaultString(req.Severity, "warning"),
		Enabled:     defaultBool(req.Enabled, true),
		CooldownSec: defaultInt(req.CooldownSec, 300),
	}

	if err := s.db.Create(rule).Error; err != nil {
		return nil, err
	}
	return rule, nil
}

// UpdateRule updates an existing alert rule.
func (s *AlertRuleService) UpdateRule(tenantID string, id uint, req UpdateAlertRuleRequest) (*model.AlertRule, error) {
	var rule model.AlertRule
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&rule).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Conditions != nil {
		if err := validateConditionsJSON(*req.Conditions); err != nil {
			return nil, fmt.Errorf("invalid conditions: %w", err)
		}
		updates["conditions"] = *req.Conditions
	}
	if req.Actions != nil {
		if err := validateActionsJSON(*req.Actions); err != nil {
			return nil, fmt.Errorf("invalid actions: %w", err)
		}
		updates["actions"] = *req.Actions
	}
	if req.Severity != nil {
		updates["severity"] = *req.Severity
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}
	if req.CooldownSec != nil {
		updates["cooldown_sec"] = *req.CooldownSec
	}

	if len(updates) > 0 {
		if err := s.db.Model(&rule).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&rule)
	return &rule, nil
}

// DeleteRule soft-deletes an alert rule.
func (s *AlertRuleService) DeleteRule(tenantID string, id uint) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.AlertRule{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// GetRule fetches a single alert rule by ID.
func (s *AlertRuleService) GetRule(tenantID string, id uint) (*model.AlertRule, error) {
	var rule model.AlertRule
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&rule).Error; err != nil {
		return nil, ErrNotFound
	}
	return &rule, nil
}

// ListRules returns a paginated list of alert rules with optional filters.
func (s *AlertRuleService) ListRules(tenantID string, enabled *bool, ruleType string, page, pageSize int) ([]model.AlertRule, int64, error) {
	var rules []model.AlertRule
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	if enabled != nil {
		query = query.Where("enabled = ?", *enabled)
	}
	if ruleType != "" {
		query = query.Where("type = ?", ruleType)
	}

	query.Model(&model.AlertRule{}).Count(&total)

	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&rules).Error; err != nil {
		return nil, 0, err
	}

	return rules, total, nil
}

// ToggleRule enables or disables a rule.
func (s *AlertRuleService) ToggleRule(tenantID string, id uint, enabled bool) error {
	result := s.db.Model(&model.AlertRule{}).
		Where("id = ? AND tenant_id = ?", id, tenantID).
		Update("enabled", enabled)
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// ---------- Rule Evaluation Engine ----------

// EvaluateRules evaluates an incoming event against all enabled rules for a tenant.
// For each matching rule that passes cooldown, it creates an Alert and dispatches notifications.
func (s *AlertRuleService) EvaluateRules(tenantID string, event AlertEvent) ([]*model.Alert, error) {
	var rules []model.AlertRule
	if err := s.db.Where("tenant_id = ? AND enabled = ?", tenantID, true).Find(&rules).Error; err != nil {
		return nil, fmt.Errorf("load rules: %w", err)
	}

	var alerts []*model.Alert
	now := time.Now()

	for i := range rules {
		rule := &rules[i]

		// Parse conditions
		var cond model.AlertRuleCondition
		if err := json.Unmarshal([]byte(rule.Conditions), &cond); err != nil {
			log.Printf("[alert-rule] failed to parse conditions for rule %d: %v", rule.ID, err)
			continue
		}

		// Check if event matches the rule conditions
		if !matchCondition(cond, event) {
			continue
		}

		// Check cooldown (debounce)
		if rule.LastFiredAt != nil {
			cooldownEnd := rule.LastFiredAt.Add(time.Duration(rule.CooldownSec) * time.Second)
			if now.Before(cooldownEnd) {
				continue
			}
		}

		// Create alert via the existing AlertService
		alertReq := CreateAlertRequest{
			Level:    mapSeverityToLevel(rule.Severity),
			Type:     rule.Type,
			Title:    rule.Name,
			Message:  fmt.Sprintf("[规则触发] %s - %s", rule.Name, event.Message),
			Location: event.Location,
			StreamID: event.StreamID,
		}

		alert, err := s.alertService.Create(tenantID, alertReq)
		if err != nil {
			log.Printf("[alert-rule] failed to create alert for rule %d: %v", rule.ID, err)
			continue
		}

		// Update last_fired_at
		s.db.Model(rule).Update("last_fired_at", now)

		// Execute notification actions (fire-and-forget with logging)
		go s.executeActions(rule, alert)

		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// executeActions dispatches all configured notification actions for a rule.
func (s *AlertRuleService) executeActions(rule *model.AlertRule, alert *model.Alert) {
	var actions []model.AlertRuleAction
	if err := json.Unmarshal([]byte(rule.Actions), &actions); err != nil {
		log.Printf("[alert-rule] failed to parse actions for rule %d: %v", rule.ID, err)
		return
	}

	for _, action := range actions {
		if err := s.notificationService.Dispatch(action, alert); err != nil {
			log.Printf("[alert-rule] action %s failed for rule %d: %v", action.Type, rule.ID, err)
		}
	}
}

// TestRule sends a test notification for a given rule.
func (s *AlertRuleService) TestRule(tenantID string, id uint) error {
	rule, err := s.GetRule(tenantID, id)
	if err != nil {
		return err
	}

	testAlert := &model.Alert{
		Level:    mapSeverityToLevel(rule.Severity),
		Type:     rule.Type,
		Title:    fmt.Sprintf("[测试] %s", rule.Name),
		Message:  "这是一条测试告警通知，请忽略。",
		TenantID: tenantID,
	}
	testAlert.CreatedAt = time.Now()

	var actions []model.AlertRuleAction
	if err := json.Unmarshal([]byte(rule.Actions), &actions); err != nil {
		return fmt.Errorf("invalid actions JSON: %w", err)
	}

	var errs []string
	for _, action := range actions {
		if err := s.notificationService.Dispatch(action, testAlert); err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", action.Type, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("some notifications failed: %s", strings.Join(errs, "; "))
	}
	return nil
}

// ---------- Helpers ----------

func matchCondition(cond model.AlertRuleCondition, event AlertEvent) bool {
	if cond.Metric != event.Metric {
		return false
	}

	switch cond.Operator {
	case "gt":
		return event.Value > cond.Threshold
	case "lt":
		return event.Value < cond.Threshold
	case "eq":
		return event.Value == cond.Threshold
	case "ne":
		return event.Value != cond.Threshold
	case "contains":
		// For string-based checks we compare metric name (simplified)
		return true
	default:
		return false
	}
}

func mapSeverityToLevel(severity string) string {
	switch severity {
	case "critical":
		return "CRIT"
	case "warning":
		return "WARN"
	case "info":
		return "INFO"
	default:
		return "WARN"
	}
}

func validateConditionsJSON(s string) error {
	var c model.AlertRuleCondition
	return json.Unmarshal([]byte(s), &c)
}

func validateActionsJSON(s string) error {
	var a []model.AlertRuleAction
	return json.Unmarshal([]byte(s), &a)
}

func defaultString(val, fallback string) string {
	if val == "" {
		return fallback
	}
	return val
}

func defaultBool(val *bool, fallback bool) bool {
	if val == nil {
		return fallback
	}
	return *val
}

func defaultInt(val *int, fallback int) int {
	if val == nil {
		return fallback
	}
	return *val
}
