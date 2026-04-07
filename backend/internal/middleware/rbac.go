package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"xunjianbao-backend/internal/service"
	"xunjianbao-backend/pkg/config"
)

// RBACMiddleware 持有 RoleService 引用，用于权限查询
type RBACMiddleware struct {
	roleService *service.RoleService
}

// NewRBACMiddleware 创建 RBAC 中间件实例
func NewRBACMiddleware(roleService *service.RoleService) *RBACMiddleware {
	return &RBACMiddleware{roleService: roleService}
}

// RequirePermission 检查用户是否拥有指定权限
func (m *RBACMiddleware) RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开发模式跳过权限检查
		if !config.IsAuthEnabled() {
			c.Next()
			return
		}

		tenantID, _ := c.Get("tenant_id")
		role, _ := c.Get("role")

		tenantStr, _ := tenantID.(string)
		roleStr, _ := role.(string)

		if tenantStr == "" || roleStr == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "missing tenant or role in context",
			})
			return
		}

		has, err := m.roleService.HasPermission(tenantStr, roleStr, permission)
		if err != nil {
			log.Printf("⚠️ [RBAC] 权限查询失败: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "permission check failed",
			})
			return
		}

		if !has {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "insufficient permissions",
				"detail":  "required permission: " + permission,
			})
			return
		}

		c.Next()
	}
}

// RequireAnyPermission 检查用户是否拥有任一指定权限
func (m *RBACMiddleware) RequireAnyPermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !config.IsAuthEnabled() {
			c.Next()
			return
		}

		tenantID, _ := c.Get("tenant_id")
		role, _ := c.Get("role")

		tenantStr, _ := tenantID.(string)
		roleStr, _ := role.(string)

		if tenantStr == "" || roleStr == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "missing tenant or role in context",
			})
			return
		}

		has, err := m.roleService.HasAnyPermission(tenantStr, roleStr, permissions)
		if err != nil {
			log.Printf("⚠️ [RBAC] 权限查询失败: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "permission check failed",
			})
			return
		}

		if !has {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "insufficient permissions",
			})
			return
		}

		c.Next()
	}
}
