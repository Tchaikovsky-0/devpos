import { useState } from 'react';
import { Cpu, Radar } from 'lucide-react';
import { ContextActionStrip } from '@/components/openclaw';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import { useGetSensorsQuery } from '@/store/api/sensorsApi';
import {
  MetricTile,
  SectionHeader,
  StatusPill,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { cn } from '@/lib/utils';

interface AssetItem {
  id: string;
  name: string;
  kind: string;
  status: string;
  location: string;
  health: number;
  lastMaintenance: string;
  diagnosis: string;
  openIssues: number;
}

function adaptSensorToAsset(sensor: Record<string, unknown>): AssetItem {
  const isOnline = sensor.status === 'online';
  const lastValue = Number(sensor.last_value ?? 0);
  const maxThreshold = Number(sensor.max_threshold ?? 100);
  const health = isOnline ? Math.max(30, Math.min(100, Math.round((1 - lastValue / maxThreshold) * 100))) : 30;
  return {
    id: String(sensor.id ?? ''),
    name: String(sensor.name ?? ''),
    kind: String(sensor.type ?? '环境传感'),
    status: String(sensor.status ?? 'offline'),
    location: String(sensor.location ?? ''),
    health,
    lastMaintenance: sensor.updated_at
      ? `${Math.round((Date.now() - new Date(sensor.updated_at as string).getTime()) / 86400000)} 天前`
      : '—',
    diagnosis: isOnline
      ? `传感数据平稳，${String(sensor.unit ?? '')}读数正常。`
      : '设备离线，建议尽快排查。',
    openIssues: isOnline ? 0 : 1,
  };
}

function getHealthTone(health: number) {
  if (health >= 85) return 'success';
  if (health >= 60) return 'warning';
  return 'danger';
}

function getStatusTone(status: string) {
  if (status === 'online') return 'success';
  if (status === 'warning') return 'warning';
  return status === 'offline' ? 'danger' : 'neutral';
}

export default function AssetsWorkspace() {
  const { data: sensorsResponse, isLoading: sensorsLoading } = useGetSensorsQuery({ page_size: 200 });
  const assetDevices: AssetItem[] = (sensorsResponse?.data as unknown[] as Record<string, unknown>[])?.map(adaptSensorToAsset) ?? [];

  const [selectedId, setSelectedId] = useState<string>('');
  const selectedAsset = assetDevices.find((asset) => asset.id === selectedId) ?? assetDevices[0] ?? null;

  if (sensorsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载设备数据…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <ContextActionStrip
        title="智能协同跟随资产设备"
        summary={
          selectedAsset
            ? `已聚焦 ${selectedAsset.name}，可以直接解释健康度、预测维护窗口并生成运维问答。`
            : '当前没有可用资产。'
        }
        actions={[
          {
            label: '诊断当前设备',
            onClick: () =>
              composeOpenClaw({
                prompt: `请诊断设备“${selectedAsset?.name ?? ''}”的当前状态。`,
                source: selectedAsset?.name,
              }),
            tone: 'accent',
          },
          {
            label: '预测维护窗口',
            onClick: () =>
              composeOpenClaw({
                prompt: `请为设备“${selectedAsset?.name ?? ''}”预测维护窗口。`,
                source: selectedAsset?.name,
              }),
          },
          {
            label: '生成运维问答',
            onClick: () =>
              composeOpenClaw({
                prompt: `请围绕设备“${selectedAsset?.name ?? ''}”生成一组运维问答。`,
                source: selectedAsset?.name,
              }),
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="在线设备" value={assetDevices.filter((asset) => asset.status === 'online').length} helper="核心链路保持在线" />
        <MetricTile label="需关注设备" value={assetDevices.filter((asset) => asset.openIssues > 0).length} helper="建议联动任务与告警同步处理" />
        <MetricTile label="平均健康度" value={`${Math.round(assetDevices.reduce((sum, asset) => sum + asset.health, 0) / assetDevices.length)}%`} helper="健康度越低，越需要优先排查" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="min-h-0">
          <SectionHeader
            eyebrow="资产设备"
            title="设备台账"
            description="设备台账、健康度与诊断建议统一落在同一工作面，避免配置与监控分离。"
          />
          <div className="mt-4 space-y-3">
            {assetDevices.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedId(asset.id)}
                className={cn(
                  'w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-normal',
                  selectedAsset?.id === asset.id
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-border bg-bg-primary/65 hover:bg-bg-light',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{asset.name}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {asset.kind} · {asset.location}
                    </p>
                  </div>
                  <StatusPill tone={getStatusTone(asset.status)}>
                    {asset.status === 'online' ? '在线' : asset.status === 'warning' ? '告警' : '离线'}
                  </StatusPill>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={getHealthTone(asset.health)}>健康度 {asset.health}%</StatusPill>
                  <StatusPill tone="neutral">待处理 {asset.openIssues}</StatusPill>
                </div>
              </button>
            ))}
          </div>
        </WorkspacePanel>

        <aside className="min-h-0 flex flex-col gap-4">
          <WorkspacePanel>
            <SectionHeader
              title={selectedAsset?.name ?? '暂无设备'}
              description={selectedAsset?.diagnosis ?? '请选择左侧设备。'}
            />
            {selectedAsset ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={getStatusTone(selectedAsset.status)}>
                    {selectedAsset.status === 'online' ? '在线' : selectedAsset.status === 'warning' ? '告警' : '离线'}
                  </StatusPill>
                  <StatusPill tone={getHealthTone(selectedAsset.health)}>健康度 {selectedAsset.health}%</StatusPill>
                </div>
                <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-text-tertiary">最近维护</p>
                  <p className="mt-2 text-sm text-text-primary">{selectedAsset.lastMaintenance}</p>
                </div>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="设备诊断链"
              description="智能协同负责把健康指标、故障线索和维护建议整理成可执行语言。"
            />
            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">诊断摘要</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  {selectedAsset?.diagnosis ?? '请选择设备查看诊断摘要。'}
                </p>
              </div>
              <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Radar className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold text-text-primary">维护建议</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  {selectedAsset
                    ? `建议在 ${selectedAsset.lastMaintenance} 之后的下一维护窗口执行复核，并同步检查待处理问题。`
                    : '请选择设备查看维护建议。'}
                </p>
              </div>
            </div>
          </WorkspacePanel>
        </aside>
      </div>
    </div>
  );
}
