// =============================================================================
// LoadingSpinner - 加载动画组件
// =============================================================================

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 类名 */
  className?: string;
  /** 颜色 */
  color?: 'default' | 'primary' | 'white';
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const colorStyles = {
  default: 'text-text-tertiary',
  primary: 'text-accent',
  white: 'text-white',
};

/**
 * 加载动画组件
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" color="primary" />
 *
 * // 全屏加载
 * <div className="fixed inset-0 flex items-center justify-center">
 *   <LoadingSpinner size="lg" />
 * </div>
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'default',
}) => {
  return (
    <svg
      className={cn('animate-spin', sizeStyles[size], colorStyles[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * 加载遮罩组件
 *
 * @example
 * ```tsx
 * <LoadingOverlay>
 *   <div>内容</div>
 * </LoadingOverlay>
 * ```
 */
export interface LoadingOverlayProps {
  /** 是否显示 */
  loading: boolean;
  /** 自定义加载内容 */
  indicator?: React.ReactNode;
  /** 背景透明度 */
  opacity?: 'light' | 'dark';
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  indicator,
  opacity = 'dark',
  children,
}) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center backdrop-blur-sm',
            opacity === 'dark' && 'bg-bg-darkest/58',
            opacity === 'light' && 'bg-bg-primary/72'
          )}
        >
          <div className="rounded-[22px] surface-float p-4">
            {indicator || <LoadingSpinner size="lg" />}
          </div>
        </div>
      )}
    </div>
  );
};
