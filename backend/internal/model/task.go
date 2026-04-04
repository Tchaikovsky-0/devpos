package model

import "time"

type Task struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	TenantID    string     `json:"tenant_id" gorm:"size:64;index"`
	Title       string     `json:"title" gorm:"size:255;not null"`
	Description string     `json:"description" gorm:"type:text"`
	Type        string     `json:"type" gorm:"size:32;not null"`    // routine, emergency, custom
	Status      string     `json:"status" gorm:"size:32;default:pending"` // pending, in_progress, completed, cancelled
	AssigneeID  *uint      `json:"assignee_id" gorm:"index"`
	StreamIDs   string     `json:"stream_ids" gorm:"type:json"` // JSON array of stream IDs
	DueDate     *time.Time `json:"due_date"`
	Priority    string     `json:"priority" gorm:"size:8;default:P2"` // P0, P1, P2, P3
	CreatedBy   string     `json:"created_by" gorm:"size:64"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at" gorm:"index"`
}

func (Task) TableName() string {
	return "tasks"
}
