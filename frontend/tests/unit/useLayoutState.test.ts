/**
 * useLayoutState 单元测试
 * 测试布局状态 Hook：活跃模块、折叠状态、命令面板、导航等
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/alerts' }),
  useNavigate: () => mockNavigate,
}));

// Mock navigation config — findModuleForPath 根据路径返回对应模块
vi.mock('@/config/navigation', () => ({
  findModuleForPath: (pathname: string) => {
    const modules: Record<string, { id: string; label: string; path: string }> = {
      '/alerts': { id: 'alerts', label: '告警处置', path: '/alerts' },
      '/center': { id: 'center', label: '监控中枢', path: '/center' },
    };
    return modules[pathname] ?? { id: 'center', label: '监控中枢', path: '/center' };
  },
}));

import { useLayoutState, defaultNavGroups, getModuleStatusText } from '../../src/hooks/useLayoutState';

describe('useLayoutState', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('初始状态正确 — collapsed 为 false, isPaletteOpen 为 false', () => {
    const { result } = renderHook(() => useLayoutState());
    expect(result.current.collapsed).toBe(false);
    expect(result.current.isPaletteOpen).toBe(false);
  });

  it('activeModule 根据当前路由匹配', () => {
    const { result } = renderHook(() => useLayoutState());
    expect(result.current.activeModule.id).toBe('alerts');
  });

  it('toggleCollapsed 切换折叠状态', () => {
    const { result } = renderHook(() => useLayoutState());
    expect(result.current.collapsed).toBe(false);

    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.collapsed).toBe(true);

    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.collapsed).toBe(false);
  });

  it('setCollapsed 直接设置折叠状态', () => {
    const { result } = renderHook(() => useLayoutState());

    act(() => {
      result.current.setCollapsed(true);
    });
    expect(result.current.collapsed).toBe(true);

    act(() => {
      result.current.setCollapsed(false);
    });
    expect(result.current.collapsed).toBe(false);
  });

  it('navigateTo 调用 react-router navigate', () => {
    const { result } = renderHook(() => useLayoutState());

    act(() => {
      result.current.navigateTo('/media');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/media');
  });

  it('navGroups 返回默认导航分组', () => {
    const { result } = renderHook(() => useLayoutState());
    expect(result.current.navGroups).toEqual(defaultNavGroups);
  });

  it('setIsPaletteOpen 切换命令面板', () => {
    const { result } = renderHook(() => useLayoutState());
    expect(result.current.isPaletteOpen).toBe(false);

    act(() => {
      result.current.setIsPaletteOpen(true);
    });
    expect(result.current.isPaletteOpen).toBe(true);
  });
});

describe('defaultNavGroups', () => {
  it('包含 monitor / manage / ai 三个分组', () => {
    expect(defaultNavGroups).toHaveLength(3);
    expect(defaultNavGroups.map((g) => g.key)).toEqual(['monitor', 'manage', 'ai']);
  });
});

describe('getModuleStatusText', () => {
  it('返回已知模块状态', () => {
    expect(getModuleStatusText('center', 0)).toBe('监控大屏就绪');
    expect(getModuleStatusText('alerts', 5)).toBe('5 条待处置');
  });

  it('未知模块返回默认文案', () => {
    expect(getModuleStatusText('unknown', 0)).toBe('状态稳定');
  });
});
