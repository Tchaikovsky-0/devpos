package model

import "time"

type Alert struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	Level       string     `json:"level" gorm:"size:16;not null"` // INFO/WARN/CRIT/OFFLINE
	Type        string     `json:"type" gorm:"size:64;not null"`
	Title       string     `json:"title" gorm:"size:255;not null"`
	Message     string     `json:"message" gorm:"type:text"`
	Location    string     `json:"location" gorm:"size:255"`
	LAT         float64    `json:"lat" gorm:"type:decimal(10,6)"`
	LNG         float64    `json:"lng" gorm:"type:decimal(10,6)"`
	SensorData  string     `json:"sensor_data" gorm:"type:text"`
	Status      string     `json:"status" gorm:"size:32;default:'pending'"` // pending/resolved/false_alarm
	Acknowledged bool      `json:"acknowledged" gorm:"default:false"`
	StreamID    *uint      `json:"stream_id" gorm:"index"`
	TenantID    string     `json:"tenant_id" gorm:"size:64;index"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (Alert) TableName() string {
	return "alerts"
}
