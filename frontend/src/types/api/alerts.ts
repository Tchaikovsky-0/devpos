// =============================================================================
// Alert Types - 告警相关类型定义
// =============================================================================

import type { ApiResponse, PaginatedResponse } from './response';

/**
 * 告警级别
 */
export type AlertLevel = 'INFO' | 'WARN' | 'CRIT' | 'OFFLINE';

/**
 * 告警状态
 */
export type AlertStatus = 'pending' | 'resolved' | 'false_alarm';

/**
 * 告警
 */
export interface Alert {
  id: string;
  level: AlertLevel;
  type: string;
  title: string;
  message: string;
  location?: string;
  status: AlertStatus;
  acknowledged: boolean;
  stream_id?: string;
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 告警统计数据
 */
export interface AlertStatistics {
  total: number;
  pending: number;
  critical: number;
  resolved?: number;
  false_alarm?: number;
}

/**
 * 告警列表响应
 */
export type AlertListResponse = PaginatedResponse<Alert>;

/**
 * 告警响应
 */
export type AlertResponse = ApiResponse<Alert>;

/**
 * 告警统计数据响应
 */
export type AlertStatisticsResponse = ApiResponse<AlertStatistics>;

/**
 * 告警筛选参数
 */
export interface AlertListParams {
  page?: number;
  page_size?: number;
  level?: AlertLevel;
  status?: AlertStatus;
  keyword?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 创建告警请求
 */
export interface CreateAlertRequest {
  level: AlertLevel;
  type: string;
  title: string;
  message: string;
  location?: string;
  stream_id?: string;
}

/**
 * 更新告警请求
 */
export interface UpdateAlertRequest {
  level?: AlertLevel;
  status?: AlertStatus;
  acknowledged?: boolean;
}
