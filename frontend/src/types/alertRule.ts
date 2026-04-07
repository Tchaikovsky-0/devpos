/**
 * AlertRule Types - 告警规则类型定义
 */

export interface AlertRuleCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'contains';
  threshold: number;
  duration: number;
}

export interface AlertRuleAction {
  type: 'email' | 'dingtalk' | 'wechat' | 'webhook';
  target: string;
  config?: string;
}

export interface AlertRule {
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  type: string;
  conditions: AlertRuleCondition;
  actions: AlertRuleAction[];
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldown_sec: number;
  last_fired_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AlertRuleListResponse {
  code: number;
  message: string;
  data: {
    items: AlertRule[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface AlertRuleListParams {
  page?: number;
  page_size?: number;
  enabled?: boolean;
  type?: string;
}
