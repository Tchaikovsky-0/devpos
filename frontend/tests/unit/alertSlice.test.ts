import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import alertReducer, {
  setSelectedAlert,
  setPage,
  setFilter,
  addAlert,
  updateAlert,
  removeAlert,
} from '../../src/store/alertSlice';

const createAlert = (overrides = {}) => ({
  id: '1',
  level: 'CRIT' as const,
  type: 'fire',
  title: 'Test Alert',
  message: 'Test description',
  status: 'pending' as const,
  acknowledged: false,
  stream_id: 'stream-1',
  created_at: '2026-04-04T10:00:00Z',
  ...overrides,
});

describe('alertSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        alerts: alertReducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().alerts;
      expect(state.alerts).toEqual([]);
      expect(state.selectedAlert).toBeNull();
      expect(state.total).toBe(0);
      expect(state.page).toBe(1);
      expect(state.pageSize).toBe(20);
      expect(state.loading).toBe(false);
      expect(state.filter).toEqual({});
    });
  });

  describe('setSelectedAlert', () => {
    it('should set selected alert', () => {
      const alert = createAlert();

      store.dispatch(setSelectedAlert(alert));
      const state = store.getState().alerts;
      expect(state.selectedAlert).toEqual(alert);
    });
  });

  describe('setPage', () => {
    it('should update page number', () => {
      store.dispatch(setPage(3));
      const state = store.getState().alerts;
      expect(state.page).toBe(3);
    });
  });

  describe('setFilter', () => {
    it('should update filter and reset page', () => {
      store.dispatch(setPage(5));
      store.dispatch(setFilter({ level: 'CRIT' }));

      const state = store.getState().alerts;
      expect(state.filter.level).toBe('CRIT');
      expect(state.page).toBe(1);
    });
  });

  describe('addAlert', () => {
    it('should add alert to the beginning of list', () => {
      const alert1 = createAlert({
        id: '1',
        title: 'Alert 1',
        message: 'Description 1',
        level: 'INFO' as const,
      });

      store.dispatch(addAlert(alert1));
      let state = store.getState().alerts;
      expect(state.alerts).toHaveLength(1);
      expect(state.total).toBe(1);

      const alert2 = createAlert({
        id: '2',
        title: 'Alert 2',
        message: 'Description 2',
        level: 'WARN' as const,
        stream_id: 'stream-2',
        created_at: '2026-04-04T11:00:00Z',
      });

      store.dispatch(addAlert(alert2));
      state = store.getState().alerts;
      expect(state.alerts).toHaveLength(2);
      expect(state.total).toBe(2);
      expect(state.alerts[0].id).toBe('2');
    });
  });

  describe('updateAlert', () => {
    it('should update existing alert', () => {
      const alert = createAlert({
        title: 'Original Title',
        message: 'Original description',
        level: 'INFO' as const,
      });

      store.dispatch(addAlert(alert));

      const updatedAlert = {
        ...alert,
        title: 'Updated Title',
        status: 'resolved' as const,
      };

      store.dispatch(updateAlert(updatedAlert));
      const state = store.getState().alerts;
      expect(state.alerts[0].title).toBe('Updated Title');
      expect(state.alerts[0].status).toBe('resolved');
    });
  });

  describe('removeAlert', () => {
    it('should remove alert from list', () => {
      const alert = createAlert({
        title: 'Alert to remove',
        message: 'Description',
        level: 'INFO' as const,
      });

      store.dispatch(addAlert(alert));
      expect(store.getState().alerts.alerts).toHaveLength(1);

      store.dispatch(removeAlert('1'));
      const state = store.getState().alerts;
      expect(state.alerts).toHaveLength(0);
      expect(state.total).toBe(0);
    });
  });
});
