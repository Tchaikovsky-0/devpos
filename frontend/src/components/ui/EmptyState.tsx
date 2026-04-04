// =============================================================================
// EmptyState - 空状态组件
// =============================================================================

import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  /** 图标 */
  icon?: React.ReactNode;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 类名 */
  className?: string;
}

/**
 * 空状态组件
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Inbox />}
 *   title="暂无告警"
 *   description="当前没有需要处理的告警信息"
 *   action={{ label: '刷新', onClick: () => refetch() }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {icon ? (
        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mb-4 text-text-tertiary">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-text-tertiary" />
        </div>
      )}

      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-text-secondary text-center max-w-sm mb-4">
          {description}
        </p>
      )}

      {action && (
        <Button variant="default" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
