package service

import (
	"math/rand"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

type DashboardService struct {
	db *gorm.DB
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{db: db}
}

func (s *DashboardService) GetStats(tenantID string) (map[string]interface{}, error) {
	var streamCount int64
	var alertCount int64
	var pendingAlerts int64
	var onlineStreams int64

	s.db.Model(&model.Stream{}).Where("tenant_id = ?", tenantID).Count(&streamCount)
	s.db.Model(&model.Stream{}).Where("tenant_id = ? AND status = ?", tenantID, "online").Count(&onlineStreams)
	s.db.Model(&model.Alert{}).Where("tenant_id = ?", tenantID).Count(&alertCount)
	s.db.Model(&model.Alert{}).Where("tenant_id = ? AND status = ?", tenantID, "pending").Count(&pendingAlerts)

	return map[string]interface{}{
		"total_streams":    streamCount,
		"online_streams":   onlineStreams,
		"total_alerts":     alertCount,
		"pending_alerts":   pendingAlerts,
		"system_uptime":    "99.9%",
		"ai_detections":    rand.Intn(1000),
		"storage_used_mb":  rand.Intn(50000),
		"storage_total_mb": 102400,
	}, nil
}

func (s *DashboardService) GetAlertTrends(tenantID string, days int) ([]map[string]interface{}, error) {
	var alerts []model.Alert
	startDate := time.Now().AddDate(0, 0, -days)
	s.db.Where("tenant_id = ? AND created_at >= ?", tenantID, startDate).Find(&alerts)

	// Group by day
	trendMap := make(map[string]map[string]int64)
	for _, alert := range alerts {
		day := alert.CreatedAt.Format("2006-01-02")
		if _, ok := trendMap[day]; !ok {
			trendMap[day] = map[string]int64{"count": 0}
		}
		trendMap[day]["count"]++
	}

	var trends []map[string]interface{}
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		count := int64(0)
		if v, ok := trendMap[date]; ok {
			count = v["count"]
		}
		trends = append(trends, map[string]interface{}{
			"date":  date,
			"count": count,
		})
	}

	return trends, nil
}

func (s *DashboardService) GetDeviceTrends(tenantID string, days int) ([]map[string]interface{}, error) {
	trends := make([]map[string]interface{}, days)
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		trends[i] = map[string]interface{}{
			"date":    date,
			"online":  rand.Intn(50) + 10,
			"offline": rand.Intn(10),
		}
	}
	return trends, nil
}

func (s *DashboardService) GetTopAlerts(tenantID string) ([]map[string]interface{}, error) {
	var alerts []model.Alert
	s.db.Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Limit(10).
		Find(&alerts)

	result := make([]map[string]interface{}, len(alerts))
	for i, a := range alerts {
		result[i] = map[string]interface{}{
			"id":         a.ID,
			"title":      a.Title,
			"level":      a.Level,
			"type":       a.Type,
			"status":     a.Status,
			"created_at": a.CreatedAt,
		}
	}
	return result, nil
}

func (s *DashboardService) GetStorageInfo() map[string]interface{} {
	return map[string]interface{}{
		"total":      102400,
		"used":       rand.Intn(50000),
		"available":  52400,
		"percentage": rand.Intn(50) + 20,
		"unit":       "MB",
	}
}

func (s *DashboardService) GetRecentActivities(tenantID string, limit int) ([]map[string]interface{}, error) {
	var alerts []model.Alert
	s.db.Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Limit(limit).
		Find(&alerts)

	activities := make([]map[string]interface{}, len(alerts))
	for i, a := range alerts {
		activities[i] = map[string]interface{}{
			"type":        "alert",
			"description": a.Title,
			"level":       a.Level,
			"status":      a.Status,
			"created_at":  a.CreatedAt,
		}
	}
	return activities, nil
}
