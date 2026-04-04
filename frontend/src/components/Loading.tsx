import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen && 'rounded-[24px] surface-float px-8 py-7',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
      </div>
      {text && (
        <p className={cn(textSizes[size], 'max-w-[18rem] text-center text-text-secondary')}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 surface-overlay">
        {content}
      </div>
    );
  }

  return content;
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

const SKELETON_WIDTHS = ['72%', '88%', '61%', '78%', '54%'];
const TABLE_SKELETON_WIDTHS = ['74%', '48%', '66%', '57%', '81%', '52%'];

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded-full bg-bg-hover animate-pulse animate-shimmer"
          style={{
            width: SKELETON_WIDTHS[index % SKELETON_WIDTHS.length],
          }}
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={cn('rounded-[24px] surface-panel p-6', className)}>
      <div className="space-y-4 animate-pulse animate-shimmer">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-bg-hover" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded-full bg-bg-hover" />
            <div className="h-3 w-1/2 rounded-full bg-bg-hover" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-bg-hover" />
          <div className="h-3 w-5/6 rounded-full bg-bg-hover" />
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => {
  return (
    <div className={cn('overflow-hidden rounded-[24px] surface-panel', className)}>
      <table className="w-full">
        <thead className="bg-bg-surface/70">
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 w-20 animate-shimmer rounded-full bg-bg-hover" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div
                    className="h-4 animate-shimmer rounded-full bg-bg-hover"
                    style={{ width: TABLE_SKELETON_WIDTHS[(rowIndex + colIndex) % TABLE_SKELETON_WIDTHS.length] }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
