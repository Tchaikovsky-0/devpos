// =============================================================================
// OpenClaw API Slice - OpenClaw 对话 + 任务 + 自动化模板 API
// =============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types/api/response';

// =============================================================================
// Chat / Conversation Types
// =============================================================================

export interface ChatContext {
  module: string;
  objectType?: string;
  objectId?: string;
}

export interface SendMessageRequest {
  message: string;
  context?: ChatContext;
  conversationId?: string;
}

export interface ChatAction {
  type: string;
  label: string;
  payload: unknown;
}

export interface ChatMessageResponse {
  id: string;
  role: 'assistant';
  content: string;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ConversationHistory {
  conversationId: string;
  messages: ConversationMessage[];
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unavailable';
  version?: string;
}

// =============================================================================
// Mission / Template Types
// =============================================================================

export interface OpenClawMission {
  id: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary: string;
  inspection_type: string;
  sensitivity: number;
  related_modules: string;
  score: number;
  findings_count: number;
  creator_id: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

export interface OpenClawMissionStatistics {
  total: number;
  running: number;
  completed: number;
  failed: number;
  pending: number;
}

export interface AutomationTemplate {
  id: number;
  name: string;
  description: string;
  trigger: 'cron' | 'manual' | 'event';
  trigger_config: string;
  actions: string[];
  enabled: boolean;
  is_built_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMissionRequest {
  title: string;
  inspection_type?: string;
  sensitivity?: number;
  related_modules?: string[];
}

export interface UpdateMissionRequest {
  title?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  summary?: string;
  score?: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  trigger: 'cron' | 'manual' | 'event';
  trigger_config?: string;
  actions?: string[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  trigger?: 'cron' | 'manual' | 'event';
  trigger_config?: string;
  actions?: string[];
  enabled?: boolean;
}

// =============================================================================
// API Slice
// =============================================================================

export const openclawApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Chat / Conversation ---
    checkOpenClawHealth: builder.query<ApiResponse<HealthStatus>, void>({
      query: () => '/openclaw/health',
    }),

    sendChatMessage: builder.mutation<ApiResponse<ChatMessageResponse>, SendMessageRequest>({
      query: (data) => ({
        url: '/openclaw/chat',
        method: 'POST',
        body: data,
      }),
    }),

    getConversationHistory: builder.query<
      ApiResponse<ConversationHistory>,
      { conversationId: string } | void
    >({
      query: (params) =>
        params?.conversationId
          ? `/openclaw/chat/history?conversation_id=${params.conversationId}`
          : '/openclaw/chat/history',
    }),

    // --- Missions ---
    listMissions: builder.query<
      { code: number; data: OpenClawMission[]; total: number; page: number; page_size: number },
      { page?: number; page_size?: number } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size) searchParams.set('page_size', String(params.page_size));
        const qs = searchParams.toString();
        return `/openclaw/missions${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'OpenClawMission' as const, id })),
              { type: 'OpenClawMission' as const, id: 'LIST' },
            ]
          : [{ type: 'OpenClawMission' as const, id: 'LIST' }],
    }),

    getMissionStatistics: builder.query<ApiResponse<OpenClawMissionStatistics>, void>({
      query: () => '/openclaw/missions/statistics',
      providesTags: ['OpenClawMissionStatistics'],
    }),

    getMission: builder.query<ApiResponse<OpenClawMission>, number>({
      query: (id) => `/openclaw/missions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'OpenClawMission' as const, id }],
    }),

    createMission: builder.mutation<ApiResponse<OpenClawMission>, CreateMissionRequest>({
      query: (data) => ({
        url: '/openclaw/missions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'OpenClawMission' as const, id: 'LIST' },
        'OpenClawMissionStatistics',
      ],
    }),

    updateMission: builder.mutation<
      ApiResponse<OpenClawMission>,
      { id: number; data: UpdateMissionRequest }
    >({
      query: ({ id, data }) => ({
        url: `/openclaw/missions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'OpenClawMission' as const, id },
        { type: 'OpenClawMission' as const, id: 'LIST' },
        'OpenClawMissionStatistics',
      ],
    }),

    deleteMission: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/openclaw/missions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'OpenClawMission' as const, id: 'LIST' },
        'OpenClawMissionStatistics',
      ],
    }),

    // --- Automation Templates ---
    listTemplates: builder.query<ApiResponse<AutomationTemplate[]>, void>({
      query: () => '/openclaw/templates',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'AutomationTemplate' as const, id })),
              { type: 'AutomationTemplate' as const, id: 'LIST' },
            ]
          : [{ type: 'AutomationTemplate' as const, id: 'LIST' }],
    }),

    getTemplate: builder.query<ApiResponse<AutomationTemplate>, number>({
      query: (id) => `/openclaw/templates/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AutomationTemplate' as const, id }],
    }),

    createTemplate: builder.mutation<ApiResponse<AutomationTemplate>, CreateTemplateRequest>({
      query: (data) => ({
        url: '/openclaw/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'AutomationTemplate' as const, id: 'LIST' }],
    }),

    updateTemplate: builder.mutation<
      ApiResponse<AutomationTemplate>,
      { id: number; data: UpdateTemplateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/openclaw/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AutomationTemplate' as const, id },
        { type: 'AutomationTemplate' as const, id: 'LIST' },
      ],
    }),

    deleteTemplate: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/openclaw/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AutomationTemplate' as const, id: 'LIST' }],
    }),
  }),
});

export const {
  useCheckOpenClawHealthQuery,
  useSendChatMessageMutation,
  useGetConversationHistoryQuery,
  useListMissionsQuery,
  useGetMissionStatisticsQuery,
  useGetMissionQuery,
  useCreateMissionMutation,
  useUpdateMissionMutation,
  useDeleteMissionMutation,
  useListTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = openclawApi;
