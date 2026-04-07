package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// YOLODetectionPayload 是 WebSocket 推送的 YOLO 检测消息格式
type YOLODetectionPayload struct {
	StreamID        string            `json:"stream_id"`
	Timestamp       string            `json:"timestamp"`
	Detections      []DetectionObject `json:"detections"`
	ProcessedBy     string            `json:"processed_by,omitempty"` // "yolo-service" | "mock"
	InferenceTimeMs float64           `json:"inference_time_ms,omitempty"`
	ModelName       string            `json:"model_name,omitempty"`
}

// DetectionObject 是单个检测对象
type DetectionObject struct {
	Class      string     `json:"class"`      // crack/fire/person/vehicle等
	Confidence float64    `json:"confidence"` // 0.0 - 1.0
	BBox       [4]float64 `json:"bbox"`       // [x1, y1, x2, y2] 归一化坐标 0-1
	TrackID    *int       `json:"track_id,omitempty"`
}

// AlertPayload 是 WebSocket 推送的告警消息格式（与前端 AlertMessage 一致）
type AlertPayload struct {
	ID         string `json:"id"`
	Level      string `json:"level"` // P0/P1/P2/P3
	Title      string `json:"title"`
	Message    string `json:"message"`
	StreamID   string `json:"stream_id"`
	StreamName string `json:"stream_name,omitempty"`
	Location   string `json:"location,omitempty"`
	CreatedAt  string `json:"created_at"`
}

// YOLOServiceResponse 是 YOLO 服务 /detect 接口的响应格式
type YOLOServiceResponse struct {
	Timestamp  string `json:"timestamp"`
	Detections []struct {
		Class      string    `json:"class"`
		Confidence float64   `json:"confidence"`
		Bbox       []float64 `json:"bbox"`
	} `json:"detections"`
	InferenceTimeMs float64 `json:"inference_time_ms"`
	ModelName       string  `json:"model_name"`
	ImageSize       []int   `json:"image_size"`
}

// YOLOStreamDetectResponse 是 YOLO 服务 /detect/stream 接口的响应格式
type YOLOStreamDetectResponse struct {
	StreamURL  string `json:"stream_url"`
	Timestamp  string `json:"timestamp"`
	Detections []struct {
		Class      string    `json:"class"`
		Confidence float64   `json:"confidence"`
		Bbox       []float64 `json:"bbox"`
	} `json:"detections"`
	InferenceTimeMs float64 `json:"inference_time_ms"`
	ModelName       string  `json:"model_name"`
	ImageSize       []int   `json:"image_size"`
}

// alertThreshold 定义不同检测类型的告警阈值和级别
type alertThreshold struct {
	ConfidenceMin float64
	AlertLevel    string
	AlertType     string
}

var alertThresholds = map[string]alertThreshold{
	"fire":      {ConfidenceMin: 0.7, AlertLevel: "P0", AlertType: "yolo_fire"},
	"smoke":     {ConfidenceMin: 0.7, AlertLevel: "P0", AlertType: "yolo_smoke"},
	"intrusion": {ConfidenceMin: 0.8, AlertLevel: "P1", AlertType: "yolo_intrusion"},
	"crack":     {ConfidenceMin: 0.6, AlertLevel: "P2", AlertType: "yolo_defect"},
	"corrosion": {ConfidenceMin: 0.6, AlertLevel: "P2", AlertType: "yolo_defect"},
}

// YOLOWebSocketService 管理 YOLO 检测结果的 WebSocket 推送
// 支持:
// - 真实 YOLO 服务调用（HTTP API）
// - 检测结果持久化到数据库
// - 告警级别自动判断并联动告警系统
// - Mock 模式：开发环境自动生成模拟数据（fallback）
// - 定时检测模式：周期性对活跃视频流抓帧检测
type YOLOWebSocketService struct {
	hub              *WebSocketHub
	alertService     *AlertService
	detectionService *YOLODetectionService
	mu               sync.RWMutex
	enabled          bool

	// YOLO 服务配置
	yoloServiceURL string
	httpClient     *http.Client

	// Mock mode
	mockEnabled  bool
	mockInterval time.Duration
	mockStopChan chan struct{}
	mockTenants  []string

	// 定时检测
	detectInterval time.Duration
	detectStopChan chan struct{}
	activeStreams  map[string]string // streamID -> streamURL
}

// NewYOLOWebSocketService 创建 YOLO WebSocket 服务
func NewYOLOWebSocketService(hub *WebSocketHub, alertService *AlertService, detectionService *YOLODetectionService) *YOLOWebSocketService {
	yoloURL := os.Getenv("YOLO_SERVICE_URL")
	if yoloURL == "" {
		yoloURL = "http://localhost:8097"
	}

	mockEnabled := false
	if v := os.Getenv("YOLO_MOCK_ENABLED"); v == "true" || v == "1" {
		mockEnabled = true
	}

	detectIntervalSec := 5
	if v := os.Getenv("YOLO_DETECT_INTERVAL"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			detectIntervalSec = n
		}
	}

	svc := &YOLOWebSocketService{
		hub:              hub,
		alertService:     alertService,
		detectionService: detectionService,
		enabled:          true,
		yoloServiceURL:   strings.TrimRight(yoloURL, "/"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		mockEnabled:    mockEnabled,
		mockInterval:   3 * time.Second,
		mockTenants:    []string{"default"},
		detectInterval: time.Duration(detectIntervalSec) * time.Second,
		activeStreams:  make(map[string]string),
	}

	log.Printf("[YOLO-WS] Initialized: yolo_url=%s mock=%v detect_interval=%ds",
		svc.yoloServiceURL, svc.mockEnabled, detectIntervalSec)

	return svc
}

// DetectFromStream 调用 YOLO 服务对指定视频流进行一次检测
func (s *YOLOWebSocketService) DetectFromStream(streamID, streamURL string) (*YOLODetectionPayload, error) {
	url := s.yoloServiceURL + "/detect/stream"

	reqBody, err := json.Marshal(map[string]string{
		"stream_url": streamURL,
		"stream_id":  streamID,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	resp, err := s.httpClient.Post(url, "application/json", bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("call yolo service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("yolo service returned %d: %s", resp.StatusCode, string(body))
	}

	var yoloResp YOLOStreamDetectResponse
	if err := json.NewDecoder(resp.Body).Decode(&yoloResp); err != nil {
		return nil, fmt.Errorf("decode yolo response: %w", err)
	}

	// 转换为 WebSocket payload 格式
	payload := &YOLODetectionPayload{
		StreamID:        streamID,
		Timestamp:       time.Now().Format(time.RFC3339),
		ProcessedBy:     "yolo-service",
		InferenceTimeMs: yoloResp.InferenceTimeMs,
		ModelName:       yoloResp.ModelName,
	}

	for _, d := range yoloResp.Detections {
		det := DetectionObject{
			Class:      d.Class,
			Confidence: d.Confidence,
		}
		if len(d.Bbox) >= 4 {
			det.BBox = [4]float64{d.Bbox[0], d.Bbox[1], d.Bbox[2], d.Bbox[3]}
		}
		payload.Detections = append(payload.Detections, det)
	}

	return payload, nil
}

// DetectFromImage 调用 YOLO 服务对上传图片进行检测
func (s *YOLOWebSocketService) DetectFromImage(imageData []byte, filename string) (*YOLODetectionPayload, error) {
	url := s.yoloServiceURL + "/detect"

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	if _, err := part.Write(imageData); err != nil {
		return nil, fmt.Errorf("write image data: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close writer: %w", err)
	}

	req, err := http.NewRequest("POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call yolo service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("yolo service returned %d: %s", resp.StatusCode, string(body))
	}

	var yoloResp YOLOServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&yoloResp); err != nil {
		return nil, fmt.Errorf("decode yolo response: %w", err)
	}

	payload := &YOLODetectionPayload{
		Timestamp:       time.Now().Format(time.RFC3339),
		ProcessedBy:     "yolo-service",
		InferenceTimeMs: yoloResp.InferenceTimeMs,
		ModelName:       yoloResp.ModelName,
	}

	for _, d := range yoloResp.Detections {
		det := DetectionObject{
			Class:      d.Class,
			Confidence: d.Confidence,
		}
		if len(d.Bbox) >= 4 {
			det.BBox = [4]float64{d.Bbox[0], d.Bbox[1], d.Bbox[2], d.Bbox[3]}
		}
		payload.Detections = append(payload.Detections, det)
	}

	return payload, nil
}

// isYOLOServiceAvailable 检查 YOLO 服务是否可用
func (s *YOLOWebSocketService) isYOLOServiceAvailable() bool {
	resp, err := s.httpClient.Get(s.yoloServiceURL + "/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// processDetection 处理检测结果：推送 WebSocket + 持久化 + 触发告警
func (s *YOLOWebSocketService) processDetection(tenantID string, payload *YOLODetectionPayload) {
	// 1. 推送检测结果到 WebSocket
	if err := s.PushDetection(tenantID, payload); err != nil {
		log.Printf("[YOLO-WS] Push detection error: %v", err)
	}

	// 2. 持久化检测结果到数据库
	if s.detectionService != nil && len(payload.Detections) > 0 {
		if err := s.detectionService.SaveDetectionsFromPayload(
			tenantID, payload.StreamID, payload.Detections,
			payload.ProcessedBy, payload.InferenceTimeMs, payload.ModelName,
		); err != nil {
			log.Printf("[YOLO-WS] Save detection error: %v", err)
		}
	}

	// 3. 检查是否需要触发告警
	s.checkAndCreateAlerts(tenantID, payload)
}

// checkAndCreateAlerts 根据检测结果自动创建告警
func (s *YOLOWebSocketService) checkAndCreateAlerts(tenantID string, payload *YOLODetectionPayload) {
	if s.alertService == nil {
		return
	}

	for _, det := range payload.Detections {
		threshold, ok := alertThresholds[det.Class]
		if !ok {
			continue
		}
		if det.Confidence < threshold.ConfidenceMin {
			continue
		}

		// 创建告警
		streamIDUint := parseStreamIDToUint(payload.StreamID)
		alertReq := CreateAlertRequest{
			Level:   threshold.AlertLevel,
			Type:    threshold.AlertType,
			Title:   s.getAlertTitle([]DetectionObject{det}),
			Message: fmt.Sprintf("YOLO检测到 %s (置信度: %.1f%%), 流: %s", det.Class, det.Confidence*100, payload.StreamID),
		}
		if streamIDUint > 0 {
			alertReq.StreamID = &streamIDUint
		}

		if _, err := s.alertService.Create(tenantID, alertReq); err != nil {
			log.Printf("[YOLO-WS] Create alert error: %v", err)
		} else {
			log.Printf("[YOLO-WS] Alert created: level=%s type=%s class=%s conf=%.2f stream=%s",
				threshold.AlertLevel, threshold.AlertType, det.Class, det.Confidence, payload.StreamID)
		}
	}
}

// PushDetection 推送 YOLO 检测结果到指定租户
func (s *YOLOWebSocketService) PushDetection(tenantID string, payload *YOLODetectionPayload) error {
	if !s.enabled || s.hub == nil {
		return nil
	}

	// 序列化消息
	msg := WebSocketMessage{
		Type:      "yolo-detection",
		Payload:   payload,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	_, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	// 广播到指定租户
	s.hub.BroadcastToTenant(tenantID, "yolo-detection", payload)

	log.Printf("[YOLO-WS] Pushed detection for stream=%s tenant=%s detections=%d processed_by=%s",
		payload.StreamID, tenantID, len(payload.Detections), payload.ProcessedBy)
	return nil
}

// PushAlert 推送告警到指定租户
func (s *YOLOWebSocketService) PushAlert(tenantID string, payload *AlertPayload) error {
	if !s.enabled || s.hub == nil {
		return nil
	}

	s.hub.BroadcastToTenant(tenantID, "alert", payload)

	log.Printf("[YOLO-WS] Pushed alert tenant=%s level=%s title=%s",
		tenantID, payload.Level, payload.Title)
	return nil
}

// PushDetectionAndAlert 推送检测结果，同时处理持久化和告警（兼容旧接口）
func (s *YOLOWebSocketService) PushDetectionAndAlert(tenantID string, payload *YOLODetectionPayload) error {
	s.processDetection(tenantID, payload)
	return nil
}

// RegisterStream 注册活跃视频流用于定时检测
func (s *YOLOWebSocketService) RegisterStream(streamID, streamURL string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.activeStreams[streamID] = streamURL
	log.Printf("[YOLO-WS] Registered stream for detection: %s -> %s", streamID, streamURL)
}

// UnregisterStream 取消注册视频流
func (s *YOLOWebSocketService) UnregisterStream(streamID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.activeStreams, streamID)
	log.Printf("[YOLO-WS] Unregistered stream: %s", streamID)
}

// StartPeriodicDetection 启动定时检测模式
func (s *YOLOWebSocketService) StartPeriodicDetection(tenantID string) {
	s.mu.Lock()
	if s.detectStopChan != nil {
		s.mu.Unlock()
		return
	}
	s.detectStopChan = make(chan struct{})
	s.mu.Unlock()

	go func() {
		ticker := time.NewTicker(s.detectInterval)
		defer ticker.Stop()

		log.Printf("[YOLO-WS] Periodic detection started: interval=%v tenant=%s", s.detectInterval, tenantID)

		for {
			select {
			case <-ticker.C:
				s.runDetectionCycle(tenantID)
			case <-s.detectStopChan:
				log.Printf("[YOLO-WS] Periodic detection stopped for tenant=%s", tenantID)
				return
			}
		}
	}()
}

// StopPeriodicDetection 停止定时检测
func (s *YOLOWebSocketService) StopPeriodicDetection() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.detectStopChan != nil {
		close(s.detectStopChan)
		s.detectStopChan = nil
	}
}

// runDetectionCycle 执行一轮检测：对所有活跃流调用 YOLO 服务
func (s *YOLOWebSocketService) runDetectionCycle(tenantID string) {
	s.mu.RLock()
	streams := make(map[string]string, len(s.activeStreams))
	for k, v := range s.activeStreams {
		streams[k] = v
	}
	s.mu.RUnlock()

	if len(streams) == 0 {
		return
	}

	// 检查 YOLO 服务可用性，不可用时降级到 mock
	yoloAvailable := s.isYOLOServiceAvailable()

	for streamID, streamURL := range streams {
		var payload *YOLODetectionPayload
		var err error

		if yoloAvailable && streamURL != "" {
			payload, err = s.DetectFromStream(streamID, streamURL)
			if err != nil {
				log.Printf("[YOLO-WS] Detection failed for stream %s: %v, falling back to mock", streamID, err)
				payload = s.generateMockPayload(streamID)
			}
		} else {
			// YOLO 服务不可用，使用 mock 数据
			payload = s.generateMockPayload(streamID)
		}

		if payload != nil {
			s.processDetection(tenantID, payload)
		}
	}
}

// detectAlertLevel 判断检测结果中的最高告警级别
func (s *YOLOWebSocketService) detectAlertLevel(detections []DetectionObject) string {
	highestPriority := -1

	priorityMap := map[string]int{
		"P0": 3,
		"P1": 2,
		"P2": 1,
	}

	bestLevel := ""
	for _, d := range detections {
		if threshold, ok := alertThresholds[d.Class]; ok {
			if d.Confidence >= threshold.ConfidenceMin {
				if p, ok := priorityMap[threshold.AlertLevel]; ok && p > highestPriority {
					highestPriority = p
					bestLevel = threshold.AlertLevel
				}
			}
		}
	}

	return bestLevel
}

func (s *YOLOWebSocketService) getAlertTitle(detections []DetectionObject) string {
	classCounts := map[string]int{}
	for _, d := range detections {
		classCounts[d.Class]++
	}

	switch {
	case classCounts["fire"] > 0:
		return "🔥 火灾检测"
	case classCounts["smoke"] > 0:
		return "⚠️ 烟雾检测"
	case classCounts["intrusion"] > 0:
		return "🚨 区域入侵"
	case classCounts["crack"] > 0:
		return "🔧 裂缝缺陷"
	case classCounts["corrosion"] > 0:
		return "🔧 腐蚀缺陷"
	default:
		return "🔍 AI检测告警"
	}
}

func (s *YOLOWebSocketService) getAlertMessage(detections []DetectionObject) string {
	classCounts := map[string]int{}
	for _, d := range detections {
		classCounts[d.Class]++
	}

	switch {
	case classCounts["fire"] > 0:
		return "检测到明火，请立即确认"
	case classCounts["smoke"] > 0:
		return "检测到烟雾，可能存在火情"
	case classCounts["intrusion"] > 0:
		return "检测到未授权人员进入"
	case classCounts["crack"] > 0:
		return "检测到设备裂缝缺陷"
	case classCounts["corrosion"] > 0:
		return "检测到设备腐蚀"
	default:
		return "AI检测到异常目标"
	}
}

// ==================== Mock 模式 ====================

// StartMockMode 启动 Mock 模式，生成模拟检测数据
func (s *YOLOWebSocketService) StartMockMode(tenantID string) {
	if !s.mockEnabled {
		return
	}

	s.mu.Lock()
	if s.mockStopChan != nil {
		s.mu.Unlock()
		return
	}
	s.mockStopChan = make(chan struct{})
	s.mu.Unlock()

	go func() {
		ticker := time.NewTicker(s.mockInterval)
		defer ticker.Stop()

		streamIDs := []string{"1", "2", "3", "4", "5", "6", "7", "8"}

		for {
			select {
			case <-ticker.C:
				// 随机选择 1-3 个 stream 进行检测
				numStreams := 1 + int(time.Now().UnixNano()%3)
				for i := 0; i < numStreams; i++ {
					streamID := streamIDs[int(time.Now().UnixNano())%len(streamIDs)]
					payload := s.generateMockPayload(streamID)
					s.processDetection(tenantID, payload)
				}
			case <-s.mockStopChan:
				return
			}
		}
	}()

	log.Printf("[YOLO-WS] Mock mode started for tenant=%s", tenantID)
}

// generateMockPayload 生成模拟检测数据
func (s *YOLOWebSocketService) generateMockPayload(streamID string) *YOLODetectionPayload {
	detectionClasses := []struct {
		class  string
		weight float64
	}{
		{"person", 0.3},
		{"vehicle", 0.2},
		{"fire", 0.05},
		{"intrusion", 0.05},
		{"smoke", 0.05},
		{"crack", 0.15},
		{"corrosion", 0.1},
		{"animal", 0.1},
	}

	var detections []DetectionObject
	for j := 0; j < int(time.Now().UnixNano()%4); j++ {
		r := time.Now().UnixNano()
		total := 0.0
		for _, c := range detectionClasses {
			total += c.weight
		}
		randVal := float64(r%1000) / 1000.0 * total
		accum := 0.0
		class := "person"
		for _, c := range detectionClasses {
			accum += c.weight
			if randVal <= accum {
				class = c.class
				break
			}
		}

		detections = append(detections, DetectionObject{
			Class:      class,
			Confidence: 0.72 + float64(r%280)/1000.0,
			BBox: [4]float64{
				0.1 + float64(r%500)/1000.0,
				0.1 + float64((r/500)%500)/1000.0,
				0.3 + float64((r/1000)%400)/1000.0,
				0.3 + float64((r/1400)%400)/1000.0,
			},
		})
	}

	return &YOLODetectionPayload{
		StreamID:        streamID,
		Timestamp:       time.Now().Format(time.RFC3339),
		Detections:      detections,
		ProcessedBy:     "mock",
		InferenceTimeMs: 25 + float64(time.Now().UnixNano()%50),
		ModelName:       "mock-yolov8n",
	}
}

// StopMockMode 停止 Mock 模式
func (s *YOLOWebSocketService) StopMockMode() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.mockStopChan != nil {
		close(s.mockStopChan)
		s.mockStopChan = nil
	}
}

// EnableMock 启用/禁用 Mock 模式
func (s *YOLOWebSocketService) EnableMock(enabled bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.mockEnabled = enabled
}

// SetMockInterval 设置 Mock 推送间隔
func (s *YOLOWebSocketService) SetMockInterval(interval time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.mockInterval = interval
}

// ==================== 辅助函数 ====================

func generateUUID() string {
	return time.Now().Format("20060102150405") + "-" + yoloRandomString(12)
}

func yoloRandomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	t := time.Now().UnixNano()
	for i := 0; i < n; i++ {
		b[i] = letters[int(t>>uint(i*3))%len(letters)]
	}
	return string(b)
}

func parseStreamIDToUint(streamID string) uint {
	if n, err := strconv.ParseUint(streamID, 10, 64); err == nil {
		return uint(n)
	}
	return 0
}
