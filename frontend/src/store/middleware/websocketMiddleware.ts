// =============================================================================
// WebSocket Redux Middleware - 核心中间件
// =============================================================================
//
// 功能:
//   1. 连接管理（监听 websocket/connect, websocket/disconnect）
//   2. 指数退避自动重连（1s → max 30s, 最多 20 次）
//   3. 消息处理 — 通过 api.util.updateQueryData 注入 RTK Query 缓存
//   4. 心跳 ping/pong（30s ping, 45s 超时）
//   5. 页面卸载时自动清理
// =============================================================================

import type { Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import {
  wsConnect,
  wsDisconnect,
  wsConnected,
  wsDisconnected,
  wsReconnecting,
  wsError,
  wsMessageReceived,
  wsDetectionResult,
  type WSMessage,
  type DetectionResultPayload,
} from '../slices/websocketSlice';
import type { Alert } from '@/types/api/alerts';
import type { Stream } from '@/types/api/streams';
import type { PaginatedResponse } from '@/types/api/response';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const MAX_RECONNECT_ATTEMPTS = 20;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 45_000;

// ---------------------------------------------------------------------------
// 辅助：构造 WebSocket URL
// ---------------------------------------------------------------------------

function buildWsUrl(): string {
  // 优先使用环境变量
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;

  let base: string;
  if (envUrl) {
    base = envUrl;
  } else if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    base = `${protocol}//${window.location.host}`;
  } else {
    base = 'ws://localhost:8094';
  }

  // 确保路径
  const url = base.endsWith('/api/v1/ws') ? base : `${base}/api/v1/ws`;

  // 附加 token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}token=${encodeURIComponent(token)}`;
    }
  }

  return url;
}

// ---------------------------------------------------------------------------
// 消息处理器
// ---------------------------------------------------------------------------

interface AlertNewPayload {
  id: string;
  level: string;
  type: string;
  title: string;
  message: string;
  location?: string;
  status: string;
  acknowledged: boolean;
  stream_id?: string;
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
}

interface AlertUpdatePayload {
  id: string;
  [key: string]: unknown;
}

interface StreamStatusPayload {
  stream_id: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
}

 
type AppDispatch = (action: AnyAction | ((dispatch: unknown, getState: unknown) => unknown)) => unknown;

function getDispatch(storeApi: MiddlewareAPI): AppDispatch {
  return storeApi.dispatch as AppDispatch;
}

function handleAlertNew(storeApi: MiddlewareAPI, payload: unknown): void {
  const alert = payload as AlertNewPayload;
  const dispatch = getDispatch(storeApi);

  // 插入到所有 getAlerts 查询缓存的列表头部
  dispatch(
    baseApi.util.updateQueryData(
      'getAlerts' as never,
      undefined as never,
      (draft: PaginatedResponse<Alert>) => {
        if (draft?.data?.items) {
          draft.data.items.unshift(alert as unknown as Alert);
          draft.data.total += 1;
        }
      },
    ) as unknown as AnyAction,
  );

  // 使 AlertStatistics 标签失效，让其重新请求
  dispatch(
    baseApi.util.invalidateTags(['AlertStatistics']) as unknown as AnyAction,
  );
}

function handleAlertUpdate(storeApi: MiddlewareAPI, payload: unknown): void {
  const update = payload as AlertUpdatePayload;
  if (!update.id) return;
  const dispatch = getDispatch(storeApi);

  dispatch(
    baseApi.util.updateQueryData(
      'getAlerts' as never,
      undefined as never,
      (draft: PaginatedResponse<Alert>) => {
        if (!draft?.data?.items) return;
        const idx = draft.data.items.findIndex((a: Alert) => a.id === update.id);
        if (idx !== -1) {
          draft.data.items[idx] = { ...draft.data.items[idx], ...update } as Alert;
        }
      },
    ) as unknown as AnyAction,
  );
}

function handleStreamStatus(storeApi: MiddlewareAPI, payload: unknown): void {
  const { stream_id, status } = payload as StreamStatusPayload;
  if (!stream_id) return;
  const dispatch = getDispatch(storeApi);

  dispatch(
    baseApi.util.updateQueryData(
      'getStreams' as never,
      undefined as never,
      (draft: PaginatedResponse<Stream>) => {
        if (!draft?.data?.items) return;
        const idx = draft.data.items.findIndex((s: Stream) => s.id === stream_id);
        if (idx !== -1) {
          draft.data.items[idx].status = status as Stream['status'];
        }
      },
    ) as unknown as AnyAction,
  );
}

function handleDetectionResult(storeApi: MiddlewareAPI, payload: unknown): void {
  storeApi.dispatch(wsDetectionResult(payload as DetectionResultPayload));
}

// ---------------------------------------------------------------------------
// 中间件
// ---------------------------------------------------------------------------

export const websocketMiddleware: Middleware = (storeApi: MiddlewareAPI) => {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;
  let manualDisconnect = false;

  // ---- 内部工具函数 ----

  function clearTimers(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (pingTimer !== null) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    if (pongTimer !== null) {
      clearTimeout(pongTimer);
      pongTimer = null;
    }
  }

  function sendPing(): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));

      // 启动 pong 超时检测
      if (pongTimer !== null) clearTimeout(pongTimer);
      pongTimer = setTimeout(() => {
        console.warn('[WS Middleware] Pong timeout — closing connection');
        ws?.close(4000, 'Pong timeout');
      }, PONG_TIMEOUT_MS);
    }
  }

  function startHeartbeat(): void {
    if (pingTimer !== null) clearInterval(pingTimer);
    pingTimer = setInterval(sendPing, PING_INTERVAL_MS);
  }

  function scheduleReconnect(): void {
    if (manualDisconnect) return;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WS Middleware] Max reconnect attempts reached');
      storeApi.dispatch(wsError('Max reconnect attempts reached'));
      return;
    }

    reconnectAttempts += 1;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS,
    );

    storeApi.dispatch(wsReconnecting(reconnectAttempts));
    console.info(`[WS Middleware] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

    reconnectTimer = setTimeout(connect, delay);
  }

  function handleMessage(event: MessageEvent): void {
    let msg: WSMessage;
    try {
      msg = JSON.parse(event.data as string) as WSMessage;
    } catch {
      console.error('[WS Middleware] Failed to parse message:', event.data);
      return;
    }

    // pong 处理 — 清除超时计时器
    if ((msg as { type: string }).type === 'pong') {
      if (pongTimer !== null) {
        clearTimeout(pongTimer);
        pongTimer = null;
      }
      return;
    }

    // 更新最后消息时间
    storeApi.dispatch(wsMessageReceived(new Date().toISOString()));

    // 按类型分发
    switch (msg.type) {
      case 'alert:new':
        handleAlertNew(storeApi, msg.payload);
        break;
      case 'alert:update':
        handleAlertUpdate(storeApi, msg.payload);
        break;
      case 'stream:status':
        handleStreamStatus(storeApi, msg.payload);
        break;
      case 'detection:result':
        handleDetectionResult(storeApi, msg.payload);
        break;
      default:
        // 未知消息类型，静默忽略
        break;
    }
  }

  function connect(): void {
    // SSR 安全检查
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;

    // 已连接或正在连接
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

    manualDisconnect = false;

    try {
      const url = buildWsUrl();
      ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectAttempts = 0;
        storeApi.dispatch(wsConnected());
        startHeartbeat();
        console.info('[WS Middleware] Connected');
      };

      ws.onmessage = handleMessage;

      ws.onerror = (err) => {
        console.error('[WS Middleware] Error:', err);
        storeApi.dispatch(wsError('WebSocket error'));
      };

      ws.onclose = (event) => {
        clearTimers();
        storeApi.dispatch(wsDisconnected());
        console.warn(`[WS Middleware] Closed (code=${event.code})`);
        if (!manualDisconnect) {
          scheduleReconnect();
        }
      };
    } catch (err) {
      storeApi.dispatch(wsError(String(err)));
    }
  }

  function disconnect(): void {
    manualDisconnect = true;
    clearTimers();
    if (ws) {
      ws.close(1000, 'Client disconnect');
      ws = null;
    }
    storeApi.dispatch(wsDisconnected());
  }

  // ---- 页面卸载清理 ----
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      manualDisconnect = true;
      clearTimers();
      if (ws) {
        ws.close(1000, 'Page unload');
        ws = null;
      }
    });
  }

  // ---- 中间件主体 ----
  return (next: Dispatch) => (action: unknown) => {
    if (wsConnect.match(action as ReturnType<typeof wsConnect>)) {
      connect();
    }

    if (wsDisconnect.match(action as ReturnType<typeof wsDisconnect>)) {
      disconnect();
    }

    return next(action as Parameters<typeof next>[0]);
  };
};

export default websocketMiddleware;
