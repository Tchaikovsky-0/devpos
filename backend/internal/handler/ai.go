package handler

import (
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
