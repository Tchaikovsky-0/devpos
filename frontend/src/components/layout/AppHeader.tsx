/**
 * AppHeader - 顶栏组件 (48px)
 *
 * - 面包屑导航（基于路由元数据自动生成）
 * - 上下文对象指示器
 * - 命令面板触发按钮
 * - AI 协同面板触发按钮
 */

import { useLocation, Link } from 'react-router-dom';
import { Bot, ChevronRight, Home } from 'lucide-react';
import { ShortcutHint } from '@/components/ui/ShortcutHint';
import { ROUTE_META } from '@/router';
import { GlobalMonitorStatus } from './GlobalMonitorStatus';

export interface AppHeaderProps {
  /** 当前上下文对象（可选，如监控中的某个摄像头） */
  currentObjectName?: string;
  /** 打开命令面板 */
  onOpenPalette: () => void;
  /** 打开 AI 协同面板 */
  onOpenAIPanel: () => void;
}

export function AppHeader({
  currentObjectName,
  onOpenPalette,
  onOpenAIPanel,
}: AppHeaderProps) {
  const location = useLocation();
  const currentRoute = ROUTE_META[location.pathname];

  return (
    <header className="shrink-0 h-12 flex items-center justify-between border-b border-border bg-bg-secondary px-6">
      {/* 左侧：面包屑 + 上下文指示器 */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="面包屑导航">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">首页</span>
          </Link>

          {currentRoute && (
            <>
              <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0" />
              <span className="text-text-primary font-medium truncate">
                {currentRoute.title}
              </span>
            </>
          )}
        </nav>

        {currentObjectName && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-success-muted ml-2 px-2.5 py-0.5 text-[11px] font-medium text-success">
            {currentObjectName}
          </span>
        )}
      </div>

      {/* 右侧：监控状态 + 用户操作 */}
      <div className="flex items-center gap-4">
        {/* 全局监控状态 */}
        <GlobalMonitorStatus />
        
        {/* 命令面板触发按钮 */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="inline-flex items-center gap-1.5 rounded-md bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          title="命令面板 (⌘P)"
        >
          <span className="hidden sm:inline">命令</span>
          <ShortcutHint shortcut="⌘P" size="xs" />
        </button>

        {/* 打开 AI 助手 - 紧凑型按钮 */}
        <button
          type="button"
          onClick={onOpenAIPanel}
          className="inline-flex items-center gap-1.5 rounded-md bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI 助手</span>
          <ShortcutHint shortcut="⌘K" size="xs" />
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
