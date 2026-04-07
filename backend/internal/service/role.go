package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
)

// RoleService 角色权限服务
type RoleService struct {
	db    *gorm.DB
	cache sync.Map // key: "tenantID:roleCode" -> value: *cachedPermissions
}

type cachedPermissions struct {
	permissions []string
	expireAt    time.Time
}

const cacheTTL = 5 * time.Minute

// NewRoleService 创建角色服务实例
func NewRoleService(db *gorm.DB) *RoleService {
	return &RoleService{db: db}
}

// --- CRUD ---

// CreateRoleRequest 创建角色请求
type CreateRoleRequest struct {
	Name        string   `json:"name" binding:"required"`
	Code        string   `json:"code" binding:"required"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// UpdateRoleRequest 更新角色请求
type UpdateRoleRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// CreateRole 创建角色
func (s *RoleService) CreateRole(tenantID string, req CreateRoleRequest) (*model.Role, error) {
	// 验证权限码
	for _, p := range req.Permissions {
		if !model.IsValidPermission(p) {
			return nil, fmt.Errorf("invalid permission: %s", p)
		}
	}

	permJSON, err := json.Marshal(req.Permissions)
	if err != nil {
		return nil, err
	}

	role := &model.Role{
		TenantID:    tenantID,
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Permissions: string(permJSON),
		IsSystem:    false,
	}

	if err := s.db.Create(role).Error; err != nil {
		return nil, err
	}
	return role, nil
}

// UpdateRole 更新角色
func (s *RoleService) UpdateRole(tenantID string, id uint, req UpdateRoleRequest) (*model.Role, error) {
	var role model.Role
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	if role.IsSystem {
		return nil, fmt.Errorf("system role cannot be modified")
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Permissions != nil {
		for _, p := range req.Permissions {
			if !model.IsValidPermission(p) {
				return nil, fmt.Errorf("invalid permission: %s", p)
			}
		}
		permJSON, err := json.Marshal(req.Permissions)
		if err != nil {
			return nil, err
		}
		updates["permissions"] = string(permJSON)
	}

	if len(updates) > 0 {
		if err := s.db.Model(&role).Updates(updates).Error; err != nil {
			return nil, err
		}
		s.InvalidateCache(tenantID, role.Code)
	}

	// Reload
	if err := s.db.First(&role, id).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

// DeleteRole 删除角色（系统角色不可删）
func (s *RoleService) DeleteRole(tenantID string, id uint) error {
	var role model.Role
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}

	if role.IsSystem {
		return fmt.Errorf("system role cannot be deleted")
	}

	s.InvalidateCache(tenantID, role.Code)
	return s.db.Delete(&role).Error
}

// GetRole 获取角色详情
func (s *RoleService) GetRole(tenantID string, id uint) (*model.Role, error) {
	var role model.Role
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &role, nil
}

// ListRoles 列出租户下所有角色
func (s *RoleService) ListRoles(tenantID string) ([]model.Role, error) {
	var roles []model.Role
	if err := s.db.Where("tenant_id = ?", tenantID).Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

// --- 权限查询 ---

// GetPermissionsForRole 获取角色对应的权限列表（带缓存）
func (s *RoleService) GetPermissionsForRole(tenantID, roleCode string) ([]string, error) {
	cacheKey := tenantID + ":" + roleCode

	// 查缓存
	if cached, ok := s.cache.Load(cacheKey); ok {
		cp := cached.(*cachedPermissions)
		if time.Now().Before(cp.expireAt) {
			return cp.permissions, nil
		}
		// 过期，删除
		s.cache.Delete(cacheKey)
	}

	// 查 DB
	var role model.Role
	err := s.db.Where("tenant_id = ? AND code = ?", tenantID, roleCode).First(&role).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 尝试从静态默认映射获取（兼容未 seed 的情况）
			if perms, ok := model.DefaultRolePermissions[roleCode]; ok {
				s.cache.Store(cacheKey, &cachedPermissions{
					permissions: perms,
					expireAt:    time.Now().Add(cacheTTL),
				})
				return perms, nil
			}
			return nil, ErrNotFound
		}
		return nil, err
	}

	var perms []string
	if role.Permissions != "" {
		if err := json.Unmarshal([]byte(role.Permissions), &perms); err != nil {
			return nil, fmt.Errorf("failed to parse permissions: %w", err)
		}
	}

	// 存入缓存
	s.cache.Store(cacheKey, &cachedPermissions{
		permissions: perms,
		expireAt:    time.Now().Add(cacheTTL),
	})

	return perms, nil
}

// HasPermission 检查角色是否拥有指定权限
func (s *RoleService) HasPermission(tenantID, roleCode, permission string) (bool, error) {
	perms, err := s.GetPermissionsForRole(tenantID, roleCode)
	if err != nil {
		return false, err
	}
	for _, p := range perms {
		if p == permission {
			return true, nil
		}
	}
	return false, nil
}

// HasAnyPermission 检查角色是否拥有任一指定权限
func (s *RoleService) HasAnyPermission(tenantID, roleCode string, permissions []string) (bool, error) {
	perms, err := s.GetPermissionsForRole(tenantID, roleCode)
	if err != nil {
		return false, err
	}
	permSet := make(map[string]struct{}, len(perms))
	for _, p := range perms {
		permSet[p] = struct{}{}
	}
	for _, p := range permissions {
		if _, ok := permSet[p]; ok {
			return true, nil
		}
	}
	return false, nil
}

// GetAllPermissions 返回所有静态权限定义
func (s *RoleService) GetAllPermissions() []model.Permission {
	return model.AllPermissions
}

// InvalidateCache 清除指定角色的缓存
func (s *RoleService) InvalidateCache(tenantID, roleCode string) {
	s.cache.Delete(tenantID + ":" + roleCode)
}

// AssignRole 给用户分配角色
func (s *RoleService) AssignRole(tenantID string, userID uint, roleCode string) error {
	// 验证角色存在
	var role model.Role
	err := s.db.Where("tenant_id = ? AND code = ?", tenantID, roleCode).First(&role).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 也允许使用默认角色码
			if _, ok := model.DefaultRolePermissions[roleCode]; !ok {
				return fmt.Errorf("role not found: %s", roleCode)
			}
		} else {
			return err
		}
	}

	result := s.db.Model(&model.User{}).Where("id = ? AND tenant_id = ?", userID, tenantID).Update("role", roleCode)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// SeedDefaultRoles 初始化预定义角色
func (s *RoleService) SeedDefaultRoles(tenantID string) error {
	defaultRoles := []struct {
		Name        string
		Code        string
		Description string
	}{
		{Name: "超级管理员", Code: "super_admin", Description: "拥有系统全部权限"},
		{Name: "管理员", Code: "admin", Description: "大部分管理权限（不含系统配置）"},
		{Name: "操作员", Code: "operator", Description: "日常操作权限（查看/处理告警、查看视频流、上传媒体）"},
		{Name: "观察者", Code: "viewer", Description: "只读权限"},
	}

	for _, dr := range defaultRoles {
		var count int64
		s.db.Model(&model.Role{}).Where("tenant_id = ? AND code = ?", tenantID, dr.Code).Count(&count)
		if count > 0 {
			continue
		}

		perms := model.DefaultRolePermissions[dr.Code]
		permJSON, err := json.Marshal(perms)
		if err != nil {
			return err
		}

		role := model.Role{
			TenantID:    tenantID,
			Name:        dr.Name,
			Code:        dr.Code,
			Description: dr.Description,
			Permissions: string(permJSON),
			IsSystem:    true,
		}
		if err := s.db.Create(&role).Error; err != nil {
			log.Printf("⚠️ [RBAC] 创建默认角色 %s 失败: %v", dr.Code, err)
			return err
		}
		log.Printf("✅ [RBAC] 创建默认角色: %s (%s)", dr.Name, dr.Code)
	}
	return nil
}
