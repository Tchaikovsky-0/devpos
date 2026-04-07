import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  setCredentials,
  logout,
  setLoading,
} from '../../src/store/authSlice';

const createUser = () => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  avatar: '',
  role: 'admin',
  tenant_id: 'tenant-1',
});

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    localStorage.clear();
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
      expect(state.loading).toBe(false);
    });
  });

  describe('setCredentials', () => {
    it('should set user and token on login success', () => {
      const user = createUser();
      const token = 'test-token-123';

      store.dispatch(setCredentials({ user, token }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
      expect(state.loading).toBe(false);
      expect(localStorage.getItem('token')).toBe(token);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      store.dispatch(setLoading(true));
      const state = store.getState().auth;
      expect(state.loading).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', () => {
      const user = createUser();
      const token = 'test-token-123';

      store.dispatch(setCredentials({ user, token }));
      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
