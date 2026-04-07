// =============================================================================
// Auth API Slice - 认证 API
// =============================================================================

import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: string;
  tenant_id: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user: UserInfo;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface RegisterResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      tenant_id: string;
    };
  };
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    getUserInfo: builder.query<{ code: number; message: string; data: UserInfo }, void>({
      query: () => '/user/info',
      providesTags: ['User'],
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUserInfoQuery,
} = authApi;
