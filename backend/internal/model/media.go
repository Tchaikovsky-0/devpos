package model

import "time"

// Media 表示上传的媒体文件
type Media struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	TenantID     string     `json:"tenant_id" gorm:"size:64;index"`
	Name         string     `json:"name" gorm:"size:255;not null"`
	Filename     string     `json:"filename" gorm:"size:255;not null"`
	OriginalName string     `json:"original_name" gorm:"size:255;not null"`
	MimeType     string     `json:"mime_type" gorm:"size:128"`
	Size         int64      `json:"size"`
	Path         string     `json:"-" gorm:"size:512"`
	URL          string     `json:"url" gorm:"size:512"`
	FolderID     *uint      `json:"folder_id" gorm:"index"`
	Type         string     `json:"type" gorm:"size:32"` // image, video, document, other
	UserID       *uint      `json:"user_id"`
	Description  string     `json:"description" gorm:"type:text"`
	Starred      bool       `json:"starred" gorm:"default:false"`
	TrashedAt    *time.Time `json:"trashed_at" gorm:"index"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}

func (Media) TableName() string {
	return "media"
}

// MediaFolder 表示媒体文件夹
type MediaFolder struct {
	ID        uint       `json:"id" gorm:"primaryKey"`
	TenantID  string     `json:"tenant_id" gorm:"size:64;index"`
	Name      string     `json:"name" gorm:"size:255;not null"`
	ParentID  *uint      `json:"parent_id" gorm:"index"`
	UserID    *uint      `json:"user_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at" gorm:"index"`
}

func (MediaFolder) TableName() string {
	return "media_folders"
}
