/**
 * WebSocket Service - WebSocket 连接管理
 *
 * 支持实时告警、YOLO 检测结果推送
 * - 连接时自动携带 JWT token
 * - 指数退避自动重连（最大 30s）
 * - 30s 心跳 ping
 */

export type WebSocketMessageType =
  | 'alert'
  | 'alert_new'
  | 'alert_update'
  | 'yolo-detection'
  | 'yolo_detection'
  | 'stream-status'
  | 'stream_status'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: string;
}

export interface AlertMessage {
  type: 'alert' | 'alert_new';
  payload: {
    id: string;
    level: 'P0' | 'P1' | 'P2' | 'P3';
    title: string;
    message: string;
    stream_id: string;
    stream_name?: string;
    location?: string;
    created_at: string;
  };
}

export interface YOLODetectionMessage {
  type: 'yolo-detection' | 'yolo_detection';
  payload: {
    stream_id: string;
    timestamp: string;
    detections: Array<{
      class: string;
      confidence: number;
      bbox: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0-1
    }>;
  };
}

export interface StreamStatusMessage {
  type: 'stream-status' | 'stream_status';
  payload: {
    stream_id: string;
    status: 'online' | 'offline' | 'connecting' | 'error';
  };
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: number | null = null;
  private isConnecting = false;
  private manualDisconnect = false;

  /** Maximum reconnect delay in milliseconds */
  private readonly MAX_RECONNECT_DELAY = 30_000;
  /** Base delay for exponential backoff */
  private readonly BASE_RECONNECT_DELAY = 1_000;
  /** Ping interval in milliseconds */
  private readonly PING_INTERVAL = 30_000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build the WS URL with JWT token query param
   */
  private buildUrl(): string {
    const token = localStorage.getItem('token');
    if (token) {
      const separator = this.baseUrl.includes('?') ? '&' : '?';
      return `${this.baseUrl}${separator}token=${encodeURIComponent(token)}`;
    }
    return this.baseUrl;
  }

  /**
   * 连接 WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.manualDisconnect = false;

      try {
        const url = this.buildUrl();
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          console.info('[WebSocket] Connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (err) {
            console.error('[WebSocket] Failed to parse message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.stopPing();
          console.warn(`[WebSocket] Closed (code=${event.code})`);
          if (!this.manualDisconnect) {
            this.handleReconnect();
          }
        };
      } catch (err) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.manualDisconnect = true;
    this.stopPing();
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * 订阅消息类型
   */
  subscribe(type: WebSocketMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * 发送消息
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  /**
   * 处理接收到的消息 — 同时派发到规范化和带下划线的键
   */
  private handleMessage(message: WebSocketMessage): void {
    // Direct type match
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Normalise underscore ↔ dash aliases so both naming styles trigger handlers
    const aliasMap: Record<string, WebSocketMessageType> = {
      'alert_new': 'alert',
      'alert_update': 'alert',
      'yolo_detection': 'yolo-detection',
      'stream_status': 'stream-status',
    };
    const alias = aliasMap[message.type];
    if (alias) {
      const aliasHandlers = this.handlers.get(alias);
      if (aliasHandlers) {
        aliasHandlers.forEach(handler => handler(message));
      }
    }
  }

  /**
   * 指数退避重连（最大 30s）
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY,
    );

    console.info(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => {
        console.error('[WebSocket] Reconnect failed:', err);
      });
    }, delay);
  }

  /**
   * 清除重连计时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 发送 ping（每 30 秒）
   */
  private startPing(): void {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping', payload: null });
    }, this.PING_INTERVAL);
  }

  /**
   * 停止 ping
   */
  private stopPing(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 创建 WebSocket 服务实例
function resolveWsUrl(): string {
  // 优先使用环境变量（带 /ws 后缀）
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) {
    return envUrl.endsWith('/ws') ? envUrl : `${envUrl}/ws`;
  }
  // 生产环境：从当前页面协议和主机派生，走 Nginx /api/v1/ws
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1/ws`;
  }
  // 开发环境默认
  return 'ws://localhost:8094/ws';
}

export const wsService = new WebSocketService(resolveWsUrl());

// 导出类型别名，方便使用
export type AlertHandler = (alert: AlertMessage['payload']) => void;
export type YOLODetectionHandler = (detection: YOLODetectionMessage['payload']) => void;
export type StreamStatusHandler = (status: StreamStatusMessage['payload']) => void;
