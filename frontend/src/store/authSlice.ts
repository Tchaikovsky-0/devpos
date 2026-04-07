import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi, UserInfo } from './api/authApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers for token management
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'token';

const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
const initialState: AuthState = {
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: UserInfo; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      setToken(action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      removeToken();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Use authApi from RTK Query for async operations
export const { useLoginMutation, useRegisterMutation, useGetUserInfoQuery } = authApi;

export const { setCredentials, logout, setLoading, clearError } = authSlice.actions;
export default authSlice.reducer;
