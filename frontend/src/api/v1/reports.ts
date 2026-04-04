import { apiClient } from '../client';

export interface Report {
  id: string;
  title: string;
  type: 'inspection' | 'incident' | 'daily' | 'weekly' | 'monthly';
  content: string;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface ReportListResponse {
  code: number;
  message: string;
  data: Report[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateReportData {
  title: string;
  type: Report['type'];
  content: string;
}

export const reportsAPI = {
  list: (params?: {
    page?: number;
    page_size?: number;
    type?: string;
    status?: string;
    keyword?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.keyword) query.set('keyword', params.keyword);

    const queryStr = query.toString();
    return apiClient.get<ReportListResponse>(`/reports${queryStr ? '?' + queryStr : ''}`);
  },

  getById: (id: string) => {
    return apiClient.get<{ code: number; data: Report }>(`/reports/${id}`);
  },

  create: (data: CreateReportData) => {
    return apiClient.post<{ code: number; data: Report }>('/reports', data);
  },

  update: (id: string, data: Partial<CreateReportData>) => {
    return apiClient.put<{ code: number; data: Report }>(`/reports/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete<{ code: number; message: string }>(`/reports/${id}`);
  },

  export: (id: string, format: 'pdf' | 'docx' | 'md' = 'pdf') => {
    return apiClient.get<Blob>(`/reports/${id}/export?format=${format}`);
  },

  generateInspectionReport: (streamIds?: string[]) => {
    return apiClient.post<{ code: number; data: Report }>('/reports/generate/inspection', {
      stream_ids: streamIds
    });
  },
};
