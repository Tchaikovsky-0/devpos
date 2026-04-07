package service

import (
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

type StreamService struct {
	db *gorm.DB
}

func NewStreamService(db *gorm.DB) *StreamService {
	return &StreamService{db: db}
}

type CreateStreamRequest struct {
	Name        string  `json:"name" binding:"required"`
	Type        string  `json:"type" binding:"required"`
	URL         string  `json:"url"`
	Location    string  `json:"location"`
	LAT         float64 `json:"lat"`
	LNG         float64 `json:"lng"`
	Description string  `json:"description"`
	IsActive    *bool   `json:"is_active"`
	Protocol    string  `json:"protocol"`
	StreamURL   string  `json:"stream_url"`
	Username    string  `json:"username"`
	Password    string  `json:"password"`
}

type UpdateStreamRequest struct {
	Name        *string  `json:"name"`
	Type        *string  `json:"type"`
	URL         *string  `json:"url"`
	Location    *string  `json:"location"`
	LAT         *float64 `json:"lat"`
	LNG         *float64 `json:"lng"`
	Description *string  `json:"description"`
	IsActive    *bool    `json:"is_active"`
	Status      *string  `json:"status"`
	Protocol    *string  `json:"protocol"`
	StreamURL   *string  `json:"stream_url"`
	Username    *string  `json:"username"`
	Password    *string  `json:"password"`
}

func (s *StreamService) List(tenantID string, p pagination.Params) ([]model.Stream, int64, error) {
	var streams []model.Stream
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	query.Model(&model.Stream{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&streams).Error; err != nil {
		return nil, 0, err
	}

	return streams, total, nil
}

func (s *StreamService) GetByID(tenantID, id string) (*model.Stream, error) {
	var stream model.Stream
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&stream).Error; err != nil {
		return nil, ErrNotFound
	}
	return &stream, nil
}

func (s *StreamService) Create(tenantID string, req CreateStreamRequest) (*model.Stream, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	protocol := req.Protocol
	if protocol == "" {
		protocol = "rtsp"
	}

	streamURL := req.StreamURL
	if streamURL == "" {
		streamURL = req.URL
	}

	stream := &model.Stream{
		Name:         req.Name,
		Type:         req.Type,
		URL:          req.URL,
		Location:     req.Location,
		LAT:          req.LAT,
		LNG:          req.LNG,
		Description:  req.Description,
		IsActive:     isActive,
		Status:       "offline",
		TenantID:     tenantID,
		Protocol:     protocol,
		StreamURL:    streamURL,
		Username:     req.Username,
		Password:     req.Password,
		HealthStatus: "unknown",
	}

	if err := s.db.Create(stream).Error; err != nil {
		return nil, err
	}

	return stream, nil
}

func (s *StreamService) Update(tenantID, id string, req UpdateStreamRequest) (*model.Stream, error) {
	var stream model.Stream
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&stream).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.URL != nil {
		updates["url"] = *req.URL
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.LAT != nil {
		updates["lat"] = *req.LAT
	}
	if req.LNG != nil {
		updates["lng"] = *req.LNG
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Protocol != nil {
		updates["protocol"] = *req.Protocol
	}
	if req.StreamURL != nil {
		updates["stream_url"] = *req.StreamURL
	}
	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.Password != nil {
		updates["password"] = *req.Password
	}

	if len(updates) > 0 {
		s.db.Model(&stream).Updates(updates)
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&stream)
	return &stream, nil
}

func (s *StreamService) Delete(tenantID, id string) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.Stream{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

func (s *StreamService) Statistics(tenantID string) (map[string]interface{}, error) {
	var total int64
	var online int64
	var offline int64
	var warning int64

	s.db.Model(&model.Stream{}).Where("tenant_id = ?", tenantID).Count(&total)
	s.db.Model(&model.Stream{}).Where("tenant_id = ? AND status = ?", tenantID, "online").Count(&online)
	s.db.Model(&model.Stream{}).Where("tenant_id = ? AND status = ?", tenantID, "offline").Count(&offline)
	s.db.Model(&model.Stream{}).Where("tenant_id = ? AND status = ?", tenantID, "warning").Count(&warning)

	return map[string]interface{}{
		"total":   total,
		"online":  online,
		"offline": offline,
		"warning": warning,
	}, nil
}
