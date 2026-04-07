// =============================================================================
// Media Page - 共享类型定义
// =============================================================================

/** 面包屑导航项 */
export interface BreadcrumbItem {
  id: number | null; // null = 根目录
  name: string;
}

/** 上传任务状态 */
export interface UploadTask {
  id: string;
  file: File;
  progress: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}
