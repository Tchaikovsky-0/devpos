// =============================================================================
// AlertNotification - 实时告警通知弹窗
// =============================================================================
// 浮动告警弹窗，显示在页面右上角，支持：
// - 不同级别不同颜色/图标
// - 自动消失 + 进度条倒计时
// - 点击查看详情 / 关闭
// - 动画入场/出场
// =============================================================================

import React, { useEffect, useState, useCallback, memo } from 'react';
import { AlertTriangle, Bell, Info, X, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeAlert } from '@/hooks/useAlertNotification';

// ── Types ──

interface AlertNotificationProps {
  /** 当前活跃的告警通知 */
  alert: RealtimeAlert | null;
  /** 显示持续时间(ms) */
  duration?: number;
  /** 关闭回调 */
  onDismiss: () => void;
  /** 点击查看详情回调 */
  onViewDetail?: (alert: RealtimeAlert) => void;
  /** 声音静音状态 */
  isMuted?: boolean;
  /** 切换静音回调 */
  onToggleMute?: () => void;
  /** 未读告警总数 */
  unreadCount?: number;
  /** 类名 */
  className?: string;
}

// ── Level config ──

const LEVEL_CONFIG: Record<string, {
  icon: typeof AlertTriangle;
  bg: string;
  border: string;
  text: string;
  badge: string;
  glow: string;
  label: string;
}> = {
  P0: {
    icon: AlertTriangle,
    bg: 'bg-error-muted',
    border: 'border-error',
    text: 'text-error',
    badge: 'bg-error text-text-primary',
    glow: 'shadow-error/30',
    label: '紧急',
  },
  P1: {
    icon: AlertTriangle,
    bg: 'bg-orange-950/90',
    border: 'border-orange-500/60',
    text: 'text-orange-100',
    badge: 'bg-orange-600 text-text-primary',
    glow: 'shadow-orange-500/20',
    label: '重要',
  },
  P2: {
    icon: Bell,
    bg: 'bg-yellow-950/90',
    border: 'border-yellow-500/60',
    text: 'text-yellow-100',
    badge: 'bg-yellow-600 text-text-primary',
    glow: 'shadow-yellow-500/15',
    label: '警告',
  },
  P3: {
    icon: Info,
    bg: 'bg-accent-muted',
    border: 'border-accent',
    text: 'text-accent',
    badge: 'bg-accent-strong text-text-primary',
    glow: 'shadow-glow/10',
    label: '提示',
  },
};

// ── Component ──

export const AlertNotification: React.FC<AlertNotificationProps> = memo(({
  alert,
  duration = 8000,
  onDismiss,
  onViewDetail,
  isMuted = false,
  onToggleMute,
  unreadCount = 0,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (alert) {
      // Small delay for CSS transition
      requestAnimationFrame(() => setVisible(true));
      setProgress(100);
    } else {
      setVisible(false);
    }
  }, [alert]);

  // Progress bar countdown
  useEffect(() => {
    if (!alert || paused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [alert, duration, paused, onDismiss]);

  const handleViewDetail = useCallback(() => {
    if (alert && onViewDetail) {
      onViewDetail(alert);
    }
    onDismiss();
  }, [alert, onViewDetail, onDismiss]);

  if (!alert) return null;

  const config = LEVEL_CONFIG[alert.level] ?? LEVEL_CONFIG.P2;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] w-[380px] transition-all duration-300',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main notification card */}
      <div
        className={cn(
          'relative rounded-lg border backdrop-blur-md shadow-lg',
          config.bg,
          config.border,
          config.glow,
          'shadow-xl',
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          {/* Icon */}
          <div className={cn('flex-shrink-0 rounded-full p-2', config.badge)}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', config.badge)}>
                {config.label}
              </span>
              <span className="text-xs text-gray-400">
                {alert.streamName ?? `Stream #${alert.streamId}`}
              </span>
            </div>
            <h4 className={cn('text-sm font-semibold mb-1', config.text)}>
              {alert.title}
            </h4>
            <p className="text-xs text-gray-300 line-clamp-2">
              {alert.message}
            </p>
            {alert.location && (
              <p className="text-xs text-gray-400 mt-1">
                📍 {alert.location}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-1 rounded hover:bg-bg-muted transition-colors"
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-gray-300" />
                )}
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[10px] text-gray-500">
            {new Date(alert.timestamp).toLocaleTimeString('zh-CN')}
          </span>
          <button
            onClick={handleViewDetail}
            className={cn(
              'flex items-center gap-1 text-xs font-medium transition-colors',
              config.text,
              'hover:underline',
            )}
          >
            查看详情
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-100 ease-linear',
              alert.level === 'P0' ? 'bg-error' :
              alert.level === 'P1' ? 'bg-orange-500' :
              alert.level === 'P2' ? 'bg-yellow-500' :
              'bg-accent',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Unread count badge */}
      {unreadCount > 1 && (
        <div className="absolute -top-2 -left-2 bg-error text-text-primary text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {unreadCount}
        </div>
      )}
    </div>
  );
});

AlertNotification.displayName = 'AlertNotification';

// =============================================================================
// AlertNotificationBell - 顶栏告警铃铛按钮
// =============================================================================

interface AlertBellProps {
  unreadCount: number;
  criticalCount: number;
  onClick?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const AlertNotificationBell: React.FC<AlertBellProps> = memo(({
  unreadCount,
  criticalCount,
  onClick,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
            criticalCount > 0
              ? 'bg-error text-text-primary animate-pulse'
              : 'bg-orange-500 text-text-primary',
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isMuted ? '取消静音' : '告警静音'}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-gray-500" />
          ) : (
            <Volume2 className="h-4 w-4 text-gray-500" />
          )}
        </button>
      )}
    </div>
  );
});

AlertNotificationBell.displayName = 'AlertNotificationBell';

export default AlertNotification;
