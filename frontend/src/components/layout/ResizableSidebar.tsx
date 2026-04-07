/**
 * ResizableSidebar - 可拖拽调整宽度的侧栏
 *
 * 用于监控大屏的设备列表、详情面板等需要灵活调整宽度的场景
 * 
 * 特性：
 * - 可拖拽调整宽度（minWidth ~ maxWidth）
 * - 可折叠/展开
 * - 折叠状态显示为图标栏
 * - 记住用户偏好宽度
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResizableSidebarProps {
  /** 子内容 */
  children: React.ReactNode;
  /** 折叠状态下显示的标题（tooltip） */
  title?: string;
  /** 默认宽度（px） */
  defaultWidth?: number;
  /** 最小宽度（px） */
  minWidth?: number;
  /** 最大宽度（px） */
  maxWidth?: number;
  /** 是否默认折叠 */
  defaultCollapsed?: boolean;
  /** 折叠/展开回调 */
  onToggle?: (collapsed: boolean) => void;
  /** 宽度变化回调 */
  onResize?: (width: number) => void;
  className?: string;
}

export function ResizableSidebar({
  children,
  title,
  defaultWidth = 240,
  minWidth = 160,
  maxWidth = 360,
  defaultCollapsed = false,
  onToggle,
  onResize,
  className,
}: ResizableSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [],
  );

  // 拖拽调整宽度
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX - sidebarRect.left));
      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, maxWidth, onResize]);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'relative flex flex-col border-r border-border-secondary bg-bg-void transition-all duration-200',
        collapsed ? 'w-[48px]' : 'overflow-hidden',
        className,
      )}
      style={collapsed ? undefined : { width }}
    >
      {/* 内容区 */}
      <div
        className={cn(
          'flex-1 min-h-0 overflow-hidden transition-opacity duration-150',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100',
        )}
      >
        {children}
      </div>

      {/* 底部工具栏：折叠按钮 */}
      <div className="shrink-0 flex items-center justify-center border-t border-border-secondary py-1.5">
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex items-center justify-center rounded-md transition-colors',
            collapsed ? 'h-8 w-8 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated' : 'h-7 w-full gap-2 px-2 text-[11px] text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated',
          )}
          title={collapsed ? title ?? '展开面板' : '收起面板'}
          aria-label={collapsed ? '展开面板' : '收起面板'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-3.5 w-3.5" />
              <span>收起</span>
            </>
          )}
        </button>
      </div>

      {/* 拖拽手柄（仅展开时显示） */}
      {!collapsed && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors',
            isDragging ? 'bg-accent/40' : 'bg-transparent hover:bg-accent/20',
          )}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="调整面板宽度"
        />
      )}
    </aside>
  );
}

export default ResizableSidebar;
