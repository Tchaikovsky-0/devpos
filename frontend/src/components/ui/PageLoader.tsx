/**
 * 页面加载组件 (PageLoader.tsx)
 *
 * 提供多种加载状态展示方式：
 * - 骨架屏 (Skeleton)
 * - 进度条 (Progress)
 * - 圆形加载 (Spinner)
 * - 全屏加载 (Fullscreen)
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════
// 骨架屏组件
// ═══════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-lg bg-[rgb(var(--surface-raised))]',
            className,
          )}
        />
      ))}
    </>
  );
}

// 卡片骨架屏
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// 表格骨架屏
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-2 mb-3 pb-3 border-b border-[rgb(var(--border))]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-2">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 圆形加载组件
// ═══════════════════════════════════════════════════════════

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantMap = {
  default: 'border-[rgb(var(--text-tertiary))]',
  accent: 'border-[rgb(var(--accent))]',
  success: 'border-[rgb(var(--success))]',
  warning: 'border-[rgb(var(--warning))]',
  error: 'border-[rgb(var(--error))]',
};

export function Spinner({ size = 'md', className, variant = 'default' }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-t-transparent',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    />
  );
}

// 带文字的加载组件
export function LoadingWithText({
  text = '加载中...',
  size = 'md',
  className,
}: {
  text?: string;
  size?: SpinnerProps['size'];
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-[rgb(var(--text-secondary))]', className)}>
      <Spinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 进度条组件
// ═══════════════════════════════════════════════════════════

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
}

const progressVariantMap = {
  default: 'bg-[rgb(var(--text-tertiary))]',
  accent: 'bg-[rgb(var(--accent))]',
  success: 'bg-[rgb(var(--success))]',
  warning: 'bg-[rgb(var(--warning))]',
  error: 'bg-[rgb(var(--error))]',
};

export function ProgressBar({
  progress,
  className,
  showLabel = false,
  variant = 'accent',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full', className)}>
      <div className="h-1.5 w-full rounded-full bg-[rgb(var(--surface-raised))] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', progressVariantMap[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 全屏加载组件
// ═══════════════════════════════════════════════════════════

interface FullscreenLoaderProps {
  text?: string;
  subtext?: string;
  className?: string;
}

export function FullscreenLoader({ text = '加载中', subtext, className }: FullscreenLoaderProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgb(var(--canvas))]',
        className,
      )}
    >
      <div className="relative">
        {/* 外圈光晕 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent-soft))] rounded-full blur-xl opacity-20 animate-pulse" />

        {/* 主加载动画 */}
        <div className="relative flex items-center justify-center">
          <Spinner size="xl" variant="accent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-[rgb(var(--accent))]" />
          </div>
        </div>
      </div>

      {/* 文字 */}
      <div className="mt-6 text-center">
        <p className="text-base font-medium text-[rgb(var(--text-primary))]">{text}</p>
        {subtext && <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{subtext}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 页面内容加载占位组件
// ═══════════════════════════════════════════════════════════

interface PageContentLoaderProps {
  className?: string;
}

export function PageContentLoader({ className }: PageContentLoaderProps) {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* 标题区域 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-64 w-full" />
          <TableSkeleton rows={5} cols={4} />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 内联加载组件
// ═══════════════════════════════════════════════════════════

interface InlineLoaderProps {
  size?: SpinnerProps['size'];
  className?: string;
}

export function InlineLoader({ size = 'sm', className }: InlineLoaderProps) {
  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      <Spinner size={size} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 按钮加载状态组件
// ═══════════════════════════════════════════════════════════

interface ButtonLoaderProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoader({ loading, children, className }: ButtonLoaderProps) {
  if (!loading) return <>{children}</>;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Spinner size="sm" />
      <span className="opacity-70">{children}</span>
    </div>
  );
}

// 默认导出：全屏页面加载组件
export default function PageLoader({
  text = '加载中',
  subtext,
  className,
}: FullscreenLoaderProps) {
  return <FullscreenLoader text={text} subtext={subtext} className={className} />;
}
