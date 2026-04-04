import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const variantStyles = {
    text: 'rounded-full h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animationStyles = {
    pulse: 'animate-shimmer',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn('bg-bg-light', variantStyles[variant], animationStyles[animation], className)}
      style={{ width, height }}
    />
  );
};

interface SkeletonCardProps {
  rows?: number;
  hasHeader?: boolean;
  hasActions?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  rows = 3,
  hasHeader = true,
  hasActions = false,
  className,
}) => (
  <div className={cn('surface-panel rounded-2xl p-5', className)}>
    {hasHeader && (
      <div className="mb-4 flex items-center justify-between">
        <Skeleton width={120} height={14} variant="rounded" />
        {hasActions && <Skeleton width={96} height={34} variant="rounded" />}
      </div>
    )}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === rows - 1 ? '70%' : '100%'}
          height={14}
          variant="rounded"
        />
      ))}
    </div>
  </div>
);

export const SkeletonDataCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('surface-panel rounded-2xl p-5', className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton width={72} height={12} variant="rounded" />
        <Skeleton width={110} height={34} variant="rounded" />
        <Skeleton width={88} height={12} variant="rounded" />
      </div>
      <Skeleton width={44} height={44} variant="rounded" />
    </div>
  </div>
);

export default Skeleton;
