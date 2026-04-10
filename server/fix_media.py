#!/usr/bin/env python3
"""Fix media library files on server"""
import subprocess
import os

def ssh_exec(cmd):
    result = subprocess.run(
        f"sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no -p 443 ubuntu@101.43.35.139 \"{cmd}\"",
        shell=True, capture_output=True, text=True
    )
    return result.stdout, result.stderr, result.returncode

# Write the service file using Python to avoid shell escaping
service_go = r'''package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

const maxBatchSize = 100
const maxFolderDepth = 5

type MediaService struct {
	db *gorm.DB
}

func NewMediaService(db *gorm.DB) *MediaService {
	return &MediaService{db: db}
}

func (s *MediaService) List(ctx context.Context, tenantID string, page, pageSize int, mediaType, folderID, search string, starred *bool, trashed bool) ([]model.Media, int64, error) {
	var media []model.Media
	var total int64

	query := s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ?", tenantID)

	if trashed {
		query = query.Where("trashed_at IS NOT NULL")
	} else {
		query = query.Where("trashed_at IS NULL")
	}

	if mediaType != "" {
		query = query.Where("type = ?", mediaType)
	}
	if folderID != "" {
		if folderID == "root" || folderID == "0" {
			query = query.Where("folder_id IS NULL")
		} else {
			query = query.Where("folder_id = ?", folderID)
		}
	}
	if search != "" {
		pattern := "%" + search + "%"
		query = query.Where("original_name LIKE ? OR name LIKE ? OR description LIKE ?", pattern, pattern, pattern)
	}
	if starred != nil && *starred {
		query = query.Where("starred = ?", true)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count media: %w", err)
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if offset > 1000 {
		return nil, 0, fmt.Errorf("深度分页限制：offset 不能超过 1000，请使用 Keyset Pagination")
	}

	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&media).Error
	return media, total, err
}

func (s *MediaService) GetByID(ctx context.Context, tenantID string, id uint) (*model.Media, error) {
	var media model.Media
	err := s.db.WithContext(ctx).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).First(&media, id).Error
	return &media, err
}

func (s *MediaService) Create(ctx context.Context, tenantID string, req *model.CreateMediaRequest) (*model.Media, error) {
	media := &model.Media{
		TenantID: tenantID,
		Name:     req.Name,
		URL:      req.URL,
		Type:     req.Type,
		MimeType: req.MimeType,
		Size:     req.Size,
		FolderID: req.FolderID,
		Tags:     req.Tags,
	}
	err := s.db.WithContext(ctx).Create(media).Error
	return media, err
}

func (s *MediaService) UploadFromFile(ctx context.Context, tenantID string, userID uint, originalName string, fileReader io.Reader, fileSize int64, mimeType string, folderID *uint) (*model.Media, error) {
	if fileSize > 100*1024*1024 {
		return nil, fmt.Errorf("文件大小超过限制（最大 100MB）")
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	ext := strings.ToLower(filepath.Ext(originalName))
	mediaType := detectMediaType(mimeType)
	name := strings.TrimSuffix(originalName, filepath.Ext(originalName))

	now := time.Now()
	dateDir := filepath.Join(uploadDir, tenantID, now.Format("2006"), now.Format("01"), now.Format("02"))
	if err := os.MkdirAll(dateDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload dir: %w", err)
	}

	timestamp := fmt.Sprintf("%d", now.UnixMilli())
	safeName := strings.Map(func(r rune) rune {
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, name)
	uniqueName := fmt.Sprintf("%s_%s", timestamp, safeName)
	if ext != "" {
		uniqueName = uniqueName + ext
	}

	filePath := filepath.Join(dateDir, uniqueName)
	tmpPath := filePath + ".tmp"

	dst, err := os.Create(tmpPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}

	written, copyErr := io.Copy(dst, io.LimitReader(fileReader, 100*1024*1024+1))
	dst.Close()

	if copyErr != nil {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("failed to save file: %w", copyErr)
	}
	if written > 100*1024*1024 {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("文件大小超过限制（最大 100MB）")
	}

	if err := os.Rename(tmpPath, filePath); err != nil {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("failed to finalize file: %w", err)
	}

	relPath := filepath.Join(tenantID, now.Format("2006"), now.Format("01"), now.Format("02"), uniqueName)
	url := "/uploads/" + filepath.ToSlash(relPath)

	sha256Hash, err := computeSHA256(filePath)
	if err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to compute file hash: %w", err)
	}

	var width, height int
	if mediaType == "image" {
		width, height = getImageDimensions(filePath)
	}

	media := &model.Media{
		TenantID:     tenantID,
		Name:         name,
		URL:          url,
		Type:         mediaType,
		MimeType:     mimeType,
		Size:         written,
		FolderID:     folderID,
		Filename:     uniqueName,
		OriginalName: originalName,
		Path:         filePath,
		UserID:       &userID,
		Width:        width,
		Height:       height,
	}

	tx := s.db.WithContext(ctx).Begin()
	if err := tx.Create(media).Error; err != nil {
		tx.Rollback()
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to create media record: %w", err)
	}

	var cfg model.TenantConfig
	if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("tenant_id = ?", tenantID).First(&cfg).Error; err == nil {
		newUsedMB := cfg.StorageUsedMB + (written / (1024 * 1024))
		if cfg.StorageQuotaMB > 0 && newUsedMB > cfg.StorageQuotaMB {
			tx.Rollback()
			os.Remove(filePath)
			return nil, fmt.Errorf("存储空间不足")
		}
		tx.Model(&model.TenantConfig{}).Where("tenant_id = ?", tenantID).Update("storage_used_mb", newUsedMB)
	}

	if err := tx.Commit().Error; err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return media, nil
}

func computeSHA256(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func getImageDimensions(filePath string) (int, int) {
	f, err := os.Open(filePath)
	if err != nil {
		return 0, 0
	}
	defer f.Close()

	config, _, err := image.DecodeConfig(f)
	if err != nil {
		return 0, 0
	}
	return config.Width, config.Height
}

func (s *MediaService) Update(ctx context.Context, tenantID string, id uint, req *model.UpdateMediaRequest) (*model.Media, error) {
	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Tags != nil {
		updates["tags"] = *req.Tags
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.FolderID != nil {
		updates["folder_id"] = *req.FolderID
	}

	if len(updates) == 0 {
		return s.GetByID(ctx, tenantID, id)
	}

	err := s.db.WithContext(ctx).Model(&model.Media{}).
		Where("tenant_id = ? AND id = ? AND trashed_at IS NULL", tenantID, id).
		Updates(updates).Error
	if err != nil {
		return nil, err
	}
	return s.GetByID(ctx, tenantID, id)
}

func (s *MediaService) Delete(ctx context.Context, tenantID string, id uint) error {
	var media model.Media
	if err := s.db.WithContext(ctx).Where("tenant_id = ? AND id = ? AND trashed_at IS NULL", tenantID, id).First(&media).Error; err != nil {
		return err
	}

	if media.Path != "" {
		os.Remove(media.Path)
	} else if strings.HasPrefix(media.URL, "/uploads/") {
		os.Remove("." + media.URL)
	}

	err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Delete(&model.Media{}, id).Error
	if err != nil {
		return err
	}

	s.updateStorageUsage(ctx, tenantID)
	return nil
}

func (s *MediaService) GetStatistics(ctx context.Context, tenantID string) (*model.MediaStatistics, error) {
	stats := &model.MediaStatistics{}
	s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).Count(&stats.TotalFiles)
	s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ? AND type = ? AND trashed_at IS NULL", tenantID, "image").Count(&stats.ImageCount)
	s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ? AND type = ? AND trashed_at IS NULL", tenantID, "video").Count(&stats.VideoCount)
	s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ? AND type IN ? AND trashed_at IS NULL", tenantID, []string{"document", "audio"}).Count(&stats.DocumentCount)

	var totalSizeBytes int64
	s.db.WithContext(ctx).Model(&model.Media{}).
		Select("COALESCE(SUM(size), 0)").
		Where("tenant_id = ? AND trashed_at IS NULL", tenantID).
		Scan(&totalSizeBytes)
	stats.TotalSizeMB = totalSizeBytes / (1024 * 1024)

	var cfg model.TenantConfig
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).First(&cfg).Error; err == nil {
		stats.StorageQuotaMB = cfg.StorageQuotaMB
		stats.StorageUsedMB = cfg.StorageUsedMB
	}

	return stats, nil
}

func (s *MediaService) GetStorageInfo(ctx context.Context, tenantID string) (*model.StorageInfo, error) {
	s.updateStorageUsage(ctx, tenantID)

	var cfg model.TenantConfig
	err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).First(&cfg).Error
	if err != nil {
		cfg.StorageQuotaMB = 10240
		cfg.StorageUsedMB = 0
	}

	var totalFiles int64
	if err := s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ? AND trashed_at IS NULL", tenantID).Count(&totalFiles).Error; err != nil {
		return nil, fmt.Errorf("count files: %w", err)
	}

	type typeCount struct {
		Type  string
		Count int64
	}
	var typeCounts []typeCount
	if err := s.db.WithContext(ctx).Model(&model.Media{}).
		Select("type, count(*) as count").
		Where("tenant_id = ? AND trashed_at IS NULL", tenantID).
		Group("type").
		Find(&typeCounts).Error; err != nil {
		return nil, fmt.Errorf("group by type: %w", err)
	}

	byType := make(map[string]int64)
	for _, tc := range typeCounts {
		byType[tc.Type] = tc.Count
	}

	quotaBytes := cfg.StorageQuotaMB * 1024 * 1024
	usedBytes := cfg.StorageUsedMB * 1024 * 1024
	usagePercent := 0.0
	if quotaBytes > 0 {
		usagePercent = float64(usedBytes) / float64(quotaBytes) * 100
	}
	usagePct := int(usagePercent)

	return &model.StorageInfo{
		QuotaMB:      cfg.StorageQuotaMB,
		UsedMB:       cfg.StorageUsedMB,
		UsagePct:     usagePct,
		QuotaBytes:   quotaBytes,
		UsedBytes:    usedBytes,
		UsagePercent: usagePercent,
		TotalFiles:   totalFiles,
		ByType:       byType,
	}, nil
}

func (s *MediaService) ListFolders(ctx context.Context, tenantID string, parentID string, userID uint, userRole string) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	query := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID)

	if userRole != "admin" {
		query = query.Where(
			"visibility = ? OR owner_id = ? OR (visibility = ? AND shared_users LIKE ?)",
			"public", userID, "shared", "%"+fmt.Sprintf("%d", userID)+"%",
		)
	}

	if parentID != "" {
		if parentID == "root" || parentID == "0" {
			query = query.Where("parent_id IS NULL")
		} else {
			query = query.Where("parent_id = ?", parentID)
		}
	}
	err := query.Order("name ASC").Find(&folders).Error
	return folders, err
}

func (s *MediaService) CreateFolder(ctx context.Context, tenantID string, userID uint, req *model.CreateFolderRequest) (*model.MediaFolder, error) {
	if len(req.Name) > 255 {
		return nil, fmt.Errorf("文件夹名称不能超过 255 个字符")
	}

	if req.ParentID != nil {
		depth, err := s.getFolderDepth(ctx, tenantID, *req.ParentID)
		if err != nil {
			return nil, err
		}
		if depth >= maxFolderDepth {
			return nil, fmt.Errorf("文件夹层级不能超过 %d 层", maxFolderDepth)
		}
	}

	folder := &model.MediaFolder{
		TenantID:   tenantID,
		Name:       req.Name,
		ParentID:   req.ParentID,
		OwnerID:    userID,
		Visibility: "private",
	}

	tx := s.db.WithContext(ctx).Begin()
	if err := tx.Create(folder).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("创建文件夹失败: %w", err)
	}

	perm := model.FolderPermission{
		TenantID:   tenantID,
		FolderID:   folder.ID,
		UserID:     userID,
		Permission: "admin",
		GrantedBy:  userID,
	}
	if err := tx.Create(&perm).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("创建文件夹权限失败: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("提交事务失败: %w", err)
	}

	return folder, nil
}

func (s *MediaService) getFolderDepth(ctx context.Context, tenantID string, folderID uint) (int, error) {
	depth := 0
	currentID := folderID
	visited := make(map[uint]bool)

	for currentID != 0 {
		if visited[currentID] {
			return 0, fmt.Errorf("检测到文件夹循环引用")
		}
		visited[currentID] = true

		var folder model.MediaFolder
		if err := s.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, currentID).First(&folder).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return depth, nil
			}
			return 0, fmt.Errorf("查询文件夹: %w", err)
		}

		depth++
		if folder.ParentID == nil {
			break
		}
		currentID = *folder.ParentID
	}
	return depth, nil
}

func (s *MediaService) UpdateFolder(ctx context.Context, tenantID string, id uint, req *model.UpdateFolderRequest) (*model.MediaFolder, error) {
	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.ParentID != nil {
		if *req.ParentID != 0 {
			depth, err := s.getFolderDepth(ctx, tenantID, *req.ParentID)
			if err != nil {
				return nil, err
			}
			if depth >= maxFolderDepth {
				return nil, fmt.Errorf("文件夹层级不能超过 %d 层", maxFolderDepth)
			}
		}
		updates["parent_id"] = *req.ParentID
	}

	err := s.db.WithContext(ctx).Model(&model.MediaFolder{}).
		Where("tenant_id = ? AND id = ?", tenantID, id).
		Updates(updates).Error
	if err != nil {
		return nil, err
	}
	var folder model.MediaFolder
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).First(&folder, id).Error; err != nil {
		return nil, err
	}
	return &folder, nil
}

func (s *MediaService) DeleteFolder(ctx context.Context, tenantID string, id uint) error {
	var childCount int64
	s.db.WithContext(ctx).Model(&model.MediaFolder{}).Where("tenant_id = ? AND parent_id = ?", tenantID, id).Count(&childCount)
	if childCount > 0 {
		return fmt.Errorf("文件夹不为空，请先删除子文件夹")
	}

	var mediaCount int64
	s.db.WithContext(ctx).Model(&model.Media{}).Where("tenant_id = ? AND folder_id = ?", tenantID, id).Count(&mediaCount)
	if mediaCount > 0 {
		return fmt.Errorf("文件夹中包含文件，请先移动或删除文件")
	}

	return s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Delete(&model.MediaFolder{}, id).Error
}

func (s *MediaService) GetFolderPermission(ctx context.Context, tenantID string, id uint) (*model.MediaFolder, error) {
	var folder model.MediaFolder
	err := s.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func (s *MediaService) UpdateFolderPermission(ctx context.Context, tenantID string, id uint, userID uint, userRole string, req *model.UpdateFolderPermissionRequest) (*model.MediaFolder, error) {
	var folder model.MediaFolder
	if err := s.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&folder).Error; err != nil {
		return nil, err
	}

	if folder.OwnerID != userID && userRole != "admin" {
		return nil, fmt.Errorf("permission denied")
	}

	updates := map[string]interface{}{}
	if req.Visibility != nil {
		updates["visibility"] = *req.Visibility
	}
	if req.SharedUsers != nil {
		updates["shared_users"] = *req.SharedUsers
	}

	if len(updates) > 0 {
		if err := s.db.WithContext(ctx).Model(&model.MediaFolder{}).
			Where("tenant_id = ? AND id = ?", tenantID, id).
			Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return s.GetFolderPermission(ctx, tenantID, id)
}

func (s *MediaService) updateStorageUsage(ctx context.Context, tenantID string) {
	var totalBytes int64
	s.db.WithContext(ctx).Model(&model.Media{}).
		Select("COALESCE(SUM(size), 0)").
		Where("tenant_id = ? AND trashed_at IS NULL", tenantID).
		Scan(&totalBytes)

	usedMB := totalBytes / (1024 * 1024)
	s.db.WithContext(ctx).Model(&model.TenantConfig{}).
		Where("tenant_id = ?", tenantID).
		Update("storage_used_mb", usedMB)
}

func (s *MediaService) ToggleStar(ctx context.Context, tenantID string, id uint) (*model.Media, error) {
	var media model.Media
	if err := s.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&media).Error; err != nil {
		return nil, fmt.Errorf("media not found: %w", err)
	}
	newVal := !media.Starred
	s.db.WithContext(ctx).Model(&media).Update("starred", newVal)
	media.Starred = newVal
	return &media, nil
}

func (s *MediaService) MoveToTrash(ctx context.Context, tenantID string, id uint) error {
	now := time.Now()
	return s.db.WithContext(ctx).Model(&model.Media{}).
		Where("tenant_id = ? AND id = ? AND trashed_at IS NULL", tenantID, id).
		Update("trashed_at", now).Error
}

func (s *MediaService) RestoreFromTrash(ctx context.Context, tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return fmt.Errorf("批量操作上限为 %d 个", maxBatchSize)
	}

	var totalSize int64
	s.db.WithContext(ctx).Model(&model.Media{}).
		Select("COALESCE(SUM(size), 0)").
		Where("tenant_id = ? AND id IN ? AND trashed_at IS NOT NULL", tenantID, ids).
		Scan(&totalSize)

	var cfg model.TenantConfig
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).First(&cfg).Error; err == nil {
		newUsedMB := cfg.StorageUsedMB + (totalSize / (1024 * 1024))
		if cfg.StorageQuotaMB > 0 && newUsedMB > cfg.StorageQuotaMB {
			return fmt.Errorf("存储空间不足，无法恢复文件")
		}
	}

	return s.db.WithContext(ctx).Model(&model.Media{}).
		Where("tenant_id = ? AND id IN ?", tenantID, ids).
		Update("trashed_at", nil).Error
}

func (s *MediaService) PermanentDelete(ctx context.Context, tenantID string, ids []uint) error {
	var mediaList []model.Media
	s.db.WithContext(ctx).Where("tenant_id = ? AND id IN ?", tenantID, ids).Find(&mediaList)

	for _, m := range mediaList {
		if m.Path != "" {
			if err := os.Remove(m.Path); err != nil && !os.IsNotExist(err) {
				fmt.Fprintf(os.Stderr, "failed to remove file %s: %v\n", m.Path, err)
			}
		} else if strings.HasPrefix(m.URL, "/uploads/") {
			if err := os.Remove("." + m.URL); err != nil && !os.IsNotExist(err) {
				fmt.Fprintf(os.Stderr, "failed to remove file %s: %v\n", m.URL, err)
			}
		}
	}

	err := s.db.WithContext(ctx).
		Where("tenant_id = ? AND id IN ?", tenantID, ids).
		Unscoped().
		Delete(&model.Media{}).Error
	if err == nil {
		s.updateStorageUsage(ctx, tenantID)
	}
	return err
}

func (s *MediaService) BatchMove(ctx context.Context, tenantID string, ids []uint, folderID *uint) error {
	if len(ids) > maxBatchSize {
		return fmt.Errorf("批量操作上限为 %d 个", maxBatchSize)
	}
	return s.db.WithContext(ctx).Model(&model.Media{}).
		Where("tenant_id = ? AND id IN ?", tenantID, ids).
		Update("folder_id", folderID).Error
}

func (s *MediaService) BatchDelete(ctx context.Context, tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return fmt.Errorf("批量操作上限为 %d 个", maxBatchSize)
	}
	for _, id := range ids {
		s.MoveToTrash(ctx, tenantID, id)
	}
	return nil
}

func (s *MediaService) GetFilePath(ctx context.Context, tenantID string, id uint) (physicalPath string, downloadName string, err error) {
	var media model.Media
	if err = s.db.WithContext(ctx).Where("tenant_id = ? AND id = ? AND trashed_at IS NULL AND deleted_at IS NULL", tenantID, id).First(&media).Error; err != nil {
		return "", "", fmt.Errorf("media not found: %w", err)
	}
	if media.Path != "" {
		return media.Path, media.OriginalName, nil
	}
	if strings.HasPrefix(media.URL, "/uploads/") {
		return "." + media.URL, media.OriginalName, nil
	}
	return "", "", fmt.Errorf("no local file path available")
}

func (s *MediaService) DetectOrphanFiles(ctx context.Context, tenantID string) ([]string, error) {
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	tenantDir := filepath.Join(uploadDir, tenantID)
	if _, err := os.Stat(tenantDir); os.IsNotExist(err) {
		return nil, nil
	}

	var allPaths []string
	if err := s.db.WithContext(ctx).Model(&model.Media{}).
		Where("tenant_id = ?", tenantID).
		Pluck("path", &allPaths).Error; err != nil {
		return nil, fmt.Errorf("query media paths: %w", err)
	}

	pathSet := make(map[string]bool)
	for _, p := range allPaths {
		pathSet[p] = true
	}

	var orphans []string
	filepath.Walk(tenantDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() || strings.HasSuffix(path, ".tmp") {
			return nil
		}
		if !pathSet[path] {
			orphans = append(orphans, path)
		}
		return nil
	})

	return orphans, nil
}

func (s *MediaService) CleanOrphanFiles(ctx context.Context, tenantID string) (int, error) {
	orphans, err := s.DetectOrphanFiles(ctx, tenantID)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, path := range orphans {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			fmt.Fprintf(os.Stderr, "failed to remove orphan %s: %v\n", path, err)
		} else {
			count++
		}
	}
	return count, nil
}

func (s *MediaService) SemanticDedupe(ctx context.Context, tenantID string, ids []uint) (*model.SemanticDedupeResult, error) {
	if len(ids) == 0 {
		return &model.SemanticDedupeResult{}, nil
	}
	if len(ids) > maxBatchSize {
		return nil, fmt.Errorf("批量操作上限为 %d 个", maxBatchSize)
	}

	var mediaList []model.Media
	if err := s.db.WithContext(ctx).Where("tenant_id = ? AND id IN ? AND type = ? AND trashed_at IS NULL", tenantID, ids, "image").Find(&mediaList).Error; err != nil {
		return nil, fmt.Errorf("查询文件: %w", err)
	}

	if len(mediaList) < 2 {
		return &model.SemanticDedupeResult{Kept: len(mediaList), Removed: 0, Groups: []model.SemanticDedupeGroup{}}, nil
	}

	phashes := make(map[uint]string)
	for _, m := range mediaList {
		phash, err := s.getImagePHash(ctx, m.Path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to get phash for %s: %v\n", m.Path, err)
			continue
		}
		phashes[m.ID] = phash
	}

	groups := s.groupByPHashSimilarity(phashes)

	var result model.SemanticDedupeResult
	var removedIDs []uint

	for _, group := range groups {
		if len(group) < 2 {
			continue
		}

		var best model.Media
		for _, m := range mediaList {
			for _, id := range group {
				if m.ID == id {
					if best.ID == 0 || m.Size > best.Size {
						best = m
					}
				}
			}
		}

		var removedInfo []map[string]interface{}
		var groupRemovedIDs []uint
		for _, m := range mediaList {
			for _, id := range group {
				if m.ID == id && m.ID != best.ID {
					groupRemovedIDs = append(groupRemovedIDs, m.ID)
					removedInfo = append(removedInfo, map[string]interface{}{
						"id":     m.ID,
						"name":   m.OriginalName,
						"url":    m.URL,
						"size":   m.Size,
						"width":  m.Width,
						"height": m.Height,
					})
				}
			}
		}

		result.Groups = append(result.Groups, model.SemanticDedupeGroup{
			KeptID:      best.ID,
			KeptName:    best.OriginalName,
			KeptURL:     best.URL,
			RemovedIDs:  groupRemovedIDs,
			RemovedInfo: removedInfo,
			Similarity:  0.85,
			Reason:      "AI 识别为同一缺陷的相似照片",
		})

		removedIDs = append(removedIDs, groupRemovedIDs...)
		result.Kept++
		result.Removed += len(groupRemovedIDs)
	}

	if len(removedIDs) > 0 {
		now := time.Now()
		s.db.WithContext(ctx).Model(&model.Media{}).
			Where("tenant_id = ? AND id IN ?", tenantID, removedIDs).
			Update("trashed_at", now)
	}

	return &result, nil
}

func (s *MediaService) getImagePHash(ctx context.Context, filePath string) (string, error) {
	aiURL := os.Getenv("AI_SERVICE_URL")
	if aiURL == "" {
		aiURL = "http://xunjianbao-ai:8095"
	}

	body := &strings.Builder{}
	writer := multipart.NewWriter(body)

	f, err := os.Open(filePath)
	if err != nil {
		return "", err
	}

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		f.Close()
		return "", err
	}

	_, err = io.Copy(part, f)
	f.Close()
	if err != nil {
		return "", err
	}

	writer.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", aiURL+"/api/v1/image/phash", strings.NewReader(body.String()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("AI service returned %d", resp.StatusCode)
	}

	var result struct {
		PHash string `json:"phash"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.PHash, nil
}

func (s *MediaService) groupByPHashSimilarity(phashes map[uint]string) [][]uint {
	ids := make([]uint, 0, len(phashes))
	for id := range phashes {
		ids = append(ids, id)
	}

	visited := make(map[uint]bool)
	var groups [][]uint

	for i, id1 := range ids {
		if visited[id1] {
			continue
		}

		group := []uint{id1}
		visited[id1] = true

		for j := i + 1; j < len(ids); j++ {
			id2 := ids[j]
			if visited[id2] {
				continue
			}

			distance := hammingDistance(phashes[id1], phashes[id2])
			if distance <= 10 {
				group = append(group, id2)
				visited[id2] = true
			}
		}

		if len(group) > 1 {
			groups = append(groups, group)
		}
	}

	return groups
}

func hammingDistance(h1, h2 string) int {
	if len(h1) != len(h2) {
		return 64
	}

	b1, _ := hex.DecodeString(h1)
	b2, _ := hex.DecodeString(h2)

	distance := 0
	for i := range b1 {
		x := b1[i] ^ b2[i]
		for x > 0 {
			distance += int(x & 1)
			x >>= 1
		}
	}
	return distance
}

func detectMediaType(mimeType string) string {
	mimeType = strings.ToLower(mimeType)
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		return "image"
	case strings.HasPrefix(mimeType, "video/"):
		return "video"
	case strings.HasPrefix(mimeType, "audio/"):
		return "audio"
	default:
		return "document"
	}
}
'''

# Write service file
with open('/tmp/service_media.go', 'w') as f:
    f.write(service_go)

print(f"Service file written: {len(service_go)} bytes")
