// =============================================================================
// Media API Slice - 媒体库 API
// =============================================================================

import { baseApi } from './baseApi';
import type {
  MediaItem,
  StorageInfo,
  MediaListParams,
  MediaListResponse,
} from '@/types/api';
import type { FolderItem } from '@/types/api/media';
import type { DefectFamily, DefectType } from '@/types/api/defectCase';

// Re-export for convenience
export type { DefectFamily, DefectType };

// =============================================================================
// Defect Analysis Types
// =============================================================================

export interface DefectRegion {
  id: string;
  bbox: [number, number, number, number];
  defectType: DefectType;
  family: DefectFamily;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  confirmed: boolean;
}

export interface DefectAnalysisResult {
  media_id: number;
  media_url: string;
  width: number;
  height: number;
  defects: DefectRegion[];
}

export type DefectAnalysisResponse = DefectAnalysisResult[];

// DefectEvidence type for saving confirmed defects
export interface DefectEvidenceResponse {
  id: number;
  case_id: number;
  media_id: number;
  family: string;
  defect_type: string;
  severity: string;
  confidence: number;
  bbox: number[];
  created_at: string;
}

// Re-export types for backward compatibility
export type { MediaItem, FolderItem, StorageInfo };

// ============================================================================
// API Slice
// ============================================================================

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** 获取媒体文件列表（分页） */
    listMedia: builder.query<MediaListResponse, MediaListParams | undefined>({
      query: (params) => ({
        url: '/media',
        params: {
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 20,
          ...(params?.type && { type: params.type }),
          ...(params?.folder_id !== undefined && { folder_id: params.folder_id }),
          ...(params?.search && { search: params.search }),
          ...(params?.starred !== undefined && { starred: String(params.starred) }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.items.map(({ id }: MediaItem) => ({ type: 'Media' as const, id })),
              { type: 'Media' as const, id: 'LIST' },
            ]
          : [{ type: 'Media' as const, id: 'LIST' }],
    }),

    /** 获取回收站媒体列表 */
    listTrashMedia: builder.query<MediaListResponse, MediaListParams | undefined>({
      query: (params) => ({
        url: '/media/trash',
        params: {
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 20,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.items.map(({ id }: MediaItem) => ({ type: 'Media' as const, id })),
              { type: 'Media' as const, id: 'TRASH' },
            ]
          : [{ type: 'Media' as const, id: 'TRASH' }],
    }),

    /** 获取单个媒体文件 */
    getMedia: builder.query<{ code: number; data: MediaItem }, number>({
      query: (id) => `/media/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Media', id }],
    }),

    /** 上传媒体文件 */
    uploadMedia: builder.mutation<{ code: number; data: unknown }, FormData>({
      query: (formData) => ({
        url: '/media/upload',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Media', 'MediaStatistics'],
    }),

    /** 更新媒体文件信息 */
    updateMedia: builder.mutation<{ code: number; data: MediaItem }, { id: number; body: { description?: string; folder_id?: number | null } }>({
      query: ({ id, body }) => ({
        url: `/media/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Media', id }, { type: 'Media', id: 'LIST' }],
    }),

    /** 删除媒体文件 */
    deleteMedia: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/media/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Media', 'MediaStatistics'],
    }),

    /** 下载媒体文件 */
    downloadMedia: builder.query<Blob, number>({
      query: (id) => ({
        url: `/media/${id}/download`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    /** 获取文件夹列表 */
    listMediaFolders: builder.query<{ code: number; data: FolderItem[] }, { parent_id?: number | null; all?: boolean } | undefined>({
      query: (params) => {
        const queryParams: Record<string, string | number | boolean> = {};
        if (params?.parent_id !== undefined && params?.parent_id !== null) {
          queryParams.parent_id = params.parent_id;
        }
        if (params?.all) {
          queryParams.all = true;
        }
        return {
          url: '/media/folders',
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: [{ type: 'Media' as const, id: 'FOLDERS' }],
    }),

    /** 创建文件夹 */
    createMediaFolder: builder.mutation<{ code: number; data: FolderItem }, { name: string; parent_id?: number | null }>({
      query: (body) => ({
        url: '/media/folders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Media', id: 'FOLDERS' }],
    }),

    /** 更新文件夹 */
    updateMediaFolder: builder.mutation<{ code: number; data: FolderItem }, { id: number; body: { name?: string } }>({
      query: ({ id, body }) => ({
        url: `/media/folders/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Media', id: 'FOLDERS' }],
    }),

    /** 删除文件夹 */
    deleteMediaFolder: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/media/folders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Media', id: 'FOLDERS' }, { type: 'Media', id: 'LIST' }],
    }),

    /** 获取存储信息 */
    getStorageInfo: builder.query<{ code: number; data: StorageInfo }, void>({
      query: () => '/media/storage-info',
      providesTags: ['MediaStatistics'],
    }),

    // =========================================================================
    // Gallery 页面端点
    // =========================================================================

    /** 切换收藏状态 */
    toggleStar: builder.mutation<MediaItem, number>({
      query: (id) => ({ url: `/media/${id}/star`, method: 'PUT' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Media', id }, { type: 'Media', id: 'LIST' }],
    }),

    /** 移入回收站 */
    moveToTrash: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({ url: `/media/${id}/trash`, method: 'PUT' }),
      invalidatesTags: ['Media'],
    }),

    /** 从回收站恢复 */
    restoreFromTrash: builder.mutation<{ code: number; message: string }, { ids: number[] }>({
      query: (body) => ({ url: '/media/trash/restore', method: 'PUT', body }),
      invalidatesTags: ['Media'],
    }),

    /** 永久删除 */
    permanentDeleteTrash: builder.mutation<{ code: number; message: string }, { ids: number[] }>({
      query: (body) => ({ url: '/media/trash', method: 'DELETE', body }),
      invalidatesTags: ['Media', 'MediaStatistics'],
    }),

    /** 批量移动到文件夹 */
    batchMove: builder.mutation<{ code: number; message: string }, { ids: number[]; folder_id: number | null }>({
      query: (body) => ({ url: '/media/batch/move', method: 'PUT', body }),
      invalidatesTags: ['Media'],
    }),

    /** 批量删除 */
    batchDelete: builder.mutation<{ code: number; message: string }, { ids: number[] }>({
      query: (body) => ({ url: '/media/batch', method: 'DELETE', body }),
      invalidatesTags: ['Media', 'MediaStatistics'],
    }),

    /** AI 媒体分析 */
    analyzeMedia: builder.mutation<{ code: number; data: unknown }, { media_ids: number[]; analysis_type?: string }>({
      query: (body) => ({ url: '/media/analyze', method: 'POST', body }),
    }),

    /** AI 缺陷分析 - 返回带检测框的缺陷区域 */
    defectAnalyzeMedia: builder.mutation<DefectAnalysisResponse, { media_ids: number[] }>({
      query: (body) => ({ url: '/media/defect-analyze', method: 'POST', body }),
    }),

    /** 生成巡检报告 */
    generateReport: builder.mutation<{ code: number; data: unknown }, { media_ids: number[]; report_type?: string }>({
      query: (body) => ({ url: '/media/report', method: 'POST', body }),
    }),

    /** 保存缺陷证据（从AI分析确认后） */
    saveDefectEvidence: builder.mutation<{ code: number; data: DefectEvidenceResponse }, {
      media_id: number;
      family: string;
      defect_type: string;
      severity: string;
      confidence: number;
      bbox: number[];
    }>({
      query: (body) => ({ url: '/defect-cases/evidences', method: 'POST', body }),
    }),
  }),
});

export const {
  useListMediaQuery,
  useListTrashMediaQuery,
  useGetMediaQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useLazyDownloadMediaQuery,
  useListMediaFoldersQuery,
  useCreateMediaFolderMutation,
  useUpdateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useGetStorageInfoQuery,
  useToggleStarMutation,
  useMoveToTrashMutation,
  useRestoreFromTrashMutation,
  usePermanentDeleteTrashMutation,
  useBatchMoveMutation,
  useBatchDeleteMutation,
  useAnalyzeMediaMutation,
  useDefectAnalyzeMediaMutation,
  useGenerateReportMutation,
  useSaveDefectEvidenceMutation,
} = mediaApi;
