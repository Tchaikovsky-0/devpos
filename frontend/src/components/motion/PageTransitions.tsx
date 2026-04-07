/**
 * 页面过渡动画组件 (PageTransitions.tsx)
 *
 * 符合设计系统 v3.0 的过渡动画方案
 * - 精密克制的视觉效果
 * - 流畅自然的淡入上滑过渡
 * - 符合可访问性要求
 */

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  EASING,
  DURATION,
  DISTANCE,
  shouldReduceMotion,
} from '@/lib/motion';
import { clsx } from 'clsx';

// 符合设计系统的淡入上滑变体
const fadeInUpVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: DISTANCE.medium,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.page,
      ease: EASING.enter,
    },
  },
  exit: {
    opacity: 0,
    y: -DISTANCE.small,
    transition: {
      duration: DURATION.fast,
      ease: EASING.exit,
    },
  },
};

// 主组件: PageTransition - 增强版
export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const isReducedMotion = shouldReduceMotion();

  if (isReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeInUpVariants}
        className={clsx('w-full h-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// 子页面内容过渡: PageContent
export interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  const isReducedMotion = shouldReduceMotion();

  if (isReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInUpVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 交错入场动画: StaggeredContent - 增强版
export interface StaggeredContentProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredContent({
  children,
  className,
  staggerDelay = 0.05,
}: StaggeredContentProps) {
  const isReducedMotion = shouldReduceMotion();

  if (isReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 单个动画元素: AnimatedItem - 增强版
export interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedItem({ children, className, delay = 0 }: AnimatedItemProps) {
  const isReducedMotion = shouldReduceMotion();

  if (isReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={fadeInUpVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
