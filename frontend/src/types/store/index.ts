// =============================================================================
// Store Types - Redux Store 类型定义
// =============================================================================

import type { AuthState } from './auth';
import type { AlertState } from './alerts';
import type { StreamState } from './streams';

/**
 * RootState - Redux store 的完整状态类型
 */
export interface RootState {
  auth: AuthState;
  alerts: AlertState;
  streams: StreamState;
}

/**
 * AppDispatch - Redux store 的 dispatch 类型
 */
export type AppDispatch = typeof import('../../store').store.dispatch;

export * from './auth';
export * from './alerts';
export * from './streams';
