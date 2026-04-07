// =============================================================================
// PermissionGate - 条件渲染 UI 元素的权限门控组件
// =============================================================================

import React from 'react';
import { usePermission, useHasAnyPermission } from '@/hooks/usePermission';

interface PermissionGateProps {
  /** 需要的权限（单个） */
  permission?: string;
  /** 需要的权限（任一即可） */
  anyPermission?: string[];
  children: React.ReactNode;
  /** 无权限时显示的替代内容 */
  fallback?: React.ReactNode;
}

/**
 * 权限门控组件 - 根据权限决定是否渲染子组件
 *
 * @example
 * ```tsx
 * <PermissionGate permission="alert:create">
 *   <button>创建告警</button>
 * </PermissionGate>
 *
 * <PermissionGate anyPermission={["media:upload", "media:update"]}>
 *   <UploadButton />
 * </PermissionGate>
 * ```
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyPermission,
  children,
  fallback = null,
}) => {
  const hasSinglePerm = usePermission(permission ?? '');
  const hasAnyPerm = useHasAnyPermission(anyPermission ?? []);

  // 没有设置任何权限要求 → 直接渲染
  if (!permission && (!anyPermission || anyPermission.length === 0)) {
    return <>{children}</>;
  }

  // 单权限检查
  if (permission && !hasSinglePerm) {
    return <>{fallback}</>;
  }

  // 任一权限检查
  if (anyPermission && anyPermission.length > 0 && !hasAnyPerm) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
