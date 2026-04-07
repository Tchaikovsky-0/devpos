package service

import (
	"math/rand"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

type TenantConfigService struct {
	db *gorm.DB
}

func NewTenantConfigService(db *gorm.DB) *TenantConfigService {
	return &TenantConfigService{db: db}
}

type UpdateConfigRequest struct {
	TenantName           *string `json:"tenant_name"`
	Logo                 *string `json:"logo"`
	AIEnabled            *bool   `json:"ai_enabled"`
	AIModel              *string `json:"ai_model"`
	DetectionSensitivity *string `json:"detection_sensitivity"`
	AlertEmail           *bool   `json:"alert_notifications_email"`
	AlertSMS             *bool   `json:"alert_notifications_sms"`
	AlertPush            *bool   `json:"alert_notifications_push"`
}

type UpdateFeaturesRequest struct {
	FeatureLiveStreaming *bool `json:"feature_live_streaming"`
	FeatureCloudRecord  *bool `json:"feature_cloud_recording"`
	FeatureAIDetection  *bool `json:"feature_ai_detection"`
	FeatureReports      *bool `json:"feature_reports"`
	FeatureAPIAccess    *bool `json:"feature_api_access"`
}

func (s *TenantConfigService) Get(tenantID string) (*model.TenantConfig, error) {
	var config model.TenantConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		// Auto-create default config
		config = model.TenantConfig{
			TenantID: tenantID,
		}
		s.db.Create(&config)
	}
	return &config, nil
}

func (s *TenantConfigService) Update(tenantID string, req UpdateConfigRequest) (*model.TenantConfig, error) {
	var config model.TenantConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.TenantName != nil {
		updates["tenant_name"] = *req.TenantName
	}
	if req.Logo != nil {
		updates["logo"] = *req.Logo
	}
	if req.AIEnabled != nil {
		updates["ai_enabled"] = *req.AIEnabled
	}
	if req.AIModel != nil {
		updates["ai_model"] = *req.AIModel
	}
	if req.DetectionSensitivity != nil {
		updates["detection_sensitivity"] = *req.DetectionSensitivity
	}
	if req.AlertEmail != nil {
		updates["alert_notifications_email"] = *req.AlertEmail
	}
	if req.AlertSMS != nil {
		updates["alert_notifications_sms"] = *req.AlertSMS
	}
	if req.AlertPush != nil {
		updates["alert_notifications_push"] = *req.AlertPush
	}

	if len(updates) > 0 {
		s.db.Model(&config).Updates(updates)
	}

	s.db.Where("tenant_id = ?", tenantID).First(&config)
	return &config, nil
}

func (s *TenantConfigService) GetStorage(tenantID string) (map[string]interface{}, error) {
	var config model.TenantConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		return nil, ErrNotFound
	}

	return map[string]interface{}{
		"quota":      config.StorageQuota,
		"used":       config.StorageUsed,
		"percentage": float64(config.StorageUsed) / float64(config.StorageQuota) * 100,
	}, nil
}

func (s *TenantConfigService) GetDevices(tenantID string) (map[string]interface{}, error) {
	var total int64
	var online int64
	s.db.Model(&model.Stream{}).Where("tenant_id = ?", tenantID).Count(&total)
	s.db.Model(&model.Stream{}).Where("tenant_id = ? AND status = ?", tenantID, "online").Count(&online)

	return map[string]interface{}{
		"total":   total,
		"online":  online,
		"offline": total - online,
	}, nil
}

func (s *TenantConfigService) GetUsageStatistics(tenantID, period string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"alerts_this_month":    rand.Intn(100),
		"detections_this_month": rand.Intn(500),
		"reports_this_month":   rand.Intn(20),
		"storage_trend":        []map[string]interface{}{},
		"period":               period,
	}, nil
}

func (s *TenantConfigService) GetFeatures(tenantID string) (*model.TenantConfig, error) {
	return s.Get(tenantID)
}

func (s *TenantConfigService) UpdateFeatures(tenantID string, req UpdateFeaturesRequest) (*model.TenantConfig, error) {
	var config model.TenantConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.FeatureLiveStreaming != nil {
		updates["feature_live_streaming"] = *req.FeatureLiveStreaming
	}
	if req.FeatureCloudRecord != nil {
		updates["feature_cloud_recording"] = *req.FeatureCloudRecord
	}
	if req.FeatureAIDetection != nil {
		updates["feature_ai_detection"] = *req.FeatureAIDetection
	}
	if req.FeatureReports != nil {
		updates["feature_reports"] = *req.FeatureReports
	}
	if req.FeatureAPIAccess != nil {
		updates["feature_api_access"] = *req.FeatureAPIAccess
	}

	if len(updates) > 0 {
		s.db.Model(&config).Updates(updates)
	}

	s.db.Where("tenant_id = ?", tenantID).First(&config)
	return &config, nil
}
