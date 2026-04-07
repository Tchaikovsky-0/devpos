/**
 * 视频流组件类型定义
 */

import type { YOLODetection } from '@/components/yolo/YOLOOverlay';
export type { YOLODetection };

/** 视频流状态 */
export type VideoStreamStatus = 'online' | 'offline' | 'error' | 'connecting';

/** 视频源类型 */
export type VideoSourceType = 'webrtc' | 'rtsp' | 'hls';

/** 告警类型 */
export type AlertType = 'fire' | 'intrusion' | 'defect' | null;

/** 大疆司空2无人机数据 */
export interface DroneData {
  /** 高度 (米) */
  altitude: number;
  /** 电量 (%) */
  battery: number;
  /** 信号强度 (%) */
  signal: number;
  /** 飞行速度 (m/s) */
  speed?: number;
  /** GPS 卫星数 */
  gpsCount?: number;
}

/** 检测结果 */
export interface Detection {
  id: string;
  class: string;
  className: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: number;
}

/** 告警时间线项 */
export interface AlertTimelineItem {
  id: string;
  type: Exclude<AlertType, null>;
  confidence: number;
  timestamp: number;
  message: string;
}

/** 视频流组件 Props */
export interface VideoStreamProps {
  id: string;
  name: string;
  source: VideoSourceType;
  url: string;
  status: VideoStreamStatus;
  /** 大疆司空2数据 */
  droneData?: DroneData;
  /** YOLO检测数据 */
  detections?: Detection[];
  /** 是否静音 */
  muted?: boolean;
  /** 是否正在播放 */
  isPlaying?: boolean;
  /** 是否选中 */
  isSelected?: boolean;
  /** 告警历史 */
  alertHistory?: AlertTimelineItem[];
  /** 点击回调 */
  onClick?: (id: string) => void;
  /** 播放/暂停回调 */
  onTogglePlay?: (id: string) => void;
  /** 全屏回调 */
  onFullscreen?: (id: string) => void;
  /** 自定义类名 */
  className?: string;
}

/** 智能聚焦组件 Props */
export interface SmartFocusProps {
  /** 是否处于告警状态 */
  isAlert: boolean;
  /** 告警类型 */
  alertType: AlertType;
  /** 当前置信度 (0-1) */
  confidence: number;
  /** 置信度历史数据 (最近5分钟) */
  confidenceHistory: number[];
  /** 自定义类名 */
  className?: string;
}

/** 视频悬浮 Overlay Props */
export interface VideoOverlayProps {
  /** 设备名称 */
  name: string;
  /** 设备状态 */
  status: VideoStreamStatus;
  /** 视频源类型 */
  source: VideoSourceType;
  /** 大疆司空2数据 */
  droneData?: DroneData;
  /** 告警历史 */
  alertHistory?: AlertTimelineItem[];
  /** 是否可见 */
  visible: boolean;
}

/** 视频网格布局类型 */
export type VideoGridLayout = '1x1' | '2x2' | '3x3' | '4x4';

/** 视频网格项 */
export interface VideoGridItem {
  id: string;
  name: string;
  source: VideoSourceType;
  url: string;
  status: VideoStreamStatus;
  type?: 'drone' | 'camera';
  droneData?: DroneData;
  detections?: Detection[];
  alertHistory?: AlertTimelineItem[];
}

/** 视频网格组件 Props */
export interface VideoGridProps {
  /** 视频流列表 */
  items: VideoGridItem[];
  /** 当前布局 */
  layout: VideoGridLayout;
  /** 选中项ID */
  selectedId?: string;
  /** 正在播放的ID集合 */
  playingIds?: Set<string>;
  /** 点击回调 */
  onItemClick?: (id: string) => void;
  /** 播放/暂停回调 */
  onTogglePlay?: (id: string) => void;
  /** 全屏回调 */
  onFullscreen?: (id: string) => void;
  /** 自定义类名 */
  className?: string;
}

/** 告警指示器 Props */
export interface AlertIndicatorProps {
  /** 当前状态 */
  status: 'alert' | 'normal' | 'offline';
  /** 告警类型 */
  alertType?: AlertType;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

/** 监控大屏统计信息 */
export interface CommandCenterStats {
  /** 在线设备数 */
  onlineDevices: number;
  /** 总设备数 */
  totalDevices: number;
  /** 今日告警数 */
  todayAlerts: number;
  /** 待处理告警数 */
  pendingAlerts: number;
  /** 无人机数量 */
  droneCount: number;
  /** 固定监控数量 */
  cameraCount: number;
}
