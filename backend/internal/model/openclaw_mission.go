package model

import (
	"time"
)

// OpenClawMission represents an AI-driven inspection mission
type OpenClawMission struct {
	ID              uint64     `gorm:"primarykey" json:"id"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `gorm:"index" json:"-"`
	TenantID        string     `gorm:"size:64;not null;index" json:"tenant_id"`
	Title           string     `gorm:"size:255;not null" json:"title"`
	Status          string     `gorm:"size:32;not null;default:'pending'" json:"status"` // pending/running/completed/failed
	Summary         string     `gorm:"type:text" json:"summary"`
	InspectionType  string     `gorm:"size:64" json:"inspection_type"`  // general/fire/intrusion/defect
	Sensitivity     float64    `gorm:"default:0.5" json:"sensitivity"`
	RelatedModules  string     `gorm:"type:text" json:"related_modules"` // JSON array of module names
	Score           float64    `gorm:"default:0" json:"score"`
	FindingsCount   int        `gorm:"default:0" json:"findings_count"`
	CreatorID       string     `gorm:"size:64" json:"creator_id"`
	CreatorName     string     `gorm:"size:128" json:"creator_name"`
}

func (OpenClawMission) TableName() string {
	return "openclaw_missions"
}

// AutomationTemplate represents a reusable automation workflow template
type AutomationTemplate struct {
	ID          uint64     `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`
	TenantID    string     `gorm:"size:64;not null;index" json:"tenant_id"`
	Name        string     `gorm:"size:255;not null" json:"name"`
	Description string     `gorm:"type:text" json:"description"`
	Trigger     string     `gorm:"size:64;not null" json:"trigger"` // cron/manual/event
	TriggerConfig string    `gorm:"type:text" json:"trigger_config"` // JSON: cron expr, event type, etc.
	Actions     string     `gorm:"type:text" json:"actions"` // JSON array of actions
	Enabled     bool       `gorm:"default:true" json:"enabled"`
	IsBuiltIn   bool       `gorm:"default:false" json:"is_built_in"`
}

func (AutomationTemplate) TableName() string {
	return "automation_templates"
}

// CreateMissionRequest is the request body for creating a mission
type CreateMissionRequest struct {
	Title          string  `json:"title" binding:"required,min=1,max=255"`
	InspectionType string  `json:"inspection_type"`
	Sensitivity    float64 `json:"sensitivity"`
	RelatedModules []string `json:"related_modules"`
}

// UpdateMissionRequest is the request body for updating a mission
type UpdateMissionRequest struct {
	Title   string  `json:"title" binding:"omitempty,min=1,max=255"`
	Status  string  `json:"status" binding:"omitempty,oneof=pending running completed failed"`
	Summary string  `json:"summary"`
	Score   float64 `json:"score"`
}

// CreateTemplateRequest is the request body for creating a template
type CreateTemplateRequest struct {
	Name          string   `json:"name" binding:"required,min=1,max=255"`
	Description   string   `json:"description"`
	Trigger       string   `json:"trigger" binding:"required,oneof=cron manual event"`
	TriggerConfig string   `json:"trigger_config"`
	Actions       []string `json:"actions"`
}

// UpdateTemplateRequest is the request body for updating a template
type UpdateTemplateRequest struct {
	Name          string   `json:"name" binding:"omitempty,min=1,max=255"`
	Description   string   `json:"description"`
	Trigger       string   `json:"trigger" binding:"omitempty,oneof=cron manual event"`
	TriggerConfig string   `json:"trigger_config"`
	Actions       []string `json:"actions"`
	Enabled       *bool    `json:"enabled"`
}
