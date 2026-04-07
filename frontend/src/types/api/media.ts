// =============================================================================
// Media API Types - 媒体库统一类型定义
// =============================================================================

/**
 * 媒体文件项
 */
export interface MediaItem {
  id: number;
  tenant_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  folder_id: number | null;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  user_id: number | null;
  description: string;
  starred: boolean;
  created_at: string;
  updated_at: string;
  trashed_at?: string | null;
}

/**
 * 文件夹项
 */
export interface FolderItem {
  id: number;
  tenant_id: string;
  name: string;
  parent_id: number | null;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * 存储空间信息
 */
export interface StorageInfo {
  quota_bytes: number;
  used_bytes: number;
  usage_percent: number;
  total_files: number;
  by_type: StorageTypeInfo[];
}

export interface StorageTypeInfo {
  type: string;
  count: number;
  size: number;
}

/**
 * 媒体列表查询参数
 */
export interface MediaListParams {
  page?: number;
  page_size?: number;
  folder_id?: number | null;
  type?: string;
  search?: string;
  starred?: boolean;
  trashed?: boolean;
}

/**
 * 文件夹列表查询参数
 */
export interface FolderListParams {
  parent_id?: number;
  all?: boolean;
}

/**
 * 创建文件夹请求
 */
export interface CreateFolderRequest {
  name: string;
  parent_id?: number | null;
}

/**
 * 更新文件夹请求
 */
export interface UpdateFolderRequest {
  name?: string;
}

/**
 * 更新媒体文件请求
 */
export interface UpdateMediaRequest {
  description?: string;
  folder_id?: number | null;
}

/**
 * 媒体列表响应（分页）
 * Backend wraps in { code, message, data: { items, total, page, page_size } }
 */
export interface MediaListResponse {
  code: number;
  message: string;
  data: {
    items: MediaItem[];
    total: number;
    page: number;
    page_size: number;
  };
}
