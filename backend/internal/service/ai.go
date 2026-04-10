package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/config"
)

type AIService struct {
	db       *gorm.DB
	cfg      *config.Config
	client   *http.Client
	openclaw *OpenClawService
}

func NewAIService(db *gorm.DB, cfg *config.Config) *AIService {
	return &AIService{
		db:  db,
		cfg: cfg,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
		openclaw: NewOpenClawService(db, cfg),
	}
}

// aiBaseURL returns the AI service base URL
func (s *AIService) aiBaseURL() string {
	return s.cfg.AIServiceURL
}

// doJSON sends a JSON request and returns the response as map
func (s *AIService) doJSON(method, path string, body interface{}) (map[string]interface{}, error) {
	var reqBody io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal request: %w", err)
		}
		reqBody = bytes.NewReader(data)
	}

	req, err := http.NewRequest(method, s.aiBaseURL()+path, reqBody)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	result := make(map[string]interface{})
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	return result, nil
}

// Chat sends a chat message to the AI service
func (s *AIService) Chat(question string) (string, error) {
	resp, err := s.doJSON("POST", "/api/v1/chat", map[string]interface{}{
		"messages": []map[string]string{
			{"role": "user", "content": question},
		},
	})
	if err != nil {
		// Fallback to stub response if AI service is unavailable
		return "AI 服务暂不可用，请稍后再试。错误: " + err.Error(), nil
	}

	// Extract response content
	if msg, ok := resp["message"].(map[string]interface{}); ok {
		if content, ok := msg["content"].(string); ok {
			return content, nil
		}
	}

	return "AI 返回格式异常", nil
}

// Analyze sends analysis request to AI service
func (s *AIService) Analyze(data string) (string, error) {
	resp, err := s.doJSON("POST", "/api/v1/analyze", map[string]interface{}{
		"type": "alert",
		"data": map[string]interface{}{
			"description": data,
		},
	})
	if err != nil {
		return "分析服务暂不可用", nil
	}

	resultJSON, _ := json.Marshal(resp)
	return string(resultJSON), nil
}

// Suggest sends a suggestion request
func (s *AIService) Suggest(data string) (string, error) {
	resp, err := s.doJSON("POST", "/api/v1/chat", map[string]interface{}{
		"messages": []map[string]string{
			{"role": "system", "content": "你是一个巡检建议助手，根据提供的数据给出专业建议。"},
			{"role": "user", "content": data},
		},
	})
	if err != nil {
		return "建议服务暂不可用", nil
	}

	if msg, ok := resp["message"].(map[string]interface{}); ok {
		if content, ok := msg["content"].(string); ok {
			return content, nil
		}
	}

	return "建议生成失败", nil
}

// GetModels lists available AI models
func (s *AIService) GetModels() ([]map[string]interface{}, error) {
	resp, err := s.doJSON("GET", "/api/v1/models", nil)
	if err != nil {
		// Return fallback models
		return []map[string]interface{}{
			{"name": "yolov8-fire", "type": "detection", "description": "火灾检测模型", "loaded": false, "device": "cpu"},
			{"name": "yolov8-intrusion", "type": "detection", "description": "入侵检测模型", "loaded": false, "device": "cpu"},
			{"name": "yolov8-defect", "type": "detection", "description": "缺陷检测模型", "loaded": false, "device": "cpu"},
			{"name": "yolov8-general", "type": "detection", "description": "通用检测模型", "loaded": false, "device": "cpu"},
		}, nil
	}

	if models, ok := resp["models"].([]interface{}); ok {
		result := make([]map[string]interface{}, 0, len(models))
		for _, m := range models {
			if mm, ok := m.(map[string]interface{}); ok {
				result = append(result, mm)
			}
		}
		return result, nil
	}

	return []map[string]interface{}{}, nil
}

// Inspection runs AI inspection for a stream
func (s *AIService) Inspection(streamID string) (map[string]interface{}, error) {
	resp, err := s.doJSON("GET", fmt.Sprintf("/api/v1/inspection?stream_id=%s&type=general&sensitivity=0.5", streamID), nil)
	if err != nil {
		return map[string]interface{}{
			"stream_id":  streamID,
			"status":     "unavailable",
			"detections": []interface{}{},
			"score":      0,
		}, nil
	}
	return resp, nil
}

// Detect runs detection for a stream with image bytes
func (s *AIService) Detect(streamID string) (map[string]interface{}, error) {
	resp, err := s.doJSON("POST", "/api/v1/detect", map[string]interface{}{
		"stream_id": streamID,
	})
	if err != nil {
		return map[string]interface{}{
			"stream_id": streamID,
			"status":    "unavailable",
			"objects":   []interface{}{},
		}, nil
	}
	return resp, nil
}

// DetectWithImage runs detection with uploaded image
func (s *AIService) DetectWithImage(streamID string, imageData []byte, filename string) (map[string]interface{}, error) {
	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	if _, err := part.Write(imageData); err != nil {
		return nil, fmt.Errorf("write image data: %w", err)
	}
	writer.Close()

	url := fmt.Sprintf("%s/api/v1/detect/%s", s.aiBaseURL(), streamID)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return map[string]interface{}{
			"stream_id": streamID,
			"status":    "unavailable",
			"objects":   []interface{}{},
		}, nil
	}
	defer resp.Body.Close()

	result := make(map[string]interface{})
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	return result, nil
}

// GenerateReport generates an AI inspection report
func (s *AIService) GenerateReport(data string) (map[string]interface{}, error) {
	var reqBody map[string]interface{}
	if err := json.Unmarshal([]byte(data), &reqBody); err != nil {
		reqBody = map[string]interface{}{
			"title":       "巡检报告",
			"report_type": "daily",
		}
	}

	resp, err := s.doJSON("POST", "/api/v1/reports/generate", reqBody)
	if err != nil {
		return map[string]interface{}{
			"status":    "unavailable",
			"report_id": fmt.Sprintf("rpt_%d", time.Now().Unix()),
		}, nil
	}
	return resp, nil
}

// AnalyzeAlert sends an alert for AI analysis
func (s *AIService) AnalyzeAlert(alertID string) (map[string]interface{}, error) {
	return s.doJSON("POST", fmt.Sprintf("/api/v1/analyze-alert/%s", alertID), nil)
}

// DiagnoseDevice sends a device for AI diagnosis
func (s *AIService) DiagnoseDevice(deviceID string) (map[string]interface{}, error) {
	return s.doJSON("POST", fmt.Sprintf("/api/v1/diagnose-device/%s", deviceID), nil)
}

// PredictStorage predicts storage usage
func (s *AIService) PredictStorage(streamID string) (map[string]interface{}, error) {
	return s.doJSON("GET", fmt.Sprintf("/api/v1/predict/storage/%s", streamID), nil)
}

// ---------------------------------------------------------------------------
// Chat with session + OpenClaw fallback
// ---------------------------------------------------------------------------

// ChatRequest represents an enhanced chat request with session support
type ChatRequest struct {
	Message   string                 `json:"message"`
	SessionID string                 `json:"session_id,omitempty"`
	Context   map[string]interface{} `json:"context,omitempty"`
}

// ChatWithSession sends a chat message through OpenClaw -> Python AI fallback chain.
func (s *AIService) ChatWithSession(ctx context.Context, req ChatRequest) (map[string]interface{}, error) {
	// Build the payload for the Python AI service
	payload := map[string]interface{}{
		"messages": []map[string]string{
			{"role": "user", "content": req.Message},
		},
	}
	if req.SessionID != "" {
		payload["session_id"] = req.SessionID
	}
	if req.Context != nil {
		payload["context"] = req.Context
	}

	// Fallback to Python AI
	resp, err := s.doJSON("POST", "/api/v1/chat", payload)
	if err != nil {
		return map[string]interface{}{
			"message":    "AI 服务暂不可用，请稍后再试。",
			"session_id": req.SessionID,
			"source":     "fallback",
		}, nil
	}

	// Extract content from Python AI response
	message := ""
	sessionID := req.SessionID
	var suggestions []string

	if msg, ok := resp["message"].(map[string]interface{}); ok {
		if content, ok := msg["content"].(string); ok {
			message = content
		}
	}
	if sid, ok := resp["session_id"].(string); ok && sid != "" {
		sessionID = sid
	}
	if sugs, ok := resp["suggestions"].([]interface{}); ok {
		for _, s := range sugs {
			if str, ok := s.(string); ok {
				suggestions = append(suggestions, str)
			}
		}
	}

	return map[string]interface{}{
		"message":     message,
		"session_id":  sessionID,
		"suggestions": suggestions,
		"source":      "python-ai",
	}, nil
}

// ChatStreamSSE proxies the SSE stream from the Python AI service to the client.
func (s *AIService) ChatStreamSSE(ctx context.Context, req ChatRequest, writer io.Writer, flusher http.Flusher) error {
	payload := map[string]interface{}{
		"messages": []map[string]string{
			{"role": "user", "content": req.Message},
		},
	}
	if req.SessionID != "" {
		payload["session_id"] = req.SessionID
	}
	if req.Context != nil {
		payload["context"] = req.Context
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", s.aiBaseURL()+"/api/v1/chat/stream", bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data:") || strings.HasPrefix(line, "event:") || line == "" {
			fmt.Fprintf(writer, "%s\n", line)
			if flusher != nil {
				flusher.Flush()
			}
		}
	}

	return scanner.Err()
}

// ---------------------------------------------------------------------------
// Session management (proxy to Python AI service)
// ---------------------------------------------------------------------------

// GetSessions fetches all chat sessions from the Python AI service.
func (s *AIService) GetSessions() ([]map[string]interface{}, error) {
	resp, err := s.doJSON("GET", "/api/v1/sessions", nil)
	if err != nil {
		return []map[string]interface{}{}, nil
	}
	if sessions, ok := resp["sessions"].([]interface{}); ok {
		result := make([]map[string]interface{}, 0, len(sessions))
		for _, sess := range sessions {
			if m, ok := sess.(map[string]interface{}); ok {
				result = append(result, m)
			}
		}
		return result, nil
	}
	return []map[string]interface{}{}, nil
}

// GetSession fetches a single chat session by ID.
func (s *AIService) GetSession(sessionID string) (map[string]interface{}, error) {
	resp, err := s.doJSON("GET", fmt.Sprintf("/api/v1/sessions/%s", sessionID), nil)
	if err != nil {
		return nil, fmt.Errorf("session not found")
	}
	return resp, nil
}

// DeleteSession deletes a chat session by ID.
func (s *AIService) DeleteSession(sessionID string) error {
	req, err := http.NewRequest("DELETE", s.aiBaseURL()+fmt.Sprintf("/api/v1/sessions/%s", sessionID), nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("session not found")
	}
	return nil
}
