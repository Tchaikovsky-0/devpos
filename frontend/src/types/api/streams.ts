// =============================================================================
// Stream Types - 视频流相关类型定义
// =============================================================================

import type { ApiResponse, PaginatedResponse } from './response';

/**
 * 视频流状态
 */
export type StreamStatus = 'online' | 'offline' | 'warning' | 'error';

/**
 * 视频流类型
 */
export type StreamType = 'drone' | 'camera' | 'recording' | 'rtsp' | 'webrtc';

/**
 * 视频流
 */
export interface Stream {
  id: string;
  name: string;
  status: StreamStatus;
  type: StreamType;
  location?: string;
  url?: string;
  lat?: number;
  lng?: number;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 视频流统计
 */
export interface StreamStatistics {
  total: number;
  online: number;
  offline: number;
  warning: number;
}

/**
 * 视频流列表响应
 */
export type StreamListResponse = PaginatedResponse<Stream>;

/**
 * 视频流响应
 */
export type StreamResponse = ApiResponse<Stream | null>;

/**
 * 视频流统计响应
 */
export type StreamStatisticsResponse = ApiResponse<StreamStatistics>;

/**
 * 视频流列表参数
 */
export interface StreamListParams {
  page?: number;
  page_size?: number;
  status?: StreamStatus;
  type?: StreamType;
}

/**
 * 创建视频流请求
 */
export interface CreateStreamRequest {
  name: string;
  type: StreamType;
  url?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

/**
 * 更新视频流请求
 */
export interface UpdateStreamRequest {
  name?: string;
  status?: StreamStatus;
  url?: string;
  location?: string;
}

/**
 * 网格布局类型
 */
export type StreamLayout = '1x1' | '2x2' | '3x3' | '4x4';

/**
 * 获取布局网格数量
 */
export function getLayoutCount(layout: StreamLayout): number {
  const map: Record<StreamLayout, number> = {
    '1x1': 1,
    '2x2': 4,
    '3x3': 9,
    '4x4': 16,
  };
  return map[layout];
}
