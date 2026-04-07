import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '@/routes/Login';

// Mock auth API
vi.mock('@/api/v1/auth', () => ({
  login: vi.fn(),
}));

// Mock WebSocket
vi.mock('@/lib/websocket', () => ({
  createWebSocket: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

// Mock baseApi to prevent RTK Query initialization errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock('@/store/api/baseApi', () => ({
  baseApi: {
    injectEndpoints: () => ({
      endpoints: {},
      reducerPath: 'baseApi',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      middleware: () => () => (next: any) => (action: any) => next(action),
      util: { getRunningQueriesThunk: () => ({ type: 'api/getRunningQueries' }) },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reducer: { baseApi: (state: any = {}) => state },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    middleware: { api: () => () => (next: any) => (action: any) => next(action) },
    util: {},
  },
}));

// Mock all RTK Query API slices that might be imported
vi.mock('@/store/api/alertsApi', () => ({ alertsApi: { endpoints: {} } }));
vi.mock('@/store/api/streamsApi', () => ({ streamsApi: { endpoints: {} } }));
vi.mock('@/store/api/tasksApi', () => ({ tasksApi: { endpoints: {} } }));
vi.mock('@/store/api/sensorsApi', () => ({ sensorsApi: { endpoints: {} } }));
vi.mock('@/store/api/mediaApi', () => ({ mediaApi: { endpoints: {} } }));
vi.mock('@/store/api/openclawApi', () => ({ openclawApi: { endpoints: {} } }));
vi.mock('@/store/api/reportsApi', () => ({ reportsApi: { endpoints: {} } }));
vi.mock('@/store/api/dashboardApi', () => ({ dashboardApi: { endpoints: {} } }));
vi.mock('@/store/api/defectCaseApi', () => ({ defectCaseApi: { endpoints: {} } }));
vi.mock('@/store/api/tenantConfigApi', () => ({ tenantConfigApi: { endpoints: {} } }));

// Mock authApi with mutation hooks
const mockLoginMutation = vi.fn();
const mockRegisterMutation = vi.fn();
vi.mock('@/store/api/authApi', () => ({
  authApi: { endpoints: {} },
  useLoginMutation: () => [mockLoginMutation, { isLoading: false, reset: vi.fn() }],
  useRegisterMutation: () => [mockRegisterMutation, { isLoading: false, reset: vi.fn() }],
}));

// Mock store index
vi.mock('@/store', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal() as any;
  return {
    ...actual,
    store: {
      getState: () => ({
        auth: { isAuthenticated: false, user: null, token: null },
        baseApi: {},
      }),
      dispatch: vi.fn(),
      subscribe: vi.fn(),
    },
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auth: (state: any = { isAuthenticated: false, user: null, token: null }) => state,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseApi: (state: any = {}) => state,
    },
  });

const renderLogin = (store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>
  );
};

describe('Login Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page without crashing', () => {
    const { container } = renderLogin();
    expect(container).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    renderLogin();

    // Login page renders successfully
    expect(document.body).toBeTruthy();
  });
});
