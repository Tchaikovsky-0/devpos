package model

import "time"

type Stream struct {
	ID                  uint       `json:"id" gorm:"primaryKey"`
	Name                string     `json:"name" gorm:"size:255;not null"`
	Type                string     `json:"type" gorm:"size:32;not null"` // camera/drone/recording/rtsp/webrtc
	Status              string     `json:"status" gorm:"size:32;default:offline"` // online/offline/warning/error
	URL                 string     `json:"url" gorm:"size:512"`
	Location            string     `json:"location" gorm:"size:255"`
	LAT                 float64    `json:"lat" gorm:"type:decimal(10,6)"`
	LNG                 float64    `json:"lng" gorm:"type:decimal(10,6)"`
	Description         string     `json:"description" gorm:"type:text"`
	IsActive            bool       `json:"is_active" gorm:"default:true"`
	LastConnectedAt     *time.Time `json:"last_connected_at"`
	LastDisconnectedAt  *time.Time `json:"last_disconnected_at"`
	ReconnectCount      int        `json:"reconnect_count" gorm:"default:0"`
	TenantID            string     `json:"tenant_id" gorm:"size:64;index"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `json:"deleted_at" gorm:"index"`
}

func (Stream) TableName() string {
	return "streams"
}
