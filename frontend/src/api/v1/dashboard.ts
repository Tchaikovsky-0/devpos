import { apiClient } from '../client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  total_streams: number;
  online_streams: number;
  offline_streams: number;
  warning_streams: number;
  total_alerts: number;
  pending_alerts: number;
  critical_alerts: number;
  ai_detections: number;
  storage_used_mb: number;
  storage_total_mb: number;
  system_uptime: string;
}

export interface AlertTrendItem {
  date: string;
  count: number;
  critical: number;
  warning: number;
  info: number;
}

export interface TopAlert {
  id: string;
  type: string;
  count: number;
  level: string;
  title: string;
  created_at: string;
}

export interface RecentActivity {
  id: number;
  type: 'ai' | 'alert' | 'device' | 'report';
  description: string;
  timestamp: string;
  level?: string;
  status?: string;
}

interface ApiRes<T> {
  code: number;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------

export const dashboardAPI = {
  /** 获取总览统计数据 */
  stats: (): Promise<ApiRes<DashboardStats>> => {
    return apiClient.get<ApiRes<DashboardStats>>('/dashboard/stats');
  },

  /** 获取告警趋势（近 N 天） */
  alertTrends: (days?: number): Promise<ApiRes<AlertTrendItem[]>> => {
    const params: Record<string, number> = {};
    if (days) params.days = days;
    return apiClient.get<ApiRes<AlertTrendItem[]>>('/dashboard/trends/alerts', params);
  },

  /** 获取 Top 告警 */
  topAlerts: (): Promise<ApiRes<TopAlert[]>> => {
    return apiClient.get<ApiRes<TopAlert[]>>('/dashboard/top-alerts');
  },

  /** 获取最近活动 */
  recentActivities: (): Promise<ApiRes<RecentActivity[]>> => {
    return apiClient.get<ApiRes<RecentActivity[]>>('/dashboard/recent-activities');
  },
};
