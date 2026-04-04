package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type DefectCaseHandler struct {
	caseService *service.DefectCaseService
}

func NewDefectCaseHandler(s *service.DefectCaseService) *DefectCaseHandler {
	return &DefectCaseHandler{caseService: s}
}

// --- List ---

func (h *DefectCaseHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	params := service.DefectCaseListParams{
		Family:       c.Query("family"),
		DefectType:   c.Query("defect_type"),
		Severity:     c.Query("severity"),
		Status:       c.Query("status"),
		ReportStatus: c.Query("report_status"),
		Keyword:      c.Query("keyword"),
		StreamID:     c.Query("stream_id"),
		StartDate:    c.Query("start_date"),
		EndDate:      c.Query("end_date"),
	}

	cases, total, err := h.caseService.List(tenantID, params, p)
	if err != nil {
		response.InternalError(c, "failed to list defect cases")
		return
	}

	pagination.PageOK(c, cases, total, p)
}

// --- GetByID ---

func (h *DefectCaseHandler) GetByID(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	detail, err := h.caseService.GetByID(tenantID, uint(id))
	if err != nil {
		response.NotFound(c, "defect case not found")
		return
	}

	response.Success(c, detail)
}

// --- Create ---

func (h *DefectCaseHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	var req service.CreateDefectCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	defectCase, err := h.caseService.Create(tenantID, userID, req)
	if err != nil {
		response.InternalError(c, "failed to create defect case")
		return
	}

	response.Created(c, defectCase)
}

// --- Create from Detection ---

func (h *DefectCaseHandler) CreateFromDetection(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")
	detectionID := c.Param("detection_id")

	if detectionID == "" {
		response.BadRequest(c, "detection_id is required")
		return
	}

	defectCase, err := h.caseService.CreateCandidateFromDetection(tenantID, userID, detectionID)
	if err != nil {
		response.InternalError(c, "failed to create candidate case from detection")
		return
	}

	response.Created(c, defectCase)
}

// --- Update ---

func (h *DefectCaseHandler) Update(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req service.UpdateDefectCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	defectCase, err := h.caseService.Update(tenantID, uint(id), req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "defect case not found")
			return
		}
		response.InternalError(c, "failed to update defect case")
		return
	}

	response.Success(c, defectCase)
}

// --- Delete ---

func (h *DefectCaseHandler) Delete(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.caseService.Delete(tenantID, uint(id)); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "defect case not found")
			return
		}
		response.InternalError(c, "failed to delete defect case")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

// --- Merge Cases ---

func (h *DefectCaseHandler) MergeCases(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.MergeCasesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	detail, err := h.caseService.MergeCases(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to merge cases: "+err.Error())
		return
	}

	response.Success(c, detail)
}

// --- Split Case ---

func (h *DefectCaseHandler) SplitCase(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req service.SplitCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	newCase, err := h.caseService.SplitCase(tenantID, uint(id), userID, req)
	if err != nil {
		response.InternalError(c, "failed to split case")
		return
	}

	response.Created(c, newCase)
}

// --- Set Representative ---

func (h *DefectCaseHandler) SetRepresentative(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req service.SetRepresentativeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	defectCase, err := h.caseService.SetRepresentative(tenantID, uint(id), req)
	if err != nil {
		response.InternalError(c, "failed to set representative")
		return
	}

	response.Success(c, defectCase)
}

// --- Add Evidence ---

func (h *DefectCaseHandler) AddEvidence(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req service.AddEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	evidence := model.DefectEvidence{
		Source:       req.Source,
		DetectionID:  req.DetectionID,
		MediaID:      req.MediaID,
		Family:       model.DefectFamily(req.Family),
		DefectType:   model.DefectType(req.DefectType),
		Confidence:   req.Confidence,
		BBox:         req.BBox,
		Mask:         req.Mask,
		Phash:        req.Phash,
		DHash:        req.DHash,
		EmbeddingRef: req.EmbeddingRef,
		Location:     req.Location,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		FileURL:      req.FileURL,
		ThumbnailURL: req.ThumbnailURL,
		MimeType:     req.MimeType,
	}

	if req.Timestamp != "" {
		if t, err := time.Parse(time.RFC3339, req.Timestamp); err == nil {
			evidence.Timestamp = t
		}
	}

	result, err := h.caseService.AddEvidence(tenantID, uint(id), evidence)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "defect case not found")
			return
		}
		response.InternalError(c, "failed to add evidence")
		return
	}

	response.Created(c, result)
}

// --- Statistics ---

func (h *DefectCaseHandler) Statistics(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	stats, err := h.caseService.Statistics(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get statistics")
		return
	}

	response.Success(c, stats)
}

// =============================================================================
// Report Draft Handlers
// =============================================================================

// --- Create Report Draft ---

func (h *DefectCaseHandler) CreateReportDraft(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	caseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid case id")
		return
	}

	var req service.CreateReportDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	draft, err := h.caseService.CreateReportDraft(tenantID, uint(caseID), req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "defect case not found")
			return
		}
		response.InternalError(c, "failed to create report draft")
		return
	}

	response.Created(c, draft)
}

// --- Get Report Draft ---

func (h *DefectCaseHandler) GetReportDraft(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	draftID, err := strconv.ParseUint(c.Param("draft_id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid draft id")
		return
	}

	draft, err := h.caseService.GetReportDraft(tenantID, uint(draftID))
	if err != nil {
		response.NotFound(c, "report draft not found")
		return
	}

	response.Success(c, draft)
}

// --- Update Report Draft ---

func (h *DefectCaseHandler) UpdateReportDraft(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	draftID, err := strconv.ParseUint(c.Param("draft_id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid draft id")
		return
	}

	var req service.UpdateReportDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	draft, err := h.caseService.UpdateReportDraft(tenantID, uint(draftID), req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "report draft not found")
			return
		}
		response.InternalError(c, "failed to update report draft")
		return
	}

	response.Success(c, draft)
}

// --- Approve Report Draft ---

func (h *DefectCaseHandler) ApproveReportDraft(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	draftID, err := strconv.ParseUint(c.Param("draft_id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid draft id")
		return
	}

	var req service.ApproveReportDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 空请求体也允许，使用默认格式
		req = service.ApproveReportDraftRequest{ExportFormat: "pdf"}
	}

	draft, err := h.caseService.ApproveReportDraft(tenantID, uint(draftID), userID, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "report draft not found")
			return
		}
		response.InternalError(c, "failed to approve report draft")
		return
	}

	response.Success(c, draft)
}
