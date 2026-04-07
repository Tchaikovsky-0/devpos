// =============================================================================
// usePermission - 权限检查 Hook
// =============================================================================

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { roleHasPermission, roleHasAnyPermission } from '@/types/rbac';

interface RootState {
  auth: {
    user: { role: string } | null;
  };
}

/**
 * 获取当前用户角色
 */
export function useRole(): string {
  const user = useSelector((state: RootState) => state.auth.user);
  return user?.role ?? '';
}

/**
 * 检查当前用户是否拥有指定权限
 */
export function usePermission(permission: string): boolean {
  const role = useRole();
  return useMemo(() => {
    if (!role) return false;
    return roleHasPermission(role, permission);
  }, [role, permission]);
}

/**
 * 检查当前用户是否拥有任一指定权限
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const role = useRole();
  return useMemo(() => {
    if (!role) return false;
    return roleHasAnyPermission(role, permissions);
  }, [role, permissions]);
}
