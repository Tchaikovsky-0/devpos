package service

import (
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

type OnCallService struct {
	db *gorm.DB
}

func NewOnCallService(db *gorm.DB) *OnCallService {
	return &OnCallService{db: db}
}

type CreateScheduleRequest struct {
	UserID     uint      `json:"user_id" binding:"required"`
	UserName   string    `json:"user_name" binding:"required"`
	ShiftStart time.Time `json:"shift_start" binding:"required"`
	ShiftEnd   time.Time `json:"shift_end" binding:"required"`
	Notes      string    `json:"notes"`
}

type OnCallCreateReportRequest struct {
	ShiftSummary   string  `json:"shift_summary"`
	TotalAlerts    int     `json:"total_alerts"`
	CriticalAlerts int     `json:"critical_alerts"`
	AvgResponseSec float64 `json:"avg_response_time"`
	Notes          string  `json:"notes"`
}

func (s *OnCallService) GetCurrentSchedule(tenantID string) (*model.OnCallSchedule, error) {
	var schedule model.OnCallSchedule
	now := time.Now()
	if err := s.db.Where("tenant_id = ? AND shift_start <= ? AND shift_end >= ? AND status = ?",
		tenantID, now, now, "active").First(&schedule).Error; err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (s *OnCallService) GetSchedules(tenantID, startDate, endDate, userID string) ([]model.OnCallSchedule, error) {
	var schedules []model.OnCallSchedule
	query := s.db.Where("tenant_id = ?", tenantID)

	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("shift_start >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("shift_end <= ?", t)
		}
	}
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.Order("shift_start DESC").Find(&schedules).Error; err != nil {
		return nil, err
	}

	return schedules, nil
}

func (s *OnCallService) CreateSchedule(tenantID string, req CreateScheduleRequest) (*model.OnCallSchedule, error) {
	schedule := &model.OnCallSchedule{
		TenantID:   tenantID,
		UserID:     req.UserID,
		UserName:   req.UserName,
		ShiftStart: req.ShiftStart,
		ShiftEnd:   req.ShiftEnd,
		Status:     "upcoming",
		Notes:      req.Notes,
	}

	if err := s.db.Create(schedule).Error; err != nil {
		return nil, err
	}

	return schedule, nil
}

func (s *OnCallService) GetAlertsBySchedule(scheduleID string) ([]model.Alert, error) {
	var schedule model.OnCallSchedule
	if err := s.db.First(&schedule, scheduleID).Error; err != nil {
		return nil, ErrNotFound
	}

	var alerts []model.Alert
	s.db.Where("tenant_id = ? AND created_at BETWEEN ? AND ?",
		schedule.TenantID, schedule.ShiftStart, schedule.ShiftEnd).
		Find(&alerts)

	return alerts, nil
}

func (s *OnCallService) AcknowledgeAlert(tenantID, alertID string) error {
	result := s.db.Model(&model.Alert{}).
		Where("id = ? AND tenant_id = ?", alertID, tenantID).
		Updates(map[string]interface{}{
			"acknowledged": true,
			"status":       "processing",
		})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

func (s *OnCallService) GetReports(tenantID, scheduleID string) ([]model.OnCallReport, error) {
	var reports []model.OnCallReport
	query := s.db.Where("tenant_id = ?", tenantID)
	if scheduleID != "" {
		query = query.Where("schedule_id = ?", scheduleID)
	}
	if err := query.Order("created_at DESC").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *OnCallService) CreateReport(tenantID, scheduleID string, req OnCallCreateReportRequest) (*model.OnCallReport, error) {
	// Verify schedule exists
	var schedule model.OnCallSchedule
	if err := s.db.Where("id = ? AND tenant_id = ?", scheduleID, tenantID).First(&schedule).Error; err != nil {
		return nil, ErrNotFound
	}

	report := &model.OnCallReport{
		TenantID:       tenantID,
		ScheduleID:     schedule.ID,
		ShiftSummary:   req.ShiftSummary,
		TotalAlerts:    req.TotalAlerts,
		CriticalAlerts: req.CriticalAlerts,
		AvgResponseSec: req.AvgResponseSec,
		Notes:          req.Notes,
	}

	if err := s.db.Create(report).Error; err != nil {
		return nil, err
	}

	return report, nil
}

func (s *OnCallService) GetAnalysts(tenantID string) ([]map[string]interface{}, error) {
	var users []model.User
	s.db.Where("tenant_id = ? AND is_active = ?", tenantID, true).Find(&users)

	analysts := make([]map[string]interface{}, len(users))
	for i, u := range users {
		analysts[i] = map[string]interface{}{
			"id":       u.ID,
			"username": u.Username,
			"role":     u.Role,
			"avatar":   u.Avatar,
			"email":    u.Email,
		}
	}
	return analysts, nil
}
