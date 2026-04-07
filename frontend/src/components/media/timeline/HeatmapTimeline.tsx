// =============================================================================
// HeatmapTimeline - 热力图时间轴组件
// 时间轴上显示彩色区块，色块高度表示告警密度
// =============================================================================

import React, { useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TimelineEvent, TimelineRange } from '@/types/timeline';

// 事件类型颜色和标签映射
const EVENT_COLORS: Record<string, string> = {
  fire: '#ef4444',
  smoke: '#f97316',
  intrusion: '#8b5cf6',
  defect: '#eab308',
  anomaly: '#06b6d4',
};

const EVENT_LABELS: Record<string, string> = {
  fire: '火灾',
  smoke: '烟雾',
  intrusion: '入侵',
  defect: '缺陷',
  anomaly: '异常',
};

function getEventColor(type: string): string {
  return EVENT_COLORS[type] || '#6b7280';
}

function getEventLabel(type: string): string {
  return EVENT_LABELS[type] || type;
}

interface HeatmapTimelineProps {
  events: TimelineEvent[];
  range: TimelineRange;
  selectedEventId?: string;
  onEventClick?: (event: TimelineEvent) => void;
  onEventHover?: (event: TimelineEvent | null) => void;
  className?: string;
}

interface HeatmapBlock {
  id: string;
  left: number;
  width: number;
  height: number;
  color: string;
  intensity: number;
  event: TimelineEvent;
}

// 将事件转换为热力图区块
const generateHeatmapBlocks = (
  events: TimelineEvent[],
  start: Date,
  end: Date,
): HeatmapBlock[] => {
  const totalDuration = end.getTime() - start.getTime();
  const blocks: HeatmapBlock[] = [];

  events.forEach((event, _index) => {
    const eventStart = Math.max(event.startTime.getTime(), start.getTime());
    const eventEnd = Math.min(event.endTime.getTime(), end.getTime());

    if (eventStart >= eventEnd) return;

    const left = ((eventStart - start.getTime()) / totalDuration) * 100;
    const width = ((eventEnd - eventStart) / totalDuration) * 100;

    // 根据告警密度计算高度 (30% - 100%)
    const height = 30 + event.intensity * 70;

    blocks.push({
      id: event.id,
      left,
      width: Math.max(width, 0.5), // 最小宽度0.5%
      height,
      color: getEventColor(event.type),
      intensity: event.intensity,
      event,
    });
  });

  return blocks;
};

// 按类型聚合事件
const aggregateEventsByType = (events: TimelineEvent[]) => {
  const aggregation: Record<string, { count: number; totalIntensity: number }> = {};

  events.forEach((event) => {
    if (!aggregation[event.type]) {
      aggregation[event.type] = { count: 0, totalIntensity: 0 };
    }
    aggregation[event.type].count++;
    aggregation[event.type].totalIntensity += event.intensity;
  });

  return Object.entries(aggregation).map(([type, data]) => ({
    type,
    count: data.count,
    avgIntensity: data.totalIntensity / data.count,
  }));
};

export const HeatmapTimeline: React.FC<HeatmapTimelineProps> = memo(
  ({ events, range, selectedEventId, onEventClick, onEventHover, className }) => {
    const { start, end } = range;

    // 生成热力图区块
    const blocks = useMemo(
      () => generateHeatmapBlocks(events, start, end),
      [events, start, end],
    );

    // 统计信息
    const stats = useMemo(() => aggregateEventsByType(events), [events]);

    const handleBlockClick = useCallback(
      (block: HeatmapBlock) => {
        onEventClick?.(block.event);
      },
      [onEventClick],
    );

    const handleBlockHover = useCallback(
      (block: HeatmapBlock | null) => {
        onEventHover?.(block?.event || null);
      },
      [onEventHover],
    );

    return (
      <div className={cn('space-y-3', className)}>
        {/* 统计图例 */}
        <div className="flex items-center gap-4 px-1">
          {stats.map(({ type, count }) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getEventColor(type) }}
              />
              <span className="text-xs text-text-secondary">
                {getEventLabel(type)}
                <span className="ml-1 text-text-tertiary">({count})</span>
              </span>
            </div>
          ))}
          {stats.length === 0 && (
            <span className="text-xs text-text-tertiary">暂无事件数据</span>
          )}
        </div>

        {/* 热力图容器 */}
        <div className="relative h-24 bg-surface-raised/30 rounded-xl overflow-hidden border border-border/20">
          {/* 背景网格线 */}
          <div className="absolute inset-0 flex">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-border/10 last:border-r-0"
              />
            ))}
          </div>

          {/* 水平参考线 */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-px bg-border/10 w-full" />
            ))}
          </div>

          {/* 热力图区块 */}
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.03,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                'absolute bottom-0 cursor-pointer',
                'hover:brightness-110 transition-all duration-200',
                'rounded-t-sm',
                selectedEventId === block.id && 'ring-2 ring-white z-10',
              )}
              style={{
                left: `${block.left}%`,
                width: `${block.width}%`,
                height: `${block.height}%`,
                backgroundColor: block.color,
                opacity: 0.6 + block.intensity * 0.4,
                transformOrigin: 'bottom',
              }}
              onClick={() => handleBlockClick(block)}
              onMouseEnter={() => handleBlockHover(block)}
              onMouseLeave={() => handleBlockHover(null)}
            >
              {/* 悬停提示 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="px-2 py-1 bg-surface-elevated rounded-lg text-[10px] text-text-primary whitespace-nowrap shadow-lg">
                  {getEventLabel(block.event.type)}
                  <br />
                  {block.event.startTime.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </motion.div>
          ))}

          {/* 空状态 */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-text-tertiary">选择时间范围查看事件</span>
            </div>
          )}
        </div>

        {/* 密度图例 */}
        <div className="flex items-center justify-between text-[10px] text-text-tertiary px-1">
          <span>低密度</span>
          <div className="flex-1 mx-3 h-2 rounded-full bg-gradient-to-r from-surface-elevated via-warning to-error" />
          <span>高密度</span>
        </div>
      </div>
    );
  },
);

HeatmapTimeline.displayName = 'HeatmapTimeline';

// 紧凑版热力图 - 用于小空间展示
interface CompactHeatmapTimelineProps {
  events: TimelineEvent[];
  range: TimelineRange;
  className?: string;
}

export const CompactHeatmapTimeline: React.FC<CompactHeatmapTimelineProps> = memo(
  ({ events, range, className }) => {
    const { start, end } = range;
    const blocks = useMemo(
      () => generateHeatmapBlocks(events, start, end),
      [events, start, end],
    );

    return (
      <div
        className={cn(
          'relative h-8 bg-surface-raised/30 rounded-lg overflow-hidden',
          className,
        )}
      >
        {blocks.map((block, index) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className="absolute top-0 bottom-0 rounded-sm"
            style={{
              left: `${block.left}%`,
              width: `${Math.max(block.width, 0.3)}%`,
              backgroundColor: block.color,
              opacity: 0.5 + block.intensity * 0.5,
            }}
          />
        ))}
      </div>
    );
  },
);

CompactHeatmapTimeline.displayName = 'CompactHeatmapTimeline';

export default HeatmapTimeline;
