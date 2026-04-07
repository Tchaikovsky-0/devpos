// Package ai_service provides a typed Go client for the Python AI Service.
package ai_service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// Client is a typed HTTP client for the AI Service (Python FastAPI).
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient creates a new AI Service client.
func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

// HealthResponse represents the health check response.
type HealthResponse struct {
	Status      string     `json:"status"`
	Service     string     `json:"service"`
	Version     string     `json:"version"`
	Timestamp   string     `json:"timestamp"`
	YOLOService *HealthYolo `json:"yolo_service,omitempty"`
}

type HealthYolo struct {
	Status      string `json:"status"`
	ModelLoaded bool   `json:"model_loaded"`
	Device      string `json:"device"`
}

// Health checks the AI service health.
func (c *Client) Health() (*HealthResponse, error) {
	var resp HealthResponse
	if err := c.doJSON("GET", "/health", nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

// DetectRequest is the detection request body.
type DetectRequest struct {
	StreamID string `json:"stream_id"`
}

// DetectedBBox represents a bounding box.
type DetectedBBox struct {
	X1 float64 `json:"x1"`
	Y1 float64 `json:"y1"`
	X2 float64 `json:"x2"`
	Y2 float64 `json:"y2"`
}

// DetectedItem represents a single detection.
type DetectedItem struct {
	ClassName  string        `json:"class_name"`
	Confidence float64       `json:"confidence"`
	BBox       DetectedBBox  `json:"bbox"`
}

// DetectResponse is the detection result.
type DetectResponse struct {
	ID             string         `json:"id"`
	StreamID       string         `json:"stream_id"`
	Objects        []DetectedItem `json:"objects"`
	Confidence     float64        `json:"confidence"`
	ProcessingTime float64        `json:"processing_time"`
}

// Detect runs YOLO detection for a stream.
func (c *Client) Detect(streamID string) (*DetectResponse, error) {
	var resp DetectResponse
	err := c.doJSON("POST", "/api/v1/detect", DetectRequest{StreamID: streamID}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// DetectWithImage runs detection with an uploaded image.
func (c *Client) DetectWithImage(streamID string, imageData []byte, filename string) (*DetectResponse, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	part.Write(imageData)
	writer.Close()

	req, _ := http.NewRequest("POST", c.BaseURL+"/api/v1/detect/"+streamID, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	httpResp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request: %w", err)
	}
	defer httpResp.Body.Close()

	var resp DetectResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

// ChatReq is the chat request.
type ChatReq struct {
	Messages []ChatMsg `json:"messages"`
	Model    string    `json:"model,omitempty"`
}

// ChatMsg is a single chat message.
type ChatMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatResp is the chat response.
type ChatResp struct {
	Message ChatMsg `json:"message"`
	Model   string  `json:"model"`
}

// Chat sends a chat completion request.
func (c *Client) Chat(messages []ChatMsg) (*ChatResp, error) {
	var resp ChatResp
	err := c.doJSON("POST", "/api/v1/chat", ChatReq{Messages: messages}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

// AnalysisReq is the analysis request.
type AnalysisReq struct {
	Type     string                 `json:"type"`
	Data     map[string]interface{} `json:"data"`
	StreamID string                 `json:"stream_id,omitempty"`
}

// AnalysisResp is the analysis response.
type AnalysisResp struct {
	Type            string                 `json:"type"`
	Result          map[string]interface{} `json:"result"`
	Confidence      float64                `json:"confidence"`
	Recommendations []string               `json:"recommendations"`
	Severity        string                 `json:"severity"`
}

// Analyze runs AI analysis.
func (c *Client) Analyze(analysisType string, data map[string]interface{}) (*AnalysisResp, error) {
	var resp AnalysisResp
	err := c.doJSON("POST", "/api/v1/analyze", AnalysisReq{Type: analysisType, Data: data}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

// ReportReq is the report generation request.
type ReportReq struct {
	Title      string   `json:"title"`
	ReportType string   `json:"report_type"`
	StreamIDs  []string `json:"stream_ids,omitempty"`
}

// ReportResp is the report generation response.
type ReportResp struct {
	Title       string                   `json:"title"`
	ReportType  string                   `json:"report_type"`
	Content     string                   `json:"content"`
	Summary     string                   `json:"summary"`
	GeneratedAt string                   `json:"generated_at"`
	Sections    []map[string]interface{} `json:"sections"`
}

// GenerateReport generates an inspection report.
func (c *Client) GenerateReport(req ReportReq) (*ReportResp, error) {
	var resp ReportResp
	err := c.doJSON("POST", "/api/v1/reports/generate", req, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

// ModelInfo represents an AI model.
type ModelInfo struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Loaded      bool   `json:"loaded"`
	Device      string `json:"device"`
}

// ModelsResp is the model list response.
type ModelsResp struct {
	Models []ModelInfo `json:"models"`
}

// ListModels lists available AI models.
func (c *Client) ListModels() (*ModelsResp, error) {
	var resp ModelsResp
	if err := c.doJSON("GET", "/api/v1/models", nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Inspection
// ---------------------------------------------------------------------------

// InspectionResp is the inspection response.
type InspectionResp struct {
	StreamID       string                   `json:"stream_id"`
	InspectionType string                   `json:"inspection_type"`
	Status         string                   `json:"status"`
	Findings       []map[string]interface{} `json:"findings"`
	Score          float64                  `json:"score"`
	Timestamp      string                   `json:"timestamp"`
}

// RunInspection runs AI inspection for a stream.
func (c *Client) RunInspection(streamID, inspectionType string, sensitivity float64) (*InspectionResp, error) {
	var resp InspectionResp
	path := fmt.Sprintf("/api/v1/inspection?stream_id=%s&type=%s&sensitivity=%f", streamID, inspectionType, sensitivity)
	if err := c.doJSON("GET", path, nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func (c *Client) doJSON(method, path string, body interface{}, result interface{}) error {
	var reqBody io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal: %w", err)
		}
		reqBody = bytes.NewReader(data)
	}

	req, err := http.NewRequest(method, c.BaseURL+path, reqBody)
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(bodyBytes))
	}

	if result != nil {
		if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
			return fmt.Errorf("decode: %w", err)
		}
	}
	return nil
}
