/**
 * useLayoutState - 布局状态管理 Hook
 *
 * 管理侧边栏折叠、当前活跃模块、面板开关、导航等布局级状态。
 * 从 Layout.tsx 中抽离，保持单一职责。
 */

import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { findModuleForPath, type NavigationModule } from '@/config/navigation';

/** 导航分组定义 */
export interface NavGroup {
  key: string;
  ids: string[];
}

/** 默认导航分组：监控类 / 管理类 / AI 类 */
export const defaultNavGroups: NavGroup[] = [
  { key: 'monitor', ids: ['center', 'media'] },
  { key: 'manage', ids: ['alerts'] },
  { key: 'ai', ids: ['openclaw'] },
];

export interface UseLayoutStateReturn {
  /** 当前路由匹配的模块 */
  activeModule: NavigationModule;
  /** 侧边栏是否折叠 */
  collapsed: boolean;
  /** 切换侧边栏折叠 */
  toggleCollapsed: () => void;
  /** 设置折叠状态 */
  setCollapsed: (value: boolean) => void;
  /** 命令面板是否打开 */
  isPaletteOpen: boolean;
  /** 设置命令面板开关 */
  setIsPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** 导航到指定路径 */
  navigateTo: (path: string) => void;
  /** 导航分组 */
  navGroups: NavGroup[];
}

export function useLayoutState(): UseLayoutStateReturn {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const activeModule = useMemo(
    () => findModuleForPath(location.pathname),
    [location.pathname],
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  return {
    activeModule,
    collapsed,
    toggleCollapsed,
    setCollapsed,
    isPaletteOpen,
    setIsPaletteOpen,
    navigateTo,
    navGroups: defaultNavGroups,
  };
}

/** 模块状态文字 */
export function getModuleStatusText(moduleId: string, alertCount: number): string {
  const statusMap: Record<string, string> = {
    center: '监控大屏就绪',
    media: '资料库就绪',
    gallery: '图库就绪',
    alerts: `${alertCount} 条待处置`,
    tasks: '任务链就绪',
    assets: '设备台账就绪',
    openclaw: '智能协同就绪',
    system: '系统运行正常',
  };
  return statusMap[moduleId] ?? '状态稳定';
}

export default useLayoutState;
