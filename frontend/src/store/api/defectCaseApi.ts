// =============================================================================
// Defect Case API - 缺陷案例 RTK Query API Slice
// =============================================================================

import { baseApi } from './baseApi';
import type {
  DefectCase,
  DefectCaseDetail,
  DefectCaseListParams,
  DefectCaseStatistics,
  DefectEvidence,
  ReportDraft,
  CreateDefectCaseRequest,
  UpdateDefectCaseRequest,
  MergeCasesRequest,
  SplitCaseRequest,
  SetRepresentativeRequest,
  CreateReportDraftRequest,
  UpdateReportDraftRequest,
} from '@/types/api/defectCase';

// =============================================================================
// API Response wrapper helpers
// =============================================================================

interface ApiDataResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface ApiPaginatedResponse<T> {
  code: number;
  message: string;
  data: {
    data: T[];
    total: number;
    page: number;
    page_size: number;
  };
}

// =============================================================================
// RTK Query Endpoints
// =============================================================================

export const defectCaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- List ---
    listDefectCases: builder.query<DefectCase[], DefectCaseListParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
              searchParams.set(key, String(value));
            }
          });
        }
        const qs = searchParams.toString();
        return `/defect-cases${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: ApiPaginatedResponse<DefectCase>) => {
        return response.data?.data ?? [];
      },
      providesTags: ['DefectCase'],
    }),

    // --- Get Detail ---
    getDefectCase: builder.query<DefectCaseDetail, number>({
      query: (id) => `/defect-cases/${id}`,
      transformResponse: (response: ApiDataResponse<DefectCaseDetail>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'DefectCase', id }],
    }),

    // --- Create ---
    createDefectCase: builder.mutation<DefectCase, CreateDefectCaseRequest>({
      query: (body) => ({
        url: '/defect-cases',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiDataResponse<DefectCase>) => response.data,
      invalidatesTags: ['DefectCase', 'DefectCaseStatistics'],
    }),

    // --- Create from Detection ---
    createFromDetection: builder.mutation<DefectCase, string>({
      query: (detectionId) => ({
        url: `/defect-cases/from-detection/${detectionId}`,
        method: 'POST',
      }),
      transformResponse: (response: ApiDataResponse<DefectCase>) => response.data,
      invalidatesTags: ['DefectCase', 'DefectCaseStatistics'],
    }),

    // --- Update ---
    updateDefectCase: builder.mutation<DefectCase, { id: number; body: UpdateDefectCaseRequest }>({
      query: ({ id, body }) => ({
        url: `/defect-cases/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiDataResponse<DefectCase>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'DefectCase', id }, 'DefectCaseStatistics'],
    }),

    // --- Delete ---
    deleteDefectCase: builder.mutation<void, number>({
      query: (id) => ({
        url: `/defect-cases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DefectCase', 'DefectCaseStatistics'],
    }),

    // --- Merge ---
    mergeCases: builder.mutation<DefectCaseDetail, MergeCasesRequest>({
      query: (body) => ({
        url: '/defect-cases/merge',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiDataResponse<DefectCaseDetail>) => response.data,
      invalidatesTags: ['DefectCase', 'DefectCaseStatistics'],
    }),

    // --- Split ---
    splitCase: builder.mutation<DefectCase, { id: number; body: SplitCaseRequest }>({
      query: ({ id, body }) => ({
        url: `/defect-cases/${id}/split`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiDataResponse<DefectCase>) => response.data,
      invalidatesTags: ['DefectCase', 'DefectCaseStatistics'],
    }),

    // --- Set Representative ---
    setRepresentative: builder.mutation<DefectCase, { id: number; body: SetRepresentativeRequest }>({
      query: ({ id, body }) => ({
        url: `/defect-cases/${id}/representative`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiDataResponse<DefectCase>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'DefectCase', id }],
    }),

    // --- Statistics ---
    getDefectCaseStatistics: builder.query<DefectCaseStatistics, void>({
      query: () => '/defect-cases/statistics',
      transformResponse: (response: ApiDataResponse<DefectCaseStatistics>) => response.data,
      providesTags: ['DefectCaseStatistics'],
    }),

    // --- Report Draft: Create ---
    createReportDraft: builder.mutation<ReportDraft, { caseId: number; body: CreateReportDraftRequest }>({
      query: ({ caseId, body }) => ({
        url: `/defect-cases/${caseId}/drafts`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiDataResponse<ReportDraft>) => response.data,
      invalidatesTags: (_result, _error, { caseId }) => [
        { type: 'DefectCase', id: caseId },
        'ReportDraft',
      ],
    }),

    // --- Report Draft: Get ---
    getReportDraft: builder.query<ReportDraft, { caseId: number; draftId: number }>({
      query: ({ caseId, draftId }) => `/defect-cases/${caseId}/drafts/${draftId}`,
      transformResponse: (response: ApiDataResponse<ReportDraft>) => response.data,
      providesTags: (_result, _error, { draftId }) => [{ type: 'ReportDraft', id: draftId }],
    }),

    // --- Report Draft: Update ---
    updateReportDraft: builder.mutation<ReportDraft, { caseId: number; draftId: number; body: UpdateReportDraftRequest }>({
      query: ({ caseId, draftId, body }) => ({
        url: `/defect-cases/${caseId}/drafts/${draftId}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiDataResponse<ReportDraft>) => response.data,
      invalidatesTags: (_result, _error, { draftId }) => [{ type: 'ReportDraft', id: draftId }],
    }),

    // --- Report Draft: Approve ---
    approveReportDraft: builder.mutation<ReportDraft, { caseId: number; draftId: number; exportFormat?: string }>({
      query: ({ caseId, draftId, exportFormat }) => ({
        url: `/defect-cases/${caseId}/drafts/${draftId}/approve`,
        method: 'POST',
        body: exportFormat ? { export_format: exportFormat } : {},
      }),
      transformResponse: (response: ApiDataResponse<ReportDraft>) => response.data,
      invalidatesTags: (_result, _error, { caseId }) => [
        { type: 'DefectCase', id: caseId },
        'ReportDraft',
      ],
    }),

    /** 添加证据 */
    addEvidence: builder.mutation<
      { code: number; data: DefectEvidence },
      { caseId: number; body: { url: string; type?: string; caption?: string } }
    >({
      query: ({ caseId, body }) => ({
        url: `/defect-cases/${caseId}/evidence`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { caseId }) => [{ type: 'DefectCase', id: caseId }],
    }),
  }),
});

// =============================================================================
// Auto-generated hooks
// =============================================================================

export const {
  useListDefectCasesQuery,
  useGetDefectCaseQuery,
  useCreateDefectCaseMutation,
  useCreateFromDetectionMutation,
  useUpdateDefectCaseMutation,
  useDeleteDefectCaseMutation,
  useMergeCasesMutation,
  useSplitCaseMutation,
  useSetRepresentativeMutation,
  useGetDefectCaseStatisticsQuery,
  useAddEvidenceMutation,
  useCreateReportDraftMutation,
  useGetReportDraftQuery,
  useUpdateReportDraftMutation,
  useApproveReportDraftMutation,
} = defectCaseApi;
