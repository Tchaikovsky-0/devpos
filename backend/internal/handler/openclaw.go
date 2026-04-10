package handler

import (
	"net/http"
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

func (h *OpenClawHandler) getUserID(c *gin.Context) string {
	if uid, ok := c.Get("userID"); ok {
		return strconv.FormatUint(uint64(uid.(uint)), 10)
	}
	return ""
}

func (h *OpenClawHandler) getUsername(c *gin.Context) string {
	if name, ok := c.Get("username"); ok {
		return name.(string)
	}
	return ""
}

// ============================================================================
// Missions
// ============================================================================

// ListMissions GET /openclaw/missions
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

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    missions,
		"total":   total,
		"page":    page,
		"page_size": pageSize,
	})
}

// GetMissionStatistics GET /openclaw/missions/statistics
func (h *OpenClawHandler) GetMissionStatistics(c *gin.Context) {
	tenantID := h.getTenantID(c)

	stats, err := h.svc.GetMissionStatistics(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, stats)
}

// GetMission GET /openclaw/missions/:id
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

// CreateMission POST /openclaw/missions
func (h *OpenClawHandler) CreateMission(c *gin.Context) {
	tenantID := h.getTenantID(c)
	creatorID := h.getUserID(c)
	creatorName := h.getUsername(c)

	var req model.CreateMissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	mission, err := h.svc.CreateMission(c.Request.Context(), tenantID, creatorID, creatorName, &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"code":    201,
		"message": "mission created",
		"data":    mission,
	})
}

// UpdateMission PUT /openclaw/missions/:id
func (h *OpenClawHandler) UpdateMission(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid mission id")
		return
	}

	var req model.UpdateMissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	mission, err := h.svc.UpdateMission(c.Request.Context(), tenantID, id, &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, mission)
}

// DeleteMission DELETE /openclaw/missions/:id
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

// ============================================================================
// Automation Templates
// ============================================================================

// ListTemplates GET /openclaw/templates
func (h *OpenClawHandler) ListTemplates(c *gin.Context) {
	tenantID := h.getTenantID(c)

	templates, err := h.svc.ListTemplates(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, templates)
}

// GetTemplate GET /openclaw/templates/:id
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

// CreateTemplate POST /openclaw/templates
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

	c.JSON(http.StatusCreated, gin.H{
		"code":    201,
		"message": "template created",
		"data":    tmpl,
	})
}

// UpdateTemplate PUT /openclaw/templates/:id
func (h *OpenClawHandler) UpdateTemplate(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid template id")
		return
	}

	var req model.UpdateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	tmpl, err := h.svc.UpdateTemplate(c.Request.Context(), tenantID, id, &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, tmpl)
}

// DeleteTemplate DELETE /openclaw/templates/:id
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

// ============================================================================
// Health
// ============================================================================

// Health GET /openclaw/health
func (h *OpenClawHandler) Health(c *gin.Context) {
	available := h.svc.CheckHealth()
	status := "ok"
	if !available {
		status = "unavailable"
	}
	response.Success(c, gin.H{
		"status": status,
	})
}

// ============================================================================
// Chat
// ============================================================================

// Chat POST /openclaw/chat
func (h *OpenClawHandler) Chat(c *gin.Context) {
	tenantID := h.getTenantID(c)
	var req service.OpenClawChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if req.Context == nil {
		req.Context = make(map[string]interface{})
	}
	req.Context["tenant_id"] = tenantID

	result, err := h.svc.HandleChat(c.Request.Context(), &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// ============================================================================
// Analyze
// ============================================================================

// AnalyzeAlerts GET /openclaw/analyze/alerts
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

// ============================================================================
// Devices
// ============================================================================

// GetDevicesStatus GET /openclaw/devices/status
func (h *OpenClawHandler) GetDevicesStatus(c *gin.Context) {
	tenantID := h.getTenantID(c)

	result, err := h.svc.GetDevicesStatus(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// ============================================================================
// Detection
// ============================================================================

// GetDetectionOverview GET /openclaw/detection/overview
func (h *OpenClawHandler) GetDetectionOverview(c *gin.Context) {
	tenantID := h.getTenantID(c)

	result, err := h.svc.GetDetectionOverview(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}
