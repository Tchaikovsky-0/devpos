package service

import (
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

type AlertService struct {
	db    *gorm.DB
	wsHub *WebSocketHub
}

func NewAlertService(db *gorm.DB, wsHub *WebSocketHub) *AlertService {
	return &AlertService{db: db, wsHub: wsHub}
}

type CreateAlertRequest struct {
	Level      string  `json:"level" binding:"required"`
	Type       string  `json:"type" binding:"required"`
	Title      string  `json:"title" binding:"required"`
	Message    string  `json:"message"`
	Location   string  `json:"location"`
	LAT        float64 `json:"lat"`
	LNG        float64 `json:"lng"`
	SensorData string  `json:"sensor_data"`
	StreamID   *uint   `json:"stream_id"`
}

type UpdateAlertRequest struct {
	Status       *string `json:"status"`
	Acknowledged *bool   `json:"acknowledged"`
	Level        *string `json:"level"`
	Title        *string `json:"title"`
	Message      *string `json:"message"`
}

func (s *AlertService) List(tenantID, level, status, keyword string, p pagination.Params) ([]model.Alert, int64, error) {
	var alerts []model.Alert
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	if level != "" {
		query = query.Where("level = ?", level)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		query = query.Where("title LIKE ? OR message LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Model(&model.Alert{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&alerts).Error; err != nil {
		return nil, 0, err
	}

	return alerts, total, nil
}

func (s *AlertService) GetByID(tenantID, id string) (*model.Alert, error) {
	var alert model.Alert
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&alert).Error; err != nil {
		return nil, ErrNotFound
	}
	return &alert, nil
}

func (s *AlertService) Create(tenantID string, req CreateAlertRequest) (*model.Alert, error) {
	alert := &model.Alert{
		Level:      req.Level,
		Type:       req.Type,
		Title:      req.Title,
		Message:    req.Message,
		Location:   req.Location,
		LAT:        req.LAT,
		LNG:        req.LNG,
		SensorData: req.SensorData,
		StreamID:   req.StreamID,
		TenantID:   tenantID,
		Status:     "pending",
	}

	if err := s.db.Create(alert).Error; err != nil {
		return nil, err
	}

	// 通过 WebSocket 广播新告警
	if s.wsHub != nil {
		s.wsHub.BroadcastToTenant(tenantID, "alert", map[string]interface{}{
			"id":         alert.ID,
			"level":      alert.Level,
			"type":       alert.Type,
			"title":      alert.Title,
			"message":    alert.Message,
			"stream_id":  alert.StreamID,
			"location":   alert.Location,
			"created_at": alert.CreatedAt,
		})
	}

	return alert, nil
}

func (s *AlertService) Update(tenantID, id string, req UpdateAlertRequest) (*model.Alert, error) {
	var alert model.Alert
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&alert).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Acknowledged != nil {
		updates["acknowledged"] = *req.Acknowledged
	}
	if req.Level != nil {
		updates["level"] = *req.Level
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Message != nil {
		updates["message"] = *req.Message
	}

	if len(updates) > 0 {
		s.db.Model(&alert).Updates(updates)
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&alert)
	return &alert, nil
}

func (s *AlertService) Delete(tenantID, id string) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.Alert{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

func (s *AlertService) Statistics(tenantID string) (map[string]interface{}, error) {
	var total int64
	var pending int64
	var resolved int64
	var critical int64

	s.db.Model(&model.Alert{}).Where("tenant_id = ?", tenantID).Count(&total)
	s.db.Model(&model.Alert{}).Where("tenant_id = ? AND status = ?", tenantID, "pending").Count(&pending)
	s.db.Model(&model.Alert{}).Where("tenant_id = ? AND status = ?", tenantID, "resolved").Count(&resolved)
	s.db.Model(&model.Alert{}).Where("tenant_id = ? AND level = ?", tenantID, "CRIT").Count(&critical)

	return map[string]interface{}{
		"total":    total,
		"pending":  pending,
		"resolved": resolved,
		"critical": critical,
	}, nil
}
