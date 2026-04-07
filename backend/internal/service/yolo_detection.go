package service

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

// YOLODetectionService 管理 YOLO 检测结果的持久化和查询
type YOLODetectionService struct {
	db *gorm.DB
}

// NewYOLODetectionService 创建 YOLO 检测结果服务
func NewYOLODetectionService(db *gorm.DB) *YOLODetectionService {
	return &YOLODetectionService{db: db}
}

// SaveDetection 保存单条检测结果到数据库
func (s *YOLODetectionService) SaveDetection(detection *model.YOLODetection) error {
	if detection.ID == "" {
		detection.ID = generateUUID()
	}
	if detection.Timestamp.IsZero() {
		detection.Timestamp = time.Now()
	}
	return s.db.Create(detection).Error
}

// SaveDetectionsFromPayload 从 WebSocket 推送的 payload 批量保存检测结果
func (s *YOLODetectionService) SaveDetectionsFromPayload(tenantID, streamID string, detections []DetectionObject, processedBy string, processingTimeMs float64, modelName string) error {
	if len(detections) == 0 {
		return nil
	}

	// 序列化完整检测对象列表
	objectsJSON, err := json.Marshal(detections)
	if err != nil {
		return err
	}

	// 找到最高置信度的检测类型作为主检测类型
	var maxConf float64
	var mainType string
	for _, d := range detections {
		if d.Confidence > maxConf {
			maxConf = d.Confidence
			mainType = d.Class
		}
	}

	// 使用第一个检测对象的 bbox 作为主 bbox
	bboxJSON := "[]"
	if len(detections) > 0 {
		bbox := detections[0].BBox
		bboxBytes, _ := json.Marshal([]float64{bbox[0], bbox[1], bbox[2], bbox[3]})
		bboxJSON = string(bboxBytes)
	}

	record := &model.YOLODetection{
		ID:             generateUUID(),
		StreamID:       streamID,
		TenantID:       tenantID,
		DetectionType:  mainType,
		Confidence:     maxConf,
		BoundingBox:    bboxJSON,
		Objects:        string(objectsJSON),
		ProcessingTime: processingTimeMs,
		ModelName:      modelName,
		ProcessedBy:    processedBy,
		Timestamp:      time.Now(),
	}

	return s.db.Create(record).Error
}

// GetDetections 查询指定视频流的检测记录
func (s *YOLODetectionService) GetDetections(streamID string, limit int) ([]model.YOLODetection, error) {
	var detections []model.YOLODetection
	if limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	err := s.db.Where("stream_id = ?", streamID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&detections).Error
	return detections, err
}

// GetDetectionsByTenant 查询指定租户的检测记录
func (s *YOLODetectionService) GetDetectionsByTenant(tenantID string, limit int) ([]model.YOLODetection, error) {
	var detections []model.YOLODetection
	if limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	err := s.db.Where("tenant_id = ?", tenantID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&detections).Error
	return detections, err
}

// GetDetectionStats 获取租户的检测统计信息
func (s *YOLODetectionService) GetDetectionStats(tenantID string) (map[string]interface{}, error) {
	var total int64
	var today int64
	todayStart := time.Now().Truncate(24 * time.Hour)

	s.db.Model(&model.YOLODetection{}).Where("tenant_id = ?", tenantID).Count(&total)
	s.db.Model(&model.YOLODetection{}).Where("tenant_id = ? AND timestamp >= ?", tenantID, todayStart).Count(&today)

	// 按检测类型统计
	type TypeCount struct {
		DetectionType string `json:"detection_type"`
		Count         int64  `json:"count"`
	}
	var typeCounts []TypeCount
	s.db.Model(&model.YOLODetection{}).
		Select("detection_type, COUNT(*) as count").
		Where("tenant_id = ?", tenantID).
		Group("detection_type").
		Scan(&typeCounts)

	typeStats := make(map[string]int64)
	for _, tc := range typeCounts {
		typeStats[tc.DetectionType] = tc.Count
	}

	// 高风险检测数量（fire/smoke/intrusion）
	var highRisk int64
	s.db.Model(&model.YOLODetection{}).
		Where("tenant_id = ? AND detection_type IN ?", tenantID, []string{"fire", "smoke", "intrusion"}).
		Count(&highRisk)

	return map[string]interface{}{
		"total":     total,
		"today":     today,
		"high_risk": highRisk,
		"by_type":   typeStats,
	}, nil
}
