package model

import (
	"time"

	"gorm.io/gorm"
)

// AlertRule defines a rule that, when matched, creates an Alert and triggers notification actions.
type AlertRule struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TenantID    string         `json:"tenant_id" gorm:"size:64;index;not null"`
	Name        string         `json:"name" gorm:"size:128;not null"`
	Description string         `json:"description" gorm:"type:text"`
	Type        string         `json:"type" gorm:"size:64;not null"`                       // yolo_detection, sensor_threshold, stream_offline, custom
	Conditions  string         `json:"conditions" gorm:"type:text;not null"`               // JSON-encoded AlertRuleCondition
	Actions     string         `json:"actions" gorm:"type:text;not null"`                  // JSON-encoded []AlertRuleAction
	Severity    string         `json:"severity" gorm:"size:16;not null;default:'warning'"` // info, warning, critical
	Enabled     bool           `json:"enabled" gorm:"default:true"`
	CooldownSec int            `json:"cooldown_sec" gorm:"default:300"`
	LastFiredAt *time.Time     `json:"last_fired_at"`
	CreatedBy   uint           `json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (AlertRule) TableName() string {
	return "alert_rules"
}

// AlertRuleCondition describes the trigger condition for a rule.
type AlertRuleCondition struct {
	Metric    string  `json:"metric"`   // temperature, humidity, yolo_fire, yolo_intrusion, stream_status
	Operator  string  `json:"operator"` // gt, lt, eq, ne, contains
	Threshold float64 `json:"threshold"`
	Duration  int     `json:"duration"` // seconds the condition must persist
}

// AlertRuleAction describes a notification action to execute when the rule fires.
type AlertRuleAction struct {
	Type   string `json:"type"`   // email, dingtalk, wechat, webhook
	Target string `json:"target"` // email address / webhook URL / group ID
	Config string `json:"config"` // extra config JSON
}
