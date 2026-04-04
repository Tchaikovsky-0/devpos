import { useState } from 'react';
import { Siren, Workflow } from 'lucide-react';
import { ContextActionStrip } from '@/components/openclaw';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import {
  useGetAlertsQuery,
} from '@/store/api/alertsApi';
import {
  useGetStreamsQuery
} from '@/store/api/streamsApi';
import {
  MetricTile,
  SectionHeader,
  StatusPill,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { cn } from '@/lib/utils';

// Adapter: transform API Alert to workspace-compatible shape
interface WorkspaceAlert {
  id: string;
  title: string;
  level: string;
  status: string;
  location: string;
  createdAt: string;
  sourceStreamId: string;
  summary: string;
  recommendation: string;
}

function adaptApiAlert(alert: Record<string, unknown>): WorkspaceAlert {
  return {
    id: String(alert.id ?? ''),
    title: String(alert.title ?? ''),
    level: String(alert.level ?? '提示'),
    status: String(alert.status ?? '待处置'),
    location: String(alert.location ?? ''),
    createdAt: alert.created_at
      ? new Date(alert.created_at as string).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '',
    sourceStreamId: String(alert.stream_id ?? ''),
    summary: String(alert.description ?? ''),
    recommendation: String(alert.recommendation ?? ''),
  };
}

export default function AlertsWorkspace() {
  // Fetch alerts from API
  const { data: alertsResponse, isLoading: alertsLoading } = useGetAlertsQuery({ page_size: 100 });
  const apiAlerts: WorkspaceAlert[] = (alertsResponse?.data as unknown[] as Record<string, unknown>[])?.map(adaptApiAlert) ?? [];

  // Fetch streams for lookup
  const { data: streamsResponse } = useGetStreamsQuery({ page_size: 200 });
  const streams = (streamsResponse?.data as unknown[] as Record<string, unknown>[]) ?? [];

  const [selectedId, setSelectedId] = useState<string>('');
  const selectedAlert = apiAlerts.find((alert) => alert.id === selectedId) ?? apiAlerts[0] ?? null;

  // Find related stream
  const relatedStream = selectedAlert
    ? streams.find((s) => String(s.id) === selectedAlert.sourceStreamId)
    : null;

  // Related media - placeholder (media API not yet connected)
  const relatedMedia: Array<{ id: string; title: string; kind: string; summary: string }> = [];

  if (alertsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载告警数据…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <ContextActionStrip
        title="智能协同跟随告警处置链"
        summary={
          selectedAlert
            ? `已锁定 ${selectedAlert.title}，可直接解释根因、生成处置建议并补全交接摘要。`
            : '当前没有可用告警。'
        }
        actions={[
          {
            label: '分析根因',
            onClick: () =>
              composeOpenClaw({
                prompt: `请分析告警“${selectedAlert?.title ?? ''}”的根因。`,
                source: selectedAlert?.title,
              }),
            tone: 'accent',
          },
          {
            label: '生成处置建议',
            onClick: () =>
              composeOpenClaw({
                prompt: `请为告警“${selectedAlert?.title ?? ''}”生成一套处置建议。`,
                source: selectedAlert?.title,
              }),
          },
          {
            label: '补全交接摘要',
            onClick: () =>
              composeOpenClaw({
                prompt: `请为告警“${selectedAlert?.title ?? ''}”生成交接摘要。`,
                source: selectedAlert?.title,
              }),
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile label="待处置" value={apiAlerts.filter((alert) => alert.status === '待处置').length} helper="优先处理尚未接单的事件" />
        <MetricTile label="处理中" value={apiAlerts.filter((alert) => alert.status === '处理中').length} helper="保持与任务协同一致" />
        <MetricTile label="已归档" value={apiAlerts.filter((alert) => alert.status === '已归档').length} helper="可继续用于训练规则与复盘" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="min-h-0">
          <SectionHeader
            eyebrow="告警处置"
            title="事件流"
            description="只保留事件优先级、状态推进与处置链，不再拆成多个无关页面。"
          />
          <div className="mt-4 space-y-3">
            {apiAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => setSelectedId(alert.id)}
                className={cn(
                  'w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-normal',
                  selectedAlert?.id === alert.id
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-border bg-bg-primary/65 hover:bg-bg-light',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{alert.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {alert.location} · {alert.createdAt}
                    </p>
                  </div>
                  <StatusPill tone={alert.level === '紧急' ? 'danger' : alert.level === '高危' || alert.level === 'critical' ? 'warning' : 'neutral'}>
                    {alert.level}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{alert.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="neutral">{alert.status}</StatusPill>
                </div>
              </button>
            ))}
          </div>
        </WorkspacePanel>

        <aside className="min-h-0 flex flex-col gap-4">
          <WorkspacePanel>
            <SectionHeader
              title={selectedAlert?.title ?? '暂无告警'}
              description={selectedAlert?.recommendation ?? '请选择左侧告警。'}
            />
            {selectedAlert ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={selectedAlert.level === '紧急' || selectedAlert.level === 'critical' ? 'danger' : 'warning'}>
                    {selectedAlert.level}
                  </StatusPill>
                  <StatusPill tone="neutral">{selectedAlert.status}</StatusPill>
                  <StatusPill tone="neutral">{selectedAlert.location}</StatusPill>
                </div>
                <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-text-tertiary">处置建议</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{selectedAlert.recommendation}</p>
                </div>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="关联上下文"
              description="告警不是单点事件，要把来源画面、资料与任务链一起带进来。"
            />
            <div className="mt-4 space-y-5">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Siren className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold text-text-primary">来源画面</span>
                </div>
                <div className="rounded-[20px] border border-border bg-bg-primary/65 px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">
                    {relatedStream ? String(relatedStream.name ?? '') : '暂无来源画面'}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {relatedStream ? String(relatedStream.location ?? '') : '可继续通过智能协同补全来源线索。'}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">关联资料</span>
                </div>
                <div className="space-y-3">
                  {relatedMedia.length > 0 ? (
                    relatedMedia.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[20px] border border-border bg-bg-primary/65 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-text-primary">{item.title}</p>
                          <StatusPill tone="neutral">{item.kind}</StatusPill>
                        </div>
                        <p className="mt-2 text-xs text-text-secondary">{item.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[20px] border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
                      当前告警暂无关联资料。
                    </p>
                  )}
                </div>
              </section>
            </div>
          </WorkspacePanel>
        </aside>
      </div>
    </div>
  );
}
