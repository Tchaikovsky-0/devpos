/**
 * Alert Types - 告警类型定义
 */

export type AlertType = 'fire' | 'intrusion' | 'defect' | 'vehicle' | 'person';
export type AlertPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  description: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  thumbnailUrl?: string;
  videoClipUrl?: string;
  /** AI分析结果 */
  aiAnalysis?: AIAnalysis;
  /** 处理记录 */
  handlingRecords?: HandlingRecord[];
  /** 地理位置 */
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface AIAnalysis {
  confidence: number;
  detectedObjects: DetectedObject[];
  summary: string;
  recommendations?: string[];
  /** 相关时间段 */
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface DetectedObject {
  type: string;
  label: string;
  confidence: number;
  bbox?: [number, number, number, number];
}

export interface HandlingRecord {
  id: string;
  timestamp: Date;
  action: string;
  operator?: string;
  notes?: string;
}

export interface AlertFilter {
  types?: AlertType[];
  priorities?: AlertPriority[];
  statuses?: AlertStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  cameraIds?: string[];
  searchQuery?: string;
}

export interface AlertStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  ignored: number;
  byType: Record<AlertType, number>;
  byPriority: Record<AlertPriority, number>;
}

// 告警类型配置
export const alertTypeConfig: Record<AlertType, { label: string; color: string; icon: string }> = {
  fire: { label: '火灾', color: '#ef4444', icon: 'flame' },
  intrusion: { label: '入侵', color: '#f59e0b', icon: 'shield-alert' },
  defect: { label: '缺陷', color: '#8b5cf6', icon: 'alert-circle' },
  vehicle: { label: '车辆', color: '#06b6d4', icon: 'truck' },
  person: { label: '人员', color: '#3b82f6', icon: 'user' },
};

// 告警优先级配置
export const alertPriorityConfig: Record<AlertPriority, { label: string; color: string; description: string }> = {
  P0: { label: '紧急', color: '#ef4444', description: '需要立即处理' },
  P1: { label: '重要', color: '#f59e0b', description: '需要尽快处理' },
  P2: { label: '一般', color: '#3b82f6', description: '按计划处理' },
  P3: { label: '低', color: '#64748b', description: '可延后处理' },
};

// 告警状态配置
export const alertStatusConfig: Record<AlertStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#ef4444' },
  processing: { label: '处理中', color: '#f59e0b' },
  resolved: { label: '已解决', color: '#10b981' },
  ignored: { label: '已忽略', color: '#64748b' },
};

export default {};
