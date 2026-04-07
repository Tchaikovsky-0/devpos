/**
 * VideoOverlay - 视频悬浮信息层
 * 
 * 半透明玻璃拟态背景，显示设备信息、大疆司空2数据、告警时间线
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Activity,
  Battery,
  Signal,
  Navigation,
  Clock,
  Flame,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoOverlayProps, AlertType } from './types';

const overlayAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online':
      return <Wifi className="h-3.5 w-3.5 text-success" />;
    case 'offline':
      return <WifiOff className="h-3.5 w-3.5 text-text-tertiary" />;
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-danger" />;
    default:
      return <Activity className="h-3.5 w-3.5 text-warning animate-pulse" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'online':
      return '在线';
    case 'offline':
      return '离线';
    case 'error':
      return '异常';
    case 'connecting':
      return '连接中';
    default:
      return '未知';
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'webrtc':
      return 'WebRTC';
    case 'rtsp':
      return 'RTSP';
    case 'hls':
      return 'HLS';
    default:
      return source.toUpperCase();
  }
};

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'fire':
      return <Flame className="h-3 w-3" />;
    case 'intrusion':
      return <ShieldAlert className="h-3 w-3" />;
    case 'defect':
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
};

const getAlertColor = (type: AlertType) => {
  switch (type) {
    case 'fire':
      return 'text-danger bg-error-muted';
    case 'intrusion':
      return 'text-warning bg-warning/20';
    case 'defect':
      return 'text-info bg-info/20';
    default:
      return 'text-text-secondary bg-bg-muted';
  }
};

const formatDuration = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时前`;
};

export const VideoOverlay: React.FC<VideoOverlayProps & { visible: boolean }> = memo(({
  name,
  status,
  source,
  droneData,
  alertHistory = [],
  visible
}) => {
  if (!visible) return null;

  const recentAlerts = alertHistory.slice(0, 5);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col justify-between p-3"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={overlayAnimation}
    >
      {/* 顶部信息栏 */}
      <div className="flex items-start justify-between gap-2">
        {/* 设备名称和状态 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md",
              status === 'online' ? "bg-success/20" : 
              status === 'error' ? "bg-error-muted" : "bg-bg-muted"
            )}>
              {getStatusIcon(status)}
            </div>
            <span className="text-sm font-semibold text-text-primary drop-shadow-md truncate max-w-[150px]">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-8">
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              status === 'online' ? "bg-success/20 text-success" : 
              status === 'error' ? "bg-error-muted text-danger" : 
              "bg-bg-muted text-text-secondary"
            )}>
              {getStatusText(status)}
            </span>
            <span className="text-xs text-text-secondary bg-bg-muted px-1.5 py-0.5 rounded-full">
              {getSourceLabel(source)}
            </span>
          </div>
        </div>
      </div>

      {/* 中间区域 - 大疆司空2数据 */}
      {droneData && status === 'online' && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col gap-2">
          <div className="glass-panel rounded-lg p-2 space-y-2 min-w-[90px]">
            {/* 高度 */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20">
                <Navigation className="h-3 w-3 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">高度</span>
                <span className="text-xs font-medium text-text-primary">{droneData.altitude.toFixed(1)}m</span>
              </div>
            </div>
            
            {/* 电量 */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md",
                droneData.battery > 30 ? "bg-success/20" : "bg-error-muted"
              )}>
                <Battery className={cn(
                  "h-3 w-3",
                  droneData.battery > 30 ? "text-success" : "text-danger"
                )} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">电量</span>
                <span className={cn(
                  "text-xs font-medium",
                  droneData.battery > 30 ? "text-text-primary" : "text-danger"
                )}>{droneData.battery}%</span>
              </div>
            </div>
            
            {/* 信号 */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md",
                droneData.signal > 50 ? "bg-success/20" : 
                droneData.signal > 30 ? "bg-warning/20" : "bg-error-muted"
              )}>
                <Signal className={cn(
                  "h-3 w-3",
                  droneData.signal > 50 ? "text-success" : 
                  droneData.signal > 30 ? "text-warning" : "text-danger"
                )} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">信号</span>
                <span className={cn(
                  "text-xs font-medium",
                  droneData.signal > 50 ? "text-text-primary" : 
                  droneData.signal > 30 ? "text-warning" : "text-danger"
                )}>{droneData.signal}%</span>
              </div>
            </div>

            {/* 速度 (可选) */}
            {droneData.speed !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-info/20">
                  <Activity className="h-3 w-3 text-info" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary">速度</span>
                  <span className="text-xs font-medium text-text-primary">{droneData.speed.toFixed(1)}m/s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部告警时间线 */}
      {recentAlerts.length > 0 && (
        <div className="glass-panel rounded-lg p-2 mt-auto max-w-[280px]">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3 w-3 text-text-secondary" />
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">最近告警</span>
          </div>
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto scrollbar-thin">
            {recentAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-center gap-2 text-xs"
              >
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0",
                  getAlertColor(alert.type)
                )}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary/90 truncate text-[11px]">{alert.message}</p>
                  <p className="text-text-primary/40 text-[10px]">{formatDuration(alert.timestamp)}</p>
                </div>
                <span className="text-[10px] text-text-primary/50 font-mono">
                  {(alert.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

VideoOverlay.displayName = 'VideoOverlay';

export default VideoOverlay;
