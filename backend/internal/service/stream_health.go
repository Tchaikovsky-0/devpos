package service

import (
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"xunjianbao-backend/internal/model"
)

const (
	maxRetryCount      = 3
	healthCheckTimeout = 5 * time.Second
	hlsStaleThreshold  = 30 * time.Second // m3u8 文件超过此时间未更新视为不健康
)

// StartHealthCheck 启动定时健康检查
func (s *StreamProxyService) StartHealthCheck(interval time.Duration) {
	if interval <= 0 {
		interval = 30 * time.Second
	}

	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				s.checkAllStreams()
			case <-s.GetStopCh():
				log.Printf("[HealthCheck] Stopped")
				return
			}
		}
	}()

	log.Printf("[HealthCheck] Started with interval %v", interval)
}

// checkAllStreams 检查所有活跃流的健康状态
func (s *StreamProxyService) checkAllStreams() {
	var streams []model.Stream
	if err := s.GetDB().Where("is_active = ? AND is_transcoding = ?", true, true).Find(&streams).Error; err != nil {
		log.Printf("[HealthCheck] Failed to query active streams: %v", err)
		return
	}

	for i := range streams {
		stream := &streams[i]
		oldStatus := stream.HealthStatus
		healthy := s.checkStreamHealth(stream)
		newStatus := "healthy"
		if !healthy {
			newStatus = "unhealthy"
		}

		// 更新健康状态
		updates := map[string]interface{}{
			"health_status":     newStatus,
			"last_health_check": time.Now(),
		}

		if !healthy {
			updates["retry_count"] = stream.RetryCount + 1

			// 自动重连逻辑
			if stream.RetryCount < maxRetryCount {
				log.Printf("[HealthCheck] Stream %d unhealthy (retry %d/%d), attempting restart",
					stream.ID, stream.RetryCount+1, maxRetryCount)
				go func(sid uint) {
					if err := s.RestartTranscoding(sid); err != nil {
						log.Printf("[HealthCheck] Failed to restart stream %d: %v", sid, err)
					}
				}(stream.ID)
			} else {
				log.Printf("[HealthCheck] Stream %d unhealthy, max retries (%d) exceeded", stream.ID, maxRetryCount)
				updates["status"] = "error"
				updates["is_transcoding"] = false
			}
		} else {
			// 健康则重置重试计数
			updates["retry_count"] = 0
		}

		s.GetDB().Model(stream).Updates(updates)

		// 状态变更时推送 WebSocket
		if oldStatus != newStatus {
			s.broadcastStreamStatus(stream.ID, stream.TenantID, "health_changed", map[string]interface{}{
				"stream_id":     stream.ID,
				"health_status": newStatus,
				"retry_count":   stream.RetryCount,
			})
		}
	}
}

// checkStreamHealth 对单个流执行健康检查
func (s *StreamProxyService) checkStreamHealth(stream *model.Stream) bool {
	// 1. 检查 FFmpeg 进程是否存活
	if !s.isProcessAlive(stream.ID) {
		return false
	}

	// 2. 根据协议执行特定检查
	switch stream.Protocol {
	case "rtsp", "rtmp":
		return s.checkRTSPHealth(stream)
	case "hls":
		return s.checkHLSFileHealth(stream)
	default:
		// 通用检查：进程存活即可
		return s.isProcessAlive(stream.ID)
	}
}

// isProcessAlive 检查 FFmpeg 进程是否仍在运行
func (s *StreamProxyService) isProcessAlive(streamID uint) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	proc, exists := s.processes[streamID]
	if !exists {
		return false
	}
	return proc.status == "running" && proc.cmd != nil && proc.cmd.Process != nil
}

// checkRTSPHealth 通过 TCP 连接检查 RTSP 流可达性
func (s *StreamProxyService) checkRTSPHealth(stream *model.Stream) bool {
	streamURL := stream.StreamURL
	if streamURL == "" {
		streamURL = stream.URL
	}
	if streamURL == "" {
		return false
	}

	parsed, err := url.Parse(streamURL)
	if err != nil {
		return false
	}

	host := parsed.Host
	if parsed.Port() == "" {
		// 默认 RTSP 端口
		switch parsed.Scheme {
		case "rtsp":
			host = host + ":554"
		case "rtmp":
			host = host + ":1935"
		default:
			host = host + ":554"
		}
	}

	conn, err := net.DialTimeout("tcp", host, healthCheckTimeout)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

// checkHLSFileHealth 检查 HLS m3u8 文件是否持续更新
func (s *StreamProxyService) checkHLSFileHealth(stream *model.Stream) bool {
	streamDir := filepath.Join(s.GetOutputDir(), fmt.Sprintf("stream_%d", stream.ID))
	m3u8Path := filepath.Join(streamDir, "index.m3u8")

	info, err := os.Stat(m3u8Path)
	if err != nil {
		return false
	}

	// 文件最近是否有更新
	return time.Since(info.ModTime()) < hlsStaleThreshold
}

// GetStreamHealth 获取单个流的健康信息
func (s *StreamProxyService) GetStreamHealth(streamID uint) map[string]interface{} {
	var stream model.Stream
	if err := s.GetDB().Where("id = ?", streamID).First(&stream).Error; err != nil {
		return map[string]interface{}{
			"stream_id":     streamID,
			"health_status": "unknown",
			"error":         "stream not found",
		}
	}

	processAlive := s.isProcessAlive(streamID)
	transcodingStatus := s.GetTranscodingStatus(streamID)

	return map[string]interface{}{
		"stream_id":          streamID,
		"health_status":      stream.HealthStatus,
		"is_transcoding":     stream.IsTranscoding,
		"process_alive":      processAlive,
		"transcoding_status": transcodingStatus,
		"last_health_check":  stream.LastHealthCheck,
		"retry_count":        stream.RetryCount,
	}
}
