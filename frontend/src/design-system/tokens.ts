/**
 * 巡检宝设计系统 - Tech-Industrial Minimalism (科技工业极简主义)
 * Design Tokens
 */

// ============================================
// 色彩系统 - Deep Space UI
// ============================================
export const colors = {
  // 背景层
  background: {
    primary: '#020617',      // Slate-950 - 主背景
    secondary: '#0f172a',    // Slate-900 - 卡片/面板
    tertiary: '#1e293b',     // Slate-800 - 悬浮层
  },
  // 表面层 - 微弱亮度提升 + 半透明边框
  surface: {
    card: 'rgba(15, 23, 42, 0.8)',
    border: 'rgba(255, 255, 255, 0.06)',
    hover: 'rgba(255, 255, 255, 0.04)',
    active: 'rgba(255, 255, 255, 0.08)',
  },
  // 语义化点缀色 - 只在需要时出现
  accent: {
    danger: '#ef4444',       // Neon Red - 告警
    success: '#10b981',      // Emerald Green - 正常
    info: '#3b82f6',         // Electric Blue - AI高亮
    warning: '#f59e0b',      // Amber - 警告
  },
  // 文字层级
  text: {
    primary: '#f8fafc',      // Slate-50
    secondary: '#94a3b8',    // Slate-400
    tertiary: '#64748b',     // Slate-500
    muted: '#475569',        // Slate-600
  },
} as const;

// ============================================
// 字体系统
// ============================================
export const typography = {
  // 主字体 - 极简无衬线
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    // 数字/数据 - 等宽字体彰显工业感
    mono: 'JetBrains Mono, Fira Code, SF Mono, Roboto Mono, monospace',
  },
  // 字号层级
  size: {
    xs: '0.75rem',      // 12px - 标签
    sm: '0.875rem',     // 14px - 辅助文字
    base: '1rem',       // 16px - 正文
    lg: '1.125rem',     // 18px - 小标题
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px - 模块标题
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px - 页面标题
  },
  // 行高
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  // 字重
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================
// 间距系统
// ============================================
export const spacing = {
  // 超窄侧边栏
  sidebar: '48px',
  // 内容区边距
  content: '24px',
  // 卡片内边距
  card: '16px',
  // 组件间隙
  gap: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },
  // 通用间距值
  space: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
} as const;

// ============================================
// 动效系统
// ============================================
export const motion = {
  // 缓动函数
  easing: {
    smooth: [0.16, 1, 0.3, 1] as const,     // 平滑减速
    snappy: [0.34, 1.56, 0.64, 1] as const, // 弹性
    linear: [0, 0, 1, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
    easeIn: [0.4, 0, 1, 1] as const,
  },
  // 持续时间 (秒)
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.7,
  },
  // 玻璃拟态
  glass: {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropBlur: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderHover: '1px solid rgba(255, 255, 255, 0.12)',
  },
} as const;

// ============================================
// 圆角系统
// ============================================
export const borderRadius = {
  sm: '6px',      // 标签、小按钮
  md: '8px',      // 标准按钮、输入框
  lg: '12px',     // 卡片、面板
  xl: '16px',     // 大卡片
  '2xl': '20px',  // 大面板、模态框
  full: '9999px', // 圆形
} as const;

// ============================================
// 阴影系统
// ============================================
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  glow: {
    danger: '0 0 20px rgba(239, 68, 68, 0.3)',
    success: '0 0 20px rgba(16, 185, 129, 0.3)',
    info: '0 0 20px rgba(59, 130, 246, 0.3)',
    warning: '0 0 20px rgba(245, 158, 11, 0.3)',
  },
} as const;

// ============================================
// Z-Index 层级
// ============================================
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  commandBar: 800,
} as const;

// ============================================
// 布局常量
// ============================================
export const layout = {
  sidebar: {
    width: '48px',
    itemSize: '48px',
    iconSize: '20px',
  },
  header: {
    height: '56px',
  },
  content: {
    maxWidth: '1440px',
    padding: '24px',
  },
} as const;

// ============================================
// 动画关键帧 (用于 Framer Motion)
// ============================================
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideInFromLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  slideInFromRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
  slideInFromBottom: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
    },
  },
} as const;

// ============================================
// 状态颜色映射
// ============================================
export const statusColors = {
  alert: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#ef4444',
    glow: '0 0 12px rgba(239, 68, 68, 0.4)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: '#f59e0b',
    glow: '0 0 12px rgba(245, 158, 11, 0.4)',
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#10b981',
    glow: '0 0 12px rgba(16, 185, 129, 0.4)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#3b82f6',
    glow: '0 0 12px rgba(59, 130, 246, 0.4)',
  },
  processing: {
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.3)',
    text: '#6366f1',
    glow: '0 0 12px rgba(99, 102, 241, 0.4)',
  },
  ignored: {
    bg: 'rgba(100, 116, 139, 0.15)',
    border: 'rgba(100, 116, 139, 0.3)',
    text: '#64748b',
    glow: 'none',
  },
} as const;

// ============================================
// 导出完整设计系统
// ============================================
export const designSystem = {
  colors,
  typography,
  spacing,
  motion,
  borderRadius,
  shadows,
  zIndex,
  layout,
  animations,
  statusColors,
} as const;

export default designSystem;
