package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type QAHandler struct {
	qaService *service.QAService
}

func NewQAHandler(s *service.QAService) *QAHandler {
	return &QAHandler{qaService: s}
}

func (h *QAHandler) Ask(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	var req struct {
		Question string `json:"question"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	answer, err := h.qaService.Ask(tenantID, req.Question)
	if err != nil {
		response.InternalError(c, "QA ask failed")
		return
	}

	response.Success(c, answer)
}

func (h *QAHandler) GetConversations(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	conversations, err := h.qaService.GetConversations(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get conversations")
		return
	}

	response.Success(c, conversations)
}

func (h *QAHandler) GetConversationByID(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id := c.Param("id")

	conv, err := h.qaService.GetConversationByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "conversation not found")
		return
	}

	response.Success(c, conv)
}

func (h *QAHandler) ProvideFeedback(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id := c.Param("id")

	var req struct {
		Feedback string `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.qaService.ProvideFeedback(tenantID, id, req.Feedback); err != nil {
		response.NotFound(c, "conversation not found")
		return
	}

	response.Success(c, gin.H{"message": "feedback recorded"})
}

func (h *QAHandler) GetKnowledgeBases(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	bases, err := h.qaService.GetKnowledgeBases(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get knowledge bases")
		return
	}

	response.Success(c, bases)
}

func (h *QAHandler) CreateKnowledgeBase(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateKnowledgeBaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	base, err := h.qaService.CreateKnowledgeBase(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create knowledge base")
		return
	}

	response.Created(c, base)
}

func (h *QAHandler) UploadDocument(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	kbID := c.Param("knowledge_base_id")

	var req service.UploadDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	doc, err := h.qaService.UploadDocument(tenantID, kbID, req)
	if err != nil {
		response.InternalError(c, "failed to upload document")
		return
	}

	response.Success(c, doc)
}

func (h *QAHandler) DeleteKnowledgeBase(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id := c.Param("id")

	if err := h.qaService.DeleteKnowledgeBase(tenantID, id); err != nil {
		response.NotFound(c, "knowledge base not found")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

func (h *QAHandler) SearchDocuments(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	kbID := c.Param("knowledge_base_id")
	query := c.Query("q")

	docs, err := h.qaService.SearchDocuments(tenantID, kbID, query)
	if err != nil {
		response.InternalError(c, "failed to search documents")
		return
	}

	response.Success(c, docs)
}
