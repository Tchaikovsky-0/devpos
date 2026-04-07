package service

import (
	"fmt"
	"testing"

	"xunjianbao-backend/pkg/pagination"
)

func TestStreamService_Create(t *testing.T) {
	db := setupTestDB(t)
	service := NewStreamService(db)

	tests := []struct {
		name        string
		tenantID    string
		req         CreateStreamRequest
		wantErr     bool
		description string
	}{
		{
			name:     "create RTSP stream",
			tenantID: "tenant_1",
			req: CreateStreamRequest{
				Name:        "Main Gate Camera",
				Type:        "rtsp",
				URL:         "rtsp://192.168.1.100:554/stream",
				Location:    "Main Gate",
				LAT:         39.9042,
				LNG:         116.4074,
				Description: "Front entrance camera",
			},
			wantErr: false,
		},
		{
			name:     "create WebRTC stream",
			tenantID: "tenant_1",
			req: CreateStreamRequest{
				Name:     "Warehouse Camera",
				Type:     "webrtc",
				URL:      "webrtc://server/stream",
				Location: "Warehouse A",
			},
			wantErr: false,
		},
		{
			name:     "create HLS stream with inactive status",
			tenantID: "tenant_2",
			req: CreateStreamRequest{
				Name:     "Drone Feed",
				Type:     "hls",
				URL:      "http://server/stream.m3u8",
				IsActive: boolPtr(false),
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stream, err := service.Create(tt.tenantID, tt.req)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				if stream == nil {
					t.Error("expected stream but got nil")
					return
				}
				if stream.Name != tt.req.Name {
					t.Errorf("expected name %s, got %s", tt.req.Name, stream.Name)
				}
				if stream.Type != tt.req.Type {
					t.Errorf("expected type %s, got %s", tt.req.Type, stream.Type)
				}
				if stream.TenantID != tt.tenantID {
					t.Errorf("expected tenant_id %s, got %s", tt.tenantID, stream.TenantID)
				}
				if stream.Status != "offline" {
					t.Errorf("expected status 'offline', got %s", stream.Status)
				}
				if stream.ID == 0 {
					t.Error("expected non-zero ID")
				}
			}
		})
	}
}

func TestStreamService_List(t *testing.T) {
	db := setupTestDB(t)
	service := NewStreamService(db)

	// Create test streams
	tenantID := "tenant_1"
	streams := []CreateStreamRequest{
		{Name: "Camera 1", Type: "rtsp", URL: "rtsp://camera1"},
		{Name: "Camera 2", Type: "rtsp", URL: "rtsp://camera2"},
		{Name: "Camera 3", Type: "webrtc", URL: "webrtc://camera3"},
	}

	for _, s := range streams {
		_, err := service.Create(tenantID, s)
		if err != nil {
			t.Fatalf("failed to create test stream: %v", err)
		}
	}

	// Create streams for different tenant
	_, _ = service.Create("tenant_2", CreateStreamRequest{
		Name: "Other Tenant Camera",
		Type: "rtsp",
		URL:  "rtsp://other",
	})

	tests := []struct {
		name          string
		tenantID      string
		pageSize      int
		page          int
		expectedCount int
		expectedTotal int64
		description   string
	}{
		{
			name:          "list all streams for tenant",
			tenantID:      "tenant_1",
			pageSize:      10,
			page:          1,
			expectedCount: 3,
			expectedTotal: 3,
		},
		{
			name:          "pagination - first page",
			tenantID:      "tenant_1",
			pageSize:      2,
			page:          1,
			expectedCount: 2,
			expectedTotal: 3,
		},
		{
			name:          "pagination - second page",
			tenantID:      "tenant_1",
			pageSize:      2,
			page:          2,
			expectedCount: 1,
			expectedTotal: 3,
		},
		{
			name:          "different tenant isolation",
			tenantID:      "tenant_2",
			pageSize:      10,
			page:          1,
			expectedCount: 1,
			expectedTotal: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			params := pagination.Params{
				Page:     tt.page,
				PageSize: tt.pageSize,
				Offset:   (tt.page - 1) * tt.pageSize,
			}

			result, total, err := service.List(tt.tenantID, params)

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if len(result) != tt.expectedCount {
				t.Errorf("expected %d streams, got %d", tt.expectedCount, len(result))
			}
			if total != tt.expectedTotal {
				t.Errorf("expected total %d, got %d", tt.expectedTotal, total)
			}
		})
	}
}

func TestStreamService_GetByID(t *testing.T) {
	db := setupTestDB(t)
	service := NewStreamService(db)

	// Create test stream
	tenantID := "tenant_1"
	stream, err := service.Create(tenantID, CreateStreamRequest{
		Name: "Test Camera",
		Type: "rtsp",
		URL:  "rtsp://test",
	})
	if err != nil {
		t.Fatalf("failed to create test stream: %v", err)
	}

	tests := []struct {
		name     string
		tenantID string
		id       string
		wantErr  bool
	}{
		{
			name:     "existing stream",
			tenantID: tenantID,
			id:       fmt.Sprintf("%d", stream.ID),
			wantErr:  false,
		},
		{
			name:     "non-existent stream",
			tenantID: tenantID,
			id:       "99999",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.GetByID(tt.tenantID, tt.id)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
				}
				if err != ErrNotFound {
					t.Errorf("expected ErrNotFound, got %v", err)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				if result.Name != stream.Name {
					t.Errorf("expected name %s, got %s", stream.Name, result.Name)
				}
			}
		})
	}
}

func TestStreamService_Update(t *testing.T) {
	db := setupTestDB(t)
	service := NewStreamService(db)

	// Create test stream
	tenantID := "tenant_1"
	stream, err := service.Create(tenantID, CreateStreamRequest{
		Name:     "Original Name",
		Type:     "rtsp",
		URL:      "rtsp://original",
		Location: "Original Location",
	})
	if err != nil {
		t.Fatalf("failed to create test stream: %v", err)
	}

	tests := []struct {
		name        string
		tenantID    string
		id          string
		req         UpdateStreamRequest
		wantErr     bool
		checkFields map[string]interface{}
		description string
	}{
		{
			name:     "update name",
			tenantID: tenantID,
			id:       fmt.Sprintf("%d", stream.ID),
			req: UpdateStreamRequest{
				Name: strPtr("Updated Name"),
			},
			wantErr: false,
			checkFields: map[string]interface{}{
				"name": "Updated Name",
			},
		},
		{
			name:     "update multiple fields",
			tenantID: tenantID,
			id:       fmt.Sprintf("%d", stream.ID),
			req: UpdateStreamRequest{
				Name:     strPtr("New Name"),
				Type:     strPtr("webrtc"),
				Location: strPtr("New Location"),
			},
			wantErr: false,
			checkFields: map[string]interface{}{
				"name":     "New Name",
				"type":     "webrtc",
				"location": "New Location",
			},
		},
		{
			name:     "update status",
			tenantID: tenantID,
			id:       fmt.Sprintf("%d", stream.ID),
			req: UpdateStreamRequest{
				Status: strPtr("online"),
			},
			wantErr: false,
			checkFields: map[string]interface{}{
				"status": "online",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Update(tt.tenantID, tt.id, tt.req)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				for field, expected := range tt.checkFields {
					switch field {
					case "name":
						if result.Name != expected {
							t.Errorf("expected name %v, got %v", expected, result.Name)
						}
					case "type":
						if result.Type != expected {
							t.Errorf("expected type %v, got %v", expected, result.Type)
						}
					case "location":
						if result.Location != expected {
							t.Errorf("expected location %v, got %v", expected, result.Location)
						}
					case "status":
						if result.Status != expected {
							t.Errorf("expected status %v, got %v", expected, result.Status)
						}
					}
				}
			}
		})
	}
}

func TestStreamService_Delete(t *testing.T) {
	db := setupTestDB(t)
	service := NewStreamService(db)

	// Create test stream
	tenantID := "tenant_1"
	stream, err := service.Create(tenantID, CreateStreamRequest{
		Name: "To Delete",
		Type: "rtsp",
		URL:  "rtsp://delete",
	})
	if err != nil {
		t.Fatalf("failed to create test stream: %v", err)
	}

	tests := []struct {
		name     string
		tenantID string
		id       string
		wantErr  bool
	}{
		{
			name:     "delete existing stream",
			tenantID: tenantID,
			id:       fmt.Sprintf("%d", stream.ID),
			wantErr:  false,
		},
		{
			name:     "delete non-existent stream",
			tenantID: tenantID,
			id:       "99999",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.Delete(tt.tenantID, tt.id)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
				}
				if err != ErrNotFound {
					t.Errorf("expected ErrNotFound, got %v", err)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				// Verify stream is deleted
				_, err := service.GetByID(tt.tenantID, tt.id)
				if err == nil {
					t.Error("expected stream to be deleted")
				}
			}
		})
	}
}

func TestStreamService_Statistics(t *testing.T) {
	db := setupTestDB(t)
	service := NewStreamService(db)

	tenantID := "tenant_1"

	// Create streams with different statuses
	_, _ = service.Create(tenantID, CreateStreamRequest{Name: "Online Camera", Type: "rtsp", URL: "rtsp://1"})
	_, _ = service.Create(tenantID, CreateStreamRequest{Name: "Offline Camera", Type: "rtsp", URL: "rtsp://2"})
	_, _ = service.Create(tenantID, CreateStreamRequest{Name: "Warning Camera", Type: "rtsp", URL: "rtsp://3"})

	// Update statuses
	_, _ = service.Update(tenantID, "1", UpdateStreamRequest{Status: strPtr("online")})
	_, _ = service.Update(tenantID, "2", UpdateStreamRequest{Status: strPtr("offline")})
	_, _ = service.Update(tenantID, "3", UpdateStreamRequest{Status: strPtr("warning")})

	stats, err := service.Statistics(tenantID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats["total"] != int64(3) {
		t.Errorf("expected total 3, got %v", stats["total"])
	}
	if stats["online"] != int64(1) {
		t.Errorf("expected online 1, got %v", stats["online"])
	}
	if stats["offline"] != int64(1) {
		t.Errorf("expected offline 1, got %v", stats["offline"])
	}
	if stats["warning"] != int64(1) {
		t.Errorf("expected warning 1, got %v", stats["warning"])
	}
}

// Helper functions
func boolPtr(b bool) *bool {
	return &b
}

func strPtr(s string) *string {
	return &s
}
