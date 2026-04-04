import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authReducer from './authSlice';
import alertReducer from './alertSlice';
import streamReducer from './streamSlice';

export const store = configureStore({
  reducer: {
    // RTK Query API
    [baseApi.reducerPath]: baseApi.reducer,
    // Legacy Redux slices
    auth: authReducer,
    alerts: alertReducer,
    streams: streamReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
