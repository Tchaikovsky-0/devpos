#!/usr/bin/env python3
"""Deploy OpenClaw backend files to server."""

service_code = r'''package service

import (
	"context"
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

type OpenClawService struct {
	db *gorm.DB
}

func NewOpenClawService(db *gorm.DB) *OpenClawService {
	return &OpenClawService{db: db}
}

func (s *OpenClawService) ListMissions(ctx context.Context, tenantID string, page, pageSize int) ([]model.OpenClawMission, int64, error) {
	var missions []model.OpenClawMission
	var total int64
	q := s.db.WithContext(ctx).Where("tenant_id = ? AND deleted_at IS NULL", tenantID)
	q.Model(&model.OpenClawMission{}).Count(&total)
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&missions).Error; err != nil {
		return nil, 0, err
	}
	return missions, total, nil
}

func (s *OpenClawService) GetMissionStatistics(ctx context.Context, tenantID string) (*model.MissionStatistics, error) {
	stats := &model.MissionStatistics{}
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Count(&stats.Total)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = ?", tenantID, "pending").Count(&stats.Pending)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = ?", tenantID, "running").Count(&stats.Running)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = ?", tenantID, "completed").Count(&stats.Completed)
	s.db.WithContext(ctx).Model(&model.OpenClawMission{}).Where("tenant_id = ? AND deleted_at IS NULL AND status = ?", tenantID, "failed").Count(&stats.Failed)
	return stats, nil
}

func (s *OpenClawService) GetMission(ctx context.Context, tenantID string, id uint64) (*model.OpenClawMission, error) {
	var m model.OpenClawMission
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *OpenClawService) CreateMission(ctx context.Context, tenantID string, createdBy uint, req *model.CreateMissionRequest) (*model.OpenClawMission, error) {
	m := &model.OpenClawMission{
		TenantID: tenantID, Title: req.Title, Type: req.Type,
		Priority: req.Priority, Status: "pending", CreatedBy: createdBy,
	}
	if req.Description != "" {
		m.Description = req.Description
	}
	if req.AgentPrompt != "" {
		m.AgentPrompt = req.AgentPrompt
	}
	if req.CronInterval != "" {
		m.CronInterval = req.CronInterval
	}
	if len(req.StreamIDs) > 0 {
		data, _ := json.Marshal(req.StreamIDs)
		m.StreamIDs = string(data)
	}
	if req.ScheduledAt != "" {
		if t, err := time.Parse(time.RFC3339, req.ScheduledAt); err == nil {
			m.ScheduledAt = &t
		}
	}
	if err := s.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (s *OpenClawService) UpdateMission(ctx context.Context, tenantID string, id uint64, req map[string]interface{}) (*model.OpenClawMission, error) {
	m, err := s.GetMission(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Model(m).Updates(req).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (s *OpenClawService) DeleteMission(ctx context.Context, tenantID string, id uint64) error {
	return s.db.WithContext(ctx).Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).
		Model(&model.OpenClawMission{}).Update("deleted_at", time.Now()).Error
}

func (s *OpenClawService) ListTemplates(ctx context.Context, tenantID string) ([]model.AutomationTemplate, error) {
	var templates []model.AutomationTemplate
	if err := s.db.WithContext(ctx).Where("(tenant_id = ? OR is_active = true) AND deleted_at IS NULL", tenantID).
		Order("created_at DESC").Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

func (s *OpenClawService) GetTemplate(ctx context.Context, tenantID string, id uint64) (*model.AutomationTemplate, error) {
	var t model.AutomationTemplate
	if err := s.db.WithContext(ctx).Where("id = ? AND (tenant_id = ? OR is_active = true) AND deleted_at IS NULL", id, tenantID).
		First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *OpenClawService) CreateTemplate(ctx context.Context, tenantID string, req *model.CreateTemplateRequest) (*model.AutomationTemplate, error) {
	t := &model.AutomationTemplate{
		TenantID: tenantID, Name: req.Name, Description: req.Description,
		TriggerType: req.TriggerType, TriggerConfig: req.TriggerConfig,
		Actions: req.Actions, RelatedModules: req.RelatedModules, IsActive: true,
	}
	if err := s.db.WithContext(ctx).Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (s *OpenClawService) UpdateTemplate(ctx context.Context, tenantID string, id uint64, req map[string]interface{}) (*model.AutomationTemplate, error) {
	t, err := s.GetTemplate(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Model(t).Updates(req).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (s *OpenClawService) DeleteTemplate(ctx context.Context, tenantID string, id uint64) error {
	return s.db.WithContext(ctx).Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).
		Model(&model.AutomationTemplate{}).Update("deleted_at", time.Now()).Error
}

func (s *OpenClawService) AnalyzeAlerts(ctx context.Context, tenantID string, days int) (*model.AlertAnalysisResult, error) {
	since := time.Now().AddDate(0, 0, -days)
	var total int64
	s.db.WithContext(ctx).Model(&model.Alert{}).Where("tenant_id = ? AND deleted_at IS NULL AND created_at >= ?", tenantID, since).Count(&total)
	var byLevel []model.LevelCount
	s.db.WithContext(ctx).Table("alerts").Select("level, COUNT(*) as count").Where("tenant_id = ? AND deleted_at IS NULL AND created_at >= ?", tenantID, since).Group("level").Find(&byLevel)
	var byStatus []model.StatusCount
	s.db.WithContext(ctx).Table("alerts").Select("status, COUNT(*) as count").Where("tenant_id = ? AND deleted_at IS NULL AND created_at >= ?", tenantID, since).Group("status").Find(&byStatus)
	var byLocation []model.LocationCount
	s.db.WithContext(ctx).Table("alerts").Select("location, COUNT(*) as count").Where("tenant_id = ? AND deleted_at IS NULL AND created_at >= ? AND location IS NOT NULL AND location != ''", tenantID, since).Group("location").Order("count DESC").Find(&byLocation)
	return &model.AlertAnalysisResult{Total: total, ByLevel: byLevel, ByStatus: byStatus, HighRiskLocations: byLocation}, nil
}

func (s *OpenClawService) GetDevicesStatus(ctx context.Context, tenantID string) (*model.DevicesStatusResult, error) {
	var streams []model.Stream
	s.db.WithContext(ctx).Where("tenant_id = ? AND deleted_at IS NULL", tenantID).Find(&streams)
	total := int64(len(streams))
	var online, offline, warning int64
	for _, st := range streams {
		switch st.Status {
		case "online":
			online++
		case "offline":
			offline++
		default:
			warning++
		}
	}
	return &model.DevicesStatusResult{StreamStats: &model.StreamStatistics{Total: total, Online: online, Offline: offline, Warning: warning}}, nil
}

func (s *OpenClawService) GetDetectionOverview(ctx context.Context, tenantID string) (*model.DetectionOverviewResult, error) {
	today := time.Now().Truncate(24 * time.Hour)
	var total int64
	s.db.WithContext(ctx).Model(&model.DefectCase{}).Where("tenant_id = ? AND deleted_at IS NULL AND created_at >= ?", tenantID, today).Count(&total)
	var bySeverity []model.SeverityCount
	s.db.WithContext(ctx).Table("defect_cases").Select("severity, COUNT(*) as count").Where("tenant_id = ? AND deleted_at IS NULL AND created_at >= ? AND severity IS NOT NULL AND severity != ''", tenantID, today).Group("severity").Find(&bySeverity)
	return &model.DetectionOverviewResult{Date: today.Format("2006-01-02"), TotalDetections: total, BySeverity: bySeverity}, nil
}
'''

handler_code = r'''package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type OpenClawHandler struct {
	svc *service.OpenClawService
}

func NewOpenClawHandler(svc *service.OpenClawService) *OpenClawHandler {
	return &OpenClawHandler{svc: svc}
}

func (h *OpenClawHandler) getTenantID(c *gin.Context) string {
	if tid, ok := c.Get("tenantID"); ok {
		return tid.(string)
	}
	return ""
}

func (h *OpenClawHandler) getUserID(c *gin.Context) uint {
	if uid, ok := c.Get("userID"); ok {
		switch v := uid.(type) {
		case uint:
			return v
		case uint64:
			return uint(v)
		case int:
			return uint(v)
		default:
			return 0
		}
	}
	return 0
}

func (h *OpenClawHandler) ListMissions(c *gin.Context) {
	tenantID := h.getTenantID(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	missions, total, err := h.svc.ListMissions(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"items": missions, "total": total, "page": page, "page_size": pageSize})
}

func (h *OpenClawHandler) GetMissionStatistics(c *gin.Context) {
	tenantID := h.getTenantID(c)
	stats, err := h.svc.GetMissionStatistics(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, stats)
}

func (h *OpenClawHandler) GetMission(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid mission id")
		return
	}
	mission, err := h.svc.GetMission(c.Request.Context(), tenantID, id)
	if err != nil {
		response.NotFound(c, "mission not found")
		return
	}
	response.Success(c, mission)
}

func (h *OpenClawHandler) CreateMission(c *gin.Context) {
	tenantID := h.getTenantID(c)
	createdBy := h.getUserID(c)
	var req model.CreateMissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	mission, err := h.svc.CreateMission(c.Request.Context(), tenantID, createdBy, &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, mission)
}

func (h *OpenClawHandler) UpdateMission(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid mission id")
		return
	}
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	mission, err := h.svc.UpdateMission(c.Request.Context(), tenantID, id, req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, mission)
}

func (h *OpenClawHandler) DeleteMission(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid mission id")
		return
	}
	if err := h.svc.DeleteMission(c.Request.Context(), tenantID, id); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

func (h *OpenClawHandler) ListTemplates(c *gin.Context) {
	tenantID := h.getTenantID(c)
	templates, err := h.svc.ListTemplates(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, templates)
}

func (h *OpenClawHandler) GetTemplate(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid template id")
		return
	}
	tmpl, err := h.svc.GetTemplate(c.Request.Context(), tenantID, id)
	if err != nil {
		response.NotFound(c, "template not found")
		return
	}
	response.Success(c, tmpl)
}

func (h *OpenClawHandler) CreateTemplate(c *gin.Context) {
	tenantID := h.getTenantID(c)
	var req model.CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	tmpl, err := h.svc.CreateTemplate(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, tmpl)
}

func (h *OpenClawHandler) UpdateTemplate(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid template id")
		return
	}
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	tmpl, err := h.svc.UpdateTemplate(c.Request.Context(), tenantID, id, req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, tmpl)
}

func (h *OpenClawHandler) DeleteTemplate(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid template id")
		return
	}
	if err := h.svc.DeleteTemplate(c.Request.Context(), tenantID, id); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

func (h *OpenClawHandler) Chat(c *gin.Context) {
	tenantID := h.getTenantID(c)
	var req struct {
		SessionID string                 `json:"session_id"`
		Message   string                 `json:"message"`
		Context   map[string]interface{} `json:"context,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.Context == nil {
		req.Context = make(map[string]interface{})
	}
	req.Context["tenant_id"] = tenantID
	response.Success(c, gin.H{
		"reply":   "AI chat is currently under development.",
		"sources": []string{},
		"finish":  true,
	})
}

func (h *OpenClawHandler) AnalyzeAlerts(c *gin.Context) {
	tenantID := h.getTenantID(c)
	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))
	result, err := h.svc.AnalyzeAlerts(c.Request.Context(), tenantID, days)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, result)
}

func (h *OpenClawHandler) GetDevicesStatus(c *gin.Context) {
	tenantID := h.getTenantID(c)
	result, err := h.svc.GetDevicesStatus(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, result)
}

func (h *OpenClawHandler) GetDetectionOverview(c *gin.Context) {
	tenantID := h.getTenantID(c)
	result, err := h.svc.GetDetectionOverview(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, result)
}

func (h *OpenClawHandler) Health(c *gin.Context) {
	response.Success(c, gin.H{
		"status":  "ok",
		"version": "1.0.0",
	})
}
'''

# Write files
with open("/opt/xunjianbao/backend/internal/service/openclaw.go", "w") as f:
    f.write(service_code)
print("Service file written")

with open("/opt/xunjianbao/backend/internal/handler/openclaw.go", "w") as f:
    f.write(handler_code)
print("Handler file written")
