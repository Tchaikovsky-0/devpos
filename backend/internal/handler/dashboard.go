package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type DashboardHandler struct {
	dashboardService *service.DashboardService
}

func NewDashboardHandler(s *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: s}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	stats, err := h.dashboardService.GetStats(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get stats")
		return
	}

	response.Success(c, stats)
}

func (h *DashboardHandler) GetAlertTrends(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))

	trends, err := h.dashboardService.GetAlertTrends(tenantID, days)
	if err != nil {
		response.InternalError(c, "failed to get alert trends")
		return
	}

	response.Success(c, trends)
}

func (h *DashboardHandler) GetDeviceTrends(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	trends, err := h.dashboardService.GetDeviceTrends(tenantID, 7)
	if err != nil {
		response.InternalError(c, "failed to get device trends")
		return
	}

	response.Success(c, trends)
}

func (h *DashboardHandler) GetTopAlerts(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	topAlerts, err := h.dashboardService.GetTopAlerts(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get top alerts")
		return
	}

	response.Success(c, topAlerts)
}

func (h *DashboardHandler) GetStorageInfo(c *gin.Context) {
	response.Success(c, h.dashboardService.GetStorageInfo())
}

func (h *DashboardHandler) GetRecentActivities(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	activities, err := h.dashboardService.GetRecentActivities(tenantID, 10)
	if err != nil {
		response.InternalError(c, "failed to get recent activities")
		return
	}

	response.Success(c, activities)
}
