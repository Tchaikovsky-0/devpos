import { render, RenderOptions, fireEvent, waitFor } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Import all reducers
import authReducer from '@/store/authSlice';
import alertReducer from '@/store/alertSlice';
import streamReducer from '@/store/streamSlice';

export interface TestStore {
  auth: ReturnType<typeof authReducer>;
  alert: ReturnType<typeof alertReducer>;
  stream: ReturnType<typeof streamReducer>;
}

export const createTestStore = (preloadedState?: PreloadedState<TestStore>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      alert: alertReducer,
      stream: streamReducer,
    },
    preloadedState,
  });
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: ReturnType<typeof createTestStore>;
  initialEntries?: string[];
  user?: { username: string; token: string };
}

export const TestWrapper = ({ children }: { children: ReactNode }) => {
  const store = createTestStore();

  return (
    <Provider store={store}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </Provider>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState as PreloadedState<TestStore>),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

export const mockApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success: <T = any>(data: T, delay = 100) => {
    return new Promise<T>((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  },

  error: (message: string, status = 400, delay = 100) => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = new Error(message) as any;
        error.response = { status, data: { message } };
        reject(error);
      }, delay);
    });
  },

  timeout: (delay = 100) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), delay);
    });
  },
};

export const mockWebSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

export const createMockStore = (overrides = {}) => ({
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    ...overrides.auth,
  },
  alert: {
    alerts: [],
    selectedAlert: null,
    isLoading: false,
    error: null,
    filters: {},
    ...overrides.alert,
  },
  stream: {
    streams: [],
    selectedStream: null,
    isLoading: false,
    error: null,
    filters: {},
    ...overrides.stream,
  },
});

export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  tenant_id: 'tenant_1',
};

export const mockToken = 'mock-jwt-token-12345';

export const generateMockAlerts = (count: number) => {
  const levels = ['INFO', 'WARN', 'ERROR', 'CRIT'];
  const statuses = ['active', 'acknowledged', 'resolved'];

  return Array.from({ length: count }, (_, i) => ({
    id: `alert-${i + 1}`,
    level: levels[i % levels.length],
    status: statuses[i % statuses.length],
    title: `Alert ${i + 1}`,
    description: `Description for alert ${i + 1}`,
    created_at: new Date(Date.now() - i * 60000).toISOString(),
    stream_id: `stream-${(i % 5) + 1}`,
  }));
};

export const generateMockStreams = (count: number) => {
  const types = ['rtsp', 'hls', 'webrtc'];
  const statuses = ['online', 'offline', 'error'];

  return Array.from({ length: count }, (_, i) => ({
    id: `stream-${i + 1}`,
    name: `Stream ${i + 1}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    url: `rtsp://example.com/stream${i + 1}`,
    created_at: new Date(Date.now() - i * 60000).toISOString(),
  }));
};

export const waitForLoadingToFinish = async () => {
  return waitFor(
    () => {
      const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, [aria-busy="true"]');
      return loadingElements.length === 0 ? true : Promise.reject();
    },
    { timeout: 3000 }
  );
};

export const findByTestId = async (testId: string) => {
  return waitFor(() => {
    const element = document.querySelector(`[data-testid="${testId}"]`);
    if (!element) throw new Error(`Element with testid "${testId}" not found`);
    return element;
  });
};

export const clickButton = async (name: string | RegExp) => {
  const button = document.querySelector(`button:has-text("${name}")`) as HTMLButtonElement;
  if (!button) throw new Error(`Button "${name}" not found`);
  fireEvent.click(button);
};

export const typeInput = async (placeholder: string | RegExp, value: string) => {
  const input = document.querySelector(`input[placeholder*="${placeholder}"]`) as HTMLInputElement;
  if (!input) throw new Error(`Input with placeholder "${placeholder}" not found`);
  fireEvent.change(input, { target: { value } });
};


export const simulateNetworkError = () => {
  global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
};

export const simulateServerError = (status = 500) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response)
  );
};

export const simulateSuccess = <T,>(data: T) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    } as Response)
  );
};

export * from '@testing-library/react';
export { render, screen, fireEvent, waitFor };
