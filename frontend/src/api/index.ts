// =============================================================================
// API 统一导出
// =============================================================================

// Client & error types
export { apiClient, ApiError } from './client';
export type { ApiErrorBody } from './client';

// V1 API modules (auth moved to RTK Query in store/api/authApi.ts)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// export { authAPI, setToken, getToken, removeToken } from './v1/auth';
export { alertAPI } from './v1/alerts';
export { alertRuleAPI } from './v1/alertRules';
export { streamAPI } from './v1/streams';
export { reportsAPI } from './v1/reports';
export { mediaAPI } from './v1/media';
export { dashboardAPI } from './v1/dashboard';
export { copilotAPI, chatStreamFetch } from './v1/copilot';
export type { CopilotChatRequest, CopilotChatResponse, CopilotSession } from './v1/copilot';
export { roleAPI } from './v1/roles';

// Re-export types from v1 modules
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// export type { UserInfo, LoginResponse, RegisterResponse } from './v1/auth';
export type { Alert, AlertStatistics, AlertListResponse } from './v1/alerts';
export type { AlertRule, AlertRuleCondition, AlertRuleAction, AlertRuleListParams } from '@/types/alertRule';
export type { Stream, StreamStatistics, StreamListResponse } from './v1/streams';
export type { Report, ReportListResponse, CreateReportData } from './v1/reports';
export type {
  DashboardStats,
  AlertTrendItem,
  TopAlert,
  RecentActivity,
} from './v1/dashboard';
export type {
  Role as RBACRole,
  Permission as RBACPermission,
  CreateRolePayload,
  UpdateRolePayload,
  AssignRolePayload,
} from '../types/rbac';
