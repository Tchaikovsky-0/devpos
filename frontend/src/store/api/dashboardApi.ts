// =============================================================================
// Dashboard API Slice - 监控大屏 API
// =============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types/api/response';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  total_streams: number;
  online_streams: number;
  total_alerts: number;
  pending_alerts: number;
  ai_detections: number;
  storage_used_mb: number;
  storage_total_mb: number;
  system_uptime: string;
}

export interface AlertTrend {
  date: string;
  count: number;
  critical: number;
  warning: number;
  info: number;
}

export interface DeviceStatusTrend {
  date: string;
  online: number;
  offline: number;
}

export interface TopAlert {
  id: string;
  type: string;
  count: number;
  level: 'INFO' | 'WARN' | 'CRIT';
  title?: string;
  description?: string;
  message?: string;
  created_at?: string;
  timestamp?: string;
}

export interface DashboardActivity {
  id?: string | number;
  type: 'alert' | 'device' | 'report' | 'ai';
  action?: string;
  description?: string;
  status?: string;
  level?: string;
  timestamp?: string;
  created_at?: string;
}

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  usage_percent: number;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<ApiResponse<DashboardStats>, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),

    getAlertTrends: builder.query<ApiResponse<AlertTrend[]>, number | undefined>({
      query: (days = 7) => `/dashboard/trends/alerts?days=${days}`,
      providesTags: ['Dashboard'],
    }),

    getDeviceTrends: builder.query<ApiResponse<DeviceStatusTrend[]>, number | undefined>({
      query: (days = 7) => `/dashboard/trends/devices?days=${days}`,
      providesTags: ['Dashboard'],
    }),

    getTopAlerts: builder.query<ApiResponse<TopAlert[]>, number | undefined>({
      query: (limit = 5) => `/dashboard/top-alerts?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),

    getStorageInfo: builder.query<ApiResponse<StorageInfo>, void>({
      query: () => '/dashboard/storage',
      providesTags: ['Dashboard'],
    }),

    getRecentActivities: builder.query<ApiResponse<DashboardActivity[]>, number | undefined>({
      query: (limit = 10) => `/dashboard/recent-activities?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),
  }),
});

// Export hooks
export const {
  useGetDashboardStatsQuery,
  useGetAlertTrendsQuery,
  useGetDeviceTrendsQuery,
  useGetTopAlertsQuery,
  useGetStorageInfoQuery,
  useGetRecentActivitiesQuery,
} = dashboardApi;
