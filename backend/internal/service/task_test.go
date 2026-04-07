package service

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

func setupTaskTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	err = db.AutoMigrate(&model.User{}, &model.Task{})
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	return db
}

func TestTaskService_List(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	// Create test tasks
	tasks := []model.Task{
		{TenantID: tenantID, Title: "Task 1", Type: "routine", Status: "pending", Priority: "P1"},
		{TenantID: tenantID, Title: "Task 2", Type: "emergency", Status: "in_progress", Priority: "P2"},
		{TenantID: tenantID, Title: "Task 3", Type: "routine", Status: "completed", Priority: "P3"},
		{TenantID: "other_tenant", Title: "Other Task", Type: "routine", Status: "pending", Priority: "P1"},
	}
	for _, task := range tasks {
		db.Create(&task)
	}

	tests := []struct {
		name          string
		taskType      string
		status        string
		priority      string
		expectedCount int
	}{
		{
			name:          "list all tasks for tenant",
			taskType:      "",
			status:        "",
			priority:      "",
			expectedCount: 3,
		},
		{
			name:          "filter by type",
			taskType:      "routine",
			status:        "",
			priority:      "",
			expectedCount: 2,
		},
		{
			name:          "filter by status",
			status:        "pending",
			taskType:      "",
			priority:      "",
			expectedCount: 1,
		},
		{
			name:          "filter by priority",
			priority:      "P1",
			taskType:      "",
			status:        "",
			expectedCount: 1,
		},
		{
			name:          "filter by multiple criteria",
			taskType:      "routine",
			status:        "pending",
			priority:      "",
			expectedCount: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, total, err := service.List(tenantID, tt.taskType, tt.status, tt.priority, pagination.Params{PageSize: 10, Page: 1})
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if len(result) != tt.expectedCount {
				t.Errorf("expected %d tasks, got %d", tt.expectedCount, len(result))
			}
			if total != int64(tt.expectedCount) {
				t.Errorf("expected total %d, got %d", tt.expectedCount, total)
			}
		})
	}
}

func TestTaskService_Create(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	tests := []struct {
		name        string
		req         CreateTaskRequest
		wantErr     bool
		checkFields func(t *testing.T, task *model.Task)
	}{
		{
			name: "create routine task with all fields",
			req: CreateTaskRequest{
				Title:       "Test Task",
				Description: "Test Description",
				Type:        "routine",
				Priority:    "P1",
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				if task.Title != "Test Task" {
					t.Errorf("expected title 'Test Task', got '%s'", task.Title)
				}
				if task.Description != "Test Description" {
					t.Errorf("expected description 'Test Description', got '%s'", task.Description)
				}
				if task.Type != "routine" {
					t.Errorf("expected type 'routine', got '%s'", task.Type)
				}
				if task.Status != "pending" {
					t.Errorf("expected status 'pending', got '%s'", task.Status)
				}
				if task.Priority != "P1" {
					t.Errorf("expected priority 'P1', got '%s'", task.Priority)
				}
			},
		},
		{
			name: "create task without priority (default P2)",
			req: CreateTaskRequest{
				Title: "Task Without Priority",
				Type:  "emergency",
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				if task.Priority != "P2" {
					t.Errorf("expected default priority 'P2', got '%s'", task.Priority)
				}
			},
		},
		{
			name: "create task with stream IDs",
			req: CreateTaskRequest{
				Title:     "Task with Streams",
				Type:      "custom",
				StreamIDs: []uint{1, 2, 3},
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				var streamIDs []uint
				json.Unmarshal([]byte(task.StreamIDs), &streamIDs)
				if len(streamIDs) != 3 {
					t.Errorf("expected 3 stream IDs, got %d", len(streamIDs))
				}
			},
		},
		{
			name: "create task with due date",
			req: CreateTaskRequest{
				Title:   "Task with Due Date",
				Type:    "routine",
				DueDate: func() *string { s := "2025-12-31T23:59:59Z"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				if task.DueDate == nil {
					t.Error("expected due date to be set")
					return
				}
				expectedDate, _ := time.Parse(time.RFC3339, "2025-12-31T23:59:59Z")
				if !task.DueDate.Equal(expectedDate) {
					t.Errorf("expected due date %v, got %v", expectedDate, task.DueDate)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task, err := service.Create(tenantID, tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && tt.checkFields != nil {
				tt.checkFields(t, task)
			}
		})
	}
}

func TestTaskService_GetByID(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	// Create test task
	task := &model.Task{
		TenantID: tenantID,
		Title:    "Test Task",
		Type:     "routine",
		Status:   "pending",
	}
	db.Create(task)

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "get existing task",
			id:      fmt.Sprintf("%d", task.ID),
			wantErr: false,
		},
		{
			name:    "get non-existent task",
			id:      "99999",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.GetByID(tenantID, tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && result.Title != "Test Task" {
				t.Errorf("expected title 'Test Task', got '%s'", result.Title)
			}
		})
	}
}

func TestTaskService_Update(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	// Create test task
	task := &model.Task{
		TenantID: tenantID,
		Title:    "Original Title",
		Type:     "routine",
		Status:   "pending",
		Priority: "P2",
	}
	db.Create(task)

	tests := []struct {
		name        string
		id          string
		req         UpdateTaskRequest
		wantErr     bool
		checkFields func(t *testing.T, task *model.Task)
	}{
		{
			name: "update title",
			id:   fmt.Sprintf("%d", task.ID),
			req: UpdateTaskRequest{
				Title: func() *string { s := "Updated Title"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				if task.Title != "Updated Title" {
					t.Errorf("expected title 'Updated Title', got '%s'", task.Title)
				}
			},
		},
		{
			name: "update status",
			id:   fmt.Sprintf("%d", task.ID),
			req: UpdateTaskRequest{
				Status: func() *string { s := "in_progress"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				if task.Status != "in_progress" {
					t.Errorf("expected status 'in_progress', got '%s'", task.Status)
				}
			},
		},
		{
			name: "update multiple fields",
			id:   fmt.Sprintf("%d", task.ID),
			req: UpdateTaskRequest{
				Title:    func() *string { s := "New Title"; return &s }(),
				Status:   func() *string { s := "completed"; return &s }(),
				Priority: func() *string { s := "P1"; return &s }(),
			},
			wantErr: false,
			checkFields: func(t *testing.T, task *model.Task) {
				if task.Title != "New Title" || task.Status != "completed" || task.Priority != "P1" {
					t.Errorf("unexpected field values: title=%s, status=%s, priority=%s",
						task.Title, task.Status, task.Priority)
				}
			},
		},
		{
			name:    "update non-existent task",
			id:      "99999",
			req:     UpdateTaskRequest{Title: func() *string { s := "Test"; return &s }()},
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

func TestTaskService_Delete(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	// Create test task
	task := &model.Task{
		TenantID: tenantID,
		Title:    "Task to Delete",
		Type:     "routine",
		Status:   "pending",
	}
	db.Create(task)

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "delete existing task",
			id:      fmt.Sprintf("%d", task.ID),
			wantErr: false,
		},
		{
			name:    "delete non-existent task",
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

func TestTaskService_Assign(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	// Create test user
	user := &model.User{
		Username: "assignee",
		Email:    "assignee@test.com",
		TenantID: tenantID,
	}
	db.Create(user)

	// Create test task
	task := &model.Task{
		TenantID: tenantID,
		Title:    "Task to Assign",
		Type:     "routine",
		Status:   "pending",
	}
	db.Create(task)

	tests := []struct {
		name           string
		taskID         string
		assigneeID     uint
		wantErr        bool
		expectedStatus string
	}{
		{
			name:           "assign task to user",
			taskID:         fmt.Sprintf("%d", task.ID),
			assigneeID:     user.ID,
			wantErr:        false,
			expectedStatus: "in_progress",
		},
		{
			name:       "assign non-existent task",
			taskID:     "99999",
			assigneeID: user.ID,
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Assign(tenantID, tt.taskID, AssignTaskRequest{AssigneeID: tt.assigneeID})
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr {
				if result.Status != tt.expectedStatus {
					t.Errorf("expected status '%s', got '%s'", tt.expectedStatus, result.Status)
				}
			}
		})
	}
}

func TestTaskService_Complete(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)
	tenantID := "tenant_test"

	// Create test task
	task := &model.Task{
		TenantID: tenantID,
		Title:    "Task to Complete",
		Type:     "routine",
		Status:   "in_progress",
	}
	db.Create(task)

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "complete existing task",
			id:      fmt.Sprintf("%d", task.ID),
			wantErr: false,
		},
		{
			name:    "complete non-existent task",
			id:      "99999",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Complete(tenantID, tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
				return
			}
			if !tt.wantErr && result.Status != "completed" {
				t.Errorf("expected status 'completed', got '%s'", result.Status)
			}
		})
	}
}

func TestTaskService_TenantIsolation(t *testing.T) {
	db := setupTaskTestDB(t)
	service := NewTaskService(db)

	// Create tasks for different tenants
	task1 := &model.Task{TenantID: "tenant_1", Title: "Tenant 1 Task", Type: "routine", Status: "pending"}
	task2 := &model.Task{TenantID: "tenant_2", Title: "Tenant 2 Task", Type: "routine", Status: "pending"}
	db.Create(task1)
	db.Create(task2)

	// List tasks for tenant_1
	result, _, err := service.List("tenant_1", "", "", "", pagination.Params{PageSize: 10, Page: 1})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
		return
	}

	if len(result) != 1 {
		t.Errorf("expected 1 task for tenant_1, got %d", len(result))
	}

	if result[0].TenantID != "tenant_1" {
		t.Errorf("expected tenant_1 task, got tenant_%s", result[0].TenantID)
	}
}
