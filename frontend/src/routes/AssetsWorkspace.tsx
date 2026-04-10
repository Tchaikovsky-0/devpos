import { useState, useMemo } from 'react';
import {
  Cpu,
  Radar,
  Thermometer,
  Activity,
  Gauge,
  Droplets,
  Wind,
  CloudFog,
  Search,
  Filter,
  ArrowUpDown,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import { useGetSensorsQuery } from '@/store/api/sensorsApi';
import {
  MetricTile,
  SectionHeader,
  StatusPill,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { Input } from '@/components/ui/Input';
import { AIFab, type AIFabAction } from '@/components/layout/AIFab';
import { cn } from '@/lib/utils';

interface AssetItem {
  id: string;
  name: string;
  kind: string;
  type: string;
  status: string;
  location: string;
  health: number;
  lastMaintenance: string;
  diagnosis: string;
  openIssues: number;
  lastValue?: number;
  unit?: string;
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
    type: String(sensor.type ?? 'environment'),
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
    lastValue: sensor.last_value as number,
    unit: sensor.unit as string,
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

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  temperature: Thermometer,
  humidity: Droplets,
  pressure: Gauge,
  vibration: Activity,
  gas: Wind,
  dust: CloudFog,
  environment: Cpu,
};

function DeviceTypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = typeIcons[type] || Cpu;
  return <Icon className={cn('h-5 w-5', className)} />;
}

type SortField = 'name' | 'health' | 'status' | 'location';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'online' | 'offline' | 'warning';

export default function AssetsWorkspace() {
  const { data: sensorsResponse, isLoading: sensorsLoading } = useGetSensorsQuery({ page_size: 200 });
  const assetDevices = useMemo(
    () => (sensorsResponse?.data?.items as unknown as Record<string, unknown>[])?.map(adaptSensorToAsset) ?? [],
    [sensorsResponse],
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const selectedAsset = assetDevices.find((asset) => asset.id === selectedId) ?? assetDevices[0] ?? null;

  const filteredAndSortedDevices = useMemo(() => {
    let result = [...assetDevices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (device) =>
          device.name.toLowerCase().includes(query) ||
          device.kind.toLowerCase().includes(query) ||
          device.location.toLowerCase().includes(query),
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter((device) => device.status === filterStatus);
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'health':
          comparison = a.health - b.health;
          break;
        case 'status': {
          const statusOrder = { online: 3, warning: 2, offline: 1 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        }
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [assetDevices, searchQuery, filterStatus, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
        sortField === field
          ? 'bg-accent text-text-primary'
          : 'bg-bg-surface text-text-secondary hover:text-text-primary',
      )}
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );

  const FilterButton = ({ status, label, count }: { status: FilterStatus; label: string; count: number }) => (
    <button
      type="button"
      onClick={() => setFilterStatus(status)}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
        filterStatus === status
          ? 'bg-accent text-text-primary'
          : 'bg-bg-surface text-text-secondary hover:text-text-primary',
      )}
    >
      {label}
      <span className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px]',
        filterStatus === status ? 'bg-bg-muted' : 'bg-bg-light',
      )}>
        {count}
      </span>
    </button>
  );

  if (sensorsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载设备数据…</div>
      </div>
    );
  }

  // AIFab 操作
  const aiActions: AIFabAction[] = useMemo(
    () => [
      {
        label: '诊断当前设备',
        description: selectedAsset ? selectedAsset.name : undefined,
        tone: 'accent',
        onClick: () =>
          composeOpenClaw({
            prompt: `请诊断设备"${selectedAsset?.name ?? ''}"的当前状态。`,
            source: selectedAsset?.name,
          }),
      },
      {
        label: '预测维护窗口',
        onClick: () =>
          composeOpenClaw({
            prompt: `请为设备"${selectedAsset?.name ?? ''}"预测维护窗口。`,
            source: selectedAsset?.name,
          }),
      },
      {
        label: '生成运维问答',
        onClick: () =>
          composeOpenClaw({
            prompt: `请围绕设备"${selectedAsset?.name ?? ''}"生成一组运维问答。`,
            source: selectedAsset?.name,
          }),
      },
    ],
    [selectedAsset],
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">

      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile label="设备总数" value={assetDevices.length} helper="接入系统的全部设备" />
        <MetricTile label="在线设备" value={assetDevices.filter((asset) => asset.status === 'online').length} helper="核心链路保持在线" />
        <MetricTile label="需关注" value={assetDevices.filter((asset) => asset.openIssues > 0).length} helper="建议联动任务同步处理" />
        <MetricTile label="平均健康度" value={`${Math.round(assetDevices.reduce((sum, asset) => sum + asset.health, 0) / assetDevices.length)}%`} helper="健康度越低越需优先排查" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <WorkspacePanel className="min-h-0 flex flex-col">
          <SectionHeader
            eyebrow="资产设备"
            title="设备台账"
          />

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索设备名称、类型、位置..."
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <FilterButton status="all" label="全部" count={assetDevices.length} />
              <FilterButton status="online" label="在线" count={assetDevices.filter((d) => d.status === 'online').length} />
              <FilterButton status="offline" label="离线" count={assetDevices.filter((d) => d.status === 'offline').length} />
              <FilterButton status="warning" label="告警" count={assetDevices.filter((d) => d.status === 'warning').length} />
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-text-tertiary">排序：</span>
                <SortButton field="name" label="名称" />
                <SortButton field="health" label="健康度" />
                <SortButton field="status" label="状态" />
                <SortButton field="location" label="位置" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-auto pr-1">
            {filteredAndSortedDevices.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-border bg-bg-primary/65 p-8 text-center">
                <p className="text-sm text-text-secondary">
                  {searchQuery ? '未找到匹配的设备' : '暂无设备数据'}
                </p>
              </div>
            ) : (
              filteredAndSortedDevices.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  className={cn(
                    'group w-full rounded-[24px] border px-5 py-4 text-left transition-all duration-normal',
                    selectedAsset?.id === asset.id
                      ? 'border-accent/30 bg-accent/8 shadow-[0_4px_20px_rgba(63,117,192,0.12)]'
                      : 'border-border bg-bg-primary/65 hover:border-accent/20 hover:bg-bg-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors',
                      asset.status === 'online' ? 'bg-success/10 text-success' :
                      asset.status === 'warning' ? 'bg-warning/10 text-warning' :
                      'bg-text-tertiary/10 text-text-tertiary',
                    )}>
                      <DeviceTypeIcon type={asset.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-text-primary">{asset.name}</p>
                          <p className="mt-0.5 text-sm text-text-secondary">
                            {asset.kind} · {asset.location}
                          </p>
                        </div>
                        <StatusPill tone={getStatusTone(asset.status)}>
                          {asset.status === 'online' ? '在线' : asset.status === 'warning' ? '告警' : '离线'}
                        </StatusPill>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-text-tertiary">健康度</span>
                            <span className={cn(
                              'text-sm font-semibold',
                              asset.health >= 85 ? 'text-success' :
                              asset.health >= 60 ? 'text-warning' : 'text-danger',
                            )}>
                              {asset.health}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-bg-surface">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                asset.health >= 85 ? 'bg-success' :
                                asset.health >= 60 ? 'bg-warning' : 'bg-danger',
                              )}
                              style={{ width: `${asset.health}%` }}
                            />
                          </div>
                        </div>

                        {asset.lastValue !== undefined && (
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-text-tertiary">当前读数</p>
                            <p className="text-sm font-semibold text-text-primary">
                              {asset.lastValue.toFixed(1)} {asset.unit}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </WorkspacePanel>

        <aside className="min-h-0 flex flex-col gap-4">
          <WorkspacePanel>
            <SectionHeader
              title={selectedAsset?.name ?? '暂无设备'}
              description={selectedAsset?.diagnosis ?? '请选择左侧设备。'}
            />
            {selectedAsset ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={getStatusTone(selectedAsset.status)}>
                    {selectedAsset.status === 'online' ? '在线' : selectedAsset.status === 'warning' ? '告警' : '离线'}
                  </StatusPill>
                  <StatusPill tone={getHealthTone(selectedAsset.health)}>健康度 {selectedAsset.health}%</StatusPill>
                  {selectedAsset.openIssues > 0 && (
                    <StatusPill tone="danger">待处理 {selectedAsset.openIssues}</StatusPill>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-border bg-bg-primary/65 p-3">
                    <p className="text-xs text-text-tertiary">设备类型</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">{selectedAsset.kind}</p>
                  </div>
                  <div className="rounded-[18px] border border-border bg-bg-primary/65 p-3">
                    <p className="text-xs text-text-tertiary">安装位置</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">{selectedAsset.location}</p>
                  </div>
                  <div className="rounded-[18px] border border-border bg-bg-primary/65 p-3">
                    <p className="text-xs text-text-tertiary">最近维护</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">{selectedAsset.lastMaintenance}</p>
                  </div>
                  {selectedAsset.lastValue !== undefined && (
                    <div className="rounded-[18px] border border-border bg-bg-primary/65 p-3">
                      <p className="text-xs text-text-tertiary">实时读数</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        {selectedAsset.lastValue.toFixed(1)} {selectedAsset.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="设备诊断"
              description="智能协同负责把健康指标、故障线索和维护建议整理成可执行语言。"
            />
            <div className="mt-4 space-y-4">
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

              {selectedAsset && selectedAsset.status === 'offline' && (
                <div className="rounded-[22px] border border-danger/30 bg-error-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-danger" />
                    <span className="text-sm font-semibold text-danger">紧急关注</span>
                  </div>
                  <p className="text-sm leading-6 text-danger/80">
                    该设备当前离线，可能影响监控覆盖。建议立即检查设备电源和网络连接。
                  </p>
                </div>
              )}
            </div>
          </WorkspacePanel>
        </aside>
      </div>

      {/* AI 浮动操作按钮 */}
      <AIFab actions={aiActions} />
    </div>
  );
}
