import React, { useRef, useState, useEffect, type CSSProperties, type ReactElement } from 'react';
import { List } from 'react-window';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';
import { AlertListItem } from './AlertListItem';
import {
  AlertTriangle,
  Search,
  Keyboard,
  CheckCircle2,
  Loader2,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { Alert } from '../../types/alert';
import type { AlertActionType } from '../../hooks/useAlertActions';

/** 每个告警项的固定高度（px），用于虚拟化渲染 */
const ALERT_ITEM_HEIGHT = 88;
/** 超过此数量启用虚拟化 */
const VIRTUALIZE_THRESHOLD = 50;

interface AlertStats {
  pending: number;
  processing: number;
  resolved: number;
}

interface AlertListPanelProps {
  filteredAlerts: Alert[];
  selectedId: string | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  total: number;
  stats: AlertStats;
  onSelect: (id: string) => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;
  onAction: (action: AlertActionType) => Promise<void>;
}

/**
 * AlertListPanel — 中间告警列表面板
 * 包含搜索框、统计 Badge、告警列表、底部快捷键提示
 */
export const AlertListPanel: React.FC<AlertListPanelProps> = ({
  filteredAlerts,
  selectedId,
  searchQuery,
  loading,
  error,
  total,
  stats,
  onSelect,
  onSearchChange,
  onRefresh,
  onShowHelp,
  onAction,
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            告警管理
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="danger" pulse={stats.pending > 0}>{stats.pending} 待处理</Badge>
            <Badge variant="warning">{stats.processing} 处理中</Badge>
            <Badge variant="success">{stats.resolved} 已解决</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-secondary hover:bg-bg-hover transition-colors"
            onClick={onRefresh}
            title="刷新告警列表"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary0" />
            <input
              id="alert-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索告警..."
              className={cn(
                'w-48 pl-9 pr-3 py-1.5 rounded-lg text-sm',
                'bg-bg-hover text-text-secondary placeholder:text-text-disabled',
                'border border-border',
                'focus:outline-none focus:border-accent',
                'transition-colors duration-150'
              )}
            />
          </div>

          {/* Help Button */}
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-secondary hover:bg-bg-hover transition-colors"
            onClick={onShowHelp}
            title="快捷键帮助 (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert List */}
      <VirtualizedAlertList
        filteredAlerts={filteredAlerts}
        selectedId={selectedId}
        loading={loading}
        error={error}
        onSelect={onSelect}
        onRefresh={onRefresh}
        onAction={onAction}
      />

      {/* Footer - Shortcuts Hint */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-text-primary0">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-bg-hover rounded">J</kbd> 下一个</span>
          <span><kbd className="px-1.5 py-0.5 bg-bg-hover rounded">K</kbd> 上一个</span>
          <span><kbd className="px-1.5 py-0.5 bg-bg-hover rounded">E</kbd> 确认</span>
          <span><kbd className="px-1.5 py-0.5 bg-bg-hover rounded">S</kbd> 忽略</span>
        </div>
        <span>共 {filteredAlerts.length} 条 (总计 {total})</span>
      </div>
    </div>
  );
};

/* ─── react-window v2 rowComponent ─── */

interface AlertRowProps {
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAction: (action: AlertActionType) => Promise<void>;
}

function AlertRowComponent({
  index,
  style,
  alerts,
  selectedId,
  onSelect,
  onAction,
}: {
  ariaAttributes: Record<string, unknown>;
  index: number;
  style: CSSProperties;
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAction: (action: AlertActionType) => Promise<void>;
}): ReactElement | null {
  const alert = alerts[index];
  if (!alert) return null;
  return (
    <div style={style}>
      <AlertListItem
        alert={alert}
        isSelected={selectedId === alert.id}
        isRead={alert.status !== 'pending'}
        onSelect={() => onSelect(alert.id)}
        onAction={onAction}
      />
    </div>
  );
}

/* ─── 虚拟化告警列表子组件 ─── */

interface VirtualizedAlertListProps {
  filteredAlerts: Alert[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onAction: (action: AlertActionType) => Promise<void>;
}

const VirtualizedAlertList: React.FC<VirtualizedAlertListProps> = ({
  filteredAlerts,
  selectedId,
  loading,
  error,
  onSelect,
  onRefresh,
  onAction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // 用 ResizeObserver 持续监听容器高度
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <span className="text-sm">加载告警数据中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <WifiOff className="w-10 h-10 text-error" />
          <span className="text-sm text-error">{error}</span>
          <button
            onClick={onRefresh}
            className="mt-2 px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-primary0">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无告警</p>
        </div>
      </div>
    );
  }

  // 小数据集普通渲染
  if (filteredAlerts.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div>
          {filteredAlerts.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              isSelected={selectedId === alert.id}
              isRead={alert.status !== 'pending'}
              onSelect={() => onSelect(alert.id)}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    );
  }

  // 大数据集虚拟化渲染
  return (
    <div ref={containerRef} className="flex-1 overflow-hidden">
      <List<AlertRowProps>
        rowComponent={AlertRowComponent}
        rowProps={{
          alerts: filteredAlerts,
          selectedId,
          onSelect,
          onAction,
        }}
        rowCount={filteredAlerts.length}
        rowHeight={ALERT_ITEM_HEIGHT}
        overscanCount={5}
        style={{ height: containerHeight, width: '100%' }}
      />
    </div>
  );
};
