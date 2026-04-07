// =============================================================================
// Timeline - 时间轴组件
// 底部长条形时间轴，支持缩放和拖拽导航
// =============================================================================

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TimelineRange, TimelineViewMode } from '@/types/timeline';

interface TimelineProps {
  range: TimelineRange;
  currentTime: Date;
  onRangeChange: (range: TimelineRange) => void;
  onTimeChange: (time: Date) => void;
  className?: string;
}

// 时间格式化
const formatTime = (date: Date, viewMode: TimelineViewMode): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate();
  const month = date.getMonth() + 1;

  switch (viewMode) {
    case 'hour':
      return `${hours}:${minutes}`;
    case 'day':
      return `${hours}:00`;
    case 'week':
    case 'month':
      return `${month}/${day}`;
    default:
      return `${hours}:${minutes}`;
  }
};

// 获取刻度间隔
const getTickInterval = (viewMode: TimelineViewMode): number => {
  switch (viewMode) {
    case 'hour':
      return 5 * 60 * 1000; // 5分钟
    case 'day':
      return 60 * 60 * 1000; // 1小时
    case 'week':
      return 24 * 60 * 60 * 1000; // 1天
    case 'month':
      return 7 * 24 * 60 * 60 * 1000; // 1周
    default:
      return 60 * 60 * 1000;
  }
};

// 生成刻度
const generateTicks = (start: Date, end: Date, interval: number): Date[] => {
  const ticks: Date[] = [];
  let current = new Date(start);

  // 对齐到整点
  if (interval >= 60 * 60 * 1000) {
    current.setMinutes(0, 0, 0);
  } else {
    const minutes = current.getMinutes();
    current.setMinutes(Math.floor(minutes / 5) * 5, 0, 0);
  }

  while (current <= end) {
    ticks.push(new Date(current));
    current = new Date(current.getTime() + interval);
  }

  return ticks;
};

export const Timeline: React.FC<TimelineProps> = memo(
  ({ range, currentTime, onRangeChange, onTimeChange, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [, setDragStart] = useState<{ x: number; time: Date } | null>(null);

    const { start, end, viewMode } = range;
    const totalDuration = end.getTime() - start.getTime();

    // 生成刻度
    const tickInterval = useMemo(() => getTickInterval(viewMode), [viewMode]);
    const ticks = useMemo(() => generateTicks(start, end, tickInterval), [start, end, tickInterval]);

    // 计算时间位置百分比
    const getTimePosition = useCallback(
      (time: Date): number => {
        const elapsed = time.getTime() - start.getTime();
        return (elapsed / totalDuration) * 100;
      },
      [start, totalDuration],
    );

    // 根据位置计算时间
    const getTimeFromPosition = useCallback(
      (clientX: number): Date => {
        if (!containerRef.current) return start;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const timeOffset = percentage * totalDuration;

        return new Date(start.getTime() + timeOffset);
      },
      [start, totalDuration],
    );

    // 处理点击/拖拽
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        setIsDragging(true);
        const time = getTimeFromPosition(e.clientX);
        setDragStart({ x: e.clientX, time });
        onTimeChange(time);
      },
      [getTimeFromPosition, onTimeChange],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging) return;
        const time = getTimeFromPosition(e.clientX);
        onTimeChange(time);
      },
      [isDragging, getTimeFromPosition, onTimeChange],
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      setDragStart(null);
    }, []);

    // 全局鼠标事件
    useEffect(() => {
      if (isDragging) {
        const handleGlobalMouseMove = (e: MouseEvent) => {
          const time = getTimeFromPosition(e.clientX);
          onTimeChange(time);
        };

        const handleGlobalMouseUp = () => {
          setIsDragging(false);
          setDragStart(null);
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
          document.removeEventListener('mousemove', handleGlobalMouseMove);
          document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
      }
    }, [isDragging, getTimeFromPosition, onTimeChange]);

    // 滚轮缩放
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();

        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mousePercentage = mouseX / rect.width;
        const mouseTime = new Date(start.getTime() + mousePercentage * totalDuration);

        // 缩放因子
        const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
        const newDuration = totalDuration * zoomFactor;

        // 限制缩放范围
        const minDuration = 10 * 60 * 1000; // 最小10分钟
        const maxDuration = 30 * 24 * 60 * 60 * 1000; // 最大30天

        if (newDuration < minDuration || newDuration > maxDuration) return;

        // 以鼠标位置为中心缩放
        const newStart = new Date(mouseTime.getTime() - mousePercentage * newDuration);
        const newEnd = new Date(newStart.getTime() + newDuration);

        // 确定新的视图模式
        let newViewMode: TimelineViewMode = viewMode;
        if (newDuration <= 2 * 60 * 60 * 1000) {
          newViewMode = 'hour';
        } else if (newDuration <= 24 * 60 * 60 * 1000) {
          newViewMode = 'day';
        } else if (newDuration <= 7 * 24 * 60 * 60 * 1000) {
          newViewMode = 'week';
        } else {
          newViewMode = 'month';
        }

        onRangeChange({
          start: newStart,
          end: newEnd,
          viewMode: newViewMode,
        });
      },
      [start, end, totalDuration, viewMode, onRangeChange],
    );

    const currentPosition = getTimePosition(currentTime);

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative w-full h-16 bg-surface-raised/50 rounded-xl overflow-hidden',
          'border border-border/30 cursor-crosshair select-none',
          isDragging && 'cursor-grabbing',
          className,
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 背景网格 */}
        <div className="absolute inset-0 flex">
          {ticks.map((tick, index) => {
            const position = getTimePosition(tick);
            const isMajor = index % (viewMode === 'hour' ? 6 : viewMode === 'day' ? 4 : 1) === 0;

            return (
              <div
                key={tick.getTime()}
                className="absolute top-0 bottom-0 w-px bg-border/20"
                style={{ left: `${position}%` }}
              >
                {isMajor && (
                  <span className="absolute top-1 left-1 text-[10px] text-text-tertiary whitespace-nowrap">
                    {formatTime(tick, viewMode)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 当前时间指示器 */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
          style={{ left: `${currentPosition}%` }}
          animate={{ left: `${currentPosition}%` }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* 时间标签 */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent text-white text-[10px] font-medium rounded-full whitespace-nowrap">
            {formatTime(currentTime, viewMode)}
          </div>

          {/* 底部标记 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rotate-45 translate-y-1/2" />
        </motion.div>

        {/* 时间范围显示 */}
        <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[10px] text-text-tertiary">
          <span>{formatTime(start, viewMode)}</span>
          <span>{formatTime(end, viewMode)}</span>
        </div>
      </div>
    );
  },
);

Timeline.displayName = 'Timeline';

export default Timeline;
