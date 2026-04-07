/**
 * navigation.ts 单元测试
 * 测试 buildAlertPath / buildMediaPath / buildDashboardPath 路径构建工具函数
 */

import { describe, it, expect } from 'vitest';
import { buildAlertPath, buildMediaPath, buildDashboardPath } from '../../src/lib/navigation';

describe('buildAlertPath', () => {
  it('无参数时返回 /alerts', () => {
    expect(buildAlertPath({})).toBe('/alerts');
  });

  it('带 streamId 参数', () => {
    expect(buildAlertPath({ streamId: 'cam-01' })).toBe('/alerts?stream_id=cam-01');
  });

  it('带 level 参数', () => {
    expect(buildAlertPath({ level: 'P0' })).toBe('/alerts?level=P0');
  });

  it('同时带 streamId 和 level', () => {
    const result = buildAlertPath({ streamId: 'cam-01', level: 'P1' });
    expect(result).toContain('/alerts?');
    expect(result).toContain('stream_id=cam-01');
    expect(result).toContain('level=P1');
  });

  it('特殊字符被正确编码', () => {
    const result = buildAlertPath({ streamId: 'cam 01&test' });
    expect(result).toContain('stream_id=cam+01%26test');
  });

  it('空字符串参数不添加到查询字符串', () => {
    expect(buildAlertPath({ streamId: '', level: '' })).toBe('/alerts');
  });
});

describe('buildMediaPath', () => {
  it('无参数时返回 /media', () => {
    expect(buildMediaPath({})).toBe('/media');
  });

  it('带 alertId 参数', () => {
    expect(buildMediaPath({ alertId: 'a-123' })).toBe('/media?alert_id=a-123');
  });

  it('带 timestamp 参数', () => {
    expect(buildMediaPath({ timestamp: '2026-01-01T00:00:00Z' })).toBe(
      '/media?timestamp=2026-01-01T00%3A00%3A00Z',
    );
  });

  it('带 streamId 参数', () => {
    expect(buildMediaPath({ streamId: 's-1' })).toBe('/media?stream_id=s-1');
  });

  it('同时带所有参数', () => {
    const result = buildMediaPath({ alertId: 'a1', timestamp: 't1', streamId: 's1' });
    expect(result).toContain('/media?');
    expect(result).toContain('alert_id=a1');
    expect(result).toContain('timestamp=t1');
    expect(result).toContain('stream_id=s1');
  });

  it('空字符串参数不添加到查询字符串', () => {
    expect(buildMediaPath({ alertId: '', timestamp: '' })).toBe('/media');
  });
});

describe('buildDashboardPath', () => {
  it('无参数时返回 /dashboard', () => {
    expect(buildDashboardPath({})).toBe('/dashboard');
  });

  it('带 streamId 参数', () => {
    expect(buildDashboardPath({ streamId: 'cam-02' })).toBe('/dashboard?stream_id=cam-02');
  });

  it('highlight 为 true 时添加参数', () => {
    expect(buildDashboardPath({ highlight: true })).toBe('/dashboard?highlight=true');
  });

  it('highlight 为 false 时不添加参数', () => {
    expect(buildDashboardPath({ highlight: false })).toBe('/dashboard');
  });

  it('同时带 streamId 和 highlight', () => {
    const result = buildDashboardPath({ streamId: 'cam-02', highlight: true });
    expect(result).toContain('/dashboard?');
    expect(result).toContain('stream_id=cam-02');
    expect(result).toContain('highlight=true');
  });
});
