// =============================================================================
// DetectionHistory - YOLO 检测历史记录
// =============================================================================
// 展示 YOLO 检测历史，支持：
// - 按时间/类型/流过滤
// - 检测详情展开
// - 缩略图预览
// - 统计概览
// =============================================================================

import React, { useCallback, useMemo, useState, memo } from 'react';
import {
  Eye,
  Clock,
  Video,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DetectionRecord } from '@/hooks/useYOLODetection';
// YOLODetection type is used for DetectionRecord via useYOLODetection hook

// ── Types ──

interface DetectionHistoryProps {
  /** 检测历史记录 */
  history: DetectionRecord[];
  /** 是否展开面板 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 流名称映射 */
  streamNames?: Record<string, string>;
  className?: string;
}

// ── Detection class labels & colors ──

const CLASS_CONFIG: Record<string, {
  label: string;
  color: string;
  badge: string;
  text: string;
}> = {
  fire:       { label: '火焰',    color: 'text-error',   badge: 'bg-error',   text: 'text-error' },
  smoke:      { label: '烟雾',    color: 'text-error',   badge: 'bg-error',   text: 'text-error' },
  intrusion:  { label: '入侵',    color: 'text-accent-soft',badge: 'bg-accent-soft',text: 'text-accent-soft' },
  person:     { label: '人员',    color: 'text-accent',  badge: 'bg-accent-strong',  text: 'text-accent' },
  vehicle:    { label: '车辆',    color: 'text-success',  badge: 'bg-success', text: 'text-success' },
  crack:      { label: '裂缝',    color: 'text-orange-400',badge: 'bg-orange-600',text: 'text-orange-200' },
  corrosion:  { label: '腐蚀',    color: 'text-orange-400',badge: 'bg-yellow-700',text: 'text-yellow-200' },
  animal:     { label: '动物',    color: 'text-yellow-400',badge: 'bg-yellow-600',text: 'text-yellow-200' },
  default:    { label: '其他',    color: 'text-gray-400',  badge: 'bg-gray-600',  text: 'text-gray-200' },
};

function getClassConfig(className: string) {
  return CLASS_CONFIG[className.toLowerCase()] ?? CLASS_CONFIG.default;
}

// ── Component ──

export const DetectionHistory: React.FC<DetectionHistoryProps> = memo(({
  history,
  isOpen,
  onClose,
  streamNames = {},
  className,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const ALERT_CLASSES = useMemo(() => new Set(['fire', 'intrusion', 'smoke']), []);

  // Stats
  const stats = useMemo(() => {
    const total = history.length;
    const alerts = history.filter((r) => r.detections.some((d) => ALERT_CLASSES.has(d.class_name))).length;
    const byType: Record<string, number> = {};
    history.forEach((r) => {
      r.detections.forEach((d) => {
        byType[d.class_name] = (byType[d.class_name] ?? 0) + 1;
      });
    });
    return { total, alerts, byType };
  }, [history, ALERT_CLASSES]);

  // Unique stream IDs
  const streamIds = useMemo(() => [...new Set(history.map((r) => r.streamId))], [history]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      if (filterStream !== 'all' && record.streamId !== filterStream) return false;
      if (showOnlyAlerts && !record.hasAlert) return false;
      if (filterType !== 'all') {
        const hasType = record.detections.some((d) => d.class_name === filterType);
        if (!hasType) return false;
      }
      return true;
    });
  }, [history, filterStream, filterType, showOnlyAlerts]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return '刚刚';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const formatFullTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
          'fixed bottom-0 left-0 right-0 h-[60vh] bg-bg-secondary border-t border-border z-50',
          'transform transition-transform duration-300 ease-in-out flex flex-col rounded-t-2xl',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className,
        )}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-info" />
              <h3 className="text-sm font-semibold text-text-primary">检测历史</h3>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-400">
                共 <span className="text-text-primary font-medium">{stats.total}</span> 条
              </span>
              <span className="text-orange-400">
                告警 <span className="font-medium">{stats.alerts}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-4 pb-3">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-info/50"
          >
            <option value="all">全部类型</option>
            {Object.entries(CLASS_CONFIG)
              .filter(([k]) => k !== 'default')
              .map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
          </select>

          {/* Stream filter */}
          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-info/50"
          >
            <option value="all">全部流</option>
            {streamIds.map((id) => (
              <option key={id} value={id}>
                {streamNames[id] ?? `Stream #${id}`}
              </option>
            ))}
          </select>

          {/* Alert only toggle */}
          <button
            onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors',
              showOnlyAlerts
                ? 'bg-orange-600/30 text-orange-300 border border-orange-500/50'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50',
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            仅告警
          </button>

          {/* Result count */}
          <span className="text-xs text-gray-500 ml-auto">
            显示 {filteredHistory.length} 条
          </span>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Eye className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">暂无检测记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((record) => {
                const isExpanded = expandedId === record.id;
                const streamName = streamNames[record.streamId] ?? `Stream #${record.streamId}`;

                return (
                  <div
                    key={record.id}
                    className={cn(
                      'rounded-lg border transition-colors',
                      record.hasAlert
                        ? 'bg-error-muted border-error'
                        : 'bg-gray-800/30 border-gray-700/30',
                    )}
                  >
                    {/* Record header */}
                    <div
                      className="px-3 py-2.5 cursor-pointer hover:bg-bg-hover transition-colors"
                      onClick={() => handleToggleExpand(record.id)}
                    >
                      <div className="flex items-center gap-2">
                        {/* Time */}
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(record.timestamp)}
                        </span>

                        {/* Stream */}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Video className="h-3 w-3" />
                          {streamName}
                        </span>

                        {/* Detection count badges */}
                        <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
                          {record.detections.slice(0, 3).map((d, i) => {
                            const cfg = getClassConfig(d.class_name);
                            return (
                              <span
                                key={i}
                                className={cn(
                                  'text-[10px] font-medium px-1.5 py-0.5 rounded',
                                  cfg.badge,
                                  'text-text-primary',
                                )}
                              >
                                {cfg.label} {Math.round(d.confidence * 100)}%
                              </span>
                            );
                          })}
                          {record.detections.length > 3 && (
                            <span className="text-[10px] text-gray-500 px-1">
                              +{record.detections.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Alert indicator */}
                        {record.hasAlert && (
                          <AlertTriangle className="h-3.5 w-3.5 text-error flex-shrink-0" />
                        )}

                        {/* Expand icon */}
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-700/30 pt-2">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          {formatFullTime(record.timestamp)}
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {record.detections.map((det, i) => {
                            const cfg = getClassConfig(det.class_name);
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between px-2 py-1.5 rounded bg-black/20"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-xs font-medium', cfg.color)}>
                                    {cfg.label}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    置信度
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className={cn('h-full rounded-full', cfg.badge)}
                                      style={{ width: `${det.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-gray-400 w-10 text-right">
                                    {Math.round(det.confidence * 100)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

DetectionHistory.displayName = 'DetectionHistory';

export default DetectionHistory;
