/**
 * SmartFocus - 智能聚焦组件
 * 
 * 当检测到异常时，自动应用呼吸态红色外发光
 * 角落显示微型时序折线图（置信度趋势）
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Flame, ShieldAlert, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartFocusProps, AlertType } from './types';

/** 边框呼吸动画 */
const borderBreatheAnimation = {
  borderColor: [
    'rgba(239, 68, 68, 0.3)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(239, 68, 68, 0.3)'
  ],
  transition: { 
    duration: 2, 
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'fire':
      return <Flame className="h-4 w-4" />;
    case 'intrusion':
      return <ShieldAlert className="h-4 w-4" />;
    case 'defect':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getAlertLabel = (type: AlertType) => {
  switch (type) {
    case 'fire':
      return '火灾检测';
    case 'intrusion':
      return '入侵检测';
    case 'defect':
      return '缺陷检测';
    default:
      return '异常检测';
  }
};

const getAlertColor = (type: AlertType) => {
  switch (type) {
    case 'fire':
      return {
        bg: 'bg-error-muted',
        border: 'border-danger/50',
        text: 'text-danger',
        glow: 'rgba(239, 68, 68, 0.5)'
      };
    case 'intrusion':
      return {
        bg: 'bg-warning/20',
        border: 'border-warning/50',
        text: 'text-warning',
        glow: 'rgba(245, 158, 11, 0.5)'
      };
    case 'defect':
      return {
        bg: 'bg-info/20',
        border: 'border-info/50',
        text: 'text-info',
        glow: 'rgba(59, 130, 246, 0.5)'
      };
    default:
      return {
        bg: 'bg-bg-muted',
        border: 'border-border',
        text: 'text-text-primary',
        glow: 'rgba(255, 255, 255, 0.3)'
      };
  }
};

/** 微型折线图组件 */
const MiniSparkline: React.FC<{ 
  data: number[]; 
  width?: number; 
  height?: number;
  color?: string;
}> = memo(({ 
  data, 
  width = 60, 
  height = 24,
  color = '#ef4444'
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] > data[0];

  return (
    <div className="flex items-center gap-1">
      <svg width={width} height={height} className="overflow-visible">
        {/* 渐变背景 */}
        <defs>
          <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* 填充区域 */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#sparklineGradient)"
        />
        
        {/* 折线 */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 最后一个点 */}
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="2"
          fill={color}
        />
      </svg>
      
      {/* 趋势指示器 */}
      <div className={cn(
        "flex items-center justify-center h-4 w-4 rounded-full",
        trend ? "bg-success/20" : "bg-error-muted"
      )}>
        {trend ? (
          <TrendingUp className="h-2.5 w-2.5 text-success" />
        ) : (
          <TrendingDown className="h-2.5 w-2.5 text-danger" />
        )}
      </div>
    </div>
  );
});

MiniSparkline.displayName = 'MiniSparkline';

export const SmartFocus: React.FC<SmartFocusProps> = memo(({
  isAlert,
  alertType,
  confidence,
  confidenceHistory,
  className
}) => {
  const colors = getAlertColor(alertType);
  
  if (!isAlert) return null;

  return (
    <motion.div
      className={cn(
        "absolute inset-0 z-30 pointer-events-none",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 呼吸发光边框 */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-lg border-2",
          colors.border
        )}
        animate={borderBreatheAnimation}
      />
      
      {/* 外发光效果 */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          boxShadow: [
            `0 0 0 0 ${colors.glow.replace('0.5', '0')}`,
            `0 0 20px 4px ${colors.glow}`,
            `0 0 0 0 ${colors.glow.replace('0.5', '0')}`
          ]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* 告警标签 - 左上角 */}
      <motion.div
        className={cn(
          "absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full",
          "backdrop-blur-md border",
          colors.bg,
          colors.border
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className={cn("animate-pulse", colors.text)}>
          {getAlertIcon(alertType)}
        </div>
        <span className={cn("text-xs font-semibold", colors.text)}>
          {getAlertLabel(alertType)}
        </span>
        <span className={cn("text-xs font-mono ml-1", colors.text)}>
          {(confidence * 100).toFixed(0)}%
        </span>
      </motion.div>

      {/* 置信度趋势图 - 右上角 */}
      {confidenceHistory.length > 1 && (
        <motion.div
          className={cn(
            "absolute top-3 right-3 px-2 py-1.5 rounded-lg",
            "backdrop-blur-md bg-black/40 border border-border"
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">置信度趋势</span>
            <MiniSparkline 
              data={confidenceHistory} 
              color={alertType === 'fire' ? '#ef4444' : alertType === 'intrusion' ? '#f59e0b' : '#3b82f6'}
            />
          </div>
        </motion.div>
      )}

      {/* 底部告警强度指示器 */}
      <motion.div
        className="absolute bottom-3 left-3 right-3"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", 
                alertType === 'fire' ? 'bg-danger' : 
                alertType === 'intrusion' ? 'bg-warning' : 'bg-info'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${confidence * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className={cn("text-xs font-mono", colors.text)}>
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});

SmartFocus.displayName = 'SmartFocus';

export default SmartFocus;
