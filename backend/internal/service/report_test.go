package service

import (
	"fmt"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

func setupReportTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	err = db.AutoMigrate(&model.Report{})
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	return db
}

func TestReportService_List(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)
	tenantID := "tenant_test"

	// Create test reports
	reports := []model.Report{
		{TenantID: tenantID, Type: "daily", Title: "Daily Report 1", Status: "completed"},
		{TenantID: tenantID, Type: "weekly", Title: "Weekly Report 1", Status: "pending"},
		{TenantID: tenantID, Type: "daily", Title: "Daily Report 2", Status: "completed"},
		{TenantID: "other_tenant", Type: "daily", Title: "Other Report", Status: "pending"},
	}
	for _, report := range reports {
		db.Create(&report)
	}

	tests := []struct {
		name          string
		reportType    string
		expectedCount int
	}{
		{
			name:          "list all reports for tenant",
			reportType:    "",
			expectedCount: 3,
		},
		{
			name:          "filter by type - daily",
			reportType:    "daily",
			expectedCount: 2,
		},
		{
			name:          "filter by type - weekly",
			reportType:    "weekly",
			expectedCount: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, total, err := service.List(tenantID, tt.reportType, pagination.Params{PageSize: 10, Page: 1})
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if len(result) != tt.expectedCount {
				t.Errorf("expected %d reports, got %d", tt.expectedCount, len(result))
			}
			if total != int64(tt.expectedCount) {
				t.Errorf("expected total %d, got %d", tt.expectedCount, total)
			}
		})
	}
}

func TestReportService_Create(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)
	tenantID := "tenant_test"

	tests := []struct {
		name        string
		req         CreateReportRequest
		wantErr     bool
		checkFields func(t *testing.T, report *model.Report)
	}{
		{
			name: "create report with all fields",
			req: CreateReportRequest{
				Type:    "daily",
				Title:   "Daily Report",
				Content: "Report content here",
			},
			wantErr: false,
			checkFields: func(t *testing.T, report *model.Report) {
				if report.Type != "daily" {
					t.Errorf("expected type 'daily', got '%s'", report.Type)
				}
				if report.Title != "Daily Report" {
					t.Errorf("expected title 'Daily Report', got '%s'", report.Title)
				}
				if report.Content != "Report content here" {
					t.Errorf("expected content 'Report content here', got '%s'", report.Content)
				}
				if report.Status != "pending" {
					t.Errorf("expected status 'pending', got '%s'", report.Status)
				}
			},
		},
		{
			name: "create weekly report",
			req: CreateReportRequest{
				Type:  "weekly",
				Title: "Weekly Summary",
			},
			wantErr: false,
			checkFields: func(t *testing.T, report *model.Report) {
				if report.Type != "weekly" {
					t.Errorf("expected type 'weekly', got '%s'", report.Type)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			report, err := service.Create(tenantID, tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && tt.checkFields != nil {
				tt.checkFields(t, report)
			}
		})
	}
}

func TestReportService_GetByID(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)
	tenantID := "tenant_test"

	// Create test report
	report := &model.Report{
		TenantID: tenantID,
		Type:     "daily",
		Title:    "Test Report",
		Status:   "pending",
	}
	db.Create(report)

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "get existing report",
			id:      fmt.Sprintf("%d", report.ID),
			wantErr: false,
		},
		{
			name:    "get non-existent report",
			id:      "99999",
			wantErr: true,
		},
		{
			name:    "get report from different tenant",
			id:      fmt.Sprintf("%d", report.ID),
			wantErr: true,
		},
	}

	// Test tenant isolation
	_, err := service.GetByID("wrong_tenant", fmt.Sprintf("%d", report.ID))
	if err == nil {
		t.Error("expected error when accessing report from different tenant")
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.name == "get report from different tenant" {
				return // Skip as we already tested it above
			}
			result, err := service.GetByID(tenantID, tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && result.Title != "Test Report" {
				t.Errorf("expected title 'Test Report', got '%s'", result.Title)
			}
		})
	}
}

func TestReportService_Update(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)
	tenantID := "tenant_test"

	// Create test report
	report := &model.Report{
		TenantID: tenantID,
		Type:     "daily",
		Title:    "Original Title",
		Status:   "pending",
	}
	db.Create(report)

	tests := []struct {
		name        string
		id          string
		req         UpdateReportRequest
		wantErr     bool
		checkFields func(t *testing.T, report *model.Report)
	}{
		{
			name: "update title",
			id:   fmt.Sprintf("%d", report.ID),
			req: UpdateReportRequest{
				Title: func() *string { s := "Updated Title"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, report *model.Report) {
				if report.Title != "Updated Title" {
					t.Errorf("expected title 'Updated Title', got '%s'", report.Title)
				}
			},
		},
		{
			name: "update status",
			id:   fmt.Sprintf("%d", report.ID),
			req: UpdateReportRequest{
				Status: func() *string { s := "completed"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, report *model.Report) {
				if report.Status != "completed" {
					t.Errorf("expected status 'completed', got '%s'", report.Status)
				}
			},
		},
		{
			name: "update multiple fields",
			id:   fmt.Sprintf("%d", report.ID),
			req: UpdateReportRequest{
				Title:   func() *string { s := "New Title"; return &s }(),
				Status:  func() *string { s := "completed"; return &s }(),
				Content: func() *string { s := "New content"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, report *model.Report) {
				if report.Title != "New Title" || report.Status != "completed" || report.Content != "New content" {
					t.Errorf("unexpected field values")
				}
			},
		},
		{
			name:    "update non-existent report",
			id:      "99999",
			req:     UpdateReportRequest{Title: func() *string { s := "Test"; return &s }()},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Update(tenantID, tt.id, tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && tt.checkFields != nil {
				tt.checkFields(t, result)
			}
		})
	}
}

func TestReportService_Delete(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)
	tenantID := "tenant_test"

	// Create test report
	report := &model.Report{
		TenantID: tenantID,
		Type:     "daily",
		Title:    "Report to Delete",
		Status:   "pending",
	}
	db.Create(report)

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "delete existing report",
			id:      fmt.Sprintf("%d", report.ID),
			wantErr: false,
		},
		{
			name:    "delete non-existent report",
			id:      "99999",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.Delete(tenantID, tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
			}
		})
	}
}

func TestReportService_Export(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)
	tenantID := "tenant_test"

	// Create test report
	report := &model.Report{
		TenantID: tenantID,
		Type:     "daily",
		Title:    "Report to Export",
		Status:   "completed",
	}
	db.Create(report)

	tests := []struct {
		name        string
		id          string
		wantErr     bool
		checkResult func(t *testing.T, result map[string]interface{})
	}{
		{
			name:    "export existing report",
			id:      fmt.Sprintf("%d", report.ID),
			wantErr: false,
			checkResult: func(t *testing.T, result map[string]interface{}) {
				if _, ok := result["download_url"]; !ok {
					t.Error("expected download_url in result")
				}
				if _, ok := result["filename"]; !ok {
					t.Error("expected filename in result")
				}
				if _, ok := result["format"]; !ok {
					t.Error("expected format in result")
				}
				if result["format"] != "pdf" {
					t.Errorf("expected format 'pdf', got '%v'", result["format"])
				}
			},
		},
		{
			name:    "export non-existent report",
			id:      "99999",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Export(tenantID, tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && tt.checkResult != nil {
				tt.checkResult(t, result)
			}
		})
	}
}

func TestReportService_TenantIsolation(t *testing.T) {
	db := setupReportTestDB(t)
	service := NewReportService(db)

	// Create reports for different tenants
	report1 := &model.Report{TenantID: "tenant_1", Type: "daily", Title: "Report 1", Status: "pending"}
	report2 := &model.Report{TenantID: "tenant_2", Type: "daily", Title: "Report 2", Status: "pending"}
	db.Create(report1)
	db.Create(report2)

	// List reports for tenant_1
	result, _, err := service.List("tenant_1", "", pagination.Params{PageSize: 10, Page: 1})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
		return
	}

	if len(result) != 1 {
		t.Errorf("expected 1 report for tenant_1, got %d", len(result))
	}

	if result[0].TenantID != "tenant_1" {
		t.Errorf("expected tenant_1 report, got tenant_%s", result[0].TenantID)
	}
}
