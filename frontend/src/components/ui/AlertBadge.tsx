// =============================================================================
// AlertBadge - 告警角标组件
// =============================================================================
// 用于侧边栏导航、状态栏等位置的告警计数角标。
// 支持 P0 脉冲动画、多级颜色映射、溢出显示。
// =============================================================================

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ── Types ──

export interface AlertBadgeProps {
  /** 未读告警总数 */
  count: number;
  /** P0 紧急告警数量 */
  criticalCount?: number;
  /** 尺寸变体 */
  size?: 'sm' | 'md' | 'lg';
  /** 位置变体 */
  position?: 'top-right' | 'top-left' | 'bottom-right';
  /** 是否隐藏零计数 */
  hideWhenZero?: boolean;
  /** 溢出阈值 (默认 99) */
  overflowThreshold?: number;
  /** 类名 */
  className?: string;
}

// ── Size Config ──

const SIZE_CONFIG = {
  sm: {
    container: 'min-w-[16px] h-4 text-[10px]',
    offset: 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  },
  md: {
    container: 'min-w-[20px] h-5 text-[11px]',
    offset: '-top-1 -right-1',
  },
  lg: {
    container: 'min-w-[24px] h-6 text-[12px]',
    offset: '-top-1.5 -right-1.5',
  },
} as const;

// ── Component ──

export const AlertBadge: React.FC<AlertBadgeProps> = memo(({
  count,
  criticalCount = 0,
  size = 'md',
  position = 'top-right',
  hideWhenZero = true,
  overflowThreshold = 99,
  className,
}) => {
  const displayCount = useMemo(() => {
    if (count <= overflowThreshold) return String(count);
    return `${overflowThreshold}+`;
  }, [count, overflowThreshold]);

  const hasCritical = criticalCount > 0;
  const sizeConfig = SIZE_CONFIG[size];

  if (hideWhenZero && count === 0) return null;

  // Position classes
  const positionClasses = {
    'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
    'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  }[position];

  return (
    <span
      className={cn(
        // Base
        'absolute z-20 flex items-center justify-center rounded-full font-bold leading-none select-none',
        'px-1 pointer-events-none',
        // Size
        sizeConfig.container,
        // Position
        positionClasses,
        // Color: critical = red with pulse, normal = warning amber
        hasCritical
          ? 'bg-error text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]'
          : 'bg-warning text-white shadow-[0_0_6px_rgba(245,158,11,0.4)]',
        // Animation
        hasCritical && 'animate-alert-badge-pulse',
        className,
      )}
      aria-label={`${count} 条未读告警`}
      role="status"
    >
      {displayCount}
    </span>
  );
});

AlertBadge.displayName = 'AlertBadge';

export default AlertBadge;
