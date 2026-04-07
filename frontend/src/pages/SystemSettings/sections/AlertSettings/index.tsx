import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Bell, Zap, CheckCircle2, AlertCircle, AlertTriangle, Info, Send, Loader2 } from 'lucide-react';
import { SettingCard } from '../../components/SettingCard';
import { AdvancedToggle } from '../../components/AdvancedToggle';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { alertRuleAPI } from '@/api/v1/alertRules';
import type { AlertRule, AlertRuleCondition, AlertRuleAction } from '@/types/alertRule';

// ---------- Config Maps ----------

const severityIcons: Record<string, React.FC<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const severityColors: Record<string, string> = {
  info: 'text-accent bg-accent-muted border-accent',
  warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  critical: 'text-error bg-error-muted border-error',
};

const severityLabels: Record<string, string> = {
  info: '信息',
  warning: '警告',
  critical: '严重',
};

const ruleTypes = [
  { id: 'yolo_detection', label: 'YOLO 检测' },
  { id: 'sensor_threshold', label: '传感器阈值' },
  { id: 'stream_offline', label: '视频流离线' },
  { id: 'custom', label: '自定义' },
];

const metricOptions = [
  { id: 'temperature', label: '温度' },
  { id: 'humidity', label: '湿度' },
  { id: 'yolo_fire', label: 'YOLO 火灾' },
  { id: 'yolo_intrusion', label: 'YOLO 入侵' },
  { id: 'stream_status', label: '视频流状态' },
];

const operatorOptions = [
  { id: 'gt', label: '>' },
  { id: 'lt', label: '<' },
  { id: 'eq', label: '=' },
  { id: 'ne', label: '≠' },
  { id: 'contains', label: '包含' },
];

const notificationChannels = [
  { id: 'email', label: '邮件', icon: Bell },
  { id: 'dingtalk', label: '钉钉', icon: Bell },
  { id: 'wechat', label: '企业微信', icon: Bell },
  { id: 'webhook', label: 'Webhook', icon: Zap },
];

// ---------- Form Types ----------

interface RuleFormData {
  name: string;
  description: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldown_sec: number;
  condition: AlertRuleCondition;
  actions: AlertRuleAction[];
}

const defaultFormData: RuleFormData = {
  name: '',
  description: '',
  type: 'yolo_detection',
  severity: 'warning',
  enabled: true,
  cooldown_sec: 300,
  condition: { metric: 'temperature', operator: 'gt', threshold: 80, duration: 60 },
  actions: [],
};

// ---------- Sub-Components ----------

interface AlertRuleFormProps {
  rule?: AlertRule;
  onSave: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const AlertRuleForm: React.FC<AlertRuleFormProps> = ({ rule, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState<RuleFormData>(() => {
    if (rule) {
      return {
        name: rule.name,
        description: rule.description || '',
        type: rule.type,
        severity: rule.severity,
        enabled: rule.enabled,
        cooldown_sec: rule.cooldown_sec,
        condition: rule.conditions,
        actions: rule.actions || [],
      };
    }
    return { ...defaultFormData };
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (formData.name && formData.condition.metric) {
      void onSave(formData);
    }
  };

  const updateCondition = (patch: Partial<AlertRuleCondition>): void => {
    setFormData({ ...formData, condition: { ...formData.condition, ...patch } });
  };

  const toggleAction = (channelType: 'email' | 'dingtalk' | 'wechat' | 'webhook'): void => {
    const exists = formData.actions.some((a) => a.type === channelType);
    if (exists) {
      setFormData({ ...formData, actions: formData.actions.filter((a) => a.type !== channelType) });
    } else {
      setFormData({
        ...formData,
        actions: [...formData.actions, { type: channelType, target: '' }],
      });
    }
  };

  const updateActionTarget = (channelType: string, target: string): void => {
    setFormData({
      ...formData,
      actions: formData.actions.map((a) =>
        a.type === channelType ? { ...a, target } : a
      ),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rule Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">规则名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="例如：火灾检测告警"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="规则描述（可选）"
          rows={2}
        />
      </div>

      {/* Enable / Disable */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">启用规则</p>
          <p className="text-xs text-text-secondary">启用后将立即生效</p>
        </div>
        <Switch
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
      </div>

      {/* Rule Type */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">规则类型</label>
        <div className="grid grid-cols-2 gap-2">
          {ruleTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFormData({ ...formData, type: t.id })}
              className={cn(
                'px-3 py-2 rounded-md text-sm border transition-all',
                formData.type === t.id
                  ? 'border-accent bg-accent-muted/30 text-accent'
                  : 'border-border hover:border-border-strong bg-bg-primary text-text-secondary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">告警级别</label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(severityLabels) as Array<'info' | 'warning' | 'critical'>).map((sev) => {
            const Icon = severityIcons[sev];
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFormData({ ...formData, severity: sev })}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                  formData.severity === sev
                    ? `${severityColors[sev]} border-current`
                    : 'border-border hover:border-border-strong bg-bg-primary'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{severityLabels[sev]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditions */}
      <SettingCard title="触发条件" description="配置规则的触发参数">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">指标</label>
              <select
                value={formData.condition.metric}
                onChange={(e) => updateCondition({ metric: e.target.value })}
                className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              >
                {metricOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">操作符</label>
              <select
                value={formData.condition.operator}
                onChange={(e) => updateCondition({ operator: e.target.value as AlertRuleCondition['operator'] })}
                className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              >
                {operatorOptions.map((op) => (
                  <option key={op.id} value={op.id}>{op.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">阈值</label>
              <input
                type="number"
                value={formData.condition.threshold}
                onChange={(e) => updateCondition({ threshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">持续时间（秒）</label>
              <input
                type="number"
                value={formData.condition.duration}
                onChange={(e) => updateCondition({ duration: parseInt(e.target.value) || 0 })}
                className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              />
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Cooldown */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          冷却时间（秒）: {formData.cooldown_sec}
        </label>
        <input
          type="number"
          min={0}
          value={formData.cooldown_sec}
          onChange={(e) => setFormData({ ...formData, cooldown_sec: parseInt(e.target.value) || 0 })}
          className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary"
        />
        <p className="text-xs text-text-tertiary mt-1">同一规则在冷却时间内不会重复触发</p>
      </div>

      {/* Actions */}
      <SettingCard title="通知动作" description="选择触发告警时的通知方式">
        <div className="space-y-3">
          {notificationChannels.map((channel) => {
            const isSelected = formData.actions.some((a) => a.type === channel.id);
            const action = formData.actions.find((a) => a.type === channel.id);
            const Icon = channel.icon;
            return (
              <div key={channel.id}>
                <button
                  type="button"
                  onClick={() => toggleAction(channel.id as AlertRuleAction['type'])}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all',
                    isSelected
                      ? 'border-accent bg-accent-muted/30'
                      : 'border-border hover:border-border-strong bg-bg-primary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4', isSelected ? 'text-accent' : 'text-text-secondary')} />
                    <span className={cn('text-sm', isSelected ? 'text-text-primary font-medium' : 'text-text-secondary')}>
                      {channel.label}
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-accent" />}
                </button>
                {isSelected && (
                  <input
                    type="text"
                    value={action?.target || ''}
                    onChange={(e) => updateActionTarget(channel.id, e.target.value)}
                    placeholder={channel.id === 'email' ? '接收邮箱' : 'Webhook URL'}
                    className="mt-2 w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                )}
              </div>
            );
          })}
        </div>
      </SettingCard>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          disabled={saving}
        >
          取消
        </button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {rule ? '保存修改' : '创建规则'}
        </Button>
      </div>
    </form>
  );
};

// ---------- Main Component ----------

export const AlertSettingsSection: React.FC = () => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();
  const [testingId, setTestingId] = useState<number | null>(null);

  const fetchRules = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await alertRuleAPI.list({ page: 1, page_size: 100 });
      setRules(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load alert rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const handleCreateRule = (): void => {
    setEditingRule(undefined);
    setShowForm(true);
  };

  const handleEditRule = (rule: AlertRule): void => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDeleteRule = async (id: number): Promise<void> => {
    if (!confirm('确定要删除这条告警规则吗？')) return;
    try {
      await alertRuleAPI.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleToggle = async (id: number, enabled: boolean): Promise<void> => {
    try {
      await alertRuleAPI.toggle(id, enabled);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled } : r))
      );
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleTestRule = async (id: number): Promise<void> => {
    try {
      setTestingId(id);
      const res = await alertRuleAPI.test(id);
      alert(res.data?.success ? '测试通知已发送' : `测试失败: ${res.data?.message}`);
    } catch (err) {
      console.error('Test rule failed:', err);
      alert('测试通知发送失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveRule = async (data: RuleFormData): Promise<void> => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        conditions: JSON.stringify(data.condition),
        actions: JSON.stringify(data.actions),
        severity: data.severity,
        enabled: data.enabled,
        cooldown_sec: data.cooldown_sec,
      };

      if (editingRule) {
        await alertRuleAPI.update(editingRule.id, payload);
      } else {
        await alertRuleAPI.create(payload);
      }

      setShowForm(false);
      setEditingRule(undefined);
      void fetchRules();
    } catch (err) {
      console.error('Failed to save rule:', err);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Form View ----------
  if (showForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {editingRule ? '编辑告警规则' : '创建告警规则'}
          </h1>
          <p className="text-text-secondary">
            {editingRule ? '修改现有告警规则的配置' : '创建一条新的告警规则'}
          </p>
        </div>
        <AlertRuleForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowForm(false);
            setEditingRule(undefined);
          }}
          saving={saving}
        />
      </div>
    );
  }

  // ---------- List View ----------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">告警配置</h1>
          <p className="text-text-secondary">管理告警规则和通知策略</p>
        </div>
        <Button onClick={handleCreateRule} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          创建规则
        </Button>
      </div>

      <SettingCard title="告警规则列表" description="管理所有告警规则">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
            <span className="ml-2 text-text-secondary text-sm">加载中...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            暂无告警规则，点击右上角创建
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => {
              const SeverityIcon = severityIcons[rule.severity] || AlertTriangle;
              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-bg-primary"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      severityColors[rule.severity] || severityColors.warning
                    )}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary">{rule.name}</h4>
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          severityColors[rule.severity] || severityColors.warning
                        )}>
                          {severityLabels[rule.severity] || rule.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-text-secondary">
                          {ruleTypes.find((t) => t.id === rule.type)?.label || rule.type}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {rule.description || `冷却: ${rule.cooldown_sec}s`}
                        {rule.last_fired_at && ` · 最后触发: ${new Date(rule.last_fired_at).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleTestRule(rule.id)}
                      disabled={testingId === rule.id}
                      className="p-2 text-text-secondary hover:text-accent hover:bg-accent-muted rounded-md transition-colors"
                      title="测试通知"
                    >
                      {testingId === rule.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => void handleToggle(rule.id, checked)}
                    />
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => void handleDeleteRule(rule.id)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-error-muted rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SettingCard>

      <AdvancedToggle>
        <SettingCard title="静默管理" description="设置告警静默时间">
          <div className="text-text-secondary text-sm">
            静默管理功能即将上线...
          </div>
        </SettingCard>
      </AdvancedToggle>
    </div>
  );
};
