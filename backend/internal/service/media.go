package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const (
	defaultMaxUploadSize int64 = 100 * 1024 * 1024       // 100 MB
	defaultStorageQuota  int64 = 10 * 1024 * 1024 * 1024 // 10 GB
	maxBatchSize               = 100
	maxFolderDepth             = 5
	trashRetentionDays         = 30
)

// allowedMIMETypes is the whitelist of MIME types accepted for upload.
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

// blockedExtensions are dangerous executable extensions that must be rejected.
var blockedExtensions = map[string]bool{
	".exe": true, ".sh": true, ".bat": true, ".cmd": true, ".ps1": true,
	".msi": true, ".com": true, ".scr": true, ".pif": true, ".vbs": true,
}

// ---------------------------------------------------------------------------
// StorageInfo DTO
// ---------------------------------------------------------------------------

// StorageInfo describes a tenant's storage usage.
type StorageInfo struct {
	QuotaBytes   int64   `json:"quota_bytes"`
	UsedBytes    int64   `json:"used_bytes"`
	UsagePercent float64 `json:"usage_percent"`
	TotalFiles   int64   `json:"total_files"`
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// File Validation Helpers
// ---------------------------------------------------------------------------

// maxUploadSize returns the configured maximum upload size in bytes.
func maxUploadSize() int64 {
	return getEnvInt64("MAX_UPLOAD_SIZE", defaultMaxUploadSize)
}

// ValidateFileSize checks that the file does not exceed the maximum upload size.
func ValidateFileSize(size int64) error {
	if size > maxUploadSize() {
		return ErrFileTooLarge
	}
	return nil
}

// ValidateFileType validates the MIME type by reading magic bytes from the file
// header. It also rejects blocked executable extensions.
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

	// Read first 512 bytes for MIME detection
	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("failed to read file header: %w", err)
	}
	detectedType := http.DetectContentType(buf[:n])

	// application/octet-stream is too generic – fall back to Content-Type header
	if detectedType == "application/octet-stream" {
		detectedType = file.Header.Get("Content-Type")
	}

	if !allowedMIMETypes[detectedType] {
		return detectedType, ErrInvalidFileType
	}
	return detectedType, nil
}

// sanitizeFilename removes path traversal characters and returns a safe name.
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

// secureRandomString generates a cryptographically random hex string.
func secureRandomString(nBytes int) string {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		// Fallback – should never happen
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

// computeSHA256 computes the SHA256 hash of a file for deduplication.
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

// ---------------------------------------------------------------------------
// Quota Management
// ---------------------------------------------------------------------------

// GetStorageUsage returns the tenant's current storage usage.
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

// CheckQuota verifies the tenant has enough storage for fileSize bytes.
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

// ---------------------------------------------------------------------------
// List / Get
// ---------------------------------------------------------------------------

// ListMediaFiles returns a paginated list of media files.
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

// ListTrash returns paginated trashed files.
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

// GetMediaByID retrieves a single media record with tenant isolation.
func (s *MediaService) GetMediaByID(tenantID, id string) (*model.Media, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return nil, ErrNotFound
	}
	return &media, nil
}

// ---------------------------------------------------------------------------
// Upload (Hardened)
// ---------------------------------------------------------------------------

// UploadFile uploads a single file with atomic write, magic-byte validation,
// quota checks, and cleanup-on-failure semantics.
func (s *MediaService) UploadFile(tenantID string, userID uint, file *multipart.FileHeader, folderID *uint, description string) (*model.Media, error) {
	// 1. Validate size
	if err := ValidateFileSize(file.Size); err != nil {
		return nil, err
	}

	// 2. Validate type via magic bytes
	detectedMIME, err := ValidateFileType(file)
	if err != nil {
		return nil, err
	}

	// 3. Check quota
	if err := s.CheckQuota(tenantID, file.Size); err != nil {
		return nil, err
	}

	// 4. Open uploaded file for reading
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	// 5. Prepare storage path: uploads/media/{tenant_id}/{YYYY-MM}/{uuid}.ext
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

	// 6. Atomic write: write to .tmp then rename
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

	// 7. Build URL (never expose physical path)
	relPath := filepath.Join("media", tenantID, yearMonth, finalName)
	url := "/api/v1/media/files/" + strings.ReplaceAll(relPath, "\\", "/")

	mediaType := getMediaType(detectedMIME)

	// 8. Compute SHA256 hash for deduplication
	sha256Hash, _ := computeSHA256(finalPath)

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

	// 9. Database insert – cleanup file on failure
	if err := s.db.Create(media).Error; err != nil {
		os.Remove(finalPath)
		return nil, fmt.Errorf("failed to save media record: %w", err)
	}

	// 10. Update tenant storage usage
	if err := s.db.Model(&model.TenantConfig{}).
		Where("tenant_id = ?", tenantID).
		UpdateColumn("storage_used", gorm.Expr("storage_used + ?", written)).Error; err != nil {
		// Non-fatal: log but don't fail the upload
		fmt.Fprintf(os.Stderr, "media: failed to update storage_used for tenant %s: %v\n", tenantID, err)
	}

	return media, nil
}

// ---------------------------------------------------------------------------
// Delete / Trash
// ---------------------------------------------------------------------------

// DeleteFile permanently removes a media file and its physical storage.
func (s *MediaService) DeleteFile(tenantID, id string) error {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return ErrNotFound
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		// Soft delete the record
		if err := tx.Delete(&media).Error; err != nil {
			return fmt.Errorf("failed to delete media record: %w", err)
		}

		// Update storage usage
		if err := tx.Model(&model.TenantConfig{}).
			Where("tenant_id = ?", tenantID).
			UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used - ?, 0)", media.Size)).Error; err != nil {
			return fmt.Errorf("failed to update storage usage: %w", err)
		}

		// Remove physical file (best-effort, don't fail the transaction)
		if media.Path != "" {
			if err := os.Remove(media.Path); err != nil && !os.IsNotExist(err) {
				fmt.Fprintf(os.Stderr, "media: failed to remove file %s: %v\n", media.Path, err)
			}
		}
		return nil
	})
}

// MoveToTrash moves a media file to the trash bin.
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

// RestoreFromTrash restores files from the trash bin.
func (s *MediaService) RestoreFromTrash(tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return ErrBatchLimitExceeded
	}
	result := s.db.Model(&model.Media{}).
		Where("id IN ? AND tenant_id = ? AND trashed_at IS NOT NULL", ids, tenantID).
		Update("trashed_at", nil)
	if result.Error != nil {
		return fmt.Errorf("failed to restore from trash: %w", result.Error)
	}
	return nil
}

// PermanentDeleteTrash permanently deletes trashed files and their physical storage.
func (s *MediaService) PermanentDeleteTrash(tenantID string, ids []uint) error {
	if len(ids) > maxBatchSize {
		return ErrBatchLimitExceeded
	}

	// Fetch files first to get paths and sizes
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

		// Update storage usage
		if totalSize > 0 {
			if err := tx.Model(&model.TenantConfig{}).
				Where("tenant_id = ?", tenantID).
				UpdateColumn("storage_used", gorm.Expr("GREATEST(storage_used - ?, 0)", totalSize)).Error; err != nil {
				return fmt.Errorf("failed to update storage usage: %w", err)
			}
		}

		// Remove physical files (best-effort)
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

// CleanExpiredTrash permanently deletes trash older than trashRetentionDays.
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

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------

// GetFilePath returns the physical path and original name for download.
// It enforces tenant isolation.
func (s *MediaService) GetFilePath(tenantID, id string) (string, string, string, error) {
	var media model.Media
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
		return "", "", "", ErrNotFound
	}
	return media.Path, media.OriginalName, media.MimeType, nil
}

// GetStoragePath returns the base storage path.
func (s *MediaService) GetStoragePath() string {
	return s.storagePath
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

// UpdateMedia updates a media file's metadata.
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

// ToggleStar toggles the starred status of a media file.
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

// ---------------------------------------------------------------------------
// Batch Operations (with limits and transactions)
// ---------------------------------------------------------------------------

// BatchMove moves multiple files to a target folder atomically.
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

// BatchDelete soft-deletes multiple files atomically.
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

// DedupeResult represents the result of a batch deduplication operation.
type DedupeResult struct {
	Kept    int          `json:"kept"`
	Removed int          `json:"removed"`
	Groups  []DedupeGroup `json:"groups"`
}

// DedupeGroup represents a group of duplicate files.
type DedupeGroup struct {
	Hash       string   `json:"hash"`
	KeptID    uint     `json:"kept_id"`
	RemovedIDs []uint  `json:"removed_ids"`
}

// BatchDedupe finds and removes duplicate media files based on SHA256 hash.
// For each group of duplicates, keeps the file with the smallest ID and
// moves the rest to trash.
func (s *MediaService) BatchDedupe(tenantID string, ids []uint) (*DedupeResult, error) {
	if len(ids) > maxBatchSize {
		return nil, ErrBatchLimitExceeded
	}

	// 1. Fetch media records with their hashes
	var mediaList []model.Media
	if err := s.db.Where("id IN ? AND tenant_id = ? AND trashed_at IS NULL AND sha256_hash != ''", ids, tenantID).
		Order("id ASC").Find(&mediaList).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch media: %w", err)
	}

	// 2. Group by hash
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
			continue // Not a duplicate
		}
		// Keep the first (smallest ID due to ORDER BY id ASC)
		kept := items[0]
		removed := items[1:]
		for _, m := range removed {
			duplicateIDs = append(duplicateIDs, m.ID)
		}
		result.Groups = append(result.Groups, DedupeGroup{
			Hash:       hash,
			KeptID:     kept.ID,
			RemovedIDs: func() []uint { ids := make([]uint, len(removed)); for i, m := range removed { ids[i] = m.ID }; return ids }(),
		})
	}

	result.Kept = len(mediaList) - len(duplicateIDs)
	result.Removed = len(duplicateIDs)

	// 3. Move duplicates to trash
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

// ---------------------------------------------------------------------------
// Folder Management (Hardened)
// ---------------------------------------------------------------------------

// ListFolders returns folders for a given parent.
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

// ListAllFolders returns all folders for a tenant (used for breadcrumb navigation).
func (s *MediaService) ListAllFolders(tenantID string) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder
	if err := s.db.Where("tenant_id = ?", tenantID).Order("name ASC").Find(&folders).Error; err != nil {
		return nil, fmt.Errorf("failed to list all folders: %w", err)
	}
	return folders, nil
}

// CreateFolder creates a new folder with name uniqueness and depth checks.
func (s *MediaService) CreateFolder(tenantID string, userID uint, req CreateMediaFolderRequest) (*model.MediaFolder, error) {
	// Check name uniqueness in the same parent
	if err := s.checkFolderNameUnique(tenantID, req.Name, req.ParentID, 0); err != nil {
		return nil, err
	}

	// Check depth limit
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
		TenantID: tenantID,
		Name:     req.Name,
		ParentID: req.ParentID,
		UserID:   userID,
		IsPrivate: true, // 默认私有
	}
	if err := s.db.Create(folder).Error; err != nil {
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}

	// 创建者自动获得 admin 权限
	perm := &model.FolderPermission{
		FolderID:   folder.ID,
		UserID:     userID,
		Permission: "admin",
		GrantedBy:  userID,
	}
	s.db.Create(perm)

	return folder, nil
}

// UpdateFolder updates folder name/parent with cycle and depth checks.
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
		// Prevent moving a folder into its own subtree
		if err := s.checkFolderCycle(tenantID, folder.ID, *req.ParentID); err != nil {
			return nil, err
		}
		// Check depth after move
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

// DeleteFolder deletes a folder. It refuses to delete non-empty folders.
func (s *MediaService) DeleteFolder(tenantID, id string) error {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&folder).Error; err != nil {
		return ErrNotFound
	}

	// Check for child folders
	var childCount int64
	if err := s.db.Model(&model.MediaFolder{}).Where("parent_id = ? AND tenant_id = ?", folder.ID, tenantID).
		Count(&childCount).Error; err != nil {
		return fmt.Errorf("failed to check child folders: %w", err)
	}
	if childCount > 0 {
		return ErrFolderNotEmpty
	}

	// Check for files in folder
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

// --- Folder helper functions ---

// checkFolderNameUnique ensures no sibling folder has the same name.
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

// getFolderDepth returns the depth of a folder (0 for root-level folders).
func (s *MediaService) getFolderDepth(tenantID string, folderID uint) (int, error) {
	depth := 0
	currentID := folderID
	visited := make(map[uint]bool)

	for {
		var folder model.MediaFolder
		if err := s.db.Where("id = ? AND tenant_id = ?", currentID, tenantID).First(&folder).Error; err != nil {
			return depth, nil // folder not found, treat as root
		}
		depth++
		if folder.ParentID == nil {
			return depth, nil
		}
		if visited[*folder.ParentID] {
			return depth, nil // cycle detected, stop
		}
		visited[currentID] = true
		currentID = *folder.ParentID
	}
}

// checkFolderCycle prevents moving a folder into its own subtree.
func (s *MediaService) checkFolderCycle(tenantID string, folderID, newParentID uint) error {
	if folderID == newParentID {
		return ErrFolderCycle
	}
	currentID := newParentID
	visited := make(map[uint]bool)
	for {
		var parent model.MediaFolder
		if err := s.db.Where("id = ? AND tenant_id = ?", currentID, tenantID).First(&parent).Error; err != nil {
			return nil // reached root
		}
		if parent.ID == folderID {
			return ErrFolderCycle
		}
		if parent.ParentID == nil {
			return nil
		}
		if visited[*parent.ParentID] {
			return nil
		}
		visited[currentID] = true
		currentID = *parent.ParentID
	}
}

// getSubtreeMaxDepth returns the maximum depth of children below a folder.
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

// ---------------------------------------------------------------------------
// Storage Info (enriched)
// ---------------------------------------------------------------------------

// GetStorageInfo returns storage statistics for a tenant.
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

	// Trash stats
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

// ---------------------------------------------------------------------------
// Orphan File Detection
// ---------------------------------------------------------------------------

// DetectOrphanFiles finds physical files that have no corresponding database record.
func (s *MediaService) DetectOrphanFiles(tenantID string) ([]string, error) {
	baseDir := filepath.Join(s.storagePath, "media", tenantID)
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		return nil, nil
	}

	var orphans []string
	err := filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // skip errors
		}
		if info.IsDir() {
			return nil
		}
		// Skip tmp files
		if strings.HasSuffix(path, ".tmp") {
			return nil
		}

		var count int64
		if dbErr := s.db.Model(&model.Media{}).Where("path = ? AND tenant_id = ?", path, tenantID).
			Count(&count).Error; dbErr != nil {
			return nil // skip db errors
		}
		if count == 0 {
			orphans = append(orphans, path)
		}
		return nil
	})
	return orphans, err
}

// CleanOrphanFiles removes orphan files from disk.
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

// ---------------------------------------------------------------------------
// AI Analysis & Report (unchanged from original)
// ---------------------------------------------------------------------------

// AnalyzeMedia triggers AI analysis on selected media files.
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

// DefectAnalysisResult represents a single defect region detected in an image
type DefectAnalysisResult struct {
	MediaID   uint              `json:"media_id"`
	MediaURL  string            `json:"media_url"`
	Width     int               `json:"width"`
	Height    int               `json:"height"`
	Defects   []DefectRegion   `json:"defects"`
}

// DefectRegion represents a detected defect region with bounding box
type DefectRegion struct {
	ID          string  `json:"id"`
	BBox        []float64 `json:"bbox"`        // [x1, y1, x2, y2] normalized 0-1
	DefectType  string  `json:"defect_type"`
	Family      string  `json:"family"`
	Severity    string  `json:"severity"`
	Confidence  float64 `json:"confidence"`
	Confirmed   bool    `json:"confirmed"`
}

// DefectAnalyzeMedia performs AI defect analysis on selected media files.
// It reads each image, sends it to the Python AI service for YOLO detection,
// and returns structured defect regions with bounding boxes.
func (s *MediaService) DefectAnalyzeMedia(tenantID string, ids []uint) ([]DefectAnalysisResult, error) {
	var results []DefectAnalysisResult

	for _, id := range ids {
		// Get media file from database
		var media model.Media
		if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&media).Error; err != nil {
			continue // Skip files that don't exist or don't belong to tenant
		}

		// Build file path - use Path field from Media model
		relPath := media.Path
		if relPath == "" {
			relPath = fmt.Sprintf("media/%s/%s", tenantID, media.Filename)
		}
		filePath := filepath.Join(s.storagePath, relPath)

		// Read image file
		imageData, err := os.ReadFile(filePath)
		if err != nil {
			continue // Skip files that can't be read
		}

		// Call AI service for detection
		filename := media.Filename
		detectionResp, err := s.aiService.DetectWithImage(fmt.Sprintf("media_%d", id), imageData, filename)
		if err != nil {
			// Return empty result on error (graceful degradation)
			results = append(results, DefectAnalysisResult{
				MediaID:  id,
				MediaURL: s.GetMediaURL(tenantID, media.Filename),
				Width:    0,
				Height:   0,
				Defects:  []DefectRegion{},
			})
			continue
		}

		// Parse detection response and convert to defect regions
		defects := s.convertDetectionsToDefects(detectionResp)

		results = append(results, DefectAnalysisResult{
			MediaID:  id,
			MediaURL: s.GetMediaURL(tenantID, media.Filename),
			Width:    1920, // Default, would need image parsing to get real dimensions
			Height:   1080,
			Defects:  defects,
		})
	}

	return results, nil
}

// convertDetectionsToDefects converts AI detection response to DefectRegion format
func (s *MediaService) convertDetectionsToDefects(resp map[string]interface{}) []DefectRegion {
	var defects []DefectRegion

	// Parse "objects" array from detection response (YOLO format)
	if objects, ok := resp["objects"].([]interface{}); ok {
		for i, obj := range objects {
			if objMap, ok := obj.(map[string]interface{}); ok {
				defect := DefectRegion{
					ID:          fmt.Sprintf("defect_%d", i+1),
					BBox:        []float64{0, 0, 0, 0},
					DefectType:  "unknown",
					Family:      "structure",
					Severity:    "medium",
					Confidence:  0.5,
					Confirmed:   false,
				}

				// Extract bounding box [x1, y1, x2, y2] normalized 0-1
				if bbox, ok := objMap["bbox"].([]interface{}); ok && len(bbox) == 4 {
					for j, v := range bbox {
						if f, ok := v.(float64); ok {
							defect.BBox[j] = f
						}
					}
				}

				// Extract class/name
				if class, ok := objMap["class"].(string); ok {
					defect.DefectType = s.mapClassToDefectType(class)
					defect.Family = s.getDefectFamily(class)
				} else if name, ok := objMap["name"].(string); ok {
					defect.DefectType = s.mapClassToDefectType(name)
					defect.Family = s.getDefectFamily(name)
				}

				// Extract confidence
				if conf, ok := objMap["confidence"].(float64); ok {
					defect.Confidence = conf
				} else if prob, ok := objMap["probability"].(float64); ok {
					defect.Confidence = prob
				} else if prob, ok := objMap["prob"].(float64); ok {
					defect.Confidence = prob
				}

				// Set severity based on confidence
				defect.Severity = s.getSeverityFromConfidence(defect.Confidence)

				defects = append(defects, defect)
			}
		}
	}

	// Also check "detections" array (alternative format)
	if detections, ok := resp["detections"].([]interface{}); ok {
		offset := len(defects)
		for i, det := range detections {
			if detMap, ok := det.(map[string]interface{}); ok {
				defect := DefectRegion{
					ID:          fmt.Sprintf("defect_%d", offset+i+1),
					BBox:        []float64{0, 0, 0, 0},
					DefectType:  "unknown",
					Family:      "structure",
					Severity:    "medium",
					Confidence:  0.5,
					Confirmed:   false,
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

// mapClassToDefectType maps YOLO class names to defect types
func (s *MediaService) mapClassToDefectType(class string) string {
	classLower := strings.ToLower(class)

	// Security
	if classLower == "person" || classLower == "intrusion" || classLower == "入侵" {
		return "intrusion"
	}
	if classLower == "fire" || classLower == "flame" || classLower == "火" || classLower == "火焰" {
		return "fire"
	}

	// Environment
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

	// Structure
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

	// Equipment
	if classLower == "vehicle" || classLower == "car" || classLower == "车辆" {
		return "vehicle"
	}
	if classLower == "person" || classLower == "personnel" || classLower == "人员异常" {
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

	// Default: use class as-is
	return classLower
}

// getDefectFamily determines the defect family from class name
func (s *MediaService) getDefectFamily(class string) string {
	classLower := strings.ToLower(class)

	// Security family
	if strings.Contains(classLower, "intrusion") || strings.Contains(classLower, "入侵") ||
		strings.Contains(classLower, "fire") || strings.Contains(classLower, "flame") ||
		strings.Contains(classLower, "火") {
		return "security"
	}

	// Environment family
	if strings.Contains(classLower, "algae") || strings.Contains(classLower, "蓝藻") ||
		strings.Contains(classLower, "water") || strings.Contains(classLower, "pollution") ||
		strings.Contains(classLower, "油污") || strings.Contains(classLower, "waste") ||
		strings.Contains(classLower, "garbage") || strings.Contains(classLower, "垃圾") ||
		strings.Contains(classLower, "gas") || strings.Contains(classLower, "smoke") ||
		strings.Contains(classLower, "烟雾") {
		return "env"
	}

	// Equipment family
	if strings.Contains(classLower, "vehicle") || strings.Contains(classLower, "car") ||
		strings.Contains(classLower, "车辆") || strings.Contains(classLower, "personnel") ||
		strings.Contains(classLower, "meter") || strings.Contains(classLower, "仪表") ||
		strings.Contains(classLower, "vibration") || strings.Contains(classLower, "振动") ||
		strings.Contains(classLower, "temperature") || strings.Contains(classLower, "温度") ||
		strings.Contains(classLower, "seal") || strings.Contains(classLower, "密封") {
		return "equipment"
	}

	// Default to structure
	return "structure"
}

// getSeverityFromConfidence determines severity level from confidence score
func (s *MediaService) getSeverityFromConfidence(confidence float64) string {
	if confidence >= 0.8 {
		return "high"
	} else if confidence >= 0.5 {
		return "medium"
	}
	return "low"
}

// GetMediaURL returns the URL path for a media file
func (s *MediaService) GetMediaURL(tenantID, filename string) string {
	return fmt.Sprintf("/api/v1/media/files/%s/%s", tenantID, filename)
}

// GenerateReport generates an AI-powered inspection report.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// getMediaType maps MIME type to a media category.
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

// ---------------------------------------------------------------------------
// Folder Permission Management
// ---------------------------------------------------------------------------

// Permission levels: admin > write > read
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

// CanAccessFolder checks if a user can access a folder with the required permission level.
func (s *MediaService) CanAccessFolder(tenantID string, userID uint, folderID uint, requiredPerm string) (bool, error) {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", folderID, tenantID).First(&folder).Error; err != nil {
		return false, ErrNotFound
	}

	// 1. Creator always has admin permission
	if folder.UserID == userID {
		return true, nil
	}

	// 2. Public folder (IsPrivate=false) - anyone in tenant can read
	if !folder.IsPrivate && requiredPerm == "read" {
		return true, nil
	}

	// 3. Check permission table for private folders
	perm, err := s.GetUserPermission(folderID, userID)
	if err != nil || perm == nil {
		return false, nil
	}

	return hasPermissionLevel(perm.Permission, requiredPerm), nil
}

// GetUserPermission gets a user's permission for a specific folder.
func (s *MediaService) GetUserPermission(folderID, userID uint) (*model.FolderPermission, error) {
	var perm model.FolderPermission
	err := s.db.Where("folder_id = ? AND user_id = ?", folderID, userID).First(&perm).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	// Check expiration
	if perm.ExpiresAt != nil && perm.ExpiresAt.Before(time.Now()) {
		return nil, nil
	}
	return &perm, nil
}

// ListAccessibleFolders returns all root folders (parent_id IS NULL) the user can access.
// This includes: folders they created, folders shared with them, and public folders.
func (s *MediaService) ListAccessibleFolders(tenantID string, userID uint) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder

	// Query: folders where user is creator OR folder is shared OR folder is public
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

// ListAccessibleSubFolders returns all sub-folders the user can access under a specific parent.
func (s *MediaService) ListAccessibleSubFolders(tenantID string, userID uint, parentID uint) ([]model.MediaFolder, error) {
	var folders []model.MediaFolder

	query := `
		SELECT DISTINCT mf.* FROM media_folders mf
		LEFT JOIN folder_permissions fp ON mf.id = fp.folder_id AND fp.user_id = ?
		WHERE mf.tenant_id = ?
		AND mf.parent_id = ?
		AND mf.deleted_at IS NULL
		AND (mf.user_id = ? OR fp.id IS NOT NULL OR mf.is_private = FALSE)
		ORDER BY mf.name ASC
	`
	if err := s.db.Raw(query, userID, tenantID, parentID, userID).Scan(&folders).Error; err != nil {
		return nil, fmt.Errorf("failed to list accessible sub-folders: %w", err)
	}
	return folders, nil
}

// ListFolderPermissions returns all permissions for a folder.
func (s *MediaService) ListFolderPermissions(folderID uint) ([]model.FolderPermission, error) {
	var perms []model.FolderPermission
	if err := s.db.Preload("User").Where("folder_id = ?", folderID).Find(&perms).Error; err != nil {
		return nil, fmt.Errorf("failed to list permissions: %w", err)
	}
	return perms, nil
}

// GrantFolderPermission grants a user access to a folder.
func (s *MediaService) GrantFolderPermission(folderID, userID, grantedBy uint, permission string) (*model.FolderPermission, error) {
	// Check if permission already exists
	var existing model.FolderPermission
	err := s.db.Where("folder_id = ? AND user_id = ?", folderID, userID).First(&existing).Error
	if err == nil {
		// Update existing permission
		existing.Permission = permission
		existing.GrantedBy = grantedBy
		if err := s.db.Save(&existing).Error; err != nil {
			return nil, fmt.Errorf("failed to update permission: %w", err)
		}
		return &existing, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check existing permission: %w", err)
	}

	// Create new permission
	perm := &model.FolderPermission{
		FolderID:   folderID,
		UserID:     userID,
		Permission: permission,
		GrantedBy:  grantedBy,
	}
	if err := s.db.Create(perm).Error; err != nil {
		return nil, fmt.Errorf("failed to grant permission: %w", err)
	}
	return perm, nil
}

// RevokeFolderPermission removes a user's access to a folder.
func (s *MediaService) RevokeFolderPermission(folderID, userID uint) error {
	result := s.db.Where("folder_id = ? AND user_id = ?", folderID, userID).Delete(&model.FolderPermission{})
	if result.Error != nil {
		return fmt.Errorf("failed to revoke permission: %w", result.Error)
	}
	return nil
}

// UpdateFolderPermission updates a user's permission level for a folder.
func (s *MediaService) UpdateFolderPermission(folderID, userID uint, permission string) error {
	result := s.db.Model(&model.FolderPermission{}).
		Where("folder_id = ? AND user_id = ?", folderID, userID).
		Update("permission", permission)
	if result.Error != nil {
		return fmt.Errorf("failed to update permission: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// SetFolderPublic sets whether a folder is public or private.
func (s *MediaService) SetFolderPublic(tenantID, folderID string, isPublic bool) error {
	result := s.db.Model(&model.MediaFolder{}).
		Where("id = ? AND tenant_id = ?", folderID, tenantID).
		Update("is_private", !isPublic)
	if result.Error != nil {
		return fmt.Errorf("failed to set folder public: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// GetFolderByID retrieves a folder by ID with tenant isolation.
func (s *MediaService) GetFolderByID(tenantID, folderID string) (*model.MediaFolder, error) {
	var folder model.MediaFolder
	if err := s.db.Where("id = ? AND tenant_id = ?", folderID, tenantID).First(&folder).Error; err != nil {
		return nil, ErrNotFound
	}
	return &folder, nil
}

// GetAccessibleChildren returns all child folders the user can access.
func (s *MediaService) GetAccessibleChildren(tenantID string, userID uint, parentID uint) ([]model.MediaFolder, error) {
	// If user has access to parent, they can see children if they have access to parent
	// For simplicity, we check access for each child individually
	var allChildren []model.MediaFolder
	if err := s.db.Where("tenant_id = ? AND parent_id = ?", tenantID, parentID).Find(&allChildren).Error; err != nil {
		return nil, err
	}

	var accessible []model.MediaFolder
	for _, child := range allChildren {
		canAccess, _ := s.CanAccessFolder(tenantID, userID, child.ID, "read")
		if canAccess {
			accessible = append(accessible, child)
		}
	}
	return accessible, nil
}
