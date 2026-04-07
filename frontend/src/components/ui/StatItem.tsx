import React from 'react';
import { cn } from '@/lib/utils';

export interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: 'success' | 'danger' | 'warning' | 'info';
  pulse?: boolean;
}

export function StatItem({ icon, value, label, color, pulse = false }: StatItemProps) {
  const colorStyles = {
    success: 'text-success bg-success-muted',
    danger: 'text-error bg-error-muted',
    warning: 'text-warning bg-warning-muted',
    info: 'text-accent bg-accent-muted',
  };

  return (
    <div className="flex items-center gap-2">
      <span 
        className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center',
          colorStyles[color],
          pulse && 'animate-pulse'
        )}
      >
        {icon}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-sm font-mono font-semibold', colorStyles[color].split(' ')[0])}>
          {value}
        </span>
        <span className="text-xs text-text-primary0">{label}</span>
      </div>
    </div>
  );
}

export default StatItem;
