// =============================================================================
// Alerts State Type - 告警状态类型
// =============================================================================

import type { Alert, AlertLevel, AlertStatus } from '../api/alerts';

export interface AlertStoreFilter {
  level?: AlertLevel;
  status?: AlertStatus;
  keyword?: string;
}

export interface AlertState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  filter: AlertStoreFilter;
}
