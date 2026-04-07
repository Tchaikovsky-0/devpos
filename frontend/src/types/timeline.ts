// =============================================================================
// Timeline Types - 媒体库时间轴类型定义
// =============================================================================

export type TimelineEventType = 'fire' | 'defect' | 'intrusion' | 'normal';

export type TimelineViewMode = 'hour' | 'day' | 'week' | 'month';

export interface TimelineEvent {
  id: string;
  startTime: Date;
  endTime: Date;
  type: TimelineEventType;
  intensity: number; // 0-1
  cameraId: string;
  cameraName?: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  metadata?: {
    confidence?: number;
    detectedObjects?: string[];
    alertId?: string;
  };
}

export interface TimelineCamera {
  id: string;
  name: string;
  location?: string;
  status: 'online' | 'offline' | 'error';
  thumbnailUrl?: string;
}

export interface TimelineRange {
  start: Date;
  end: Date;
  viewMode: TimelineViewMode;
}

export interface HeatmapBlock {
  x: number;
  width: number;
  height: number;
  color: string;
  intensity: number;
  event: TimelineEvent;
}

export interface TimelineState {
  currentTime: Date;
  range: TimelineRange;
  selectedCameraIds: string[];
  selectedEventId?: string;
  isPlaying: boolean;
  playbackSpeed: number;
}

export interface MediaPreviewItem {
  id: string;
  type: 'video' | 'image';
  url: string;
  thumbnailUrl?: string;
  timestamp: Date;
  duration?: number;
  cameraId: string;
  cameraName?: string;
  aiReport?: AIAnalysisReport;
}

export interface AIAnalysisReport {
  id: string;
  timestamp: Date;
  summary: string;
  detections: DetectionItem[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations?: string[];
}

export interface DetectionItem {
  type: string;
  confidence: number;
  bbox?: [number, number, number, number];
  timestamp: Date;
}
