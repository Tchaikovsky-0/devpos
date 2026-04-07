// =============================================================================
// Role API - 角色权限管理接口
// =============================================================================

import { apiClient } from '../client';
import type { Role, Permission, CreateRolePayload, UpdateRolePayload } from '@/types/rbac';

interface ApiRes<T> {
  code: number;
  message: string;
  data: T;
}

export const roleAPI = {
  /** 列出当前租户的所有角色 */
  list: (): Promise<ApiRes<Role[]>> => apiClient.get('/roles'),

  /** 获取角色详情 */
  getById: (id: number): Promise<ApiRes<Role>> => apiClient.get(`/roles/${id}`),

  /** 创建角色 */
  create: (data: CreateRolePayload): Promise<ApiRes<Role>> =>
    apiClient.post('/roles', data),

  /** 更新角色 */
  update: (id: number, data: UpdateRolePayload): Promise<ApiRes<Role>> =>
    apiClient.put(`/roles/${id}`, data),

  /** 删除角色 */
  delete: (id: number): Promise<ApiRes<void>> => apiClient.delete(`/roles/${id}`),

  /** 列出所有可用权限定义 */
  listPermissions: (): Promise<ApiRes<Permission[]>> => apiClient.get('/permissions'),

  /** 分配角色给用户 */
  assignRole: (userId: number, roleCode: string): Promise<ApiRes<void>> =>
    apiClient.put(`/users/${userId}/role`, { role: roleCode }),
};
