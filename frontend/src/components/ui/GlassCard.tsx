import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  /** 卡片变体 */
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
  /** 是否可悬浮 */
  hoverable?: boolean;
  /** 是否显示发光效果 */
  glow?: boolean;
  /** 发光颜色 */
  glowColor?: 'danger' | 'success' | 'info' | 'warning' | 'none';
  /** 内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 圆角大小 */
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * GlassCard - 玻璃拟态卡片组件
 * 
 * 特性:
 * - 半透明背景 + backdrop-blur
 * - 1px 半透明边框
 * - 可选悬浮效果和发光效果
 * - 支持 Framer Motion 动画
 * 
 * @example
 * ```tsx
 * <GlassCard>
 *   <h3>标题</h3>
 *   <p>内容</p>
 * </GlassCard>
 * 
 * <GlassCard hoverable glow glowColor="danger">
 *   告警卡片
 * </GlassCard>
 * ```
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      hoverable = false,
      glow = false,
      glowColor = 'none',
      padding = 'md',
      rounded = 'lg',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative overflow-hidden';
    
    // 变体样式
    const variantStyles = {
      default: 'bg-[rgba(15,23,42,0.7)] border border-[rgba(255,255,255,0.06)]',
      elevated: 'bg-[rgba(15,23,42,0.8)] border border-[rgba(255,255,255,0.08)] shadow-glass',
      bordered: 'bg-[rgba(15,23,42,0.6)] border border-[rgba(255,255,255,0.1)]',
      ghost: 'bg-transparent border border-transparent',
    };

    // 悬浮样式
    const hoverStyles = hoverable
      ? 'transition-all duration-300 hover:bg-[rgba(15,23,42,0.85)] hover:border-[rgba(255,255,255,0.12)] hover:shadow-glass'
      : '';

    // 发光样式
    const glowStyles = {
      none: '',
      danger: 'shadow-glow-danger',
      success: 'shadow-glow-success',
      info: 'shadow-glow-info',
      warning: 'shadow-glow-warning',
    };

    // 内边距
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    // 圆角
    const roundedStyles = {
      sm: 'rounded-md',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          hoverStyles,
          glow && glowStyles[glowColor],
          paddingStyles[padding],
          roundedStyles[rounded],
          'backdrop-blur-glass',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.16, 1, 0.3, 1] 
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
