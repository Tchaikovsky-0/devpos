package model

import "time"

type TenantConfig struct {
	ID                   uint   `json:"id" gorm:"primaryKey"`
	TenantID             string `json:"tenant_id" gorm:"size:64;uniqueIndex;not null"`
	TenantName           string `json:"tenant_name" gorm:"size:255"`
	Logo                 string `json:"logo" gorm:"size:512"`
	StorageQuota         int64  `json:"storage_quota" gorm:"default:10737418240"` // 10GB default
	StorageUsed          int64  `json:"storage_used" gorm:"default:0"`
	MaxDevices           int    `json:"max_devices" gorm:"default:100"`
	AIEnabled            bool   `json:"ai_enabled" gorm:"default:true"`
	AIModel              string `json:"ai_model" gorm:"size:64;default:'yolov8n'"`
	DetectionSensitivity string `json:"detection_sensitivity" gorm:"size:16;default:'medium'"` // low/medium/high
	AlertEmail           bool   `json:"alert_notifications_email" gorm:"default:true"`
	AlertSMS             bool   `json:"alert_notifications_sms" gorm:"default:false"`
	AlertPush            bool   `json:"alert_notifications_push" gorm:"default:true"`
	FeatureLiveStreaming bool   `json:"feature_live_streaming" gorm:"default:true"`
	FeatureCloudRecord   bool   `json:"feature_cloud_recording" gorm:"default:true"`
	FeatureAIDetection   bool   `json:"feature_ai_detection" gorm:"default:true"`
	FeatureReports       bool   `json:"feature_reports" gorm:"default:true"`
	FeatureAPIAccess     bool   `json:"feature_api_access" gorm:"default:false"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (TenantConfig) TableName() string {
	return "tenant_configs"
}
