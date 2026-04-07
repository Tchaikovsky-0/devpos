// =============================================================================
// RTK Query Base API - 基础 API 配置
// =============================================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API 基础 URL
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8094') + '/api/v1';

/**
 * 基础 API slice
 * 所有 API slice 都应该基于此创建
 * - 自动添加 Authorization header
 * - 5 分钟缓存
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Alert',
    'AlertStatistics',
    'Stream',
    'StreamStatistics',
    'Sensor',
    'Task',
    'User',
    'Report',
    'Dashboard',
    'TenantConfig',
    'DefectCase',
    'DefectCaseStatistics',
    'ReportDraft',
    'Media',
    'MediaStatistics',
    'OpenClawMission',
    'OpenClawMissionStatistics',
    'AutomationTemplate',
  ],
  endpoints: () => ({}),
});
