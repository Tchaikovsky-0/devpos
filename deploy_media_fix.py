#!/usr/bin/env python3
"""Write fixed media library backend files to server via SSH."""

import subprocess
import sys

SSH = "sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139"
SCP = "sshpass -p 'Tchaikovsky_0' scp -o StrictHostKeyChecking=no"

def run(cmd):
    print(f"  $ {cmd[:120]}...")
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ERROR: {r.stderr[:500]}")
        sys.exit(1)
    return r.stdout

def write_remote(remote_path, content):
    local_tmp = f"/tmp/_deploy_{remote_path.replace('/', '_')}"
    with open(local_tmp, "w") as f:
        f.write(content)
    run(f"{SCP} {local_tmp} ubuntu@101.43.35.139:{remote_path}")
    run(f"rm -f {local_tmp}")
    print(f"  Written: {remote_path}")

# ===========================================================================
# 1. model/media.go
# ===========================================================================
MODEL_MEDIA = r'''package model

import "time"

// Media 表示上传的媒体文件
type Media struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	TenantID     string     `json:"tenant_id" gorm:"size:64;index"`
	Name         string     `json:"name" gorm:"size:255;not null"`
	Filename     string     `json:"filename" gorm:"size:255;not null"`
	OriginalName string     `json:"original_name" gorm:"size:255;not null"`
	MimeType     string     `json:"mime_type" gorm:"size:128"`
	Size         int64      `json:"size"`
	Path         string     `json:"-" gorm:"size:512"`
	URL          string     `json:"url" gorm:"size:512"`
	FolderID     *uint      `json:"folder_id" gorm:"index"`
	Type         string     `json:"type" gorm:"size:32"`
	UserID       *uint      `json:"user_id"`
	Description   string     `json:"description" gorm:"type:text"`
	Starred      bool       `json:"starred" gorm:"default:false"`
	Sha256Hash   string     `json:"sha256_hash" gorm:"size:64;index"`
	TrashedAt    *time.Time `json:"trashed_at" gorm:"index"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}

func (Media) TableName() string {
	return "media"
}

// MediaFolder 表示媒体文件夹
type MediaFolder struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	TenantID  string         `json:"tenant_id" gorm:"size:64;index"`
	Name      string         `json:"name" gorm:"size:255;not null"`
	ParentID  *uint          `json:"parent_id" gorm:"index"`
	UserID    uint           `json:"user_id" gorm:"not null"`
	IsPrivate bool           `json:"is_private" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt *time.Time     `json:"deleted_at" gorm:"index"`

	Permissions []FolderPermission `gorm:"foreignKey:FolderID"`
}

func (MediaFolder) TableName() string {
	return "media_folders"
}

// FolderPermission 表示用户对文件夹的访问权限
type FolderPermission struct {
	ID         uint       `json:"id" gorm:"primaryKey"`
	TenantID   string     `json:"tenant_id" gorm:"size:64;index"`
	FolderID   uint       `json:"folder_id" gorm:"index;not null"`
	UserID     uint       `json:"user_id" gorm:"index;not null"`
	Permission string     `json:"permission" gorm:"size:32;default:read"`
	GrantedBy  uint       `json:"granted_by" gorm:"not null"`
	ExpiresAt  *time.Time `json:"expires_at" gorm:"index"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	Folder MediaFolder `gorm:"foreignKey:FolderID"`
	User   User        `gorm:"foreignKey:UserID"`
}

func (FolderPermission) TableName() string {
	return "folder_permissions"
}

// SemanticDedupeRequest 语义去重请求
type SemanticDedupeRequest struct {
	FolderID   *uint    `json:"folder_id"`
	Threshold  float64  `json:"threshold"`
	MediaTypes []string `json:"media_types"`
}

// SemanticDedupeResult 语义去重结果
type SemanticDedupeResult struct {
	TotalScanned int           `json:"total_scanned"`
	GroupsFound  int           `json:"groups_found"`
	TotalRemoved int           `json:"total_removed"`
	Groups       []DedupeGroup `json:"groups"`
}

// DedupeGroup 表示一组重复文件
type DedupeGroup struct {
	Hash       string `json:"hash"`
	KeptID     uint   `json:"kept_id"`
	RemovedIDs []uint `json:"removed_ids"`
}
'''

# ===========================================================================
# 2. service/media.go (complete fixed version)
# ===========================================================================
SERVICE_MEDIA = r'''package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

const (
	defaultMaxUploadSize int64 = 100 * 1024 * 1024
	defaultStorageQuota  int64 = 10 * 1024 * 1024 * 1024
	maxBatchSize               = 100
	maxFolderDepth             = 5
	trashRetentionDays         = 30
)

var allowedMIMETypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
	"video/mp4":       true,
	"video/mpeg":      true,
	"video/quicktime": true,
	"video/x-msvideo": true,
	"application/pdf": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       true,
}

var blockedExtensions = map[string]bool{
	".exe": true, ".sh": true, ".bat": true, ".cmd": true, ".ps1": true,
	".msi": true, ".com": true, ".scr": true, ".pif": true, ".vbs": true,
}

type StorageInfo struct {
	QuotaBytes   int64   `json:"quota_bytes"`
	UsedBytes    int64   `json:"used_bytes"`
	UsagePercent float64 `json:"usage_percent"`
	TotalFiles   int64   `json:"total_files"`
}

type MediaService struct {
	db          *gorm.DB
	aiService   *AIService
	storagePath string
}

func NewMediaService(db *gorm.DB, aiService *AIService) *MediaService {
	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./uploads"
	}
	if err := os.MkdirAll(filepath.Join(storagePath, "media"), 0755); err != nil {
		fmt.Fprintf(os.Stderr, "media: failed to create storage dir: %v\n", err)
	}
	return &MediaService{db: db, aiService: aiService, storagePath: storagePath}
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

func maxUploadSize() int64 {
	return getEnvInt64("MAX_UPLOAD_SIZE", defaultMaxUploadSize)
}

func ValidateFileSize(size int64) error {
	if size > maxUploadSize() {
		return ErrFileTooLarge
	}
	return nil
}

func ValidateFileType(file *multipart.FileHeader) (string, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if blockedExtensions[ext] {
		return "", ErrInvalidFileType
	}
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file for type detection: %w", err)
	}
	defer src.Close()
	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("failed to read file header: %w", err)
	}
	detectedType := http.DetectContentType(buf[:n])
	if detectedType == "application/octet-stream" {
		detectedType = file.Header.Get("Content-Type")
	}
	if !allowedMIMETypes[detectedType] {
		return detectedType, ErrInvalidFileType
	}
	return detectedType, nil
}

func sanitizeFilename(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, "..", "")
	name = strings.ReplaceAll(name, "/", "")
	name = strings.ReplaceAll(name, "\\", "")
	if name == "" || name == "." {
		name = "unnamed"
	}
	return name
}

func secureRandomString(nBytes int) string {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

func computeSHA256(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file for hash: %w", err)
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", fmt.Errorf("failed to compute hash: %w", err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func (s *MediaService) GetStorageUsage(tenantID string) (*StorageInfo, error) {
	var totalFiles int64
	var usedBytes int64
	if err := s.db.Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).Count(&totalFiles).Error; err != nil {
		return nil, fmt.Errorf("failed to count files: %w", err)
	}
	if err := s.db.Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).
		Select("COALESCE(SUM(size), 0)").Scan(&usedBytes).Error; err != nil {
		return nil, fmt.Errorf("failed to sum file sizes: %w", err)
	}
	quotaBytes := s.getQuota(tenantID)
	usagePercent := float64(0)
	if quotaBytes > 0 {
		usagePercent = float64(usedBytes) / float64(quotaBytes) * 100
	}
	return &StorageInfo{
		QuotaBytes:   quotaBytes,
		UsedBytes:    usedBytes,
		UsagePercent: usagePercent,
		TotalFiles:   totalFiles,
	}, nil
}

func (s *MediaService) CheckQuota(tenantID string, fileSize int64) error {
	info, err := s.GetStorageUsage(tenantID)
	if err != nil {
		return fmt.Errorf("failed to check quota: %w", err)
	}
	if info.UsedBytes+fileSize > info.QuotaBytes {
		return ErrQuotaExceeded
	}
	return nil
}

func (s *MediaService) getQuota(tenantID string) int64 {
	var config model.TenantConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err == nil && config.StorageQuota > 0 {
		return config.StorageQuota
	}
	return defaultStorageQuota
}

func (s *MediaService) ListMediaFiles(tenantID string, fileType string, folderID *uint, search string, starred *bool, p pagination.Params) ([]model.Media, int64, error) {
	var files []model.Media
	var total int64
	query := s.db.Where("tenant_id = ? AND trashed_at IS NULL", tenantID)
	if fileType != "" {
		query = query.Where("type = ?", fileType)
	}
	if folderID != nil {
		query = query.Where("folder_id = ?", *folderID)
	}
	if starred != nil {
		query = query.Where("starred = ?", *starred)
	}
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("original_name LIKE ? OR filename LIKE ? OR description LIKE ?", searchPattern, searchPattern, searchPattern)
	}
	if err := query.Model(&model.Media{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count media: %w", err)
	}
	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&files).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list media: %w", err)
	}
	return files, total, nil
}

func (s *MediaService) ListTrash(tenantID string, p pagination.Params) ([]model.Media, int64, error) {
	var files []model.Media
	var total int64
	query := s.db.Where("tenant_id = ? AND trashed_at IS NOT NULL", tenantID)
	if err := query.Model(&model.Media{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count trash: %w", err)
	}
	if err := query.Order("trashed_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&files).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list trash: %w", err)
	}
	return files, total, nil
}

func (s *MediaService) GetMediaByID(tenantID, id string) (*model.Media, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return nil, ErrNotFound
	}
	return &media, nil
}

func (s *MediaService) UploadFile(tenantID string, userID uint, file *multipart.FileHeader, folderID *uint, description string) (*model.Media, error) {
	if err := ValidateFileSize(file.Size); err != nil {
		return nil, err
	}
	detectedMIME, err := ValidateFileType(file)
	if err != nil {
		return nil, err
	}

	var config model.TenantConfig
	if err := s.db.Set("gorm:query_option", "FOR UPDATE").Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			config.TenantID = tenantID
			config.StorageQuota = defaultStorageQuota
			config.StorageUsed = 0
			if err := s.db.Create(&config).Error; err != nil {
				return nil, fmt.Errorf("failed to create tenant config: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to lock tenant config: %w", err)
		}
	}
	if config.StorageUsed+file.Size > config.StorageQuota {
		return nil, ErrQuotaExceeded
	}

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	sanitized := sanitizeFilename(file.Filename)
	ext := strings.ToLower(filepath.Ext(sanitized))
	yearMonth := time.Now().Format("2006-01")
	storeDir := filepath.Join(s.storagePath, "media", tenantID, yearMonth)
	if err := os.MkdirAll(storeDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	uuid := secureRandomString(16)
	finalName := uuid + ext
	finalPath := filepath.Join(storeDir, finalName)
	tmpPath := finalPath + ".tmp"

	dst, err := os.Create(tmpPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	written, err := io.Copy(dst, src)
	if closeErr := dst.Close(); closeErr != nil && err == nil {
		err = closeErr
	}
	if err != nil {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("failed to write file: %w", err)
	}
	if err := os.Rename(tmpPath, finalPath); err != nil {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("failed to finalize file: %w", err)
	}

	relPath := filepath.Join("media", tenantID, yearMonth, finalName)
	url := "/api/v1/media/files/" + strings.ReplaceAll(relPath, "\\", "/")
	mediaType := getMediaType(detectedMIME)

	sha256Hash, err := computeSHA256(finalPath)
	if err != nil {
		os.Remove(finalPath)
		return nil, fmt.Errorf("failed to compute file hash: %w", err)
	}

	media := &model.Media{
		Name:         sanitized,
		TenantID:     tenantID,
		Filename:     finalName,
		OriginalName: sanitized,
		MimeType:     detectedMIME,
		Size:         written,
		Path:         finalPath,
		URL:          url,
		FolderID:     folderID,
		Type:         mediaType,
		UserID:       &userID,
		Description:  description,
		Sha256Hash:   sha256Hash,
	}

	if err := s.db.Create(media).Error; err != nil {
		os.Remove(finalPath)
		return nil, fmt.Errorf("failed to save media record: %w", err)
	}

	if err := s.db.Model(&model.TenantConfig{}).
		Where("tenant_id = ?", tenantID).
		UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used + ?, 0)", written)).Error; err != nil {
		os.Remove(finalPath)
		s.db.Unscoped().Delete(media)
		return nil, fmt.Errorf("failed to update storage usage: %w", err)
	}

	return media, nil
}

func (s *MediaService) DeleteFile(tenantID, id string) error {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return ErrNotFound
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&media).Error; err != nil {
			return fmt.Errorf("failed to delete media record: %w", err)
		}
		if err := tx.Model(&model.TenantConfig{}).
			Where("tenant_id = ?", tenantID).
			UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used - ?, 0)", media.Size)).Error; err != nil {
			return fmt.Errorf("failed to update storage usage: %w", err)
		}
		if media.Path != "" {
			if err := os.Remove(media.Path); err != nil && !os.IsNotExist(err) {
				fmt.Fprintf(os.Stderr, "media: failed to remove file %s: %v\n", media.Path, err)
			}
		}
		return nil
	})
}

func (s *MediaService) MoveToTrash(tenantID, id string) error {
	now := time.Now()
	result := s.db.Model(&model.Media{}).
		Where("id = ? AND tenant_id = ? AND trashed_at IS NULL", id, tenantID).
		Update("trashed_at", &now)
	if result.Error != nil {
		return fmt.Errorf("failed to move to trash: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *MediaService) RestoreFromTrash(tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return ErrBatchLimitExceeded
	}
	var files []model.Media
	if err := s.db.Where("id IN ? AND tenant_id = ? AND trashed_at IS NOT NULL", ids, tenantID).
		Find(&files).Error; err != nil {
		return fmt.Errorf("failed to fetch trashed files: %w", err)
	}
	var totalSize int64
	for _, f := range files {
		totalSize += f.Size
	}
	info, err := s.GetStorageUsage(tenantID)
	if err != nil {
		return fmt.Errorf("failed to check quota: %w", err)
	}
	if info.UsedBytes+totalSize > info.QuotaBytes {
		return ErrQuotaExceeded
	}
	result := s.db.Model(&model.Media{}).
		Where("id IN ? AND tenant_id = ? AND trashed_at IS NOT NULL", ids, tenantID).
		Update("trashed_at", nil)
	if result.Error != nil {
		return fmt.Errorf("failed to restore from trash: %w", result.Error)
	}
	return nil
}

func (s *MediaService) PermanentDeleteTrash(tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return ErrBatchLimitExceeded
	}
	var files []model.Media
	if err := s.db.Where("id IN ? AND tenant_id = ? AND trashed_at IS NOT NULL", ids, tenantID).
		Find(&files).Error; err != nil {
		return fmt.Errorf("failed to fetch trashed files: %w", err)
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		var totalSize int64
		for _, f := range files {
			totalSize += f.Size
		}
		if err := tx.Unscoped().
			Where("id IN ? AND tenant_id = ? AND trashed_at IS NOT NULL", ids, tenantID).
			Delete(&model.Media{}).Error; err != nil {
			return fmt.Errorf("failed to permanently delete: %w", err)
		}
		if totalSize > 0 {
			if err := tx.Model(&model.TenantConfig{}).
				Where("tenant_id = ?", tenantID).
				UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used - ?, 0)", totalSize)).Error; err != nil {
				return fmt.Errorf("failed to update storage usage: %w", err)
			}
		}
		for _, f := range files {
			if f.Path != "" {
				if err := os.Remove(f.Path); err != nil && !os.IsNotExist(err) {
					fmt.Fprintf(os.Stderr, "media: failed to remove file %s: %v\n", f.Path, err)
				}
			}
		}
		return nil
	})
}

func (s *MediaService) CleanExpiredTrash(tenantID string) (int64, error) {
	cutoff := time.Now().AddDate(0, 0, -trashRetentionDays)
	var files []model.Media
	if err := s.db.Where("tenant_id = ? AND trashed_at IS NOT NULL AND trashed_at < ?", tenantID, cutoff).
		Find(&files).Error; err != nil {
		return 0, fmt.Errorf("failed to fetch expired trash: %w", err)
	}
	if len(files) == 0 {
		return 0, nil
	}
	ids := make([]uint, len(files))
	for i, f := range files {
		ids[i] = f.ID
	}
	var totalSize int64
	for _, f := range files {
		totalSize += f.Size
	}
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("id IN ?", ids).Delete(&model.Media{}).Error; err != nil {
			return err
		}
		if totalSize > 0 {
			if err := tx.Model(&model.TenantConfig{}).
				Where("tenant_id = ?", tenantID).
				UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used - ?, 0)", totalSize)).Error; err != nil {
				return err
			}
		}
		for _, f := range files {
			if f.Path != "" {
				os.Remove(f.Path)
			}
		}
		return nil
	})
	return int64(len(files)), err
}

func (s *MediaService) GetFilePath(tenantID, id string) (string, string, string, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return "", "", "", ErrNotFound
	}
	if media.TrashedAt != nil {
		return "", "", "", fmt.Errorf("file is in trash")
	}
	return media.Path, media.OriginalName, media.MimeType, nil
}

func (s *MediaService) GetStoragePath() string {
	return s.storagePath
}

func (s *MediaService) UpdateMedia(tenantID, id string, req UpdateMediaRequest) (*model.Media, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return nil, ErrNotFound
	}
	updates := map[string]interface{}{}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.FolderID != nil {
		updates["folder_id"] = *req.FolderID
	}
	if len(updates) > 0 {
		if err := s.db.Model(&media).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update media: %w", err)
		}
	}
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return nil, fmt.Errorf("failed to reload media: %w", err)
	}
	return &media, nil
}

func (s *MediaService) ToggleStar(tenantID, id string) (*model.Media, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return nil, ErrNotFound
	}
	media.Starred = !media.Starred
	if err := s.db.Save(&media).Error; err != nil {
		return nil, fmt.Errorf("failed to toggle star: %w", err)
	}
	return &media, nil
}

func (s *MediaService) BatchMove(tenantID string, ids []uint, folderID *uint) error {
	if len(ids) > maxBatchSize {
		return ErrBatchLimitExceeded
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.Media{}).
			Where("id IN ? AND tenant_id = ?", ids, tenantID).
			Update("folder_id", folderID)
		if result.Error != nil {
			return fmt.Errorf("failed to batch move: %w", result.Error)
		}
		return nil
	})
}

func (s *MediaService) BatchDelete(tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return ErrBatchLimitExceeded
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		result := tx.Model(&model.Media{}).
			Where("id IN ? AND tenant_id = ? AND trashed_at IS NULL", ids, tenantID).
			Update("trashed_at", &now)
		if result.Error != nil {
			return fmt.Errorf("failed to batch delete: %w", result.Error)
		}
		return nil
	})
}

type DedupeResult struct {
	Kept    int           `json:"kept"`
	Removed int           `json:"removed"`
	Groups  []DedupeGroup `json:"groups"`
}

func (s *MediaService) BatchDedupe(tenantID string, ids []uint) (*DedupeResult, error) {
	if len(ids) > maxBatchSize {
		return nil, ErrBatchLimitExceeded
	}
	var mediaList []model.Media
	if err := s.db.Where("id IN ? AND tenant_id = ? AND trashed_at IS NULL AND sha256_hash != ''", ids, tenantID).
		Order("id ASC").Find(&mediaList).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch media: %w", err)
	}
	hashGroups := make(map[string][]model.Media)
	for _, m := range mediaList {
		if m.Sha256Hash != "" {
			hashGroups[m.Sha256Hash] = append(hashGroups[m.Sha256Hash], m)
		}
	}
	result := &DedupeResult{Groups: make([]DedupeGroup, 0)}
	duplicateIDs := make([]uint, 0)
	for hash, items := range hashGroups {
		if len(items) <= 1 {
			continue
		}
		kept := items[0]
		removed := items[1:]
		for _, m := range removed {
			duplicateIDs = append(duplicateIDs, m.ID)
		}
		removedIDs := make([]uint, len(removed))
		for i, m := range removed {
			removedIDs[i] = m.ID
		}
		result.Groups = append(result.Groups, DedupeGroup{
			Hash:       hash,
			KeptID:     kept.ID,
			RemovedIDs: removedIDs,
		})
	}
	result.Kept = len(mediaList) - len(duplicateIDs)
	result.Removed = len(duplicateIDs)
	if len(duplicateIDs) > 0 {
		now := time.Now()
		if err := s.db.Model(&model.Media{}).
			Where("id IN ?", duplicateIDs).
			Update("trashed_at", &now).Error; err != nil {
			return nil, fmt.Errorf("failed to trash duplicates: %w", err)
		}
	}
	return result, nil
}

func (s *MediaService) SemanticDedupe(tenantID string, req model.SemanticDedupeRequest) (*model.SemanticDedupeResult, error) {
	threshold := req.Threshold
	if threshold <= 0 {
		threshold = 0.85
	}
	query := s.db.Where("tenant_id = ? AND trashed_at IS NULL AND type = 'image'", tenantID)
	if req.FolderID != nil {
		query = query.Where("folder_id = ?", *req.FolderID)
	}
	if len(req.MediaTypes) > 0 {
		query = query.Where("type IN ?", req.MediaTypes)
	}
	var images []model.Media
	if err := query.Order("id ASC").Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch images: %w", err)
	}
	if len(images) == 0 {
		return &model.SemanticDedupeResult{Groups: make([]DedupeGroup, 0)}, nil
	}

	type phashEntry struct {
		Media  model.Media
		Hash   uint64
		Width  int
		Height int
	}
	var entries []phashEntry
	for _, img := range images {
		f, err := os.Open(img.Path)
		if err != nil {
			continue
		}
		cfg, _, err := image.DecodeConfig(f)
		f.Close()
		if err != nil {
			continue
		}
		f2, err := os.Open(img.Path)
		if err != nil {
			continue
		}
		phash, err := computePHash(f2)
		f2.Close()
		if err != nil {
			continue
		}
		entries = append(entries, phashEntry{Media: img, Hash: phash, Width: cfg.Width, Height: cfg.Height})
	}

	result := &model.SemanticDedupeResult{TotalScanned: len(entries), Groups: make([]DedupeGroup, 0)}
	used := make(map[int]bool)
	for i := 0; i < len(entries); i++ {
		if used[i] {
			continue
		}
		group := []int{i}
		for j := i + 1; j < len(entries); j++ {
			if used[j] {
				continue
			}
			if hammingSimilarity(entries[i].Hash, entries[j].Hash) >= threshold {
				group = append(group, j)
			}
		}
		if len(group) <= 1 {
			continue
		}
		kept := group[0]
		used[kept] = true
		removedIDs := make([]uint, 0)
		for _, idx := range group[1:] {
			used[idx] = true
			removedIDs = append(removedIDs, entries[idx].Media.ID)
		}
		hashStr := fmt.Sprintf("%016x", entries[kept].Hash)
		result.Groups = append(result.Groups, DedupeGroup{Hash: hashStr, KeptID: entries[kept].Media.ID, RemovedIDs: removedIDs})
		result.TotalRemoved += len(removedIDs)
	}
	result.GroupsFound = len(result.Groups)

	if result.TotalRemoved > 0 {
		allRemoved := make([]uint, 0)
		for _, g := range result.Groups {
			allRemoved = append(allRemoved, g.RemovedIDs...)
		}
		now := time.Now()
		s.db.Model(&model.Media{}).Where("id IN ?", allRemoved).Update("trashed_at", &now)
	}
	return result, nil
}

func computePHash(r io.Reader) (uint64, error) {
	img, _, err := image.Decode(r)
	if err != nil {
		return 0, fmt.Errorf("failed to decode image: %w", err)
	}
	bounds := img.Bounds()
	size := 32
	gray := make([][]float64, size)
	for y := 0; y < size; y++ {
		gray[y] = make([]float64, size)
		for x := 0; x < size; x++ {
			sx := bounds.Min.X + (x * bounds.Dx()) / size
			sy := bounds.Min.Y + (y * bounds.Dy()) / size
			c := img.At(sx, sy)
			rr, g, b, _ := c.RGBA()
			gray[y][x] = 0.299*float64(rr>>8) + 0.587*float64(g>>8) + 0.114*float64(b>>8)
		}
	}
	dct := dct2D(gray, size)
	var hash uint64
	var sum float64
	count := 0
	for y := 1; y <= 8; y++ {
		for x := 1; x <= 8; x++ {
			sum += dct[y][x]
			count++
		}
	}
	median := sum / float64(count)
	bit := uint64(1) << 63
	for y := 1; y <= 8; y++ {
		for x := 1; x <= 8; x++ {
			if dct[y][x] > median {
				hash |= bit
			}
			bit >>= 1
		}
	}
	return hash, nil
}

func dct2D(input [][]float64, size int) [][]float64 {
	output := make([][]float64, size)
	for i := range output {
		output[i] = make([]float64, size)
	}
	for v := 0; v < size; v++ {
		for u := 0; u < size; u++ {
			sum := 0.0
			for y := 0; y < size; y++ {
				for x := 0; x < size; x++ {
					sum += input[y][x] *
						math.Cos(float64(2*x+1)*float64(u)*math.Pi/(2.0*float64(size))) *
						math.Cos(float64(2*y+1)*float64(v)*math.Pi/(2.0*float64(size)))
				}
			}
			cu := 1.0
			if u > 0 {
				cu = math.Sqrt(2)
			}
			cv := 1.0
			if v > 0 {
				cv = math.Sqrt(2)
			}
			output[v][u] = (2.0 / float64(size)) * sum / (cu * cv)
		}
	}
	return output
}

func hammingSimilarity(a, b uint64) float64 {
	xor := a ^ b
	diff := 0
	for xor != 0 {
		diff++
		xor &= xor - 1
	}
	return 1.0 - float64(diff)/64.0
}

func (s *MediaService) ListFolders(tenantID string, parentID *uint) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	query := s.db.Where("tenant_id = ?", tenantID)
	if parentID != nil {
		query = query.Where("parent_id = ?", *parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}
	if err := query.Order("name ASC").Find(&folders).Error; err != nil {
		return nil, fmt.Errorf("failed to list folders: %w", err)
	}
	return folders, nil
}

func (s *MediaService) ListAllFolders(tenantID string) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	if err := s.db.Where("tenant_id = ?", tenantID).Order("name ASC").Find(&folders).Error; err != nil {
		return nil, fmt.Errorf("failed to list all folders: %w", err)
	}
	return folders, nil
}

func (s *MediaService) CreateFolder(tenantID string, userID uint, req CreateMediaFolderRequest) (*model.MediaFolder, error) {
	if req.ParentID != nil {
		canAccess, err := s.CanAccessFolder(tenantID, userID, *req.ParentID, "write")
		if err != nil {
			return nil, err
		}
		if !canAccess {
			return nil, ErrForbidden
		}
	}
	if err := s.checkFolderNameUnique(tenantID, req.Name, req.ParentID, 0); err != nil {
		return nil, err
	}
	if req.ParentID != nil {
		depth, err := s.getFolderDepth(tenantID, *req.ParentID)
		if err != nil {
			return nil, err
		}
		if depth+1 >= maxFolderDepth {
			return nil, ErrFolderDepth
		}
	}
	folder := &model.MediaFolder{
		TenantID:  tenantID,
		Name:      req.Name,
		ParentID:  req.ParentID,
		UserID:    userID,
		IsPrivate: true,
	}
	if err := s.db.Create(folder).Error; err != nil {
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}
	perm := &model.FolderPermission{
		TenantID:   tenantID,
		FolderID:   folder.ID,
		UserID:     userID,
		Permission: "admin",
		GrantedBy:  userID,
	}
	s.db.Create(perm)
	return folder, nil
}

func (s *MediaService) UpdateFolder(tenantID, id string, req UpdateMediaFolderRequest) (*model.MediaFolder, error) {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&folder).Error; err != nil {
		return nil, ErrNotFound
	}
	if req.Name != nil {
		parentID := folder.ParentID
		if req.ParentID != nil {
			parentID = req.ParentID
		}
		if err := s.checkFolderNameUnique(tenantID, *req.Name, parentID, folder.ID); err != nil {
			return nil, err
		}
	}
	if req.ParentID != nil {
		if err := s.checkFolderCycle(tenantID, folder.ID, *req.ParentID); err != nil {
			return nil, err
		}
		depth, err := s.getFolderDepth(tenantID, *req.ParentID)
		if err != nil {
			return nil, err
		}
		subtreeDepth, err := s.getSubtreeMaxDepth(tenantID, folder.ID)
		if err != nil {
			return nil, err
		}
		if depth+1+subtreeDepth >= maxFolderDepth {
			return nil, ErrFolderDepth
		}
	}
	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.ParentID != nil {
		updates["parent_id"] = *req.ParentID
	}
	if len(updates) > 0 {
		if err := s.db.Model(&folder).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update folder: %w", err)
		}
	}
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&folder).Error; err != nil {
		return nil, fmt.Errorf("failed to reload folder: %w", err)
	}
	return &folder, nil
}

func (s *MediaService) DeleteFolder(tenantID, id string) error {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&folder).Error; err != nil {
		return ErrNotFound
	}
	var childCount int64
	if err := s.db.Model(&model.MediaFolder{}).Where("parent_id = ? AND tenant_id = ?", folder.ID, tenantID).
		Count(&childCount).Error; err != nil {
		return fmt.Errorf("failed to check child folders: %w", err)
	}
	if childCount > 0 {
		return ErrFolderNotEmpty
	}
	var fileCount int64
	if err := s.db.Model(&model.Media{}).Where("folder_id = ? AND tenant_id = ? AND trashed_at IS NULL", folder.ID, tenantID).
		Count(&fileCount).Error; err != nil {
		return fmt.Errorf("failed to check folder files: %w", err)
	}
	if fileCount > 0 {
		return ErrFolderNotEmpty
	}
	if err := s.db.Delete(&folder).Error; err != nil {
		return fmt.Errorf("failed to delete folder: %w", err)
	}
	return nil
}

func (s *MediaService) checkFolderNameUnique(tenantID, name string, parentID *uint, excludeID uint) error {
	query := s.db.Model(&model.MediaFolder{}).Where("tenant_id = ? AND name = ?", tenantID, name)
	if parentID != nil {
		query = query.Where("parent_id = ?", *parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}
	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check folder name: %w", err)
	}
	if count > 0 {
		return ErrFolderDuplicate
	}
	return nil
}

func (s *MediaService) getFolderDepth(tenantID string, folderID uint) (int, error) {
	depth := 0
	currentID := folderID
	visited := make(map[uint]bool)
	for {
		var folder model.MediaFolder
		if err := s.db.Where("id = ? AND tenant_id = ?", currentID, tenantID).First(&folder).Error; err != nil {
			return depth, nil
		}
		depth++
		if folder.ParentID == nil {
			return depth, nil
		}
		if visited[*folder.ParentID] {
			return depth, nil
		}
		visited[currentID] = true
		currentID = *folder.ParentID
	}
}

func (s *MediaService) checkFolderCycle(tenantID string, folderID, newParentID uint) error {
	if folderID == newParentID {
		return ErrFolderCycle
	}
	currentID := newParentID
	visited := make(map[uint]bool)
	for {
		var parent model.MediaFolder
		if err := s.db.Where("id = ? AND tenant_id = ?", currentID, tenantID).First(&parent).Error; err != nil {
			return nil
		}
		if parent.ID == folderID {
			return ErrFolderCycle
		}
		if parent.ParentID == nil {
			return nil
		}
		if visited[*parent.ParentID] {
			return ErrFolderCycle
		}
		visited[currentID] = true
		currentID = *parent.ParentID
	}
}

func (s *MediaService) getSubtreeMaxDepth(tenantID string, folderID uint) (int, error) {
	var children []model.MediaFolder
	if err := s.db.Where("parent_id = ? AND tenant_id = ?", folderID, tenantID).Find(&children).Error; err != nil {
		return 0, err
	}
	if len(children) == 0 {
		return 0, nil
	}
	maxDepth := 0
	for _, child := range children {
		d, err := s.getSubtreeMaxDepth(tenantID, child.ID)
		if err != nil {
			return 0, err
		}
		if d+1 > maxDepth {
			maxDepth = d + 1
		}
	}
	return maxDepth, nil
}

func (s *MediaService) GetStorageInfo(tenantID string) (map[string]interface{}, error) {
	var config model.TenantConfig
	_ = s.db.Where("tenant_id = ?", tenantID).First(&config).Error
	type TypeStat struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
		Size  int64  `json:"size"`
	}
	var typeStats []TypeStat
	if err := s.db.Model(&model.Media{}).
		Select("type, count(*) as count, COALESCE(sum(size),0) as size").
		Where("tenant_id = ? AND trashed_at IS NULL", tenantID).
		Group("type").
		Find(&typeStats).Error; err != nil {
		return nil, fmt.Errorf("failed to get type stats: %w", err)
	}
	var totalFiles int64
	var usedBytes int64
	s.db.Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).Count(&totalFiles)
	s.db.Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).Select("COALESCE(SUM(size), 0)").Scan(&usedBytes)
	var trashCount int64
	var trashSize int64
	s.db.Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NOT NULL", tenantID).Count(&trashCount)
	s.db.Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NOT NULL", tenantID).Select("COALESCE(SUM(size), 0)").Scan(&trashSize)
	quotaBytes := config.StorageQuota
	if quotaBytes == 0 {
		quotaBytes = defaultStorageQuota
	}
	usagePercent := float64(0)
	if quotaBytes > 0 {
		usagePercent = float64(usedBytes) / float64(quotaBytes) * 100
	}
	return map[string]interface{}{
		"quota_bytes":   quotaBytes,
		"used_bytes":    usedBytes,
		"usage_percent": usagePercent,
		"total_files":   totalFiles,
		"trash_count":   trashCount,
		"trash_size":    trashSize,
		"by_type":       typeStats,
	}, nil
}

func (s *MediaService) DetectOrphanFiles(tenantID string) ([]string, error) {
	baseDir := filepath.Join(s.storagePath, "media", tenantID)
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		return nil, nil
	}
	var allPaths []string
	if err := s.db.Model(&model.Media{}).
		Where("tenant_id = ?", tenantID).
		Pluck("path", &allPaths).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch media paths: %w", err)
	}
	pathSet := make(map[string]bool, len(allPaths))
	for _, p := range allPaths {
		pathSet[p] = true
	}
	var orphans []string
	err := filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasSuffix(path, ".tmp") {
			return nil
		}
		if !pathSet[path] {
			orphans = append(orphans, path)
		}
		return nil
	})
	return orphans, err
}

func (s *MediaService) CleanOrphanFiles(tenantID string) (int, error) {
	orphans, err := s.DetectOrphanFiles(tenantID)
	if err != nil {
		return 0, err
	}
	removed := 0
	for _, path := range orphans {
		if err := os.Remove(path); err == nil {
			removed++
		}
	}
	return removed, nil
}

func (s *MediaService) AnalyzeMedia(tenantID string, ids []uint, analysisType string) (map[string]interface{}, error) {
	analysisData := fmt.Sprintf("分析 %d 个媒体文件，类型: %s", len(ids), analysisType)
	result, err := s.aiService.Analyze(analysisData)
	if err != nil {
		return map[string]interface{}{
			"media_ids":     ids,
			"analysis_type": analysisType,
			"analysis":      "AI 分析服务暂时不可用",
			"tags":          []string{},
			"confidence":    0.0,
		}, nil
	}
	return map[string]interface{}{
		"media_ids":     ids,
		"analysis_type": analysisType,
		"analysis":      result,
		"confidence":    0.85,
	}, nil
}

type DefectAnalysisResult struct {
	MediaID  uint           `json:"media_id"`
	MediaURL string         `json:"media_url"`
	Width    int            `json:"width"`
	Height   int            `json:"height"`
	Defects  []DefectRegion `json:"defects"`
}

type DefectRegion struct {
	ID         string    `json:"id"`
	BBox       []float64 `json:"bbox"`
	DefectType string    `json:"defect_type"`
	Family     string    `json:"family"`
	Severity   string    `json:"severity"`
	Confidence float64   `json:"confidence"`
	Confirmed  bool      `json:"confirmed"`
}

func (s *MediaService) DefectAnalyzeMedia(tenantID string, ids []uint) ([]DefectAnalysisResult, error) {
	var results []DefectAnalysisResult
	for _, id := range ids {
		var media model.Media
		if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
			continue
		}
		relPath := media.Path
		if relPath == "" {
			relPath = fmt.Sprintf("media/%s/%s", tenantID, media.Filename)
		}
		filePath := filepath.Join(s.storagePath, relPath)
		imageData, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}
		filename := media.Filename
		detectionResp, err := s.aiService.DetectWithImage(fmt.Sprintf("media_%d", id), imageData, filename)
		if err != nil {
			results = append(results, DefectAnalysisResult{
				MediaID:  id,
				MediaURL: s.GetMediaURL(tenantID, media.Filename),
				Width:    0,
				Height:   0,
				Defects:  []DefectRegion{},
			})
			continue
		}
		defects := s.convertDetectionsToDefects(detectionResp)
		results = append(results, DefectAnalysisResult{
			MediaID:  id,
			MediaURL: s.GetMediaURL(tenantID, media.Filename),
			Width:    1920,
			Height:   1080,
			Defects:  defects,
		})
	}
	return results, nil
}

func (s *MediaService) convertDetectionsToDefects(resp map[string]interface{}) []DefectRegion {
	var defects []DefectRegion
	if objects, ok := resp["objects"].([]interface{}); ok {
		for i, obj := range objects {
			if objMap, ok := obj.(map[string]interface{}); ok {
				defect := DefectRegion{
					ID:         fmt.Sprintf("defect_%d", i+1),
					BBox:       []float64{0, 0, 0, 0},
					DefectType: "unknown",
					Family:     "structure",
					Severity:   "medium",
					Confidence: 0.5,
					Confirmed:  false,
				}
				if bbox, ok := objMap["bbox"].([]interface{}); ok && len(bbox) == 4 {
					for j, v := range bbox {
						if f, ok := v.(float64); ok {
							defect.BBox[j] = f
						}
					}
				}
				if class, ok := objMap["class"].(string); ok {
					defect.DefectType = s.mapClassToDefectType(class)
					defect.Family = s.getDefectFamily(class)
				} else if name, ok := objMap["name"].(string); ok {
					defect.DefectType = s.mapClassToDefectType(name)
					defect.Family = s.getDefectFamily(name)
				}
				if conf, ok := objMap["confidence"].(float64); ok {
					defect.Confidence = conf
				} else if prob, ok := objMap["probability"].(float64); ok {
					defect.Confidence = prob
				} else if prob, ok := objMap["prob"].(float64); ok {
					defect.Confidence = prob
				}
				defect.Severity = s.getSeverityFromConfidence(defect.Confidence)
				defects = append(defects, defect)
			}
		}
	}
	if detections, ok := resp["detections"].([]interface{}); ok {
		offset := len(defects)
		for i, det := range detections {
			if detMap, ok := det.(map[string]interface{}); ok {
				defect := DefectRegion{
					ID:         fmt.Sprintf("defect_%d", offset+i+1),
					BBox:       []float64{0, 0, 0, 0},
					DefectType: "unknown",
					Family:     "structure",
					Severity:   "medium",
					Confidence: 0.5,
					Confirmed:  false,
				}
				if bbox, ok := detMap["bbox"].([]interface{}); ok && len(bbox) == 4 {
					for j, v := range bbox {
						if f, ok := v.(float64); ok {
							defect.BBox[j] = f
						}
					}
				}
				if class, ok := detMap["class"].(string); ok {
					defect.DefectType = s.mapClassToDefectType(class)
					defect.Family = s.getDefectFamily(class)
				} else if name, ok := detMap["name"].(string); ok {
					defect.DefectType = s.mapClassToDefectType(name)
					defect.Family = s.getDefectFamily(name)
				}
				if conf, ok := detMap["confidence"].(float64); ok {
					defect.Confidence = conf
				}
				defect.Severity = s.getSeverityFromConfidence(defect.Confidence)
				defects = append(defects, defect)
			}
		}
	}
	return defects
}

func (s *MediaService) mapClassToDefectType(class string) string {
	classLower := strings.ToLower(class)
	if classLower == "person" || classLower == "intrusion" || classLower == "入侵" {
		return "intrusion"
	}
	if classLower == "fire" || classLower == "flame" || classLower == "火" || classLower == "火焰" {
		return "fire"
	}
	if classLower == "algae" || classLower == "蓝藻" {
		return "algae"
	}
	if classLower == "water_pollution" || classLower == "water" || classLower == "油污" {
		return "water_pollution"
	}
	if classLower == "waste" || classLower == "garbage" || classLower == "垃圾" || classLower == "固废" {
		return "waste_accumulation"
	}
	if classLower == "gas" || classLower == "gas_leak" || classLower == "气体泄漏" {
		return "gas_leak"
	}
	if classLower == "smoke" || classLower == "烟雾" {
		return "smoke"
	}
	if classLower == "crack" || classLower == "cracks" || classLower == "裂缝" {
		return "crack"
	}
	if classLower == "wall_damage" || classLower == "wall" || classLower == "墙损" {
		return "wall_damage"
	}
	if classLower == "stair_damage" || classLower == "stair" || classLower == "楼梯" {
		return "stair_damage"
	}
	if classLower == "corrosion" || classLower == "rust" || classLower == "腐蚀" {
		return "corrosion"
	}
	if classLower == "deformation" || classLower == "变形" {
		return "deformation"
	}
	if classLower == "seepage" || classLower == "渗水" || classLower == "leak" {
		return "seepage"
	}
	if classLower == "vehicle" || classLower == "car" || classLower == "车辆" {
		return "vehicle"
	}
	if classLower == "personnel" || classLower == "人员异常" {
		return "personnel"
	}
	if classLower == "meter" || classLower == "meter_abnormal" || classLower == "仪表" {
		return "meter_abnormal"
	}
	if classLower == "vibration" || classLower == "vibration_abnormal" || classLower == "振动" {
		return "vibration_abnormal"
	}
	if classLower == "temperature" || classLower == "temperature_exceed" || classLower == "温度" {
		return "temperature_exceed"
	}
	if classLower == "seal" || classLower == "seal_damage" || classLower == "密封" {
		return "seal_damage"
	}
	return classLower
}

func (s *MediaService) getDefectFamily(class string) string {
	classLower := strings.ToLower(class)
	if strings.Contains(classLower, "intrusion") || strings.Contains(classLower, "入侵") ||
		strings.Contains(classLower, "fire") || strings.Contains(classLower, "flame") ||
		strings.Contains(classLower, "火") {
		return "security"
	}
	if strings.Contains(classLower, "algae") || strings.Contains(classLower, "蓝藻") ||
		strings.Contains(classLower, "water") || strings.Contains(classLower, "pollution") ||
		strings.Contains(classLower, "油污") || strings.Contains(classLower, "waste") ||
		strings.Contains(classLower, "garbage") || strings.Contains(classLower, "垃圾") ||
		strings.Contains(classLower, "gas") || strings.Contains(classLower, "smoke") ||
		strings.Contains(classLower, "烟雾") {
		return "env"
	}
	if strings.Contains(classLower, "vehicle") || strings.Contains(classLower, "car") ||
		strings.Contains(classLower, "车辆") || strings.Contains(classLower, "personnel") ||
		strings.Contains(classLower, "meter") || strings.Contains(classLower, "仪表") ||
		strings.Contains(classLower, "vibration") || strings.Contains(classLower, "振动") ||
		strings.Contains(classLower, "temperature") || strings.Contains(classLower, "温度") ||
		strings.Contains(classLower, "seal") || strings.Contains(classLower, "密封") {
		return "equipment"
	}
	return "structure"
}

func (s *MediaService) getSeverityFromConfidence(confidence float64) string {
	if confidence >= 0.8 {
		return "high"
	} else if confidence >= 0.5 {
		return "medium"
	}
	return "low"
}

func (s *MediaService) GetMediaURL(tenantID, filename string) string {
	return fmt.Sprintf("/api/v1/media/files/%s/%s", tenantID, filename)
}

func (s *MediaService) GenerateReport(tenantID string, ids []uint, reportType string) (map[string]interface{}, error) {
	reportReq := map[string]interface{}{
		"title":       fmt.Sprintf("巡检报告 - %s", time.Now().Format("2006-01-02")),
		"report_type": reportType,
		"tenant_id":   tenantID,
		"stream_ids":  []string{},
	}
	reqJSON, _ := json.Marshal(reportReq)
	result, err := s.aiService.GenerateReport(string(reqJSON))
	if err != nil {
		return map[string]interface{}{
			"report_id":   fmt.Sprintf("rpt_%d", time.Now().Unix()),
			"media_ids":   ids,
			"report_type": reportType,
			"status":      "failed",
			"summary":     "AI 报告服务暂时不可用",
		}, nil
	}
	result["media_ids"] = ids
	result["report_type"] = reportType
	result["status"] = "generated"
	return result, nil
}

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
		"application/pdf":    true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
		"text/plain":      true,
		"text/csv":        true,
		"application/zip": true,
	}
	if knownDocTypes[mimeType] {
		return "document"
	}
	return "other"
}

var permissionLevels = map[string]int{
	"read":  1,
	"write": 2,
	"admin": 3,
}

func hasPermissionLevel(userPerm, requiredPerm string) bool {
	userLevel := permissionLevels[userPerm]
	requiredLevel := permissionLevels[requiredPerm]
	return userLevel >= requiredLevel
}

func (s *MediaService) CanAccessFolder(tenantID string, userID uint, folderID uint, requiredPerm string) (bool, error) {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", folderID, tenantID).First(&folder).Error; err != nil {
		return false, ErrNotFound
	}
	if folder.UserID == userID {
		return true, nil
	}
	if !folder.IsPrivate && requiredPerm == "read" {
		return true, nil
	}
	perm, err := s.GetUserPermission(folderID, userID)
	if err != nil || perm == nil {
		return false, nil
	}
	return hasPermissionLevel(perm.Permission, requiredPerm), nil
}

func (s *MediaService) GetUserPermission(folderID, userID uint) (*model.FolderPermission, error) {
	var perm model.FolderPermission
	err := s.db.Where("folder_id = ? AND user_id = ?", folderID, userID).First(&perm).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if perm.ExpiresAt != nil && perm.ExpiresAt.Before(time.Now()) {
		return nil, nil
	}
	return &perm, nil
}

func (s *MediaService) ListAccessibleFolders(tenantID string, userID uint) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	query := `
		SELECT DISTINCT mf.* FROM media_folders mf
		LEFT JOIN folder_permissions fp ON mf.id = fp.folder_id AND fp.user_id = ?
		WHERE mf.tenant_id = ?
		AND mf.parent_id IS NULL
		AND mf.deleted_at IS NULL
		AND (mf.user_id = ? OR fp.id IS NOT NULL OR mf.is_private = FALSE)
		ORDER BY mf.name ASC
	`
	if err := s.db.Raw(query, userID, tenantID, userID).Scan(&folders).Error; err != nil {
		return nil, fmt.Errorf("failed to list accessible folders: %w", err)
	}
	return folders, nil
}

func (s *MediaService) ListAccessibleSubFolders(tenantID string, userID uint, parentID uint) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	query := `
		SELECT DISTINCT mf.* FROM media_folders mf
		LEFT JOIN folder_permissions fp ON mf.id = fp.folder