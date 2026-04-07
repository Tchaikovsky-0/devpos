package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

type AIHandler struct {
	aiService *service.AIService
}

func NewAIHandler(s *service.AIService) *AIHandler {
	return &AIHandler{aiService: s}
}

func (h *AIHandler) Chat(c *gin.Context) {
	var req struct {
		Question string `json:"question"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	answer, err := h.aiService.Chat(req.Question)
	if err != nil {
		response.InternalError(c, "AI chat failed")
		return
	}

	response.Success(c, gin.H{
		"message": answer,
	})
}

func (h *AIHandler) Analyze(c *gin.Context) {
	var req struct {
		Data string `json:"data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	analysis, err := h.aiService.Analyze(req.Data)
	if err != nil {
		response.InternalError(c, "AI analyze failed")
		return
	}

	response.Success(c, gin.H{
		"message": analysis,
	})
}

func (h *AIHandler) Suggest(c *gin.Context) {
	var req struct {
		Data string `json:"data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	suggestion, err := h.aiService.Suggest(req.Data)
	if err != nil {
		response.InternalError(c, "AI suggest failed")
		return
	}

	response.Success(c, gin.H{
		"message": suggestion,
	})
}

func (h *AIHandler) GetModels(c *gin.Context) {
	models, err := h.aiService.GetModels()
	if err != nil {
		response.InternalError(c, "failed to get models")
		return
	}

	response.Success(c, gin.H{
		"models": models,
	})
}

func (h *AIHandler) Inspection(c *gin.Context) {
	streamID := c.Query("stream_id")
	inspection, err := h.aiService.Inspection(streamID)
	if err != nil {
		response.InternalError(c, "inspection failed")
		return
	}

	response.Success(c, gin.H{
		"inspection": inspection,
	})
}

func (h *AIHandler) Detect(c *gin.Context) {
	streamID := c.Param("stream_id")
	if streamID == "" {
		response.BadRequest(c, "stream_id is required")
		return
	}

	result, err := h.aiService.Detect(streamID)
	if err != nil {
		response.InternalError(c, "detection failed")
		return
	}

	response.Success(c, result)
}

func (h *AIHandler) GenerateReport(c *gin.Context) {
	var req struct {
		Data string `json:"data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	report, err := h.aiService.GenerateReport(req.Data)
	if err != nil {
		response.InternalError(c, "report generation failed")
		return
	}

	response.Success(c, gin.H{
		"report": report,
	})
}

// =========================================================================
// Enhanced endpoints: Chat with session, streaming, session management
// =========================================================================

// ChatWithSession handles enhanced chat with session tracking and OpenClaw fallback.
func (h *AIHandler) ChatWithSession(c *gin.Context) {
	var req service.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.aiService.ChatWithSession(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, "AI chat failed")
		return
	}

	response.Success(c, result)
}

// ChatStream handles SSE streaming chat.
func (h *AIHandler) ChatStream(c *gin.Context) {
	var req service.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming not supported"})
		return
	}

	if err := h.aiService.ChatStreamSSE(c.Request.Context(), req, c.Writer, flusher); err != nil {
		// Error already partially streamed; just log it
		_ = err
	}
}

// GetSessions returns all chat sessions.
func (h *AIHandler) GetSessions(c *gin.Context) {
	sessions, err := h.aiService.GetSessions()
	if err != nil {
		response.InternalError(c, "failed to get sessions")
		return
	}

	response.Success(c, gin.H{
		"sessions": sessions,
	})
}

// GetSession returns a single session by ID.
func (h *AIHandler) GetSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		response.BadRequest(c, "session id is required")
		return
	}

	session, err := h.aiService.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	response.Success(c, session)
}

// DeleteSession deletes a session by ID.
func (h *AIHandler) DeleteSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		response.BadRequest(c, "session id is required")
		return
	}

	if err := h.aiService.DeleteSession(sessionID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	response.Success(c, gin.H{"message": "session deleted"})
}

// RegisterExtraRoutes registers additional AI routes on a protected router group.
// This avoids modifying router.go directly (parallel-safe).
func (h *AIHandler) RegisterExtraRoutes(protected *gin.RouterGroup) {
	ai := protected.Group("/ai")
	{
		ai.POST("/chat", h.ChatWithSession)
		ai.POST("/chat/stream", h.ChatStream)
		ai.GET("/sessions", h.GetSessions)
		ai.GET("/sessions/:id", h.GetSession)
		ai.DELETE("/sessions/:id", h.DeleteSession)
	}
}
