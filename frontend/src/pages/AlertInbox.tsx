import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertFilterSidebar } from '../components/alert/AlertFilterSidebar';
import { AlertListPanel } from '../components/alert/AlertListPanel';
import { AlertDetail } from '../components/alert/AlertDetail';
import { KeyboardShortcutsModal } from '../components/alert/KeyboardShortcutsModal';
import { useAlertShortcuts } from '../hooks/useAlertShortcuts';
import { useAlertActions } from '../hooks/useAlertActions';
import { Alert, AlertFilter } from '../types/alert';
import { Alert as ApiAlert } from '../types/api/alerts';
import type { AlertPriority, AlertStatus } from '../types/alert';
import { useGetAlertsQuery } from '../store/api/alertsApi';
import { extractListData } from '../types/api/response';
import type { AlertListParams } from '../types/api/alerts';

/**
 * AlertInbox - 告警收件箱 (页面容器)
 * 管理核心状态、RTK Query 数据获取、组合子组件
 * WebSocket 实时推送由 Redux websocketMiddleware 自动处理缓存更新
 */

// --------------------------------------------------------------------------
// 类型映射工具
// --------------------------------------------------------------------------

/** 将后端 API Alert 映射到前端 UI Alert */
function mapApiAlertToUiAlert(apiAlert: ApiAlert): Alert {
  const levelToPriority: Record<string, AlertPriority> = {
    CRIT: 'P0',
    WARN: 'P1',
    INFO: 'P2',
    OFFLINE: 'P3',
  };

  const statusMap: Record<string, AlertStatus> = {
    pending: 'pending',
    resolved: 'resolved',
    false_alarm: 'ignored',
  };

  const typeMap: Record<string, Alert['type']> = {
    fire: 'fire',
    intrusion: 'intrusion',
    defect: 'defect',
    vehicle: 'vehicle',
    person: 'person',
    equipment: 'defect',
    environment: 'defect',
    offline: 'defect',
  };

  return {
    id: apiAlert.id,
    type: typeMap[apiAlert.type] || 'defect',
    priority: levelToPriority[apiAlert.level] || 'P2',
    status: apiAlert.acknowledged
      ? (statusMap[apiAlert.status] === 'pending' ? 'processing' : statusMap[apiAlert.status] || 'processing')
      : (statusMap[apiAlert.status] || 'pending'),
    title: apiAlert.title,
    description: apiAlert.message,
    cameraId: apiAlert.stream_id || '',
    cameraName: apiAlert.location || `流-${apiAlert.stream_id || '未知'}`,
    timestamp: new Date(apiAlert.created_at),
  };
}

// --------------------------------------------------------------------------
// UI → API 过滤器映射
// --------------------------------------------------------------------------

const STATUS_TO_API: Record<string, string> = {
  pending: 'pending',
  processing: 'pending',
  resolved: 'resolved',
  ignored: 'false_alarm',
};

const PRIORITY_TO_LEVEL: Record<string, string> = {
  P0: 'CRIT',
  P1: 'WARN',
  P2: 'INFO',
  P3: 'OFFLINE',
};

// --------------------------------------------------------------------------
// 页面组件
// --------------------------------------------------------------------------

const PAGE_SIZE = 50;

const AlertInbox: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlStreamId = searchParams.get('stream_id');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AlertFilter>({});
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply stream_id filter from URL query params
  useEffect(() => {
    if (urlStreamId) {
      setSearchQuery(urlStreamId);
    }
  }, [urlStreamId]);

  // --------------------------------------------------------------------------
  // 构造 RTK Query 参数
  // --------------------------------------------------------------------------
  const queryParams = useMemo((): AlertListParams => {
    const params: AlertListParams = { page: 1, page_size: PAGE_SIZE };

    if (filter.statuses?.length === 1) {
      params.status = STATUS_TO_API[filter.statuses[0]] as AlertListParams['status'];
    }

    if (filter.priorities?.length === 1) {
      params.level = PRIORITY_TO_LEVEL[filter.priorities[0]] as AlertListParams['level'];
    }

    if (searchQuery) {
      params.keyword = searchQuery;
    }

    return params;
  }, [filter.statuses, filter.priorities, searchQuery]);

  // --------------------------------------------------------------------------
  // RTK Query 数据获取
  // --------------------------------------------------------------------------
  const {
    data: alertsResponse,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useGetAlertsQuery(queryParams);

  // 从 RTK Query 响应中提取并映射数据
  const { alerts, total } = useMemo(() => {
    if (!alertsResponse) {
      return { alerts: [] as Alert[], total: 0 };
    }
    const extracted = extractListData(alertsResponse);
    return {
      alerts: extracted.items.map(mapApiAlertToUiAlert),
      total: extracted.total,
    };
  }, [alertsResponse]);

  const error = queryError
    ? ('status' in queryError ? `请求失败 (${queryError.status})` : queryError.message || '加载告警数据失败')
    : null;

  // --------------------------------------------------------------------------
  // 过滤 + 派生状态
  // --------------------------------------------------------------------------
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filter.types?.length && !filter.types.includes(alert.type)) return false;
      if (filter.priorities?.length && !filter.priorities.includes(alert.priority)) return false;
      if (filter.statuses?.length && !filter.statuses.includes(alert.status)) return false;
      if (searchQuery && !filter.statuses && !filter.priorities) {
        const query = searchQuery.toLowerCase();
        return (
          alert.title.toLowerCase().includes(query) ||
          alert.description.toLowerCase().includes(query) ||
          alert.cameraName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [alerts, filter, searchQuery]);

  const selectedAlert = useMemo(() => alerts.find(a => a.id === selectedId) || null, [alerts, selectedId]);

  const stats = useMemo(() => ({
    total: alerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    processing: alerts.filter(a => a.status === 'processing').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }), [alerts]);

  // --------------------------------------------------------------------------
  // 导航
  // --------------------------------------------------------------------------
  const selectNext = useCallback(() => {
    const idx = filteredAlerts.findIndex(a => a.id === selectedId);
    const next = idx < filteredAlerts.length - 1 ? idx + 1 : 0;
    setSelectedId(filteredAlerts[next]?.id || null);
  }, [filteredAlerts, selectedId]);

  const selectPrev = useCallback(() => {
    const idx = filteredAlerts.findIndex(a => a.id === selectedId);
    const prev = idx > 0 ? idx - 1 : filteredAlerts.length - 1;
    setSelectedId(filteredAlerts[prev]?.id || null);
  }, [filteredAlerts, selectedId]);

  // --------------------------------------------------------------------------
  // 操作 Hook
  // --------------------------------------------------------------------------
  const { handleAction } = useAlertActions({
    selectedId,
    selectNext,
  });

  // --------------------------------------------------------------------------
  // 键盘快捷键
  // --------------------------------------------------------------------------
  useAlertShortcuts({
    onNext: selectNext,
    onPrev: selectPrev,
    onAcknowledge: () => handleAction('acknowledge'),
    onIgnore: () => handleAction('ignore'),
    onResolve: () => handleAction('resolve'),
    onShowHelp: () => setShowHelp(true),
    onSearch: () => document.getElementById('alert-search')?.focus(),
  });

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="h-full flex bg-bg-primary">
      <AlertFilterSidebar
        alerts={alerts}
        filter={filter}
        onFilterChange={setFilter}
      />

      <AlertListPanel
        filteredAlerts={filteredAlerts}
        selectedId={selectedId}
        searchQuery={searchQuery}
        loading={loading}
        error={error}
        total={total}
        stats={stats}
        onSelect={setSelectedId}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        onShowHelp={() => setShowHelp(true)}
        onAction={handleAction}
      />

      <AlertDetail
        alert={selectedAlert}
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        onAction={handleAction}
      />

      <KeyboardShortcutsModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default AlertInbox;
