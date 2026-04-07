/**
 * StatusBar - 全局底部状态栏
 * 
 * 参考 VS Code / Figma / Slack 底部状态栏模式
 * 集中展示全局运行状态，释放顶栏空间
 * 
 * 高度: 24px (3 * 8px 网格)
 */

import { useEffect, useState } from 'react';
import {
  BellRing,
  Wifi,
  WifiOff,
  Bot,
  Monitor,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBarProps {
  /** 告警数量 */
  alertCount: number;
  /** 在线设备数 */
  onlineDevices: number;
  /** 总设备数 */
  totalDevices: number;
  /** WebSocket 连接状态 */
  wsConnected: boolean;
  /** AI 服务状态 */
  aiStatus: 'online' | 'offline' | 'thinking';
  className?: string;
}

/** 状态栏分隔符 */
function StatusBarSeparator() {
  return <span className="mx-2 h-3 w-px bg-border" aria-hidden="true" />;
}

/** 状态栏单项 */
function StatusBarSegment({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-1.5 text-[11px] leading-none text-text-tertiary hover:text-text-secondary transition-colors select-none',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 实时时钟 */
function useCurrentTime() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export function StatusBar({
  alertCount,
  onlineDevices,
  totalDevices,
  wsConnected,
  aiStatus,
  className,
}: StatusBarProps) {
  const currentTime = useCurrentTime();

  return (
    <footer
      className={cn(
        'shrink-0 flex items-center h-6 px-3 border-t border-border-secondary bg-bg-primary select-none z-40',
        className,
      )}
      role="status"
      aria-label="全局状态栏"
    >
      {/* 左侧：核心状态 */}
      <div className="flex items-center min-w-0">
        {/* 告警 */}
        <StatusBarSegment className={cn(alertCount > 0 && 'text-warning')}>
          <BellRing className="h-3 w-3" />
          <span>{alertCount} 告警</span>
        </StatusBarSegment>

        <StatusBarSeparator />

        {/* 设备在线 */}
        <StatusBarSegment>
          <Monitor className="h-3 w-3" />
          <span>
            {onlineDevices}/{totalDevices} 在线
          </span>
        </StatusBarSegment>

        <StatusBarSeparator />

        {/* WebSocket */}
        <StatusBarSegment className={cn(!wsConnected && 'text-error')}>
          {wsConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{wsConnected ? '已连接' : '已断开'}</span>
        </StatusBarSegment>
      </div>

      {/* 右侧：辅助信息 */}
      <div className="ml-auto flex items-center min-w-0">
        {/* AI 状态 */}
        <StatusBarSegment className={cn(aiStatus === 'online' && 'text-accent')}>
          <Bot className="h-3 w-3" />
          <span>
            {aiStatus === 'online'
              ? 'AI 就绪'
              : aiStatus === 'thinking'
                ? 'AI 思考中'
                : 'AI 离线'}
          </span>
        </StatusBarSegment>

        <StatusBarSeparator />

        {/* 时间 */}
        <StatusBarSegment>
          <Clock className="h-3 w-3" />
          <span>{currentTime}</span>
        </StatusBarSegment>
      </div>
    </footer>
  );
}

export default StatusBar;
