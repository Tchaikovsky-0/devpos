package service

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

type TaskService struct {
	db *gorm.DB
}

func NewTaskService(db *gorm.DB) *TaskService {
	return &TaskService{db: db}
}

type CreateTaskRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Type        string   `json:"type" binding:"required"` // routine, emergency, custom
	AssigneeID  *uint    `json:"assignee_id"`
	StreamIDs   []uint   `json:"stream_ids"`
	DueDate     *string  `json:"due_date"` // ISO8601
	Priority    string   `json:"priority"`
}

type UpdateTaskRequest struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	Status      *string  `json:"status"`
	AssigneeID  *uint    `json:"assignee_id"`
	StreamIDs   []uint   `json:"stream_ids"`
	DueDate     *string  `json:"due_date"`
	Priority    *string  `json:"priority"`
}

type AssignTaskRequest struct {
	AssigneeID uint `json:"assignee_id" binding:"required"`
}

func (s *TaskService) List(tenantID string, taskType string, status string, priority string, p pagination.Params) ([]model.Task, int64, error) {
	var tasks []model.Task
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)
	if taskType != "" {
		query = query.Where("type = ?", taskType)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	query.Model(&model.Task{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&tasks).Error; err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

func (s *TaskService) GetByID(tenantID, id string) (*model.Task, error) {
	var task model.Task
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task).Error; err != nil {
		return nil, ErrNotFound
	}
	return &task, nil
}

func (s *TaskService) Create(tenantID string, req CreateTaskRequest) (*model.Task, error) {
	priority := req.Priority
	if priority == "" {
		priority = "P2"
	}

	var streamIDsJSON string
	if len(req.StreamIDs) > 0 {
		b, _ := json.Marshal(req.StreamIDs)
		streamIDsJSON = string(b)
	}

	var dueDate *time.Time
	if req.DueDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.DueDate); err == nil {
			dueDate = &t
		}
	}

	task := &model.Task{
		TenantID:    tenantID,
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		Status:      "pending",
		AssigneeID:  req.AssigneeID,
		StreamIDs:   streamIDsJSON,
		DueDate:     dueDate,
		Priority:    priority,
	}

	if err := s.db.Create(task).Error; err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) Update(tenantID, id string, req UpdateTaskRequest) (*model.Task, error) {
	var task model.Task
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.AssigneeID != nil {
		updates["assignee_id"] = *req.AssigneeID
	}
	if req.StreamIDs != nil {
		b, _ := json.Marshal(req.StreamIDs)
		updates["stream_ids"] = string(b)
	}
	if req.DueDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.DueDate); err == nil {
			updates["due_date"] = t
		}
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}

	if len(updates) > 0 {
		s.db.Model(&task).Updates(updates)
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task)
	return &task, nil
}

func (s *TaskService) Delete(tenantID, id string) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.Task{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

func (s *TaskService) Assign(tenantID, id string, req AssignTaskRequest) (*model.Task, error) {
	var task model.Task
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task).Error; err != nil {
		return nil, ErrNotFound
	}

	s.db.Model(&task).Updates(map[string]interface{}{
		"assignee_id": req.AssigneeID,
		"status":      "in_progress",
	})

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task)
	return &task, nil
}

func (s *TaskService) Complete(tenantID, id string) (*model.Task, error) {
	var task model.Task
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task).Error; err != nil {
		return nil, ErrNotFound
	}

	s.db.Model(&task).Updates(map[string]interface{}{
		"status": "completed",
	})

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&task)
	return &task, nil
}
