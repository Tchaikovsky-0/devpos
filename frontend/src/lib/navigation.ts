/**
 * 跨模块导航工具函数
 * 生成带查询参数的路由路径，用于模块间数据关联
 */

export function buildAlertPath(params: { streamId?: string; level?: string }): string {
  const search = new URLSearchParams();
  if (params.streamId) search.set('stream_id', params.streamId);
  if (params.level) search.set('level', params.level);
  const qs = search.toString();
  return `/alerts${qs ? `?${qs}` : ''}`;
}

export function buildMediaPath(params: { alertId?: string; timestamp?: string; streamId?: string }): string {
  const search = new URLSearchParams();
  if (params.alertId) search.set('alert_id', params.alertId);
  if (params.timestamp) search.set('timestamp', params.timestamp);
  if (params.streamId) search.set('stream_id', params.streamId);
  const qs = search.toString();
  return `/media${qs ? `?${qs}` : ''}`;
}

export function buildDashboardPath(params: { streamId?: string; highlight?: boolean }): string {
  const search = new URLSearchParams();
  if (params.streamId) search.set('stream_id', params.streamId);
  if (params.highlight) search.set('highlight', 'true');
  const qs = search.toString();
  return `/dashboard${qs ? `?${qs}` : ''}`;
}
