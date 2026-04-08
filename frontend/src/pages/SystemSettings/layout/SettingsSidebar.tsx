import { User, Bell, Zap, Mail, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SettingsSection = 
  | 'personal'
  | 'alerts'
  | 'detection'
  | 'notifications'
  | 'system';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: typeof User;
}

const navItems: NavItem[] = [
  { id: 'personal', label: '个人设置', icon: User },
  { id: 'alerts', label: '告警配置', icon: Bell },
  { id: 'detection', label: '检测设置', icon: Zap },
  { id: 'notifications', label: '通知管理', icon: Mail },
  { id: 'system', label: '系统信息', icon: Server },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <aside className="w-64 border-r border-border bg-bg-secondary shrink-0 h-full overflow-y-auto">
      <div className="p-4 border-b border-border sticky top-0 bg-bg-secondary z-10">
        <h2 className="text-lg font-semibold text-text-primary">系统设置</h2>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                isActive
                  ? 'bg-accent-muted text-accent font-medium'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
