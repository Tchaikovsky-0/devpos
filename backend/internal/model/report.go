package model

import "time"

type Report struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	TenantID        string     `json:"tenant_id" gorm:"size:64;index"`
	Type            string     `json:"type" gorm:"size:32;not null"` // daily/weekly/monthly/custom
	Title           string     `json:"title" gorm:"size:255;not null"`
	DateRangeStart  *time.Time `json:"date_range_start"`
	DateRangeEnd    *time.Time `json:"date_range_end"`
	Content         string     `json:"content" gorm:"type:json"`
	Status          string     `json:"status" gorm:"size:32;default:'pending'"` // pending/ready/failed/expired
	GeneratedBy     string     `json:"generated_by" gorm:"size:64"`
	FileURL         string     `json:"file_url" gorm:"size:512"`
	ErrorMessage    string     `json:"error_message" gorm:"type:text"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (Report) TableName() string {
	return "reports"
}
