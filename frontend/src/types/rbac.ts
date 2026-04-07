// =============================================================================
// RBAC Types - 角色权限类型定义
// =============================================================================

export interface Role {
  id: number;
  tenant_id: string;
  name: string;
  code: string;
  description: string;
  permissions: string; // JSON string from backend; parsed version below
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

/** Role with parsed permissions array */
export interface RoleParsed extends Omit<Role, 'permissions'> {
  permissions: string[];
}

export interface Permission {
  code: string;
  name: string;
  description: string;
  module: string;
}

/** Request payload for creating a role */
export interface CreateRolePayload {
  name: string;
  code: string;
  description?: string;
  permissions: string[];
}

/** Request payload for updating a role */
export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

/** Request payload for assigning a role to a user */
export interface AssignRolePayload {
  role: string;
}

// ---------------------------------------------------------------------------
// 静态权限映射（前端本地判断，不需要请求后端）
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'alert:read', 'alert:create', 'alert:update', 'alert:delete',
    'alert_rule:read', 'alert_rule:create', 'alert_rule:update', 'alert_rule:delete',
    'stream:read', 'stream:create', 'stream:update', 'stream:delete',
    'media:read', 'media:upload', 'media:update', 'media:delete',
    'ai:read', 'ai:analyze', 'ai:chat',
    'user:read', 'user:create', 'user:update', 'user:delete',
    'role:read', 'role:create', 'role:update', 'role:delete',
    'system:read', 'system:update',
  ],
  admin: [
    'alert:read', 'alert:create', 'alert:update', 'alert:delete',
    'alert_rule:read', 'alert_rule:create', 'alert_rule:update', 'alert_rule:delete',
    'stream:read', 'stream:create', 'stream:update', 'stream:delete',
    'media:read', 'media:upload', 'media:update', 'media:delete',
    'ai:read', 'ai:analyze', 'ai:chat',
    'user:read', 'user:create', 'user:update', 'user:delete',
    'role:read', 'role:create', 'role:update', 'role:delete',
  ],
  operator: [
    'alert:read', 'alert:create', 'alert:update',
    'alert_rule:read',
    'stream:read',
    'media:read', 'media:upload',
    'ai:read', 'ai:analyze', 'ai:chat',
    'user:read',
    'role:read',
  ],
  viewer: [
    'alert:read',
    'alert_rule:read',
    'stream:read',
    'media:read',
    'ai:read',
    'user:read',
    'role:read',
    'system:read',
  ],
};

/**
 * 检查指定角色是否拥有某个权限
 */
export function roleHasPermission(roleCode: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[roleCode];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * 检查指定角色是否拥有任一权限
 */
export function roleHasAnyPermission(roleCode: string, permissions: string[]): boolean {
  const perms = ROLE_PERMISSIONS[roleCode];
  if (!perms) return false;
  return permissions.some((p) => perms.includes(p));
}
