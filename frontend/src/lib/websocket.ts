/**
 * WebSocket Service - WebSocket 连接管理
 *
 * 支持实时告警、YOLO 检测结果推送
 */

export type WebSocketMessageType =
  | 'alert'
  | 'yolo-detection'
  | 'stream-status'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: string;
}

export interface AlertMessage {
  type: 'alert';
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
  type: 'yolo-detection';
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
  type: 'stream-status';
  payload: {
    stream_id: string;
    status: 'online' | 'offline' | 'connecting' | 'error';
  };
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: number | null = null;
  private isConnecting = false;

  constructor(url: string) {
    this.url = url;
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

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
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

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.stopPing();
          this.handleReconnect();
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
    this.stopPing();
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
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  /**
   * 重新连接
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch(err => {
        console.error('[WebSocket] Reconnect failed:', err);
      });
    }, delay);
  }

  /**
   * 发送 ping
   */
  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping', payload: null });
    }, 30000);
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
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8094';

export const wsService = new WebSocketService(`${WS_BASE_URL}/ws`);

// 导出类型别名，方便使用
export type AlertHandler = (alert: AlertMessage['payload']) => void;
export type YOLODetectionHandler = (detection: YOLODetectionMessage['payload']) => void;
export type StreamStatusHandler = (status: StreamStatusMessage['payload']) => void;
