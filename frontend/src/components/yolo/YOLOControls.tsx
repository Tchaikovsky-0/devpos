/**
 * YOLOControls - YOLO 检测控制组件
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface YOLOControlsProps {
  /** 是否启用 YOLO 检测 */
  enabled: boolean;
  /** 切换 YOLO 启用状态 */
  onToggle: (enabled: boolean) => void;
  /** 当前检测数量 */
  detectionCount: number;
  /** 是否有活跃检测 */
  hasActiveAlerts?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * YOLO 检测控制栏
 *
 * @example
 * ```tsx
 * <YOLOControls
 *   enabled={showYOLO}
 *   onToggle={setShowYOLO}
 *   detectionCount={detections.length}
 * />
 * ```
 */
export const YOLOControls: React.FC<YOLOControlsProps> = memo(({
  enabled,
  onToggle,
  detectionCount,
  hasActiveAlerts = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5',
        'bg-black/60 backdrop-blur-sm rounded-lg',
        'border border-border-strong',
        className
      )}
    >
      {/* YOLO Toggle */}
      <Button
        variant={enabled ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onToggle(!enabled)}
        className="h-6 text-xs"
      >
        YOLO
      </Button>

      {/* Detection Count */}
      {enabled && detectionCount > 0 && (
        <Badge variant={hasActiveAlerts ? 'danger' : 'info'}>
          {detectionCount}
        </Badge>
      )}

      {/* Status Indicator */}
      {enabled && (
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      )}
    </div>
  );
});

YOLOControls.displayName = 'YOLOControls';

export default YOLOControls;
