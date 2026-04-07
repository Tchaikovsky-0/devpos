package handler

import (
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

const maxBatchSize = 100

type MediaHandler struct {
	mediaService *service.MediaService
}

func NewMediaHandler(s *service.MediaService) *MediaHandler {
	return &MediaHandler{mediaService: s}
}

// ---------------------------------------------------------------------------
// List / Get
// ---------------------------------------------------------------------------

// List returns paginated media files.
func (h *MediaHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	var folderID *uint
	if fid := c.Query("folder_id"); fid != "" {
		if v, err := service.ParseUint(fid); err == nil {
			folderID = &v
		}
	}

	var starred *bool
	if s := c.Query("starred"); s != "" {
		v := s == "true" || s == "1"
		starred = &v
	}

	files, total, err := h.mediaService.ListMediaFiles(
		tenantID, c.Query("type"), folderID, c.Query("search"), starred, p,
	)
	if err != nil {
		response.InternalError(c, "failed to list media files")
		return
	}

	pagination.PageOK(c, files, total, p)
}

// ListTrash returns paginated trashed files.
func (h *MediaHandler) ListTrash(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	files, total, err := h.mediaService.ListTrash(tenantID, p)
	if err != nil {
		response.InternalError(c, "failed to list trash")
		return
	}

	pagination.PageOK(c, files, total, p)
}

// GetByID returns a single media file's info.
func (h *MediaHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	file, err := h.mediaService.GetMediaByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "media file not found")
		return
	}

	response.Success(c, file)
}

// ---------------------------------------------------------------------------
// Upload (Hardened)
// ---------------------------------------------------------------------------

// Upload handles single or multi-file upload with validation.
func (h *MediaHandler) Upload(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	form, err := c.MultipartForm()
	if err != nil {
		response.BadRequest(c, "invalid multipart form")
		return
	}

	// Accept both "file" and "files" field names
	files := form.File["file"]
	if len(files) == 0 {
		files = form.File["files"]
	}
	if len(files) == 0 {
		response.BadRequest(c, "no files provided")
		return
	}

	if len(files) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	description := c.PostForm("description")
	var folderID *uint
	if fid := c.PostForm("folder_id"); fid != "" {
		if v, err := service.ParseUint(fid); err == nil {
			folderID = &v
		}
	}

	var uploaded []interface{}
	for _, file := range files {
		// Validate file size
		if err := service.ValidateFileSize(file.Size); err != nil {
			response.BadRequest(c, "file size exceeds maximum limit: "+file.Filename)
			return
		}

		// Validate file type via magic bytes
		if _, err := service.ValidateFileType(file); err != nil {
			response.BadRequest(c, "unsupported file type: "+file.Header.Get("Content-Type"))
			return
		}

		media, err := h.mediaService.UploadFile(tenantID, userID, file, folderID, description)
		if err != nil {
			switch err {
			case service.ErrFileTooLarge:
				response.BadRequest(c, "file size exceeds maximum limit: "+file.Filename)
			case service.ErrInvalidFileType:
				response.BadRequest(c, "unsupported file type: "+file.Header.Get("Content-Type"))
			case service.ErrQuotaExceeded:
				response.Forbidden(c, "storage quota exceeded, cannot upload "+file.Filename)
			default:
				response.InternalError(c, "failed to upload file")
			}
			return
		}
		uploaded = append(uploaded, media)
	}

	response.Created(c, uploaded)
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

// Update modifies media file metadata.
func (h *MediaHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateMediaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	media, err := h.mediaService.UpdateMedia(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "media file not found")
			return
		}
		response.InternalError(c, "failed to update media file")
		return
	}

	response.Success(c, media)
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

// Delete permanently removes a media file.
func (h *MediaHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.mediaService.DeleteFile(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "media file not found")
			return
		}
		response.InternalError(c, "failed to delete media file")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

// ---------------------------------------------------------------------------
// Download (Hardened with Range support)
// ---------------------------------------------------------------------------

// Download serves a media file with proper headers and Range support.
func (h *MediaHandler) Download(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	filePath, originalName, mimeType, err := h.mediaService.GetFilePath(tenantID, id)
	if err != nil {
		response.NotFound(c, "media file not found")
		return
	}

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			response.NotFound(c, "file not found on disk")
			return
		}
		response.InternalError(c, "failed to access file")
		return
	}

	// Set content type
	if mimeType == "" {
		mimeType = mime.TypeByExtension(filepath.Ext(originalName))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
	}

	c.Header("Content-Type", mimeType)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, sanitizeHeaderValue(originalName)))
	c.Header("Accept-Ranges", "bytes")

	// Use http.ServeContent for Range request support
	f, err := os.Open(filePath)
	if err != nil {
		response.InternalError(c, "failed to open file")
		return
	}
	defer f.Close()

	http.ServeContent(c.Writer, c.Request, originalName, fileInfo.ModTime(), f)
}

// ServeFile serves a file by its storage path (for inline viewing).
func (h *MediaHandler) ServeFile(c *gin.Context) {
	filePath := c.Param("filepath")

	// Security: prevent path traversal
	if strings.Contains(filePath, "..") {
		response.Forbidden(c, "invalid file path")
		return
	}

	storagePath := h.mediaService.GetStoragePath()
	fullPath := filepath.Join(storagePath, "media", filePath)

	// Verify the resolved path is still under the storage directory
	absStorage, _ := filepath.Abs(filepath.Join(storagePath, "media"))
	absFile, _ := filepath.Abs(fullPath)
	if !strings.HasPrefix(absFile, absStorage) {
		response.Forbidden(c, "invalid file path")
		return
	}

	fileInfo, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			response.NotFound(c, "file not found")
			return
		}
		response.InternalError(c, "failed to access file")
		return
	}

	// Serve with Range support
	f, err := os.Open(fullPath)
	if err != nil {
		response.InternalError(c, "failed to open file")
		return
	}
	defer f.Close()

	// Detect content type
	ct := mime.TypeByExtension(filepath.Ext(fullPath))
	if ct == "" {
		ct = "application/octet-stream"
	}
	c.Header("Content-Type", ct)
	c.Header("Accept-Ranges", "bytes")

	http.ServeContent(c.Writer, c.Request, filepath.Base(fullPath), fileInfo.ModTime(), f)
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

// ListFolders returns folders for a given parent.
func (h *MediaHandler) ListFolders(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	// If all=true, return every folder (needed for breadcrumb navigation)
	if c.Query("all") == "true" || c.Query("all") == "1" {
		folders, err := h.mediaService.ListAllFolders(tenantID)
		if err != nil {
			response.InternalError(c, "failed to list folders")
			return
		}
		response.Success(c, folders)
		return
	}

	var parentID *uint
	if pid := c.Query("parent_id"); pid != "" {
		if v, err := service.ParseUint(pid); err == nil {
			parentID = &v
		}
	}

	folders, err := h.mediaService.ListFolders(tenantID, parentID)
	if err != nil {
		response.InternalError(c, "failed to list folders")
		return
	}

	response.Success(c, folders)
}

// CreateFolder creates a new media folder.
func (h *MediaHandler) CreateFolder(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	var req service.CreateMediaFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	folder, err := h.mediaService.CreateFolder(tenantID, userID, req)
	if err != nil {
		switch err {
		case service.ErrFolderDuplicate:
			response.BadRequest(c, err.Error())
		case service.ErrFolderDepth:
			response.BadRequest(c, err.Error())
		default:
			response.InternalError(c, "failed to create folder")
		}
		return
	}

	response.Created(c, folder)
}

// UpdateFolder updates a folder's metadata.
func (h *MediaHandler) UpdateFolder(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateMediaFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	folder, err := h.mediaService.UpdateFolder(tenantID, id, req)
	if err != nil {
		switch err {
		case service.ErrNotFound:
			response.NotFound(c, "folder not found")
		case service.ErrFolderCycle:
			response.BadRequest(c, err.Error())
		case service.ErrFolderDepth:
			response.BadRequest(c, err.Error())
		case service.ErrFolderDuplicate:
			response.BadRequest(c, err.Error())
		default:
			response.InternalError(c, "failed to update folder")
		}
		return
	}

	response.Success(c, folder)
}

// DeleteFolder deletes a folder (must be empty).
func (h *MediaHandler) DeleteFolder(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.mediaService.DeleteFolder(tenantID, id); err != nil {
		switch err {
		case service.ErrNotFound:
			response.NotFound(c, "folder not found")
		case service.ErrFolderNotEmpty:
			response.BadRequest(c, err.Error())
		default:
			response.InternalError(c, "failed to delete folder")
		}
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

// StorageInfo returns storage usage statistics.
func (h *MediaHandler) StorageInfo(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.mediaService.GetStorageInfo(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get storage info")
		return
	}

	response.Success(c, info)
}

// StorageUsage returns structured storage usage.
func (h *MediaHandler) StorageUsage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.mediaService.GetStorageUsage(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get storage usage")
		return
	}

	response.Success(c, info)
}

// ---------------------------------------------------------------------------
// Star / Trash
// ---------------------------------------------------------------------------

// ToggleStar toggles the starred status.
func (h *MediaHandler) ToggleStar(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	media, err := h.mediaService.ToggleStar(tenantID, id)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "media file not found")
			return
		}
		response.InternalError(c, "failed to toggle star")
		return
	}

	response.Success(c, media)
}

// MoveToTrash moves a file to the trash bin.
func (h *MediaHandler) MoveToTrash(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.mediaService.MoveToTrash(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "media file not found")
			return
		}
		response.InternalError(c, "failed to move to trash")
		return
	}

	response.Success(c, gin.H{"message": "moved to trash"})
}

// RestoreFromTrash restores files from the trash bin.
func (h *MediaHandler) RestoreFromTrash(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.IDs) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	if err := h.mediaService.RestoreFromTrash(tenantID, req.IDs); err != nil {
		if err == service.ErrBatchLimitExceeded {
			response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
			return
		}
		response.InternalError(c, "failed to restore from trash")
		return
	}

	response.Success(c, gin.H{"message": "restored"})
}

// PermanentDeleteTrash permanently deletes trashed files.
func (h *MediaHandler) PermanentDeleteTrash(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.IDs) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	if err := h.mediaService.PermanentDeleteTrash(tenantID, req.IDs); err != nil {
		if err == service.ErrBatchLimitExceeded {
			response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
			return
		}
		response.InternalError(c, "failed to permanently delete")
		return
	}

	response.Success(c, gin.H{"message": "permanently deleted"})
}

// CleanExpiredTrash cleans trash files older than 30 days.
func (h *MediaHandler) CleanExpiredTrash(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	count, err := h.mediaService.CleanExpiredTrash(tenantID)
	if err != nil {
		response.InternalError(c, "failed to clean expired trash")
		return
	}

	response.Success(c, gin.H{
		"message": fmt.Sprintf("cleaned %d expired trash files", count),
		"count":   count,
	})
}

// ---------------------------------------------------------------------------
// Batch Operations
// ---------------------------------------------------------------------------

// BatchMove moves multiple files to a target folder.
func (h *MediaHandler) BatchMove(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		IDs      []uint `json:"ids" binding:"required"`
		FolderID *uint  `json:"folder_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.IDs) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	if err := h.mediaService.BatchMove(tenantID, req.IDs, req.FolderID); err != nil {
		if err == service.ErrBatchLimitExceeded {
			response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
			return
		}
		response.InternalError(c, "failed to batch move")
		return
	}

	response.Success(c, gin.H{"message": "moved"})
}

// BatchDelete moves multiple files to trash.
func (h *MediaHandler) BatchDelete(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.IDs) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	if err := h.mediaService.BatchDelete(tenantID, req.IDs); err != nil {
		if err == service.ErrBatchLimitExceeded {
			response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
			return
		}
		response.InternalError(c, "failed to batch delete")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

// ---------------------------------------------------------------------------
// Orphan Files
// ---------------------------------------------------------------------------

// DetectOrphanFiles lists orphan files (physical files without DB records).
func (h *MediaHandler) DetectOrphanFiles(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	orphans, err := h.mediaService.DetectOrphanFiles(tenantID)
	if err != nil {
		response.InternalError(c, "failed to detect orphan files")
		return
	}

	response.Success(c, gin.H{
		"orphan_count": len(orphans),
		"orphan_files": orphans,
	})
}

// CleanOrphanFiles removes orphan files from disk.
func (h *MediaHandler) CleanOrphanFiles(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	count, err := h.mediaService.CleanOrphanFiles(tenantID)
	if err != nil {
		response.InternalError(c, "failed to clean orphan files")
		return
	}

	response.Success(c, gin.H{
		"message": fmt.Sprintf("removed %d orphan files", count),
		"count":   count,
	})
}

// ---------------------------------------------------------------------------
// AI Analysis & Report
// ---------------------------------------------------------------------------

// AnalyzeMedia triggers AI analysis on selected media files.
func (h *MediaHandler) AnalyzeMedia(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		MediaIDs     []uint `json:"media_ids" binding:"required"`
		AnalysisType string `json:"analysis_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.MediaIDs) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	result, err := h.mediaService.AnalyzeMedia(tenantID, req.MediaIDs, req.AnalysisType)
	if err != nil {
		response.InternalError(c, "failed to analyze media")
		return
	}

	response.Success(c, result)
}

// DefectAnalyzeMedia performs AI defect analysis on media files and returns bounding boxes.
func (h *MediaHandler) DefectAnalyzeMedia(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		MediaIDs []uint `json:"media_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.MediaIDs) > maxBatchSize {
		response.BadRequest(c, fmt.Sprintf("batch operation exceeds maximum of %d items", maxBatchSize))
		return
	}

	results, err := h.mediaService.DefectAnalyzeMedia(tenantID, req.MediaIDs)
	if err != nil {
		response.InternalError(c, "failed to analyze defects")
		return
	}

	response.Success(c, results)
}

// GenerateReport generates an AI-powered inspection report.
func (h *MediaHandler) GenerateReport(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		MediaIDs   []uint `json:"media_ids" binding:"required"`
		ReportType string `json:"report_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.mediaService.GenerateReport(tenantID, req.MediaIDs, req.ReportType)
	if err != nil {
		response.InternalError(c, "failed to generate report")
		return
	}

	response.Success(c, result)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return strconv.FormatInt(b, 10) + " B"
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

func getAllowedTypesList() []string {
	return []string{
		"image/jpeg", "image/png", "image/gif", "image/webp",
		"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo",
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	}
}

func sanitizeHeaderValue(s string) string {
	// Remove characters that could cause header injection
	s = strings.ReplaceAll(s, "\"", "")
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\n", "")
	return s
}
