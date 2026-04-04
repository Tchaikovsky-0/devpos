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
        bg: {
          DEFAULT: 'rgb(var(--surface-subtle) / <alpha-value>)',
          primary: 'rgb(var(--canvas) / <alpha-value>)',
          secondary: 'rgb(var(--surface) / <alpha-value>)',
          tertiary: 'rgb(var(--surface-raised) / <alpha-value>)',
          hover: 'rgb(var(--surface-muted) / <alpha-value>)',
          active: 'rgb(var(--surface-hover) / <alpha-value>)',
          darkest: 'rgb(var(--surface-void) / <alpha-value>)',
          deepest: 'rgb(var(--surface-void) / <alpha-value>)',
          dark: 'rgb(var(--surface) / <alpha-value>)',
          light: 'rgb(var(--surface-muted) / <alpha-value>)',
          surface: 'rgb(var(--surface-subtle) / <alpha-value>)',
          base: 'rgb(var(--surface) / <alpha-value>)',
          elevated: 'rgb(var(--surface-raised) / <alpha-value>)',
          void: 'rgb(var(--surface-void) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          secondary: 'rgb(var(--border) / 0.55)',
          hover: 'rgb(var(--border-strong) / <alpha-value>)',
          emphasis: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
          disabled: 'rgb(var(--text-tertiary) / 0.72)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-strong) / <alpha-value>)',
          light: 'rgb(var(--accent-strong) / <alpha-value>)',
          muted: 'rgb(var(--accent) / 0.14)',
          border: 'rgb(var(--accent) / 0.28)',
        },
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
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '18px',
        xl: '24px',
        '2xl': '28px',
      },
      spacing: {
        14: '3.5rem',
        18: '4.5rem',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        soft: 'var(--shadow-soft)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '220ms',
        slow: '320ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
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
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
