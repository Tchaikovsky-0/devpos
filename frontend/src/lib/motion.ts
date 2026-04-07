/**
 * 巡检宝动效系统核心配置 (motion.ts)
 *
 * 设计理念：克制内敛，恰到好处
 * - 功能性优先：每个动效都有明确目的
 * - 视觉一致性：统一的设计语言
 * - 性能优先：GPU加速，避免重排重绘
 * - 可访问性：尊重系统偏好设置
 */

import type { Transition, Variants } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════
// 缓动曲线 - 精心调校的缓动函数
// ═══════════════════════════════════════════════════════════════════════

export const EASING = {
  // 标准曲线 - 适合大多数场景
  standard: [0.4, 0, 0.2, 1] as const,

  // 进入曲线 - 快速开始，平滑结束
  enter: [0, 0, 0.2, 1] as const,

  // 退出曲线 - 快速开始，平滑结束（稍快于进入）
  exit: [0.4, 0, 1, 1] as const,

  // 弹性曲线 - 轻微回弹，增加活力但不夸张
  bounce: [0.34, 1.56, 0.64, 1] as const,

  // 平滑曲线 - 柔和的过渡
  smooth: [0.4, 0, 0.6, 1] as const,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 时间常数 - 基于功能的重要程度
// ═══════════════════════════════════════════════════════════════════════

export const DURATION = {
  // 瞬间反馈 - 微交互，100-150ms
  instant: 0.1,

  // 快速响应 - 按钮点击等，150-200ms
  fast: 0.15,

  // 标准过渡 - 元素状态变化，200-300ms
  normal: 0.25,

  // 页面过渡 - 页面切换，300-400ms
  page: 0.35,

  // 大型动画 - 复杂场景，400-600ms
  slow: 0.5,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 距离常数 - 动画移动距离
// ═══════════════════════════════════════════════════════════════════════

export const DISTANCE = {
  // 微小位移 - 微妙的位置变化
  micro: 4,

  // 小位移 - 按钮、卡片等
  small: 8,

  // 中等位移 - 模态框、面板
  medium: 16,

  // 大位移 - 页面、复杂布局
  large: 24,

  // 超大位移 - 全屏过渡
  huge: 40,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 缩放常数
// ═══════════════════════════════════════════════════════════════════════

export const SCALE = {
  // 轻微缩放 - 微交互
  subtle: 0.98,

  // 小缩放 - 按钮反馈
  small: 0.95,

  // 中等缩放 - 卡片悬停
  medium: 0.96,

  // 大缩放 - 模态框
  large: 0.94,

  // 展开缩放 - 从某点展开
  expand: 0.92,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 透明度常数
// ═══════════════════════════════════════════════════════════════════════

export const OPACITY = {
  // 几乎不透明
  full: 1,
  // 轻微透明
  slight: 0.9,
  // 半透明
  half: 0.5,
  // 高度透明
  faint: 0.2,
  // 完全透明
  none: 0,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 组合配置 - 常见场景的最佳配置
// ═══════════════════════════════════════════════════════════════════════

export const TRANSITIONS = {
  // 标准出现
  appear: {
    duration: DURATION.normal,
    ease: EASING.enter,
  },

  // 标准消失
  disappear: {
    duration: DURATION.fast,
    ease: EASING.exit,
  },

  // 弹性出现
  bounceIn: {
    duration: DURATION.normal,
    ease: EASING.bounce,
  },

  // 标准滑入
  slideIn: {
    duration: DURATION.normal,
    ease: EASING.standard,
  },

  // 快速响应
  quick: {
    duration: DURATION.fast,
    ease: EASING.standard,
  },

  // 页面过渡
  page: {
    duration: DURATION.page,
    ease: EASING.standard,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 基础变体
// ═══════════════════════════════════════════════════════════════════════

export const BASE_VARIANTS = {
  // 静止状态
  hidden: {
    opacity: OPACITY.none,
  },
  // 可见状态
  visible: {
    opacity: OPACITY.full,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════════════

export const createTransition = (type: keyof typeof TRANSITIONS): Transition => {
  return TRANSITIONS[type];
};

export const createDirectionVariants = (
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number = DISTANCE.medium
): Variants => {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return {
    hidden: {
      opacity: OPACITY.none,
      ...directionMap[direction],
    },
    visible: {
      opacity: OPACITY.full,
      x: 0,
      y: 0,
      transition: TRANSITIONS.slideIn,
    },
    exit: {
      opacity: OPACITY.none,
      ...directionMap[direction],
      transition: TRANSITIONS.disappear,
    },
  };
};

// 交错动画配置
export const createStaggerConfig = (
  staggerChildren: number = 0.05,
  delayChildren?: number
) => ({
  visible: {
    transition: {
      staggerChildren,
      delayChildren: delayChildren ?? 0,
    },
  },
});

// ═══════════════════════════════════════════════════════════════════════
// 可访问性支持
// ═══════════════════════════════════════════════════════════════════════

export const REDUCED_MOTION_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
