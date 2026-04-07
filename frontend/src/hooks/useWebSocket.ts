/**
 * useWebSocket - WebSocket 连接管理 Hook
 *
 * 管理告警和 YOLO 检测的实时推送
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import {
  wsService,
  type WebSocketMessage,
  type AlertHandler,
  type YOLODetectionHandler,
  type StreamStatusHandler,
} from '@/lib/websocket';

export interface UseWebSocketOptions {
  /** 是否自动连接 */
  autoConnect?: boolean;
  /** 告警处理器（alert / alert_new） */
  onAlert?: AlertHandler;
  /** 告警更新处理器（alert_update） */
  onAlertUpdate?: AlertHandler;
  /** YOLO 检测处理器 */
  onYOLODetection?: YOLODetectionHandler;
  /** 流状态变更处理器 */
  onStreamStatus?: StreamStatusHandler;
}

export interface UseWebSocketReturn {
  /** 连接状态 */
  isConnected: boolean;
  /** 最后一条消息 */
  lastMessage: WebSocketMessage | null;
  /** 手动连接 */
  connect: () => Promise<void>;
  /** 断开连接 */
  disconnect: () => void;
  /** 发送消息 */
  sendMessage: (type: string, payload: unknown) => void;
  /** 未处理的告警数量 */
  alertCount: number;
  /** 未处理的 YOLO 检测数量 */
  detectionCount: number;
  /** 清空告警计数 */
  clearAlertCount: () => void;
  /** 清空检测计数 */
  clearDetectionCount: () => void;
}

/**
 * WebSocket Hook
 *
 * @example
 * ```tsx
 * const { isConnected, lastMessage, sendMessage, alertCount } = useWebSocket({
 *   onAlert: (alert) => {
 *     toast.warning(alert.title);
 *   },
 *   onYOLODetection: (detection) => {
 *     updateDetections(detection);
 *   },
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    onAlert,
    onAlertUpdate,
    onYOLODetection,
    onStreamStatus,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);

  const onAlertRef = useRef(onAlert);
  const onAlertUpdateRef = useRef(onAlertUpdate);
  const onYOLODetectionRef = useRef(onYOLODetection);
  const onStreamStatusRef = useRef(onStreamStatus);

  // Keep refs updated
  useEffect(() => {
    onAlertRef.current = onAlert;
    onAlertUpdateRef.current = onAlertUpdate;
    onYOLODetectionRef.current = onYOLODetection;
    onStreamStatusRef.current = onStreamStatus;
  }, [onAlert, onAlertUpdate, onYOLODetection, onStreamStatus]);

  // Connect and subscribe
  useEffect(() => {
    if (!autoConnect) return;

    // alert / alert_new → onAlert
    const unsubAlert = wsService.subscribe('alert', (message) => {
      const payload = message.payload as Parameters<AlertHandler>[0];
      setAlertCount(c => c + 1);
      setLastMessage(message);
      onAlertRef.current?.(payload);
    });

    // alert_update → onAlertUpdate (or onAlert as fallback)
    const unsubAlertUpdate = wsService.subscribe('alert_update', (message) => {
      const payload = message.payload as Parameters<AlertHandler>[0];
      setLastMessage(message);
      if (onAlertUpdateRef.current) {
        onAlertUpdateRef.current(payload);
      } else {
        onAlertRef.current?.(payload);
      }
    });

    // yolo-detection / yolo_detection
    const unsubYOLO = wsService.subscribe('yolo-detection', (message) => {
      const payload = message.payload as Parameters<YOLODetectionHandler>[0];
      setDetectionCount(c => c + 1);
      setLastMessage(message);
      onYOLODetectionRef.current?.(payload);
    });

    // stream-status / stream_status
    const unsubStream = wsService.subscribe('stream-status', (message) => {
      const payload = message.payload as Parameters<StreamStatusHandler>[0];
      setLastMessage(message);
      onStreamStatusRef.current?.(payload);
    });

    // Connect
    wsService.connect().then(() => {
      setIsConnected(true);
    }).catch(err => {
      console.error('[useWebSocket] Connect failed:', err);
      setIsConnected(false);
    });

    // Poll connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsService.isConnected);
    }, 5000);

    return () => {
      unsubAlert();
      unsubAlertUpdate();
      unsubYOLO();
      unsubStream();
      clearInterval(checkConnection);
    };
  }, [autoConnect]);

  const connect = useCallback(async () => {
    await wsService.connect();
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, payload: unknown) => {
    wsService.send({ type: type as WebSocketMessage['type'], payload });
  }, []);

  const clearAlertCount = useCallback(() => {
    setAlertCount(0);
  }, []);

  const clearDetectionCount = useCallback(() => {
    setDetectionCount(0);
  }, []);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    alertCount,
    detectionCount,
    clearAlertCount,
    clearDetectionCount,
  };
}
