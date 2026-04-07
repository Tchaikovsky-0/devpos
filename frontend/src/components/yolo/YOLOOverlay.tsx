/**
 * YOLOOverlay - 实时检测框覆盖组件
 *
 * 在视频画面上渲染 YOLO 检测结果
 */

import React, { useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

export interface YOLODetection {
  class: string;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0-1
}

interface YOLOOverlayProps {
  /** 检测结果列表 */
  detections: YOLODetection[];
  /** 视频元素尺寸 */
  width: number;
  height: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/** 检测类别颜色配置 */
const CLASS_COLORS: Record<string, string> = {
  person: '#3B82F6',    // Blue
  vehicle: '#22C55E',    // Green
  car: '#22C55E',
  truck: '#22C55E',
  bus: '#22C55E',
  fire: '#EF4444',       // Red
  blue_algae: '#06B6D4', // Cyan
  intrusion: '#A855F7',  // Purple
  corrosion: '#F97316',  // Orange
  crack: '#F97316',
  animal: '#EAB308',     // Yellow
  default: '#FBBF24',    // Amber
};

const getColor = (className: string): string => {
  return CLASS_COLORS[className.toLowerCase()] || CLASS_COLORS.default;
};

/**
 * YOLO 检测框覆盖组件
 *
 * @example
 * ```tsx
 * <YOLOOverlay
 *   detections={detections}
 *   width={videoWidth}
 *   height={videoHeight}
 *   enabled={showYOLO}
 * />
 * ```
 */
export const YOLOOverlay: React.FC<YOLOOverlayProps> = memo(({
  detections,
  width,
  height,
  enabled = true,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw each detection
    for (const detection of detections) {
      const [x1, y1, x2, y2] = detection.bbox;
      const color = getColor(detection.class);

      // Scale bbox to pixel coordinates
      const px1 = x1 * width;
      const py1 = y1 * height;
      const px2 = x2 * width;
      const py2 = y2 * height;

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px1, py1, px2 - px1, py2 - py1);

      // Draw label background
      const label = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const labelPadding = 4;

      ctx.fillStyle = color;
      ctx.fillRect(px1, py1 - 20, textWidth + labelPadding * 2, 18);

      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, px1 + labelPadding, py1 - 6);
    }
  }, [detections, width, height, enabled]);

  // Redraw when detections change
  useEffect(() => {
    requestAnimationFrame(draw);
  }, [draw]);

  if (!enabled || detections.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn(
        'absolute top-0 left-0 pointer-events-none z-10',
        className
      )}
      style={{ width, height }}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render when meaningful props change
  return (
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.enabled === nextProps.enabled &&
    JSON.stringify(prevProps.detections) === JSON.stringify(nextProps.detections)
  );
});

YOLOOverlay.displayName = 'YOLOOverlay';

export default YOLOOverlay;
