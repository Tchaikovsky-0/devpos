import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  /** 按钮变体 */
  variant?: 'default' | 'ghost' | 'active';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示激活状态 */
  isActive?: boolean;
  /** 是否显示工具提示 */
  tooltip?: string;
  /** 工具提示位置 */
  tooltipPosition?: 'left' | 'right' | 'top' | 'bottom';
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * IconButton - 图标按钮组件
 * 
 * 专为超窄侧边栏设计的图标按钮
 * - 48x48px 标准尺寸
 * - 悬浮高亮效果
 * - 激活状态指示器
 * 
 * @example
 * ```tsx
 * <IconButton>
 *   <HomeIcon />
 * </IconButton>
 * 
 * <IconButton isActive tooltip="首页">
 *   <HomeIcon />
 * </IconButton>
 * ```
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      isActive = false,
      tooltip,
      tooltipPosition = 'right',
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // 基础样式 - 圆角正方形
    const baseStyles = 'relative flex items-center justify-center rounded-md transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed group';

    // 尺寸样式 (标准 48px 用于侧边栏)
    const sizeStyles = {
      sm: 'w-9 h-9',
      md: 'w-12 h-12', // 48px
      lg: 'w-14 h-14',
    };

    // 变体样式
    const variantStyles = {
      default: 'text-[#64748b] hover:text-[#f8fafc] hover:bg-[rgba(255,255,255,0.06)]',
      ghost: 'text-[#64748b] hover:text-[#f8fafc] hover:bg-[rgba(255,255,255,0.04)]',
      active: 'text-[#3b82f6] bg-[rgba(59,130,246,0.1)]',
    };

    // 激活状态样式
    const activeStyles = isActive
      ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.1)]'
      : '';

    // 激活指示器 (左侧竖线)
    const ActiveIndicator = isActive ? (
      <motion.div
        layoutId="activeIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#3b82f6] rounded-r-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    ) : null;

    // 图标尺寸
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    // 工具提示位置样式
    const tooltipStyles = {
      left: 'right-full mr-2 top-1/2 -translate-y-1/2',
      right: 'left-full ml-2 top-1/2 -translate-y-1/2',
      top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
      bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          !isActive && variantStyles[variant],
          activeStyles,
          className
        )}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {ActiveIndicator}
        <span className={iconSizes[size]}>{children as React.ReactNode}</span>
        
        {/* 工具提示 */}
        {tooltip && (
          <span
            className={cn(
              'absolute px-2 py-1 text-xs text-[#f8fafc] bg-[#1e293b] border border-[rgba(255,255,255,0.1)] rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none',
              tooltipStyles[tooltipPosition]
            )}
          >
            {tooltip}
          </span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
