/**
 * EmptyState - 统一空状态组件
 * 用于：文件夹为空、搜索无结果、回收站为空、数据加载为空等场景
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

type EmptyVariant = 'folder' | 'search' | 'trash' | 'data' | 'network' | 'custom';

interface EmptyStateProps {
  /** 空状态变体，自动匹配图标和文案 */
  variant?: EmptyVariant;
  /** 自定义图标（覆盖 variant 默认） */
  icon?: IconComponent;
  /** 主标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /** 额外操作按钮（可选） */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** 自定义类名 */
  className?: string;
  /** 图标尺寸 */
  iconSize?: number;
  /** 是否居中 */
  centered?: boolean;
}

const variantConfig: Record<
  EmptyVariant,
  { icon: IconComponent; title: string; description: string }
> = {
  folder: {
    icon: ({ size, className }: { size?: number; className?: string }) => (
      <svg width={size ?? 48} height={size ?? 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: '文件夹为空',
    description: '暂无文件，上传内容以填充此文件夹',
  },
  search: {
    icon: ({ size, className }: { size?: number; className?: string }) => (
      <svg width={size ?? 48} height={size ?? 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: '没有找到结果',
    description: '尝试修改搜索条件或使用其他关键词',
  },
  trash: {
    icon: ({ size, className }: { size?: number; className?: string }) => (
      <svg width={size ?? 48} height={size ?? 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
    title: '回收站为空',
    description: '删除的文件会显示在这里',
  },
  data: {
    icon: ({ size, className }: { size?: number; className?: string }) => (
      <svg width={size ?? 48} height={size ?? 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
      </svg>
    ),
    title: '暂无数据',
    description: '当前没有数据，稍后再来看看吧',
  },
  network: {
    icon: ({ size, className }: { size?: number; className?: string }) => (
      <svg width={size ?? 48} height={size ?? 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
    title: '网络异常',
    description: '无法连接服务器，请检查网络后重试',
  },
  custom: {
    icon: ({ size, className }: { size?: number; className?: string }) => (
      <svg width={size ?? 48} height={size ?? 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: '这里空空如也',
    description: '',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'custom',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  iconSize = 48,
  centered = true,
}) => {
  const config = variantConfig[variant];
  const Icon: IconComponent = icon ?? config.icon;
  const displayTitle = title ?? config.title;
  const displayDesc = description ?? config.description;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        centered && 'min-h-[200px]',
        className,
      )}
    >
      {/* 图标 */}
      <div className="mb-4 text-text-tertiary">
        <Icon size={iconSize} />
      </div>

      {/* 标题 */}
      <h3 className="mb-1 text-sm font-semibold text-text-primary">
        {displayTitle}
      </h3>

      {/* 描述 */}
      {displayDesc && (
        <p className="mb-4 max-w-xs text-xs text-text-secondary">
          {displayDesc}
        </p>
      )}

      {/* 操作按钮 */}
      {action && (
        <div className="flex items-center gap-2">
          <Button
            variant={action.variant ?? 'secondary'}
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
