import { apiClient } from '../client';
import type {
  MediaItem,
  FolderItem,
  StorageInfo,
  MediaListParams,
  FolderListParams,
  CreateFolderRequest,
  UpdateFolderRequest,
  UpdateMediaRequest,
  MediaListResponse,
} from '@/types/api/media';

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
interface ApiRes<T> {
  code: number;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Media API
// ---------------------------------------------------------------------------
export const mediaAPI = {
  /** 获取媒体文件列表（分页） */
  list: (params?: MediaListParams): Promise<MediaListResponse> => {
    const query: Record<string, string | number | boolean | undefined | null> = {};
    if (params?.page) query.page = params.page;
    if (params?.page_size) query.page_size = params.page_size;
    if (params?.folder_id !== undefined && params?.folder_id !== null) query.folder_id = params.folder_id;
    if (params?.type) query.type = params.type;
    if (params?.search) query.search = params.search;
    if (params?.starred !== undefined) query.starred = params.starred;
    if (params?.trashed !== undefined) query.trashed = params.trashed;

    return apiClient.get<MediaListResponse>('/media', query);
  },

  /** 获取单个媒体文件详情 */
  getById: (id: number): Promise<ApiRes<MediaItem>> => {
    return apiClient.get<ApiRes<MediaItem>>(`/media/${id}`);
  },

  /** 上传文件（multipart/form-data） */
  upload: (file: File, folderId?: number | null, description?: string): Promise<ApiRes<MediaItem[]>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== undefined && folderId !== null) {
      formData.append('folder_id', String(folderId));
    }
    if (description) {
      formData.append('description', description);
    }
    return apiClient.upload<ApiRes<MediaItem[]>>('/media/upload', formData);
  },

  /** 更新媒体文件信息 */
  update: (id: number, data: UpdateMediaRequest): Promise<ApiRes<MediaItem>> => {
    return apiClient.put<ApiRes<MediaItem>>(`/media/${id}`, data);
  },

  /** 删除媒体文件 */
  delete: (id: number): Promise<ApiRes<null>> => {
    return apiClient.delete<ApiRes<null>>(`/media/${id}`);
  },

  /** 收藏 / 取消收藏 */
  toggleStar: (id: number): Promise<ApiRes<MediaItem>> => {
    return apiClient.put<ApiRes<MediaItem>>(`/media/${id}/star`);
  },

  /** 获取存储空间信息 */
  storage: (): Promise<ApiRes<StorageInfo>> => {
    return apiClient.get<ApiRes<StorageInfo>>('/media/storage-info');
  },

  // -----------------------------------------------------------------------
  // Folders
  // -----------------------------------------------------------------------

  /** 获取文件夹列表 */
  getFolders: (params?: FolderListParams): Promise<ApiRes<FolderItem[]>> => {
    const query: Record<string, string | number | boolean | undefined | null> = {};
    if (params?.parent_id !== undefined) query.parent_id = params.parent_id;
    if (params?.all !== undefined) query.all = params.all;

    return apiClient.get<ApiRes<FolderItem[]>>('/media/folders', query);
  },

  /** 创建文件夹 */
  createFolder: (data: CreateFolderRequest): Promise<ApiRes<FolderItem>> => {
    return apiClient.post<ApiRes<FolderItem>>('/media/folders', data);
  },

  /** 更新文件夹 */
  updateFolder: (id: number, data: UpdateFolderRequest): Promise<ApiRes<FolderItem>> => {
    return apiClient.put<ApiRes<FolderItem>>(`/media/folders/${id}`, data);
  },

  /** 删除文件夹 */
  deleteFolder: (id: number): Promise<ApiRes<null>> => {
    return apiClient.delete<ApiRes<null>>(`/media/folders/${id}`);
  },
};
