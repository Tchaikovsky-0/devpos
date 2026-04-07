export type Theme = 'deep' | 'balanced' | 'clear';
export type Language = 'zh-CN' | 'en-US';

export interface PersonalSettings {
  theme: Theme;
  language: Language;
  notifications: {
    email: boolean;
    dingtalk: boolean;
    wechat: boolean;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  conditions: {
    type: string;
    threshold: number;
    duration: number;
  };
  actions: Array<{
    type: 'notification' | 'webhook';
    channel: string;
  }>;
}

export interface DetectionModel {
  id: string;
  name: string;
  type: 'fire' | 'intrusion' | 'crack' | 'smoke' | 'vehicle';
  version: string;
  enabled: boolean;
}

export interface DetectionSettings {
  models: DetectionModel[];
  confidenceThreshold: number;
  debounceFrames: number;
  roi: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'dingtalk' | 'wechat' | 'webhook';
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SystemInfo {
  version: string;
  buildTime: string;
  uptime: number;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}
