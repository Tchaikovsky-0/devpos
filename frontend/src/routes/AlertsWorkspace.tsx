import { useMemo, useState } from 'react';
import { Siren, Workflow } from 'lucide-react';
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
  ListItem,
  DetailPanel,
} from '@/components/workspace/WorkspacePrimitives';
import { FilterPill, FilterPillGroup } from '@/components/ui/FilterPill';
import { AIFab, type AIFabAction } from '@/components/layout/index';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverLift,
  TapScale,
} from '@/components/motion';

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
  const { data: alertsResponse, isLoading: alertsLoading } = useGetAlertsQuery({ page_size: 100 });
  const apiAlerts: WorkspaceAlert[] = ((alertsResponse?.data as { items: Record<string, unknown>[]; total: number; page: number; page_size: number } | undefined)?.items ?? [])?.map(adaptApiAlert) ?? [];

  const { data: streamsResponse } = useGetStreamsQuery({ page_size: 200 });
  const streams = (streamsResponse?.data?.items as unknown as Record<string, unknown>[]) ?? [];

  const [selectedId, setSelectedId] = useState<string>('');
  const selectedAlert = apiAlerts.find((alert) => alert.id === selectedId) ?? apiAlerts[0] ?? null;

  const relatedStream = selectedAlert
    ? streams.find((s) => String(s.id) === selectedAlert.sourceStreamId)
    : null;

  const relatedMedia: Array<{ id: string; title: string; kind: string; summary: string }> =
    selectedAlert?.summary
      ? [
          {
            id: `alert-${selectedAlert.id}`,
            title: '告警描述',
            kind: '告警详情',
            summary: selectedAlert.summary,
          },
        ]
      : [];

  const aiActions: AIFabAction[] = useMemo(
    () => [
      {
        label: '分析根因',
        description: selectedAlert ? `告警：${selectedAlert.title}` : undefined,
        tone: 'accent',
        onClick: () =>
          composeOpenClaw({
            prompt: `请分析告警"${selectedAlert?.title ?? ''}"的根因。`,
            source: selectedAlert?.title,
          }),
      },
      {
        label: '生成处置建议',
        onClick: () =>
          composeOpenClaw({
            prompt: `请为告警"${selectedAlert?.title ?? ''}"生成一套处置建议。`,
            source: selectedAlert?.title,
          }),
      },
      {
        label: '补全交接摘要',
        onClick: () =>
          composeOpenClaw({
            prompt: `请为告警"${selectedAlert?.title ?? ''}"生成交接摘要。`,
            source: selectedAlert?.title,
          }),
      },
    ],
    [selectedAlert],
  );

  if (alertsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载告警数据…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <FadeInUp>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile label="待处置" value={apiAlerts.filter((alert) => alert.status === '待处置').length} helper="优先处理尚未接单的事件" />
          <MetricTile label="处理中" value={apiAlerts.filter((alert) => alert.status === '处理中').length} helper="保持与任务协同一致" />
          <MetricTile label="已归档" value={apiAlerts.filter((alert) => alert.status === '已归档').length} helper="可继续用于训练规则与复盘" />
        </div>
      </FadeInUp>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="min-h-0">
          <SectionHeader
            eyebrow="告警处置"
            title="事件流"
          />
          <div className="mt-4 space-y-3">
            <StaggerContainer>
              {apiAlerts.map((alert) => (
                <StaggerItem key={alert.id}>
                  <HoverLift>
                    <TapScale>
                      <ListItem
                        selected={selectedAlert?.id === alert.id}
                        onClick={() => setSelectedId(alert.id)}
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
                      </ListItem>
                    </TapScale>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
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
                <FadeInUp delay={0.1}>
                  <FilterPillGroup>
                    <FilterPill active>
                      {selectedAlert.level}
                    </FilterPill>
                    <FilterPill>
                      {selectedAlert.status}
                    </FilterPill>
                    <FilterPill>
                      {selectedAlert.location}
                    </FilterPill>
                  </FilterPillGroup>
                </FadeInUp>
                <FadeInUp delay={0.2}>
                  <DetailPanel title="处置建议">
                    <p className="text-sm leading-6 text-text-secondary">{selectedAlert.recommendation}</p>
                  </DetailPanel>
                </FadeInUp>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="关联上下文"
              description="告警不是单点事件，要把来源画面、资料与任务链一起带进来。"
            />
            <div className="mt-4 space-y-5">
              <FadeInUp delay={0.15}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Siren className="h-4 w-4 text-warning" />
                    <span className="text-sm font-semibold text-text-primary">来源画面</span>
                  </div>
                  <DetailPanel>
                    <p className="text-sm font-medium text-text-primary">
                      {relatedStream ? String(relatedStream.name ?? '') : '暂无来源画面'}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {relatedStream ? String(relatedStream.location ?? '') : '可继续通过智能协同补全来源线索。'}
                    </p>
                  </DetailPanel>
                </section>
              </FadeInUp>

              <FadeInUp delay={0.25}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">关联资料</span>
                  </div>
                  <div className="space-y-3">
                    {relatedMedia.length > 0 ? (
                      relatedMedia.map((item) => (
                        <DetailPanel key={item.id}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-text-primary">{item.title}</p>
                            <StatusPill tone="neutral">{item.kind}</StatusPill>
                          </div>
                          <p className="mt-2 text-xs text-text-secondary">{item.summary}</p>
                        </DetailPanel>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
                        当前告警暂无关联资料。
                      </p>
                    )}
                  </div>
                </section>
              </FadeInUp>
            </div>
          </WorkspacePanel>
        </aside>
      </div>

      <AIFab actions={aiActions} />
    </div>
  );
}
