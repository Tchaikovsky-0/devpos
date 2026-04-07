/**
 * AlertIndicator - 告警指示器组件
 * 
 * 小型圆点指示器，支持多种状态动画
 * - 红色呼吸动画（告警）
 * - 绿色常亮（正常）
 * - 灰色（离线）
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertIndicatorProps, AlertType } from './types';

const sizeMap = {
  sm: {
    container: 'h-5 w-5',
    dot: 'h-2 w-2',
    ring: 'h-4 w-4'
  },
  md: {
    container: 'h-7 w-7',
    dot: 'h-3 w-3',
    ring: 'h-6 w-6'
  },
  lg: {
    container: 'h-9 w-9',
    dot: 'h-4 w-4',
    ring: 'h-8 w-8'
  }
};

const getAlertColor = (type: AlertType) => {
  switch (type) {
    case 'fire':
      return 'bg-danger';
    case 'intrusion':
      return 'bg-warning';
    case 'defect':
      return 'bg-info';
    default:
      return 'bg-danger';
  }
};

const getStatusConfig = (status: AlertIndicatorProps['status'], alertType?: AlertType) => {
  switch (status) {
    case 'alert':
      return {
        dotColor: getAlertColor(alertType || null),
        ringColor: alertType === 'fire' ? 'border-danger/50' : 
                   alertType === 'intrusion' ? 'border-warning/50' : 
                   'border-info/50',
        glowColor: alertType === 'fire' ? 'rgba(239, 68, 68, 0.5)' : 
                   alertType === 'intrusion' ? 'rgba(245, 158, 11, 0.5)' : 
                   'rgba(59, 130, 246, 0.5)',
        animate: true,
        label: alertType === 'fire' ? '火灾告警' : 
               alertType === 'intrusion' ? '入侵告警' : 
               alertType === 'defect' ? '缺陷告警' : '异常告警'
      };
    case 'normal':
      return {
        dotColor: 'bg-success',
        ringColor: 'border-success/30',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        animate: false,
        label: '运行正常'
      };
    case 'offline':
    default:
      return {
        dotColor: 'bg-text-tertiary',
        ringColor: 'border-border',
        glowColor: 'transparent',
        animate: false,
        label: '设备离线'
      };
  }
};

export const AlertIndicator: React.FC<AlertIndicatorProps> = memo(({
  status,
  alertType,
  size = 'md',
  showLabel = false,
  className
}) => {
  const config = getStatusConfig(status, alertType);
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", sizes.container)}>
        {/* 呼吸光环 - 仅在告警状态下显示 */}
        {config.animate && (
          <>
            <motion.div
              className={cn(
                "absolute rounded-full border-2",
                config.ringColor
              )}
              style={{
                width: '100%',
                height: '100%'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '100%',
                height: '100%',
                boxShadow: `0 0 10px ${config.glowColor}`
              }}
              animate={{
                boxShadow: [
                  `0 0 5px ${config.glowColor}`,
                  `0 0 20px ${config.glowColor}`,
                  `0 0 5px ${config.glowColor}`
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </>
        )}

        {/* 中心圆点 */}
        <motion.div
          className={cn(
            "rounded-full relative z-10",
            sizes.dot,
            config.dotColor
          )}
          animate={config.animate ? {
            scale: [1, 1.1, 1]
          } : {}}
          transition={config.animate ? {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          } : {}}
        />
      </div>

      {/* 状态标签 */}
      {showLabel && (
        <span className={cn(
          "text-xs font-medium",
          status === 'alert' ? 'text-danger' : 
          status === 'normal' ? 'text-success' : 
          'text-text-tertiary'
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
});

AlertIndicator.displayName = 'AlertIndicator';

export default AlertIndicator;
