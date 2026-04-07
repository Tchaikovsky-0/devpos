// =============================================================================
// useWebSocketNotifications — 将 WebSocket 告警事件桥接到全局 Toast 通知系统
// =============================================================================
// 功能:
//   1. 监听 Redux websocketSlice 的 lastMessageAt 变化
//   2. 监听 wsService 的 alert 消息并 dispatch Toast
//   3. P0/P1（紧急）告警 → 播放声音 + 发送桌面通知
//   4. 流状态变化 → 简单 Toast 提示
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import { wsService, type WebSocketMessage, type AlertMessage } from '@/lib/websocket';
import { alertSoundService } from '@/services/alertSound';
import type { ToastType } from '@/components/ui/toast';

// ---------------------------------------------------------------------------
// 告警级别 → Toast 类型映射
// ---------------------------------------------------------------------------

const LEVEL_TOAST_MAP: Record<string, ToastType> = {
  P0: 'error',
  P1: 'warning',
  P2: 'warning',
  P3: 'info',
};

// ---------------------------------------------------------------------------
// 桌面通知工具
// ---------------------------------------------------------------------------

/** 请求桌面通知权限（仅在用户尚未决定时弹出） */
function requestNotificationPermission(): void {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission().catch(() => {
      // 用户拒绝或浏览器不支持，静默忽略
    });
  }
}

/** 发送桌面通知 */
function sendDesktopNotification(title: string, body: string): void {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `alert-${Date.now()}`,
    });
  } catch {
    // 部分浏览器（如移动端）不支持 new Notification，静默忽略
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseWebSocketNotificationsOptions {
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 是否播放声音，默认 true（可通过 alertNotification.isMuted 控制） */
  enableSound?: boolean;
  /** 是否启用桌面通知，默认 true */
  enableDesktopNotification?: boolean;
}

export function useWebSocketNotifications(
  options: UseWebSocketNotificationsOptions = {},
): void {
  const {
    enabled = true,
    enableSound = true,
    enableDesktopNotification = true,
  } = options;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const enableSoundRef = useRef(enableSound);
  enableSoundRef.current = enableSound;
  const enableDesktopRef = useRef(enableDesktopNotification);
  enableDesktopRef.current = enableDesktopNotification;

  // 请求桌面通知权限（首次挂载）
  useEffect(() => {
    if (enableDesktopNotification) {
      requestNotificationPermission();
    }
  }, [enableDesktopNotification]);

  // 处理告警消息
  const handleAlertMessage = useCallback((message: WebSocketMessage) => {
    if (!enabledRef.current) return;

    const payload = message.payload as AlertMessage['payload'];
    const level = payload.level ?? 'P3';
    const toastType = LEVEL_TOAST_MAP[level] ?? 'info';
    const title = payload.title || '新告警';
    const body = payload.message || '';
    const streamInfo = payload.stream_name
      ? ` · ${payload.stream_name}`
      : '';

    // 显示 Toast 通知
    toast({
      type: toastType,
      title: `[${level}] ${title}`,
      message: body + streamInfo,
      duration: level === 'P0' ? 10000 : level === 'P1' ? 8000 : 5000,
    });

    // 紧急告警 — 播放声音
    if (enableSoundRef.current && (level === 'P0' || level === 'P1')) {
      alertSoundService.play(level);
    }

    // 紧急告警 — 桌面通知
    if (enableDesktopRef.current && (level === 'P0' || level === 'P1')) {
      sendDesktopNotification(
        `🚨 ${level} 紧急告警`,
        `${title}${streamInfo}\n${body}`,
      );
    }
  }, []);

  // 处理流状态变化
  const handleStreamStatus = useCallback((message: WebSocketMessage) => {
    if (!enabledRef.current) return;

    const payload = message.payload as {
      stream_id: string;
      status: string;
      stream_name?: string;
    };

    const statusMap: Record<string, { type: ToastType; label: string }> = {
      online: { type: 'success', label: '已上线' },
      offline: { type: 'warning', label: '已离线' },
      error: { type: 'error', label: '连接异常' },
    };

    const info = statusMap[payload.status];
    if (!info) return;

    const name = payload.stream_name || `设备 ${payload.stream_id}`;
    toast({
      type: info.type,
      title: `${name} ${info.label}`,
      duration: 4000,
    });
  }, []);

  // 订阅 WebSocket 消息
  useEffect(() => {
    if (!enabled) return;

    const unsubAlert = wsService.subscribe('alert', handleAlertMessage);
    const unsubAlertNew = wsService.subscribe('alert_new', handleAlertMessage);
    const unsubStream = wsService.subscribe('stream-status', handleStreamStatus);
    const unsubStreamAlt = wsService.subscribe('stream_status', handleStreamStatus);

    return () => {
      unsubAlert();
      unsubAlertNew();
      unsubStream();
      unsubStreamAlt();
    };
  }, [enabled, handleAlertMessage, handleStreamStatus]);
}

export default useWebSocketNotifications;
