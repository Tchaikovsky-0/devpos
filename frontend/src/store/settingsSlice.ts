import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PersonalSettings, AlertRule, DetectionSettings, NotificationChannel, SystemInfo } from '@/types/settings';

interface SettingsState {
  personal: PersonalSettings;
  alerts: AlertRule[];
  detection: DetectionSettings;
  notifications: NotificationChannel[];
  systemInfo: SystemInfo;
}

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: '火灾检测告警',
    enabled: true,
    severity: 'critical',
    conditions: {
      type: 'fire',
      threshold: 0.7,
      duration: 2,
    },
    actions: [
      { type: 'notification', channel: 'email' },
      { type: 'notification', channel: 'wechat' },
    ],
  },
  {
    id: '2',
    name: '入侵检测告警',
    enabled: true,
    severity: 'error',
    conditions: {
      type: 'intrusion',
      threshold: 0.6,
      duration: 3,
    },
    actions: [
      { type: 'notification', channel: 'dingtalk' },
    ],
  },
  {
    id: '3',
    name: '烟雾检测告警',
    enabled: false,
    severity: 'warning',
    conditions: {
      type: 'smoke',
      threshold: 0.5,
      duration: 5,
    },
    actions: [
      { type: 'notification', channel: 'email' },
    ],
  },
];

const mockNotificationChannels: NotificationChannel[] = [
  {
    id: '1',
    type: 'email',
    name: '邮件通知',
    enabled: true,
    config: {
      smtpServer: 'smtp.example.com',
      port: 587,
      from: 'alerts@example.com',
    },
  },
  {
    id: '2',
    type: 'dingtalk',
    name: '钉钉机器人',
    enabled: false,
    config: {
      webhookUrl: 'https://oapi.dingtalk.com/robot/send',
      secret: 'your-secret',
    },
  },
  {
    id: '3',
    type: 'wechat',
    name: '企业微信',
    enabled: true,
    config: {
      webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send',
      key: 'your-key',
    },
  },
];

const mockSystemInfo: SystemInfo = {
  version: 'v1.0.0',
  buildTime: '2026-04-07T10:00:00Z',
  uptime: 86400,
  resources: {
    cpu: 45.5,
    memory: 62.3,
    disk: 38.7,
  },
};

const initialState: SettingsState = {
  personal: {
    theme: 'deep',
    language: 'zh-CN',
    notifications: {
      email: true,
      dingtalk: false,
      wechat: true,
    },
  },
  alerts: mockAlertRules,
  detection: {
    models: [
      {
        id: '1',
        name: '火灾检测模型',
        type: 'fire',
        version: 'v1.2.0',
        enabled: true,
      },
      {
        id: '2',
        name: '入侵检测模型',
        type: 'intrusion',
        version: 'v1.1.0',
        enabled: true,
      },
      {
        id: '3',
        name: '裂缝检测模型',
        type: 'crack',
        version: 'v1.0.0',
        enabled: false,
      },
    ],
    confidenceThreshold: 0.5,
    debounceFrames: 3,
    roi: [],
  },
  notifications: mockNotificationChannels,
  systemInfo: mockSystemInfo,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updatePersonalSettings: (state, action: PayloadAction<Partial<PersonalSettings>>) => {
      state.personal = { ...state.personal, ...action.payload };
    },
    updateAlertRules: (state, action: PayloadAction<AlertRule[]>) => {
      state.alerts = action.payload;
    },
    addAlertRule: (state, action: PayloadAction<AlertRule>) => {
      state.alerts.push(action.payload);
    },
    updateAlertRule: (state, action: PayloadAction<AlertRule>) => {
      const index = state.alerts.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    },
    deleteAlertRule: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((r) => r.id !== action.payload);
    },
    updateDetectionSettings: (state, action: PayloadAction<Partial<DetectionSettings>>) => {
      state.detection = { ...state.detection, ...action.payload };
    },
    updateNotificationChannels: (state, action: PayloadAction<NotificationChannel[]>) => {
      state.notifications = action.payload;
    },
    updateNotificationChannel: (state, action: PayloadAction<NotificationChannel>) => {
      const index = state.notifications.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.notifications[index] = action.payload;
      }
    },
    updateSystemInfo: (state, action: PayloadAction<Partial<SystemInfo>>) => {
      state.systemInfo = { ...state.systemInfo, ...action.payload };
    },
  },
});

export const {
  updatePersonalSettings,
  updateAlertRules,
  addAlertRule,
  updateAlertRule,
  deleteAlertRule,
  updateDetectionSettings,
  updateNotificationChannels,
  updateNotificationChannel,
  updateSystemInfo,
} = settingsSlice.actions;

export default settingsSlice.reducer;
