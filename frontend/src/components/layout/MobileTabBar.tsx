/**
 * MobileTabBar - 移动端底部 TabBar 导航
 *
 * 仅在 md (768px) 以下断点显示，固定在屏幕底部。
 * 包含 5 个核心导航项：监控、告警、媒体、AI、设置。
 */

import { Monitor, Bell, FolderOpen, Bot, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileTabBarProps {
  /** 未处理告警数量 */
  alertCount: number;
  /** 当前路由路径 */
  currentPath: string;
  /** 导航回调 */
  onNavigate: (path: string) => void;
}

interface TabItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

const tabs: TabItem[] = [
  { path: '/center', label: '监控', icon: Monitor },
  { path: '/alerts', label: '告警', icon: Bell, badge: true },
  { path: '/media', label: '媒体', icon: FolderOpen },
  { path: '/openclaw', label: 'AI', icon: Bot },
  { path: '/system', label: '设置', icon: Settings },
];

/** 判断当前路径是否匹配 tab */
function isTabActive(currentPath: string, tabPath: string): boolean {
  if (tabPath === '/center') {
    return currentPath === '/' || currentPath === '/center' || currentPath.startsWith('/center/');
  }
  return currentPath === tabPath || currentPath.startsWith(`${tabPath}/`);
}

export function MobileTabBar({ alertCount, currentPath, onNavigate }: MobileTabBarProps): React.JSX.Element {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-secondary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const active = isTabActive(currentPath, tab.path);
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => onNavigate(tab.path)}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 transition-colors duration-150',
                active ? 'text-accent' : 'text-text-tertiary active:text-text-primary',
              )}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge && alertCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabBar;
