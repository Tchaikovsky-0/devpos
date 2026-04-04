package service

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

type MediaService struct {
	db          *gorm.DB
	storagePath string // 本地存储路径
}

func NewMediaService(db *gorm.DB) *MediaService {
	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./uploads"
	}
	// 确保存储目录存在
	os.MkdirAll(storagePath, 0755)
	os.MkdirAll(filepath.Join(storagePath, "media"), 0755)

	return &MediaService{db: db, storagePath: storagePath}
}

type CreateMediaFolderRequest struct {
	Name     string `json:"name" binding:"required"`
	ParentID *uint  `json:"parent_id"`
}

type UpdateMediaRequest struct {
	Description *string `json:"description"`
	FolderID    *uint   `json:"folder_id"`
}

type UpdateMediaFolderRequest struct {
	Name     *string `json:"name"`
	ParentID *uint   `json:"parent_id"`
}

// ListMediaFiles 获取媒体文件列表
func (s *MediaService) ListMediaFiles(tenantID string, fileType string, folderID *uint, p pagination.Params) ([]model.Media, int64, error) {
	var files []model.Media
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	if fileType != "" {
		query = query.Where("type = ?", fileType)
	}
	if folderID != nil {
		query = query.Where("folder_id = ?", *folderID)
	}

	query.Model(&model.Media{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&files).Error; err != nil {
		return nil, 0, err
	}

	return files, total, nil
}

// GetMediaByID 获取单个媒体文件
func (s *MediaService) GetMediaByID(tenantID, id string) (*model.Media, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return nil, ErrNotFound
	}
	return &media, nil
}

// UploadFile 上传单个文件
func (s *MediaService) UploadFile(tenantID string, userID uint, file *multipart.FileHeader, folderID *uint, description string) (*model.Media, error) {
	// 打开上传文件
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	// 检查文件类型
	mimeType := file.Header.Get("Content-Type")
	mediaType := getMediaType(mimeType)

	// 生成存储路径
	ext := filepath.Ext(file.Filename)
	datePath := time.Now().Format("2006/01/02")
	storeDir := filepath.Join(s.storagePath, "media", tenantID, datePath)
	os.MkdirAll(storeDir, 0755)

	// 生成唯一文件名
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), randomString(8), ext)
	storePath := filepath.Join(storeDir, filename)

	// 创建目标文件
	dst, err := os.Create(storePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// 复制文件内容
	written, err := dst.ReadFrom(src)
	if err != nil {
		os.Remove(storePath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// 构建URL
	relPath := filepath.Join("media", tenantID, datePath, filename)
	url := "/api/v1/media/files/" + strings.ReplaceAll(relPath, "\\", "/")

	media := &model.Media{
		TenantID:     tenantID,
		Filename:     filename,
		OriginalName: file.Filename,
		MimeType:     mimeType,
		Size:         written,
		Path:         storePath,
		URL:          url,
		FolderID:     folderID,
		Type:         mediaType,
		UserID:       &userID,
		Description:  description,
	}

	if err := s.db.Create(media).Error; err != nil {
		os.Remove(storePath)
		return nil, fmt.Errorf("failed to save media record: %w", err)
	}

	// 更新租户存储使用量
	s.db.Model(&model.TenantConfig{}).
		Where("tenant_id = ?", tenantID).
		UpdateColumn("storage_used", gorm.Expr("storage_used + ?", written))

	return media, nil
}

// DeleteFile 删除媒体文件
func (s *MediaService) DeleteFile(tenantID, id string) error {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return ErrNotFound
	}

	// 删除物理文件
	if media.Path != "" {
		os.Remove(media.Path)
	}

	// 更新存储使用量
	s.db.Model(&model.TenantConfig{}).
		Where("tenant_id = ?", tenantID).
		UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used - ?, 0)", media.Size))

	// 软删除数据库记录
	return s.db.Delete(&media).Error
}

// GetFilePath 获取文件物理路径（用于下载）
func (s *MediaService) GetFilePath(tenantID, id string) (string, string, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return "", "", ErrNotFound
	}
	return media.Path, media.OriginalName, nil
}

// ListFolders 获取文件夹列表
func (s *MediaService) ListFolders(tenantID string, parentID *uint) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	query := s.db.Where("tenant_id = ?", tenantID)
	if parentID != nil {
		query = query.Where("parent_id = ?", *parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}
	if err := query.Order("name ASC").Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

// CreateFolder 创建文件夹
func (s *MediaService) CreateFolder(tenantID string, userID uint, req CreateMediaFolderRequest) (*model.MediaFolder, error) {
	folder := &model.MediaFolder{
		TenantID: tenantID,
		Name:     req.Name,
		ParentID: req.ParentID,
		UserID:   &userID,
	}
	if err := s.db.Create(folder).Error; err != nil {
		return nil, err
	}
	return folder, nil
}

// DeleteFolder 删除文件夹（同时删除文件夹内的文件）
func (s *MediaService) DeleteFolder(tenantID, id string) error {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&folder).Error; err != nil {
		return ErrNotFound
	}

	// 将文件夹内的文件的 folder_id 设为 NULL
	s.db.Model(&model.Media{}).Where("folder_id = ? AND tenant_id = ?", folder.ID, tenantID).
		Update("folder_id", nil)

	return s.db.Delete(&folder).Error
}

// GetStoragePath 返回存储路径
func (s *MediaService) GetStoragePath() string {
	return s.storagePath
}

// GetStorageInfo 获取存储信息
func (s *MediaService) GetStorageInfo(tenantID string) (map[string]interface{}, error) {
	var config model.TenantConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		return nil, err
	}

	// 按类型统计文件数量和大小
	type TypeStat struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
		Size  int64  `json:"size"`
	}
	var typeStats []TypeStat
	s.db.Model(&model.Media{}).
		Select("type, count(*) as count, sum(size) as size").
		Where("tenant_id = ?", tenantID).
		Group("type").
		Find(&typeStats)

	var totalFiles int64
	s.db.Model(&model.Media{}).Where("tenant_id = ?", tenantID).Count(&totalFiles)

	usagePercent := float64(0)
	if config.StorageQuota > 0 {
		usagePercent = float64(config.StorageUsed) / float64(config.StorageQuota) * 100
	}

	return map[string]interface{}{
		"quota_bytes":   config.StorageQuota,
		"used_bytes":    config.StorageUsed,
		"usage_percent": usagePercent,
		"total_files":   totalFiles,
		"by_type":       typeStats,
	}, nil
}

// getMediaType 根据MIME类型判断媒体类型
func getMediaType(mimeType string) string {
	if strings.HasPrefix(mimeType, "image/") {
		return "image"
	}
	if strings.HasPrefix(mimeType, "video/") {
		return "video"
	}
	if strings.HasPrefix(mimeType, "audio/") {
		return "audio"
	}
	knownDocTypes := map[string]bool{
		"application/pdf": true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
		"text/plain":         true,
		"text/csv":           true,
		"application/zip":    true,
	}
	if knownDocTypes[mimeType] {
		return "document"
	}
	return "other"
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}
