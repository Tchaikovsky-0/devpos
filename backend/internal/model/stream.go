package model

import "time"

type Stream struct {
	ID                 uint       `json:"id" gorm:"primaryKey"`
	Name               string     `json:"name" gorm:"size:255;not null"`
	Type               string     `json:"type" gorm:"size:32;not null"`          // camera/drone/recording/rtsp/webrtc
	Status             string     `json:"status" gorm:"size:32;default:offline"` // online/offline/warning/error
	URL                string     `json:"url" gorm:"size:512"`
	Location           string     `json:"location" gorm:"size:255"`
	LAT                float64    `json:"lat" gorm:"type:decimal(10,6)"`
	LNG                float64    `json:"lng" gorm:"type:decimal(10,6)"`
	Description        string     `json:"description" gorm:"type:text"`
	IsActive           bool       `json:"is_active" gorm:"default:true"`
	LastConnectedAt    *time.Time `json:"last_connected_at"`
	LastDisconnectedAt *time.Time `json:"last_disconnected_at"`
	ReconnectCount     int        `json:"reconnect_count" gorm:"default:0"`
	TenantID           string     `json:"tenant_id" gorm:"size:64;index"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	DeletedAt          *time.Time `json:"deleted_at" gorm:"index"`

	// 流协议接入增强字段
	Protocol        string    `json:"protocol" gorm:"type:varchar(20);default:'rtsp'"`         // rtsp, hls, webrtc, rtmp
	StreamURL       string    `json:"stream_url" gorm:"type:varchar(500)"`                     // 原始流地址
	HLSPath         string    `json:"hls_path" gorm:"type:varchar(500)"`                       // HLS 转码后地址
	Username        string    `json:"username" gorm:"type:varchar(100)"`                       // 流认证用户名
	Password        string    `json:"-" gorm:"type:varchar(100)"`                              // 流认证密码（不返回前端）
	IsTranscoding   bool      `json:"is_transcoding" gorm:"default:false"`                     // 是否正在转码
	HealthStatus    string    `json:"health_status" gorm:"type:varchar(20);default:'unknown'"` // healthy, unhealthy, unknown
	LastHealthCheck time.Time `json:"last_health_check"`
	RetryCount      int       `json:"retry_count" gorm:"default:0"`
}

func (Stream) TableName() string {
	return "streams"
}
