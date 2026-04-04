import { apiClient } from '../client';

export interface Alert {
  id: string;
  level: 'INFO' | 'WARN' | 'CRIT' | 'OFFLINE';
  type: string;
  title: string;
  message: string;
  location?: string;
  status: 'pending' | 'resolved' | 'false_alarm';
  acknowledged: boolean;
  stream_id?: string;
  tenant_id?: string;
  created_at: string;
}

export interface AlertStatistics {
  total: number;
  pending: number;
  critical: number;
}

export interface AlertListResponse {
  code: number;
  message: string;
  data: Alert[];
  total: number;
  page: number;
  page_size: number;
}

export const alertAPI = {
  list: (params?: {
    page?: number;
    page_size?: number;
    level?: string;
    status?: string;
    keyword?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    if (params?.level) query.set('level', params.level);
    if (params?.status) query.set('status', params.status);
    if (params?.keyword) query.set('keyword', params.keyword);

    const queryStr = query.toString();
    return apiClient.get<AlertListResponse>(`/alerts${queryStr ? '?' + queryStr : ''}`);
  },

  getById: (id: string) => {
    return apiClient.get<{ code: number; data: Alert }>(`/alerts/${id}`);
  },

  create: (data: Partial<Alert>) => {
    return apiClient.post<{ code: number; data: Alert }>('/alerts', data);
  },

  update: (id: string, data: Partial<Alert>) => {
    return apiClient.put<{ code: number; data: Alert }>(`/alerts/${id}`, data);
  },

  statistics: () => {
    return apiClient.get<{ code: number; data: AlertStatistics }>('/alerts/statistics');
  },
};
