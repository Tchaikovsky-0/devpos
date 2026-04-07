import { useState } from 'react';
import { Mail, MessageSquare, Smartphone, Globe, Plus, Edit, Trash2, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingCard } from '../../components/SettingCard';
import { AdvancedToggle } from '../../components/AdvancedToggle';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { NotificationChannel } from '@/types/settings';

const mockChannels: NotificationChannel[] = [
  {
    id: '1',
    type: 'email',
    name: '企业邮件',
    enabled: true,
    config: {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      sender: 'alerts@xunjianbao.com'
    }
  },
  {
    id: '2',
    type: 'dingtalk',
    name: '钉钉群机器人',
    enabled: true,
    config: {
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
      secret: 'SECxxx'
    }
  },
  {
    id: '3',
    type: 'wechat',
    name: '企业微信群',
    enabled: false,
    config: {
      webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx'
    }
  },
  {
    id: '4',
    type: 'webhook',
    name: '自定义Webhook',
    enabled: false,
    config: {
      url: 'https://api.example.com/alerts',
      method: 'POST',
      headers: {}
    }
  }
];

const channelTypeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-5 h-5" />,
  dingtalk: <MessageSquare className="w-5 h-5" />,
  wechat: <Smartphone className="w-5 h-5" />,
  webhook: <Globe className="w-5 h-5" />
};

const channelTypeLabels: Record<string, string> = {
  email: '邮件',
  dingtalk: '钉钉',
  wechat: '企业微信',
  webhook: 'Webhook'
};

const channelTypeColors: Record<string, string> = {
  email: 'bg-accent-muted text-accent',
  dingtalk: 'bg-accent text-text-primary',
  wechat: 'bg-success text-text-primary',
  webhook: 'bg-accent-muted text-accent-soft'
};

export const NotificationSettingsSection: React.FC = () => {
  const [channels, setChannels] = useState<NotificationChannel[]>(mockChannels);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [formData, setFormData] = useState<Partial<NotificationChannel>>({
    name: '',
    type: 'email',
    enabled: true,
    config: {}
  });

  const handleToggleChannel = (id: string, enabled: boolean) => {
    const updatedChannels = channels.map(channel =>
      channel.id === id ? { ...channel, enabled } : channel
    );
    setChannels(updatedChannels);
  };

  const handleEditChannel = (channel: NotificationChannel) => {
    setEditingChannel(channel);
    setFormData(channel);
    setShowCreateForm(true);
  };

  const handleDeleteChannel = (id: string) => {
    setChannels(channels.filter(channel => channel.id !== id));
  };

  const handleTestChannel = (channel: NotificationChannel) => {
    alert(`正在测试 ${channel.name} 通知渠道...`);
  };

  const handleSaveChannel = () => {
    if (editingChannel) {
      const updatedChannels = channels.map(channel =>
        channel.id === editingChannel.id ? { ...channel, ...formData } as NotificationChannel : channel
      );
      setChannels(updatedChannels);
    } else {
      const newChannel: NotificationChannel = {
        id: Date.now().toString(),
        ...formData
      } as NotificationChannel;
      setChannels([...channels, newChannel]);
    }
    setShowCreateForm(false);
    setEditingChannel(null);
    setFormData({
      name: '',
      type: 'email',
      enabled: true,
      config: {}
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">通知管理</h1>
          <p className="text-text-secondary">配置通知渠道和模板</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加渠道
        </Button>
      </div>

      {showCreateForm && (
        <SettingCard title={editingChannel ? '编辑通知渠道' : '添加通知渠道'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">渠道名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：运维告警群"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">渠道类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationChannel['type'] })}
                  className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="email">邮件</option>
                  <option value="dingtalk">钉钉</option>
                  <option value="wechat">企业微信</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm font-medium text-text-primary">启用渠道</p>
                  <p className="text-xs text-text-secondary">立即启用此通知渠道</p>
                </div>
                <Switch
                  checked={formData.enabled ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>
            </div>

            {formData.type === 'email' && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">SMTP 服务器</label>
                  <Input
                    placeholder="smtp.example.com"
                    value={formData.config?.smtpHost as string || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config!, smtpHost: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">端口</label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={formData.config?.smtpPort as number || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config!, smtpPort: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">发件人</label>
                    <Input
                      placeholder="alerts@example.com"
                      value={formData.config?.sender as string || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config!, sender: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {(formData.type === 'dingtalk' || formData.type === 'wechat' || formData.type === 'webhook') && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Webhook URL</label>
                  <Input
                    placeholder="https://..."
                    value={(formData.config?.webhookUrl || formData.config?.url || '') as string}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { 
                        ...formData.config!, 
                        webhookUrl: e.target.value,
                        url: e.target.value
                      }
                    })}
                  />
                </div>
                {formData.type === 'dingtalk' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">加签密钥 (可选)</label>
                    <Input
                      placeholder="SECxxx"
                      value={formData.config?.secret as string || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config!, secret: e.target.value }
                      })}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => {
                setShowCreateForm(false);
                setEditingChannel(null);
              }}>
                取消
              </Button>
              <Button onClick={handleSaveChannel}>
                {editingChannel ? '更新渠道' : '添加渠道'}
              </Button>
            </div>
          </div>
        </SettingCard>
      )}

      <SettingCard title="通知渠道列表">
        <div className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-4 bg-bg-primary rounded-lg border border-border"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  channelTypeColors[channel.type]
                )}>
                  {channelTypeIcons[channel.type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-text-primary">{channel.name}</h4>
                    <Badge className={channelTypeColors[channel.type]}>
                      {channelTypeLabels[channel.type]}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {channel.enabled ? '已启用' : '已禁用'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTestChannel(channel)}
                  title="测试通知"
                >
                  <TestTube className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditChannel(channel)}
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteChannel(channel.id)}
                  title="删除"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </Button>
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={(checked) => handleToggleChannel(channel.id, checked)}
                />
              </div>
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard title="通知模板">
        <div className="space-y-4">
          <div className="p-4 bg-bg-primary rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-text-primary">火灾告警模板</h4>
              <Badge variant="default">默认</Badge>
            </div>
            <p className="text-sm text-text-secondary">
              🔥 【火灾告警】{'<location>'} 检测到火灾，置信度 {'<confidence>'}%，请立即处理！
            </p>
            <Button variant="ghost" size="sm" className="mt-2">
              编辑模板
            </Button>
          </div>

          <div className="p-4 bg-bg-primary rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-text-primary">入侵告警模板</h4>
              <Badge variant="default">默认</Badge>
            </div>
            <p className="text-sm text-text-secondary">
              ⚠️ 【入侵告警】{'<location>'} 检测到人员入侵，请查看实时画面！
            </p>
            <Button variant="ghost" size="sm" className="mt-2">
              编辑模板
            </Button>
          </div>

          <Button variant="secondary" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            创建新模板
          </Button>
        </div>
      </SettingCard>

      <AdvancedToggle>
        <SettingCard title="发送频率限制">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">相同告警去重</p>
                <p className="text-xs text-text-secondary">
                  相同告警在指定时间内只发送一次
                </p>
              </div>
              <Switch checked defaultChecked />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">去重时间窗口 (分钟)</label>
              <Input type="number" defaultValue={5} min={1} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">每日发送上限</p>
                <p className="text-xs text-text-secondary">
                  限制单个渠道每日最多发送的通知数量
                </p>
              </div>
              <Switch checked={false} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">每日最大通知数</label>
              <Input type="number" defaultValue={100} min={1} />
            </div>
          </div>
        </SettingCard>
      </AdvancedToggle>
    </div>
  );
};
