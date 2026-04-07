/**
 * 巡检宝Logo组件
 * Precision Order · 精密秩序
 * 
 * 支持多种尺寸和主题适配
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** 尺寸变体 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 主题变体 */
  variant?: 'default' | 'light' | 'dark';
  /** 是否显示动画 */
  animated?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * Logo组件
 * 
 * @example
 * <Logo size="md" variant="default" />
 * <Logo size="lg" variant="light" animated />
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'default',
  animated = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    default: 'text-text-primary',
    light: 'text-white',
    dark: 'text-gray-900',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        colorClasses[variant],
        animated && 'animate-pulse',
        className
      )}
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 外层弧线 - 上 */}
        <path
          d="M 50 80 A 50 50 0 0 1 150 80"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* 外层弧线 - 下 */}
        <path
          d="M 50 120 A 50 50 0 0 0 150 120"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* 内层弧线 - 上（错位60度） */}
        <path
          d="M 65 70 A 35 35 0 0 1 135 70"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* 内层弧线 - 下（错位60度） */}
        <path
          d="M 65 130 A 35 35 0 0 0 135 130"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* 中心点 */}
        <circle
          cx="100"
          cy="100"
          r="10"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

/**
 * Logo带文字组合组件
 * 用于导航栏、页眉等场景
 */
interface LogoWithTextProps extends LogoProps {
  /** 文字位置 */
  textPosition?: 'right' | 'bottom';
  /** 是否显示副标题 */
  showSubtitle?: boolean;
}

export const LogoWithText: React.FC<LogoWithTextProps> = ({
  size = 'md',
  variant = 'default',
  textPosition = 'right',
  showSubtitle = false,
  className,
}) => {
  const containerClasses = {
    right: 'flex-row items-center gap-3',
    bottom: 'flex-col items-center gap-2',
  };

  const textColorClasses = {
    default: 'text-text-primary',
    light: 'text-white',
    dark: 'text-gray-900',
  };

  return (
    <div
      className={cn(
        'flex',
        containerClasses[textPosition],
        className
      )}
    >
      <Logo size={size} variant={variant} />
      
      <div className={cn('flex flex-col', textPosition === 'bottom' && 'items-center')}>
        <span className={cn('font-semibold tracking-tight', textColorClasses[variant])}>
          巡检宝
        </span>
        {showSubtitle && (
          <span className="text-xs text-text-secondary">
            智能监控平台
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
