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
	Description   string     `json:"description" gorm:"type:text"`
	Starred      bool       `json:"starred" gorm:"default:false"`
	Sha256Hash   string     `json:"sha256_hash" gorm:"size:64;index"`
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
	ID        uint           `json:"id" gorm:"primaryKey"`
	TenantID  string         `json:"tenant_id" gorm:"size:64;index"`
	Name      string         `json:"name" gorm:"size:255;not null"`
	ParentID  *uint          `json:"parent_id" gorm:"index"`
	UserID    uint           `json:"user_id" gorm:"not null"` // 创建者
	IsPrivate bool           `json:"is_private" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt *time.Time     `json:"deleted_at" gorm:"index"`

	// 关系
	Permissions []FolderPermission `gorm:"foreignKey:FolderID"`
}

func (MediaFolder) TableName() string {
	return "media_folders"
}

// FolderPermission 表示用户对文件夹的访问权限
type FolderPermission struct {
	ID         uint       `json:"id" gorm:"primaryKey"`
	FolderID   uint       `json:"folder_id" gorm:"index;not null"`
	UserID     uint       `json:"user_id" gorm:"index;not null"`
	Permission string     `json:"permission" gorm:"size:32;default:read"` // read/write/admin
	GrantedBy  uint       `json:"granted_by" gorm:"not null"`
	ExpiresAt  *time.Time `json:"expires_at" gorm:"index"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	// 关系
	Folder MediaFolder `gorm:"foreignKey:FolderID"`
	User   User       `gorm:"foreignKey:UserID"`
}

func (FolderPermission) TableName() string {
	return "folder_permissions"
}
