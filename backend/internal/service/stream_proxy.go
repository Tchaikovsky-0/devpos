package service

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

// StreamProxyService 管理 RTSP->HLS 转码代理和流状态
type StreamProxyService struct {
	processes map[uint]*streamProcess // streamID -> process info
	mu        sync.RWMutex
	outputDir string        // HLS 输出目录
	hub       *WebSocketHub // 推送流状态变更
	db        *gorm.DB
	stopCh    chan struct{} // 服务关闭信号
}

// streamProcess 封装 FFmpeg 进程及其上下文
type streamProcess struct {
	cmd    *exec.Cmd
	cancel context.CancelFunc
	status string // running, stopped, error
}

// NewStreamProxyService 创建流代理服务
func NewStreamProxyService(db *gorm.DB, hub *WebSocketHub, outputDir string) *StreamProxyService {
	if outputDir == "" {
		outputDir = "tmp/hls"
	}
	// 确保输出目录存在
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		log.Printf("[StreamProxy] Failed to create output dir %s: %v", outputDir, err)
	}

	return &StreamProxyService{
		processes: make(map[uint]*streamProcess),
		outputDir: outputDir,
		hub:       hub,
		db:        db,
		stopCh:    make(chan struct{}),
	}
}

// StartTranscoding 启动 FFmpeg 将 RTSP 转为 HLS
func (s *StreamProxyService) StartTranscoding(stream *model.Stream) error {
	// 检查 FFmpeg 是否可用
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return fmt.Errorf("ffmpeg not found in system PATH: %w", err)
	}

	s.mu.Lock()
	// 如果已有进程在运行，先停止
	if proc, exists := s.processes[stream.ID]; exists {
		if proc.cancel != nil {
			proc.cancel()
		}
		delete(s.processes, stream.ID)
	}
	s.mu.Unlock()

	// 构建 RTSP URL（含认证信息）
	streamURL := stream.StreamURL
	if streamURL == "" {
		streamURL = stream.URL
	}
	if streamURL == "" {
		return fmt.Errorf("stream URL is empty for stream %d", stream.ID)
	}

	// 如果有用户名密码，嵌入 RTSP URL
	inputURL := s.buildAuthURL(streamURL, stream.Username, stream.Password)

	// 创建流输出目录
	streamDir := filepath.Join(s.outputDir, fmt.Sprintf("stream_%d", stream.ID))
	if err := os.MkdirAll(streamDir, 0755); err != nil {
		return fmt.Errorf("failed to create stream dir: %w", err)
	}

	outputPath := filepath.Join(streamDir, "index.m3u8")

	// 构建 FFmpeg 命令
	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, ffmpegPath,
		"-rtsp_transport", "tcp",
		"-i", inputURL,
		"-c:v", "copy",
		"-c:a", "aac",
		"-f", "hls",
		"-hls_time", "2",
		"-hls_list_size", "5",
		"-hls_flags", "delete_segments",
		"-y",
		outputPath,
	)

	// 设置进程组，以便清理子进程
	cmd.Stdout = nil
	cmd.Stderr = nil

	if err := cmd.Start(); err != nil {
		cancel()
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	proc := &streamProcess{
		cmd:    cmd,
		cancel: cancel,
		status: "running",
	}

	s.mu.Lock()
	s.processes[stream.ID] = proc
	s.mu.Unlock()

	// 更新数据库
	hlsPath := fmt.Sprintf("/hls/stream_%d/index.m3u8", stream.ID)
	s.db.Model(stream).Updates(map[string]interface{}{
		"is_transcoding": true,
		"hls_path":       hlsPath,
		"status":         "online",
		"health_status":  "healthy",
	})

	// 推送状态变更
	s.broadcastStreamStatus(stream.ID, stream.TenantID, "transcoding_started", map[string]interface{}{
		"stream_id": stream.ID,
		"hls_path":  hlsPath,
		"status":    "online",
	})

	// 后台监控进程退出
	go s.monitorProcess(stream.ID, stream.TenantID, proc)

	log.Printf("[StreamProxy] Started transcoding for stream %d: %s -> %s", stream.ID, streamURL, hlsPath)
	return nil
}

// StopTranscoding 停止 FFmpeg 进程
func (s *StreamProxyService) StopTranscoding(streamID uint) error {
	s.mu.Lock()
	proc, exists := s.processes[streamID]
	if !exists {
		s.mu.Unlock()
		return fmt.Errorf("no active transcoding for stream %d", streamID)
	}

	if proc.cancel != nil {
		proc.cancel()
	}
	proc.status = "stopped"
	delete(s.processes, streamID)
	s.mu.Unlock()

	// 更新数据库
	s.db.Model(&model.Stream{}).Where("id = ?", streamID).Updates(map[string]interface{}{
		"is_transcoding": false,
		"status":         "offline",
	})

	// 获取 tenantID 用于广播
	var stream model.Stream
	if err := s.db.Where("id = ?", streamID).First(&stream).Error; err == nil {
		s.broadcastStreamStatus(streamID, stream.TenantID, "transcoding_stopped", map[string]interface{}{
			"stream_id": streamID,
			"status":    "offline",
		})
	}

	log.Printf("[StreamProxy] Stopped transcoding for stream %d", streamID)
	return nil
}

// RestartTranscoding 重启转码
func (s *StreamProxyService) RestartTranscoding(streamID uint) error {
	// 先停止（忽略未运行的错误）
	_ = s.StopTranscoding(streamID)

	// 短暂等待进程清理
	time.Sleep(500 * time.Millisecond)

	// 从数据库获取最新 stream 信息
	var stream model.Stream
	if err := s.db.Where("id = ?", streamID).First(&stream).Error; err != nil {
		return fmt.Errorf("stream %d not found: %w", streamID, err)
	}

	return s.StartTranscoding(&stream)
}

// GetTranscodingStatus 获取转码状态
func (s *StreamProxyService) GetTranscodingStatus(streamID uint) string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	proc, exists := s.processes[streamID]
	if !exists {
		return "stopped"
	}
	return proc.status
}

// CleanupAll 停止所有进程（服务关闭时调用）
func (s *StreamProxyService) CleanupAll() {
	close(s.stopCh)

	s.mu.Lock()
	defer s.mu.Unlock()

	for id, proc := range s.processes {
		if proc.cancel != nil {
			proc.cancel()
		}
		log.Printf("[StreamProxy] Cleaned up transcoding for stream %d", id)
	}
	s.processes = make(map[uint]*streamProcess)

	// 批量更新数据库
	s.db.Model(&model.Stream{}).Where("is_transcoding = ?", true).Updates(map[string]interface{}{
		"is_transcoding": false,
		"status":         "offline",
	})

	log.Printf("[StreamProxy] All transcoding processes cleaned up")
}

// GetActiveCount 返回活跃转码数
func (s *StreamProxyService) GetActiveCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.processes)
}

// GetDB 返回数据库实例（供 health check 使用）
func (s *StreamProxyService) GetDB() *gorm.DB {
	return s.db
}

// GetOutputDir 返回 HLS 输出目录
func (s *StreamProxyService) GetOutputDir() string {
	return s.outputDir
}

// GetStopCh 返回停止信号通道
func (s *StreamProxyService) GetStopCh() <-chan struct{} {
	return s.stopCh
}

// buildAuthURL 将认证信息嵌入 RTSP URL
func (s *StreamProxyService) buildAuthURL(rawURL, username, password string) string {
	if username == "" {
		return rawURL
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		// 解析失败则直接返回原始 URL
		return rawURL
	}

	if password != "" {
		parsed.User = url.UserPassword(username, password)
	} else {
		parsed.User = url.User(username)
	}

	return parsed.String()
}

// monitorProcess 后台监控 FFmpeg 进程，异常退出时更新状态
func (s *StreamProxyService) monitorProcess(streamID uint, tenantID string, proc *streamProcess) {
	if proc.cmd == nil || proc.cmd.Process == nil {
		return
	}

	err := proc.cmd.Wait()

	s.mu.Lock()
	currentProc, exists := s.processes[streamID]
	if exists && currentProc == proc {
		// 进程意外退出
		proc.status = "error"
		delete(s.processes, streamID)
	}
	s.mu.Unlock()

	if err != nil && exists && currentProc == proc {
		log.Printf("[StreamProxy] FFmpeg exited unexpectedly for stream %d: %v", streamID, err)

		// 更新数据库状态
		s.db.Model(&model.Stream{}).Where("id = ?", streamID).Updates(map[string]interface{}{
			"is_transcoding": false,
			"status":         "error",
			"health_status":  "unhealthy",
		})

		s.broadcastStreamStatus(streamID, tenantID, "transcoding_error", map[string]interface{}{
			"stream_id": streamID,
			"status":    "error",
			"error":     err.Error(),
		})
	}
}

// broadcastStreamStatus 通过 WebSocket 推送流状态变更
func (s *StreamProxyService) broadcastStreamStatus(streamID uint, tenantID string, eventType string, payload map[string]interface{}) {
	if s.hub == nil {
		return
	}
	msg := map[string]interface{}{
		"event":     eventType,
		"stream_id": streamID,
		"data":      payload,
	}
	if tenantID != "" {
		s.hub.BroadcastToTenant(tenantID, "stream-status", msg)
	} else {
		s.hub.BroadcastToAll("stream-status", msg)
	}
}
