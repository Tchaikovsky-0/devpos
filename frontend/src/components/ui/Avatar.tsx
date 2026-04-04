// =============================================================================
// Avatar - 头像组件
// =============================================================================

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 头像图片地址 */
  src?: string;
  /** 替代文本 */
  alt?: string;
  /** 头像大小 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 头像形状 */
  shape?: 'circle' | 'square';
  /** 是否加载中 */
  loading?: boolean;
  /** 加载中显示的占位符 */
  fallback?: React.ReactNode;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const shapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-lg',
};

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-text-tertiary"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt,
      size = 'md',
      shape = 'circle',
      loading = false,
      fallback,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    const showImage = src && !imageError && !loading;
    const showFallback = !src || imageError || loading;

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden bg-bg-surface text-text-secondary font-medium',
          sizeStyles[size],
          shapeStyles[shape],
          className
        )}
        {...props}
      >
        {loading && <LoadingSpinner />}

        {showImage && (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {showFallback && !loading && (
          <span>{fallback || alt?.charAt(0).toUpperCase() || '?'}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
