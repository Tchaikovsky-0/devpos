// =============================================================================
// useAlertNotification - 实时告警通知 Hook
// =============================================================================
// 管理 WebSocket 实时告警推送，支持：
// - 实时告警接收与排队
// - 告警声音提示
// - 未读计数
// - 告警级别过滤
// - 自动过期/清理
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { wsService, type AlertMessage } from '@/lib/websocket';
import { alertSoundService } from '@/services/alertSound';

// ── Types ──

export interface RealtimeAlert {
  id: string;
  level: 'P0' | 'P1' | 'P2' | 'P3';
  title: string;
  message: string;
  streamId: string;
  streamName?: string;
  location?: string;
  timestamp: string;
  /** 是否已读 */
  read: boolean;
  /** 是否正在显示通知 */
  showing: boolean;
}

export interface AlertNotificationState {
  /** 活跃告警列表（未读 + 未过期） */
  alerts: RealtimeAlert[];
  /** 未读告警数量 */
  unreadCount: number;
  /** P0 告警数量 */
  criticalCount: number;
  /** 当前正在显示弹窗的告警 */
  activeNotification: RealtimeAlert | null;
  /** 声音是否静音 */
  isMuted: boolean;
  /** 切换静音 */
  toggleMute: () => void;
  /** 标记告警已读 */
  markAsRead: (id: string) => void;
  /** 标记所有已读 */
  markAllAsRead: () => void;
  /** 关闭当前弹窗 */
  dismissNotification: () => void;
  /** 清除所有告警 */
  clearAll: () => void;
}

export interface UseAlertNotificationOptions {
  /** 是否自动连接 WebSocket，默认 true */
  autoConnect?: boolean;
  /** 是否启用声音，默认 true */
  enableSound?: boolean;
  /** 通知弹窗显示时长(ms)，默认 8000 */
  notificationDuration?: number;
  /** 最大保留告警数，默认 50 */
  maxAlerts?: number;
  /** 最低显示级别，低于此级别不弹窗 */
  minNotifyLevel?: 'P0' | 'P1' | 'P2' | 'P3';
  /** 是否启用 Mock 模式 */
  enableMock?: boolean;
}

// ── Level priority ──

const LEVEL_PRIORITY: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

// ── Mock data ──

const MOCK_ALERT_TEMPLATES = [
  { level: 'P0' as const, title: '火灾检测', message: '检测到明火', type: 'fire' },
  { level: 'P0' as const, title: '烟雾报警', message: '浓烟检测', type: 'smoke' },
  { level: 'P1' as const, title: '区域入侵', message: '未授权人员进入', type: 'intrusion' },
  { level: 'P1' as const, title: '设备异常', message: '摄像头信号丢失', type: 'device' },
  { level: 'P2' as const, title: '设备离线', message: '监控设备无响应', type: 'offline' },
  { level: 'P2' as const, title: '画质下降', message: '视频画面模糊', type: 'quality' },
  { level: 'P3' as const, title: '存储空间不足', message: '存储使用率超过 90%', type: 'storage' },
];

const MOCK_STREAM_NAMES = [
  '1号高炉监控', '2号车间入口', '3号仓库', '4号配电室',
  '5号走廊', '6号停车场', '7号大门', '8号天台',
];

// ── Hook ──

export function useAlertNotification(
  options: UseAlertNotificationOptions = {},
): AlertNotificationState {
  const {
    autoConnect = true,
    enableSound = true,
    notificationDuration = 8000,
    maxAlerts = 50,
    minNotifyLevel = 'P2',
    enableMock = true,
  } = options;

  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [activeNotification, setActiveNotification] = useState<RealtimeAlert | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxAlertsRef = useRef(maxAlerts);
  maxAlertsRef.current = maxAlerts;

  // Add a new alert
  const addAlert = useCallback(
    (alert: Omit<RealtimeAlert, 'id' | 'read' | 'showing'>) => {
      const newAlert: RealtimeAlert = {
        ...alert,
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        read: false,
        showing: false,
      };

      setAlerts((prev) => {
        const next = [newAlert, ...prev].slice(0, maxAlertsRef.current);
        return next;
      });

      // Show notification if level meets threshold
      const minPriority = LEVEL_PRIORITY[minNotifyLevel] ?? 2;
      const alertPriority = LEVEL_PRIORITY[alert.level] ?? 3;

      if (alertPriority <= minPriority) {
        setActiveNotification((prev) => {
          // If there's already a notification, only replace if new alert is higher priority
          if (prev && LEVEL_PRIORITY[prev.level] <= alertPriority) {
            return prev;
          }
          return newAlert;
        });

        // Play sound
        if (enableSound && !isMuted) {
          alertSoundService.play(alert.level);
        }

        // Auto dismiss after duration
        if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current);
        }
        notificationTimerRef.current = setTimeout(() => {
          setActiveNotification(null);
        }, notificationDuration);
      }

      return newAlert;
    },
    [enableSound, isMuted, minNotifyLevel, notificationDuration],
  );

  // WebSocket integration
  useEffect(() => {
    if (!autoConnect) return;

    const unsubscribe = wsService.subscribe('alert', (message) => {
      const payload = message.payload as AlertMessage['payload'];
      addAlert({
        level: payload.level,
        title: payload.title,
        message: payload.message,
        streamId: payload.stream_id,
        streamName: payload.stream_name,
        location: payload.location,
        timestamp: payload.created_at,
      });
    });

    const checkInterval = setInterval(() => {
      setWsConnected(wsService.isConnected);
    }, 3000);
    setWsConnected(wsService.isConnected);

    wsService.connect().catch(() => {
      // Connection failed
    });

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, [autoConnect, addAlert]);

  // Mock mode
  useEffect(() => {
    if (!enableMock || wsConnected) return;

    const timer = setInterval(() => {
      const template = MOCK_ALERT_TEMPLATES[Math.floor(Math.random() * MOCK_ALERT_TEMPLATES.length)];
      const streamIdx = Math.floor(Math.random() * MOCK_STREAM_NAMES.length);

      addAlert({
        level: template.level,
        title: template.title,
        message: template.message,
        streamId: String(streamIdx + 1),
        streamName: MOCK_STREAM_NAMES[streamIdx],
        location: `区域${streamIdx + 1}`,
        timestamp: new Date().toISOString(),
      });
    }, 8000 + Math.random() * 12000); // 8-20 seconds

    return () => clearInterval(timer);
  }, [enableMock, wsConnected, addAlert]);

  // Actions
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      alertSoundService.setMuted(!prev);
      return !prev;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
    setActiveNotification(null);
  }, []);

  // Computed
  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts],
  );

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.level === 'P0' && !a.read).length,
    [alerts],
  );

  return {
    alerts,
    unreadCount,
    criticalCount,
    activeNotification,
    isMuted,
    toggleMute,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  };
}

export default useAlertNotification;
