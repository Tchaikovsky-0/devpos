package model

import "time"

// Annotation represents a manual annotation on a media file.
type Annotation struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	MediaID        uint       `gorm:"index;not null" json:"media_id"`
	UserID         uint       `gorm:"index;not null" json:"user_id"`
	TenantID       string     `gorm:"index;size:64;not null" json:"tenant_id"`
	AnnotationType string     `gorm:"size:32;not null" json:"annotation_type"` // tag, region, note
	Content        string     `gorm:"type:json" json:"content"`                // JSON content
	BBox           string     `gorm:"type:json" json:"bbox"`                   // [x,y,width,height] for region type
	Tags           string     `gorm:"type:json" json:"tags"`                   // JSON array of tags
	Notes          string     `gorm:"type:text" json:"notes"`                  // Text notes
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Media *Media `gorm:"foreignKey:MediaID" json:"media,omitempty"`
	User  *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name.
func (Annotation) TableName() string {
	return "annotations"
}

// CreateAnnotationRequest is the request body for creating an annotation.
type CreateAnnotationRequest struct {
	MediaID        uint     `json:"media_id" binding:"required"`
	AnnotationType string   `json:"annotation_type" binding:"required"` // tag, region, note
	Content        string   `json:"content"`
	BBox           string   `json:"bbox"`
	Tags           []string `json:"tags"`
	Notes          string   `json:"notes"`
}

// UpdateAnnotationRequest is the request body for updating an annotation.
type UpdateAnnotationRequest struct {
	Content        string   `json:"content"`
	BBox           string   `json:"bbox"`
	Tags           []string `json:"tags"`
	Notes          string   `json:"notes"`
	AnnotationType string   `json:"annotation_type"`
}
