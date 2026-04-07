package service

import (
	"fmt"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

type ReportService struct {
	db *gorm.DB
}

func NewReportService(db *gorm.DB) *ReportService {
	return &ReportService{db: db}
}

type CreateReportRequest struct {
	Type    string `json:"type" binding:"required"`
	Title   string `json:"title" binding:"required"`
	Content string `json:"content"`
}

type UpdateReportRequest struct {
	Title   *string `json:"title"`
	Status  *string `json:"status"`
	Content *string `json:"content"`
	FileURL *string `json:"file_url"`
}

func (s *ReportService) List(tenantID string, reportType string, p pagination.Params) ([]model.Report, int64, error) {
	var reports []model.Report
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	if reportType != "" {
		query = query.Where("type = ?", reportType)
	}

	query.Model(&model.Report{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&reports).Error; err != nil {
		return nil, 0, err
	}

	return reports, total, nil
}

func (s *ReportService) GetByID(tenantID, id string) (*model.Report, error) {
	var report model.Report
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&report).Error; err != nil {
		return nil, ErrNotFound
	}
	return &report, nil
}

func (s *ReportService) Create(tenantID string, req CreateReportRequest) (*model.Report, error) {
	report := &model.Report{
		TenantID: tenantID,
		Type:     req.Type,
		Title:    req.Title,
		Content:  req.Content,
		Status:   "pending",
	}

	if err := s.db.Create(report).Error; err != nil {
		return nil, err
	}

	return report, nil
}

func (s *ReportService) Update(tenantID, id string, req UpdateReportRequest) (*model.Report, error) {
	var report model.Report
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&report).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.FileURL != nil {
		updates["file_url"] = *req.FileURL
	}

	if len(updates) > 0 {
		s.db.Model(&report).Updates(updates)
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&report)
	return &report, nil
}

func (s *ReportService) Delete(tenantID, id string) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.Report{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

func (s *ReportService) Export(tenantID, id string) (map[string]interface{}, error) {
	var report model.Report
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&report).Error; err != nil {
		return nil, ErrNotFound
	}

	return map[string]interface{}{
		"download_url": report.FileURL,
		"filename":     fmt.Sprintf("report_%s_%d.pdf", report.Type, report.ID),
		"format":       "pdf",
		"report":       report,
	}, nil
}
