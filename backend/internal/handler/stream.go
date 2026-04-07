package handler

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type StreamHandler struct {
	streamService      *service.StreamService
	streamProxyService *service.StreamProxyService
}

func NewStreamHandler(s *service.StreamService, proxy *service.StreamProxyService) *StreamHandler {
	return &StreamHandler{
		streamService:      s,
		streamProxyService: proxy,
	}
}

func (h *StreamHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	streams, total, err := h.streamService.List(tenantID, p)
	if err != nil {
		response.InternalError(c, "failed to list streams")
		return
	}

	pagination.PageOK(c, streams, total, p)
}

func (h *StreamHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	stream, err := h.streamService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "stream not found")
		return
	}

	response.Success(c, stream)
}

func (h *StreamHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	stream, err := h.streamService.Create(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create stream")
		return
	}

	response.Created(c, stream)
}

func (h *StreamHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	stream, err := h.streamService.Update(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "stream not found")
			return
		}
		response.InternalError(c, "failed to update stream")
		return
	}

	response.Success(c, stream)
}

func (h *StreamHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.streamService.Delete(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "stream not found")
			return
		}
		response.InternalError(c, "failed to delete stream")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

func (h *StreamHandler) Statistics(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	stats, err := h.streamService.Statistics(tenantID)
	if err != nil {
		response.InternalError(c, "failed to get statistics")
		return
	}

	response.Success(c, stats)
}

// StartTranscoding 启动流转码
func (h *StreamHandler) StartTranscoding(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	stream, err := h.streamService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "stream not found")
		return
	}

	if h.streamProxyService == nil {
		response.InternalError(c, "stream proxy service not available")
		return
	}

	if err := h.streamProxyService.StartTranscoding(stream); err != nil {
		response.InternalError(c, "failed to start transcoding: "+err.Error())
		return
	}

	// 重新获取更新后的 stream
	stream, _ = h.streamService.GetByID(tenantID, id)
	response.Success(c, gin.H{
		"stream":   stream,
		"hls_path": stream.HLSPath,
		"message":  "transcoding started",
	})
}

// StopTranscoding 停止流转码
func (h *StreamHandler) StopTranscoding(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	stream, err := h.streamService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "stream not found")
		return
	}

	if h.streamProxyService == nil {
		response.InternalError(c, "stream proxy service not available")
		return
	}

	if err := h.streamProxyService.StopTranscoding(stream.ID); err != nil {
		response.InternalError(c, "failed to stop transcoding: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "transcoding stopped"})
}

// RestartTranscoding 重启流转码
func (h *StreamHandler) RestartTranscoding(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	stream, err := h.streamService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "stream not found")
		return
	}

	if h.streamProxyService == nil {
		response.InternalError(c, "stream proxy service not available")
		return
	}

	if err := h.streamProxyService.RestartTranscoding(stream.ID); err != nil {
		response.InternalError(c, "failed to restart transcoding: "+err.Error())
		return
	}

	// 重新获取更新后的 stream
	stream, _ = h.streamService.GetByID(tenantID, id)
	response.Success(c, gin.H{
		"stream":   stream,
		"hls_path": stream.HLSPath,
		"message":  "transcoding restarted",
	})
}

// GetHealth 获取流健康状态
func (h *StreamHandler) GetHealth(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	// 验证流归属当前租户
	stream, err := h.streamService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "stream not found")
		return
	}

	if h.streamProxyService == nil {
		response.InternalError(c, "stream proxy service not available")
		return
	}

	health := h.streamProxyService.GetStreamHealth(stream.ID)
	response.Success(c, health)
}

// ServeHLS 提供 HLS m3u8 和 ts 文件的静态服务
func (h *StreamHandler) ServeHLS(c *gin.Context) {
	streamID := c.Param("stream_id")
	filepath_ := c.Param("filepath")

	if h.streamProxyService == nil {
		response.InternalError(c, "stream proxy service not available")
		return
	}

	// 安全检查：防止路径穿越
	cleanPath := filepath.Clean(filepath_)
	if strings.Contains(cleanPath, "..") {
		response.BadRequest(c, "invalid path")
		return
	}

	outputDir := h.streamProxyService.GetOutputDir()
	fullPath := filepath.Join(outputDir, "stream_"+streamID, cleanPath)

	// 设置 CORS 和缓存控制 headers
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")

	if strings.HasSuffix(cleanPath, ".m3u8") {
		c.Header("Content-Type", "application/vnd.apple.mpegurl")
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	} else if strings.HasSuffix(cleanPath, ".ts") {
		c.Header("Content-Type", "video/mp2t")
		c.Header("Cache-Control", "public, max-age=3600")
	}

	c.File(fullPath)
}

// ServeHLSOptions 处理 HLS CORS 预检请求
func (h *StreamHandler) ServeHLSOptions(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	c.Status(http.StatusNoContent)
}
