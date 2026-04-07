package model

import "time"

type OnCallSchedule struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	TenantID   string    `json:"tenant_id" gorm:"size:64;index"`
	UserID     uint      `json:"user_id" gorm:"index"`
	UserName   string    `json:"user_name" gorm:"size:64"`
	ShiftStart time.Time `json:"shift_start"`
	ShiftEnd   time.Time `json:"shift_end"`
	Status     string    `json:"status" gorm:"size:32;default:'upcoming'"` // active/completed/upcoming
	Notes      string    `json:"notes" gorm:"type:text"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (OnCallSchedule) TableName() string {
	return "oncall_schedules"
}

type OnCallReport struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	TenantID       string    `json:"tenant_id" gorm:"size:64;index"`
	ScheduleID     uint      `json:"schedule_id" gorm:"index"`
	ShiftSummary   string    `json:"shift_summary" gorm:"type:text"`
	TotalAlerts    int       `json:"total_alerts"`
	CriticalAlerts int       `json:"critical_alerts"`
	AvgResponseSec float64   `json:"avg_response_time"`
	Notes          string    `json:"notes" gorm:"type:text"`
	CreatedAt      time.Time `json:"created_at"`
}

func (OnCallReport) TableName() string {
	return "oncall_reports"
}
