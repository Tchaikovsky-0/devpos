import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { YOLODetection } from '@/components/yolo/YOLOOverlay';
import { VideoStreamPlayer, StreamStatus } from './VideoStreamPlayer';
import { Plane, Camera } from 'lucide-react';

export type LayoutType = '1x1' | '2x2' | '3x3' | '4x4' | 'auto';

export interface StreamItem {
  id: string;
  name: string;
  url?: string;
  status: StreamStatus;
  type?: 'drone' | 'camera' | 'sensor';
  location?: string;
}

interface StreamGridProps {
  streams: StreamItem[];
  layout: LayoutType;
  selectedId?: string;
  playingIds?: Set<string>;
  compact?: boolean;
  detections?: Record<string, YOLODetection[]>;
  yoloEnabled?: boolean;
  onStreamClick?: (id: string) => void;
  onTogglePlay?: (id: string) => void;
  onFullscreen?: (id: string) => void;
  className?: string;
}

const layoutConfig: Record<LayoutType, { cols: number; maxItems: number }> = {
  '1x1': { cols: 1, maxItems: 1 },
  '2x2': { cols: 2, maxItems: 4 },
  '3x3': { cols: 3, maxItems: 9 },
  '4x4': { cols: 4, maxItems: 16 },
  auto: { cols: 4, maxItems: 20 },
};

export const StreamGrid: React.FC<StreamGridProps> = memo(
  ({
    streams,
    layout,
    selectedId,
    playingIds,
    compact = false,
    detections = {},
    yoloEnabled = false,
    onStreamClick,
    onTogglePlay,
    onFullscreen,
    className,
  }) => {
    const config = layoutConfig[layout];

    const visibleStreams = useMemo(() => streams.slice(0, config.maxItems), [config.maxItems, streams]);
    const featuredStreams = useMemo(
      () => visibleStreams.filter((stream) => stream.type === 'drone'),
      [visibleStreams],
    );
    const gridStreams = useMemo(
      () => visibleStreams.filter((stream) => stream.type !== 'drone'),
      [visibleStreams],
    );

    if (visibleStreams.length === 0) {
      return (
        <div className={cn('flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-bg-hover', className)}>
          <div className="text-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-hover mx-auto mb-3">
              <Camera className="h-6 w-6 text-text-tertiary" />
            </div>
            <p className="text-lg font-semibold tracking-[-0.03em] text-text-primary">暂无视频流</p>
            <p className="mt-2 text-sm text-text-secondary">检查设备链路后，视频墙会自动恢复。</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(compact ? 'space-y-1' : 'space-y-1 h-full flex flex-col', className)}>
        {featuredStreams.length > 0 && (
          <section className={compact ? '' : 'flex-shrink-0'}>
            <div className={cn('flex items-center justify-between', compact ? 'mb-3' : 'mb-4')}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                  <Plane className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">无人机画面</p>
                  {!compact ? (
                    <p className="mt-1 text-sm text-text-secondary">优先保留空域与巡线视角，作为现场态势锚点。</p>
                  ) : null}
                </div>
              </div>
              <span className="rounded-full bg-bg-tertiary/60 px-3 py-1 text-xs font-medium text-text-secondary border border-border-subtle">
                {featuredStreams.length} 路
              </span>
            </div>
            <div className="grid gap-[1px] bg-bg-hover border border-border rounded-lg overflow-hidden md:grid-cols-2">
              {featuredStreams.map((stream) => (
                <div key={stream.id} className="animate-in fade-in zoom-in-95 duration-300">
                  <StreamCell
                    stream={stream}
                    isSelected={selectedId === stream.id}
                    isPlaying={playingIds?.has(stream.id) ?? false}
                    detections={detections[stream.id] || []}
                    yoloEnabled={yoloEnabled}
                    onClick={onStreamClick}
                    onTogglePlay={onTogglePlay}
                    onFullscreen={onFullscreen}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {gridStreams.length > 0 && (
          <section className={compact ? '' : 'flex-1 min-h-0'}>
            <div className={cn('flex items-center justify-between', compact ? 'mb-3' : 'mb-4')}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                  <Camera className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">固定监控</p>
                  {!compact ? (
                    <p className="mt-1 text-sm text-text-secondary">常规监控位按值守优先级统一编排。</p>
                  ) : null}
                </div>
              </div>
              <span className="rounded-full bg-bg-tertiary/60 px-3 py-1 text-xs font-medium text-text-secondary border border-border-subtle">
                {gridStreams.length} 路
              </span>
            </div>
            <div
              className={cn(
                'grid gap-[1px] bg-bg-hover border border-border rounded-lg overflow-hidden h-full',
                config.cols === 1 && 'grid-cols-1',
                config.cols === 2 && 'grid-cols-1 xl:grid-cols-2',
                config.cols === 3 && 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3',
                config.cols >= 4 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
              )}
            >
              {gridStreams.map((stream) => (
                <div key={stream.id} className="animate-in fade-in zoom-in-95 duration-300 h-full">
                  <StreamCell
                    stream={stream}
                    isSelected={selectedId === stream.id}
                    isPlaying={playingIds?.has(stream.id) ?? false}
                    detections={detections[stream.id] || []}
                    yoloEnabled={yoloEnabled}
                    onClick={onStreamClick}
                    onTogglePlay={onTogglePlay}
                    onFullscreen={onFullscreen}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  },
);

StreamGrid.displayName = 'StreamGrid';

interface StreamCellProps {
  stream: StreamItem;
  isSelected: boolean;
  isPlaying: boolean;
  detections: YOLODetection[];
  yoloEnabled: boolean;
  onClick?: (id: string) => void;
  onTogglePlay?: (id: string) => void;
  onFullscreen?: (id: string) => void;
}

const StreamCell: React.FC<StreamCellProps> = memo(
  ({ stream, isSelected: _isSelected, isPlaying, detections, yoloEnabled, onClick, onTogglePlay, onFullscreen }) => (
    <VideoStreamPlayer
      id={stream.id}
      name={stream.name}
      url={stream.url}
      status={stream.status}
      detections={detections}
      yoloEnabled={yoloEnabled}
      muted
      playingIds={isPlaying ? new Set([stream.id]) : new Set()}
      onClick={onClick}
      onTogglePlay={onTogglePlay}
      onFullscreen={onFullscreen}
      className="rounded-none border-0 h-full w-full"
    />
  ),
);

StreamCell.displayName = 'StreamCell';

export default StreamGrid;
