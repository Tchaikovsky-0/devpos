package model

import "time"

type YOLODetection struct {
	ID             string    `json:"id" gorm:"primaryKey;size:64"`
	StreamID       string    `json:"stream_id" gorm:"size:64;index"`
	Timestamp      time.Time `json:"timestamp" gorm:"index"`
	Objects        string    `json:"objects" gorm:"type:json"` // 检测到的对象
	ProcessingTime float64   `json:"processing_time" gorm:"type:decimal(10,4)"`
	Confidence     float64   `json:"confidence" gorm:"type:decimal(5,4)"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (YOLODetection) TableName() string {
	return "yolo_detections"
}
