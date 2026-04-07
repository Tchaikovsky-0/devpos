package model

import "time"

type QAKnowledgeBase struct {
	ID            uint       `json:"id" gorm:"primaryKey"`
	TenantID      string     `json:"tenant_id" gorm:"size:64;index"`
	Name          string     `json:"name" gorm:"size:255;not null"`
	Description   string     `json:"description" gorm:"type:text"`
	DocumentCount int        `json:"document_count" gorm:"default:0"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (QAKnowledgeBase) TableName() string {
	return "qa_knowledge_bases"
}

type QADocument struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	TenantID        string    `json:"tenant_id" gorm:"size:64;index"`
	KnowledgeBaseID uint      `json:"knowledge_base_id" gorm:"index"`
	Filename        string    `json:"filename" gorm:"size:255"`
	FileURL         string    `json:"file_url" gorm:"size:512"`
	FileSize        int64     `json:"file_size"`
	Status          string    `json:"status" gorm:"size:32;default:'pending'"` // pending/ready/error
	ErrorMessage    string    `json:"error_message" gorm:"type:text"`
	CreatedAt       time.Time `json:"created_at"`
}

func (QADocument) TableName() string {
	return "qa_documents"
}

type QAConversation struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	TenantID         string    `json:"tenant_id" gorm:"size:64;index"`
	KnowledgeBaseIDs string    `json:"knowledge_base_ids" gorm:"type:text"` // JSON array of IDs
	Question         string    `json:"question" gorm:"type:text;not null"`
	Answer           string    `json:"answer" gorm:"type:text"`
	Confidence       float64   `json:"confidence" gorm:"type:decimal(5,4)"`
	Sources          string    `json:"sources" gorm:"type:json"` // JSON array
	Feedback         string    `json:"feedback" gorm:"size:32"`  // helpful/not_helpful/empty
	CreatedAt        time.Time `json:"created_at"`
}

func (QAConversation) TableName() string {
	return "qa_conversations"
}
