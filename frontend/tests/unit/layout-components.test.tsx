import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock framer-motion ──
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} {...filterDOMProps(props)}>{children as React.ReactNode}</div>
    )),
    span: React.forwardRef(({ children, ...props }: Record<string, unknown>, ref: React.Ref<HTMLSpanElement>) => (
      <span ref={ref} {...filterDOMProps(props)}>{children as React.ReactNode}</span>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/** Filter out non-DOM props from framer-motion */
function filterDOMProps(props: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set([
    'layout', 'layoutId', 'initial', 'animate', 'exit', 'transition',
    'whileHover', 'whileTap', 'whileFocus', 'onMouseEnter', 'onMouseLeave',
    'variants', 'custom',
  ]);
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!blocked.has(key)) filtered[key] = value;
  }
  return filtered;
}

// ── Mock Logo & ThemeToggle (simple stubs) ──
vi.mock('@/components/Logo', () => ({
  Logo: ({ size }: { size?: string }) => <div data-testid="logo" data-size={size}>Logo</div>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">ThemeToggle</button>,
}));

vi.mock('@/components/ui/AlertBadge', () => ({
  AlertBadge: ({ count }: { count: number }) =>
    count > 0 ? <span data-testid="alert-badge">{count}</span> : null,
}));

vi.mock('@/components/ui/ShortcutHint', () => ({
  ShortcutHint: ({ shortcut }: { shortcut: string }) => <kbd>{shortcut}</kbd>,
}));

// ── Mock GlobalMonitorStatus (uses RTK Query hooks) ──
vi.mock('@/components/layout/GlobalMonitorStatus', () => ({
  GlobalMonitorStatus: () => <div data-testid="global-monitor-status">Monitor Status</div>,
}));

// ── Import components under test ──
import { AppSidebar, type AppSidebarProps } from '../../src/components/layout/AppSidebar';
import { AppHeader, type AppHeaderProps } from '../../src/components/layout/AppHeader';
import { MobileTabBar, type MobileTabBarProps } from '../../src/components/layout/MobileTabBar';
import { defaultNavGroups } from '../../src/hooks/useLayoutState';
import { navigationModules } from '../../src/config/navigation';

// ═══════════════════════════════════════════════════════════════════
// AppSidebar
// ═══════════════════════════════════════════════════════════════════

describe('AppSidebar', () => {
  const defaultProps: AppSidebarProps = {
    navGroups: defaultNavGroups,
    activeModuleId: 'center',
    alertCount: 3,
  };

  function renderSidebar(overrides?: Partial<AppSidebarProps>) {
    return render(
      <MemoryRouter>
        <AppSidebar {...defaultProps} {...overrides} />
      </MemoryRouter>,
    );
  }

  it('should render navigation items from navGroups', () => {
    renderSidebar();
    // navGroups cover ids: center, media, gallery, alerts, tasks, assets, openclaw
    // plus system is rendered separately
    const allGroupIds = defaultNavGroups.flatMap((g) => g.ids);
    for (const id of allGroupIds) {
      const mod = navigationModules.find((m) => m.id === id);
      if (mod) {
        // Each nav item has a Link with title = module.label
        expect(screen.getByTitle(mod.label)).toBeInTheDocument();
      }
    }
  });

  it('should render the system nav item', () => {
    renderSidebar();
    const systemMod = navigationModules.find((m) => m.id === 'system');
    if (systemMod) {
      expect(screen.getByTitle(systemMod.label)).toBeInTheDocument();
    }
  });

  it('should render Logo and ThemeToggle', () => {
    renderSidebar();
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('should show alert badge when alertCount > 0 on alerts module', () => {
    renderSidebar({ alertCount: 5 });
    expect(screen.getByTestId('alert-badge')).toHaveTextContent('5');
  });

  it('should not show alert badge when alertCount is 0', () => {
    renderSidebar({ alertCount: 0 });
    expect(screen.queryByTestId('alert-badge')).not.toBeInTheDocument();
  });

  it('should apply active style to the current active module', () => {
    renderSidebar({ activeModuleId: 'alerts' });
    const alertLink = screen.getByTitle('告警处置');
    // Active items have 'text-accent' class
    expect(alertLink.className).toContain('text-accent');
  });
});

// ═══════════════════════════════════════════════════════════════════
// AppHeader
// ═══════════════════════════════════════════════════════════════════

describe('AppHeader', () => {
  const defaultProps: AppHeaderProps = {
    onOpenPalette: vi.fn(),
    onOpenAIPanel: vi.fn(),
  };

  function renderHeader(pathname: string, overrides?: Partial<AppHeaderProps>) {
    return render(
      <MemoryRouter initialEntries={[pathname]}>
        <AppHeader {...defaultProps} {...overrides} />
      </MemoryRouter>,
    );
  }

  it('should render breadcrumb with home link', () => {
    renderHeader('/dashboard');
    expect(screen.getByText('首页')).toBeInTheDocument();
  });

  it('should display the correct module title for /alerts', () => {
    renderHeader('/alerts');
    expect(screen.getByText('告警处置')).toBeInTheDocument();
  });

  it('should display the correct module title for /media', () => {
    renderHeader('/media');
    expect(screen.getByText('媒体库')).toBeInTheDocument();
  });

  it('should display currentObjectName when provided', () => {
    renderHeader('/dashboard', { currentObjectName: '摄像头A' });
    expect(screen.getByText('摄像头A')).toBeInTheDocument();
  });

  it('should call onOpenPalette when command button is clicked', () => {
    const onOpenPalette = vi.fn();
    renderHeader('/dashboard', { onOpenPalette });
    fireEvent.click(screen.getByTitle('命令面板 (⌘P)'));
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenAIPanel when AI button is clicked', () => {
    const onOpenAIPanel = vi.fn();
    renderHeader('/dashboard', { onOpenAIPanel });
    fireEvent.click(screen.getByText('AI 协同'));
    expect(onOpenAIPanel).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// MobileTabBar
// ═══════════════════════════════════════════════════════════════════

describe('MobileTabBar', () => {
  const defaultProps: MobileTabBarProps = {
    alertCount: 0,
    currentPath: '/center',
    onNavigate: vi.fn(),
  };

  function renderTabBar(overrides?: Partial<MobileTabBarProps>) {
    return render(<MobileTabBar {...defaultProps} {...overrides} />);
  }

  it('should render 5 tab items', () => {
    renderTabBar();
    const labels = ['监控', '告警', '媒体', 'AI', '设置'];
    for (const label of labels) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('should display alert badge when alertCount > 0', () => {
    renderTabBar({ alertCount: 42 });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display 99+ when alertCount > 99', () => {
    renderTabBar({ alertCount: 150 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should not display alert badge when alertCount is 0', () => {
    renderTabBar({ alertCount: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should highlight the current active tab', () => {
    renderTabBar({ currentPath: '/alerts' });
    const alertTab = screen.getByLabelText('告警');
    expect(alertTab.className).toContain('text-accent');
    expect(alertTab).toHaveAttribute('aria-current', 'page');
  });

  it('should call onNavigate with correct path on tab click', () => {
    const onNavigate = vi.fn();
    renderTabBar({ onNavigate });
    fireEvent.click(screen.getByLabelText('媒体'));
    expect(onNavigate).toHaveBeenCalledWith('/media');
  });

  it('should activate center tab for root path', () => {
    renderTabBar({ currentPath: '/' });
    const centerTab = screen.getByLabelText('监控');
    expect(centerTab).toHaveAttribute('aria-current', 'page');
  });
});
