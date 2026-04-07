import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BadgeStatus = 
  | 'alert'      // 告警 - 红色
  | 'warning'    // 警告 - 琥珀色
  | 'success'    // 正常 - 绿色
  | 'info'       // 信息 - 蓝色
  | 'processing' // 处理中 - 紫色
  | 'ignored'    // 忽略 - 灰色
  | 'danger';    // 危险 - 红色

export type BadgeVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';

export interface BadgeProps extends Omit<HTMLMotionProps<'span'>, 'ref'> {
  /** 状态类型 */
  status?: BadgeStatus;
  /** 变体类型 (简化版) */
  variant?: BadgeVariant;
  /** 自定义文本 */
  text?: string;
  /** 是否显示呼吸动画 */
  pulse?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示圆点 */
  dot?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
}

/**
 * 状态配置映射
 */
const statusConfig: Record<BadgeStatus, { text: string; className: string; dotClass: string }> = {
  alert: {
    text: '告警',
    className: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444] border-[rgba(239,68,68,0.3)]',
    dotClass: 'bg-[#ef4444]',
  },
  danger: {
    text: '危险',
    className: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444] border-[rgba(239,68,68,0.3)]',
    dotClass: 'bg-[#ef4444]',
  },
  warning: {
    text: '警告',
    className: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border-[rgba(245,158,11,0.3)]',
    dotClass: 'bg-[#f59e0b]',
  },
  success: {
    text: '正常',
    className: 'bg-[rgba(16,185,129,0.15)] text-[#10b981] border-[rgba(16,185,129,0.3)]',
    dotClass: 'bg-[#10b981]',
  },
  info: {
    text: '信息',
    className: 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]',
    dotClass: 'bg-[#3b82f6]',
  },
  processing: {
    text: '处理中',
    className: 'bg-[rgba(99,102,241,0.15)] text-[#6366f1] border-[rgba(99,102,241,0.3)]',
    dotClass: 'bg-[#6366f1]',
  },
  ignored: {
    text: '已忽略',
    className: 'bg-[rgba(100,116,139,0.15)] text-[#64748b] border-[rgba(100,116,139,0.3)]',
    dotClass: 'bg-[#64748b]',
  },
};

const variantConfig: Record<BadgeVariant, { className: string; dotClass: string }> = {
  default: {
    className: 'bg-[rgba(100,116,139,0.15)] text-[#64748b] border-[rgba(100,116,139,0.3)]',
    dotClass: 'bg-[#64748b]',
  },
  danger: {
    className: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444] border-[rgba(239,68,68,0.3)]',
    dotClass: 'bg-[#ef4444]',
  },
  warning: {
    className: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border-[rgba(245,158,11,0.3)]',
    dotClass: 'bg-[#f59e0b]',
  },
  success: {
    className: 'bg-[rgba(16,185,129,0.15)] text-[#10b981] border-[rgba(16,185,129,0.3)]',
    dotClass: 'bg-[#10b981]',
  },
  info: {
    className: 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]',
    dotClass: 'bg-[#3b82f6]',
  },
};

/**
 * Badge - 状态标签组件
 * 
 * 特性:
 * - 多种状态类型: alert, warning, success, info, processing, ignored
 * - 支持呼吸动画 (用于告警)
 * - 可选圆点指示器
 * 
 * @example
 * ```tsx
 * <Badge status="alert" pulse />
 * <Badge status="success" text="运行中" />
 * <Badge status="warning" dot />
 * ```
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      status,
      variant,
      text,
      pulse = false,
      size = 'md',
      dot = false,
      clickable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // 优先使用 variant，否则使用 status
    const config = variant 
      ? { ...variantConfig[variant], text: text || '' }
      : statusConfig[status || 'info'];
    const displayText = text || config.text;

    // 尺寸样式
    const sizeStyles = {
      sm: 'px-1.5 py-0.5 text-[10px] gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
      lg: 'px-3 py-1.5 text-sm gap-2',
    };

    // 圆点尺寸
    const dotSizes = {
      sm: 'w-1 h-1',
      md: 'w-1.5 h-1.5',
      lg: 'w-2 h-2',
    };

    // 呼吸动画 (仅告警状态)
    const pulseAnimation = pulse && status === 'alert' ? {
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(239, 68, 68, 0.4)',
          '0 0 0 4px rgba(239, 68, 68, 0)',
        ],
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    } : {};

    return (
      <motion.span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full border transition-all duration-200',
          sizeStyles[size],
          config.className,
          clickable && 'cursor-pointer hover:opacity-80',
          className
        )}
        {...pulseAnimation}
        {...props}
      >
        {dot && (
          <span className={cn('rounded-full', dotSizes[size], config.dotClass)} />
        )}
        <span>{displayText}</span>
        {children as React.ReactNode}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * PriorityBadge - 优先级标签
 * 用于显示告警优先级 P0/P1/P2/P3
 */
export interface PriorityBadgeProps {
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge = ({ priority, size = 'sm' }: PriorityBadgeProps) => {
  const config = {
    P0: { text: 'P0', className: 'bg-error-muted text-error border-error' },
    P1: { text: 'P1', className: 'bg-warning-muted text-warning border-warning' },
    P2: { text: 'P2', className: 'bg-accent-muted text-accent border-accent' },
    P3: { text: 'P3', className: 'bg-bg-muted text-text-secondary border-border' },
  }[priority];

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-mono font-semibold rounded border',
      sizeStyles[size],
      config.className
    )}>
      {config.text}
    </span>
  );
};

export default Badge;
