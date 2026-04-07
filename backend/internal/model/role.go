package model

import (
	"time"

	"gorm.io/gorm"
)

// Role 角色模型
type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TenantID    string         `json:"tenant_id" gorm:"size:64;index;not null"`
	Name        string         `json:"name" gorm:"size:64;not null"`
	Code        string         `json:"code" gorm:"size:64;not null"`
	Description string         `json:"description" gorm:"size:255"`
	Permissions string         `json:"permissions" gorm:"type:text"` // JSON array: ["alert:read","alert:create",...]
	IsSystem    bool           `json:"is_system" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Role) TableName() string {
	return "roles"
}

// Permission 为静态定义，不存数据库
type Permission struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Module      string `json:"module"` // alert, alert_rule, stream, media, ai, user, role, system
}

// AllPermissions 系统所有预定义权限
var AllPermissions = []Permission{
	// 告警
	{Code: "alert:read", Name: "查看告警", Description: "查看告警列表和详情", Module: "alert"},
	{Code: "alert:create", Name: "创建告警", Description: "创建新告警", Module: "alert"},
	{Code: "alert:update", Name: "更新告警", Description: "更新告警状态和信息", Module: "alert"},
	{Code: "alert:delete", Name: "删除告警", Description: "删除告警记录", Module: "alert"},
	// 告警规则
	{Code: "alert_rule:read", Name: "查看告警规则", Description: "查看告警规则列表", Module: "alert_rule"},
	{Code: "alert_rule:create", Name: "创建告警规则", Description: "创建新告警规则", Module: "alert_rule"},
	{Code: "alert_rule:update", Name: "更新告警规则", Description: "更新告警规则", Module: "alert_rule"},
	{Code: "alert_rule:delete", Name: "删除告警规则", Description: "删除告警规则", Module: "alert_rule"},
	// 视频流
	{Code: "stream:read", Name: "查看视频流", Description: "查看视频流列表和播放", Module: "stream"},
	{Code: "stream:create", Name: "创建视频流", Description: "添加新视频流", Module: "stream"},
	{Code: "stream:update", Name: "更新视频流", Description: "更新视频流配置", Module: "stream"},
	{Code: "stream:delete", Name: "删除视频流", Description: "删除视频流", Module: "stream"},
	// 媒体库
	{Code: "media:read", Name: "查看媒体", Description: "查看媒体库文件", Module: "media"},
	{Code: "media:upload", Name: "上传媒体", Description: "上传媒体文件", Module: "media"},
	{Code: "media:update", Name: "更新媒体", Description: "更新媒体信息", Module: "media"},
	{Code: "media:delete", Name: "删除媒体", Description: "删除媒体文件", Module: "media"},
	// AI
	{Code: "ai:read", Name: "查看AI结果", Description: "查看AI分析结果", Module: "ai"},
	{Code: "ai:analyze", Name: "AI分析", Description: "发起AI分析任务", Module: "ai"},
	{Code: "ai:chat", Name: "AI对话", Description: "使用AI对话功能", Module: "ai"},
	// 用户管理
	{Code: "user:read", Name: "查看用户", Description: "查看用户列表", Module: "user"},
	{Code: "user:create", Name: "创建用户", Description: "创建新用户", Module: "user"},
	{Code: "user:update", Name: "更新用户", Description: "更新用户信息", Module: "user"},
	{Code: "user:delete", Name: "删除用户", Description: "删除用户", Module: "user"},
	// 角色管理
	{Code: "role:read", Name: "查看角色", Description: "查看角色列表", Module: "role"},
	{Code: "role:create", Name: "创建角色", Description: "创建新角色", Module: "role"},
	{Code: "role:update", Name: "更新角色", Description: "更新角色权限", Module: "role"},
	{Code: "role:delete", Name: "删除角色", Description: "删除角色", Module: "role"},
	// 系统设置
	{Code: "system:read", Name: "查看系统设置", Description: "查看系统配置", Module: "system"},
	{Code: "system:update", Name: "更新系统设置", Description: "修改系统配置", Module: "system"},
}

// DefaultRolePermissions 预定义角色的权限映射
var DefaultRolePermissions = map[string][]string{
	"super_admin": allPermissionCodes(),
	"admin": {
		"alert:read", "alert:create", "alert:update", "alert:delete",
		"alert_rule:read", "alert_rule:create", "alert_rule:update", "alert_rule:delete",
		"stream:read", "stream:create", "stream:update", "stream:delete",
		"media:read", "media:upload", "media:update", "media:delete",
		"ai:read", "ai:analyze", "ai:chat",
		"user:read", "user:create", "user:update", "user:delete",
		"role:read", "role:create", "role:update", "role:delete",
	},
	"operator": {
		"alert:read", "alert:create", "alert:update",
		"alert_rule:read",
		"stream:read",
		"media:read", "media:upload",
		"ai:read", "ai:analyze", "ai:chat",
		"user:read",
		"role:read",
	},
	"viewer": {
		"alert:read",
		"alert_rule:read",
		"stream:read",
		"media:read",
		"ai:read",
		"user:read",
		"role:read",
		"system:read",
	},
}

func allPermissionCodes() []string {
	codes := make([]string, len(AllPermissions))
	for i, p := range AllPermissions {
		codes[i] = p.Code
	}
	return codes
}

// IsValidPermission 检查权限码是否有效
func IsValidPermission(code string) bool {
	for _, p := range AllPermissions {
		if p.Code == code {
			return true
		}
	}
	return false
}
