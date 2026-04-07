package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/middleware"
	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/response"
)

// RoleHandler 角色管理 Handler
type RoleHandler struct {
	roleService *service.RoleService
	rbac        *middleware.RBACMiddleware
}

// NewRoleHandler 创建角色 Handler
func NewRoleHandler(roleService *service.RoleService, rbac *middleware.RBACMiddleware) *RoleHandler {
	return &RoleHandler{
		roleService: roleService,
		rbac:        rbac,
	}
}

// RegisterRoutes 注册角色管理路由到 protected 路由组
func (h *RoleHandler) RegisterRoutes(protected *gin.RouterGroup) {
	roles := protected.Group("/roles")
	{
		roles.GET("", h.List)
		roles.POST("", h.rbac.RequirePermission("role:create"), h.Create)
		roles.GET("/:id", h.Get)
		roles.PUT("/:id", h.rbac.RequirePermission("role:update"), h.Update)
		roles.DELETE("/:id", h.rbac.RequirePermission("role:delete"), h.Delete)
	}
	protected.GET("/permissions", h.ListPermissions)
	protected.PUT("/users/:id/role", h.rbac.RequirePermission("user:update"), h.AssignRole)
}

// List 列出当前租户的所有角色
func (h *RoleHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	roles, err := h.roleService.ListRoles(tenantID)
	if err != nil {
		response.InternalError(c, "failed to list roles")
		return
	}

	response.Success(c, roles)
}

// Create 创建角色
func (h *RoleHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req service.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	role, err := h.roleService.CreateRole(tenantID, req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Created(c, role)
}

// Get 获取角色详情
func (h *RoleHandler) Get(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid role id")
		return
	}

	role, err := h.roleService.GetRole(tenantID, uint(id))
	if err != nil {
		response.NotFound(c, "role not found")
		return
	}

	response.Success(c, role)
}

// Update 更新角色
func (h *RoleHandler) Update(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid role id")
		return
	}

	var req service.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	role, err := h.roleService.UpdateRole(tenantID, uint(id), req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, role)
}

// Delete 删除角色
func (h *RoleHandler) Delete(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid role id")
		return
	}

	if err := h.roleService.DeleteRole(tenantID, uint(id)); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "role deleted"})
}

// ListPermissions 列出所有可用权限
func (h *RoleHandler) ListPermissions(c *gin.Context) {
	perms := h.roleService.GetAllPermissions()
	response.Success(c, perms)
}

// AssignRole 分配角色给用户
func (h *RoleHandler) AssignRole(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if err := h.roleService.AssignRole(tenantID, uint(userID), req.Role); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "role assigned"})
}
