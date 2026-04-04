import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { alertAPI, Alert } from '../api/v1/alerts';

interface AlertState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  filter: {
    level?: string;
    status?: string;
    keyword?: string;
  };
}

const initialState: AlertState = {
  alerts: [],
  selectedAlert: null,
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  filter: {},
};

export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (params?: { page?: number; filter?: AlertState['filter'] }) => {
    const response = await alertAPI.list({
      page: params?.page,
      page_size: 20,
      ...params?.filter,
    });
    return response.data;
  }
);

export const resolveAlert = createAsyncThunk(
  'alerts/resolveAlert',
  async (alertId: string) => {
    await alertAPI.update(alertId, { status: 'resolved' });
    return alertId;
  }
);

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setSelectedAlert: (state, action: PayloadAction<Alert | null>) => {
      state.selectedAlert = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setFilter: (state, action: PayloadAction<AlertState['filter']>) => {
      state.filter = action.payload;
      state.page = 1;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      state.total += 1;
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      const index = state.alerts.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(a => a.id !== action.payload);
      state.total -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchAlerts.rejected, (state) => {
        state.loading = false;
      })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert) {
          alert.status = 'resolved';
        }
      });
  },
});

export const {
  setSelectedAlert,
  setPage,
  setFilter,
  addAlert,
  updateAlert,
  removeAlert,
} = alertSlice.actions;

export default alertSlice.reducer;
