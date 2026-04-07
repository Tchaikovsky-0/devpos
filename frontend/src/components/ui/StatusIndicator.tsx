import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'online' | 'offline' | 'alert' | 'warning' | 'pending';

export interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<
  StatusType,
  { dot: string; ring: string; label: string; text: string; bg: string }
> = {
  online: {
    dot: 'bg-success',
    ring: 'shadow-[0_0_0_4px_rgb(var(--success)/0.12)]',
    label: '在线',
    text: 'text-success',
    bg: 'bg-success/10',
  },
  offline: {
    dot: 'bg-text-tertiary',
    ring: '',
    label: '离线',
    text: 'text-text-secondary',
    bg: 'bg-bg-surface',
  },
  alert: {
    dot: 'bg-error',
    ring: 'shadow-[0_0_0_4px_rgb(var(--error)/0.12)]',
    label: '告警',
    text: 'text-error',
    bg: 'bg-error/10',
  },
  warning: {
    dot: 'bg-warning',
    ring: 'shadow-[0_0_0_4px_rgb(var(--warning)/0.12)]',
    label: '警告',
    text: 'text-warning',
    bg: 'bg-warning/10',
  },
  pending: {
    dot: 'bg-info',
    ring: '',
    label: '待处理',
    text: 'text-info',
    bg: 'bg-info/10',
  },
};

const sizeStyles = {
  sm: {
    dot: 'h-1.5 w-1.5',
    text: 'text-xs',
    gap: 'gap-1.5',
    pill: 'px-2 py-1',
  },
  md: {
    dot: 'h-2 w-2',
    text: 'text-sm',
    gap: 'gap-2',
    pill: 'px-2.5 py-1',
  },
  lg: {
    dot: 'h-2.5 w-2.5',
    text: 'text-base',
    gap: 'gap-2.5',
    pill: 'px-3 py-1.5',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  label,
  pulse,
}) => {
  const config = statusConfig[status];
  const sizeStyle = sizeStyles[size];
  const shouldPulse = pulse ?? (status === 'online' || status === 'alert' || status === 'warning');

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full',
        sizeStyle.gap,
        showLabel && sizeStyle.pill,
        showLabel && config.bg,
      )}
    >
      <span
        className={cn(
          'rounded-full',
          sizeStyle.dot,
          config.dot,
          config.ring,
          shouldPulse && 'animate-pulse',
        )}
      />
      {showLabel && (
        <span className={cn(sizeStyle.text, 'font-medium', config.text)}>
          {label || config.label}
        </span>
      )}
    </div>
  );
};

StatusIndicator.displayName = 'StatusIndicator';

export default StatusIndicator;
