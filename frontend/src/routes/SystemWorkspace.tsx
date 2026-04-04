import { useState } from 'react';
import { FileLock2, RefreshCw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { ContextActionStrip } from '@/components/openclaw';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import {
  useGetTenantConfigQuery,
} from '@/store/api/tenantConfigApi';
import type { TenantConfig } from '@/store/api/tenantConfigApi';
import {
  MetricTile,
  SectionHeader,
  StatusPill,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PolicyItem {
  id: string;
  title: string;
  description: string;
  value: string;
  status: '正常' | '待确认' | '需调整';
}

function mapConfigToPolicies(config: TenantConfig): PolicyItem[] {
  return [
    {
      id: 'policy-storage',
      title: '事件资料保存策略',
      description: `存储配额 ${(config.storage_quota / 1024 / 1024 / 1024).toFixed(1)} GB，已使用 ${((config.storage_used / config.storage_quota) * 100).toFixed(1)}%。`,
      value: `${(config.storage_quota / 1024 / 1024 / 1024).toFixed(1)} GB`,
      status: config.storage_used / config.storage_quota > 0.9 ? '需调整' : '正常',
    },
    {
      id: 'policy-ai',
      title: 'AI 检测配置',
      description: config.ai_enabled
        ? `AI 检测已启用，模型 ${config.ai_model || '默认'}，灵敏度 ${config.detection_sensitivity}。`
        : 'AI 检测当前未启用。',
      value: config.ai_enabled ? `${config.ai_model || '默认'} · ${config.detection_sensitivity}` : '未启用',
      status: config.ai_enabled ? '正常' : '待确认',
    },
    {
      id: 'policy-notification',
      title: '告警通知渠道',
      description: `邮件 ${config.alert_notifications.email ? '已启用' : '已关闭'}，短信 ${config.alert_notifications.sms ? '已启用' : '已关闭'}，推送 ${config.alert_notifications.push ? '已启用' : '已关闭'}。`,
      value: [
        config.alert_notifications.email && '邮件',
        config.alert_notifications.sms && '短信',
        config.alert_notifications.push && '推送',
      ].filter(Boolean).join(' / ') || '无渠道',
      status: config.alert_notifications.push ? '正常' : '待确认',
    },
    {
      id: 'policy-device',
      title: '设备配额管理',
      description: `最大 ${config.max_devices} 台，当前活跃 ${config.active_devices} 台。`,
      value: `${config.active_devices} / ${config.max_devices}`,
      status: config.active_devices >= config.max_devices ? '需调整' : '正常',
    },
    {
      id: 'policy-features',
      title: '功能模块授权',
      description: `直播 ${config.features.live_streaming ? '已启用' : '已关闭'}，云录像 ${config.features.cloud_recording ? '已启用' : '已关闭'}，AI 检测 ${config.features.ai_detection ? '已启用' : '已关闭'}，报告 ${config.features.reports ? '已启用' : '已关闭'}。`,
      value: `${Object.values(config.features).filter(Boolean).length} / ${Object.keys(config.features).length} 已启用`,
      status: Object.values(config.features).every(Boolean) ? '正常' : '待确认',
    },
  ];
}

export default function SystemWorkspace() {
  const {
    data: configResponse,
    isLoading: configLoading,
    refetch: refetchConfig,
  } = useGetTenantConfigQuery();

  const config = configResponse?.data;

  const policies: PolicyItem[] = config ? mapConfigToPolicies(config) : [];

  const [selectedId, setSelectedId] = useState<string>(policies[0]?.id ?? '');
  const selectedPolicy =
    policies.find((policy) => policy.id === selectedId) ?? policies[0] ?? null;

  if (configLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载系统配置…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <ContextActionStrip
        title="智能协同只承担治理解释与审计辅助"
        summary={
          selectedPolicy
            ? `当前聚焦 ${selectedPolicy.title}，适合解释策略边界、检查变更影响并生成审计说明。`
            : '系统管理聚焦权限、策略与 AI 配置，不扩散成冗余后台页。'
        }
        actions={[
          {
            label: '解释当前策略',
            onClick: () =>
              composeOpenClaw({
                prompt: `请解释策略"${selectedPolicy?.title ?? ''}"的当前含义。`,
                source: selectedPolicy?.title,
              }),
            tone: 'accent',
          },
          {
            label: '检查配置影响',
            onClick: () =>
              composeOpenClaw({
                prompt: `请评估策略"${selectedPolicy?.title ?? ''}"的调整影响。`,
                source: selectedPolicy?.title,
              }),
          },
          {
            label: '生成审计说明',
            onClick: () =>
              composeOpenClaw({
                prompt: `请为策略"${selectedPolicy?.title ?? ''}"生成审计说明。`,
                source: selectedPolicy?.title,
              }),
          },
        ]}
      />

      <div className="flex items-center gap-3">
        <div className="grid w-full gap-4 md:grid-cols-3">
          <MetricTile label="治理策略" value={policies.length} helper="覆盖存储、AI、通知与设备配额" />
          <MetricTile
            label="正常策略"
            value={policies.filter((policy) => policy.status === '正常').length}
            helper="当前配置保持稳定"
          />
          <MetricTile
            label="待确认"
            value={policies.filter((policy) => policy.status !== '正常').length}
            helper="需要治理确认后再开放自动执行"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => void refetchConfig()} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="min-h-0">
          <SectionHeader
            eyebrow="系统管理"
            title="治理策略"
            description="用户、权限、策略和 AI 配置统一纳入治理视角，不再做空泛总览。"
          />
          <div className="mt-4 space-y-3">
            {policies.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-border bg-bg-primary/65 p-8 text-center text-sm text-text-secondary">
                暂无策略数据，请确认租户配置已初始化。
              </div>
            ) : (
              policies.map((policy) => (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => setSelectedId(policy.id)}
                  className={cn(
                    'w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-normal',
                    selectedPolicy?.id === policy.id
                      ? 'border-accent/30 bg-accent/10'
                      : 'border-border bg-bg-primary/65 hover:bg-bg-light',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{policy.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{policy.value}</p>
                    </div>
                    <StatusPill tone={policy.status === '正常' ? 'success' : policy.status === '待确认' ? 'warning' : 'danger'}>
                      {policy.status}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{policy.description}</p>
                </button>
              ))
            )}
          </div>
        </WorkspacePanel>

        <aside className="min-h-0 flex flex-col gap-4">
          <WorkspacePanel>
            <SectionHeader
              title={selectedPolicy?.title ?? '暂无策略'}
              description={selectedPolicy?.description ?? '请选择左侧策略。'}
            />
            {selectedPolicy ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={selectedPolicy.status === '正常' ? 'success' : selectedPolicy.status === '待确认' ? 'warning' : 'danger'}>
                    {selectedPolicy.status}
                  </StatusPill>
                  <StatusPill tone="neutral">{selectedPolicy.value}</StatusPill>
                </div>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="治理说明"
              description="系统管理只保留高价值治理动作，由智能协同负责解释与审计辅助。"
            />
            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">权限边界</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  当前治理面重点覆盖用户权限、资料保留、模型工具授权和自动化执行边界。
                </p>
              </div>
              <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold text-text-primary">AI 配置</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  {config?.ai_enabled
                    ? `AI 检测已启用，灵敏度 ${config.detection_sensitivity}。复杂批量动作仍需人工确认后再执行。`
                    : 'AI 检测当前未启用。可在租户配置中开启。'}
                </p>
              </div>
              <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileLock2 className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">审计输出</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  所有策略变更建议都可以直接生成审计说明，减少手工整理治理材料的成本。
                </p>
              </div>
            </div>
          </WorkspacePanel>
        </aside>
      </div>
    </div>
  );
}
