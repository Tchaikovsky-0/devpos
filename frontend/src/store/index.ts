import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authReducer from './authSlice';
import settingsReducer from './settingsSlice';
import copilotReducer from './copilotSlice';
import websocketReducer, { wsConnect } from './slices/websocketSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    // RTK Query API
    [baseApi.reducerPath]: baseApi.reducer,
    // Auth slice
    auth: authReducer,
    // Settings slice
    settings: settingsReducer,
    // Copilot (AI assistant)
    copilot: copilotReducer,
    // WebSocket 连接状态
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, websocketMiddleware),
});

// 自动发起 WebSocket 连接
store.dispatch(wsConnect());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
