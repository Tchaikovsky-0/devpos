package service

import (
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

type SensorService struct {
	db *gorm.DB
}

func NewSensorService(db *gorm.DB) *SensorService {
	return &SensorService{db: db}
}

type CreateSensorRequest struct {
	Name         string  `json:"name" binding:"required"`
	Type         string  `json:"type" binding:"required"`
	Location     string  `json:"location"`
	Unit         string  `json:"unit"`
	MinThreshold float64 `json:"min_threshold"`
	MaxThreshold float64 `json:"max_threshold"`
	StreamID     *uint   `json:"stream_id"`
	Description  string  `json:"description"`
}

type UpdateSensorRequest struct {
	Name         *string  `json:"name"`
	Type         *string  `json:"type"`
	Location     *string  `json:"location"`
	Status       *string  `json:"status"`
	Unit         *string  `json:"unit"`
	MinThreshold *float64 `json:"min_threshold"`
	MaxThreshold *float64 `json:"max_threshold"`
	Description  *string  `json:"description"`
}

func (s *SensorService) List(tenantID string, sensorType string, status string, p pagination.Params) ([]model.Sensor, int64, error) {
	var sensors []model.Sensor
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	if sensorType != "" {
		query = query.Where("type = ?", sensorType)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Model(&model.Sensor{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&sensors).Error; err != nil {
		return nil, 0, err
	}

	return sensors, total, nil
}

func (s *SensorService) GetByID(tenantID, id string) (*model.Sensor, error) {
	var sensor model.Sensor
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&sensor).Error; err != nil {
		return nil, ErrNotFound
	}
	return &sensor, nil
}

func (s *SensorService) Create(tenantID string, req CreateSensorRequest) (*model.Sensor, error) {
	sensor := &model.Sensor{
		TenantID:     tenantID,
		Name:         req.Name,
		Type:         req.Type,
		Location:     req.Location,
		Status:       "online",
		Unit:         req.Unit,
		MinThreshold: req.MinThreshold,
		MaxThreshold: req.MaxThreshold,
		StreamID:     req.StreamID,
		Description:  req.Description,
	}

	if err := s.db.Create(sensor).Error; err != nil {
		return nil, err
	}

	return sensor, nil
}

func (s *SensorService) Update(tenantID, id string, req UpdateSensorRequest) (*model.Sensor, error) {
	var sensor model.Sensor
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&sensor).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Unit != nil {
		updates["unit"] = *req.Unit
	}
	if req.MinThreshold != nil {
		updates["min_threshold"] = *req.MinThreshold
	}
	if req.MaxThreshold != nil {
		updates["max_threshold"] = *req.MaxThreshold
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	if len(updates) > 0 {
		s.db.Model(&sensor).Updates(updates)
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&sensor)
	return &sensor, nil
}

func (s *SensorService) Delete(tenantID, id string) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.Sensor{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

func (s *SensorService) GetSensorData(tenantID, id string, p pagination.Params) ([]model.SensorData, int64, error) {
	var data []model.SensorData
	var total int64

	query := s.db.Where("sensor_id = ? AND tenant_id = ?", id, tenantID)
	query.Model(&model.SensorData{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&data).Error; err != nil {
		return nil, 0, err
	}

	return data, total, nil
}
