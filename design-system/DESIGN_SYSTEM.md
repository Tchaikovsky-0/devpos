# 巡检宝设计系统 v3.0

> **Precision Order · 精密秩序**
> 
> 面向政府、国企、高校的专业工业监控平台视觉规范
> 
> **版本**: v3.0 | **更新**: 2026-04-04 | **目标**: 企业级生产标准

---

## 🎯 设计理念

巡检宝代表着工业监控领域的最高标准——不仅是技术的精确，更是视觉的克制与力量的平衡。我们的设计语言源于对专业精神的深刻理解：政府、国企、高校以及无人机飞手这些用户群体，他们需要的是一种不喧哗、不媚俗、沉稳有力的视觉体验。

**核心关键词**: 精密 · 秩序 · 力量 · 克制 · 精致

---

## 🎨 美学方向

### 设计原则
- **克制的奢华**: 工业美学与精密感的完美融合
- **分层视觉**: 通过阴影、透明度、Z轴创造深邃的空间感
- **精致细节**: 像素级精确的圆角、边框、间距
- **有机动效**: 平滑自然的过渡，像精密仪器般的运作
- **层次信息**: 清晰的视觉层级，重要信息一目了然

### 避免的陷阱
- ❌ 避免使用 Inter/Roboto 等过度通用的字体
- ❌ 避免浅尝辄止的渐变
- ❌ 避免千篇一律的组件
- ✅ 选择有个性但专业的字体
- ✅ 使用微妙的光影效果
- ✅ 创造独特的品牌视觉记忆

---

## 🎨 三档明暗灰度主题

### 深境模式 (Deep Mode)
适合24/7监控室环境，减少眼部疲劳，让视频画面成为绝对主角。

```css
--bg-primary: #090C10      /* 深邃沉浸背景 */
--bg-secondary: #0F1419    /* 次背景、卡片 */
--bg-tertiary: #192029     /* 悬停、激活状态 */
--bg-elevated: #0D131A     /* 提升背景 */
--border-subtle: #1A2129          /* 微妙边框 */
--border: #242D38          /* 边框、分隔线 */
--border-strong: #2F3B4A          /* 强调边框 */
--text-primary: #F0F4F8    /* 主文字 */
--text-secondary: #8B95A3  /* 次要文字 */
--text-tertiary: #5A6573   /* 禁用、占位符 */
--shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.4)
--shadow-strong: 0 8px 24px rgba(0, 0, 0, 0.5)
```

### 均衡模式 (Balanced Mode)
日常工作的理想选择，明暗平衡，适合办公室和分析场景。

```css
--bg-primary: #12161D
--bg-secondary: #1A2028
--bg-tertiary: #252D38
--bg-elevated: #161B22
--border-subtle: #222A35
--border: #2D3846
--border-strong: #3A4758
--text-primary: #F2F6FA
--text-secondary: #9AA5B4
--text-tertiary: #6B7788
--shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.25)
--shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.35)
--shadow-strong: 0 8px 24px rgba(0, 0, 0, 0.45)
```

### 清境模式 (Clear Mode)
明亮通透，适合演示和汇报场景，展现专业与开放。

```css
--bg-primary: #F8FAFC
--bg-secondary: #FFFFFF
--bg-tertiary: #F1F5F9
--bg-elevated: #FFFFFF
--border-subtle: #E8EEF5
--border: #D9E3EF
--border-strong: #C4D2E3
--text-primary: #0F172A
--text-secondary: #64748B
--text-tertiary: #94A3B8
--shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.04)
--shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.08)
--shadow-strong: 0 8px 24px rgba(0, 0, 0, 0.12)
```

---

## 🌈 功能色彩系统

色彩仅用于状态传达，以极低的饱和度出现，如同精密仪器上的指示灯。

| 色彩 | 色值 | 用途 |
|------|------|------|
| **强调色 (Accent)** | `#3B82F6` | AI功能、链接、主按钮 |
| **强调亮 (Accent Light)** | `#60A5FA` | 悬停状态 |
| **强调暗 (Accent Dark)** | `#2563EB` | 激活状态 |
| **成功 (Success)** | `#10B981` | 在线、正常、完成状态 |
| **警告 (Warning)** | `#F59E0B` | 告警、注意、待处理 |
| **错误 (Error)** | `#EF4444` | 离线、危险、紧急 |
| **信息 (Info)** | `#06B6D4` | 提示、信息状态 |

### 色彩使用规范

- **背景使用**: 使用 `color-muted` 变体（透明度8-12%）
- **文字使用**: 直接使用主色值
- **边框使用**: 使用 `color-border` 变体（透明度25-35%）
- **渐变使用**: 从亮到暗的微妙渐变

```css
--accent: #3B82F6
--accent-light: #60A5FA
--accent-dark: #2563EB
--accent-muted: rgba(59, 130, 246, 0.1)
--accent-border: rgba(59, 130, 246, 0.3)
--accent-gradient: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)

--success: #10B981
--success-muted: rgba(16, 185, 129, 0.1)
--success-border: rgba(16, 185, 129, 0.3)

--warning: #F59E0B
--warning-muted: rgba(245, 158, 11, 0.1)
--warning-border: rgba(245, 158, 11, 0.3)

--error: #EF4444
--error-muted: rgba(239, 68, 68, 0.1)
--error-border: rgba(239, 68, 68, 0.3)

--info: #06B6D4
--info-muted: rgba(6, 182, 212, 0.1)
--info-border: rgba(6, 182, 212, 0.3)
```

---

## 🔤 字体规范

### 字体家族

选择专业且有独特个性的字体，避免过度通用的 Inter：

```css
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

**字体选择理由**：
- **SF Pro Display**: Apple 系统字体，专业、现代、易读
- **PingFang SC**: 中文屏显字体，与英文完美搭配
- **SF Mono**: 等宽字体，代码展示清晰

### 字号层级

| 层级 | 大小 | 字重 | 用途 | 行高 |
|------|------|------|------|------|
| **Display** | 56px | 700 | 数据大屏数字 | 1.1 |
| **Hero** | 36px | 600 | 大标题 | 1.2 |
| **Title** | 24px | 600 | 页面标题 | 1.25 |
| **Heading** | 20px | 600 | 区块标题 | 1.3 |
| **Subtitle** | 18px | 500 | 子标题 | 1.4 |
| **Body** | 15px | 400 | 正文内容 | 1.5 |
| **Body Small** | 14px | 400 | 辅助正文 | 1.5 |
| **Small** | 13px | 500 | 辅助文字、时间戳 | 1.4 |
| **Caption** | 12px | 500 | 标签、徽章 | 1.3 |
| **Micro** | 11px | 500 | 极小文字 | 1.2 |

### 字重规范

```css
--font-thin: 100
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### 行高规范

```css
--leading-tight: 1.1     /* 大数字 */
--leading-snug: 1.25      /* 标题 */
--leading-normal: 1.5      /* 正文 */
--leading-relaxed: 1.75    /* 长文本 */
```

### 字间距规范

```css
--tracking-tight: -0.02em
--tracking-normal: 0
--tracking-wide: 0.02em
```

---

## 📐 间距系统

基于 **4px 基准网格**，所有尺寸都是4的倍数，提供更精细的控制。

| Token | 值 | 用途 |
|-------|-----|------|
| `space-0.5` | 2px | 极紧凑间距 |
| `space-1` | 4px | 图标内边距 |
| `space-1.5` | 6px | 微间距 |
| `space-2` | 8px | 紧凑间距 |
| `space-2.5` | 10px | 小间距 |
| `space-3` | 12px | 按钮内边距 |
| `space-3.5` | 14px | 中等间距 |
| `space-4` | 16px | 卡片内边距 |
| `space-5` | 20px | 表单间距 |
| `space-6` | 24px | 区块间距 |
| `space-7` | 28px | 较大间距 |
| `space-8` | 32px | 大模块间距 |
| `space-9` | 36px | 超大间距 |
| `space-10` | 40px | 页面边距 |
| `space-12` | 48px | 超大页面边距 |
| `space-16` | 64px | 巨量间距 |

### 圆角规范

```css
--radius-none: 0
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px
--radius-2xl: 16px
--radius-full: 9999px
```

### 边框粗细

```css
--border-width-0: 0
--border-width-1: 1px
--border-width-2: 2px
--border-width-4: 4px
```

---

## 🧩 组件规范

### 按钮 (Button)

#### 主按钮 (Primary)
```css
background: var(--accent-gradient);
color: white;
border-radius: var(--radius-md);
padding: 10px 20px;
font-size: 14px;
font-weight: 600;
letter-spacing: -0.01em;
box-shadow: var(--shadow-soft);
transition: all 200ms var(--ease-default);

&:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-medium);
  background: linear-gradient(135deg, #7C9EFF 0%, #3B82F6 100%);
}

&:active {
  transform: translateY(0);
  box-shadow: var(--shadow-soft);
}
```

#### 次按钮 (Secondary)
```css
background: var(--bg-elevated);
color: var(--text-primary);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-md);
padding: 10px 20px;
font-size: 14px;
font-weight: 500;
transition: all 200ms var(--ease-default);

&:hover {
  background: var(--bg-tertiary);
  border-color: var(--border);
  transform: translateY(-1px);
}

&:active {
  transform: translateY(0);
}
```

#### 幽灵按钮 (Ghost)
```css
background: transparent;
color: var(--text-secondary);
border-radius: var(--radius-md);
padding: 10px 16px;
font-size: 14px;
font-weight: 500;
transition: all 150ms var(--ease-default);

&:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
```

### 卡片 (Card)

```css
background: var(--bg-secondary);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg);
padding: 20px;
box-shadow: var(--shadow-soft);
transition: all 200ms var(--ease-default);
```

#### 卡片变体

- **default**: 标准卡片
- **interactive**: 可点击卡片（hover时有微妙提升和边框高亮）
  ```css
  &:hover {
    border-color: var(--border);
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
  ```
- **accent**: 强调卡片（顶部有强调色边框）
  ```css
  border-top: 3px solid var(--accent);
  ```
- **elevated**: 提升卡片（更强的阴影）
  ```css
  background: var(--bg-elevated);
  box-shadow: var(--shadow-medium);
  ```

### 输入框 (Input)

```css
background: var(--bg-primary);
border: 1px solid var(--border);
border-radius: var(--radius-md);
padding: 10px 14px;
color: var(--text-primary);
font-size: 14px;
transition: all 200ms var(--ease-default);

&::placeholder {
  color: var(--text-tertiary);
}
```

**状态样式**:
- Focus: `border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-muted);`
- Error: `border-color: var(--error); box-shadow: 0 0 0 3px var(--error-muted);`
- Success: `border-color: var(--success);`
- Disabled: `opacity: 0.5; cursor: not-allowed;`
- Hover: `border-color: var(--border-strong);`

### 导航 (Navigation)

#### 侧边导航

```css
width: 76px;
background: var(--bg-secondary);
border-right: 1px solid var(--border-subtle);
```

**导航项**:
- 默认: 48px × 48px，透明背景，圆角 var(--radius-md)
- Hover: `background: var(--bg-tertiary); transform: scale(1.02);`
- Active: `background: var(--accent-muted); color: var(--accent);` + 左侧3px强调色指示条

### 徽章 (Badge)

```css
padding: 4px 10px;
border-radius: var(--radius-full);
font-size: 12px;
font-weight: 600;
letter-spacing: 0.02em;
text-transform: uppercase;
```

变体：
- **default**: `background: var(--bg-tertiary); color: var(--text-secondary);`
- **success**: `background: var(--success-muted); color: var(--success);`
- **warning**: `background: var(--warning-muted); color: var(--warning);`
- **error**: `background: var(--error-muted); color: var(--error);`
- **accent**: `background: var(--accent-muted); color: var(--accent);`

---

## 🎬 动效规范

### 过渡时间

```css
--duration-ultra-fast: 100ms;  /* 图标、微交互 */
--duration-fast: 150ms;          /* 按钮、链接 */
--duration-normal: 200ms;        /* 卡片、面板 */
--duration-slow: 300ms;          /* 模态框、抽屉 */
--duration-ultra-slow: 400ms;    /* 页面过渡 */
```

### 缓动函数

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
```

### 常用动画

#### 淡入 (Fade In)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### 淡入上滑 (Fade In Up)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 淡入下滑 (Fade In Down)
```css
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 缩放淡入 (Scale In)
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

#### 脉冲 (Pulse)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### 呼吸 (Breathing)
```css
@keyframes breathing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

### 微交互规范

#### 悬停效果
- **按钮**: 轻微上移 + 阴影增强 + 背景渐变
- **卡片**: 微妙上移 + 阴影增强 + 边框高亮
- **链接**: 颜色变化 + 下划线动画
- **图标**: 缩放 + 颜色变化

#### 点击效果
- **按钮**: 按下时轻微下移 + 阴影减小
- **卡片**: 按下时缩放 0.98
- **导航项**: 按下时背景色加深

#### 加载效果
- **骨架屏**: 从左到右的渐变扫过
- **旋转加载**: 平滑的旋转动画
- **进度条**: 平滑的进度动画

#### 状态变化
- **成功**: 绿色脉冲 + 勾选动画
- **错误**: 红色抖动 + 错误图标
- **警告**: 黄色闪烁 + 警告图标

### 页面过渡

#### 进入动画
```css
.page-enter {
  animation: fadeInUp 300ms var(--ease-out);
}
```

#### 离开动画
```css
.page-exit {
  animation: fadeIn 200ms var(--ease-in) reverse;
}
```

#### 错开显示 (Staggered Reveal)
```css
.stagger-item {
  animation: fadeInUp 400ms var(--ease-out) both;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
```

---

## 🎯 Logo使用规范

### Logo变体

1. **主Logo** (logo_main.png): 白底黑线，用于浅色背景
2. **深色版本** (logo_dark.png): 深色背景，用于深色主题
3. **Favicon** (logo_favicon.png): 64×64，用于浏览器标签
4. **带文字版本** (logo_with_text.png): 完整品牌展示

### 使用原则

- **最小尺寸**: Logo不小于32px
- **安全区域**: Logo周围保持至少8px留白
- **背景对比**: 确保Logo与背景有足够对比度
- **禁止操作**: 不要拉伸、旋转、改变颜色

---

## 📱 响应式断点

```css
--breakpoint-sm: 640px;   /* 手机横屏 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小桌面 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大桌面 */
```

---

## 🔧 前端实现指南

### Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          muted: 'var(--accent-muted)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

### CSS 变量定义

```css
/* themes.css */
:root[data-theme="deep"] {
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;
  --border: #30363D;
  --text-primary: #E6EDF3;
  --text-secondary: #7D8590;
  --text-tertiary: #484F58;
}

:root[data-theme="balanced"] {
  --bg-primary: #1E2228;
  --bg-secondary: #2A3038;
  --bg-tertiary: #3A424A;
  --border: #3D444D;
  --text-primary: #E8EDF2;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
}

:root[data-theme="clear"] {
  --bg-primary: #F5F7FA;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #EDF0F4;
  --border: #DDE2E8;
  --text-primary: #1F2328;
  --text-secondary: #656D76;
  --text-tertiary: #8C959F;
}
```

### 主题切换实现

```typescript
// ThemeProvider.tsx
type Theme = 'deep' | 'balanced' | 'clear';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'deep',
  setTheme: () => {},
});

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('deep');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 📁 文件结构

```
design-system/
├── output/                    # 生成的设计文件
│   ├── logo_main.png         # 主Logo
│   ├── logo_dark.png         # 深色Logo
│   ├── logo_favicon.png      # Favicon
│   ├── logo_with_text.png    # 带文字Logo
│   ├── theme_preview.png     # 三档主题预览
│   ├── dashboard_mockup.png  # 数据看板
│   ├── monitor_interface.png # 监控界面
│   ├── media_library.png     # 媒体库
│   ├── openclaw_panel.png    # AI助手
│   └── design_system.png     # 设计规范总览
├── DESIGN_SYSTEM.md          # 本设计规范文档
└── xunjianbao-design-philosophy.md  # 设计哲学
```

---

## ✅ 设计检查清单

### 色彩
- [ ] 使用了正确的主题色彩变量
- [ ] 功能色彩仅用于状态指示
- [ ] 文字与背景对比度符合WCAG标准

### 排版
- [ ] 使用规范的字体家族
- [ ] 字号符合层级系统
- [ ] 行高适当，阅读舒适

### 间距
- [ ] 所有尺寸基于8px网格
- [ ] 组件间距使用标准token
- [ ] 留白充足，不拥挤

### 组件
- [ ] 按钮样式符合规范
- [ ] 卡片有统一的圆角和边框
- [ ] 导航有明确的激活状态

### 交互
- [ ] 过渡动画平滑自然
- [ ] 时长符合规范
- [ ] 有适当的hover和focus状态

---

## 🚀 版本历史

### v2.0 (2026-04-04)
- 全新设计系统 "Precision Order"
- 三档明暗灰度主题
- 新Logo设计
- 完整组件规范
- 前端实现指南

---

**精密、秩序、力量、克制。**

*这就是巡检宝。*
