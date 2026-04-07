import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NarrowSidebar, { NavItem } from './NarrowSidebar';
import { AppHeader } from './AppHeader';
import {
  LayoutDashboard,
  Bell,
  FolderOpen,
  Video,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { CommandBar, useCommandBar } from '../command-bar/CommandBar';
import { FloatingCopilot } from '../copilot/FloatingCopilot';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { toggleCopilot as toggleCopilotAction, setContext } from '@/store/copilotSlice';

/**
 * MainLayout - 主布局组件
 * 整合超窄侧边栏、命令面板、AI Copilot
 */

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 命令面板状态
  const { isOpen: isCommandBarOpen, close: closeCommandBar } = useCommandBar();
  const dispatch = useDispatch<AppDispatch>();
  const toggleCopilot = () => dispatch(toggleCopilotAction());

  // 导航项配置
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: '监控大屏', href: '/dashboard' },
    { id: 'alerts', icon: <Bell size={20} />, label: '告警管理', href: '/alerts', badge: 3 },
    { id: 'media', icon: <FolderOpen size={20} />, label: '媒体库', href: '/media' },
    { id: 'videos', icon: <Video size={20} />, label: '视频流', href: '/videos' },
  ];

  const bottomItems: NavItem[] = [
    { id: 'copilot', icon: <MessageSquare size={20} />, label: 'AI 助手' },
    { id: 'settings', icon: <Settings size={20} />, label: '系统设置', href: '/system' },
  ];

  // 根据当前路由确定激活项
  const getActiveId = () => {
    const path = location.pathname;
    if (path.includes('/dashboard') || path === '/') return 'dashboard';
    if (path.includes('/alerts')) return 'alerts';
    if (path.includes('/media')) return 'media';
    if (path.includes('/videos')) return 'videos';
    if (path.includes('/system') || path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  // 处理导航
  const handleNavClick = (item: { id: string; href?: string }) => {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      alerts: '/alerts',
      media: '/media',
      videos: '/videos',
      settings: '/system',
    };
    
    const path = routes[item.id];
    if (path) navigate(path);
  };

  // 更新 Copilot 上下文
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

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Narrow Sidebar */}
      <NarrowSidebar
        items={navItems}
        bottomItems={bottomItems}
        activeId={getActiveId()}
        onItemClick={handleNavClick}
      />

      {/* Main Content Area */}
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

      {/* Command Bar */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={closeCommandBar}
      />

      {/* Floating Copilot */}
      <FloatingCopilot />
    </div>
  );
};

export default MainLayout;
