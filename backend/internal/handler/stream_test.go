package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

func setupStreamTestRouter(t *testing.T) (*gin.Engine, *service.StreamService) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	db.AutoMigrate(&model.Stream{})

	streamService := service.NewStreamService(db)
	streamHandler := NewStreamHandler(streamService, nil)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add mock tenant_id to context via middleware
	router.Use(func(c *gin.Context) {
		c.Set("tenant_id", "tenant_test")
		c.Next()
	})

	router.GET("/api/v1/streams", streamHandler.List)
	router.GET("/api/v1/streams/:id", streamHandler.GetByID)
	router.POST("/api/v1/streams", streamHandler.Create)
	router.PUT("/api/v1/streams/:id", streamHandler.Update)
	router.DELETE("/api/v1/streams/:id", streamHandler.Delete)
	router.GET("/api/v1/streams/statistics", streamHandler.Statistics)

	return router, streamService
}

func TestStreamHandler_Create(t *testing.T) {
	router, _ := setupStreamTestRouter(t)

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
		description    string
	}{
		{
			name: "create RTSP stream",
			payload: map[string]interface{}{
				"name":     "Main Gate Camera",
				"type":     "rtsp",
				"url":      "rtsp://192.168.1.100:554/stream",
				"location": "Main Gate",
				"lat":      39.9042,
				"lng":      116.4074,
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "create WebRTC stream",
			payload: map[string]interface{}{
				"name": "Warehouse Camera",
				"type": "webrtc",
				"url":  "webrtc://server/stream",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "missing name",
			payload: map[string]interface{}{
				"type": "rtsp",
				"url":  "rtsp://test",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing type",
			payload: map[string]interface{}{
				"name": "Test Camera",
				"url":  "rtsp://test",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/streams", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d, body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}

			if tt.expectedStatus == http.StatusCreated {
				var response struct {
					Code    int                    `json:"code"`
					Message string                 `json:"message"`
					Data    map[string]interface{} `json:"data"`
				}
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					t.Fatalf("failed to parse response: %v", err)
				}
				if response.Code != 201 {
					t.Errorf("expected response code 201, got %d", response.Code)
				}
				if response.Data["name"] != tt.payload["name"] {
					t.Errorf("expected name %v, got %v", tt.payload["name"], response.Data["name"])
				}
			}
		})
	}
}

func TestStreamHandler_List(t *testing.T) {
	router, streamService := setupStreamTestRouter(t)

	// Create test streams
	for i := 1; i <= 5; i++ {
		_, err := streamService.Create("tenant_test", service.CreateStreamRequest{
			Name: fmt.Sprintf("Camera %d", i),
			Type: "rtsp",
			URL:  fmt.Sprintf("rtsp://camera%d", i),
		})
		if err != nil {
			t.Fatalf("failed to create test stream: %v", err)
		}
	}

	tests := []struct {
		name          string
		url           string
		expectedCount int
		description   string
	}{
		{
			name:          "list all streams",
			url:           "/api/v1/streams",
			expectedCount: 5,
		},
		{
			name:          "pagination - page 1",
			url:           "/api/v1/streams?page=1&page_size=3",
			expectedCount: 3,
		},
		{
			name:          "pagination - page 2",
			url:           "/api/v1/streams?page=2&page_size=3",
			expectedCount: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.url, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d", w.Code)
			}

			var response struct {
				Code    int                      `json:"code"`
				Message string                   `json:"message"`
				Data    []map[string]interface{} `json:"data"`
				Total   int64                    `json:"total"`
				Page    int                      `json:"page"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Fatalf("failed to parse response: %v", err)
			}

			if len(response.Data) != tt.expectedCount {
				t.Errorf("expected %d streams, got %d", tt.expectedCount, len(response.Data))
			}
		})
	}
}

func TestStreamHandler_GetByID(t *testing.T) {
	router, streamService := setupStreamTestRouter(t)

	// Create test stream
	stream, err := streamService.Create("tenant_test", service.CreateStreamRequest{
		Name: "Test Camera",
		Type: "rtsp",
		URL:  "rtsp://test",
	})
	if err != nil {
		t.Fatalf("failed to create test stream: %v", err)
	}

	tests := []struct {
		name           string
		url            string
		expectedStatus int
		description    string
	}{
		{
			name:           "get existing stream",
			url:            fmt.Sprintf("/api/v1/streams/%d", stream.ID),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "get non-existent stream",
			url:            "/api/v1/streams/99999",
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.url, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d, body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}
		})
	}
}

func TestStreamHandler_Update(t *testing.T) {
	router, streamService := setupStreamTestRouter(t)

	// Create test stream
	stream, err := streamService.Create("tenant_test", service.CreateStreamRequest{
		Name:     "Original Name",
		Type:     "rtsp",
		URL:      "rtsp://original",
		Location: "Original Location",
	})
	if err != nil {
		t.Fatalf("failed to create test stream: %v", err)
	}

	tests := []struct {
		name           string
		url            string
		payload        map[string]interface{}
		expectedStatus int
		description    string
	}{
		{
			name: "update stream name",
			url:  fmt.Sprintf("/api/v1/streams/%d", stream.ID),
			payload: map[string]interface{}{
				"name": "Updated Name",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "update stream status",
			url:  fmt.Sprintf("/api/v1/streams/%d", stream.ID),
			payload: map[string]interface{}{
				"status": "online",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "update non-existent stream",
			url:  "/api/v1/streams/99999",
			payload: map[string]interface{}{
				"name": "Updated Name",
			},
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPut, tt.url, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d, body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}
		})
	}
}

func TestStreamHandler_Delete(t *testing.T) {
	router, streamService := setupStreamTestRouter(t)

	// Create test stream
	stream, err := streamService.Create("tenant_test", service.CreateStreamRequest{
		Name: "To Delete",
		Type: "rtsp",
		URL:  "rtsp://delete",
	})
	if err != nil {
		t.Fatalf("failed to create test stream: %v", err)
	}

	tests := []struct {
		name           string
		url            string
		expectedStatus int
		description    string
	}{
		{
			name:           "delete existing stream",
			url:            fmt.Sprintf("/api/v1/streams/%d", stream.ID),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "delete non-existent stream",
			url:            "/api/v1/streams/99999",
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodDelete, tt.url, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d, body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}
		})
	}
}

func TestStreamHandler_Statistics(t *testing.T) {
	router, streamService := setupStreamTestRouter(t)

	// Create test streams with different statuses
	_, _ = streamService.Create("tenant_test", service.CreateStreamRequest{
		Name: "Online Camera",
		Type: "rtsp",
		URL:  "rtsp://1",
	})
	_, _ = streamService.Create("tenant_test", service.CreateStreamRequest{
		Name: "Offline Camera",
		Type: "rtsp",
		URL:  "rtsp://2",
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/streams/statistics", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var response struct {
		Code    int                    `json:"code"`
		Message string                 `json:"message"`
		Data    map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response.Data["total"] == nil {
		t.Error("expected total in statistics")
	}
	if response.Data["online"] == nil {
		t.Error("expected online in statistics")
	}
	if response.Data["offline"] == nil {
		t.Error("expected offline in statistics")
	}
}
