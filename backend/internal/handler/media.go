package handler

import (
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type MediaHandler struct {
	mediaService *service.MediaService
}

func NewMediaHandler(s *service.MediaService) *MediaHandler {
	return &MediaHandler{mediaService: s}
}

// List 获取媒体文件列表
func (h *MediaHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	var folderID *uint
	if fid := c.Query("folder_id"); fid != "" {
		if v, err := service.ParseUint(fid); err == nil {
			folderID = &v
		}
	}

	files, total, err := h.mediaService.ListMediaFiles(tenantID, c.Query("type"), folderID, p)
	if err != nil {
		response.InternalError(c, "failed to list media files")
		return
	}

	pagination.PageOK(c, files, total, p)
}

// GetByID 获取单个媒体文件信息
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

// Upload 上传文件（支持多文件）
func (h *MediaHandler) Upload(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetUint("user_id")

	form, err := c.MultipartForm()
	if err != nil {
		response.BadRequest(c, "invalid multipart form")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		response.BadRequest(c, "no files provided")
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
		// 限制单文件大小 100MB
		if file.Size > 100*1024*1024 {
			response.BadRequest(c, "file too large: "+file.Filename)
			return
		}

		media, err := h.mediaService.UploadFile(tenantID, userID, file, folderID, description)
		if err != nil {
			response.InternalError(c, "failed to upload file: "+file.Filename)
			return
		}
		uploaded = append(uploaded, media)
	}

	response.Created(c, uploaded)
}

// Delete 删除媒体文件
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

// Download 下载媒体文件
func (h *MediaHandler) Download(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	filePath, originalName, err := h.mediaService.GetFilePath(tenantID, id)
	if err != nil {
		response.NotFound(c, "media file not found")
		return
	}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		response.NotFound(c, "file not found on disk")
		return
	}

	c.Header("Content-Disposition", "attachment; filename=\""+filepath.Base(originalName)+"\"")
	c.File(filePath)
}

// ServeFile 通过路径提供文件访问
func (h *MediaHandler) ServeFile(c *gin.Context) {
	// 路径格式: /api/v1/media/files/:tenant/:datePath/:filename
	filePath := c.Param("filepath")
	storagePath := h.mediaService.GetStoragePath()
	fullPath := filepath.Join(storagePath, "media", filePath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		response.NotFound(c, "file not found")
		return
	}

	c.File(fullPath)
}

// ListFolders 获取文件夹列表
func (h *MediaHandler) ListFolders(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

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

// CreateFolder 创建文件夹
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
		response.InternalError(c, "failed to create folder")
		return
	}

	response.Created(c, folder)
}

// DeleteFolder 删除文件夹
func (h *MediaHandler) DeleteFolder(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.mediaService.DeleteFolder(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "folder not found")
			return
		}
		response.InternalError(c, "failed to delete folder")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

// StorageInfo 获取存储信息
func (h *MediaHandler) StorageInfo(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	info, err := h.mediaService.GetStorageInfo(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get storage info")
		return
	}

	response.Success(c, info)
}
