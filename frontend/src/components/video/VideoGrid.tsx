import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { VideoStream, VideoStreamProps } from './VideoStream';
import {
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  Maximize2,
} from 'lucide-react';

/**
 * VideoGrid - 视频网格布局
 * 支持 1x1, 2x2, 3x3, 4x4 布局切换，无边框设计
 */

export type GridLayout = '1x1' | '2x2' | '3x3' | '4x4';

export interface VideoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 视频流列表 */
  streams: Omit<VideoStreamProps, 'onSelect' | 'isSelected'>[];
  /** 当前布局 */
  layout?: GridLayout;
  /** 布局变更回调 */
  onLayoutChange?: (layout: GridLayout) => void;
  /** 选中视频回调 */
  onStreamSelect?: (streamId: string) => void;
  /** 全屏回调 */
  onStreamFullscreen?: (streamId: string) => void;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 间隙大小 */
  gap?: 'none' | 'sm' | 'md';
}

const layoutConfigs: Record<GridLayout, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x2': { cols: 2, rows: 2 },
  '3x3': { cols: 3, rows: 3 },
  '4x4': { cols: 4, rows: 4 },
};

export const VideoGrid = forwardRef<HTMLDivElement, VideoGridProps>(
  (
    {
      streams,
      layout = '2x2',
      onLayoutChange,
      onStreamSelect,
      onStreamFullscreen,
      showToolbar = true,
      gap = 'sm',
      className,
      ...props
    },
    ref
  ) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { cols, rows } = layoutConfigs[layout];

    // 计算可见视频数
    const maxVisible = cols * rows;
    const visibleStreams = streams.slice(0, maxVisible);

    // 处理视频选择
    const handleSelect = (streamId: string) => {
      setSelectedId(streamId);
      onStreamSelect?.(streamId);
    };

    // 间隙样式
    const gapStyles = {
      none: 'gap-0',
      sm: 'gap-1',
      md: 'gap-2',
    };

    return (
      <div ref={ref} className={cn('flex flex-col h-full', className)} {...props}>
        {/* Toolbar */}
        {showToolbar && (
          <VideoGridToolbar
            layout={layout}
            onLayoutChange={onLayoutChange}
            totalStreams={streams.length}
            visibleStreams={visibleStreams.length}
          />
        )}

        {/* Grid */}
        <div className="flex-1 overflow-hidden p-1">
          <motion.div
            className={cn(
              'grid h-full',
              gapStyles[gap]
            )}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
            layout
          >
            <AnimatePresence mode="popLayout">
              {visibleStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="min-h-0"
                >
                  <VideoStream
                    {...stream}
                    isSelected={selectedId === stream.id}
                    onSelect={() => handleSelect(stream.id)}
                    onFullscreen={() => onStreamFullscreen?.(stream.id)}
                    className="h-full"
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty Slots */}
            {Array.from({ length: maxVisible - visibleStreams.length }).map((_, index) => (
              <motion.div
                key={`empty-${index}`}
                className={cn(
                  'h-full rounded-lg',
                  'bg-surface/50 border border-border',
                  'flex items-center justify-center'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-text-disabled text-sm">无信号</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }
);

VideoGrid.displayName = 'VideoGrid';

/**
 * VideoGridToolbar - 视频网格工具栏
 */
interface VideoGridToolbarProps {
  layout: GridLayout;
  onLayoutChange?: (layout: GridLayout) => void;
  totalStreams: number;
  visibleStreams: number;
}

const VideoGridToolbar = ({
  layout,
  onLayoutChange,
  totalStreams,
  visibleStreams,
}: VideoGridToolbarProps) => {
  const layouts: { key: GridLayout; icon: React.ReactNode; label: string }[] = [
    { key: '1x1', icon: <Maximize2 className="w-4 h-4" />, label: '单画面' },
    { key: '2x2', icon: <Grid2X2 className="w-4 h-4" />, label: '四画面' },
    { key: '3x3', icon: <Grid3X3 className="w-4 h-4" />, label: '九画面' },
    { key: '4x4', icon: <LayoutGrid className="w-4 h-4" />, label: '十六画面' },
  ];

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      {/* Left: Stream Count */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="text-text-secondary font-medium">{visibleStreams}</span>
        <span>/</span>
        <span>{totalStreams}</span>
        <span className="text-text-primary0">视频流</span>
      </div>

      {/* Right: Layout Switcher */}
      <div className="flex items-center gap-1">
        {layouts.map(({ key, icon, label }) => (
          <button
            key={key}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'transition-all duration-200',
              layout === key
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-secondary hover:bg-bg-hover'
            )}
            onClick={() => onLayoutChange?.(key)}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * SmartFocusGrid - 智能聚焦网格
 * 自动放大告警视频
 */
export interface SmartFocusGridProps extends VideoGridProps {
  /** 告警视频ID列表 */
  alertStreamIds: string[];
  /** 是否启用智能聚焦 */
  smartFocusEnabled?: boolean;
}

export const SmartFocusGrid = forwardRef<HTMLDivElement, SmartFocusGridProps>(
  ({ alertStreamIds, smartFocusEnabled = true, streams, ...props }, ref) => {
    // 如果有告警且启用智能聚焦，将告警视频排在前面
    const sortedStreams = smartFocusEnabled && alertStreamIds.length > 0
      ? [
          ...streams.filter(s => alertStreamIds.includes(s.id)),
          ...streams.filter(s => !alertStreamIds.includes(s.id)),
        ]
      : streams;

    return (
      <VideoGrid
        ref={ref}
        streams={sortedStreams}
        {...props}
      />
    );
  }
);

SmartFocusGrid.displayName = 'SmartFocusGrid';

export default VideoGrid;
