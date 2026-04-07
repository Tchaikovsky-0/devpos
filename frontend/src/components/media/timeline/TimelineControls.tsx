// =============================================================================
// TimelineControls - 时间轴控制器组件
// 播放/暂停按钮、时间显示、缩放控制、快速跳转
// =============================================================================

import React, { memo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { TimelineRange, TimelineViewMode } from '@/types/timeline';

interface TimelineControlsProps {
  isPlaying: boolean;
  currentTime: Date;
  range: TimelineRange;
  playbackSpeed?: number;
  onPlayPause: () => void;
  onSpeedChange?: (speed: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onJumpTo: (time: Date) => void;
  className?: string;
}

// 快速跳转选项
const quickJumps = [
  { label: '今天', getDate: () => new Date() },
  { label: '昨天', getDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { label: '上周', getDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { label: '本月', getDate: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
];

// 播放速度选项
const speedOptions = [0.5, 1, 2, 4, 8];

export const TimelineControls: React.FC<TimelineControlsProps> = memo(
  ({
    isPlaying,
    currentTime,
    range,
    playbackSpeed = 1,
    onPlayPause,
    onSpeedChange,
    onZoomIn,
    onZoomOut,
    onReset,
    onJumpTo,
    className,
  }) => {
    const { viewMode } = range;

    // 格式化时间显示
    const formatTime = useCallback((date: Date): string => {
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }, []);

    // 格式化视图模式
    const getViewModeLabel = (mode: TimelineViewMode): string => {
      const labels: Record<TimelineViewMode, string> = {
        hour: '小时视图',
        day: '日视图',
        week: '周视图',
        month: '月视图',
      };
      return labels[mode];
    };

    // 步进控制
    const handleStepBack = useCallback(() => {
      const step = getStepSize(viewMode);
      onJumpTo(new Date(currentTime.getTime() - step));
    }, [currentTime, viewMode, onJumpTo]);

    const handleStepForward = useCallback(() => {
      const step = getStepSize(viewMode);
      onJumpTo(new Date(currentTime.getTime() + step));
    }, [currentTime, viewMode, onJumpTo]);

    const getStepSize = (mode: TimelineViewMode): number => {
      switch (mode) {
        case 'hour':
          return 60 * 1000; // 1分钟
        case 'day':
          return 15 * 60 * 1000; // 15分钟
        case 'week':
          return 60 * 60 * 1000; // 1小时
        case 'month':
          return 24 * 60 * 60 * 1000; // 1天
        default:
          return 60 * 1000;
      }
    };

    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 p-3',
          'bg-surface-raised/80 rounded-2xl border border-border/30',
          className,
        )}
      >
        {/* 播放控制 */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleStepBack}>
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="icon"
            onClick={onPlayPause}
            className={cn(isPlaying && 'bg-accent hover:bg-accent-strong')}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleStepForward}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-border/50" />

        {/* 时间显示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-subtle/50 rounded-lg">
          <Clock className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* 视图模式标签 */}
        <div className="px-2 py-1 text-xs font-medium text-text-tertiary bg-surface-subtle/30 rounded">
          {getViewModeLabel(viewMode)}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-border/50" />

        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onZoomOut} title="缩小">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onZoomIn} title="放大">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset} title="重置">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-border/50" />

        {/* 播放速度 */}
        {onSpeedChange && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-tertiary mr-1">速度</span>
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-colors',
                  playbackSpeed === speed
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:bg-surface-subtle',
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}

        {/* 分隔线 */}
        <div className="w-px h-8 bg-border/50" />

        {/* 快速跳转 */}
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-text-tertiary mr-1" />
          {quickJumps.map((jump) => (
            <button
              key={jump.label}
              onClick={() => onJumpTo(jump.getDate())}
              className="px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded transition-colors"
            >
              {jump.label}
            </button>
          ))}
        </div>
      </div>
    );
  },
);

TimelineControls.displayName = 'TimelineControls';

// 简化版时间轴控制 - 用于紧凑布局
interface CompactTimelineControlsProps {
  isPlaying: boolean;
  currentTime: Date;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export const CompactTimelineControls: React.FC<CompactTimelineControlsProps> = memo(
  ({ isPlaying, currentTime, onPlayPause, onPrevious, onNext, className }) => {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={onPrevious}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onPlayPause}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isPlaying
              ? 'bg-accent text-white hover:bg-accent-strong'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
          )}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="px-3 py-1.5 bg-surface-raised rounded-lg">
          <span className="text-sm font-medium text-text-primary tabular-nums">
            {currentTime.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>
    );
  },
);

CompactTimelineControls.displayName = 'CompactTimelineControls';

export default TimelineControls;
