// =============================================================================
// Reports API Slice - 报告 API
// =============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse, PaginatedResponse } from '@/types/api/response';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Report {
  id: string;
  title: string;
  type: 'inspection' | 'incident' | 'daily' | 'weekly' | 'monthly';
  content: string;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface ReportListParams {
  page?: number;
  page_size?: number;
  type?: string;
  status?: string;
  keyword?: string;
}

export interface CreateReportRequest {
  title: string;
  type: Report['type'];
  content?: string;
}

export interface UpdateReportRequest {
  title?: string;
  type?: Report['type'];
  content?: string;
  status?: Report['status'];
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<PaginatedResponse<Report>, ReportListParams | undefined>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size) searchParams.set('page_size', String(params.page_size));
        if (params?.type) searchParams.set('type', params.type);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.keyword) searchParams.set('keyword', params.keyword);

        const queryStr = searchParams.toString();
        return `/reports${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Report' as const, id })),
              { type: 'Report' as const, id: 'LIST' },
            ]
          : [{ type: 'Report' as const, id: 'LIST' }],
    }),

    getReportById: builder.query<ApiResponse<Report>, string>({
      query: (id) => `/reports/${id}`,
      providesTags: (_, __, id) => [{ type: 'Report', id }],
    }),

    createReport: builder.mutation<ApiResponse<Report>, CreateReportRequest>({
      query: (data) => ({
        url: '/reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }],
    }),

    updateReport: builder.mutation<ApiResponse<Report>, { id: string; data: UpdateReportRequest }>({
      query: ({ id, data }) => ({
        url: `/reports/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    deleteReport: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }],
    }),

    exportReport: builder.query<Blob, { id: string; format?: 'pdf' | 'docx' | 'md' }>({
      query: ({ id, format = 'pdf' }) => ({
        url: `/reports/${id}/export?format=${format}`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useLazyExportReportQuery,
} = reportsApi;
