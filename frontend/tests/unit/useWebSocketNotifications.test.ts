/**
 * useWebSocketNotifications 单元测试
 * 测试 WebSocket 消息桥接到 Toast 通知系统、声音播放、桌面通知
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ---------- Mock 依赖模块 ----------

const mockToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  toast: (args: Record<string, unknown>) => mockToast(args),
}));

// 捕获 subscribe 注册的回调
type SubscribeHandler = (msg: Record<string, unknown>) => void;
const subscriptions = new Map<string, SubscribeHandler>();
const mockSubscribe = vi.fn((type: string, handler: SubscribeHandler) => {
  subscriptions.set(type, handler);
  return vi.fn(); // unsubscribe
});

vi.mock('@/lib/websocket', () => ({
  wsService: {
    subscribe: (type: string, handler: SubscribeHandler) => mockSubscribe(type, handler),
  },
}));

const mockPlay = vi.fn();
vi.mock('@/services/alertSound', () => ({
  alertSoundService: { play: (level: string) => mockPlay(level) },
}));

import { useWebSocketNotifications } from '../../src/hooks/useWebSocketNotifications';

describe('useWebSocketNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscriptions.clear();

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window.Notification, 'permission', {
      writable: true,
      value: 'default',
      configurable: true,
    });
    Object.defineProperty(window.Notification, 'requestPermission', {
      writable: true,
      value: vi.fn().mockResolvedValue('granted'),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('启用时订阅 alert / alert_new / stream-status / stream_status', () => {
    renderHook(() => useWebSocketNotifications());

    const subscribedTypes = mockSubscribe.mock.calls.map(
      (call: [string, SubscribeHandler]) => call[0],
    );
    expect(subscribedTypes).toContain('alert');
    expect(subscribedTypes).toContain('alert_new');
    expect(subscribedTypes).toContain('stream-status');
    expect(subscribedTypes).toContain('stream_status');
  });

  it('enabled=false 时不订阅', () => {
    renderHook(() => useWebSocketNotifications({ enabled: false }));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('收到告警消息时触发 toast', () => {
    renderHook(() => useWebSocketNotifications());

    const handler = subscriptions.get('alert');
    expect(handler).toBeDefined();

    handler!({
      type: 'alert',
      payload: {
        id: 'a1',
        level: 'P2',
        title: '裂缝检测',
        message: '发现裂缝',
        stream_id: 's1',
      },
      timestamp: new Date().toISOString(),
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: expect.stringContaining('P2'),
      }),
    );
  });

  it('P0 告警触发声音播放', () => {
    renderHook(() => useWebSocketNotifications());

    const handler = subscriptions.get('alert');
    handler!({
      type: 'alert',
      payload: {
        id: 'a2',
        level: 'P0',
        title: '火灾告警',
        message: '检测到烟雾',
        stream_id: 's2',
      },
      timestamp: new Date().toISOString(),
    });

    expect(mockPlay).toHaveBeenCalledWith('P0');
  });

  it('P3 告警不触发声音', () => {
    renderHook(() => useWebSocketNotifications());

    const handler = subscriptions.get('alert');
    handler!({
      type: 'alert',
      payload: {
        id: 'a3',
        level: 'P3',
        title: '低级告警',
        message: '',
        stream_id: 's3',
      },
      timestamp: new Date().toISOString(),
    });

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('enableSound=false 时 P0 告警不播放声音', () => {
    renderHook(() => useWebSocketNotifications({ enableSound: false }));

    const handler = subscriptions.get('alert');
    handler!({
      type: 'alert',
      payload: {
        id: 'a4',
        level: 'P0',
        title: '紧急',
        message: '',
        stream_id: 's4',
      },
      timestamp: new Date().toISOString(),
    });

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('收到 stream-status 消息时触发 toast', () => {
    renderHook(() => useWebSocketNotifications());

    const handler = subscriptions.get('stream-status');
    expect(handler).toBeDefined();

    handler!({
      type: 'stream-status',
      payload: {
        stream_id: 'cam-01',
        status: 'online',
        stream_name: '前门摄像头',
      },
      timestamp: new Date().toISOString(),
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringContaining('已上线'),
      }),
    );
  });

  it('流状态为未知 status 时不触发 toast', () => {
    renderHook(() => useWebSocketNotifications());

    const handler = subscriptions.get('stream-status');
    handler!({
      type: 'stream-status',
      payload: {
        stream_id: 'cam-02',
        status: 'unknown_status',
      },
      timestamp: new Date().toISOString(),
    });

    expect(mockToast).not.toHaveBeenCalled();
  });
});
