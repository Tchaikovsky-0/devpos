# 巡检宝设计系统 v2.0

> **Precision Order · 精密秩序**
> 
> 面向政府、国企、高校的专业工业监控平台视觉规范

---

## 🎯 设计理念

巡检宝代表着工业监控领域的最高标准——不仅是技术的精确，更是视觉的克制与力量的平衡。我们的设计语言源于对专业精神的深刻理解：政府、国企、高校以及无人机飞手这些用户群体，他们需要的是一种不喧哗、不媚俗、沉稳有力的视觉体验。

**核心关键词**: 精密 · 秩序 · 力量 · 克制

---

## 🎨 三档明暗灰度主题

### 深境模式 (Deep Mode)
适合24/7监控室环境，减少眼部疲劳，让视频画面成为绝对主角。

```css
--bg-primary: #0D1117      /* 深海般的沉浸背景 */
--bg-secondary: #161B22    /* 次背景、卡片 */
--bg-tertiary: #21262D     /* 悬停、激活状态 */
--border: #30363D          /* 边框、分隔线 */
--text-primary: #E6EDF3    /* 主文字 */
--text-secondary: #7D8590  /* 次要文字 */
--text-tertiary: #484F58   /* 禁用、占位符 */
```

### 均衡模式 (Balanced Mode)
日常工作的理想选择，明暗平衡，适合办公室和分析场景。

```css
--bg-primary: #1E2228
--bg-secondary: #2A3038
--bg-tertiary: #3A424A
--border: #3D444D
--text-primary: #E8EDF2
--text-secondary: #9CA3AF
--text-tertiary: #6B7280
```

### 清境模式 (Clear Mode)
明亮通透，适合演示和汇报场景，展现专业与开放。

```css
--bg-primary: #F5F7FA
--bg-secondary: #FFFFFF
--bg-tertiary: #EDF0F4
--border: #DDE2E8
--text-primary: #1F2328
--text-secondary: #656D76
--text-tertiary: #8C959F
```

---

## 🌈 功能色彩系统

色彩仅用于状态传达，以极低的饱和度出现，如同精密仪器上的指示灯。

| 色彩 | 色值 | 用途 |
|------|------|------|
| **强调色 (Accent)** | `#58A6FF` | AI功能、链接、主按钮 |
| **成功 (Success)** | `#3FB950` | 在线、正常、完成状态 |
| **警告 (Warning)** | `#D29922` | 告警、注意、待处理 |
| **错误 (Error)** | `#F85149` | 离线、危险、紧急 |

### 色彩使用规范

- **背景使用**: 使用 `color-muted` 变体（透明度10%）
- **文字使用**: 直接使用主色值
- **边框使用**: 使用 `color-border` 变体（透明度30%）

```css
--accent-muted: rgba(88, 166, 255, 0.1)
--accent-border: rgba(88, 166, 255, 0.3)
--success-muted: rgba(63, 185, 80, 0.1)
--warning-muted: rgba(210, 153, 34, 0.1)
--error-muted: rgba(248, 81, 73, 0.1)
```

---

## 🔤 字体规范

### 字体家族

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
font-mono: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
```

### 字号层级

| 层级 | 大小 | 字重 | 用途 |
|------|------|------|------|
| **Display** | 48px | 600 | 数据大屏数字 |
| **Title** | 24px | 600 | 页面标题 |
| **Subtitle** | 18px | 500 | 区块标题 |
| **Body** | 14px | 400 | 正文内容 |
| **Small** | 12px | 400 | 辅助文字、时间戳 |
| **Caption** | 11px | 400 | 标签、徽章 |

### 行高规范

```css
--leading-tight: 1.25    /* 标题、数字 */
--leading-normal: 1.5    /* 正文 */
--leading-relaxed: 1.75  /* 长文本 */
```

---

## 📐 间距系统

基于 **8px 基准网格**，所有尺寸都是8的倍数。

| Token | 值 | 用途 |
|-------|-----|------|
| `space-1` | 4px | 图标内边距 |
| `space-2` | 8px | 紧凑间距 |
| `space-3` | 12px | 按钮内边距 |
| `space-4` | 16px | 卡片内边距 |
| `space-5` | 20px | 表单间距 |
| `space-6` | 24px | 区块间距 |
| `space-8` | 32px | 大模块间距 |
| `space-10` | 40px | 页面边距 |

---

## 🧩 组件规范

### 按钮 (Button)

#### 主按钮 (Primary)
```css
background: var(--accent);
color: var(--bg-primary);
border-radius: 6px;
padding: 8px 16px;
font-size: 14px;
font-weight: 500;
```

#### 次按钮 (Secondary)
```css
background: var(--bg-tertiary);
color: var(--text-primary);
border: 1px solid var(--border);
border-radius: 6px;
```

#### 幽灵按钮 (Ghost)
```css
background: transparent;
color: var(--text-secondary);
```

### 卡片 (Card)

```css
background: var(--bg-secondary);
border: 1px solid var(--border);
border-radius: 8px;
padding: 16px;
```

#### 卡片变体

- **default**: 标准卡片
- **interactive**: 可点击卡片（hover时有边框高亮）
- **accent**: 强调卡片（顶部有强调色边框）

### 输入框 (Input)

```css
background: var(--bg-primary);
border: 1px solid var(--border);
border-radius: 6px;
padding: 8px 12px;
color: var(--text-primary);
```

**状态样式**:
- Focus: `border-color: var(--accent)`
- Error: `border-color: var(--error)`
- Disabled: `opacity: 0.5`

### 导航 (Navigation)

#### 侧边导航

```css
width: 72px;
background: var(--bg-secondary);
border-right: 1px solid var(--border);
```

**导航项**:
- 默认: 44px × 44px，透明背景
- Hover: `background: var(--bg-tertiary)`
- Active: `background: var(--bg-tertiary)` + 左侧2px强调色指示条

---

## 🎬 动效规范

### 过渡时间

```css
--duration-fast: 150ms;      /* 按钮、链接 */
--duration-normal: 200ms;    /* 卡片、面板 */
--duration-slow: 300ms;      /* 模态框、抽屉 */
```

### 缓动函数

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 常用动画

#### 淡入
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### 滑入
```css
@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateX(-8px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}
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
