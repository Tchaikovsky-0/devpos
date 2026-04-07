package service

import (
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

type QAService struct {
	db *gorm.DB
}

func NewQAService(db *gorm.DB) *QAService {
	return &QAService{db: db}
}

type CreateKnowledgeBaseRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UploadDocumentRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

// Ask
func (s *QAService) Ask(tenantID string, question string) (map[string]interface{}, error) {
	var doc model.QADocument
	s.db.Where("tenant_id = ? AND (filename LIKE ? OR file_url LIKE ?)",
		tenantID, "%"+question+"%", "%"+question+"%").First(&doc)

	return map[string]interface{}{
		"answer": doc.FileURL,
		"source": doc.Filename,
	}, nil
}

// Conversations
func (s *QAService) GetConversations(tenantID string) ([]model.QAConversation, error) {
	var conversations []model.QAConversation
	if err := s.db.Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&conversations).Error; err != nil {
		return nil, err
	}
	return conversations, nil
}

func (s *QAService) GetConversationByID(tenantID, id string) (*model.QAConversation, error) {
	var conv model.QAConversation
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&conv).Error; err != nil {
		return nil, ErrNotFound
	}
	return &conv, nil
}

func (s *QAService) ProvideFeedback(tenantID, id string, feedback string) error {
	result := s.db.Model(&model.QAConversation{}).
		Where("id = ? AND tenant_id = ?", id, tenantID).
		Update("feedback", feedback)
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// Knowledge Bases
func (s *QAService) GetKnowledgeBases(tenantID string) ([]model.QAKnowledgeBase, error) {
	var bases []model.QAKnowledgeBase
	if err := s.db.Where("tenant_id = ?", tenantID).Find(&bases).Error; err != nil {
		return nil, err
	}
	return bases, nil
}

func (s *QAService) CreateKnowledgeBase(tenantID string, req CreateKnowledgeBaseRequest) (*model.QAKnowledgeBase, error) {
	base := &model.QAKnowledgeBase{
		Name:        req.Name,
		Description: req.Description,
		TenantID:    tenantID,
	}
	if err := s.db.Create(base).Error; err != nil {
		return nil, err
	}
	return base, nil
}

func (s *QAService) DeleteKnowledgeBase(tenantID, id string) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.QAKnowledgeBase{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// Documents
func (s *QAService) UploadDocument(tenantID, kbID string, req UploadDocumentRequest) (*model.QADocument, error) {
	doc := &model.QADocument{
		KnowledgeBaseID: parseUint(kbID),
		TenantID:        tenantID,
		Filename:        req.Title,
		FileURL:         req.Content,
		Status:          "ready",
	}
	if err := s.db.Create(doc).Error; err != nil {
		return nil, err
	}
	return doc, nil
}

func (s *QAService) SearchDocuments(tenantID, kbID, query string) ([]model.QADocument, error) {
	var docs []model.QADocument
	q := s.db.Where("tenant_id = ?", tenantID)
	if kbID != "" {
		q = q.Where("knowledge_base_id = ?", parseUint(kbID))
	}
	if query != "" {
		q = q.Where("filename LIKE ? OR file_url LIKE ?", "%"+query+"%", "%"+query+"%")
	}
	if err := q.Find(&docs).Error; err != nil {
		return nil, err
	}
	return docs, nil
}

// Helper
func parseUint(s string) uint {
	var v uint
	for _, ch := range s {
		if ch >= '0' && ch <= '9' {
			v = v*10 + uint(ch-'0')
		} else {
			break
		}
	}
	return v
}
