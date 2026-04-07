// =============================================================================
// Auth State Type - 认证状态类型
// =============================================================================

import type { User } from '../api/auth';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
