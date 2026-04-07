import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  setCredentials,
  logout,
} from '@/store/authSlice';

interface TestUser {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: string;
  tenant_id: string;
}

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('setCredentials', () => {
    it('should set credentials and mark as authenticated', () => {
      const credentials: { user: TestUser; token: string } = {
        user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: '', role: 'admin', tenant_id: 't1' },
        token: 'test-token-123',
      };

      store.dispatch(setCredentials(credentials));
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('test-token-123');
      expect(state.user?.username).toBe('admin');
    });
  });

  describe('logout', () => {
    it('should clear credentials and mark as unauthenticated', () => {
      const credentials: { user: TestUser; token: string } = {
        user: { id: 1, username: 'admin', email: 'admin@test.com', avatar: '', role: 'admin', tenant_id: 't1' },
        token: 'test-token-123',
      };

      store.dispatch(setCredentials(credentials));

      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });
});
