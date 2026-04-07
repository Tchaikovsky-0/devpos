/**
 * 设计系统使用示例
 * 
 * 展示如何使用 Tech-Industrial Minimalism 设计系统的组件
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bell,
  Video,
  Settings,
  User,
  LogOut,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

// UI 组件
import {
  GlassCard,
  GlassButton,
  IconButton,
  CommandBar,
  Badge,
  Tooltip,
} from '@/components/ui';

// 布局组件
import {
  NarrowSidebar,
  MainLayout,
} from '@/components/layout/index';

// 设计令牌 (当前用于文档参考)
void import('./tokens');

// ============================================
// 示例 1: GlassCard 使用示例
// ============================================
export const GlassCardExample: React.FC = () => {
  return (
    <div className="p-6 space-y-4 bg-[#020617] min-h-screen">
      <h2 className="text-xl text-[#f8fafc] mb-4">GlassCard 示例</h2>
      
      {/* 基础卡片 */}
      <GlassCard>
        <h3 className="text-lg font-medium text-[#f8fafc]">基础卡片</h3>
        <p className="text-[#94a3b8] mt-2">这是一个基础的玻璃拟态卡片组件</p>
      </GlassCard>

      {/* 悬浮效果卡片 */}
      <GlassCard hoverable>
        <h3 className="text-lg font-medium text-[#f8fafc]">悬浮效果</h3>
        <p className="text-[#94a3b8] mt-2">鼠标悬停查看效果</p>
      </GlassCard>

      {/* 发光效果卡片 */}
      <GlassCard glow glowColor="danger">
        <h3 className="text-lg font-medium text-[#ef4444]">危险告警</h3>
        <p className="text-[#94a3b8] mt-2">带有红色发光效果的告警卡片</p>
      </GlassCard>

      {/* 不同内边距 */}
      <div className="flex gap-4">
        <GlassCard padding="sm">
          <span className="text-[#f8fafc]">小内边距</span>
        </GlassCard>
        <GlassCard padding="md">
          <span className="text-[#f8fafc]">中内边距</span>
        </GlassCard>
        <GlassCard padding="lg">
          <span className="text-[#f8fafc]">大内边距</span>
        </GlassCard>
      </div>
    </div>
  );
};

// ============================================
// 示例 2: GlassButton 使用示例
// ============================================
export const GlassButtonExample: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 space-y-6 bg-[#020617] min-h-screen">
      <h2 className="text-xl text-[#f8fafc] mb-4">GlassButton 示例</h2>
      
      {/* 变体 */}
      <div className="flex flex-wrap gap-4">
        <GlassButton variant="primary">主要按钮</GlassButton>
        <GlassButton variant="secondary">次要按钮</GlassButton>
        <GlassButton variant="ghost">幽灵按钮</GlassButton>
        <GlassButton variant="danger">危险按钮</GlassButton>
      </div>

      {/* 尺寸 */}
      <div className="flex flex-wrap items-center gap-4">
        <GlassButton size="sm">小按钮</GlassButton>
        <GlassButton size="md">中按钮</GlassButton>
        <GlassButton size="lg">大按钮</GlassButton>
      </div>

      {/* 带图标 */}
      <div className="flex flex-wrap gap-4">
        <GlassButton leftIcon={<Plus className="w-4 h-4" />}>
          新建
        </GlassButton>
        <GlassButton rightIcon={<Search className="w-4 h-4" />}>
          搜索
        </GlassButton>
      </div>

      {/* 加载状态 */}
      <div className="flex flex-wrap gap-4">
        <GlassButton 
          loading={loading} 
          onClick={() => setLoading(!loading)}
        >
          {loading ? '加载中...' : '点击加载'}
        </GlassButton>
      </div>
    </div>
  );
};

// ============================================
// 示例 3: IconButton 使用示例
// ============================================
export const IconButtonExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-[#020617] min-h-screen">
      <h2 className="text-xl text-[#f8fafc] mb-4">IconButton 示例</h2>
      
      {/* 基础图标按钮 */}
      <div className="flex gap-4">
        <IconButton tooltip="首页">
          <LayoutDashboard className="w-5 h-5" />
        </IconButton>
        <IconButton tooltip="告警" isActive>
          <Bell className="w-5 h-5" />
        </IconButton>
        <IconButton tooltip="设置">
          <Settings className="w-5 h-5" />
        </IconButton>
      </div>

      {/* 尺寸 */}
      <div className="flex items-center gap-4">
        <IconButton size="sm" tooltip="小尺寸">
          <User className="w-4 h-4" />
        </IconButton>
        <IconButton size="md" tooltip="中尺寸">
          <User className="w-5 h-5" />
        </IconButton>
        <IconButton size="lg" tooltip="大尺寸">
          <User className="w-6 h-6" />
        </IconButton>
      </div>
    </div>
  );
};

// ============================================
// 示例 4: Badge 使用示例
// ============================================
export const BadgeExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-[#020617] min-h-screen">
      <h2 className="text-xl text-[#f8fafc] mb-4">Badge 示例</h2>
      
      {/* 状态类型 */}
      <div className="flex flex-wrap gap-4">
        <Badge status="alert" pulse />
        <Badge status="warning" />
        <Badge status="success" />
        <Badge status="info" />
        <Badge status="processing" />
        <Badge status="ignored" />
      </div>

      {/* 自定义文本 */}
      <div className="flex flex-wrap gap-4">
        <Badge status="alert" text="严重告警" />
        <Badge status="success" text="运行正常" />
        <Badge status="info" text="AI分析中" />
      </div>

      {/* 带圆点 */}
      <div className="flex flex-wrap gap-4">
        <Badge status="alert" dot />
        <Badge status="success" dot text="在线" />
        <Badge status="warning" dot text="注意" />
      </div>

      {/* 尺寸 */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge status="info" size="sm" text="小" />
        <Badge status="info" size="md" text="中" />
        <Badge status="info" size="lg" text="大" />
      </div>

      {/* 呼吸动画 (告警) */}
      <div className="flex gap-4">
        <Badge status="alert" pulse text="紧急告警" />
      </div>
    </div>
  );
};

// ============================================
// 示例 5: Tooltip 使用示例
// ============================================
export const TooltipExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-[#020617] min-h-screen">
      <h2 className="text-xl text-[#f8fafc] mb-4">Tooltip 示例</h2>
      
      <div className="flex gap-8">
        <Tooltip content="上方提示" position="top">
          <GlassButton>上方</GlassButton>
        </Tooltip>
        
        <Tooltip content="下方提示" position="bottom">
          <GlassButton>下方</GlassButton>
        </Tooltip>
        
        <Tooltip content="左侧提示" position="left">
          <GlassButton>左侧</GlassButton>
        </Tooltip>
        
        <Tooltip content="右侧提示" position="right">
          <GlassButton>右侧</GlassButton>
        </Tooltip>
      </div>

      {/* 带图标的工具提示 */}
      <div className="flex gap-4">
        <Tooltip 
          content={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              <span>需要注意</span>
            </div>
          }
        >
          <IconButton>
            <AlertTriangle className="w-5 h-5" />
          </IconButton>
        </Tooltip>

        <Tooltip 
          content={
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10b981]" />
              <span>操作成功</span>
            </div>
          }
        >
          <IconButton>
            <CheckCircle className="w-5 h-5" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

// ============================================
// 示例 6: CommandBar 使用示例
// ============================================
export const CommandBarExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    {
      id: 'dashboard',
      title: '数据大屏',
      description: '查看实时监控数据',
      category: '导航',
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: 'G D',
    },
    {
      id: 'alerts',
      title: '告警管理',
      description: '查看和处理告警',
      category: '导航',
      icon: <Bell className="w-4 h-4" />,
      shortcut: 'G A',
    },
    {
      id: 'media',
      title: '媒体库',
      description: '管理视频和图片',
      category: '导航',
      icon: <Video className="w-4 h-4" />,
    },
    {
      id: 'settings',
      title: '系统设置',
      description: '配置系统参数',
      category: '设置',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'profile',
      title: '个人资料',
      description: '编辑个人信息',
      category: '设置',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'logout',
      title: '退出登录',
      description: '安全退出系统',
      category: '账户',
      icon: <LogOut className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-6 bg-[#020617] min-h-screen">
      <h2 className="text-xl text-[#f8fafc] mb-4">CommandBar 示例</h2>
      
      <GlassButton onClick={() => setIsOpen(true)}>
        打开命令面板 (⌘+K)
      </GlassButton>

      <CommandBar
        items={commands}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

// ============================================
// 示例 7: NarrowSidebar 使用示例
// ============================================
export const NarrowSidebarExample: React.FC = () => {
  const [activeId, setActiveId] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: '数据大屏' },
    { id: 'alerts', icon: <Bell className="w-5 h-5" />, label: '告警管理', badge: 3 },
    { id: 'media', icon: <Video className="w-5 h-5" />, label: '媒体库' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: '系统设置' },
  ];

  const bottomItems = [
    { id: 'profile', icon: <User className="w-5 h-5" />, label: '个人资料' },
    { id: 'logout', icon: <LogOut className="w-5 h-5" />, label: '退出登录' },
  ];

  return (
    <div className="h-screen bg-[#020617]">
      <NarrowSidebar
        items={navItems}
        bottomItems={bottomItems}
        activeId={activeId}
        onItemClick={(item) => setActiveId(item.id)}
        logo={<div className="w-8 h-8 bg-[#3b82f6] rounded-lg" />}
      />
    </div>
  );
};

// ============================================
// 示例 8: MainLayout 完整布局示例
// ============================================
export const MainLayoutExample: React.FC = () => {
  const [activeId, setActiveId] = useState('dashboard');
  const [commandOpen, setCommandOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: '数据大屏' },
    { id: 'alerts', icon: <Bell className="w-5 h-5" />, label: '告警管理', badge: 5 },
    { id: 'media', icon: <Video className="w-5 h-5" />, label: '媒体库' },
  ];

  const bottomItems = [
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: '系统设置' },
    { id: 'profile', icon: <User className="w-5 h-5" />, label: '个人资料' },
  ];

  const commands = [
    {
      id: 'dashboard',
      title: '数据大屏',
      category: '导航',
      icon: <LayoutDashboard className="w-4 h-4" />,
      onSelect: () => setActiveId('dashboard'),
    },
    {
      id: 'alerts',
      title: '告警管理',
      category: '导航',
      icon: <Bell className="w-4 h-4" />,
      onSelect: () => setActiveId('alerts'),
    },
  ];

  // 模拟页面内容
  const renderContent = () => {
    switch (activeId) {
      case 'dashboard':
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-[#f8fafc]">数据大屏</h1>
            <div className="grid grid-cols-3 gap-4">
              <GlassCard glow glowColor="danger">
                <div className="text-sm text-[#94a3b8]">未处理告警</div>
                <div className="text-3xl font-bold text-[#ef4444] mt-2">12</div>
              </GlassCard>
              <GlassCard glow glowColor="success">
                <div className="text-sm text-[#94a3b8]">正常监控点</div>
                <div className="text-3xl font-bold text-[#10b981] mt-2">48</div>
              </GlassCard>
              <GlassCard>
                <div className="text-sm text-[#94a3b8]">在线设备</div>
                <div className="text-3xl font-bold text-[#f8fafc] mt-2">156</div>
              </GlassCard>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-[#f8fafc]">告警管理</h1>
            <div className="space-y-3">
              <GlassCard glow glowColor="danger">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                    <div>
                      <div className="text-[#f8fafc] font-medium">检测到火灾</div>
                      <div className="text-sm text-[#64748b]">区域 A-03 · 2分钟前</div>
                    </div>
                  </div>
                  <Badge status="alert" pulse />
                </div>
              </GlassCard>
              <GlassCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-[#f59e0b]" />
                    <div>
                      <div className="text-[#f8fafc] font-medium">设备离线</div>
                      <div className="text-sm text-[#64748b]">摄像头 #12 · 15分钟前</div>
                    </div>
                  </div>
                  <Badge status="warning" />
                </div>
              </GlassCard>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-[#f8fafc]">页面内容</h1>
          </div>
        );
    }
  };

  return (
    // @ts-expect-error MainLayout 不接受这些 props，此示例仅侜参考
    <MainLayout
      sidebarItems={navItems}
      sidebarBottomItems={bottomItems}
      activeId={activeId}
      onSidebarItemClick={(item: { id: string }) => setActiveId(item.id)}
      logo={<div className="w-6 h-6 bg-gradient-to-br from-[#3b82f6] to-[#6366f1] rounded-md" />}
      header={
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <GlassButton 
              variant="ghost" 
              size="sm"
              leftIcon={<Search className="w-4 h-4" />}
              onClick={() => setCommandOpen(true)}
            >
              搜索...
              <kbd className="ml-2 px-1.5 py-0.5 text-xs text-[#64748b] bg-[rgba(255,255,255,0.06)] rounded">
                ⌘K
              </kbd>
            </GlassButton>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip content="告警" position="bottom">
              <IconButton>
                <Bell className="w-5 h-5" />
              </IconButton>
            </Tooltip>
            <Tooltip content="设置" position="bottom">
              <IconButton>
                <Settings className="w-5 h-5" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      }
    >
      {renderContent()}
      <CommandBar
        items={commands}
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
    </MainLayout>
  );
};

// ============================================
// 导出所有示例
// ============================================
export const DesignSystemExamples = {
  GlassCard: GlassCardExample,
  GlassButton: GlassButtonExample,
  IconButton: IconButtonExample,
  Badge: BadgeExample,
  Tooltip: TooltipExample,
  CommandBar: CommandBarExample,
  NarrowSidebar: NarrowSidebarExample,
  MainLayout: MainLayoutExample,
};

export default DesignSystemExamples;
