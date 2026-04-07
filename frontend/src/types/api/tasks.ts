// =============================================================================
// Task Types - 任务类型定义
// =============================================================================

/**
 * 任务
 */
export interface Task {
  id: number;
  tenant_id: string;
  title: string;
  description: string;
  type: 'routine' | 'emergency' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee_id?: number;
  stream_ids: string; // JSON array
  due_date?: string;
  priority: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 任务列表查询参数
 */
export interface TaskListParams {
  page?: number;
  page_size?: number;
  type?: string;
  status?: string;
  priority?: string;
  keyword?: string;
}

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  type: 'routine' | 'emergency' | 'custom';
  assignee_id?: number;
  stream_ids?: number[];
  due_date?: string;
  priority?: string;
}

/**
 * 更新任务请求
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  assignee_id?: number;
  stream_ids?: number[];
  due_date?: string;
  priority?: string;
}

/**
 * 分配任务请求
 */
export interface AssignTaskRequest {
  assignee_id: number;
}