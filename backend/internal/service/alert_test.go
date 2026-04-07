package service

import (
	"fmt"
	"testing"

	"xunjianbao-backend/pkg/pagination"
)

func TestAlertService_Create(t *testing.T) {
	db := setupTestDB(t)
	wsHub := NewWebSocketHub()
	service := NewAlertService(db, wsHub)

	tests := []struct {
		name        string
		tenantID    string
		req         CreateAlertRequest
		wantErr     bool
		description string
	}{
		{
			name:     "create critical alert",
			tenantID: "tenant_1",
			req: CreateAlertRequest{
				Level:    "CRIT",
				Type:     "fire",
				Title:    "Fire detected in Building A",
				Message:  "Smoke detected by camera #123",
				Location: "Building A, Floor 3",
				LAT:      39.9042,
				LNG:      116.4074,
			},
			wantErr: false,
		},
		{
			name:     "create warning alert",
			tenantID: "tenant_1",
			req: CreateAlertRequest{
				Level:   "WARN",
				Type:    "intrusion",
				Title:   "Unauthorized access detected",
				Message: "Person detected in restricted area",
			},
			wantErr: false,
		},
		{
			name:     "create info alert with stream",
			tenantID: "tenant_2",
			req: CreateAlertRequest{
				Level:    "INFO",
				Type:     "vehicle",
				Title:    "Vehicle detected",
				StreamID: uintPtr(1),
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			alert, err := service.Create(tt.tenantID, tt.req)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got nil")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
					return
				}
				if alert == nil {
					t.Error("expected alert but got nil")
					return
				}
				if alert.Level != tt.req.Level {
					t.Errorf("expected level %s, got %s", tt.req.Level, alert.Level)
				}
				if alert.Type != tt.req.Type {
					t.Errorf("expected type %s, got %s", tt.req.Type, alert.Type)
				}
				if alert.Title != tt.req.Title {
					t.Errorf("expected title %s, got %s", tt.req.Title, alert.Title)
				}
				if alert.Status != "pending" {
					t.Errorf("expected status 'pending', got %s", alert.Status)
				}
				if alert.TenantID != tt.tenantID {
					t.Errorf("expected tenant_id %s, got %s", tt.tenantID, alert.TenantID)
				}
				if alert.ID == 0 {
					t.Error("expected non-zero ID")
				}
			}
		})
	}
}

func TestAlertService_List(t *testing.T) {
	db := setupTestDB(t)
	wsHub := NewWebSocketHub()
	service := NewAlertService(db, wsHub)

	tenantID := "tenant_1"

	// Create test alerts
	alerts := []CreateAlertRequest{
		{Level: "CRIT", Type: "fire", Title: "Fire alert 1"},
		{Level: "WARN", Type: "intrusion", Title: "Intrusion alert"},
		{Level: "INFO", Type: "vehicle", Title: "Vehicle detected"},
		{Level: "CRIT", Type: "fire", Title: "Fire alert 2"},
	}

	for _, a := range alerts {
		_, err := service.Create(tenantID, a)
		if err != nil {
			t.Fatalf("failed to create test alert: %v", err)
		}
	}

	tests := []struct {
		name          string
		tenantID      string
		level         string
		status        string
		keyword       string
		pageSize      int
		page          int
		expectedCount int
		expectedTotal int64
		description   string
	}{
		{
			name:          "list all alerts",
			tenantID:      tenantID,
			pageSize:      10,
			page:          1,
			expectedCount: 4,
			expectedTotal: 4,
		},
		{
			name:          "filter by level CRIT",
			tenantID:      tenantID,
			level:         "CRIT",
			pageSize:      10,
			page:          1,
			expectedCount: 2,
			expectedTotal: 2,
		},
		{
			name:          "filter by level WARN",
			tenantID:      tenantID,
			level:         "WARN",
			pageSize:      10,
			page:          1,
			expectedCount: 1,
			expectedTotal: 1,
		},
		{
			name:          "filter by status pending",
			tenantID:      tenantID,
			status:        "pending",
			pageSize:      10,
			page:          1,
			expectedCount: 4,
			expectedTotal: 4,
		},
		{
			name:          "search by keyword",
			tenantID:      tenantID,
			keyword:       "Fire",
			pageSize:      10,
			page:          1,
			expectedCount: 2,
			expectedTotal: 2,
		},
		{
			name:          "pagination - first page",
			tenantID:      tenantID,
			pageSize:      2,
			page:          1,
			expectedCount: 2,
			expectedTotal: 4,
		},
		{
			name:          "pagination - second page",
			tenantID:      tenantID,
			pageSize:      2,
			page:          2,
			expectedCount: 2,
			expectedTotal: 4,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			params := pagination.Params{
				Page:     tt.page,
				PageSize: tt.pageSize,
				Offset:   (tt.page - 1) * tt.pageSize,
			}

			result, total, err := service.List(tt.tenantID, tt.level, tt.status, tt.keyword, params)

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if len(result) != tt.expectedCount {
				t.Errorf("expected %d alerts, got %d", tt.expectedCount, len(result))
			}
			if total != tt.expectedTotal {
				t.Errorf("expected total %d, got %d", tt.expectedTotal, total)
			}
		})
	}
}

func TestAlertService_GetByID(t *testing.T) {
	db := setupTestDB(t)
	wsHub := NewWebSocketHub()
	service := NewAlertService(db, wsHub)

	tenantID := "tenant_1"
	alert, err := service.Create(tenantID, CreateAlertRequest{
		Level: "CRIT",
		Type:  "fire",
		Title: "Test Fire Alert",
	})
	if err != nil {
		t.Fatalf("failed to create test alert: %v", err)
	}

	tests := []struct {
		name     string
		tenantID string
		id       string
		wantErr  bool
	}{
		{
			name:     "existing alert",
			tenantID: tenantID,
			id:       "1",
			wantErr:  false,
		},
		{
			name:     "non-existent alert",
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
				if result.Title != alert.Title {
					t.Errorf("expected title %s, got %s", alert.Title, result.Title)
				}
			}
		})
	}
}

func TestAlertService_Update(t *testing.T) {
	db := setupTestDB(t)
	wsHub := NewWebSocketHub()
	service := NewAlertService(db, wsHub)

	tenantID := "tenant_1"
	_, err := service.Create(tenantID, CreateAlertRequest{
		Level: "WARN",
		Type:  "intrusion",
		Title: "Original Alert",
	})
	if err != nil {
		t.Fatalf("failed to create test alert: %v", err)
	}

	tests := []struct {
		name        string
		tenantID    string
		id          string
		req         UpdateAlertRequest
		wantErr     bool
		checkFields map[string]interface{}
		description string
	}{
		{
			name:     "update status to resolved",
			tenantID: tenantID,
			id:       "1",
			req: UpdateAlertRequest{
				Status: strPtr("resolved"),
			},
			wantErr: false,
			checkFields: map[string]interface{}{
				"status": "resolved",
			},
		},
		{
			name:     "update acknowledged",
			tenantID: tenantID,
			id:       "1",
			req: UpdateAlertRequest{
				Acknowledged: boolPtr(true),
			},
			wantErr: false,
			checkFields: map[string]interface{}{
				"acknowledged": true,
			},
		},
		{
			name:     "update multiple fields",
			tenantID: tenantID,
			id:       "1",
			req: UpdateAlertRequest{
				Level: strPtr("CRIT"),
				Title: strPtr("Updated Critical Alert"),
			},
			wantErr: false,
			checkFields: map[string]interface{}{
				"level": "CRIT",
				"title": "Updated Critical Alert",
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
					case "status":
						if result.Status != expected {
							t.Errorf("expected status %v, got %v", expected, result.Status)
						}
					case "acknowledged":
						if result.Acknowledged != expected {
							t.Errorf("expected acknowledged %v, got %v", expected, result.Acknowledged)
						}
					case "level":
						if result.Level != expected {
							t.Errorf("expected level %v, got %v", expected, result.Level)
						}
					case "title":
						if result.Title != expected {
							t.Errorf("expected title %v, got %v", expected, result.Title)
						}
					}
				}
			}
		})
	}
}

func TestAlertService_Delete(t *testing.T) {
	db := setupTestDB(t)
	wsHub := NewWebSocketHub()
	service := NewAlertService(db, wsHub)

	tenantID := "tenant_1"
	alert, err := service.Create(tenantID, CreateAlertRequest{
		Level: "INFO",
		Type:  "vehicle",
		Title: "To Delete",
	})
	if err != nil {
		t.Fatalf("failed to create test alert: %v", err)
	}

	tests := []struct {
		name     string
		tenantID string
		id       string
		wantErr  bool
	}{
		{
			name:     "delete existing alert",
			tenantID: tenantID,
			id:       fmt.Sprintf("%d", alert.ID),
			wantErr:  false,
		},
		{
			name:     "delete non-existent alert",
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
			}
		})
	}
}

func TestAlertService_Statistics(t *testing.T) {
	db := setupTestDB(t)
	wsHub := NewWebSocketHub()
	service := NewAlertService(db, wsHub)

	tenantID := "tenant_1"

	// Create alerts with different levels and statuses
	_, _ = service.Create(tenantID, CreateAlertRequest{Level: "CRIT", Type: "fire", Title: "Critical 1"})
	_, _ = service.Create(tenantID, CreateAlertRequest{Level: "WARN", Type: "intrusion", Title: "Warning 1"})
	_, _ = service.Create(tenantID, CreateAlertRequest{Level: "INFO", Type: "vehicle", Title: "Info 1"})
	_, _ = service.Create(tenantID, CreateAlertRequest{Level: "CRIT", Type: "fire", Title: "Critical 2"})

	// Update one to resolved
	_, _ = service.Update(tenantID, "2", UpdateAlertRequest{Status: strPtr("resolved")})

	stats, err := service.Statistics(tenantID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats["total"] != int64(4) {
		t.Errorf("expected total 4, got %v", stats["total"])
	}
	if stats["pending"] != int64(3) {
		t.Errorf("expected pending 3, got %v", stats["pending"])
	}
	if stats["resolved"] != int64(1) {
		t.Errorf("expected resolved 1, got %v", stats["resolved"])
	}
	if stats["critical"] != int64(2) {
		t.Errorf("expected critical 2, got %v", stats["critical"])
	}
}

// Helper function
func uintPtr(n uint) *uint {
	return &n
}
