package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/config"
)

type AIService struct {
	db     *gorm.DB
	cfg    *config.Config
	client *http.Client
}

func NewAIService(db *gorm.DB, cfg *config.Config) *AIService {
	return &AIService{
		db:  db,
		cfg: cfg,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
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
