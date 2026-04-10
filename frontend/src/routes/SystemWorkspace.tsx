import { useState, useCallback } from 'react';
import {
  Bell,
  Brain,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Monitor,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  useGetTenantConfigQuery,
  useUpdateTenantConfigMutation,
  useUpdateTenantFeaturesMutation,
} from '@/store/api/tenantConfigApi';
import type { TenantConfig } from '@/store/api/tenantConfigApi';
import {
  SectionHeader,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type SensitivityLevel = 'low' | 'medium' | 'high';

const sensitivityLabels: Record<SensitivityLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const sensitivityDescriptions: Record<SensitivityLevel, string> = {
  low: '只检测明确异常，误报最少',
  medium: '平衡检测率与误报率',
  high: '尽可能多地捕获异常，可能增加误报',
};

function StorageBar({ used, quota }: { used: number; quota: number }) {
  const pct = quota > 0 ? (used / quota) * 100 : 0;
  const pctClamped = Math.min(pct, 100);
  const label = `${(used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(quota / 1024 / 1024 / 1024).toFixed(1)} GB`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className={cn('font-medium', pct > 90 ? 'text-error' : pct > 70 ? 'text-warning' : 'text-accent')}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-surface">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-normal',
            pct > 90 ? 'bg-error' : pct > 70 ? 'bg-warning' : 'bg-accent',
          )}
          style={{ width: `${pctClamped}%` }}
        />
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-border bg-bg-primary/65 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface SettingGroupProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SettingGroup({ icon, title, children }: SettingGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function AdvancedSettings({ config }: { config: TenantConfig }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-[20px] border border-dashed border-border px-4 py-3 text-left transition-colors hover:bg-bg-surface"
      >
        {open ? <ChevronDown className="h-4 w-4 text-text-tertiary" /> : <ChevronRight className="h-4 w-4 text-text-tertiary" />}
        <span className="text-sm font-medium text-text-secondary">高级设置</span>
        <span className="text-xs text-text-tertiary">租户信息、AI 模型、API 访问</span>
      </button>
      {open && (
        <div className="space-y-2 pl-2">
          <SettingRow
            label="租户名称"
            description={config.tenant_name || '未设置'}
          >
            <span className="text-xs text-text-tertiary">{config.tenant_id}</span>
          </SettingRow>
          <SettingRow
            label="AI 检测模型"
            description="当前使用的 AI 推理模型"
          >
            <span className="text-sm font-medium text-text-primary">{config.ai_model || 'yolov8n'}</span>
          </SettingRow>
          <SettingRow
            label="设备配额"
            description="最大接入设备数"
          >
            <span className="text-sm font-medium text-text-primary">{config.max_devices} 台</span>
          </SettingRow>
          <SettingRow
            label="API 访问"
            description="允许通过 API 接口访问系统数据"
          >
            <span className={cn('text-xs', config.features.api_access ? 'text-accent' : 'text-text-tertiary')}>
              {config.features.api_access ? '已启用' : '未启用'}
            </span>
          </SettingRow>
        </div>
      )}
    </div>
  );
}

export default function SystemWorkspace() {
  const {
    data: configResponse,
    isLoading: configLoading,
    refetch: refetchConfig,
  } = useGetTenantConfigQuery();

  const [updateConfig, { isLoading: isUpdating }] = useUpdateTenantConfigMutation();
  const [updateFeatures, { isLoading: isUpdatingFeatures }] = useUpdateTenantFeaturesMutation();

  const config = configResponse?.data;

  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const getPendingValue = useCallback(<K extends keyof TenantConfig>(key: K): TenantConfig[K] | undefined => {
    if (key in pendingChanges) return pendingChanges[key] as TenantConfig[K];
    return config?.[key];
  }, [pendingChanges, config]);

  const getNestedPending = useCallback(<K extends keyof TenantConfig, SK extends string>(
    key: K,
    subKey: SK,
  ): boolean => {
    const nestedKey = `${String(key)}.${subKey}`;
    if (nestedKey in pendingChanges) return pendingChanges[nestedKey] as boolean;
    const base = config?.[key] as Record<string, unknown> | undefined;
    return (base?.[subKey] as boolean) ?? false;
  }, [pendingChanges, config]);

  const setChange = useCallback((key: string, value: unknown) => {
    setPendingChanges((prev) => ({ ...prev, [key]: value }));
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaveError(null);

    try {
      const configUpdates: Record<string, unknown> = {};
      const featureUpdates: Record<string, boolean> = {};

      for (const [key, value] of Object.entries(pendingChanges)) {
        if (key.startsWith('alert_notifications.')) {
          const channel = key.split('.')[1];
          if (!configUpdates['alert_notifications']) {
            configUpdates['alert_notifications'] = { ...config.alert_notifications };
          }
          (configUpdates['alert_notifications'] as Record<string, unknown>)[channel] = value;
        } else if (key.startsWith('features.')) {
          const feature = key.split('.')[1];
          featureUpdates[feature] = value as boolean;
        } else {
          configUpdates[key] = value;
        }
      }

      if (Object.keys(configUpdates).length > 0) {
        await updateConfig(configUpdates).unwrap();
      }
      if (Object.keys(featureUpdates).length > 0) {
        await updateFeatures(featureUpdates).unwrap();
      }

      setPendingChanges({});
      toast({ title: '设置已保存', description: '所有更改已成功应用。' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存失败，请重试';
      setSaveError(message);
      toast({ title: '保存失败', description: message, variant: 'destructive' });
    }
  }, [config, pendingChanges, updateConfig, updateFeatures]);

  const aiEnabled = getPendingValue('ai_enabled') ?? config?.ai_enabled ?? false;
  const sensitivity = getPendingValue('detection_sensitivity') ?? config?.detection_sensitivity ?? 'medium';

  if (configLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载系统配置…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          eyebrow="系统管理"
          title="设置"
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void refetchConfig()} className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              onClick={() => void handleSave()}
              loading={isUpdating || isUpdatingFeatures}
              icon={<Save className="h-4 w-4" />}
            >
              保存更改
            </Button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="rounded-[20px] border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {saveError}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-8 pb-8">
          <WorkspacePanel>
            <div className="space-y-6 p-1">
              <SettingGroup
                icon={<Bell className="h-4 w-4 text-accent" />}
                title="告警通知"
              >
                <SettingRow
                  label="邮件通知"
                  description="通过邮件接收告警信息"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('alert_notifications', 'email')}
                    onCheckedChange={(v) => setChange('alert_notifications.email', v)}
                  />
                </SettingRow>
                <SettingRow
                  label="短信通知"
                  description="通过短信接收告警信息"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('alert_notifications', 'sms')}
                    onCheckedChange={(v) => setChange('alert_notifications.sms', v)}
                  />
                </SettingRow>
                <SettingRow
                  label="推送通知"
                  description="通过浏览器推送接收告警信息"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('alert_notifications', 'push')}
                    onCheckedChange={(v) => setChange('alert_notifications.push', v)}
                  />
                </SettingRow>
              </SettingGroup>

              <div className="h-px bg-border" />

              <SettingGroup
                icon={<Brain className="h-4 w-4 text-accent" />}
                title="AI 检测"
              >
                <SettingRow
                  label="AI 智能检测"
                  description="启用后将自动对视频流进行异常检测"
                >
                  <Switch
                    size="sm"
                    checked={aiEnabled}
                    onCheckedChange={(v) => setChange('ai_enabled', v)}
                  />
                </SettingRow>
                {aiEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">检测灵敏度</p>
                    </div>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as SensitivityLevel[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setChange('detection_sensitivity', level)}
                          className={cn(
                            'flex-1 rounded-[16px] border px-3 py-2.5 text-center transition-all duration-normal',
                            sensitivity === level
                              ? 'border-accent/30 bg-accent/10 text-accent'
                              : 'border-border bg-bg-primary/65 text-text-secondary hover:bg-bg-surface',
                          )}
                        >
                          <p className="text-sm font-medium">{sensitivityLabels[level]}</p>
                          <p className="mt-0.5 text-xs opacity-70">{sensitivityDescriptions[level]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </SettingGroup>

              <div className="h-px bg-border" />

              <SettingGroup
                icon={<Monitor className="h-4 w-4 text-accent" />}
                title="功能模块"
              >
                <SettingRow
                  label="实时直播"
                  description="启用视频流实时直播功能"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('features', 'live_streaming') as boolean}
                    onCheckedChange={(v) => setChange('features.live_streaming', v)}
                  />
                </SettingRow>
                <SettingRow
                  label="云录像"
                  description="启用云端录像存储功能"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('features', 'cloud_recording') as boolean}
                    onCheckedChange={(v) => setChange('features.cloud_recording', v)}
                  />
                </SettingRow>
                <SettingRow
                  label="AI 检测"
                  description="启用 AI 异常检测功能模块"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('features', 'ai_detection') as boolean}
                    onCheckedChange={(v) => setChange('features.ai_detection', v)}
                  />
                </SettingRow>
                <SettingRow
                  label="巡检报告"
                  description="启用巡检报告生成功能"
                >
                  <Switch
                    size="sm"
                    checked={getNestedPending('features', 'reports') as boolean}
                    onCheckedChange={(v) => setChange('features.reports', v)}
                  />
                </SettingRow>
              </SettingGroup>

              <div className="h-px bg-border" />

              <SettingGroup
                icon={<HardDrive className="h-4 w-4 text-accent" />}
                title="存储与设备"
              >
                {config && (
                  <SettingRow
                    label="存储使用"
                    description="当前存储空间使用情况"
                  >
                    <div className="w-40">
                      <StorageBar used={config.storage_used} quota={config.storage_quota} />
                    </div>
                  </SettingRow>
                )}
                {config && (
                  <SettingRow
                    label="设备接入"
                    description="当前已接入设备数量"
                  >
                    <span className="text-sm font-medium text-text-primary">
                      {config.active_devices} / {config.max_devices}
                    </span>
                  </SettingRow>
                )}
              </SettingGroup>

              <div className="h-px bg-border" />

              <AdvancedSettings config={config ?? ({} as TenantConfig)} />
            </div>
          </WorkspacePanel>

          <div className="flex items-center gap-2 rounded-[20px] border border-border bg-bg-primary/65 px-4 py-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs text-text-secondary">
              所有设置变更均在点击「保存更改」后生效。AI 检测灵敏度调整可能需要几分钟生效。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
