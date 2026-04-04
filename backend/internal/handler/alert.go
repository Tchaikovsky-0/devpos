package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type AlertHandler struct {
	alertService *service.AlertService
}

func NewAlertHandler(s *service.AlertService) *AlertHandler {
	return &AlertHandler{alertService: s}
}

func (h *AlertHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	alerts, total, err := h.alertService.List(
		tenantID,
		c.Query("level"),
		c.Query("status"),
		c.Query("keyword"),
		p,
	)
	if err != nil {
		response.InternalError(c, "failed to list alerts")
		return
	}

	pagination.PageOK(c, alerts, total, p)
}

func (h *AlertHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	alert, err := h.alertService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "alert not found")
		return
	}

	response.Success(c, alert)
}

func (h *AlertHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	alert, err := h.alertService.Create(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create alert")
		return
	}

	response.Created(c, alert)
}

func (h *AlertHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	alert, err := h.alertService.Update(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert not found")
			return
		}
		response.InternalError(c, "failed to update alert")
		return
	}

	response.Success(c, alert)
}

func (h *AlertHandler) Statistics(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	stats, err := h.alertService.Statistics(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get statistics")
		return
	}

	response.Success(c, stats)
}

func (h *AlertHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.alertService.Delete(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "alert not found")
			return
		}
		response.InternalError(c, "failed to delete alert")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}
