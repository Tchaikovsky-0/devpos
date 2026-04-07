// =============================================================================
// WebSocket Slice - WebSocket 连接状态管理
// =============================================================================

import { createSlice, createAction, type PayloadAction } from '@reduxjs/toolkit';

// ---------------------------------------------------------------------------
// WebSocket 消息类型定义
// ---------------------------------------------------------------------------

/** 中间件可处理的消息类型 */
export type WSMessageType =
  | 'alert:new'
  | 'alert:update'
  | 'stream:status'
  | 'detection:result';

/** WebSocket 消息格式（与后端 websocket.go 协商） */
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
}

/** YOLO 检测结果 payload */
export interface DetectionResultPayload {
  stream_id: string;
  timestamp: string;
  detections: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
}

// ---------------------------------------------------------------------------
// 公共 Actions — 供组件或初始化逻辑 dispatch
// ---------------------------------------------------------------------------

/** 发起 WebSocket 连接 */
export const wsConnect = createAction('websocket/connect');

/** 断开 WebSocket 连接 */
export const wsDisconnect = createAction('websocket/disconnect');

/** detection:result 转发给 YOLO 组件 */
export const wsDetectionResult = createAction<DetectionResultPayload>('websocket/detectionResult');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
  lastMessageAt: string | null;
  error: string | null;
}

const initialState: WebSocketState = {
  connected: false,
  reconnecting: false,
  reconnectAttempts: 0,
  lastMessageAt: null,
  error: null,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    wsConnected(state) {
      state.connected = true;
      state.reconnecting = false;
      state.reconnectAttempts = 0;
      state.error = null;
    },
    wsDisconnected(state) {
      state.connected = false;
      state.reconnecting = false;
    },
    wsReconnecting(state, action: PayloadAction<number>) {
      state.reconnecting = true;
      state.reconnectAttempts = action.payload;
    },
    wsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    wsMessageReceived(state, action: PayloadAction<string>) {
      state.lastMessageAt = action.payload;
    },
  },
});

export const {
  wsConnected,
  wsDisconnected,
  wsReconnecting,
  wsError,
  wsMessageReceived,
} = websocketSlice.actions;

export default websocketSlice.reducer;
