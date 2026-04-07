/**
 * 巡检宝启动屏组件
 * Precision Order · 精密秩序
 * 
 * 设计原则：
 * - 与整体UI风格统一（深境/均衡/清境三档主题）
 * - 动画克制流畅（150-300ms过渡）
 * - Logo动画体现"精密监控"的品牌内核
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  /** 是否显示启动屏 */
  isLoading: boolean;
  /** 加载进度 0-100 */
  progress?: number;
  /** 加载状态文本 */
  statusText?: string;
  /** 自定义类名 */
  className?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  progress = 0,
  statusText = '正在启动巡检宝...',
  className,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'breathing' | 'exit'>('enter');

  // 加载完成后触发退出
  useEffect(() => {
    if (!isLoading) {
      setAnimationPhase('exit');
    }
  }, [isLoading]);

  // 入场动画完成后进入呼吸状态
  useEffect(() => {
    if (animationPhase === 'enter') {
      const timer = setTimeout(() => {
        setAnimationPhase('breathing');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [animationPhase]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash-screen"
          className={cn(
            'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
            'bg-bg-primary transition-colors duration-300',
            className
          )}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Logo动画容器 */}
          <div className="relative flex flex-col items-center">
            {/* Logo SVG动画 */}
            <motion.div
              className="relative h-24 w-24 md:h-32 md:w-32"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: animationPhase === 'exit' ? 0.95 : animationPhase === 'enter' ? 1 : [1, 1.02, 1],
                opacity: animationPhase === 'exit' ? 0 : 1,
              }}
              transition={{
                scale: animationPhase === 'enter' 
                  ? { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
                  : animationPhase === 'exit'
                    ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                    : { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.4 }
              }}
            >
              <LogoSVG phase={animationPhase} />
            </motion.div>

            {/* 品牌名称 */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: animationPhase === 'exit' ? 0 : 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="text-xl font-semibold tracking-tight text-text-primary md:text-2xl">
                巡检宝
              </h1>
              <p className="mt-1 text-xs text-text-secondary md:text-sm">
                智能监控平台
              </p>
            </motion.div>

            {/* 进度条 */}
            <motion.div
              className="mt-12 w-48 md:w-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: animationPhase === 'exit' ? 0 : 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {/* 进度条轨道 */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                {/* 进度条填充 */}
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              
              {/* 状态文本 */}
              <motion.p
                className="mt-3 text-center text-xs text-text-tertiary"
                initial={{ opacity: 0 }}
                animate={{ opacity: animationPhase === 'exit' ? 0 : 1 }}
                transition={{ delay: 0.6 }}
              >
                {statusText}
              </motion.p>
            </motion.div>
          </div>

          {/* 版本信息 */}
          <motion.div
            className="absolute bottom-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: animationPhase === 'exit' ? 0 : 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <p className="text-[10px] text-text-tertiary">
              v2.0 · Precision Order
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Logo SVG组件
 * 双环对称设计，带入场动画
 */
interface LogoSVGProps {
  phase: 'enter' | 'breathing' | 'exit';
}

const LogoSVG: React.FC<LogoSVGProps> = ({ phase }) => {
  const pathVariants = {
    hidden: { 
      pathLength: 0, 
      opacity: 0 
    },
    visible: (i: number) => ({
      pathLength: phase === 'exit' ? 0 : 1,
      opacity: phase === 'exit' ? 0 : 1,
      transition: {
        pathLength: { 
          delay: phase === 'exit' ? 0 : i * 0.15, 
          duration: phase === 'exit' ? 0.3 : 0.6, 
          ease: [0.4, 0, 0.2, 1] 
        },
        opacity: { delay: phase === 'exit' ? 0 : i * 0.15, duration: 0.3 }
      }
    })
  };

  const centerDotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: phase === 'exit' ? 0 : 1,
      opacity: phase === 'exit' ? 0 : 1,
      transition: {
        delay: phase === 'exit' ? 0 : 0.6,
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 外层弧线 - 上 */}
      <motion.path
        d="M 50 80 A 50 50 0 0 1 150 80"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-text-primary"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={pathVariants}
      />
      
      {/* 外层弧线 - 下 */}
      <motion.path
        d="M 50 120 A 50 50 0 0 0 150 120"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-text-primary"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={pathVariants}
      />
      
      {/* 内层弧线 - 上（错位60度） */}
      <motion.path
        d="M 65 70 A 35 35 0 0 1 135 70"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-text-primary"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={pathVariants}
      />
      
      {/* 内层弧线 - 下（错位60度） */}
      <motion.path
        d="M 65 130 A 35 35 0 0 0 135 130"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-text-primary"
        custom={3}
        initial="hidden"
        animate="visible"
        variants={pathVariants}
      />
      
      {/* 中心点 */}
      <motion.circle
        cx="100"
        cy="100"
        r="10"
        fill="currentColor"
        className="text-text-primary"
        initial="hidden"
        animate="visible"
        variants={centerDotVariants}
      />
    </svg>
  );
};

export default SplashScreen;
