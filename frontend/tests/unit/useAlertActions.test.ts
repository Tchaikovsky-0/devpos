/**
 * useAlertActions 单元测试
 * 测试告警操作 Hook：acknowledge / ignore / resolve 三种操作
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 创建 mock mutation trigger 函数
const mockUpdateAlert = vi.fn();
const mockResolveAlert = vi.fn();
const mockAcknowledgeAlert = vi.fn();

// Mock RTK Query mutations
vi.mock('../../src/store/api/alertsApi', () => ({
  useUpdateAlertMutation: () => [mockUpdateAlert],
  useResolveAlertMutation: () => [mockResolveAlert],
  useAcknowledgeAlertMutation: () => [mockAcknowledgeAlert],
}));

import { useAlertActions } from '../../src/hooks/useAlertActions';

describe('useAlertActions', () => {
  const mockSelectNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // 每个 mock 返回带 unwrap 的对象
    mockUpdateAlert.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockResolveAlert.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockAcknowledgeAlert.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  it('返回 handleAction 函数', () => {
    const { result } = renderHook(() =>
      useAlertActions({ selectedId: 'alert-1', selectNext: mockSelectNext }),
    );
    expect(typeof result.current.handleAction).toBe('function');
  });

  it('acknowledge 操作调用 acknowledgeAlert', async () => {
    const { result } = renderHook(() =>
      useAlertActions({ selectedId: 'alert-1', selectNext: mockSelectNext }),
    );

    await act(async () => {
      await result.current.handleAction('acknowledge');
    });

    expect(mockAcknowledgeAlert).toHaveBeenCalledWith('alert-1');
    expect(mockSelectNext).toHaveBeenCalled();
  });

  it('resolve 操作调用 resolveAlert', async () => {
    const { result } = renderHook(() =>
      useAlertActions({ selectedId: 'alert-1', selectNext: mockSelectNext }),
    );

    await act(async () => {
      await result.current.handleAction('resolve');
    });

    expect(mockResolveAlert).toHaveBeenCalledWith('alert-1');
    expect(mockSelectNext).toHaveBeenCalled();
  });

  it('ignore 操作调用 updateAlert 并传入 false_alarm 状态', async () => {
    const { result } = renderHook(() =>
      useAlertActions({ selectedId: 'alert-1', selectNext: mockSelectNext }),
    );

    await act(async () => {
      await result.current.handleAction('ignore');
    });

    expect(mockUpdateAlert).toHaveBeenCalledWith({
      id: 'alert-1',
      data: { status: 'false_alarm', acknowledged: true },
    });
    expect(mockSelectNext).toHaveBeenCalled();
  });

  it('selectedId 为 null 时不调用任何 mutation 也不调用 selectNext（early return）', async () => {
    const { result } = renderHook(() =>
      useAlertActions({ selectedId: null, selectNext: mockSelectNext }),
    );

    await act(async () => {
      await result.current.handleAction('acknowledge');
    });

    expect(mockAcknowledgeAlert).not.toHaveBeenCalled();
    expect(mockResolveAlert).not.toHaveBeenCalled();
    expect(mockUpdateAlert).not.toHaveBeenCalled();
    // selectedId 为 null 时 early return，selectNext 不会被调用
    expect(mockSelectNext).not.toHaveBeenCalled();
  });

  it('mutation 失败时不抛错，仍调用 selectNext', async () => {
    mockAcknowledgeAlert.mockReturnValue({
      unwrap: () => Promise.reject(new Error('网络错误')),
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useAlertActions({ selectedId: 'alert-1', selectNext: mockSelectNext }),
    );

    await act(async () => {
      await result.current.handleAction('acknowledge');
    });

    expect(mockSelectNext).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
