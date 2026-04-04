import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { YOLODetection } from '@/components/yolo/YOLOOverlay';
import { VideoStreamPlayer, StreamStatus } from './VideoStreamPlayer';

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
        <div className={cn('flex h-full items-center justify-center rounded-[24px] border border-dashed border-border bg-bg-surface/60', className)}>
          <div className="text-center">
            <p className="text-lg font-semibold tracking-[-0.03em] text-text-primary">暂无视频流</p>
            <p className="mt-2 text-sm text-text-secondary">检查设备链路后，视频墙会自动恢复。</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(compact ? 'space-y-3' : 'space-y-5', className)}>
        {featuredStreams.length > 0 && (
          <section>
            <div className={cn('flex items-center justify-between', compact ? 'mb-2' : 'mb-3')}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">无人机画面</p>
                {!compact ? (
                  <p className="mt-1 text-sm text-text-secondary">优先保留空域与巡线视角，作为现场态势锚点。</p>
                ) : null}
              </div>
              <span className="rounded-full bg-bg-surface px-3 py-1 text-xs text-text-secondary">
                {featuredStreams.length} 路
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {featuredStreams.map((stream) => (
                <StreamCell
                  key={stream.id}
                  stream={stream}
                  isSelected={selectedId === stream.id}
                  isPlaying={playingIds?.has(stream.id) ?? false}
                  detections={detections[stream.id] || []}
                  yoloEnabled={yoloEnabled}
                  onClick={onStreamClick}
                  onTogglePlay={onTogglePlay}
                  onFullscreen={onFullscreen}
                />
              ))}
            </div>
          </section>
        )}

        {gridStreams.length > 0 && (
          <section>
            <div className={cn('flex items-center justify-between', compact ? 'mb-2' : 'mb-3')}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">固定监控</p>
                {!compact ? (
                  <p className="mt-1 text-sm text-text-secondary">常规监控位按值守优先级统一编排。</p>
                ) : null}
              </div>
              <span className="rounded-full bg-bg-surface px-3 py-1 text-xs text-text-secondary">
                {gridStreams.length} 路
              </span>
            </div>
            <div
              className={cn(
                'grid gap-3',
                config.cols === 1 && 'grid-cols-1',
                config.cols === 2 && 'grid-cols-1 xl:grid-cols-2',
                config.cols === 3 && 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3',
                config.cols >= 4 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
              )}
            >
              {gridStreams.map((stream) => (
                <StreamCell
                  key={stream.id}
                  stream={stream}
                  isSelected={selectedId === stream.id}
                  isPlaying={playingIds?.has(stream.id) ?? false}
                  detections={detections[stream.id] || []}
                  yoloEnabled={yoloEnabled}
                  onClick={onStreamClick}
                  onTogglePlay={onTogglePlay}
                  onFullscreen={onFullscreen}
                />
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
  ({ stream, isSelected, isPlaying, detections, yoloEnabled, onClick, onTogglePlay, onFullscreen }) => (
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
      className={isSelected ? 'ring-2 ring-accent' : ''}
    />
  ),
);

StreamCell.displayName = 'StreamCell';

export default StreamGrid;
