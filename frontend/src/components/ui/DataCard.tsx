import React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

const variantStyles = {
  default: {
    root: 'surface-panel',
    iconBg: 'bg-bg-surface text-text-secondary',
  },
  accent: {
    root: 'surface-panel border-accent/25 bg-accent/5',
    iconBg: 'bg-accent/12 text-accent',
  },
  success: {
    root: 'surface-panel border-success/25 bg-success/5',
    iconBg: 'bg-success/14 text-success',
  },
  warning: {
    root: 'surface-panel border-warning/25 bg-warning/6',
    iconBg: 'bg-warning/14 text-warning',
  },
  error: {
    root: 'surface-panel border-error/25 bg-error/6',
    iconBg: 'bg-error/14 text-error',
  },
};

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingDown, color: 'text-error' },
  neutral: { icon: Minus, color: 'text-text-tertiary' },
};

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
  loading = false,
}) => {
  const styles = variantStyles[variant];
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : '';

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-5', styles.root)}>
        <div className="mb-4 h-3 w-20 animate-shimmer rounded-full bg-bg-light" />
        <div className="mb-2 h-9 w-28 animate-shimmer rounded-full bg-bg-light" />
        <div className="h-3 w-24 animate-shimmer rounded-full bg-bg-light" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl p-5 transition-all duration-normal hover:shadow-panel', styles.root)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-text-primary">
            {value}
          </p>
          {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
          {trend && trendValue && (
            <div className={cn('mt-4 inline-flex items-center gap-1.5 text-xs font-medium', trendColor)}>
              {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', styles.iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCard;
