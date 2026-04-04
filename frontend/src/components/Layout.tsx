import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Bot, Command, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { OpenClawPanel, type OpenClawMessage } from '@/components/openclaw';
import { OPENCLAW_COMPOSE_EVENT, type OpenClawComposeDetail } from '@/components/openclaw/openclawBridge';
import { buildMockAssistantResponse } from '@/components/openclaw/mockAssistant';
import { findModuleForPath, navigationModules } from '../config/navigation';
import { useGetAlertsQuery } from '@/store/api/alertsApi';
import { cn } from '@/lib/utils';

export const Layout = () => {
  const location = useLocation();
  const { data: alertsResponse } = useGetAlertsQuery({ page_size: 200 });
  const alertCount = useMemo(() => {
    const alerts = (alertsResponse?.data as unknown[] as Record<string, unknown>[]) ?? [];
    return alerts.filter((a) => String(a.status ?? '') !== '已归档').length;
  }, [alertsResponse]);
  const activeModule = useMemo(() => findModuleForPath(location.pathname), [location.pathname]);

  // Module status text — static placeholder until per-module stats APIs exist
  const moduleStatusText: Record<string, string> = useMemo(() => ({
    center: '实时监控中',
    media: '资料库就绪',
    alerts: `${alertCount} 条待处置`,
    tasks: '任务链就绪',
    assets: '设备台账就绪',
    openclaw: '智能协同就绪',
    system: '系统运行正常',
  }), [alertCount]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<OpenClawMessage[]>([]);
  const pendingTimersRef = useRef<number[]>([]);

  const quickSuggestions = useMemo(() => {
    const suggestions: Record<string, string[]> = {
      center: ['研判当前焦点画面', '追溯关联资料', '发布值班任务'],
      media: ['搜索今天的新资料', '生成取证说明', '整理事件链路'],
      alerts: ['分析当前告警根因', '生成升级建议', '补全交接摘要'],
      tasks: ['拆解当前待办', '补全任务说明', '回填执行摘要'],
      assets: ['诊断当前设备', '预测维护窗口', '查询历史异常'],
      openclaw: ['新建跨模块任务', '搜索知识资料', '调用自动化模板'],
      system: ['解释当前策略', '检查配置影响', '生成审计说明'],
    };

    return suggestions[activeModule.id] ?? suggestions.openclaw;
  }, [activeModule.id]);

  useEffect(
    () => () => {
      pendingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      pendingTimersRef.current = [];
    },
    [],
  );

  const scheduleAssistantReply = useCallback(
    (prompt: string, source?: string) => {
      const response = buildMockAssistantResponse(activeModule.id, prompt, source);

      setIsThinking(true);
      const timerId = window.setTimeout(() => {
        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: response.content,
            timestamp: new Date(),
            suggestions: response.suggestions,
            actions: response.actions,
          },
        ]);
        setIsThinking(false);
      }, 420);

      pendingTimersRef.current.push(timerId);
    },
    [activeModule.id],
  );

  const handleSendMessage = useCallback(
    (prompt: string, source?: string) => {
      setIsPanelOpen(true);
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-user`,
          role: 'user',
          content: prompt,
          timestamp: new Date(),
        },
      ]);
      scheduleAssistantReply(prompt, source);
    },
    [scheduleAssistantReply],
  );

  useEffect(() => {
    const handleCompose = (event: Event) => {
      const detail = (event as CustomEvent<OpenClawComposeDetail>).detail;
      handleSendMessage(detail.prompt, detail.source);
    };

    window.addEventListener(OPENCLAW_COMPOSE_EVENT, handleCompose);
    return () => window.removeEventListener(OPENCLAW_COMPOSE_EVENT, handleCompose);
  }, [handleSendMessage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsPanelOpen((previous) => !previous);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-bg-primary text-text-primary md:flex-row">
      <aside className="relative z-50 shrink-0 border-b border-border bg-bg-darkest md:w-[64px] md:border-b-0 md:border-r">
        <div className="flex h-full items-center justify-between px-4 py-3 md:flex-col md:px-0 md:py-5">
          <Link
            to="/center"
            className="group flex items-center gap-3 md:flex-col md:gap-2"
            aria-label="巡检宝首页"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-base font-semibold text-white shadow-panel transition-transform duration-normal group-hover:-translate-y-0.5">
              巡
            </div>
          </Link>

          <nav className="flex items-center gap-2 overflow-x-auto md:flex-1 md:flex-col md:gap-3 md:overflow-visible md:mt-6">
            {navigationModules.map((module) => {
              const Icon = module.icon;
              const isActive = module.id === activeModule.id;

              return (
                <Link
                  key={module.id}
                  to={module.path}
                  title={module.label}
                  className={cn(
                    'group/rail relative flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-md p-2 text-center transition-all duration-150 md:min-w-0 md:w-[40px] md:h-[40px]',
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-tertiary hover:text-text-primary',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId={`active-${module.id}`}
                      className="absolute inset-0 rounded-md border border-accent/20 bg-accent/10"
                      transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 0.5 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <div className="pointer-events-none absolute left-full top-1/2 z-30 hidden w-56 -translate-y-1/2 pl-3 md:group-hover/rail:block">
                    <div className="rounded-[22px] border border-border bg-bg-primary px-4 py-3 text-left shadow-lg">
                      <p className="text-sm font-semibold text-text-primary">{module.label}</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">{module.description}</p>
                      <p className="mt-2 text-xs font-medium text-accent">
                        {moduleStatusText[module.id] ?? '状态稳定'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex md:flex-col md:items-center md:gap-3">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-border bg-bg-secondary">
          <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-[-0.04em] text-text-primary">
                    {activeModule.label}
                  </h1>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {moduleStatusText[activeModule.id] ?? '状态稳定'}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
                  {activeModule.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary">
                  <BellRing className="h-3.5 w-3.5 text-warning" />
                  <span>待处置告警</span>
                  <span className="text-text-primary">{alertCount}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>智能协同贯穿工作流</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-panel transition-colors duration-normal hover:bg-accent-hover"
                >
                  <Bot className="h-4 w-4" />
                  <span>打开智能协同</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-border bg-bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>当前工作面围绕</span>
                <span className="font-medium text-text-primary">{activeModule.label}</span>
                <span>展开，主路径保持简洁，不拆分冗余功能块。</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-bg-primary px-3 py-1.5 text-xs font-medium text-text-secondary">
                <Command className="h-3.5 w-3.5 text-accent" />
                <span>Cmd / Ctrl + K</span>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      <OpenClawPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        messages={messages}
        onSendMessage={(message) => handleSendMessage(message)}
        suggestions={quickSuggestions}
        isThinking={isThinking}
        title={`智能协同 · ${activeModule.label}`}
        subtitle="理解当前对象、串联关联上下文，并把建议动作直接带回当前工作面。"
        placeholder="输入任务、问题或希望它代为串联的对象"
      />
    </div>
  );
};

export default Layout;
