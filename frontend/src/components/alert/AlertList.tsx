// =============================================================================
// AlertList - 告警列表组件
// =============================================================================

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertFilter, AlertPriority, AlertStatus } from '@/types/alert';
import { AlertListItem } from './AlertListItem';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface AlertListProps {
  alerts: Alert[];
  selectedAlertId: string | null;
  onSelectAlert: (alert: Alert) => void;
  filter?: AlertFilter;
  onFilterChange?: (filter: AlertFilter) => void;
  className?: string;
}

type SortField = 'timestamp' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

const priorityWeight: Record<AlertPriority, number> = {
  P0: 4,
  P1: 3,
  P2: 2,
  P3: 1,
};

const statusWeight: Record<AlertStatus, number> = {
  pending: 4,
  processing: 3,
  resolved: 2,
  ignored: 1,
};


export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  selectedAlertId,
  onSelectAlert,
  filter,
  onFilterChange,
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState(filter?.searchQuery || '');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    field: 'timestamp',
    order: 'desc',
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Apply filters
    if (filter?.types?.length) {
      result = result.filter((a) => filter.types!.includes(a.type));
    }
    if (filter?.priorities?.length) {
      result = result.filter((a) => filter.priorities!.includes(a.priority));
    }
    if (filter?.statuses?.length) {
      result = result.filter((a) => filter.statuses!.includes(a.status));
    }
    if (filter?.cameraIds?.length) {
      result = result.filter((a) => filter.cameraIds!.includes(a.cameraId));
    }
    if (filter?.dateRange) {
      result = result.filter(
        (a) =>
          new Date(a.timestamp) >= filter.dateRange!.start &&
          new Date(a.timestamp) <= filter.dateRange!.end
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.cameraName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'priority':
          comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
          break;
        case 'status':
          comparison = statusWeight[a.status] - statusWeight[b.status];
          break;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [alerts, filter, searchQuery, sortConfig]);

  // Handle sort toggle
  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // Focus search on '/' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredAlerts.length,
      pending: filteredAlerts.filter((a) => a.status === 'pending').length,
    };
  }, [filteredAlerts]);

  return (
    <div className={cn('flex flex-col h-full bg-surface border-r border-border-strong', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-strong">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">告警列表</h3>
          <span className="text-xs text-text-primary0">
            ({stats.pending} 待处理 / {stats.total} 总计)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSort('timestamp')}
            className={cn(
              'p-1.5 rounded transition-colors',
              sortConfig.field === 'timestamp'
                ? 'text-accent bg-accent-muted'
                : 'text-text-secondary hover:text-text-secondary hover:bg-bg-hover'
            )}
            title="按时间排序"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showFilters
                ? 'text-accent bg-accent-muted'
                : 'text-text-secondary hover:text-text-secondary hover:bg-bg-hover'
            )}
            title="筛选"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-border-strong">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索告警... (/)"
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-bg-hover border border-border-strong rounded-md
                       text-text-secondary placeholder:text-text-primary0
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                       transition-all"
          />
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border-strong"
          >
            <div className="px-3 py-2 space-y-2">
              {/* Priority Filter */}
              <div className="flex flex-wrap gap-1.5">
                {(['P0', 'P1', 'P2', 'P3'] as AlertPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const current = filter?.priorities || [];
                      const updated = current.includes(p)
                        ? current.filter((x) => x !== p)
                        : [...current, p];
                      onFilterChange?.({ ...filter, priorities: updated });
                    }}
                    className={cn(
                      'px-2 py-0.5 text-[11px] font-medium rounded transition-colors',
                      filter?.priorities?.includes(p)
                        ? 'bg-accent-muted text-accent border border-accent'
                        : 'bg-bg-hover text-text-secondary border border-border-strong hover:bg-bg-muted'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {/* Status Filter */}
              <div className="flex flex-wrap gap-1.5">
                {(['pending', 'processing', 'resolved', 'ignored'] as AlertStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const current = filter?.statuses || [];
                      const updated = current.includes(s)
                        ? current.filter((x) => x !== s)
                        : [...current, s];
                      onFilterChange?.({ ...filter, statuses: updated });
                    }}
                    className={cn(
                      'px-2 py-0.5 text-[11px] font-medium rounded transition-colors capitalize',
                      filter?.statuses?.includes(s)
                        ? 'bg-accent-muted text-accent border border-accent'
                        : 'bg-bg-hover text-text-secondary border border-border-strong hover:bg-bg-muted'
                    )}
                  >
                    {s === 'pending' && '待处理'}
                    {s === 'processing' && '处理中'}
                    {s === 'resolved' && '已解决'}
                    {s === 'ignored' && '已忽略'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert List */}
      <div className="flex-1 overflow-hidden">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.length > 50 ? (
            // Large dataset: show all in scrollable list
            <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredAlerts.map((alert) => (
                <AlertListItem
                  key={alert.id}
                  alert={alert}
                  isSelected={selectedAlertId === alert.id}
                  onClick={() => onSelectAlert(alert)}
                />
              ))}
            </div>
          ) : (
            // Regular list for smaller datasets
            <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredAlerts.map((alert) => (
                <AlertListItem
                  key={alert.id}
                  alert={alert}
                  isSelected={selectedAlertId === alert.id}
                  onClick={() => onSelectAlert(alert)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-primary0">
            <p className="text-sm">暂无告警</p>
            <p className="text-xs mt-1">当前筛选条件下没有匹配项</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertList;
