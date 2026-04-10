package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

// AnnotationHandler handles annotation HTTP requests.
type AnnotationHandler struct {
	svc *service.AnnotationService
}

// NewAnnotationHandler creates a new AnnotationHandler.
func NewAnnotationHandler(svc *service.AnnotationService) *AnnotationHandler {
	return &AnnotationHandler{svc: svc}
}

func (h *AnnotationHandler) getTenantID(c *gin.Context) string {
	if tid, ok := c.Get("tenantID"); ok {
		return tid.(string)
	}
	return ""
}

func (h *AnnotationHandler) getUserID(c *gin.Context) uint {
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

// CreateAnnotation POST /annotations
func (h *AnnotationHandler) CreateAnnotation(c *gin.Context) {
	tenantID := h.getTenantID(c)
	userID := h.getUserID(c)

	var req model.CreateAnnotationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	annotation, err := h.svc.CreateAnnotation(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, annotation)
}

// ListAnnotations GET /annotations
func (h *AnnotationHandler) ListAnnotations(c *gin.Context) {
	tenantID := h.getTenantID(c)
	mediaIDStr := c.Query("media_id")

	if mediaIDStr == "" {
		response.BadRequest(c, "media_id is required")
		return
	}

	mediaID, err := strconv.ParseUint(mediaIDStr, 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid media_id")
		return
	}

	annotations, err := h.svc.ListAnnotations(c.Request.Context(), tenantID, uint(mediaID))
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, annotations)
}

// GetAnnotation GET /annotations/:id
func (h *AnnotationHandler) GetAnnotation(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid annotation id")
		return
	}

	annotation, err := h.svc.GetAnnotation(c.Request.Context(), tenantID, uint(id))
	if err != nil {
		if err.Error() == "record not found" {
			response.NotFound(c, "annotation not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, annotation)
}

// UpdateAnnotation PUT /annotations/:id
func (h *AnnotationHandler) UpdateAnnotation(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid annotation id")
		return
	}

	var req model.UpdateAnnotationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	annotation, err := h.svc.UpdateAnnotation(c.Request.Context(), tenantID, uint(id), &req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, annotation)
}

// DeleteAnnotation DELETE /annotations/:id
func (h *AnnotationHandler) DeleteAnnotation(c *gin.Context) {
	tenantID := h.getTenantID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid annotation id")
		return
	}

	if err := h.svc.DeleteAnnotation(c.Request.Context(), tenantID, uint(id)); err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetAnnotationStats GET /annotations/stats
func (h *AnnotationHandler) GetAnnotationStats(c *gin.Context) {
	tenantID := h.getTenantID(c)

	stats, err := h.svc.GetAnnotationStats(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, stats)
}

// GetUserAnnotations GET /annotations/user
func (h *AnnotationHandler) GetUserAnnotations(c *gin.Context) {
	tenantID := h.getTenantID(c)
	userID := h.getUserID(c)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	annotations, total, err := h.svc.GetAnnotationsByUser(c.Request.Context(), tenantID, userID, page, pageSize)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"items":     annotations,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}
