import { useState, useRef, useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Calendar } from 'lucide-react';

/**
 * HeatmapTimeline - 热力图时间轴
 * 显示YOLO检测结果的时间分布
 */

export type TimelineEventType = 'fire' | 'intrusion' | 'defect' | 'vehicle' | 'normal';

export interface TimelineEvent {
  id: string;
  startTime: Date;
  endTime: Date;
  type: TimelineEventType;
  intensity: number; // 0-1
  cameraId: string;
  cameraName: string;
  alertId?: string;
  thumbnailUrl?: string;
}

export type TimelineZoom = 'hour' | 'day' | 'week';

export interface HeatmapTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 事件列表 */
  events: TimelineEvent[];
  /** 当前时间 */
  currentTime: Date;
  /** 时间变更回调 */
  onTimeChange: (time: Date) => void;
  /** 事件点击回调 */
  onEventClick?: (event: TimelineEvent) => void;
  /** 缩放级别 */
  zoom?: TimelineZoom;
  /** 缩放变更回调 */
  onZoomChange?: (zoom: TimelineZoom) => void;
  /** 时间范围 */
  timeRange?: {
    start: Date;
    end: Date;
  };
}

const typeColors: Record<TimelineEventType, string> = {
  fire: '#ef4444',
  intrusion: '#f59e0b',
  defect: '#8b5cf6',
  vehicle: '#06b6d4',
  normal: '#10b981',
};



const zoomLevels: { key: TimelineZoom; label: string; pixelsPerMinute: number }[] = [
  { key: 'hour', label: '1小时', pixelsPerMinute: 10 },
  { key: 'day', label: '24小时', pixelsPerMinute: 2 },
  { key: 'week', label: '7天', pixelsPerMinute: 0.3 },
];

export const HeatmapTimeline = forwardRef<HTMLDivElement, HeatmapTimelineProps>(
  (
    {
      events,
      currentTime,
      onTimeChange,
      onEventClick,
      zoom = 'day',
      onZoomChange,
      timeRange,
      className,
      ...props
    },
    ref
  ) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // 计算时间范围
    const effectiveTimeRange = useMemo(() => {
      if (timeRange) return timeRange;
      
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }, [timeRange]);

    // 计算像素比例
    const pixelsPerMs = useMemo(() => {
      const zoomLevel = zoomLevels.find(z => z.key === zoom);
      return (zoomLevel?.pixelsPerMinute || 2) / (60 * 1000);
    }, [zoom]);

    // 总宽度
    const totalWidth = useMemo(() => {
      const duration = effectiveTimeRange.end.getTime() - effectiveTimeRange.start.getTime();
      return duration * pixelsPerMs;
    }, [effectiveTimeRange, pixelsPerMs]);

    // 当前时间位置
    const currentPosition = useMemo(() => {
      const offset = currentTime.getTime() - effectiveTimeRange.start.getTime();
      return offset * pixelsPerMs;
    }, [currentTime, effectiveTimeRange, pixelsPerMs]);

    // 拖拽处理
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!timelineRef.current) return;
      setIsDragging(true);
      setDragStartX(e.pageX - timelineRef.current.offsetLeft);
      setScrollLeft(timelineRef.current.scrollLeft);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;
      e.preventDefault();
      const x = e.pageX - timelineRef.current.offsetLeft;
      const walk = (x - dragStartX) * 2;
      timelineRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // 点击时间轴跳转
    const handleTimelineClick = (e: React.MouseEvent) => {
      if (!timelineRef.current || isDragging) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
      const timeOffset = x / pixelsPerMs;
      const newTime = new Date(effectiveTimeRange.start.getTime() + timeOffset);
      onTimeChange(newTime);
    };

    // 生成时间刻度
    const timeTicks = useMemo(() => {
      const ticks: { time: Date; label: string; isMajor: boolean }[] = [];
      const start = effectiveTimeRange.start;
      const end = effectiveTimeRange.end;
      
      const current = new Date(start);
      
      if (zoom === 'hour') {
        // 每5分钟一个刻度
        while (current < end) {
          ticks.push({
            time: new Date(current),
            label: current.getMinutes() === 0 
              ? current.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              : '',
            isMajor: current.getMinutes() === 0,
          });
          current.setMinutes(current.getMinutes() + 5);
        }
      } else if (zoom === 'day') {
        // 每小时一个刻度
        while (current < end) {
          ticks.push({
            time: new Date(current),
            label: current.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            isMajor: current.getHours() % 6 === 0,
          });
          current.setHours(current.getHours() + 1);
        }
      } else {
        // 每天一个刻度
        while (current < end) {
          ticks.push({
            time: new Date(current),
            label: current.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            isMajor: true,
          });
          current.setDate(current.getDate() + 1);
        }
      }
      
      return ticks;
    }, [effectiveTimeRange, zoom]);

    return (
      <div
        ref={ref}
        className={cn('flex flex-col bg-surface/50 rounded-xl border border-border', className)}
        {...props}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-tertiary">
              {effectiveTimeRange.start.toLocaleDateString('zh-CN')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {zoomLevels.map(({ key, label }) => (
              <button
                key={key}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs',
                  'transition-colors duration-150',
                  zoom === key
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-secondary hover:bg-bg-hover'
                )}
                onClick={() => onZoomChange?.(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className={cn(
            'relative h-32 overflow-x-auto overflow-y-hidden',
            'cursor-grab active:cursor-grabbing',
            isDragging && 'cursor-grabbing'
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleTimelineClick}
        >
          <div
            className="relative h-full"
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
          >
            {/* Time Ticks */}
            {timeTicks.map((tick, idx) => {
              const position = (tick.time.getTime() - effectiveTimeRange.start.getTime()) * pixelsPerMs;
              return (
                <div
                  key={idx}
                  className="absolute top-0 h-full pointer-events-none"
                  style={{ left: `${position}px` }}
                >
                  <div className={cn(
                    'w-px h-full',
                    tick.isMajor ? 'bg-bg-muted' : 'bg-bg-hover'
                  )} />
                  {tick.label && (
                    <span className="absolute top-1 left-1 text-[10px] text-text-primary0 whitespace-nowrap">
                      {tick.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Event Blocks */}
            {events.map((event) => {
              const startPos = (event.startTime.getTime() - effectiveTimeRange.start.getTime()) * pixelsPerMs;
              const duration = event.endTime.getTime() - event.startTime.getTime();
              const width = Math.max(duration * pixelsPerMs, 4);
              
              return (
                <motion.div
                  key={event.id}
                  className="absolute top-8 h-16 rounded cursor-pointer group"
                  style={{
                    left: `${startPos}px`,
                    width: `${width}px`,
                    backgroundColor: `${typeColors[event.type]}${Math.round(event.intensity * 255).toString(16).padStart(2, '0')}`,
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  title={`${event.cameraName} - ${event.type} (${Math.round(event.intensity * 100)}%)`}
                >
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-bg-tertiary text-xs text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {event.cameraName}
                  </div>
                </motion.div>
              );
            })}

            {/* Current Time Indicator */}
            <div
              className="absolute top-0 h-full w-px bg-accent z-20 pointer-events-none"
              style={{ left: `${currentPosition}px` }}
            >
              <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
              <div className="absolute top-1 -translate-x-1/2 px-1.5 py-0.5 rounded bg-accent text-[10px] text-white whitespace-nowrap">
                {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border">
          <span className="text-xs text-text-primary0">图例:</span>
          {(['fire', 'intrusion', 'defect'] as TimelineEventType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: typeColors[type] }}
              />
              <span className="text-xs text-text-secondary capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

HeatmapTimeline.displayName = 'HeatmapTimeline';

export default HeatmapTimeline;
