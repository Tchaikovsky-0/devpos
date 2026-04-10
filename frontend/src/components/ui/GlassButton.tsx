import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 加载状态 */
  loading?: boolean;
  /** 禁用状态 */
  disabled?: boolean;
  /** 图标 (左侧) */
  leftIcon?: React.ReactNode;
  /** 图标 (右侧) */
  rightIcon?: React.ReactNode;
  /** 是否全宽 */
  fullWidth?: boolean;
}

/**
 * GlassButton - 玻璃拟态按钮组件
 * 
 * 特性:
 * - 玻璃拟态风格
 * - 多种变体: primary, secondary, ghost, danger
 * - 支持加载状态
 * - 支持图标
 * 
 * @example
 * ```tsx
 * <GlassButton variant="primary">主要按钮</GlassButton>
 * <GlassButton variant="secondary" leftIcon={<Icon />}>带图标</GlassButton>
 * <GlassButton loading>加载中</GlassButton>
 * ```
 */
const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // 基础样式
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed';

    // 变体样式
    const variantStyles = {
      primary: 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-700 hover:border-blue-600 shadow-lg shadow-blue-500/30',
      secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30 backdrop-blur-sm',
      ghost: 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-white',
      danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/40',
      success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/40',
    };

    // 尺寸样式
    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-6 text-base rounded-lg gap-2',
    };

    // 图标尺寸
    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {loading && (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        )}
        {!loading && leftIcon && (
          <span className={iconSizes[size]}>{leftIcon}</span>
        )}
        <span>{children as React.ReactNode}</span>
        {!loading && rightIcon && (
          <span className={iconSizes[size]}>{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;
