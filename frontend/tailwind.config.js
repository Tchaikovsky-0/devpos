/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Tech-Industrial Minimalism 设计系统 - Deep Space UI */
        // 背景层
        'bg-primary': '#020617',
        'bg-secondary': '#0f172a',
        'bg-tertiary': '#1e293b',
        // 表面层
        'surface-card': 'rgba(15, 23, 42, 0.8)',
        'surface-border': 'rgba(255, 255, 255, 0.06)',
        'surface-hover': 'rgba(255, 255, 255, 0.04)',
        'surface-active': 'rgba(255, 255, 255, 0.08)',
        // 语义化点缀色
        'accent-danger': '#ef4444',
        'accent-success': '#10b981',
        'accent-info': '#3b82f6',
        'accent-warning': '#f59e0b',
        // 文字层级
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-tertiary': '#78879A',
        'text-muted': '#475569',
        /* 背景色系统 (保留原有变量) */
        bg: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          primary: 'rgb(var(--canvas) / <alpha-value>)',
          secondary: 'rgb(var(--surface) / <alpha-value>)',
          tertiary: 'rgb(var(--surface-raised) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
          hover: 'rgb(var(--surface-hover) / <alpha-value>)',
          subtle: 'rgb(var(--surface-subtle) / <alpha-value>)',
          void: 'rgb(var(--surface-void) / <alpha-value>)',
          // 兼容性映射
          deepest: 'rgb(var(--canvas) / <alpha-value>)',
          dark: 'rgb(var(--surface) / <alpha-value>)',
          light: 'rgb(var(--surface-muted) / <alpha-value>)',
          surface: 'rgb(var(--surface-raised) / <alpha-value>)',
          base: 'rgb(var(--surface) / <alpha-value>)',
        },
        /* 边框系统 */
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          secondary: 'rgb(var(--border) / 0.55)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
          hover: 'rgb(var(--border-hover) / <alpha-value>)',
          emphasis: 'rgb(var(--border-strong) / <alpha-value>)',
          accent: 'rgb(var(--border-accent) / <alpha-value>)',
        },
        /* 文字系统 */
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
          disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
        },
        /* 强调色 */
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          muted: 'rgb(var(--accent) / 0.14)',
          border: 'rgb(var(--accent) / 0.28)',
        },
        /* 功能色 */
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          muted: 'rgb(var(--success) / 0.14)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          muted: 'rgb(var(--warning) / 0.16)',
        },
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          muted: 'rgb(var(--error) / 0.14)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          muted: 'rgb(var(--info) / 0.14)',
        },
        /* danger 别名 (兼容代码中使用 danger 的地方) */
        danger: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          muted: 'rgb(var(--error) / 0.14)',
        },
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'Noto Sans SC',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.5' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        lg: ['16px', { lineHeight: '1.55' }],
        xl: ['18px', { lineHeight: '1.45' }],
        '2xl': ['24px', { lineHeight: '1.25' }],
        '3xl': ['32px', { lineHeight: '1.12' }],
      },
      /* 统一圆角系统 - 与 CSS 变量保持一致 */
      borderRadius: {
        sm: '6px',      /* 6px - 标签、小按钮 */
        DEFAULT: '8px', /* 8px - 默认 */
        md: '8px',      /* 8px - 标准按钮、输入框 */
        lg: '12px',     /* 12px - 卡片、面板 */
        xl: '20px',     /* 20px - 大面板、模态框 */
        '2xl': '28px',  /* 28px - 超大容器 */
      },
      spacing: {
        14: '3.5rem',
        18: '4.5rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        hover: 'var(--shadow-hover)',
        panel: 'var(--shadow-panel)',
        soft: 'var(--shadow-soft)',
        // Tech-Industrial 设计系统阴影
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-info': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-alert': 'pulseAlert 2s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { opacity: '0.45' },
          '50%': { opacity: '0.95' },
          '100%': { opacity: '0.45' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgb(var(--accent) / 0.2)' },
          '50%': { boxShadow: '0 0 20px rgb(var(--accent) / 0.4)' },
        },
        pulseAlert: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.7)' },
        },
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      // 玻璃拟态工具类
      backdropBlur: {
        glass: '12px',
      },
      ringColor: {
        accent: '#58A6FF',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // 添加玻璃拟态工具类插件
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-hover': {
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            background: 'rgba(15, 23, 42, 0.8)',
          },
        },
        '.glass-card': {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
      });
    },
  ],
};
