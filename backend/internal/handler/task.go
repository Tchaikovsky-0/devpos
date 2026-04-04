package handler

import (
	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/pagination"
	"xunjianbao-backend/pkg/response"
)

type TaskHandler struct {
	taskService *service.TaskService
}

func NewTaskHandler(s *service.TaskService) *TaskHandler {
	return &TaskHandler{taskService: s}
}

func (h *TaskHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	p := pagination.Parse(c)

	tasks, total, err := h.taskService.List(
		tenantID,
		c.Query("type"),
		c.Query("status"),
		c.Query("priority"),
		p,
	)
	if err != nil {
		response.InternalError(c, "failed to list tasks")
		return
	}

	pagination.PageOK(c, tasks, total, p)
}

func (h *TaskHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	task, err := h.taskService.GetByID(tenantID, id)
	if err != nil {
		response.NotFound(c, "task not found")
		return
	}

	response.Success(c, task)
}

func (h *TaskHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	task, err := h.taskService.Create(tenantID, req)
	if err != nil {
		response.InternalError(c, "failed to create task")
		return
	}

	response.Created(c, task)
}

func (h *TaskHandler) Update(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	task, err := h.taskService.Update(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "task not found")
			return
		}
		response.InternalError(c, "failed to update task")
		return
	}

	response.Success(c, task)
}

func (h *TaskHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	if err := h.taskService.Delete(tenantID, id); err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "task not found")
			return
		}
		response.InternalError(c, "failed to delete task")
		return
	}

	response.Success(c, gin.H{"message": "deleted"})
}

func (h *TaskHandler) Assign(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req service.AssignTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	task, err := h.taskService.Assign(tenantID, id, req)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "task not found")
			return
		}
		response.InternalError(c, "failed to assign task")
		return
	}

	response.Success(c, task)
}

func (h *TaskHandler) Complete(c *gin.Context) {
	id := c.Param("id")
	tenantID := c.GetString("tenant_id")

	task, err := h.taskService.Complete(tenantID, id)
	if err != nil {
		if err == service.ErrNotFound {
			response.NotFound(c, "task not found")
			return
		}
		response.InternalError(c, "failed to complete task")
		return
	}

	response.Success(c, task)
}
