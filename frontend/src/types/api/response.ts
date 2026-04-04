// =============================================================================
// API Response Types - 通用 API 响应类型定义
// =============================================================================

/**
 * 通用 API 响应结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  page_size: number;
}

/**
 * API 错误响应
 */
export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, string[]>;
}

/**
 * 基础查询参数
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * 基础筛选参数
 */
export interface FilterParams {
  keyword?: string;
  status?: string;
  level?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 列表查询参数 = 分页 + 筛选
 */
export type ListParams = PaginationParams & FilterParams;

/**
 * 通用列表响应转换函数
 */
export function extractListData<T>(response: PaginatedResponse<T>): {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  return {
    items: response.data,
    total: response.total,
    page: response.page,
    pageSize: response.page_size,
    totalPages: Math.ceil(response.total / response.page_size),
  };
}
