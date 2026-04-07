import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/IconButton';

export interface NavItem {
  /** 唯一标识 */
  id: string;
  /** 图标 */
  icon: React.ReactNode;
  /** 标签 */
  label: string;
  /** 链接 */
  href?: string;
  /** 是否激活 */
  isActive?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 徽章数量 */
  badge?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface NarrowSidebarProps extends Omit<HTMLMotionProps<'aside'>, 'ref'> {
  /** 导航项目 */
  items: NavItem[];
  /** 底部导航项目 */
  bottomItems?: NavItem[];
  /** Logo */
  logo?: React.ReactNode;
  /** 当前激活项 ID */
  activeId?: string;
  /** 宽度 */
  width?: string;
  /** 项目点击回调 */
  onItemClick?: (item: NavItem) => void;
}

/**
 * NarrowSidebar - 超窄侧边栏组件
 * 
 * 特性:
 * - 48px 超窄设计
 * - 仅图标导航
 * - 悬浮显示标签
 * - 当前页面高亮
 * - 支持徽章
 * 
 * @example
 * ```tsx
 * const items = [
 *   { id: 'dashboard', icon: <LayoutDashboard />, label: '监控大屏' },
 *   { id: 'alerts', icon: <Bell />, label: '告警', badge: 3 },
 * ];
 * 
 * <NarrowSidebar
 *   items={items}
 *   activeId="dashboard"
 *   logo={<Logo />}
 * />
 * ```
 */
const NarrowSidebar = forwardRef<HTMLDivElement, NarrowSidebarProps>(
  (
    {
      items,
      bottomItems = [],
      logo,
      activeId,
      width = '48px',
      onItemClick,
      className,
      ...props
    },
    ref
  ) => {
    const handleItemClick = (item: NavItem) => {
      if (!item.disabled) {
        item.onClick?.();
        onItemClick?.(item);
      }
    };

    return (
      <motion.aside
        ref={ref}
        className={cn(
          'flex flex-col h-screen bg-[#020617] border-r border-[rgba(255,255,255,0.06)]',
          className
        )}
        style={{ width }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        {...props}
      >
        {/* Logo 区域 */}
        {logo && (
          <div className="flex items-center justify-center h-14 border-b border-[rgba(255,255,255,0.06)]">
            {logo}
          </div>
        )}

        {/* 主导航 */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
          <ul className="flex flex-col items-center gap-2 px-1">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <IconButton
                  isActive={activeId === item.id || item.isActive}
                  tooltip={item.label}
                  tooltipPosition="right"
                  disabled={item.disabled}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'w-12 h-12',
                    (activeId === item.id || item.isActive) && 'text-[#3b82f6]'
                  )}
                >
                  {item.icon}
                </IconButton>
                
                {/* 徽章 */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-white bg-[#ef4444] rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 底部导航 */}
        {bottomItems.length > 0 && (
          <div className="py-3 border-t border-[rgba(255,255,255,0.06)]">
            <ul className="flex flex-col items-center gap-2 px-1">
              {bottomItems.map((item) => (
                <li key={item.id} className="relative">
                  <IconButton
                    isActive={activeId === item.id || item.isActive}
                    tooltip={item.label}
                    tooltipPosition="right"
                    disabled={item.disabled}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-12 h-12',
                      (activeId === item.id || item.isActive) && 'text-[#3b82f6]'
                    )}
                  >
                    {item.icon}
                  </IconButton>
                  
                  {/* 徽章 */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-white bg-[#ef4444] rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.aside>
    );
  }
);

NarrowSidebar.displayName = 'NarrowSidebar';

export default NarrowSidebar;
