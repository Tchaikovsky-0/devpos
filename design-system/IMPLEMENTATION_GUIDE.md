# 巡检宝 UI 重构实施指南

> 从旧版到新版 "Precision Order" 设计系统的完整迁移指南

---

## 📋 实施概览

### 变更范围
- ✅ 全新 Logo 系统
- ✅ 三档明暗灰度主题
- ✅ 全新配色方案
- ✅ 统一组件规范
- ✅ 响应式布局优化
- ✅ 动画效果升级

### 预计工作量
- **低风险**: 颜色变量替换 (2-3小时)
- **中风险**: 组件样式调整 (1-2天)
- **高风险**: 布局结构调整 (2-3天)
- **总计**: 约 1 周完成全部迁移

---

## 🚀 第一步：主题系统迁移

### 1.1 替换 tailwind.config.js

```javascript
// frontend/tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-theme="deep"]'],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景色
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)',
        },
        // 边框色
        border: {
          DEFAULT: 'var(--border)',
          secondary: 'var(--border-secondary)',
          hover: 'var(--border-hover)',
        },
        // 文字色
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        // 强调色
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          border: 'var(--accent-border)',
        },
        // 功能色
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
        error: {
          DEFAULT: 'var(--error)',
          muted: 'var(--error-muted)',
        },
        info: {
          DEFAULT: 'var(--info)',
          muted: 'var(--info-muted)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        'xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
        'sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        'lg': ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
        'xl': ['var(--text-xl)', { lineHeight: 'var(--leading-tight)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': 'var(--shadow-glow)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-default)',
        'slide-in': 'slideIn var(--duration-normal) var(--ease-default)',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-default)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 1.2 替换 index.css

将 `frontend/src/index.css` 替换为设计系统提供的 `theme.css` 内容。

### 1.3 创建 ThemeProvider

```typescript
// frontend/src/components/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'deep' | 'balanced' | 'clear';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 从 localStorage 读取保存的主题
    return (localStorage.getItem('xunjianbao-theme') as Theme) || 'deep';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('xunjianbao-theme', newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['deep', 'balanced', 'clear'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## 🎨 第二步：组件升级

### 2.1 Button 组件升级

```typescript
// frontend/src/components/ui/Button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-bg-primary hover:bg-accent-hover shadow-sm',
        secondary: 'bg-bg-tertiary text-text-primary border border-border hover:border-border-hover hover:bg-bg-hover',
        ghost: 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary',
        danger: 'bg-error text-white hover:bg-error/90 shadow-sm',
        outline: 'border border-border bg-transparent hover:bg-bg-tertiary text-text-primary',
      },
      size: {
        sm: 'h-7 rounded-md px-3 text-xs',
        md: 'h-9 rounded-md px-4',
        lg: 'h-11 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            加载中...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 2.2 Card 组件升级

```typescript
// frontend/src/components/ui/Card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'accent';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-bg-secondary p-4 transition-all duration-fast',
          {
            'border-border': variant === 'default',
            'border-border hover:border-border-hover cursor-pointer hover:shadow-md': variant === 'interactive',
            'border-accent-border border-t-4 border-t-accent': variant === 'accent',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-tight text-text-primary', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4 mt-4 border-t border-border', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

---

## 🧭 第三步：布局升级

### 3.1 新 Layout 组件

```typescript
// frontend/src/components/Layout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import {
  LayoutGrid,
  Monitor,
  Bot,
  AlertTriangle,
  Settings,
  Image,
  Command,
  BarChart3,
  Activity,
  ClipboardList,
  Shield,
  FolderOpen,
  Sun,
  Moon,
  Monitor as MonitorIcon,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { path: '/', label: '监控大屏', icon: LayoutGrid },
  { path: '/monitor', label: '视频监控', icon: Monitor },
  { path: '/gallery', label: '图片库', icon: Image },
  { path: '/media-library', label: '媒体库', icon: FolderOpen },
  { path: '/command', label: '指挥中心', icon: Command },
  { path: '/alerts', label: '告警中心', icon: AlertTriangle, badge: 12 },
  { path: '/ai', label: 'AI 助手', icon: Bot },
  { path: '/reports', label: '数据报表', icon: BarChart3 },
  { path: '/sensors', label: '传感器', icon: Activity },
  { path: '/tasks', label: '任务管理', icon: ClipboardList },
  { path: '/admin', label: '系统管理', icon: Shield },
];

const themeIcons = {
  deep: Moon,
  balanced: MonitorIcon,
  clear: Sun,
};

export const Layout = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const ThemeIcon = themeIcons[theme];

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* 极简图标导航栏 - 72px */}
      <aside className="w-[72px] bg-bg-secondary border-r border-border flex flex-col items-center py-4 select-none">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" className="text-accent">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
              <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2"/>
              <circle cx="24" cy="24" r="4" fill="currentColor"/>
              <path d="M24 8 L24 16 M24 32 L24 40 M8 24 L16 24 M32 24 L40 24" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-10 h-px bg-border mb-4" />

        {/* 导航图标 */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const isHovered = hoveredItem === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* 图标按钮 */}
                <div
                  className={`
                    relative w-14 h-14 rounded-xl flex items-center justify-center
                    transition-all duration-fast
                    ${isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }
                  `}
                >
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  
                  {/* 徽章 */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-bg-secondary" />
                  )}
                </div>

                {/* 激活指示条 */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
                )}

                {/* 悬浮提示 */}
                {isHovered && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-bg-secondary border border-border rounded-lg shadow-lg animate-slide-in">
                    <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 底部工具 */}
        <div className="mt-auto flex flex-col items-center gap-2 pb-4">
          <div className="w-10 h-px bg-border mb-2" />
          
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="w-14 h-14 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all"
            title="切换主题"
          >
            <ThemeIcon size={20} />
          </button>
          
          {/* 设置 */}
          <Link
            to="/settings"
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/settings'
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <Settings size={20} />
          </Link>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
        {/* 顶部栏 */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary text-sm">巡检宝</span>
            <span className="text-text-tertiary">/</span>
            <span className="text-text-primary font-medium">
              {navItems.find(item => item.path === location.pathname)?.label || '设置'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 当前主题指示 */}
            <span className="text-xs text-text-tertiary px-2 py-1 rounded bg-bg-tertiary">
              {theme === 'deep' ? '深境' : theme === 'balanced' ? '均衡' : '清境'}
            </span>
          </div>
        </header>
        
        {/* 页面内容 */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
```

---

## 📝 第四步：页面迁移清单

### Dashboard 页面

```typescript
// 主要变更点
- 统计卡片: 使用 Card variant="accent" 替代原来的自定义样式
- 颜色引用: 从 bg-[#1e1e1e] 改为 bg-bg-secondary
- 文字颜色: 从 text-[#cccccc] 改为 text-text-primary
- 边框: 从 border-[#2d2d2d] 改为 border-border
```

### Monitor 页面

```typescript
// 主要变更点
- 视频网格: 保持布局，更新颜色变量
- 设备列表: 使用新的导航样式
- YOLO开关: 使用新的 Button variant
- OpenClaw按钮: 添加悬浮动效
```

### MediaLibrary 页面

```typescript
// 主要变更点
- 文件夹树: 使用新的激活状态样式
- 文件卡片: 使用 Card component
- 存储统计: 使用新的进度条样式
- 上传按钮: 使用 Button variant="primary"
```

---

## 🔍 第五步：质量检查

### 视觉检查清单

- [ ] 所有颜色都使用 CSS 变量
- [ ] 没有硬编码的色值（如 #fff, #000）
- [ ] 文字对比度符合 WCAG AA 标准
- [ ] 圆角统一使用标准 token
- [ ] 间距都是 8 的倍数

### 功能检查清单

- [ ] 主题切换正常工作
- [ ] 所有页面正确渲染
- [ ] 交互状态（hover, focus, active）正常
- [ ] 动画流畅无卡顿
- [ ] 响应式布局正常

### 性能检查清单

- [ ] 没有冗余的 CSS
- [ ] 动画使用 transform 和 opacity
- [ ] 图片正确压缩
- [ ] 没有内存泄漏

---

## 📚 附录

### 旧颜色映射表

| 旧颜色 | 新变量 | 说明 |
|--------|--------|------|
| `#0d1117` | `var(--bg-primary)` | 主背景 |
| `#161b22` | `var(--bg-secondary)` | 次背景 |
| `#1e1e1e` | `var(--bg-tertiary)` | 三级背景 |
| `#2d2d2d` | `var(--bg-hover)` | 悬停背景 |
| `#30363d` | `var(--border)` | 边框 |
| `#e6edf3` | `var(--text-primary)` | 主文字 |
| `#7d8590` | `var(--text-secondary)` | 次要文字 |
| `#58a6ff` | `var(--accent)` | 强调色 |
| `#3fb950` | `var(--success)` | 成功色 |
| `#d29922` | `var(--warning)` | 警告色 |
| `#f85149` | `var(--error)` | 错误色 |

### 常用类名替换

| 旧类名 | 新类名 |
|--------|--------|
| `bg-[#1e1e1e]` | `bg-bg-secondary` |
| `text-[#cccccc]` | `text-text-primary` |
| `border-[#30363d]` | `border-border` |
| `hover:bg-[#2d2d2d]` | `hover:bg-bg-hover` |
| `text-[#969696]` | `text-text-secondary` |

---

## 🎉 完成！

恭喜！你已经完成了巡检宝 UI 的全面升级。新的 "Precision Order" 设计系统将带来：

- ✅ 更专业的视觉形象
- ✅ 三档主题适应不同场景
- ✅ 更统一的设计语言
- ✅ 更好的可维护性
- ✅ 更强的品牌识别度

**精密、秩序、力量、克制。**

这就是全新的巡检宝。
