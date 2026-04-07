/**
 * Layout 组件 - 方案 A「纯净监控台」
 *
 * 主容器：编排 Provider、全局快捷键、全局数据获取，
 * 组合 AppSidebar + AppHeader + StatusBar + main content。
 *
 * 子组件拆分：
 * - AppSidebar  → components/layout/AppSidebar.tsx
 * - AppHeader   → components/layout/AppHeader.tsx
 * - StatusBar   → components/layout/StatusBar.tsx
 * - useLayoutState → hooks/useLayoutState.ts
 */

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useMemo } from 'react';

const LazyOpenClawPanel = lazy(() =>
  import('@/components/openclaw/OpenClawPanel').then((m) => ({ default: m.OpenClawPanel }))
);
import { OPENCLAW_COMPOSE_EVENT, type OpenClawComposeDetail } from '@/components/openclaw/openclawBridge';
import { useGetAlertsQuery } from '@/store/api/alertsApi';
import { useGetStreamsQuery } from '@/store/api/streamsApi';
import { useOpenClawContext } from '@/store/contexts/OpenClawContext';
import { PageTransition } from './motion';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusBar } from '@/components/layout/StatusBar';
import { ShortcutPalette } from '@/components/ui/ShortcutPalette';
import { useKeyboardShortcuts, type ShortcutDefinition } from '@/hooks/useKeyboardShortcuts';
import { useAlertNotification } from '@/hooks/useAlertNotification';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';
import { useLayoutState } from '@/hooks/useLayoutState';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

export const Layout = () => {
  // ── 布局状态 ──
  const {
    activeModule,
    isPaletteOpen,
    setIsPaletteOpen,
    navGroups,
  } = useLayoutState();

  const navigate = useNavigate();
  const location = useLocation();

  // ── 全局数据获取 ──
  const { data: alertsResponse } = useGetAlertsQuery({ page_size: 200 });
  const { data: streamsResponse } = useGetStreamsQuery({ page_size: 200 });
  const alertNotification = useAlertNotification({ enableMock: false });

  // ── WebSocket → Toast 通知桥接 ──
  useWebSocketNotifications({ enableSound: !alertNotification.isMuted });

  const alertCount = useMemo(() => {
    const alerts = (alertsResponse?.data?.items as unknown as Record<string, unknown>[]) ?? [];
    return alerts.filter((a) => String(a.status ?? '') !== '已归档').length;
  }, [alertsResponse]);

  const streams = useMemo(
    () => (streamsResponse?.data?.items as unknown as Record<string, unknown>[]) ?? [],
    [streamsResponse],
  );
  const onlineDevices = useMemo(
    () => streams.filter((s) => s.status === 'online').length,
    [streams],
  );

  // ── OpenClaw 上下文 ──
  const {
    setCurrentModule,
    currentObject,
    contextSummary,
    isPanelOpen,
    setIsPanelOpen,
  } = useOpenClawContext();

  useEffect(() => {
    setCurrentModule(activeModule.id);
  }, [activeModule.id, setCurrentModule]);

  // ── OpenClaw 快捷建议 ──
  const quickSuggestions = useMemo(() => {
    const suggestions: Record<string, string[]> = {
      center: ['研判当前焦点画面', '追溯关联资料', '发布值班任务'],
      media: ['搜索今天的新资料', '生成取证说明', '整理事件链路'],
      gallery: ['搜索特定场景图片', '生成标注报告', '对比历史画面'],
      alerts: ['分析当前告警根因', '生成升级建议', '补全交接摘要'],
      tasks: ['拆解当前待办', '补全任务说明', '回填执行摘要'],
      assets: ['诊断当前设备', '预测维护窗口', '查询历史异常'],
      openclaw: ['新建跨模块任务', '搜索知识资料', '调用自动化模板'],
      system: ['解释当前策略', '检查配置影响', '生成审计说明'],
    };
    return suggestions[activeModule.id] ?? suggestions.openclaw;
  }, [activeModule.id]);

  // ── OpenClaw compose 事件桥接 ──
  useEffect(() => {
    const handleCompose = (event: Event) => {
      const _detail = (event as CustomEvent<OpenClawComposeDetail>).detail;
      void _detail;
      setIsPanelOpen(true);
    };
    window.addEventListener(OPENCLAW_COMPOSE_EVENT, handleCompose);
    return () => window.removeEventListener(OPENCLAW_COMPOSE_EVENT, handleCompose);
  }, [setIsPanelOpen]);

  // ── 全局快捷键 ──
  const { registerAll } = useKeyboardShortcuts();

  useEffect(() => {
    const shortcutDefs: ShortcutDefinition[] = [
      { id: 'open-ai-panel', label: '⌘K', key: 'k', meta: true, priority: 10, onTrigger: () => setIsPanelOpen(!isPanelOpen) },
      { id: 'command-palette', label: '⌘P', key: 'p', meta: true, priority: 9, onTrigger: () => setIsPaletteOpen((prev) => !prev) },
      { id: 'goto-alerts', label: '⌘1', key: '1', meta: true, priority: 20, description: '跳转到告警处置', category: '导航', onTrigger: () => navigate('/alerts') },
      { id: 'goto-center', label: '⌘2', key: '2', meta: true, priority: 21, description: '跳转到监控大屏', category: '导航', onTrigger: () => navigate('/center') },
      { id: 'goto-media', label: '⌘3', key: '3', meta: true, priority: 22, description: '跳转到媒体库', category: '导航', onTrigger: () => navigate('/media') },
      { id: 'goto-tasks', label: '⌘4', key: '4', meta: true, priority: 23, description: '跳转到任务协同', category: '导航', onTrigger: () => navigate('/tasks') },
      { id: 'mute-alerts', label: '⌘⇧M', key: 'm', meta: true, shift: true, priority: 15, description: '切换告警静音', category: '告警', onTrigger: () => alertNotification.toggleMute() },
      { id: 'dismiss-notification', label: 'Escape', key: 'escape', priority: 5, description: '关闭弹窗/面板', category: '全局', onTrigger: () => { if (isPanelOpen) setIsPanelOpen(false); else if (isPaletteOpen) setIsPaletteOpen(false); } },
    ];
    registerAll(shortcutDefs);
  }, [registerAll, navigate, setIsPanelOpen, isPanelOpen, isPaletteOpen, alertNotification.toggleMute, setIsPaletteOpen]);

  // ── 渲染 ──
  return (
    <div className="flex h-screen flex-col bg-bg-primary text-text-primary md:flex-row">
      <AppSidebar
        navGroups={navGroups}
        activeModuleId={activeModule.id}
        alertCount={alertCount}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader
          currentObjectName={currentObject?.name}
          onOpenPalette={() => setIsPaletteOpen(true)}
          onOpenAIPanel={() => setIsPanelOpen(true)}
        />

        <div className="min-h-0 flex-1 overflow-auto pb-14 md:pb-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>

        <StatusBar
          alertCount={alertCount}
          onlineDevices={onlineDevices}
          totalDevices={streams.length}
          wsConnected={true}
          aiStatus="online"
        />
      </main>

      <Suspense fallback={null}>
        <LazyOpenClawPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          suggestions={quickSuggestions}
          title={`智能协同 · ${activeModule.label}`}
          subtitle={contextSummary}
          placeholder="输入任务、问题或希望它代为串联的对象"
        />
      </Suspense>

      <ShortcutPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        isAlertMuted={alertNotification.isMuted}
        onToggleAlertMute={alertNotification.toggleMute}
        isAIOpen={isPanelOpen}
        onToggleAI={() => setIsPanelOpen(!isPanelOpen)}
      />

      {/* 移动端底部导航 - 仅 md 以下显示 */}
      <div className="md:hidden">
        <MobileTabBar
          alertCount={alertCount}
          currentPath={location.pathname}
          onNavigate={(path) => navigate(path)}
        />
      </div>
    </div>
  );
};

export default Layout;
