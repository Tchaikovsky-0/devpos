import { apiClient } from '../client';

export interface Stream {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  type: 'drone' | 'camera' | 'recording' | 'rtsp' | 'webrtc';
  location?: string;
  url?: string;
  lat?: number;
  lng?: number;
  tenant_id?: string;
}

export interface StreamStatistics {
  total: number;
  online: number;
  offline: number;
  warning: number;
}

export interface StreamListResponse {
  code: number;
  message: string;
  data: Stream[];
  total: number;
  page: number;
  page_size: number;
}

export const streamAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);

    const queryStr = query.toString();
    return await apiClient.get<StreamListResponse>(
      `/streams${queryStr ? '?' + queryStr : ''}`
    );
  },

  getById: async (id: string) => {
    return await apiClient.get<{ code: number; data: Stream | null }>(`/streams/${id}`);
  },

  statistics: async () => {
    return await apiClient.get<{ code: number; data: StreamStatistics }>('/streams/statistics');
  },

  create: async (data: Partial<Stream>) => {
    return await apiClient.post<{ code: number; data: Stream }>('/streams', data);
  },

  update: async (id: string, data: Partial<Stream>) => {
    return await apiClient.put<{ code: number; data: Stream }>(`/streams/${id}`, data);
  },

  delete: async (id: string) => {
    return await apiClient.delete<{ code: number; message: string }>(`/streams/${id}`);
  },
};
