import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  useGetAlertsQuery,
  useGetAlertStatisticsQuery,
  useResolveAlertMutation,
} from '@/store/api/alertsApi';
import type { AlertStatistics } from '@/types/api/alerts';
import type { AlertLevel, AlertStatus } from '@/types/api/alerts';
import { Button } from '../components/ui/Button';
import { DataCard } from '../components/ui/DataCard';
import { SearchInput } from '../components/ui/Input';
import { MetaPill, PageHeader, SectionBlock, SegmentedControl } from '../components/workspace/Workbench';
import { cn } from '@/lib/utils';

const levelConfig: Record<string, { label: string; tone: string; icon: typeof AlertOctagon }> = {
  CRIT: { label: '紧急', tone: 'text-error bg-error/10', icon: AlertOctagon },
  WARN: { label: '高危', tone: 'text-warning bg-warning/10', icon: AlertTriangle },
  INFO: { label: '提示', tone: 'text-info bg-info/10', icon: Info },
};

const statusConfig: Record<string, { label: string; tone: string }> = {
  pending: { label: '待处理', tone: 'text-error bg-error/10' },
  false_alarm: { label: '误报', tone: 'text-text-secondary bg-bg-surface' },
  resolved: { label: '已解决', tone: 'text-success bg-success/10' },
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  return `${Math.floor(diffHour / 24)} 天前`;
}

export function AlertCenter() {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // RTK Query hooks
  const {
    data: alertsResponse,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useGetAlertsQuery({
    page: 1,
    page_size: 50,
    level: filterLevel !== 'all' ? (filterLevel as AlertLevel) : undefined,
    status: filterStatus !== 'all' ? (filterStatus as AlertStatus) : undefined,
    keyword: searchQuery || undefined,
  });

  const {
    data: statsResponse,
    refetch: refetchStats,
  } = useGetAlertStatisticsQuery();

  const [resolveAlert] = useResolveAlertMutation();

  const alerts = useMemo(() => alertsResponse?.data || [], [alertsResponse]);
  const loading = alertsLoading;

  const statistics: AlertStatistics = useMemo(
    () => statsResponse?.data || { total: 0, pending: 0, critical: 0 },
    [statsResponse],
  );

  // Auto-select first alert when data loads
  useEffect(() => {
    if (alerts.length === 0) return;
    if (selectedAlertId && alerts.some((a) => String(a.id) === selectedAlertId)) return;
    setSelectedAlertId(String(alerts[0].id));
  }, [alerts, selectedAlertId]);

  const handleResolve = useCallback(
    async (id: string) => {
      try {
        await resolveAlert(id).unwrap();
        refetchAlerts();
        refetchStats();
      } catch (error) {
        console.error('Failed to resolve alert:', error);
      }
    },
    [resolveAlert, refetchAlerts, refetchStats],
  );

  const fetchData = useCallback(() => {
    refetchAlerts();
    refetchStats();
  }, [refetchAlerts, refetchStats]);

  const selectedAlert = useMemo(
    () => alerts.find((alert) => String(alert.id) === selectedAlertId) ?? alerts[0] ?? null,
    [alerts, selectedAlertId],
  );

  const stats = {
    total: statistics.total,
    pending: statistics.pending,
    critical: statistics.critical,
    resolved: statistics.total - statistics.pending,
  };

  return (
    <div className="px-4 py-6 md:px-8">
      <PageHeader
        eyebrow="Operations"
        title="告警中心"
        description="告警页不再是单纯的信息堆叠，而是围绕筛选、处置和详情复核展开的统一工作面。"
        meta={
          <>
            <MetaPill label="总告警" value={stats.total} />
            <MetaPill label="待处理" value={stats.pending} tone={stats.pending > 0 ? 'warning' : 'default'} />
            <MetaPill label="紧急告警" value={stats.critical} tone={stats.critical > 0 ? 'danger' : 'default'} />
          </>
        }
        actions={
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            刷新列表
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DataCard title="总告警数" value={stats.total} icon={<Bell className="h-5 w-5" />} />
        <DataCard title="待处理" value={stats.pending} icon={<Clock3 className="h-5 w-5" />} variant="warning" />
        <DataCard title="紧急告警" value={stats.critical} icon={<AlertOctagon className="h-5 w-5" />} variant="error" />
        <DataCard title="已解决" value={stats.resolved} icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SectionBlock
          title="告警队列"
          description="把搜索、筛选和批量操作收进一个连续工作面，不再拆成多个装饰卡片。"
          actions={
            <SegmentedControl
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待处理' },
                { value: 'resolved', label: '已解决' },
                { value: 'false_alarm', label: '误报' },
              ]}
            />
          }
        >
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
              <SearchInput
                placeholder="搜索告警类型、地点或描述"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <select
                value={filterLevel}
                onChange={(event) => setFilterLevel(event.target.value)}
                className="field-control h-10 rounded-xl px-4 text-sm outline-none"
              >
                <option value="all">全部级别</option>
                <option value="CRIT">紧急</option>
                <option value="WARN">高危</option>
                <option value="INFO">提示</option>
              </select>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-[22px] border border-dashed border-border bg-bg-surface/60 p-8 text-center text-sm text-text-secondary">
                  正在同步告警列表…
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border bg-bg-surface/60 p-8 text-center">
                  <p className="text-sm font-medium text-text-primary">当前没有匹配的告警</p>
                  <p className="mt-2 text-sm text-text-secondary">调整筛选条件后，这里会展示新的事件队列。</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const level = levelConfig[alert.level] || levelConfig.INFO;
                  const status = statusConfig[alert.status] || statusConfig.pending;
                  const LevelIcon = level.icon;
                  const isActive = String(alert.id) === String(selectedAlert?.id);

                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => setSelectedAlertId(String(alert.id))}
                      className={cn(
                        'w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-normal',
                        isActive
                          ? 'border-accent/30 bg-accent/10'
                          : 'border-border bg-bg-surface hover:border-border-emphasis hover:bg-bg-light',
                      )}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', level.tone)}>
                              <LevelIcon className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-text-primary">{alert.type}</p>
                            <span className={cn('rounded-full px-2 py-1 text-xs font-medium', level.tone)}>
                              {level.label}
                            </span>
                            <span className={cn('rounded-full px-2 py-1 text-xs font-medium', status.tone)}>
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-text-secondary">{alert.message || alert.title}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                            {alert.location && <span>{alert.location}</span>}
                            <span>{formatRelativeTime(alert.created_at)}</span>
                          </div>
                        </div>
                        {alert.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleResolve(String(alert.id));
                            }}
                          >
                            标记已处理
                          </Button>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock title="详情面板" description="选中告警后，在右侧直接完成复核和状态判断。">
          {selectedAlert ? (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-border bg-bg-surface p-4">
                <p className="text-sm font-medium text-text-primary">{selectedAlert.type}</p>
                <p className="mt-2 text-sm text-text-secondary">{selectedAlert.message || selectedAlert.title}</p>
              </div>

              {[
                { label: '事件级别', value: levelConfig[selectedAlert.level]?.label || '提示' },
                { label: '当前状态', value: statusConfig[selectedAlert.status]?.label || '待处理' },
                { label: '发生位置', value: selectedAlert.location || '未记录位置' },
                { label: '创建时间', value: new Date(selectedAlert.created_at).toLocaleString('zh-CN') },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-bg-surface px-4 py-3">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="max-w-[60%] text-right text-sm font-medium text-text-primary">{item.value}</span>
                </div>
              ))}

              <div className="rounded-[20px] bg-warning/10 px-4 py-3 text-sm text-warning">
                建议先复核现场画面，再决定是解决还是归为误报。
              </div>

              {selectedAlert.status === 'pending' && (
                <Button className="w-full" onClick={() => void handleResolve(String(selectedAlert.id))}>
                  立即处理当前告警
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-border bg-bg-surface/60 p-6 text-center">
              <p className="text-sm font-medium text-text-primary">从左侧选择一条告警</p>
              <p className="mt-2 text-sm text-text-secondary">右侧会展示当前事件的上下文信息与处置入口。</p>
            </div>
          )}
        </SectionBlock>
      </div>
    </div>
  );
}

export default AlertCenter;
