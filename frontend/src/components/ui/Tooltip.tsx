import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** 触发元素 */
  children: React.ReactNode;
  /** 提示内容 */
  content: React.ReactNode;
  /** 位置 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 延迟显示 (毫秒) */
  delay?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大宽度 */
  maxWidth?: number;
}

/**
 * Tooltip - 工具提示组件
 * 
 * 特性:
 * - 玻璃拟态风格
 * - 四个方向定位
 * - 智能定位 (自动调整)
 * - 平滑动画
 * 
 * @example
 * ```tsx
 * <Tooltip content="这是一个提示">
 *   <button>悬停查看</button>
 * </Tooltip>
 * 
 * <Tooltip content="详细信息" position="bottom" delay={300}>
 *   <IconButton><InfoIcon /></IconButton>
 * </Tooltip>
 * ```
 */
const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      position = 'top',
      delay = 200,
      className,
      disabled = false,
      maxWidth = 250,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
      if (disabled) return;
      const id = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      setTimeoutId(id);
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setIsVisible(false);
    };

    // 位置样式
    const positionStyles = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    // 箭头位置样式
    const arrowStyles = {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1e293b]',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1e293b]',
      left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1e293b]',
      right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1e293b]',
    };

    // 动画方向
    const animationVariants = {
      top: { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 } },
      bottom: { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 } },
      left: { initial: { opacity: 0, x: 5 }, animate: { opacity: 1, x: 0 } },
      right: { initial: { opacity: 0, x: -5 }, animate: { opacity: 1, x: 0 } },
    };

    return (
      <div
        ref={ref}
        className="relative inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
        
        <AnimatePresence>
          {isVisible && (
            <motion.div
              className={cn(
                'absolute z-50 px-3 py-2 text-sm text-[#f8fafc] bg-[#1e293b] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
                positionStyles[position],
                className
              )}
              style={{ maxWidth }}
              initial={animationVariants[position].initial}
              animate={animationVariants[position].animate}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {content}
              
              {/* 箭头 */}
              <span
                className={cn(
                  'absolute w-0 h-0 border-4 border-transparent',
                  arrowStyles[position]
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
