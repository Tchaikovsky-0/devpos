package model

import "time"

type Sensor struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	TenantID     string     `json:"tenant_id" gorm:"size:64;index"`
	Name         string     `json:"name" gorm:"size:255;not null"`
	Type         string     `json:"type" gorm:"size:32;not null"` // temperature, humidity, pressure, gas, smoke
	Location     string     `json:"location" gorm:"size:255"`
	Status       string     `json:"status" gorm:"size:32;default:online"` // online, offline, warning
	LastValue    float64    `json:"last_value" gorm:"type:decimal(10,4)"`
	Unit         string     `json:"unit" gorm:"size:16"` // °C, %, Pa, ppm
	MinThreshold float64    `json:"min_threshold" gorm:"type:decimal(10,4)"`
	MaxThreshold float64    `json:"max_threshold" gorm:"type:decimal(10,4)"`
	StreamID     *uint      `json:"stream_id" gorm:"index"`
	Description  string     `json:"description" gorm:"type:text"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}

func (Sensor) TableName() string {
	return "sensors"
}

type SensorData struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	SensorID  uint      `json:"sensor_id" gorm:"index"`
	TenantID  string    `json:"tenant_id" gorm:"size:64;index"`
	Value     float64   `json:"value" gorm:"type:decimal(10,4)"`
	Unit      string    `json:"unit" gorm:"size:16"`
	CreatedAt time.Time `json:"created_at"`
}

func (SensorData) TableName() string {
	return "sensor_data"
}

// SensorDataResponse is the API response for sensor data
type SensorDataResponse struct {
	Sensor  Sensor        `json:"sensor"`
	Data    []SensorData  `json:"data"`
	Total   int64         `json:"total"`
}
