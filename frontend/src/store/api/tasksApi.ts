// =============================================================================
// Tasks API Slice - 任务 API
// =============================================================================

import { baseApi } from './baseApi';
import type { Task, TaskListParams, CreateTaskRequest, UpdateTaskRequest, AssignTaskRequest } from '@/types/api/tasks';
import type { ApiResponse, PaginatedResponse } from '@/types/api/response';

/**
 * 任务 API slice
 * 提供任务相关的查询和变更操作
 */
export const tasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * 获取任务列表
     */
    getTasks: builder.query<
      PaginatedResponse<Task>,
      TaskListParams | undefined
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size)
          searchParams.set('page_size', String(params.page_size));
        if (params?.type) searchParams.set('type', params.type);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.priority) searchParams.set('priority', params.priority);

        const queryStr = searchParams.toString();
        return `/tasks${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.items.map(({ id }) => ({
                type: 'Task' as const,
                id,
              })),
              { type: 'Task' as const, id: 'LIST' },
            ]
          : [{ type: 'Task' as const, id: 'LIST' }],
    }),

    /**
     * 获取单个任务
     */
    getTaskById: builder.query<ApiResponse<Task>, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_, __, id) => [{ type: 'Task', id }],
    }),

    /**
     * 创建任务
     */
    createTask: builder.mutation<ApiResponse<Task>, CreateTaskRequest>({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    /**
     * 更新任务
     */
    updateTask: builder.mutation<
      ApiResponse<Task>,
      { id: string; data: UpdateTaskRequest }
    >({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    /**
     * 删除任务
     */
    deleteTask: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    /**
     * 分配任务
     */
    assignTask: builder.mutation<
      ApiResponse<Task>,
      { id: string; data: AssignTaskRequest }
    >({
      query: ({ id, data }) => ({
        url: `/tasks/${id}/assign`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    /**
     * 完成任务
     */
    completeTask: builder.mutation<ApiResponse<Task>, string>({
      query: (id) => ({
        url: `/tasks/${id}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

// 导出 hooks
export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAssignTaskMutation,
  useCompleteTaskMutation,
} = tasksApi;