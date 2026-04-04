// =============================================================================
// Streams API Slice - 视频流 API
// =============================================================================

import { baseApi } from './baseApi';
import type {
  Stream,
  StreamListParams,
  CreateStreamRequest,
  UpdateStreamRequest,
} from '@/types/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api/response';

/**
 * 视频流 API slice
 * 提供视频流相关的查询和变更操作
 */
export const streamsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * 获取视频流列表
     */
    getStreams: builder.query<
      PaginatedResponse<Stream>,
      StreamListParams | undefined
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size)
          searchParams.set('page_size', String(params.page_size));
        if (params?.status) searchParams.set('status', params.status);
        if (params?.type) searchParams.set('type', params.type);

        const queryStr = searchParams.toString();
        return `/streams${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Stream' as const,
                id,
              })),
              { type: 'Stream' as const, id: 'LIST' },
            ]
          : [{ type: 'Stream' as const, id: 'LIST' }],
    }),

    /**
     * 获取单个视频流
     */
    getStreamById: builder.query<ApiResponse<Stream | null>, string>({
      query: (id) => `/streams/${id}`,
      providesTags: (_, __, id) => [{ type: 'Stream', id }],
    }),

    /**
     * 获取视频流统计
     */
    getStreamStatistics: builder.query<
      ApiResponse<{
        total: number;
        online: number;
        offline: number;
        warning: number;
      }>,
      void
    >({
      query: () => '/streams/statistics',
      providesTags: ['StreamStatistics'],
    }),

    /**
     * 创建视频流
     */
    createStream: builder.mutation<ApiResponse<Stream>, CreateStreamRequest>({
      query: (data) => ({
        url: '/streams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Stream', id: 'LIST' }],
    }),

    /**
     * 更新视频流
     */
    updateStream: builder.mutation<
      ApiResponse<Stream>,
      { id: string; data: UpdateStreamRequest }
    >({
      query: ({ id, data }) => ({
        url: `/streams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Stream', id },
        { type: 'Stream', id: 'LIST' },
      ],
    }),

    /**
     * 删除视频流
     */
    deleteStream: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/streams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Stream', id: 'LIST' }],
    }),
  }),
});

// 导出 hooks
export const {
  useGetStreamsQuery,
  useGetStreamByIdQuery,
  useGetStreamStatisticsQuery,
  useCreateStreamMutation,
  useUpdateStreamMutation,
  useDeleteStreamMutation,
} = streamsApi;
