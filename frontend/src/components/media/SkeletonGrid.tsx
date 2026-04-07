import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 12,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="surface-panel rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-bg-tertiary/50" />
          <div className="p-2 space-y-1.5">
            <div className="h-3 w-3/4 rounded-full bg-bg-tertiary/50" />
            <div className="h-2 w-1/2 rounded-full bg-bg-tertiary/50" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 8,
  className = '',
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 animate-pulse"
        >
          <div className="h-5 w-5 rounded-full bg-bg-tertiary/50 shrink-0" />
          <div className="flex-1 h-3 rounded-full bg-bg-tertiary/50" />
          <div className="h-3 w-16 rounded-full bg-bg-tertiary/50 shrink-0" />
          <div className="h-3 w-24 rounded-full bg-bg-tertiary/50 shrink-0" />
        </div>
      ))}
    </div>
  );
};
