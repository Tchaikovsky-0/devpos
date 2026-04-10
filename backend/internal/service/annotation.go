package service

import (
	"context"
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

// AnnotationService handles annotation CRUD operations.
type AnnotationService struct {
	db *gorm.DB
}

// NewAnnotationService creates a new AnnotationService.
func NewAnnotationService(db *gorm.DB) *AnnotationService {
	return &AnnotationService{db: db}
}

// CreateAnnotation creates a new annotation.
func (s *AnnotationService) CreateAnnotation(ctx context.Context, tenantID string, userID uint, req *model.CreateAnnotationRequest) (*model.Annotation, error) {
	tagsJSON := ""
	if len(req.Tags) > 0 {
		data, err := json.Marshal(req.Tags)
		if err != nil {
			return nil, err
		}
		tagsJSON = string(data)
	}

	annotation := &model.Annotation{
		MediaID:        req.MediaID,
		UserID:         userID,
		TenantID:       tenantID,
		AnnotationType: req.AnnotationType,
		Content:        req.Content,
		BBox:           req.BBox,
		Tags:           tagsJSON,
		Notes:          req.Notes,
	}

	if err := s.db.WithContext(ctx).Create(annotation).Error; err != nil {
		return nil, err
	}

	return annotation, nil
}

// ListAnnotations returns annotations for a given media file.
func (s *AnnotationService) ListAnnotations(ctx context.Context, tenantID string, mediaID uint) ([]model.Annotation, error) {
	var annotations []model.Annotation
	if err := s.db.WithContext(ctx).
		Where("tenant_id = ? AND media_id = ? AND deleted_at IS NULL", tenantID, mediaID).
		Order("created_at DESC").
		Find(&annotations).Error; err != nil {
		return nil, err
	}
	return annotations, nil
}

// GetAnnotation returns a single annotation by ID.
func (s *AnnotationService) GetAnnotation(ctx context.Context, tenantID string, id uint) (*model.Annotation, error) {
	var annotation model.Annotation
	if err := s.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).
		First(&annotation).Error; err != nil {
		return nil, err
	}
	return &annotation, nil
}

// UpdateAnnotation updates an existing annotation.
func (s *AnnotationService) UpdateAnnotation(ctx context.Context, tenantID string, id uint, req *model.UpdateAnnotationRequest) (*model.Annotation, error) {
	annotation, err := s.GetAnnotation(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.BBox != "" {
		updates["bbox"] = req.BBox
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.AnnotationType != "" {
		updates["annotation_type"] = req.AnnotationType
	}
	if req.Tags != nil {
		tagsJSON, err := json.Marshal(req.Tags)
		if err != nil {
			return nil, err
		}
		updates["tags"] = string(tagsJSON)
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := s.db.WithContext(ctx).Model(annotation).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return s.GetAnnotation(ctx, tenantID, id)
}

// DeleteAnnotation soft-deletes an annotation.
func (s *AnnotationService) DeleteAnnotation(ctx context.Context, tenantID string, id uint) error {
	return s.db.WithContext(ctx).
		Model(&model.Annotation{}).
		Where("id = ? AND tenant_id = ? AND deleted_at IS NULL", id, tenantID).
		Update("deleted_at", time.Now()).Error
}

// GetAnnotationsByUser returns annotations created by a specific user.
func (s *AnnotationService) GetAnnotationsByUser(ctx context.Context, tenantID string, userID uint, page, pageSize int) ([]model.Annotation, int64, error) {
	var annotations []model.Annotation
	var total int64

	q := s.db.WithContext(ctx).Model(&model.Annotation{}).
		Where("tenant_id = ? AND user_id = ? AND deleted_at IS NULL", tenantID, userID)

	q.Count(&total)
	if err := q.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&annotations).Error; err != nil {
		return nil, 0, err
	}

	return annotations, total, nil
}

// GetAnnotationStats returns annotation statistics for a tenant.
func (s *AnnotationService) GetAnnotationStats(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	var total int64
	s.db.WithContext(ctx).Model(&model.Annotation{}).
		Where("tenant_id = ? AND deleted_at IS NULL", tenantID).
		Count(&total)

	var byType []struct {
		AnnotationType string
		Count          int64
	}
	s.db.WithContext(ctx).Table("annotations").
		Select("annotation_type, COUNT(*) as count").
		Where("tenant_id = ? AND deleted_at IS NULL", tenantID).
		Group("annotation_type").
		Find(&byType)

	return map[string]interface{}{
		"total":   total,
		"by_type": byType,
	}, nil
}
