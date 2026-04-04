// =============================================================================
// Alerts API Slice - 告警 API
// =============================================================================

import { baseApi } from './baseApi';
import type {
  Alert,
  AlertListParams,
  CreateAlertRequest,
  UpdateAlertRequest,
} from '@/types/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api/response';

/**
 * 告警 API slice
 * 提供告警相关的查询和变更操作
 */
export const alertsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * 获取告警列表
     */
    getAlerts: builder.query<
      PaginatedResponse<Alert>,
      AlertListParams | undefined
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size)
          searchParams.set('page_size', String(params.page_size));
        if (params?.level) searchParams.set('level', params.level);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.keyword) searchParams.set('keyword', params.keyword);
        if (params?.start_date)
          searchParams.set('start_date', params.start_date);
        if (params?.end_date) searchParams.set('end_date', params.end_date);

        const queryStr = searchParams.toString();
        return `/alerts${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Alert' as const,
                id,
              })),
              { type: 'Alert' as const, id: 'LIST' },
            ]
          : [{ type: 'Alert' as const, id: 'LIST' }],
    }),

    /**
     * 获取单个告警
     */
    getAlertById: builder.query<ApiResponse<Alert>, string>({
      query: (id) => `/alerts/${id}`,
      providesTags: (_, __, id) => [{ type: 'Alert', id }],
    }),

    /**
     * 获取告警统计
     */
    getAlertStatistics: builder.query<
      ApiResponse<{ total: number; pending: number; critical: number }>,
      void
    >({
      query: () => '/alerts/statistics',
      providesTags: ['AlertStatistics'],
    }),

    /**
     * 创建告警
     */
    createAlert: builder.mutation<ApiResponse<Alert>, CreateAlertRequest>({
      query: (data) => ({
        url: '/alerts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),

    /**
     * 更新告警
     */
    updateAlert: builder.mutation<
      ApiResponse<Alert>,
      { id: string; data: UpdateAlertRequest }
    >({
      query: ({ id, data }) => ({
        url: `/alerts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Alert', id },
        { type: 'Alert', id: 'LIST' },
      ],
    }),

    /**
     * 解决告警
     */
    resolveAlert: builder.mutation<ApiResponse<Alert>, string>({
      query: (id) => ({
        url: `/alerts/${id}`,
        method: 'PUT',
        body: { status: 'resolved' },
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Alert', id },
        { type: 'Alert', id: 'LIST' },
        'AlertStatistics',
      ],
    }),

    /**
     * 标记告警为已读
     */
    acknowledgeAlert: builder.mutation<ApiResponse<Alert>, string>({
      query: (id) => ({
        url: `/alerts/${id}`,
        method: 'PUT',
        body: { acknowledged: true },
      }),
      invalidatesTags: (_, __, id) => [{ type: 'Alert', id }],
    }),

    /**
     * 删除告警
     */
    deleteAlert: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/alerts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),
  }),
});

// 导出 hooks
export const {
  useGetAlertsQuery,
  useGetAlertByIdQuery,
  useGetAlertStatisticsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useResolveAlertMutation,
  useAcknowledgeAlertMutation,
  useDeleteAlertMutation,
} = alertsApi;
