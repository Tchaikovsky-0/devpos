// =============================================================================
// ProtectedRoute - 基于角色/权限的路由保护组件
// =============================================================================

import React from 'react';
import { useRole, usePermission, useHasAnyPermission } from '@/hooks/usePermission';

interface ProtectedRouteProps {
  /** 允许访问的角色列表 */
  requiredRole?: string[];
  /** 需要的权限（单个） */
  requiredPermission?: string;
  /** 需要的权限（任一即可） */
  requiredAnyPermission?: string[];
  children: React.ReactNode;
  /** 无权限时显示的内容 */
  fallback?: React.ReactNode;
}

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        无权限访问
      </h2>
      <p className="text-gray-500 dark:text-gray-400">
        您没有访问此页面的权限，请联系管理员
      </p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  requiredPermission,
  requiredAnyPermission,
  children,
  fallback,
}) => {
  const currentRole = useRole();
  const hasPermission = usePermission(requiredPermission ?? '');
  const hasAnyPerm = useHasAnyPermission(requiredAnyPermission ?? []);

  // 如果没有设置任何权限要求，直接放行
  if (!requiredRole && !requiredPermission && !requiredAnyPermission) {
    return <>{children}</>;
  }

  // 检查角色
  if (requiredRole && requiredRole.length > 0) {
    if (!requiredRole.includes(currentRole)) {
      return <>{fallback ?? <DefaultFallback />}</>;
    }
  }

  // 检查单个权限
  if (requiredPermission && !hasPermission) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  // 检查任一权限
  if (requiredAnyPermission && requiredAnyPermission.length > 0 && !hasAnyPerm) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
