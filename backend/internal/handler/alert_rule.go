package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

// AlertRuleHandler handles HTTP requests for alert rule management.
type AlertRuleHandler struct {
	alertRuleService *service.AlertRuleService
}

// NewAlertRuleHandler creates a new AlertRuleHandler.
func NewAlertRuleHandler(s *service.AlertRuleService) *AlertRuleHandler {
	return &AlertRuleHandler{alertRuleService: s}
}

// RegisterRoutes registers all alert-rule routes on the given protected router group.
func (h *AlertRuleHandler) RegisterRoutes(protected *gin.RouterGroup) {
	alertRules := protected.Group("/alert-rules")
	{
		alertRules.POST("", h.Create)
		alertRules.GET("", h.List)
		alertRules.GET("/:id", h.Get)
		alertRules.PUT("/:id", h.Update)
		alertRules.DELETE("/:id", h.Delete)
		alertRules.PUT("/:id/toggle", h.Toggle)
		alertRules.POST("/test/:id", h.Test)
	}
}

// Create handles POST /alert-rules
func (h *AlertRuleHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateAlertRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	rule, err := h.alertRuleService.CreateRule(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create alert rule: "+err.Error())
		return
	}

	response.Created(c, rule)
}

// List handles GET /alert-rules
func (h *AlertRuleHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	ruleType := c.Query("type")

	var enabled *bool
	if v := c.Query("enabled"); v != "" {
		b := v == "true" || v == "1"
		enabled = &b
	}

	rules, total, err := h.alertRuleService.ListRules(tenantID, enabled, ruleType, page, pageSize)
	if err != nil {
		response.InternalError(c, "failed to list alert rules")
		return
	}

	response.Success(c, gin.H{
		"items":     rules,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Get handles GET /alert-rules/:id
func (h *AlertRuleHandler) Get(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	rule, err := h.alertRuleService.GetRule(tenantID, id)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert rule not found")
			return
		}
		response.InternalError(c, "failed to get alert rule")
		return
	}

	response.Success(c, rule)
}

// Update handles PUT /alert-rules/:id
func (h *AlertRuleHandler) Update(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req service.UpdateAlertRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	rule, err := h.alertRuleService.UpdateRule(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert rule not found")
			return
		}
		response.InternalError(c, "failed to update alert rule: "+err.Error())
		return
	}

	response.Success(c, rule)
}

// Delete handles DELETE /alert-rules/:id (soft delete)
func (h *AlertRuleHandler) Delete(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.alertRuleService.DeleteRule(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert rule not found")
			return
		}
		response.InternalError(c, "failed to delete alert rule")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

// Toggle handles PUT /alert-rules/:id/toggle
func (h *AlertRuleHandler) Toggle(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req service.ToggleAlertRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.alertRuleService.ToggleRule(tenantID, id, req.Enabled); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert rule not found")
			return
		}
		response.InternalError(c, "failed to toggle alert rule")
		return
	}

	response.Success(c, gin.H{"message": "toggled", "enabled": req.Enabled})
}

// Test handles POST /alert-rules/test/:id
func (h *AlertRuleHandler) Test(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := parseUintParam(c, "id")
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.alertRuleService.TestRule(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert rule not found")
			return
		}
		response.Success(c, gin.H{"success": false, "message": err.Error()})
		return
	}

	response.Success(c, gin.H{"success": true, "message": "测试通知已发送"})
}

// parseUintParam parses a URL path parameter as uint.
func parseUintParam(c *gin.Context, name string) (uint, error) {
	v, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(v), nil
}
