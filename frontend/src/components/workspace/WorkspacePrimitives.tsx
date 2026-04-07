import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 工作空间组件类型定义
 * 统一的设计系统组件，确保视觉一致性
 * 
 * 设计系统规范:
 * - 面板圆角: rounded-2xl (28px)
 * - 卡片圆角: rounded-xl (20px)
 * - 列表项圆角: rounded-xl (20px)
 * - 详情面板圆角: rounded-xl (20px)
 */

export type WorkspaceTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const toneClassMap: Record<WorkspaceTone, string> = {
  neutral: 'bg-bg-tertiary text-text-secondary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
};

/**
 * 工作空间面板组件
 * 
 * @param children - 面板内容
 * @param className - 自定义样式
 * @param variant - 面板变体：default(标准) | compact(紧凑) | elevated(提升)
 * @param padding - 内边距：sm | md | lg
 * 
 * 统一圆角：rounded-2xl (28px)
 */
interface WorkspacePanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
}

export function WorkspacePanel({ 
  children, 
  className,
  variant = 'default',
  padding = 'md'
}: WorkspacePanelProps) {
  const paddingClasses = {
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-5',
    lg: 'p-5 md:p-6',
  };

  const variantClasses = {
    default: 'border border-border bg-bg-secondary',
    compact: 'border border-border/50 bg-bg-secondary/50',
    elevated: 'border border-border bg-bg-secondary shadow-panel',
  };

  return (
    <section
      className={cn(
        'rounded-2xl',
        paddingClasses[padding],
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * 区块标题组件
 * 
 * @param eyebrow - 顶部标签（如"告警处置"）
 * @param title - 主标题
 * @param description - 描述文本
 * @param extra - 额外操作区域
 * @param className - 自定义样式
 */
interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  extra?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  extra,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.16em] text-text-tertiary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-text-primary">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {extra ? <div className="shrink-0">{extra}</div> : null}
    </div>
  );
}

/**
 * 状态胶囊组件
 * 
 * @param children - 胶囊内容
 * @param tone - 颜色基调：neutral | accent | success | warning | danger
 * @param size - 尺寸：sm | md
 * @param className - 自定义样式
 * 
 * 统一圆角：rounded-full
 */
interface StatusPillProps {
  children: ReactNode;
  tone?: WorkspaceTone;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusPill({ 
  children, 
  tone = 'neutral',
  size = 'md',
  className 
}: StatusPillProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        toneClassMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * 指标卡片组件
 * 
 * @param label - 指标标签
 * @param value - 指标值
 * @param helper - 辅助说明
 * @param trend - 趋势指示：up | down | stable
 * @param tone - 色调：neutral | accent | success | warning | danger
 * @param icon - 图标组件
 * @param className - 自定义样式
 * 
 * 统一圆角：rounded-xl (20px)
 */
interface MetricTileProps {
  label: string;
  value: string | number;
  helper?: string;
  trend?: 'up' | 'down' | 'stable';
  tone?: WorkspaceTone;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricTile({ 
  label, 
  value, 
  helper, 
  trend,
  tone = 'neutral',
  icon,
  className 
}: MetricTileProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    stable: 'text-text-secondary',
  };

  const toneBorderMap: Record<WorkspaceTone, string> = {
    neutral: 'border-border',
    accent: 'border-accent/30',
    success: 'border-success/30',
    warning: 'border-warning/30',
    danger: 'border-error/30',
  };

  const toneBgMap: Record<WorkspaceTone, string> = {
    neutral: 'bg-bg-primary/65',
    accent: 'bg-accent/5',
    success: 'bg-success/5',
    warning: 'bg-warning/5',
    danger: 'bg-error/5',
  };

  const toneIconMap: Record<WorkspaceTone, string> = {
    neutral: 'text-text-secondary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-error',
  };

  return (
    <div className={cn(
      'rounded-xl border px-4 py-3 transition-all duration-200 hover:shadow-soft',
      toneBorderMap[tone],
      toneBgMap[tone],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-tertiary">
            {label}
          </p>
          <p className={cn(
            'mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary',
            trend && trendColors[trend]
          )}>
            {value}
          </p>
          {helper ? (
            <p className="mt-1 text-xs text-text-secondary">
              {helper}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60',
            toneIconMap[tone]
          )}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 列表项组件
 * 
 * @param children - 列表项内容
 * @param selected - 是否选中
 * @param onClick - 点击事件
 * @param className - 自定义样式
 * 
 * 统一圆角：rounded-xl (20px)
 */
interface ListItemProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListItem({ 
  children, 
  selected = false, 
  onClick,
  className 
}: ListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border px-4 py-4 text-left transition-all duration-normal',
        selected
          ? 'border-accent/30 bg-accent/10 shadow-glow'
          : 'border-border bg-bg-primary/65 hover:border-accent/20 hover:bg-bg-muted hover:shadow-md',
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * 详情面板组件
 * 
 * @param children - 面板内容
 * @param title - 面板标题
 * @param description - 面板描述
 * @param className - 自定义样式
 * 
 * 统一圆角：rounded-xl (20px)
 */
interface DetailPanelProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function DetailPanel({ 
  children, 
  title,
  description,
  className 
}: DetailPanelProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-bg-primary/65 p-4',
      className
    )}>
      {(title || description) && (
        <div className="mb-3">
          {title && (
            <p className="text-sm font-semibold text-text-primary">
              {title}
            </p>
          )}
          {description && (
            <p className="mt-1 text-xs text-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * 分隔线组件
 * 
 * 统一样式：h-px bg-border
 */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-border', className)} />;
}
