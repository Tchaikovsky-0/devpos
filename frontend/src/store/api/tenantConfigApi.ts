// =============================================================================
// TenantConfig API Slice - 租户配置 API
// =============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse } from '@/types/api/response';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantConfig {
  id: string;
  tenant_id: string;
  tenant_name: string;
  logo?: string;
  storage_quota: number;
  storage_used: number;
  max_devices: number;
  active_devices: number;
  ai_enabled: boolean;
  ai_model?: string;
  detection_sensitivity: 'low' | 'medium' | 'high';
  alert_notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features: {
    live_streaming: boolean;
    cloud_recording: boolean;
    ai_detection: boolean;
    reports: boolean;
    api_access: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UpdateTenantConfigRequest {
  tenant_name?: string;
  logo?: string;
  ai_enabled?: boolean;
  ai_model?: string;
  detection_sensitivity?: 'low' | 'medium' | 'high';
  alert_notifications?: TenantConfig['alert_notifications'];
  features?: Partial<TenantConfig['features']>;
}

export interface StorageInfo {
  quota: number;
  used: number;
  available: number;
  usage_percent: number;
}

export interface DeviceQuota {
  max: number;
  active: number;
  available: number;
}

export interface UsageRecord {
  date: string;
  api_calls: number;
  storage_used: number;
  alerts_generated: number;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const tenantConfigApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTenantConfig: builder.query<ApiResponse<TenantConfig>, void>({
      query: () => '/tenant/config',
      providesTags: ['TenantConfig'],
    }),

    updateTenantConfig: builder.mutation<ApiResponse<TenantConfig>, UpdateTenantConfigRequest>({
      query: (data) => ({
        url: '/tenant/config',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['TenantConfig'],
    }),

    getTenantStorage: builder.query<ApiResponse<StorageInfo>, void>({
      query: () => '/tenant/storage',
      providesTags: ['TenantConfig'],
    }),

    getTenantDevices: builder.query<ApiResponse<DeviceQuota>, void>({
      query: () => '/tenant/devices',
      providesTags: ['TenantConfig'],
    }),

    getTenantUsage: builder.query<ApiResponse<UsageRecord[]>, 'day' | 'week' | 'month' | undefined>({
      query: (period = 'month') => `/tenant/usage?period=${period}`,
      providesTags: ['TenantConfig'],
    }),

    getTenantFeatures: builder.query<ApiResponse<TenantConfig['features']>, void>({
      query: () => '/tenant/features',
      providesTags: ['TenantConfig'],
    }),

    updateTenantFeatures: builder.mutation<ApiResponse<TenantConfig['features']>, Partial<TenantConfig['features']>>({
      query: (features) => ({
        url: '/tenant/features',
        method: 'PUT',
        body: features,
      }),
      invalidatesTags: ['TenantConfig'],
    }),
  }),
});

// Export hooks
export const {
  useGetTenantConfigQuery,
  useUpdateTenantConfigMutation,
  useGetTenantStorageQuery,
  useGetTenantDevicesQuery,
  useGetTenantUsageQuery,
  useGetTenantFeaturesQuery,
  useUpdateTenantFeaturesMutation,
} = tenantConfigApi;
