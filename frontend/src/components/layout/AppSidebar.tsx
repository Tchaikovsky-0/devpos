/**
 * AppSidebar - 侧边栏组件 (76px)
 *
 * 3 个导航分组 (monitor / manage / ai) + 分隔线
 * 导航项渲染：图标 + 活跃状态指示（左侧强调条）
 * 告警数量角标 + 折叠控制
 */

import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { navigationModules, type NavigationModule } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { type NavGroup, getModuleStatusText } from '@/hooks/useLayoutState';

/** 导航预加载映射：hover 时提前加载对应页面 chunk */
const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/CommandCenter'),
  '/alerts': () => import('@/pages/AlertInbox'),
  '/media': () => import('@/pages/MediaLibrary'),
  '/system': () => import('@/pages/SystemSettings'),
};

export interface AppSidebarProps {
  /** 导航分组配置 */
  navGroups: NavGroup[];
  /** 当前活跃模块 ID */
  activeModuleId: string;
  /** 告警数量 */
  alertCount: number;
  /** 点击导航项回调（可选，默认用 Link 跳转） */
  onNavigate?: (path: string) => void;
  /** 是否折叠 */
  collapsed?: boolean;
  /** 折叠切换回调 */
  onCollapse?: () => void;
}

/** 单个导航项 */
function SidebarNavItem({
  module,
  isActive,
  alertCount,
  onPrefetch,
}: {
  module: NavigationModule;
  isActive: boolean;
  alertCount: number;
  onPrefetch: (path: string) => void;
}) {
  const Icon = module.icon;

  return (
    <Link
      key={module.id}
      to={module.path}
      title={module.label}
      onMouseEnter={() => onPrefetch(module.path)}
      className={cn(
        'group/rail relative flex h-[48px] w-[48px] flex-col items-center justify-center gap-1 rounded-sm p-2 text-center transition-all duration-200 ease-out',
        isActive
          ? 'text-accent'
          : 'text-text-tertiary hover:text-text-primary',
      )}
    >
      {/* 激活状态指示器 - 左侧强调条 */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
      )}

      {/* 激活背景 */}
      {isActive && (
        <motion.span
          layoutId={`active-${module.id}`}
          className="absolute inset-1.5 rounded-sm bg-accent-muted"
          transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
        />
      )}

      {/* 悬停背景 */}
      {!isActive && (
        <div className="absolute inset-1.5 rounded-sm bg-transparent transition-colors duration-150 group-hover/rail:bg-bg-elevated" />
      )}

      <div className="relative z-10">
        <Icon className="h-5 w-5" />
        {module.id === 'alerts' && alertCount > 0 && (
          <AlertBadge
            count={alertCount}
            criticalCount={0}
            size="sm"
            position="top-right"
          />
        )}
      </div>

      {/* 悬停提示面板 */}
      <div className="pointer-events-none absolute left-full top-1/2 z-30 hidden w-56 -translate-y-1/2 pl-4 md:group-hover/rail:block">
        <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-left shadow-md">
          <p className="text-sm font-semibold text-text-primary">{module.label}</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            {getModuleStatusText(module.id, alertCount)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** 系统管理导航项（底部独立） */
function SystemNavItem({
  isActive,
}: {
  isActive: boolean;
}) {
  const systemModule = navigationModules.find((m) => m.id === 'system');
  if (!systemModule) return null;
  const Icon = systemModule.icon;

  return (
    <>
      <div className="my-2 h-px w-8 bg-border-secondary" />
      <Link
        to={systemModule.path}
        title={systemModule.label}
        className={cn(
        'group/rail relative flex h-[48px] w-[48px] flex-col items-center justify-center gap-1 rounded-sm p-2 text-center transition-all duration-200 ease-out',
        isActive
          ? 'text-accent'
          : 'text-text-tertiary hover:text-text-primary',
      )}>
        {isActive && (
          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
        )}
        {isActive && (
          <motion.span
            layoutId={`active-${systemModule.id}`}
            className="absolute inset-1.5 rounded-sm bg-accent-muted"
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
          />
        )}
        {!isActive && (
          <div className="absolute inset-1.5 rounded-sm bg-transparent transition-colors duration-150 group-hover/rail:bg-bg-elevated" />
        )}
        <Icon className="relative z-10 h-5 w-5" />
      </Link>
    </>
  );
}

export function AppSidebar({
  navGroups,
  activeModuleId,
  alertCount,
}: AppSidebarProps) {
  const handlePrefetch = useCallback((path: string) => {
    routePrefetchMap[path]?.();
  }, []);

  return (
    <aside className="relative z-50 hidden shrink-0 border-b border-border bg-bg-secondary md:flex md:w-[76px] md:border-b-0 md:border-r">
      <div className="flex h-full flex-col items-center justify-between px-0 py-4">
        {/* Logo 区域 */}
        <div className="flex items-center justify-center">
          <Link
            to="/center"
            className="group flex items-center gap-3 md:flex-col md:gap-2"
            aria-label="巡检宝首页"
          >
            <div className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
              <Logo size="md" />
            </div>
          </Link>
        </div>

        {/* 导航模块 - 按分组渲染 */}
        <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden py-2">
          {navGroups.map((group, groupIndex) => (
            <div key={group.key} className="flex flex-col items-center gap-1">
              {navigationModules
                .filter((m) => group.ids.includes(m.id))
                .map((module) => (
                  <SidebarNavItem
                    key={module.id}
                    module={module}
                    isActive={module.id === activeModuleId}
                    alertCount={alertCount}
                    onPrefetch={handlePrefetch}
                  />
                ))}

              {/* 分组分隔线（非最后一组） */}
              {groupIndex < navGroups.length - 1 && (
                <div className="my-2 h-px w-8 bg-border-secondary" />
              )}
            </div>
          ))}

          {/* 系统管理 - 单独在底部 */}
          <SystemNavItem isActive={activeModuleId === 'system'} />
        </nav>

        {/* 主题切换 */}
        <div className="flex flex-col items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
