/**
 * 监控大屏模块 - 方案 A「纯净监控台」
 * 
 * 核心变更：
 * - 删除 ContextActionStrip（AI操作移入视频画面右键菜单）
 * - 设备列表改为可折叠侧栏（ResizableSidebar，160-360px）
 * - 视频网格占满剩余空间，无多余内边距
 * - MetricTile 行移到视频区上方作为紧凑统计条
 * - 沉浸模式全屏接管（隐藏顶栏、侧栏、底栏）
 */

import { startTransition, useEffect, useMemo, useState } from 'react';
import { Maximize2, Minimize2, Radar, Camera, Plane, Activity, AlertTriangle } from 'lucide-react';
import { StreamGrid, type LayoutType, type StreamItem } from '@/components/stream/StreamGrid';
import { type StreamStatus } from '@/components/stream/VideoStreamPlayer';
import { useGetStreamsQuery } from '@/store/api/streamsApi';
import { useGetAlertsQuery } from '@/store/api/alertsApi';
import { useGetTasksQuery } from '@/store/api/tasksApi';
import { StatusPill } from '@/components/workspace/WorkspacePrimitives';
import { FilterPill, FilterPillGroup } from '@/components/ui/FilterPill';
import { cn } from '@/lib/utils';

/**
 * 视频流数据类型定义
 */
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
  const [filter, setFilter] = useState<CenterFilter>('all');
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [selectedId, setSelectedId] = useState<string>('');
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [immersive, setImmersive] = useState(false);

  // 数据查询
  const { data: streamsResponse, isLoading: streamsLoading } = useGetStreamsQuery({ page_size: 200 });
  const allStreams: CenterStream[] = useMemo(
    () => (streamsResponse?.data?.items as unknown as Record<string, unknown>[])?.map(adaptApiStreamToCenter) ?? [],
    [streamsResponse],
  );

  const { data: alertsResponse } = useGetAlertsQuery({ page_size: 200 });
  void alertsResponse;

  const { data: tasksResponse } = useGetTasksQuery({ page_size: 200 });
  void tasksResponse;

  // 初始化
  useEffect(() => {
    if (allStreams.length > 0 && playingIds.size === 0) {
      setPlayingIds(new Set(allStreams.slice(0, 4).map((s) => s.id)));
    }
  }, [allStreams, playingIds.size]);

  useEffect(() => {
    if (allStreams.length > 0 && !selectedId) {
      setSelectedId(allStreams[0].id);
    }
  }, [allStreams, selectedId]);

  // 筛选
  const visibleStreams = useMemo(() => {
    if (filter === 'all') return allStreams;
    return allStreams.filter((stream) => stream.category === filter);
  }, [filter, allStreams]);

  useEffect(() => {
    if (!visibleStreams.some((stream) => stream.id === selectedId) && visibleStreams[0]) {
      setSelectedId(visibleStreams[0].id);
    }
  }, [selectedId, visibleStreams]);

  // 沉浸模式 Esc 退出
  useEffect(() => {
    if (!immersive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImmersive(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [immersive]);

  const selectedStream = visibleStreams.find((stream) => stream.id === selectedId) ?? visibleStreams[0] ?? null;

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

  const onlineCount = visibleStreams.filter((stream) => stream.status === 'online').length;
  const focusCount = visibleStreams.filter((stream) => stream.signal !== '稳定').length;

  const setFocusStream = (streamId: string) => {
    startTransition(() => setSelectedId(streamId));
  };

  const handleTogglePlay = (streamId: string) => {
    setPlayingIds((previous) => {
      const next = new Set(previous);
      if (next.has(streamId)) next.delete(streamId);
      else next.add(streamId);
      return next;
    });
  };



  if (streamsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-text-tertiary">正在加载画面数据…</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 p-5 md:p-6">
      {/* 统计信息展示区域 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-bg-primary/65 px-4 py-3 transition-all duration-200 hover:shadow-soft">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-tertiary">在线画面</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
                {onlineCount}
              </p>
              <p className="mt-1 text-xs text-text-secondary">当前可监控</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60 text-success">
              <Activity className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 transition-all duration-200 hover:shadow-soft">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-tertiary">需关注</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
                {focusCount}
              </p>
              <p className="mt-1 text-xs text-text-secondary">待处置</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-primary/65 px-4 py-3 transition-all duration-200 hover:shadow-soft">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-tertiary">无人机</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
                {allStreams.filter(s => s.kind === 'drone').length}
              </p>
              <p className="mt-1 text-xs text-text-secondary">空中视角</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60 text-accent">
              <Plane className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-primary/65 px-4 py-3 transition-all duration-200 hover:shadow-soft">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-tertiary">固定监控</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
                {allStreams.filter(s => s.kind !== 'drone').length}
              </p>
              <p className="mt-1 text-xs text-text-secondary">地面视角</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary/60 text-accent">
              <Camera className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 主监控区域 */}
      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-1">
        <div className="relative min-h-0 overflow-hidden rounded-2xl border border-border bg-bg-secondary p-5">
          <div className="relative flex h-full min-h-0 flex-col">
            {/* 筛选器栏 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* 筛选按钮组：全部/无人机/固定监控 */}
              <FilterPillGroup>
                {[
                  { value: 'all', label: '全部' },
                  { value: 'drone', label: '无人机', icon: <Plane className="h-3.5 w-3.5" /> },
                  { value: 'general', label: '固定监控', icon: <Camera className="h-3.5 w-3.5" /> },
                ].map((option) => (
                  <FilterPill
                    key={option.value}
                    active={filter === option.value}
                    onClick={() => startTransition(() => setFilter(option.value as CenterFilter))}
                    icon={(option as any).icon}
                  >
                    {option.label}
                  </FilterPill>
                ))}
              </FilterPillGroup>
            </div>

            {/* 焦点画面信息栏 + 布局控制 */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg-tertiary/60 px-4 py-3 border border-border-subtle">
              {/* 当前焦点画面信息 */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    {selectedStream?.kind === 'drone' ? (
                      <Plane className="h-4 w-4 text-accent" />
                    ) : (
                      <Camera className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {selectedStream ? selectedStream.name : '暂无焦点画面'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {selectedStream
                        ? `${selectedStream.location} · ${selectedStream.lastEvent}`
                        : '请从左侧选择一条画面'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 布局控制：布局选择 + 沉浸模式按钮 */}
              <div className="flex flex-wrap items-center gap-2">
                {layoutOptions.map((option) => (
                  <FilterPill
                    key={option.value}
                    active={layout === option.value}
                    onClick={() => startTransition(() => setLayout(option.value))}
                  >
                    {option.label}
                  </FilterPill>
                ))}
                <button
                  type="button"
                  onClick={() => setImmersive(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-light to-accent text-white px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium active:translate-y-0"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>沉浸模式</span>
                </button>
              </div>
            </div>

            {/* 画面列表 + 视频网格区域 */}
            <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
              {/* 左侧画面列表 */}
              <aside className="min-h-0 space-y-2 overflow-auto pr-1">
                <div className="mb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                    监控画面
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    共 {visibleStreams.length} 路画面
                  </p>
                </div>
                {visibleStreams.map((stream) => (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() => setFocusStream(stream.id)}
                    className={cn(
                      'w-full rounded-xl px-3 py-3 text-left transition-all duration-200 ease-default border',
                      selectedStream?.id === stream.id
                        ? 'bg-accent/10 border-accent/30 shadow-soft'
                        : 'bg-bg-primary/40 border-border-subtle hover:bg-bg-tertiary/60 hover:border-border hover:shadow-soft active:scale-95',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {stream.kind === 'drone' ? (
                            <Plane className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          ) : (
                            <Camera className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          )}
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {stream.name}
                          </p>
                        </div>
                        <p className="mt-1.5 truncate text-xs text-text-secondary">
                          {stream.location}
                        </p>
                      </div>
                      <StatusPill
                        tone={
                          stream.status === 'online'
                            ? 'success'
                            : stream.status === 'warning'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {getStatusLabel(stream.status)}
                      </StatusPill>
                    </div>
                  </button>
                ))}
              </aside>

              {/* 右侧视频流网格 */}
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
        </div>
      </div>

      {/* 沉浸模式全屏视图 */}
      {immersive && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          <div className="flex h-full flex-col">
            {/* 沉浸模式顶部栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-text-primary">沉浸监控模式</p>
                  <p className="text-sm text-text-secondary">
                    {selectedStream ? `当前焦点：${selectedStream.name}` : '当前没有选中画面'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FilterPillGroup>
                  {layoutOptions.map((option) => (
                    <FilterPill
                      key={option.value}
                      active={layout === option.value}
                      onClick={() => startTransition(() => setLayout(option.value))}
                    >
                      {option.label}
                    </FilterPill>
                  ))}
                </FilterPillGroup>
                <button
                  type="button"
                  onClick={() => setImmersive(false)}
                  className="inline-flex items-center gap-2 rounded-lg bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-bg-muted border border-border-subtle"
                >
                  <Minimize2 className="h-4 w-4 text-accent" />
                  <span>退出</span>
                </button>
              </div>
            </div>

            {/* 沉浸模式视频网格 */}
            <div className="min-h-0 flex-1 p-6">
              <StreamGrid
                streams={streamGridItems}
                layout={layout}
                selectedId={selectedStream?.id}
                playingIds={playingIds}
                compact={false}
                onStreamClick={setFocusStream}
                onTogglePlay={handleTogglePlay}
                onFullscreen={setFocusStream}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
