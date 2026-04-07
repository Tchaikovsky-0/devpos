import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import Badge, { PriorityBadge } from '../ui/Badge';
import { Alert, AlertType, AlertStatus } from '../../types/alert';
import { alertTypeConfig, alertStatusConfig } from '../../types/alert';
import {
  Flame,
  ShieldAlert,
  AlertCircle,
  Truck,
  User,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
// 简化的相对时间格式化
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};

/**
 * AlertListItem - 告警列表项
 * 类似现代邮件客户端的紧凑卡片设计
 */

export interface AlertListItemProps {
  /** 告警数据 */
  alert: Alert;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否已读 */
  isRead?: boolean;
  /** 点击回调 */
  onSelect?: () => void;
  /** 操作回调 */
  onAction?: (action: 'acknowledge' | 'ignore' | 'resolve') => void;
  /** 自定义样式 */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

const typeIcons: Record<AlertType, React.ReactNode> = {
  fire: <Flame className="w-4 h-4" />,
  intrusion: <ShieldAlert className="w-4 h-4" />,
  defect: <AlertCircle className="w-4 h-4" />,
  vehicle: <Truck className="w-4 h-4" />,
  person: <User className="w-4 h-4" />,
};

export const AlertListItem = forwardRef<HTMLDivElement, AlertListItemProps>(
  (
    {
      alert,
      isSelected = false,
      isRead = false,
      onSelect,
      onAction,
      className,
    },
    ref
  ) => {
    const typeConfig = alertTypeConfig[alert.type];
    const statusConfig = alertStatusConfig[alert.status];

    return (
      <motion.div
        ref={ref}
        className={cn(
          'group relative px-4 py-3 cursor-pointer',
          'border-b border-border',
          'transition-all duration-150',
          isSelected
            ? 'bg-accent-muted border-l-2 border-l-blue-400'
            : 'border-l-2 border-l-transparent hover:bg-bg-hover',
          !isRead && 'bg-bg-hover',
          className
        )}
        onClick={onSelect}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              'bg-opacity-15'
            )}
            style={{
              backgroundColor: `${typeConfig.color}20`,
              color: typeConfig.color,
            }}
          >
            {typeIcons[alert.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <PriorityBadge priority={alert.priority} size="sm" />
              <span className={cn(
                'text-sm truncate',
                !isRead ? 'font-semibold text-text-primary' : 'text-text-tertiary'
              )}>
                {alert.title}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-text-primary0">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-bg-muted" />
                {alert.cameraName}
              </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(alert.timestamp)}
                </span>
            </div>

            {/* Description (only on selected or hover) */}
            {(isSelected || alert.description) && (
              <p className="mt-1.5 text-xs text-text-secondary line-clamp-2">
                {alert.description}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            <Badge
              variant={getStatusVariant(alert.status)}
              size="sm"
              className="text-[10px]"
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Quick Actions (visible on hover/selected) */}
        {(isSelected) && (
          <motion.div
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {alert.status === 'pending' && (
              <>
                <QuickActionButton
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  label="处理"
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('acknowledge');
                  }}
                />
                <QuickActionButton
                  icon={<XCircle className="w-3.5 h-3.5" />}
                  label="忽略"
                  color="slate"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('ignore');
                  }}
                />
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

AlertListItem.displayName = 'AlertListItem';

/**
 * QuickActionButton - 快速操作按钮
 */
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'slate' | 'red' | 'green';
  onClick: (e: React.MouseEvent) => void;
}

const QuickActionButton = ({ icon, label, color, onClick }: QuickActionButtonProps) => {
  const colorStyles = {
    blue: 'bg-accent-muted text-accent hover:bg-accent-muted',
    slate: 'bg-bg-muted text-text-secondary hover:bg-bg-muted',
    red: 'bg-error-muted text-error hover:bg-error-muted',
    green: 'bg-success-muted text-success hover:bg-success-muted',
  };

  return (
    <button
      className={cn(
        'w-7 h-7 rounded-md flex items-center justify-center',
        'transition-colors duration-150',
        colorStyles[color]
      )}
      onClick={onClick}
      title={label}
    >
      {icon}
    </button>
  );
};

/**
 * 获取状态对应的Badge变体
 */
const getStatusVariant = (status: AlertStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const variants: Record<AlertStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'danger',
    processing: 'warning',
    resolved: 'success',
    ignored: 'default',
  };
  return variants[status];
};

export default AlertListItem;
