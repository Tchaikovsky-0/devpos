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

func (h *MediaHandler) Upload(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	form, err := c.MultipartForm()
	if err != nil {
		response.BadRequest(c, "invalid multipart form")
		return
	}

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
		if err := service.ValidateFileSize(file.Size); err != nil {
			response.BadRequest(c, "file size exceeds maximum limit: "+file.Filename)
			return
		}

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

	if mimeType == "" {
		mimeType = mime.TypeByExtension(filepath.Ext(originalName))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
	}

	c.Header("Content-Type", mimeType)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, sanitizeHeaderValue(originalName)))
	c.Header("Accept-Ranges", "bytes")

	f, err := os.Open(filePath)
	if err != nil {
		response.InternalError(c, "failed to open file")
		return
	}
	defer f.Close()

	http.ServeContent(c.Writer, c.Request, originalName, fileInfo.ModTime(), f)
}

func (h *MediaHandler) ServeFile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Unauthorized(c, "authentication required")
		return
	}

	filePath := c.Param("filepath")

	if strings.Contains(filePath, "..") {
		response.Forbidden(c, "invalid file path")
		return
	}

	storagePath := h.mediaService.GetStoragePath()

	// filepath is like "/media/tenant_demo/2026-04/xxx.png"
	// Remove leading slash for filepath.Join
	cleanPath := strings.TrimPrefix(filePath, "/")

	// Ensure the path starts with "media/tenantID" for security
	expectedPrefix := "media/" + tenantID
	if !strings.HasPrefix(cleanPath, expectedPrefix) {
		response.Forbidden(c, "access denied to this tenant's files")
		return
	}

	fullPath := filepath.Join(storagePath, cleanPath)

	absStorage, _ := filepath.Abs(storagePath)
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

	f, err := os.Open(fullPath)
	if err != nil {
		response.InternalError(c, "failed to open file")
		return
	}
	defer f.Close()

	ct := mime.TypeByExtension(filepath.Ext(fullPath))
	if ct == "" {
		ct = "application/octet-stream"
	}
	c.Header("Content-Type", ct)
	c.Header("Accept-Ranges", "bytes")

	http.ServeContent(c.Writer, c.Request, filepath.Base(fullPath), fileInfo.ModTime(), f)
}

func (h *MediaHandler) ListFolders(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

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
		case service.ErrForbidden:
			response.Forbidden(c, "no permission to create folder in this location")
		default:
			response.InternalError(c, "failed to create folder")
		}
		return
	}

	response.Created(c, folder)
}

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

func (h *MediaHandler) StorageInfo(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.mediaService.GetStorageInfo(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get storage info")
		return
	}

	response.Success(c, info)
}

func (h *MediaHandler) StorageUsage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.mediaService.GetStorageUsage(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get storage usage")
		return
	}

	response.Success(c, info)
}

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
		if err == service.ErrQuotaExceeded {
			response.Forbidden(c, "storage quota exceeded, cannot restore files")
			return
		}
		response.InternalError(c, "failed to restore from trash")
		return
	}

	response.Success(c, gin.H{"message": "restored"})
}

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

func (h *MediaHandler) BatchDedupe(c *gin.Context) {
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

	result, err := h.mediaService.BatchDedupe(tenantID, req.IDs)
	if err != nil {
		response.InternalError(c, "dedupe failed")
		return
	}

	response.Success(c, result)
}

func (h *MediaHandler) SemanticDedupe(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.SemanticDedupeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.mediaService.SemanticDedupe(tenantID, req)
	if err != nil {
		response.InternalError(c, "semantic dedupe failed")
		return
	}

	response.Success(c, result)
}

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

func (h *MediaHandler) ListAccessibleFolders(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	folders, err := h.mediaService.ListAccessibleFolders(tenantID, userID)
	if err != nil {
		response.InternalError(c, "failed to list accessible folders")
		return
	}

	response.Success(c, folders)
}

func (h *MediaHandler) ListFolderPermissions(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")
	folderID, err := service.ParseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid folder id")
		return
	}

	canAccess, _ := h.mediaService.CanAccessFolder(tenantID, userID, folderID, "read")
	if !canAccess {
		response.Forbidden(c, "no access to this folder")
		return
	}

	perms, err := h.mediaService.ListFolderPermissions(folderID)
	if err != nil {
		response.InternalError(c, "failed to list permissions")
		return
	}

	response.Success(c, perms)
}

func (h *MediaHandler) GrantFolderPermission(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")
	folderID, err := service.ParseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid folder id")
		return
	}

	canAccess, _ := h.mediaService.CanAccessFolder(tenantID, userID, folderID, "admin")
	if !canAccess {
		response.Forbidden(c, "no permission to manage this folder")
		return
	}

	var req struct {
		UserID     uint   `json:"user_id" binding:"required"`
		Permission string `json:"permission" binding:"required,oneof=read write admin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	perm, err := h.mediaService.GrantFolderPermission(folderID, req.UserID, userID, req.Permission)
	if err != nil {
		response.InternalError(c, "failed to grant permission")
		return
	}

	response.Success(c, perm)
}

func (h *MediaHandler) RevokeFolderPermission(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")
	folderID, err := service.ParseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid folder id")
		return
	}

	targetUserID, err := service.ParseUint(c.Param("userId"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	canAccess, _ := h.mediaService.CanAccessFolder(tenantID, userID, folderID, "admin")
	if !canAccess {
		response.Forbidden(c, "no permission to manage this folder")
		return
	}

	if targetUserID == userID {
		response.BadRequest(c, "cannot revoke your own permission")
		return
	}

	if err := h.mediaService.RevokeFolderPermission(folderID, targetUserID); err != nil {
		response.InternalError(c, "failed to revoke permission")
		return
	}

	response.Success(c, gin.H{"message": "permission revoked"})
}

func (h *MediaHandler) UpdateFolderPermission(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")
	folderID, err := service.ParseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid folder id")
		return
	}

	targetUserID, err := service.ParseUint(c.Param("userId"))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	canAccess, _ := h.mediaService.CanAccessFolder(tenantID, userID, folderID, "admin")
	if !canAccess {
		response.Forbidden(c, "no permission to manage this folder")
		return
	}

	var req struct {
		Permission string `json:"permission" binding:"required,oneof=read write admin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.mediaService.UpdateFolderPermission(folderID, targetUserID, req.Permission); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "permission not found")
			return
		}
		response.InternalError(c, "failed to update permission")
		return
	}

	response.Success(c, gin.H{"message": "permission updated"})
}

func (h *MediaHandler) SetFolderPublic(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")
	folderID := c.Param("id")

	folderIDUint, err := service.ParseUint(folderID)
	if err != nil {
		response.BadRequest(c, "invalid folder id")
		return
	}

	canAccess, _ := h.mediaService.CanAccessFolder(tenantID, userID, folderIDUint, "admin")
	if !canAccess {
		response.Forbidden(c, "no permission to manage this folder")
		return
	}

	var req struct {
		IsPublic bool `json:"is_public"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.mediaService.SetFolderPublic(tenantID, folderID, req.IsPublic); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "folder not found")
			return
		}
		response.InternalError(c, "failed to update folder")
		return
	}

	response.Success(c, gin.H{"message": "folder visibility updated"})
}

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
	s = strings.ReplaceAll(s, "\"", "")
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\n", "")
	return s
}
