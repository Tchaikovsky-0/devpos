import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, RefreshCw, ScanSearch, Siren, Waves } from 'lucide-react';
import { useGetStreamsQuery } from '@/store/api/streamsApi';
import { useWebSocket } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { LayoutSwitcher } from '@/components/stream';
import { StreamDevice, StreamGrid, StreamItem, StreamList } from '@/components/stream';
import { OpenClawPanel } from '@/components/openclaw';
import { YOLODetection } from '@/components/yolo/YOLOOverlay';
import { MetaPill, PageHeader, SectionBlock } from '@/components/workspace/Workbench';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

const defaultSuggestions = [
  '显示所有离线设备',
  '过去 1 小时告警趋势',
  '3 号区域异常分析',
  '帮我查看巡检报告',
];

function toStreamDevice(stream: { id: string; name: string; type: string; status: string; location?: string }): StreamDevice {
  return {
    id: stream.id,
    name: stream.name,
    type: stream.type as StreamDevice['type'],
    status: stream.status as StreamDevice['status'],
    location: stream.location,
  };
}

function toStreamItem(stream: { id: string; name: string; type: string; status: string; url?: string; location?: string }): StreamItem {
  return {
    id: stream.id,
    name: stream.name,
    type: stream.type as StreamItem['type'],
    status: stream.status as StreamItem['status'],
    url: stream.url,
    location: stream.location,
  };
}

export function Monitor() {
  const { data: streamsData, isLoading, refetch } = useGetStreamsQuery({});
  const streams = useMemo(() => streamsData?.data?.items ?? [], [streamsData?.data]);

  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4' | 'auto'>('2x2');
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [yoloEnabled, setYoloEnabled] = useState(false);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [detections, setDetections] = useState<Record<string, YOLODetection[]>>({});
  const [openClawOpen, setOpenClawOpen] = useState(false);

  const { isConnected: wsConnected } = useWebSocket({
    autoConnect: true,
    onYOLODetection: useCallback(
      (detection: {
        stream_id: string;
        detections: Array<{ class: string; confidence: number; bbox: [number, number, number, number] }>;
      }) => {
        setDetections((previous) => ({
          ...previous,
          [detection.stream_id]: detection.detections.map((item) => ({
            class: item.class,
            class_name: item.class,
            confidence: item.confidence,
            bbox: item.bbox,
          })),
        }));
      },
      [],
    ),
  });

  const devices = useMemo(() => streams.map(toStreamDevice), [streams]);
  const streamItems = useMemo(() => streams.map(toStreamItem), [streams]);
  const onlineCount = useMemo(() => streams.filter((stream) => stream.status === 'online').length, [streams]);
  const selectedStream = useMemo(
    () => streams.find((stream) => stream.id === selectedStreamId) ?? null,
    [selectedStreamId, streams],
  );

  const handleDeviceClick = useCallback((id: string) => {
    setSelectedStreamId(id);
    setPlayingIds((previous) => new Set(previous).add(id));
  }, []);

  const handleStreamClick = useCallback((id: string) => {
    setSelectedStreamId(id);
  }, []);

  const handleTogglePlay = useCallback((id: string) => {
    setPlayingIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleFullscreen = useCallback((_id: string) => {
    void _id;
    // TODO: implement fullscreen
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpenClawOpen((previous) => !previous);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (streams.length > 0 && !selectedStreamId) {
      const firstOnline = streams.find((stream) => stream.status === 'online') || streams[0];
      if (firstOnline) {
        setSelectedStreamId(firstOnline.id);
        setPlayingIds(new Set([firstOnline.id]));
      }
    }
  }, [selectedStreamId, streams]);

  return (
    <div className="px-4 py-6 md:px-8">
      <PageHeader
        eyebrow="Operations"
        title="实时监控"
        meta={
          <>
            <MetaPill label="在线设备" value={`${onlineCount}/${streams.length}`} tone="success" />
            <MetaPill label="实时连接" value={wsConnected ? '已建立' : '未连接'} tone={wsConnected ? 'accent' : 'warning'} />
            <MetaPill label="YOLO" value={yoloEnabled ? '开启' : '关闭'} tone={yoloEnabled ? 'accent' : 'default'} />
          </>
        }
        actions={
          <>
            <LayoutSwitcher layout={layout} onLayoutChange={setLayout} />
            <Button variant={yoloEnabled ? 'primary' : 'secondary'} onClick={() => setYoloEnabled((enabled) => !enabled)}>
              <ScanSearch className="h-4 w-4" />
              {yoloEnabled ? '关闭 YOLO' : '开启 YOLO'}
            </Button>
            <Button variant="secondary" onClick={handleRefresh} loading={isLoading}>
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <section className="surface-panel overflow-hidden rounded-[26px]">
          <StreamList
            devices={devices}
            selectedId={selectedStreamId || undefined}
            onDeviceClick={handleDeviceClick}
          />
        </section>

        <section className="surface-panel overflow-hidden rounded-[26px]">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">Primary Workspace</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status={wsConnected ? 'online' : 'warning'} showLabel label={wsConnected ? '实时推送正常' : '等待连接'} />
              </div>
            </div>
          </div>
          <div className="p-5">
            <StreamGrid
              streams={streamItems}
              layout={layout}
              selectedId={selectedStreamId || undefined}
              playingIds={playingIds}
              detections={yoloEnabled ? detections : {}}
              yoloEnabled={yoloEnabled}
              onStreamClick={handleStreamClick}
              onTogglePlay={handleTogglePlay}
              onFullscreen={handleFullscreen}
            />
          </div>
        </section>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionBlock
            title="检查上下文"
            description="围绕当前选中画面给出最少但足够的诊断信息。"
          >
            {selectedStream ? (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-border bg-bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{selectedStream.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">{selectedStream.location || '未配置位置信息'}</p>
                    </div>
                    <StatusIndicator
                      status={
                        selectedStream.status === 'online'
                          ? 'online'
                          : selectedStream.status === 'offline'
                            ? 'offline'
                            : selectedStream.status === 'error'
                              ? 'alert'
                              : 'pending'
                      }
                      showLabel
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: '视频状态', value: selectedStream.status === 'online' ? '实时可用' : '待恢复' },
                    { label: 'AI 识别数', value: `${detections[selectedStream.id]?.length || 0} 条` },
                    { label: '联动建议', value: yoloEnabled ? '优先关注高危类别' : '可开启 YOLO 做快速检查' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-bg-surface px-4 py-3">
                      <span className="text-sm text-text-secondary">{item.label}</span>
                      <span className="text-sm font-medium text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-border bg-bg-surface/60 p-6 text-center">
                <p className="text-sm font-medium text-text-primary">先选择一个监控源</p>
                <p className="mt-2 text-sm text-text-secondary">右侧会显示对应的检查上下文和联动建议。</p>
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="AI 处置助手"
            description="用对话方式联动当前视频墙、告警和报告信息。"
            actions={
              <Button size="sm" variant="ghost" onClick={() => setOpenClawOpen(true)}>
                打开面板
              </Button>
            }
          >
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setOpenClawOpen(true)}
                className="flex w-full items-start gap-3 rounded-[22px] border border-border bg-bg-surface p-4 text-left transition-all duration-normal hover:border-border-emphasis hover:bg-bg-light"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">OpenClaw 协同分析</p>
                  <p className="mt-1 text-sm text-text-secondary">支持 Cmd+K 呼出，当前更适合做异常复盘和总结。</p>
                </div>
              </button>

              {defaultSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setOpenClawOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-[18px] bg-bg-surface px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  <span>{suggestion}</span>
                  <Waves className="h-4 w-4 text-text-tertiary" />
                </button>
              ))}

              <div className="rounded-[20px] bg-warning/10 px-4 py-3 text-sm text-warning">
                <div className="flex items-center gap-2">
                  <Siren className="h-4 w-4" />
                  <span>当前班次建议优先复核离线设备与高危告警。</span>
                </div>
              </div>
            </div>
          </SectionBlock>
        </div>
      </div>

      <OpenClawPanel
        isOpen={openClawOpen}
        onClose={() => setOpenClawOpen(false)}
        suggestions={defaultSuggestions}
      />
    </div>
  );
}

export default Monitor;
