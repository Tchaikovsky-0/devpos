import React from 'react';
import { cn } from '../../lib/utils';
import {
  Filter,
  Flame,
  ShieldAlert,
  AlertCircle,
  Truck,
  User,
} from 'lucide-react';
import {
  Alert,
  AlertType,
  AlertPriority,
  AlertStatus,
  AlertFilter,
  alertTypeConfig,
  alertPriorityConfig,
  alertStatusConfig,
} from '../../types/alert';

const typeIcons: Record<AlertType, React.ReactNode> = {
  fire: <Flame className="w-4 h-4" />,
  intrusion: <ShieldAlert className="w-4 h-4" />,
  defect: <AlertCircle className="w-4 h-4" />,
  vehicle: <Truck className="w-4 h-4" />,
  person: <User className="w-4 h-4" />,
};

interface AlertFilterSidebarProps {
  alerts: Alert[];
  filter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
}

/**
 * AlertFilterSidebar — 左侧过滤器面板
 * 包含状态、优先级、类型三组过滤器
 */
export const AlertFilterSidebar: React.FC<AlertFilterSidebarProps> = ({
  alerts,
  filter,
  onFilterChange,
}) => {
  const toggleStatus = (status: AlertStatus): void => {
    onFilterChange({
      ...filter,
      statuses: filter.statuses?.includes(status)
        ? filter.statuses.filter(s => s !== status)
        : [...(filter.statuses || []), status],
    });
  };

  const togglePriority = (priority: AlertPriority): void => {
    onFilterChange({
      ...filter,
      priorities: filter.priorities?.includes(priority)
        ? filter.priorities.filter(p => p !== priority)
        : [...(filter.priorities || []), priority],
    });
  };

  const toggleType = (type: AlertType): void => {
    onFilterChange({
      ...filter,
      types: filter.types?.includes(type)
        ? filter.types.filter(t => t !== type)
        : [...(filter.types || []), type],
    });
  };

  return (
    <div className="w-56 border-r border-border p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4" />
        过滤器
      </h2>

      {/* Status Filter */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-text-primary0 uppercase tracking-wider mb-2">状态</h3>
        <div className="space-y-1">
          {(['pending', 'processing', 'resolved', 'ignored'] as AlertStatus[]).map(status => (
            <button
              key={status}
              className={cn(
                'w-full px-3 py-1.5 rounded-lg text-sm flex items-center justify-between',
                'transition-colors duration-150',
                filter.statuses?.includes(status)
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:bg-bg-hover'
              )}
              onClick={() => toggleStatus(status)}
            >
              <span>{alertStatusConfig[status].label}</span>
              <span className="text-xs text-text-disabled">
                {alerts.filter(a => a.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-text-primary0 uppercase tracking-wider mb-2">优先级</h3>
        <div className="space-y-1">
          {(['P0', 'P1', 'P2', 'P3'] as AlertPriority[]).map(priority => (
            <button
              key={priority}
              className={cn(
                'w-full px-3 py-1.5 rounded-lg text-sm flex items-center justify-between',
                'transition-colors duration-150',
                filter.priorities?.includes(priority)
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:bg-bg-hover'
              )}
              onClick={() => togglePriority(priority)}
            >
              <span>{priority} - {alertPriorityConfig[priority].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <h3 className="text-xs font-medium text-text-primary0 uppercase tracking-wider mb-2">类型</h3>
        <div className="space-y-1">
          {(['fire', 'intrusion', 'defect', 'vehicle', 'person'] as AlertType[]).map(type => (
            <button
              key={type}
              className={cn(
                'w-full px-3 py-1.5 rounded-lg text-sm flex items-center gap-2',
                'transition-colors duration-150',
                filter.types?.includes(type)
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:bg-bg-hover'
              )}
              onClick={() => toggleType(type)}
            >
              <span style={{ color: alertTypeConfig[type].color }}>{typeIcons[type]}</span>
              <span>{alertTypeConfig[type].label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
