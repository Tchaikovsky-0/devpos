// BatchToolbar - 批量操作工具栏组件
// 支持多选、批量删除、移动、导出等操作

import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircle, X, Trash2, Move, Download, Share2, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import Badge from './Badge';
import { cn } from '@/lib/utils';

export interface BatchAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'primary';
  disabled?: (selectedCount: number) => boolean;
  onClick: (selectedIds: string[]) => void;
}

export interface BatchToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  actions: BatchAction[];
  maxSelection?: number;
  className?: string;
  title?: string;
}

export function BatchToolbar({
  selectedIds,
  onClearSelection,
  actions,
  maxSelection,
  className,
  title = '项已选择',
}: BatchToolbarProps) {
  const [showActions, setShowActions] = useState(false);

  const selectedCount = selectedIds.length;
  const isOverLimit = maxSelection ? selectedCount > maxSelection : false;

  const availableActions = useMemo(() => {
    return actions.filter((action) => {
      if (action.disabled) {
        return !action.disabled(selectedCount);
      }
      return true;
    });
  }, [actions, selectedCount]);

  const handleAction = useCallback(
    (action: BatchAction) => {
      if (action.variant === 'danger') {
        const confirmed = window.confirm(`确定要 ${action.label.toLowerCase()} 这 ${selectedCount} 项吗？`);
        if (confirmed) {
          action.onClick(selectedIds);
          onClearSelection();
        }
      } else {
        action.onClick(selectedIds);
      }
    },
    [selectedIds, selectedCount, onClearSelection]
  );

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-4 px-6 py-3',
        'rounded-full bg-bg-elevated border border-border shadow-float',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className
      )}
    >
      {/* 选择计数 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClearSelection}
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">
          已选择 <Badge variant="info">{selectedCount}</Badge> {title}
        </span>
        {isOverLimit && (
          <Badge variant="warning">
            超过限制 {maxSelection}
          </Badge>
        )}
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-border" />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {availableActions.slice(0, 4).map((action) => (
          <Button
            key={action.id}
            variant={action.variant === 'danger' ? 'ghost' : 'ghost'}
            size="sm"
            onClick={() => handleAction(action)}
            className={cn(
              'gap-2',
              action.variant === 'danger' && 'text-error hover:text-error hover:bg-error/10'
            )}
          >
            {action.icon || <CheckCircle className="h-4 w-4" />}
            {action.label}
          </Button>
        ))}

        {availableActions.length > 4 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              更多
            </Button>

            {showActions && (
              <div className="absolute bottom-full mb-2 right-0 min-w-[160px] py-1 rounded-lg bg-bg-elevated border border-border shadow-lg">
                {availableActions.slice(4).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      handleAction(action);
                      setShowActions(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                      'hover:bg-bg-hover transition-colors',
                      action.variant === 'danger' && 'text-error'
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 取消选择快捷键提示 */}
      <div className="text-xs text-text-tertiary">
        按 <kbd className="px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary">Esc</kbd> 取消选择
      </div>
    </div>
  );
}

// 预设批量操作
export const createBatchActions = (
  handlers: {
    onDelete?: (ids: string[]) => void;
    onMove?: (ids: string[]) => void;
    onExport?: (ids: string[]) => void;
    onShare?: (ids: string[]) => void;
    onEdit?: (ids: string[]) => void;
  }
): BatchAction[] => {
  const actions: BatchAction[] = [];

  if (handlers.onDelete) {
    actions.push({
      id: 'delete',
      label: '删除',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: handlers.onDelete,
    });
  }

  if (handlers.onMove) {
    actions.push({
      id: 'move',
      label: '移动',
      icon: <Move className="h-4 w-4" />,
      onClick: handlers.onMove,
    });
  }

  if (handlers.onExport) {
    actions.push({
      id: 'export',
      label: '导出',
      icon: <Download className="h-4 w-4" />,
      onClick: handlers.onExport,
    });
  }

  if (handlers.onShare) {
    actions.push({
      id: 'share',
      label: '分享',
      icon: <Share2 className="h-4 w-4" />,
      onClick: handlers.onShare,
    });
  }

  if (handlers.onEdit) {
    actions.push({
      id: 'edit',
      label: '编辑',
      icon: <Edit className="h-4 w-4" />,
      onClick: handlers.onEdit,
    });
  }

  return actions;
};

export default BatchToolbar;
