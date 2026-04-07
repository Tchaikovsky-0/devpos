// =============================================================================
// AlertActionPanel - 告警处置面板
// =============================================================================
// 侧边告警处置面板，支持：
// - 告警列表浏览
// - 快速处置操作（确认/解决/误报）
// - 告警级别筛选
// - 告警详情查看
// =============================================================================

import React, { useCallback, useMemo, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  X,
  Clock,
  MapPin,
  ChevronRight,
  Trash2,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeAlert } from '@/hooks/useAlertNotification';
import { useResolveAlertMutation, useAcknowledgeAlertMutation } from '@/store/api/alertsApi';

// ── Types ──

interface AlertActionPanelProps {
  /** 告警列表 */
  alerts: RealtimeAlert[];
  /** 是否展开面板 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 告警总数 */
  totalCount: number;
  /** 级别筛选 */
  selectedLevels?: string[];
  /** 设置级别筛选 */
  onLevelChange?: (levels: string[]) => void;
  className?: string;
}

// ── Level config ──

const LEVEL_CONFIG: Record<string, {
  bg: string;
  border: string;
  badge: string;
  text: string;
  label: string;
}> = {
  P0: {
    bg: 'bg-error-muted',
    border: 'border-error',
    badge: 'bg-error text-text-primary',
    text: 'text-error',
    label: '紧急',
  },
  P1: {
    bg: 'bg-orange-950/40',
    border: 'border-orange-900/50',
    badge: 'bg-orange-600 text-text-primary',
    text: 'text-orange-200',
    label: '重要',
  },
  P2: {
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-900/50',
    badge: 'bg-yellow-600 text-text-primary',
    text: 'text-yellow-200',
    label: '警告',
  },
  P3: {
    bg: 'bg-accent-muted',
    border: 'border-accent',
    badge: 'bg-accent-strong text-text-primary',
    text: 'text-accent',
    label: '提示',
  },
};

const ALL_LEVELS = ['P0', 'P1', 'P2', 'P3'] as const;

// ── Component ──

export const AlertActionPanel: React.FC<AlertActionPanelProps> = memo(({
  alerts,
  isOpen,
  onClose,
  totalCount,
  selectedLevels = ['P0', 'P1', 'P2', 'P3'],
  onLevelChange,
  className,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterLevels, setFilterLevels] = useState<string[]>(selectedLevels);
  const navigate = useNavigate();

  const [resolveAlert] = useResolveAlertMutation();
  const [acknowledgeAlert] = useAcknowledgeAlertMutation();

  // Filter alerts by selected levels
  const filteredAlerts = useMemo(
    () => alerts.filter((a) => filterLevels.includes(a.level)),
    [alerts, filterLevels],
  );

  const handleLevelFilter = useCallback((level: string) => {
    const next = filterLevels.includes(level)
      ? filterLevels.filter((l) => l !== level)
      : [...filterLevels, level];
    setFilterLevels(next);
    onLevelChange?.(next);
  }, [filterLevels, onLevelChange]);

  const handleResolve = useCallback(
    async (e: React.MouseEvent, alertId: string) => {
      e.stopPropagation();
      try {
        await resolveAlert(alertId).unwrap();
      } catch (err) {
        console.error('[AlertActionPanel] Resolve failed:', err);
      }
    },
    [resolveAlert],
  );

  const handleAcknowledge = useCallback(
    async (e: React.MouseEvent, alertId: string) => {
      e.stopPropagation();
      try {
        await acknowledgeAlert(alertId).unwrap();
      } catch (err) {
        console.error('[AlertActionPanel] Acknowledge failed:', err);
      }
    },
    [acknowledgeAlert],
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[400px] bg-bg-secondary border-l border-border z-50',
          'transform transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <h2 className="text-base font-semibold text-text-primary">告警中心</h2>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Level Filter */}
        <div className="px-4 py-2.5 border-b border-gray-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">级别筛选</span>
          </div>
          <div className="flex gap-1.5">
            {ALL_LEVELS.map((level) => {
              const config = LEVEL_CONFIG[level];
              const isActive = filterLevels.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => handleLevelFilter(level)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    isActive
                      ? `${config.badge} shadow-sm`
                      : 'bg-gray-800/50 text-gray-500 hover:bg-gray-700/50',
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <CheckCircle className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">暂无告警</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {filteredAlerts.map((alert) => {
                const config = LEVEL_CONFIG[alert.level] ?? LEVEL_CONFIG.P3;
                const isExpanded = expandedId === alert.id;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'transition-colors',
                      !alert.read && config.bg,
                    )}
                  >
                    {/* Alert Header */}
                    <div
                      className="px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors"
                      onClick={() => handleToggleExpand(alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Level badge */}
                        <span className={cn(
                          'flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5',
                          config.badge,
                        )}>
                          {alert.level}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={cn('text-sm font-medium truncate', config.text)}>
                              {alert.title}
                            </h4>
                            {!alert.read && (
                              <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatTime(alert.timestamp)}
                            </span>
                            {alert.streamName && (
                              <span className="text-xs text-gray-500 truncate">
                                {alert.streamName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand icon */}
                        <ChevronRight className={cn(
                          'h-4 w-4 text-gray-500 flex-shrink-0 transition-transform',
                          isExpanded && 'rotate-90',
                        )} />
                      </div>

                      {/* Quick actions (shown when expanded) */}
                      {isExpanded && (
                        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleAcknowledge(e, alert.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-accent-muted text-accent text-xs rounded-lg hover:bg-accent-muted transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            确认
                          </button>
                          <button
                            onClick={(e) => handleResolve(e, alert.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-success-muted text-success text-xs rounded-lg hover:bg-success-muted transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            解决
                          </button>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 text-gray-400 text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            误报
                          </button>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 text-gray-400 text-xs rounded-lg hover:bg-gray-700 transition-colors ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className={cn(
                          'rounded-lg p-3 border text-xs space-y-2',
                          config.bg,
                          config.border,
                        )}>
                          <p className="text-gray-300">{alert.message}</p>
                          {alert.location && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {alert.location}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800/50">
          <button
            onClick={() => navigate('/alerts')}
            className="w-full py-2 text-sm text-accent hover:text-accent hover:bg-accent-muted rounded-lg transition-colors"
          >
            查看全部告警 →
          </button>
        </div>
      </div>
    </>
  );
});

AlertActionPanel.displayName = 'AlertActionPanel';

export default AlertActionPanel;
