import { useDispatch, useSelector } from 'react-redux';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingCard } from '../../components/SettingCard';
import { AdvancedToggle } from '../../components/AdvancedToggle';
import { Switch } from '@/components/ui/Switch';
import type { RootState } from '@/store';
import { updatePersonalSettings } from '@/store/settingsSlice';
import { cn } from '@/lib/utils';

interface ThemeOption {
  id: 'deep' | 'balanced' | 'clear';
  label: string;
  description: string;
  preview: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'deep',
    label: '深境模式',
    description: '24/7 监控室专用，减少眼部疲劳',
    preview: 'bg-[#090C10]',
  },
  {
    id: 'balanced',
    label: '均衡模式',
    description: '日常工作的理想选择，明暗平衡',
    preview: 'bg-[#12161D]',
  },
  {
    id: 'clear',
    label: '清境模式',
    description: '明亮通透，适合演示和汇报',
    preview: 'bg-[#F8FAFC] border border-border',
  },
];

export const PersonalSettingsSection: React.FC = () => {
  const dispatch = useDispatch();
  const personalSettings = useSelector((state: RootState) => state.settings.personal);

  const handleThemeChange = (theme: 'deep' | 'balanced' | 'clear') => {
    dispatch(updatePersonalSettings({ theme }));
  };

  const handleNotificationToggle = (channel: 'email' | 'dingtalk' | 'wechat', enabled: boolean) => {
    dispatch(updatePersonalSettings({
      notifications: {
        ...personalSettings.notifications,
        [channel]: enabled,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">个人设置</h1>
        <p className="text-text-secondary">自定义您的使用偏好和外观设置</p>
      </div>

      <SettingCard 
        title="主题外观" 
        description="选择适合您工作环境的显示模式"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={cn(
                'text-left p-4 rounded-lg border-2 transition-all duration-200',
                personalSettings.theme === theme.id
                  ? 'border-accent bg-accent-muted/30'
                  : 'border-border hover:border-border-strong bg-bg-primary'
              )}
            >
              <div className={cn('w-full h-20 rounded-md mb-3', theme.preview)} />
              <h4 className="font-semibold text-text-primary mb-1">{theme.label}</h4>
              <p className="text-xs text-text-secondary">{theme.description}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          <div>
            <p className="text-sm font-medium text-text-primary">快速切换</p>
            <p className="text-xs text-text-secondary">使用侧边栏按钮快速切换主题</p>
          </div>
          <ThemeToggle />
        </div>
      </SettingCard>

      <SettingCard 
        title="通知订阅" 
        description="选择您希望接收的通知类型"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">邮件通知</p>
              <p className="text-xs text-text-secondary">接收重要告警的邮件提醒</p>
            </div>
            <Switch
              checked={personalSettings.notifications.email}
              onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">钉钉通知</p>
              <p className="text-xs text-text-secondary">接收钉钉群机器人推送</p>
            </div>
            <Switch
              checked={personalSettings.notifications.dingtalk}
              onCheckedChange={(checked) => handleNotificationToggle('dingtalk', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">企业微信通知</p>
              <p className="text-xs text-text-secondary">接收企业微信群推送</p>
            </div>
            <Switch
              checked={personalSettings.notifications.wechat}
              onCheckedChange={(checked) => handleNotificationToggle('wechat', checked)}
            />
          </div>
        </div>

        <AdvancedToggle>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">静音时段</p>
                <p className="text-xs text-text-secondary">设置不接收通知的时间段</p>
              </div>
              <button className="text-sm text-accent hover:text-accent-light">配置</button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">通知频率</p>
                <p className="text-xs text-text-secondary">限制相同告警的通知频率</p>
              </div>
              <button className="text-sm text-accent hover:text-accent-light">配置</button>
            </div>
          </div>
        </AdvancedToggle>
      </SettingCard>

      <SettingCard 
        title="语言与区域" 
        description="设置界面语言和显示格式"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">界面语言</label>
            <select
              value={personalSettings.language}
              onChange={(e) => dispatch(updatePersonalSettings({ language: e.target.value as 'zh-CN' | 'en-US' }))}
              className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </SettingCard>
    </div>
  );
};
