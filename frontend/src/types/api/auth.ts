// =============================================================================
// Auth Types - 认证相关类型定义
// =============================================================================

import type { ApiResponse } from './response';

/**
 * 用户
 */
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: string;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * 登录响应类型
 */
export type LoginResponseType = ApiResponse<LoginResponse>;

/**
 * 用户信息响应类型
 */
export type UserResponse = ApiResponse<User>;
