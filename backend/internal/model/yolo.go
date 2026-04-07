package model

import "time"

// YOLODetection 存储每次 YOLO 检测的完整结果
type YOLODetection struct {
	ID             string    `json:"id" gorm:"primaryKey;size:64"`
	StreamID       string    `json:"stream_id" gorm:"size:64;index"`
	TenantID       string    `json:"tenant_id" gorm:"size:64;index"`
	DetectionType  string    `json:"detection_type" gorm:"size:64;index"` // fire/person/vehicle/crack/intrusion/smoke 等
	Confidence     float64   `json:"confidence" gorm:"type:decimal(5,4)"`
	BoundingBox    string    `json:"bounding_box" gorm:"type:json"`             // JSON: [x1,y1,x2,y2]
	Objects        string    `json:"objects" gorm:"type:json"`                  // 完整检测对象列表 JSON
	ImagePath      string    `json:"image_path" gorm:"size:512"`                // 检测截图存储路径
	ProcessingTime float64   `json:"processing_time" gorm:"type:decimal(10,4)"` // 推理耗时 ms
	ModelName      string    `json:"model_name" gorm:"size:128"`                // 使用的模型名称
	ProcessedBy    string    `json:"processed_by" gorm:"size:32"`               // "yolo-service" | "mock"
	Timestamp      time.Time `json:"timestamp" gorm:"index"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (YOLODetection) TableName() string {
	return "yolo_detections"
}
