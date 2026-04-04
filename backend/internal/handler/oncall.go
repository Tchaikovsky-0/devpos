package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type OnCallHandler struct {
	oncallService *service.OnCallService
}

func NewOnCallHandler(s *service.OnCallService) *OnCallHandler {
	return &OnCallHandler{oncallService: s}
}

func (h *OnCallHandler) GetCurrentSchedule(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	schedule, err := h.oncallService.GetCurrentSchedule(tenantID)
	if err != nil {
		response.Success(c, nil)
		return
	}

	response.Success(c, schedule)
}

func (h *OnCallHandler) GetSchedules(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	schedules, err := h.oncallService.GetSchedules(
		tenantID,
		c.Query("start_date"),
		c.Query("end_date"),
		c.Query("user_id"),
	)
	if err != nil {
		response.InternalError(c, "failed to get schedules")
		return
	}

	response.Success(c, schedules)
}

func (h *OnCallHandler) CreateSchedule(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	schedule, err := h.oncallService.CreateSchedule(tenantID, req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, schedule)
}

func (h *OnCallHandler) GetAlertsBySchedule(c *gin.Context) {
	scheduleID := c.Param("schedule_id")

	alerts, err := h.oncallService.GetAlertsBySchedule(scheduleID)
	if err != nil {
		response.NotFound(c, "schedule not found")
		return
	}

	response.Success(c, alerts)
}

func (h *OnCallHandler) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("alert_id")
	tenantID := c.GetString("tenant_id")

	if err := h.oncallService.AcknowledgeAlert(tenantID, alertID); err != nil {
		response.NotFound(c, "alert not found")
		return
	}

	response.Success(c, gin.H{"message": "alert acknowledged"})
}

func (h *OnCallHandler) GetReports(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	reports, err := h.oncallService.GetReports(tenantID, c.Query("schedule_id"))
	if err != nil {
		response.InternalError(c, "failed to get reports")
		return
	}

	response.Success(c, reports)
}

func (h *OnCallHandler) CreateReport(c *gin.Context) {
	scheduleID := c.Param("schedule_id")
	tenantID := c.GetString("tenant_id")

	var req service.OnCallCreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	report, err := h.oncallService.CreateReport(tenantID, scheduleID, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "schedule not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, report)
}

func (h *OnCallHandler) GetAnalysts(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	analysts, err := h.oncallService.GetAnalysts(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get analysts")
		return
	}

	response.Success(c, analysts)
}

func (h *OnCallHandler) RequestAnalysis(c *gin.Context) {
	var req struct {
		AnalystID string `json:"analyst_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"analysis_id": fmt.Sprintf("analysis_%d", 0),
		"status":      "pending",
	})
}
