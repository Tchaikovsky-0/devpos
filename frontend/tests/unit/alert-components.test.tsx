import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Mock framer-motion ──
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} data-testid="motion-div">{children as React.ReactNode}</div>
    )),
    span: React.forwardRef(({ children }: Record<string, unknown>, ref: React.Ref<HTMLSpanElement>) => (
      <span ref={ref}>{children as React.ReactNode}</span>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Mock react-window (virtual list) ──
vi.mock('react-window', () => ({
  List: ({ rowCount }: { rowCount: number }) => (
    <div data-testid="virtual-list">Virtual List ({rowCount} items)</div>
  ),
}));

// ── Mock AlertListItem ──
vi.mock('../../src/components/alert/AlertListItem', () => ({
  AlertListItem: ({ alert, isSelected }: { alert: { id: string; title: string }; isSelected: boolean }) => (
    <div data-testid={`alert-item-${alert.id}`} data-selected={isSelected}>
      {alert.title}
    </div>
  ),
}));

// ── Mock Badge ──
vi.mock('../../src/components/ui/Badge', () => ({
  __esModule: true,
  default: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid={`badge-${variant ?? 'default'}`}>{children}</span>
  ),
  PriorityBadge: ({ priority }: { priority: string }) => (
    <span data-testid={`priority-badge-${priority}`}>{priority}</span>
  ),
}));

import { AlertListPanel } from '../../src/components/alert/AlertListPanel';
import { AlertFilterSidebar } from '../../src/components/alert/AlertFilterSidebar';
import type { Alert, AlertFilter } from '../../src/types/alert';

// ── Test data helpers ──

function createMockAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    type: 'fire',
    priority: 'P0',
    status: 'pending',
    title: '火灾告警测试',
    description: '检测到火灾',
    cameraId: 'cam-1',
    cameraName: '摄像头1',
    timestamp: new Date('2025-01-01T12:00:00Z'),
    ...overrides,
  };
}

function createAlertList(count: number): Alert[] {
  return Array.from({ length: count }, (_, i) =>
    createMockAlert({
      id: `alert-${i}`,
      title: `告警 ${i}`,
      status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'processing' : 'resolved',
    }),
  );
}

// ═══════════════════════════════════════════════════════════════════
// AlertListPanel
// ═══════════════════════════════════════════════════════════════════

describe('AlertListPanel', () => {
  const baseProps = {
    filteredAlerts: [] as Alert[],
    selectedId: null as string | null,
    searchQuery: '',
    loading: false,
    error: null as string | null,
    total: 0,
    stats: { pending: 0, processing: 0, resolved: 0 },
    onSelect: vi.fn(),
    onSearchChange: vi.fn(),
    onRefresh: vi.fn(),
    onShowHelp: vi.fn(),
    onAction: vi.fn().mockResolvedValue(undefined),
  };

  it('should render header with title', () => {
    render(<AlertListPanel {...baseProps} />);
    expect(screen.getByText('告警管理')).toBeInTheDocument();
  });

  it('should render stats badges', () => {
    render(
      <AlertListPanel
        {...baseProps}
        stats={{ pending: 5, processing: 2, resolved: 10 }}
      />,
    );
    expect(screen.getByText('5 待处理')).toBeInTheDocument();
    expect(screen.getByText('2 处理中')).toBeInTheDocument();
    expect(screen.getByText('10 已解决')).toBeInTheDocument();
  });

  it('should show empty state when no alerts', () => {
    render(<AlertListPanel {...baseProps} filteredAlerts={[]} />);
    expect(screen.getByText('暂无告警')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<AlertListPanel {...baseProps} loading={true} />);
    expect(screen.getByText('加载告警数据中...')).toBeInTheDocument();
  });

  it('should show error state with retry button', () => {
    const onRefresh = vi.fn();
    render(<AlertListPanel {...baseProps} error="网络错误" onRefresh={onRefresh} />);
    expect(screen.getByText('网络错误')).toBeInTheDocument();
    fireEvent.click(screen.getByText('重新加载'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should render alert list items (non-virtualized)', () => {
    const alerts = createAlertList(3);
    render(<AlertListPanel {...baseProps} filteredAlerts={alerts} total={3} />);
    expect(screen.getByTestId('alert-item-alert-0')).toBeInTheDocument();
    expect(screen.getByTestId('alert-item-alert-1')).toBeInTheDocument();
    expect(screen.getByTestId('alert-item-alert-2')).toBeInTheDocument();
  });

  it('should show total count in footer', () => {
    const alerts = createAlertList(5);
    render(<AlertListPanel {...baseProps} filteredAlerts={alerts} total={100} />);
    expect(screen.getByText(/共 5 条/)).toBeInTheDocument();
    expect(screen.getByText(/总计 100/)).toBeInTheDocument();
  });

  it('should handle search input changes', () => {
    const onSearchChange = vi.fn();
    render(<AlertListPanel {...baseProps} onSearchChange={onSearchChange} />);
    const searchInput = screen.getByPlaceholderText('搜索告警...');
    fireEvent.change(searchInput, { target: { value: '火灾' } });
    expect(onSearchChange).toHaveBeenCalledWith('火灾');
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<AlertListPanel {...baseProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByTitle('刷新告警列表'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AlertFilterSidebar
// ═══════════════════════════════════════════════════════════════════

describe('AlertFilterSidebar', () => {
  const emptyFilter: AlertFilter = {};
  const mockAlerts: Alert[] = [
    createMockAlert({ id: '1', status: 'pending', priority: 'P0', type: 'fire' }),
    createMockAlert({ id: '2', status: 'processing', priority: 'P1', type: 'intrusion' }),
    createMockAlert({ id: '3', status: 'resolved', priority: 'P2', type: 'defect' }),
  ];

  it('should render filter header', () => {
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('过滤器')).toBeInTheDocument();
  });

  it('should render status filter section', () => {
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('待处理')).toBeInTheDocument();
    expect(screen.getByText('处理中')).toBeInTheDocument();
    expect(screen.getByText('已解决')).toBeInTheDocument();
    expect(screen.getByText('已忽略')).toBeInTheDocument();
  });

  it('should render priority filter section', () => {
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('优先级')).toBeInTheDocument();
    expect(screen.getByText(/P0 - 紧急/)).toBeInTheDocument();
    expect(screen.getByText(/P1 - 重要/)).toBeInTheDocument();
    expect(screen.getByText(/P2 - 一般/)).toBeInTheDocument();
    expect(screen.getByText(/P3 - 低/)).toBeInTheDocument();
  });

  it('should render type filter section', () => {
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('类型')).toBeInTheDocument();
    expect(screen.getByText('火灾')).toBeInTheDocument();
    expect(screen.getByText('入侵')).toBeInTheDocument();
    expect(screen.getByText('缺陷')).toBeInTheDocument();
    expect(screen.getByText('车辆')).toBeInTheDocument();
    expect(screen.getByText('人员')).toBeInTheDocument();
  });

  it('should toggle status filter on click', () => {
    const onFilterChange = vi.fn();
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText('待处理'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ['pending'] }),
    );
  });

  it('should remove status when already selected', () => {
    const onFilterChange = vi.fn();
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={{ statuses: ['pending', 'processing'] }}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText('待处理'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ['processing'] }),
    );
  });

  it('should toggle priority filter on click', () => {
    const onFilterChange = vi.fn();
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText(/P0 - 紧急/));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ priorities: ['P0'] }),
    );
  });

  it('should toggle type filter on click', () => {
    const onFilterChange = vi.fn();
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText('火灾'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: ['fire'] }),
    );
  });

  it('should show alert counts per status', () => {
    render(
      <AlertFilterSidebar
        alerts={mockAlerts}
        filter={emptyFilter}
        onFilterChange={vi.fn()}
      />,
    );
    // 1 pending, 1 processing, 1 resolved, 0 ignored
    // Status section has 4 buttons (pending, processing, resolved, ignored)
    const pendingButton = screen.getByText('待处理').closest('button');
    expect(pendingButton).toHaveTextContent('1');
  });
});
