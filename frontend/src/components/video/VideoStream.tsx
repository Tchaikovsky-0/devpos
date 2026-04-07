import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { buildAlertPath } from '../../lib/navigation';
import Badge from '../ui/Badge';
import {
  WifiOff,
  Maximize2,
  Settings,
  Bell,
} from 'lucide-react';

/**
 * VideoStream - 无边框视频流组件
 * 支持 WebRTC/RTSP/HLS 视频源，悬浮显示 Overlay 信息
 */

export type VideoSource = 'webrtc' | 'rtsp' | 'hls' | 'mjpeg';

export interface DroneData {
  /** 高度 (米) */
  altitude: number;
  /** 电量 (%) */
  battery: number;
  /** 信号强度 (%) */
  signal: number;
  /** 速度 (km/h) */
  speed?: number;
  /** 飞行模式 */
  flightMode?: string;
}

export interface DetectionData {
  /** 检测类型 */
  type: 'fire' | 'intrusion' | 'defect' | 'vehicle' | 'person';
  /** 置信度 (0-1) */
  confidence: number;
  /** 边界框坐标 */
  bbox?: [number, number, number, number];
  /** 标签 */
  label: string;
}

export interface VideoStreamProps {
  /** 视频ID */
  id: string;
  /** 视频名称 */
  name: string;
  /** 视频源类型 */
  source: VideoSource;
  /** 视频URL */
  url: string;
  /** 在线状态 */
  status: 'online' | 'offline' | 'error';
  /** 是否静音 */
  muted?: boolean;
  /** 大疆司空2数据 */
  droneData?: DroneData;
  /** YOLO检测结果 */
  detections?: DetectionData[];
  /** 是否告警 */
  isAlert?: boolean;
  /** 告警类型 */
  alertType?: DetectionData['type'] | null;
  /** 是否选中 */
  isSelected?: boolean;
  /** 选中回调 */
  onSelect?: () => void;
  /** 全屏回调 */
  onFullscreen?: () => void;
  /** 自定义样式 */
  className?: string;
}

export const VideoStream = forwardRef<HTMLDivElement, VideoStreamProps>(
  (
    {
      id,
      name,
      source: _source,
      url,
      status,
      muted = true,
      droneData,
      detections = [],
      isAlert = false,
      alertType = null,
      isSelected = false,
      onSelect,
      onFullscreen,
      className,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // 视频加载处理
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleLoadedData = () => setIsLoading(false);
      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
    }, [url]);

    // 告警呼吸动画
    const alertAnimation = isAlert ? {
      boxShadow: [
        '0 0 0 0 rgba(239, 68, 68, 0)',
        '0 0 30px 4px rgba(239, 68, 68, 0.4)',
        '0 0 0 0 rgba(239, 68, 68, 0)',
      ],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    } : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative aspect-video bg-bg-primary rounded-lg overflow-hidden',
          'cursor-pointer select-none',
          isSelected && 'ring-2 ring-accent/50',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
        animate={alertAnimation}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={url}
          autoPlay
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs text-text-primary0">加载中...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <div className="flex flex-col items-center gap-2 text-text-primary0">
              <WifiOff className="w-8 h-8" />
              <span className="text-xs">连接失败</span>
            </div>
          </div>
        )}

        {/* Offline State */}
        {status === 'offline' && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/90">
            <div className="flex flex-col items-center gap-2 text-text-primary0">
              <WifiOff className="w-8 h-8" />
              <span className="text-xs">设备离线</span>
            </div>
          </div>
        )}

        {/* Detection Overlays */}
        <AnimatePresence>
          {detections.map((det, idx) => (
            <DetectionOverlay key={idx} detection={det} />
          ))}
        </AnimatePresence>

        {/* Top Info Bar */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <StatusIndicator status={status} pulse={isAlert} />
            
            {/* Name */}
            <span className="text-sm font-medium text-text-primary drop-shadow-lg">
              {name}
            </span>
          </div>

          {/* Alert Badge + Navigation */}
          <div className="flex items-center gap-1.5">
            {isAlert && alertType && (
              <Badge variant="danger" pulse size="sm">
                {getAlertLabel(alertType)}
              </Badge>
            )}
            {(isAlert || (detections && detections.length > 0)) && (
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-error/80 text-white hover:bg-error transition-colors backdrop-blur-sm"
                title="查看关联告警"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(buildAlertPath({ streamId: id }));
                }}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Bottom Info Panel */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* Drone Data */}
                {droneData && (
                  <div className="flex items-center gap-4 mb-3">
                    <DroneMetric
                      icon="altitude"
                      value={`${droneData.altitude}m`}
                      label="高度"
                    />
                    <DroneMetric
                      icon="battery"
                      value={`${droneData.battery}%`}
                      label="电量"
                      warning={droneData.battery < 30}
                    />
                    <DroneMetric
                      icon="signal"
                      value={`${droneData.signal}%`}
                      label="信号"
                    />
                  </div>
                )}

                {/* Detection Summary */}
                {detections.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-text-tertiary">检测到:</span>
                    <div className="flex items-center gap-1.5">
                      {getDetectionSummary(detections).map(({ type, count }) => (
                        <Badge key={type} variant={getDetectionVariant(type)} size="sm">
                          {getDetectionLabel(type)} {count > 1 && `x${count}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <IconButton icon={<Maximize2 className="w-4 h-4" />} onClick={onFullscreen} />
                  <IconButton icon={<Settings className="w-4 h-4" />} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

VideoStream.displayName = 'VideoStream';

/**
 * DetectionOverlay - 检测框覆盖层
 */
interface DetectionOverlayProps {
  detection: DetectionData;
}

const DetectionOverlay = ({ detection }: DetectionOverlayProps) => {
  const colors = {
    fire: 'border-error bg-error-muted',
    intrusion: 'border-warning bg-warning-muted',
    defect: 'border-accent-soft bg-accent-muted',
    vehicle: 'border-info bg-info/10',
    person: 'border-accent bg-accent-muted',
  };

  const labels = {
    fire: '火灾',
    intrusion: '入侵',
    defect: '缺陷',
    vehicle: '车辆',
    person: '人员',
  };

  return (
    <motion.div
      className={cn(
        'absolute border-2 rounded',
        colors[detection.type]
      )}
      style={{
        left: `${(detection.bbox?.[0] || 0) * 100}%`,
        top: `${(detection.bbox?.[1] || 0) * 100}%`,
        width: `${(detection.bbox?.[2] || 0.1) * 100}%`,
        height: `${(detection.bbox?.[3] || 0.1) * 100}%`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className={cn(
        'absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-medium rounded',
        'text-text-primary bg-surface/80 backdrop-blur-sm'
      )}>
        {labels[detection.type]} {Math.round(detection.confidence * 100)}%
      </span>
    </motion.div>
  );
};

/**
 * StatusIndicator - 状态指示器
 */
interface StatusIndicatorProps {
  status: VideoStreamProps['status'];
  pulse?: boolean;
}

const StatusIndicator = ({ status, pulse = false }: StatusIndicatorProps) => {
  const colors = {
    online: 'bg-success',
    offline: 'bg-text-disabled',
    error: 'bg-error',
  };

  return (
    <motion.span
      className={cn('w-2 h-2 rounded-full', colors[status])}
      animate={pulse ? {
        scale: [1, 1.3, 1],
        opacity: [1, 0.6, 1],
      } : undefined}
      transition={pulse ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    />
  );
};

/**
 * DroneMetric - 无人机数据指标
 */
interface DroneMetricProps {
  icon: 'altitude' | 'battery' | 'signal';
  value: string;
  label: string;
  warning?: boolean;
}

const DroneMetric = ({ icon, value, label: _label, warning = false }: DroneMetricProps) => {
  const icons = {
    altitude: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    battery: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    signal: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={cn('text-text-secondary', warning && 'text-warning')}>{icons[icon]}</span>
      <span className={cn('font-mono text-text-secondary', warning && 'text-warning')}>{value}</span>
    </div>
  );
};

/**
 * IconButton - 图标按钮
 */
interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
}

const IconButton = ({ icon, onClick }: IconButtonProps) => (
  <button
    className={cn(
      'w-8 h-8 rounded-lg flex items-center justify-center',
      'bg-bg-muted text-text-primary backdrop-blur-sm',
      'hover:bg-bg-muted transition-colors'
    )}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
  >
    {icon}
  </button>
);

// 辅助函数
const getAlertLabel = (type: DetectionData['type']): string => {
  const labels = {
    fire: '火灾告警',
    intrusion: '入侵检测',
    defect: '设备缺陷',
    vehicle: '车辆识别',
    person: '人员检测',
  };
  return labels[type];
};

const getDetectionLabel = (type: DetectionData['type']): string => {
  const labels = {
    fire: '火灾',
    intrusion: '入侵',
    defect: '缺陷',
    vehicle: '车辆',
    person: '人员',
  };
  return labels[type];
};

const getDetectionVariant = (type: DetectionData['type']): 'danger' | 'warning' | 'info' | 'success' => {
  const variants = {
    fire: 'danger',
    intrusion: 'warning',
    defect: 'info',
    vehicle: 'success',
    person: 'info',
  };
  return variants[type] as 'danger' | 'warning' | 'info' | 'success';
};

const getDetectionSummary = (detections: DetectionData[]) => {
  const summary = detections.reduce((acc, det) => {
    acc[det.type] = (acc[det.type] || 0) + 1;
    return acc;
  }, {} as Record<DetectionData['type'], number>);

  return Object.entries(summary).map(([type, count]) => ({
    type: type as DetectionData['type'],
    count,
  }));
};

export default VideoStream;
