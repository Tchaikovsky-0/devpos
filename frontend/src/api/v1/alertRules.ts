import { apiClient } from '../client';
import type {
  AlertRule,
  AlertRuleListParams,
  AlertRuleListResponse,
} from '@/types/alertRule';

interface AlertRuleSingleResponse {
  code: number;
  message: string;
  data: AlertRule;
}

interface AlertRuleTestResponse {
  code: number;
  message: string;
  data: { success: boolean; message: string };
}

interface AlertRuleToggleResponse {
  code: number;
  message: string;
  data: { message: string; enabled: boolean };
}

export const alertRuleAPI = {
  list: (params?: AlertRuleListParams): Promise<AlertRuleListResponse> => {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params?.page) query.page = params.page;
    if (params?.page_size) query.page_size = params.page_size;
    if (params?.enabled !== undefined) query.enabled = params.enabled;
    if (params?.type) query.type = params.type;
    return apiClient.get<AlertRuleListResponse>('/alert-rules', query);
  },

  getById: (id: number): Promise<AlertRuleSingleResponse> =>
    apiClient.get<AlertRuleSingleResponse>(`/alert-rules/${id}`),

  create: (data: {
    name: string;
    description?: string;
    type: string;
    conditions: string;
    actions: string;
    severity?: string;
    enabled?: boolean;
    cooldown_sec?: number;
  }): Promise<AlertRuleSingleResponse> =>
    apiClient.post<AlertRuleSingleResponse>('/alert-rules', data),

  update: (id: number, data: {
    name?: string;
    description?: string;
    type?: string;
    conditions?: string;
    actions?: string;
    severity?: string;
    enabled?: boolean;
    cooldown_sec?: number;
  }): Promise<AlertRuleSingleResponse> =>
    apiClient.put<AlertRuleSingleResponse>(`/alert-rules/${id}`, data),

  delete: (id: number): Promise<{ code: number; message: string }> =>
    apiClient.delete<{ code: number; message: string }>(`/alert-rules/${id}`),

  toggle: (id: number, enabled: boolean): Promise<AlertRuleToggleResponse> =>
    apiClient.put<AlertRuleToggleResponse>(`/alert-rules/${id}/toggle`, { enabled }),

  test: (id: number): Promise<AlertRuleTestResponse> =>
    apiClient.post<AlertRuleTestResponse>(`/alert-rules/test/${id}`),
};
