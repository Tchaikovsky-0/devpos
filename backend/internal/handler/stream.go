package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type StreamHandler struct {
	streamService *service.StreamService
}

func NewStreamHandler(s *service.StreamService) *StreamHandler {
	return &StreamHandler{streamService: s}
}

func (h *StreamHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	streams, total, err := h.streamService.List(tenantID, p)
	if err != nil {
		response.InternalError(c, "failed to list streams")
		return
	}

	pagination.PageOK(c, streams, total, p)
}

func (h *StreamHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	stream, err := h.streamService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "stream not found")
		return
	}

	response.Success(c, stream)
}

func (h *StreamHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	stream, err := h.streamService.Create(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create stream")
		return
	}

	response.Created(c, stream)
}

func (h *StreamHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	stream, err := h.streamService.Update(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "stream not found")
			return
		}
		response.InternalError(c, "failed to update stream")
		return
	}

	response.Success(c, stream)
}

func (h *StreamHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.streamService.Delete(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "stream not found")
			return
		}
		response.InternalError(c, "failed to delete stream")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

func (h *StreamHandler) Statistics(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	stats, err := h.streamService.Statistics(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get statistics")
		return
	}

	response.Success(c, stats)
}
