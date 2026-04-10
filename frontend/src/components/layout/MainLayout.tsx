import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NarrowSidebar, { NavItem } from './NarrowSidebar';
import { AppHeader } from './AppHeader';
import {
  LayoutDashboard,
  Bell,
  FolderOpen,
  Settings,
  Bot,
} from 'lucide-react';
import { CommandBar, useCommandBar } from '../command-bar/CommandBar';
import { FloatingCopilot } from '../copilot/FloatingCopilot';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { toggleCopilot as toggleCopilotAction, setContext, openCopilot, addUserMessage, sendMessage } from '@/store/copilotSlice';
import { OPENCLAW_COMPOSE_EVENT, type OpenClawComposeDetail } from '@/components/openclaw/openclawBridge';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { isOpen: isCommandBarOpen, close: closeCommandBar } = useCommandBar();
  const dispatch = useDispatch<AppDispatch>();
  const toggleCopilot = () => dispatch(toggleCopilotAction());

  const navItems: NavItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: '监控大屏', href: '/dashboard' },
    { id: 'alerts', icon: <Bell size={20} />, label: '告警管理', href: '/alerts', badge: 3 },
    { id: 'media', icon: <FolderOpen size={20} />, label: '媒体库', href: '/media' },
  ];

  const bottomItems: NavItem[] = [
    { id: 'openclaw', icon: <Bot size={20} />, label: 'OpenClaw AI' },
    { id: 'settings', icon: <Settings size={20} />, label: '系统设置', href: '/system' },
  ];

  const getActiveId = () => {
    const path = location.pathname;
    if (path.includes('/dashboard') || path === '/') return 'dashboard';
    if (path.includes('/alerts')) return 'alerts';
    if (path.includes('/media')) return 'media';
    if (path.includes('/system') || path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const handleNavClick = (item: { id: string; href?: string }) => {
    if (item.id === 'openclaw') {
      toggleCopilot();
      return;
    }
    
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      alerts: '/alerts',
      media: '/media',
      settings: '/system',
    };
    
    const path = routes[item.id];
    if (path) navigate(path);
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      dispatch(setContext({ page: 'dashboard' }));
    } else if (path.includes('/alerts')) {
      dispatch(setContext({ page: 'alerts' }));
    } else if (path.includes('/media')) {
      dispatch(setContext({ page: 'media' }));
    } else {
      dispatch(setContext({ page: 'dashboard' }));
    }
  }, [location.pathname, dispatch]);

  // Listen for OpenClaw compose events from media library AI buttons
  useEffect(() => {
    const handleCompose = (event: Event) => {
      const detail = (event as CustomEvent<OpenClawComposeDetail>).detail;
      dispatch(openCopilot());
      dispatch(addUserMessage(detail.prompt));
      dispatch(sendMessage({ message: detail.prompt, useStream: true }));
    };
    window.addEventListener(OPENCLAW_COMPOSE_EVENT, handleCompose);
    return () => window.removeEventListener(OPENCLAW_COMPOSE_EVENT, handleCompose);
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <NarrowSidebar
        items={navItems}
        bottomItems={bottomItems}
        activeId={getActiveId()}
        onItemClick={handleNavClick}
      />

      <main className="ml-12 h-screen overflow-hidden flex flex-col">
        <AppHeader
          onOpenPalette={() => {}}
          onOpenAIPanel={() => toggleCopilot()}
        />
        <motion.div
          className="flex-1 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={closeCommandBar}
      />

      <FloatingCopilot />
    </div>
  );
};

export default MainLayout;
