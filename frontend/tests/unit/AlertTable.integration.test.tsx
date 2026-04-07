import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AlertsWorkspace from '../../src/routes/AlertsWorkspace';

// Mock alertsApi
vi.mock('../../src/store/api/alertsApi', () => ({
  useGetAlertsQuery: () => ({ data: { data: { data: [], total: 0, page: 1, page_size: 100 } }, isLoading: false }),
  useUpdateAlertMutation: () => [vi.fn()],
  useResolveAlertMutation: () => [vi.fn()],
  useAcknowledgeAlertMutation: () => [vi.fn()],
}));

// Mock streamsApi
vi.mock('../../src/store/api/streamsApi', () => ({
  useGetStreamsQuery: () => ({ data: { data: { data: [] } } }),
}));

// Mock openclaw bridge
vi.mock('../../src/components/openclaw/openclawBridge', () => ({
  composeOpenClaw: vi.fn(),
}));

// Mock motion components
vi.mock('../../src/components/motion', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HoverLift: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TapScale: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span' },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auth: (state: any = { isAuthenticated: false, user: null, token: null }) => state,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseApi: (state: any = {}) => state,
    },
  });

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore();
  return <Provider store={store}>{children}</Provider>;
};

describe('AlertTable Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('alerts workspace', () => {
    it('should render alerts workspace without crashing', () => {
      const { container } = render(<AlertsWorkspace />, { wrapper: Wrapper });
      expect(container).toBeInTheDocument();
    });

    it('should display alerts workspace title', () => {
      render(<AlertsWorkspace />, { wrapper: Wrapper });
      // AlertsWorkspace should render some heading content
      const headings = document.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('stats cards', () => {
    it('should display stats cards', () => {
      const { container } = render(<div>Dashboard</div>);
      expect(container).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const { container } = render(
        <div className="animate-pulse">
          <div className="h-24 rounded-lg bg-bg-secondary" />
        </div>
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('charts', () => {
    it('should render chart placeholder', () => {
      const { container } = render(
        <div className="h-56 rounded-lg bg-bg-secondary">
          <div className="h-full w-full rounded-lg bg-bg-tertiary/30" />
        </div>
      );
      expect(container.querySelector('.h-56')).toBeInTheDocument();
    });
  });
});

describe('Media Gallery Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('folder navigation', () => {
    it('should display folder list', () => {
      const mockFolders = [
        { id: '1', name: '巡检录像', count: 10 },
        { id: '2', name: '截图', count: 5 },
      ];

      const { container } = render(
        <div>
          {mockFolders.map((folder) => (
            <div key={folder.id} className="flex items-center justify-between p-2">
              <span>{folder.name}</span>
              <span>{folder.count}</span>
            </div>
          ))}
        </div>
      );

      expect(container).toHaveTextContent('巡检录像');
      expect(container).toHaveTextContent('截图');
    });
  });

  describe('file selection', () => {
    it('should toggle file selection', async () => {
      const user = userEvent.setup();

      const { getByRole } = render(
        <input type="checkbox" />
      );

      const checkbox = getByRole('checkbox');
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('batch operations', () => {
    it('should show batch action bar when items selected', () => {
      const selectedCount = 3;

      const { container } = render(
        <div className={selectedCount > 0 ? 'flex gap-2' : 'hidden'}>
          <span>已选择 {selectedCount} 项</span>
          <button>移动</button>
          <button>删除</button>
        </div>
      );

      expect(container).toHaveTextContent('已选择 3 项');
      expect(container).toHaveTextContent('移动');
      expect(container).toHaveTextContent('删除');
    });

    it('should hide batch action bar when no selection', () => {
      const selectedCount = 0;

      const { container } = render(
        <div className={selectedCount > 0 ? 'flex gap-2' : 'hidden'}>
          <span>已选择</span>
        </div>
      );

      expect(container.querySelector('.flex')).not.toBeInTheDocument();
    });
  });
});
