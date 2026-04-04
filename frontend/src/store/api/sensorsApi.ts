// =============================================================================
// Sensors API Slice - 传感器 API
// =============================================================================

import { baseApi } from './baseApi';
import type { Sensor, SensorData, SensorListParams, CreateSensorRequest, UpdateSensorRequest } from '@/types/api/sensors';
import type { ApiResponse, PaginatedResponse } from '@/types/api/response';

/**
 * 传感器 API slice
 * 提供传感器相关的查询和变更操作
 */
export const sensorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * 获取传感器列表
     */
    getSensors: builder.query<
      PaginatedResponse<Sensor>,
      SensorListParams | undefined
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size)
          searchParams.set('page_size', String(params.page_size));
        if (params?.type) searchParams.set('type', params.type);
        if (params?.status) searchParams.set('status', params.status);

        const queryStr = searchParams.toString();
        return `/sensors${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Sensor' as const,
                id,
              })),
              { type: 'Sensor' as const, id: 'LIST' },
            ]
          : [{ type: 'Sensor' as const, id: 'LIST' }],
    }),

    /**
     * 获取单个传感器
     */
    getSensorById: builder.query<ApiResponse<Sensor>, string>({
      query: (id) => `/sensors/${id}`,
      providesTags: (_, __, id) => [{ type: 'Sensor', id }],
    }),

    /**
     * 创建传感器
     */
    createSensor: builder.mutation<ApiResponse<Sensor>, CreateSensorRequest>({
      query: (data) => ({
        url: '/sensors',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sensor', id: 'LIST' }],
    }),

    /**
     * 更新传感器
     */
    updateSensor: builder.mutation<
      ApiResponse<Sensor>,
      { id: string; data: UpdateSensorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/sensors/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Sensor', id },
        { type: 'Sensor', id: 'LIST' },
      ],
    }),

    /**
     * 删除传感器
     */
    deleteSensor: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/sensors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Sensor', id: 'LIST' }],
    }),

    /**
     * 获取传感器数据
     */
    getSensorData: builder.query<
      PaginatedResponse<SensorData>,
      { id: string; page?: number; page_size?: number }
    >({
      query: ({ id, page, page_size }) => {
        const searchParams = new URLSearchParams();
        if (page) searchParams.set('page', String(page));
        if (page_size) searchParams.set('page_size', String(page_size));

        const queryStr = searchParams.toString();
        return `/sensors/${id}/data${queryStr ? `?${queryStr}` : ''}`;
      },
    }),
  }),
});

// 导出 hooks
export const {
  useGetSensorsQuery,
  useGetSensorByIdQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
  useGetSensorDataQuery,
} = sensorsApi;
