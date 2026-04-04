package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type ReportHandler struct {
	reportService *service.ReportService
}

func NewReportHandler(s *service.ReportService) *ReportHandler {
	return &ReportHandler{reportService: s}
}

func (h *ReportHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	reportType := c.Query("type")
	p := pagination.Parse(c)

	reports, total, err := h.reportService.List(tenantID, reportType, p)
	if err != nil {
		response.InternalError(c, "failed to list reports")
		return
	}

	pagination.PageOK(c, reports, total, p)
}

func (h *ReportHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	report, err := h.reportService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "report not found")
		return
	}

	response.Success(c, report)
}

func (h *ReportHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	report, err := h.reportService.Create(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create report")
		return
	}

	response.Created(c, report)
}

func (h *ReportHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	report, err := h.reportService.Update(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "report not found")
			return
		}
		response.InternalError(c, "failed to update report")
		return
	}

	response.Success(c, report)
}

func (h *ReportHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.reportService.Delete(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "report not found")
			return
		}
		response.InternalError(c, "failed to delete report")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

func (h *ReportHandler) Export(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	result, err := h.reportService.Export(tenantID, id)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "report not found")
			return
		}
		response.InternalError(c, "failed to export report")
		return
	}

	response.Success(c, result)
}
