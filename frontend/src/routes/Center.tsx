import { startTransition, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FilePlus, Maximize2, Minimize2, Radar, Workflow } from 'lucide-react';
import { ContextActionStrip } from '@/components/openclaw';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import { StreamGrid, type LayoutType, type StreamItem } from '@/components/stream/StreamGrid';
import { type StreamStatus } from '@/components/stream/VideoStreamPlayer';
import { useGetStreamsQuery } from '@/store/api/streamsApi';
import { useGetAlertsQuery } from '@/store/api/alertsApi';
import { useGetTasksQuery } from '@/store/api/tasksApi';
import {
  useListDefectCasesQuery,
} from '@/store/api/defectCaseApi';
import {
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { cn } from '@/lib/utils';

// Extended stream shape used by Center workspace
interface CenterStream {
  id: string;
  name: string;
  kind: string;
  category: string;
  status: string;
  location: string;
  area: string;
  lastEvent: string;
  aiSummary: string;
  tags: string[];
  relatedAlertIds: string[];
  relatedMediaIds: string[];
  signal: string;
}

function adaptApiStreamToCenter(s: Record<string, unknown>): CenterStream {
  const streamType = String(s.type ?? 'camera');
  const isOnline = s.status === 'online';
  return {
    id: String(s.id ?? ''),
    name: String(s.name ?? ''),
    kind: streamType === 'drone' ? 'drone' : 'camera',
    category: streamType === 'drone' ? 'drone' : 'general',
    status: String(s.status ?? 'offline'),
    location: String(s.location ?? ''),
    area: String(s.location ?? '').split('·')[0]?.trim() ?? '',
    lastEvent: isOnline ? '刚刚' : '—',
    aiSummary: isOnline ? '画面正常，暂无异常。' : '链路未连接。',
    tags: [],
    relatedAlertIds: [],
    relatedMediaIds: [],
    signal: isOnline ? '稳定' : '处置中',
  };
}

type CenterFilter = 'all' | 'drone' | 'general';

const layoutOptions: Array<{ value: LayoutType; label: string }> = [
  { value: '1x1', label: '1画面' },
  { value: '2x2', label: '4画面' },
  { value: '3x3', label: '9画面' },
  { value: '4x4', label: '16画面' },
  { value: 'auto', label: '自适应' },
];

function getStatusLabel(status: string) {
  if (status === 'online') return '在线';
  if (status === 'warning') return '告警';
  if (status === 'offline') return '离线';
  return '连接中';
}

function mapStreamStatus(status: string): StreamStatus {
  if (status === 'warning' || status === 'error') return 'error';
  if (status === 'offline') return 'offline';
  if (status === 'connecting') return 'connecting';
  return 'online';
}

export default function Center() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CenterFilter>('all');
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [selectedId, setSelectedId] = useState<string>('');
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [immersive, setImmersive] = useState(false);

  // Fetch streams from API
  const { data: streamsResponse, isLoading: streamsLoading } = useGetStreamsQuery({ page_size: 200 });
  const allStreams: CenterStream[] = useMemo(
    () => (streamsResponse?.data as unknown[] as Record<string, unknown>[])?.map(adaptApiStreamToCenter) ?? [],
    [streamsResponse],
  );

  // Fetch alerts for lookup
  const { data: alertsResponse } = useGetAlertsQuery({ page_size: 200 });
  const allAlerts = useMemo(
    () => (alertsResponse?.data as unknown[] as Record<string, unknown>[]) ?? [],
    [alertsResponse],
  );

  // Fetch tasks
  const { data: tasksResponse } = useGetTasksQuery({ page_size: 200 });
  const allTasks = useMemo(
    () => (tasksResponse?.data as unknown[] as Record<string, unknown>[]) ?? [],
    [tasksResponse],
  );

  // Initialize playingIds when streams load
  useEffect(() => {
    if (allStreams.length > 0 && playingIds.size === 0) {
      setPlayingIds(new Set(allStreams.slice(0, 4).map((s) => s.id)));
    }
  }, [allStreams, playingIds.size]);

  // Initialize selectedId when streams load
  useEffect(() => {
    if (allStreams.length > 0 && !selectedId) {
      setSelectedId(allStreams[0].id);
    }
  }, [allStreams, selectedId]);

  const visibleStreams = useMemo(() => {
    if (filter === 'all') {
      return allStreams;
    }

    return allStreams.filter((stream) => stream.category === filter);
  }, [filter, allStreams]);

  useEffect(() => {
    if (!visibleStreams.some((stream) => stream.id === selectedId) && visibleStreams[0]) {
      setSelectedId(visibleStreams[0].id);
    }
  }, [selectedId, visibleStreams]);

  useEffect(() => {
    if (!immersive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImmersive(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [immersive]);

  const selectedStream =
    visibleStreams.find((stream) => stream.id === selectedId) ?? visibleStreams[0] ?? null;

  const streamGridItems: StreamItem[] = useMemo(
    () =>
      visibleStreams.map((stream) => ({
        id: stream.id,
        name: stream.name,
        status: mapStreamStatus(stream.status),
        type: (stream.kind === 'drone' ? 'drone' : 'camera') as StreamItem['type'],
        location: stream.location,
      })),
    [visibleStreams],
  );

  const relatedAlerts = useMemo(
    () => allAlerts.filter((a) => String(a.stream_id ?? '') === selectedStream?.id),
    [allAlerts, selectedStream],
  );
  const relatedMedia: Array<{ id: string; title: string; kind: string; folder: string; summary: string }> = [];
  const relatedTasks = useMemo(() => {
    if (!selectedStream) return [];
    return allTasks.filter(
      (t) => String(t.stream_id ?? '') === selectedStream.id,
    );
  }, [allTasks, selectedStream]);

  // Related defect cases for the selected stream - fetched from API
  const { data: relatedDefectCasesFromApi, isLoading: relatedDefectCasesLoading } = useListDefectCasesQuery(
    selectedStream ? { stream_id: selectedStream.id, page_size: 10 } : undefined,
    { skip: !selectedStream },
  );

  const relatedDefectCases = useMemo(() => {
    if (relatedDefectCasesLoading || !relatedDefectCasesFromApi) return [];
    return relatedDefectCasesFromApi;
  }, [relatedDefectCasesFromApi, relatedDefectCasesLoading]);

  const onlineCount = visibleStreams.filter((stream) => stream.status === 'online').length;
  const focusCount = visibleStreams.filter((stream) => stream.signal !== '稳定').length;
  const droneCount = visibleStreams.filter((stream) => stream.category === 'drone').length;

  const setFocusStream = (streamId: string) => {
    startTransition(() => setSelectedId(streamId));
  };

  const handleTogglePlay = (streamId: string) => {
    setPlayingIds((previous) => {
      const next = new Set(previous);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        next.add(streamId);
      }
      return next;
    });
  };

  const handleComposeOpenClaw = (prompt: string, source?: string) => {
    composeOpenClaw({ prompt, source });
  };

  if (streamsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-sm text-text-secondary">正在加载画面数据…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <ContextActionStrip
        actions={[
          {
            label: '研判当前画面',
            onClick: () =>
              handleComposeOpenClaw(
                '请先研判当前焦点画面，并解释需要优先关注的风险。',
                selectedStream?.name,
              ),
            tone: 'accent',
          },
          {
            label: '追溯关联资料',
            onClick: () =>
              handleComposeOpenClaw(
                '请把当前画面关联的录像、截图和事件说明串起来。',
                selectedStream?.name,
              ),
          },
          {
            label: '发布值班任务',
            onClick: () =>
              handleComposeOpenClaw(
                '请基于当前画面生成一条值班任务，并补全执行要点。',
                selectedStream?.name,
              ),
          },
        ]}
      />

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="relative min-h-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(63,117,192,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_22%)]" />

          <div className="relative flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'drone', label: '无人机' },
                  { value: 'general', label: '固定监控' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => startTransition(() => setFilter(option.value as CenterFilter))}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-normal',
                      filter === option.value
                        ? 'bg-accent text-white shadow-panel'
                        : 'bg-bg-surface text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>{onlineCount}/{visibleStreams.length} 在线</span>
                <span className="text-text-tertiary">·</span>
                <span>{focusCount} 路重点关注</span>
                <span className="text-text-tertiary">·</span>
                <span>{droneCount} 路无人机</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-bg-surface/50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {selectedStream ? selectedStream.name : '暂无焦点画面'}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {selectedStream
                    ? `${selectedStream.location} · ${selectedStream.lastEvent}`
                    : '请先从左侧选择一条画面。'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {layoutOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => startTransition(() => setLayout(option.value))}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
                      layout === option.value
                        ? 'bg-bg-surface text-text-primary shadow-panel'
                        : 'bg-transparent text-text-secondary hover:bg-bg-surface hover:text-text-primary',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setImmersive(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-light"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-accent" />
                  <span>沉浸</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="min-h-0 space-y-2 overflow-auto pr-1">
                {visibleStreams.map((stream) => (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() => setFocusStream(stream.id)}
                    className={cn(
                      'w-full rounded-[16px] px-3 py-2.5 text-left transition-all duration-normal',
                      selectedStream?.id === stream.id
                        ? 'bg-accent/10'
                        : 'bg-bg-surface/50 hover:bg-bg-light',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{stream.name}</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">{stream.location}</p>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                        stream.status === 'online' ? 'bg-success/10 text-success' :
                        stream.status === 'warning' ? 'bg-warning/10 text-warning' :
                        'bg-text-tertiary/10 text-text-tertiary'
                      )}>
                        {getStatusLabel(stream.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </aside>

              <div className="min-h-0">
                <StreamGrid
                  streams={streamGridItems}
                  layout={layout}
                  selectedId={selectedStream?.id}
                  playingIds={playingIds}
                  compact
                  onStreamClick={setFocusStream}
                  onTogglePlay={handleTogglePlay}
                  onFullscreen={(streamId) => {
                    setFocusStream(streamId);
                    setImmersive(true);
                  }}
                />
              </div>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col">
            {selectedStream ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-text-primary">{selectedStream.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{selectedStream.location}</p>
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                    selectedStream.status === 'online' ? 'bg-success/10 text-success' :
                    selectedStream.status === 'warning' ? 'bg-warning/10 text-warning' :
                    'bg-text-tertiary/10 text-text-tertiary'
                  )}>
                    {getStatusLabel(selectedStream.status)}
                  </span>
                </div>

                <div className="rounded-[16px] bg-bg-surface/50 p-3">
                  <p className="text-sm leading-6 text-text-secondary">{selectedStream.aiSummary}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                请先从左侧选择一个画面
              </div>
            )}

            <div className="mt-4 min-h-0 flex-1 overflow-auto space-y-4">
              {/* ===== Related Alerts ===== */}
              {selectedStream && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">关联告警</span>
                    <span className="text-xs text-text-secondary">{relatedAlerts.length} 条</span>
                  </div>
                  <div className="space-y-2">
                    {relatedAlerts.length > 0 ? (
                      relatedAlerts.map((alert) => (
                        <button
                          key={String(alert.id)}
                          type="button"
                          onClick={() =>
                            handleComposeOpenClaw(
                              `请分析告警"${String(alert.title ?? '')}"的根因，并给出处置建议。`,
                              String(alert.title ?? ''),
                            )
                          }
                          className="w-full rounded-[16px] bg-bg-surface/50 px-3 py-2.5 text-left transition-colors hover:bg-bg-light"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-primary">{String(alert.title ?? '')}</p>
                              <p className="mt-0.5 text-xs text-text-secondary">{String(alert.description ?? '')}</p>
                            </div>
                            <span className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                              alert.level === '紧急' || alert.level === 'critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                            )}>
                              {String(alert.level ?? '提示')}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-[16px] border border-dashed border-border/50 px-3 py-4 text-sm text-text-secondary">
                        当前画面暂无待跟进告警
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* ===== Related Media ===== */}
              {selectedStream && relatedMedia.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">关联资料</span>
                    <span className="text-xs text-text-secondary">{relatedMedia.length} 份</span>
                  </div>
                  <div className="space-y-2">
                    {relatedMedia.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleComposeOpenClaw(
                            `请整理资料"${item.title}"的上下文，并生成一段取证说明。`,
                            item.title,
                          )
                        }
                        className="w-full rounded-[16px] bg-bg-surface/50 px-3 py-2.5 text-left transition-colors hover:bg-bg-light"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                            <p className="mt-0.5 text-xs text-text-secondary">{item.folder}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-bg-base px-2 py-0.5 text-xs text-text-secondary">
                            {item.kind}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== Defect Case Entry Points ===== */}
              {selectedStream && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">缺陷案例</span>
                    <span className="text-xs text-text-secondary">{relatedDefectCases.length} 个</span>
                  </div>

                  {relatedDefectCases.length > 0 ? (
                    <div className="space-y-2">
                      {relatedDefectCases.map((dc) => (
                        <div
                          key={dc.id}
                          className="rounded-[16px] bg-bg-surface/50 px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-text-primary">{dc.title}</p>
                              <p className="mt-0.5 text-xs text-text-secondary">
                                {dc.evidence_count} 条证据 · {dc.duplicate_count} 条折叠
                              </p>
                            </div>
                            <span className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                              dc.severity === 'critical' ? 'bg-danger/10 text-danger' :
                              dc.severity === 'high' ? 'bg-warning/10 text-warning' :
                              'bg-text-tertiary/10 text-text-tertiary'
                            )}>
                              {dc.severity === 'critical' ? '紧急' : dc.severity === 'high' ? '高' : '中'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate('/media')}
                              className="inline-flex items-center gap-1 rounded-[12px] bg-accent/10 px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                            >
                              前往工作台 <ChevronRight className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleComposeOpenClaw(
                                  `请生成案例「${dc.title}」的报告草稿。`,
                                  dc.title,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-[12px] bg-bg-surface px-2 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-bg-light"
                            >
                              <FilePlus className="h-3 w-3" /> 生成草稿
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-2 space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleComposeOpenClaw(
                          selectedStream
                            ? `请基于当前画面"${selectedStream.name}"的异常发现，创建一个候选缺陷案例。`
                            : '请基于当前画面创建一个候选缺陷案例。',
                          selectedStream?.name,
                        )
                      }
                      className="flex w-full items-center gap-2 rounded-[14px] bg-accent/8 px-3 py-2 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                    >
                      <FilePlus className="h-4 w-4" />
                      转为缺陷案例
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/media')}
                      className="flex w-full items-center gap-2 rounded-[14px] bg-bg-surface/50 px-3 py-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-light"
                    >
                      <Workflow className="h-4 w-4 text-text-secondary" />
                      送去工作台研判
                    </button>
                  </div>
                </section>
              )}

              {/* ===== Tasks ===== */}
              {selectedStream && relatedTasks.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">执行任务</span>
                    <span className="text-xs text-text-secondary">{relatedTasks.length} 项</span>
                  </div>
                  <div className="space-y-2">
                    {relatedTasks.map((task) => (
                      <div
                        key={String(task.id)}
                        className="rounded-[16px] bg-bg-surface/50 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">{String(task.title ?? '')}</p>
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {String(task.assignee ?? '')} · 截止 {task.due_date ? new Date(task.due_date as string).toLocaleDateString('zh-CN') : '—'}
                            </p>
                          </div>
                          <span className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                            task.priority === '紧急' || task.priority === 'P0' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                          )}>
                            {String(task.priority ?? '中')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </WorkspacePanel>
      </div>

      {immersive ? (
        <div className="fixed inset-3 z-40 rounded-[32px] border border-border bg-bg-primary/98 p-4 shadow-panel backdrop-blur-xl md:inset-6 md:p-6">
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-text-primary">沉浸模式</p>
                  <p className="text-sm text-text-secondary">
                    {selectedStream ? `当前焦点：${selectedStream.name}` : '当前没有选中画面'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImmersive(false)}
                className="inline-flex items-center gap-2 rounded-full bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-light"
              >
                <Minimize2 className="h-4 w-4 text-accent" />
                <span>退出沉浸模式</span>
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <StreamGrid
                streams={streamGridItems}
                layout={layout}
                selectedId={selectedStream?.id}
                playingIds={playingIds}
                compact
                onStreamClick={setFocusStream}
                onTogglePlay={handleTogglePlay}
                onFullscreen={setFocusStream}
                className="h-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
