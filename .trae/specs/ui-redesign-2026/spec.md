# 巡检宝 UI 重构规范 v2.0

> **版本**: v2.0
> **更新日期**: 2026-04-04
> **核心理念**: 简洁、高效、强大、专业、智能、高级感、华丽而不浮夸

---

## 一、项目理解

### 1.1 产品核心定位

**一句话定位**：
> "面向重工业企业的智能监控平台，通过OpenClaw AI Agent和YOLO检测，让监控从'被动观看'升级为'主动思考'。"

### 1.2 四大核心模块

根据产品架构2.0设计原则，巡检宝应该收敛到**4个核心入口**：

```
┌─────────────────────────────────────────────────────────────┐
│  🎥 监控中心          ← 默认首页                            │
│  🤖 AI 助手                                                 │
│  🔔 告警中心          [徽章: 待处理数量]                     │
│  ⚙️  资产管理                                                │
└─────────────────────────────────────────────────────────────┘
```

**用户主路径**：
```
打开系统 ──► 查看监控 ──► 发现异常 ──► 处理告警 ──► 生成报告
   │           │            │            │            │
   ▼           ▼            ▼            ▼            ▼
监控中心    数据大屏      AI检测      告警中心      AI助手
```

### 1.3 目标用户画像

| 用户类型 | 典型场景 | 核心需求 |
|----------|----------|----------|
| 重工业企业 | 矿山、石油化工、电力、制造业 | 安全监控、隐患排查、合规管理 |
| 国企/高校 | 园区管理、安全保卫 | 统一监控、智能分析、报告生成 |
| 无人机用户 | 大疆司空2用户 | 视频流接入、实时监控、巡检记录 |

### 1.4 品牌调性

**关键词**：简洁、高效、强大、专业、智能、高级感、华丽而不浮夸

**设计参考**：
- Apple Pro：精致的细节处理
- Linear：流畅的动效体验
- Vercel：现代的技术感
- Raycast：专业的工具感

---

## 二、现状问题分析

### 2.1 导航结构问题 ❌

**当前问题**：
```tsx
// Layout.tsx 中有11个导航项
const navItems = [
  { path: '/', label: '监控大屏', icon: LayoutDashboard },
  { path: '/alerts', label: '告警中心', icon: AlertTriangle },
  { path: '/monitor', label: '视频监控', icon: Monitor },
  { path: '/gallery', label: '媒体库', icon: Image },
  { path: '/reports', label: '报告中心', icon: FileText },
  { path: '/ai', label: 'AI助手', icon: Bot },
  { path: '/command', label: '命令中心', icon: Terminal },
  { path: '/sensors', label: '传感器', icon: Cpu },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/admin', label: '管理后台', icon: Settings },
];
```

**问题诊断**：
1. ❌ 入口过多，用户找不到重点
2. ❌ 功能分散，缺乏场景闭环
3. ❌ 与产品架构2.0的4个核心入口不符

### 2.2 视觉设计问题 ❌

**当前设计系统**：
```js
// tailwind.config.js - 色彩系统过于简单
colors: {
  bg: {
    darkest: '#0d1117',
    dark: '#161b22',
    DEFAULT: '#21262d',
    light: '#30363d',
  },
  accent: {
    DEFAULT: '#4F7FD8',
    light: '#6B8FF8',
  },
}
```

**问题诊断**：
1. ❌ 色彩层次不够丰富，缺乏渐变
2. ❌ 缺乏玻璃拟态效果
3. ❌ 动效系统缺失
4. ❌ 组件样式基础，缺乏高级感
5. ❌ 给人"毛坯房"的感觉

### 2.3 组件问题 ❌

**当前组件示例**（Dashboard.tsx）：
```tsx
// 统计卡片样式
<div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-6 border border-accent/30">
  // ...
</div>

// 问题：
// 1. 渐变使用随意，缺乏统一规范
// 2. 阴影效果缺失
// 3. 圆角不统一
// 4. 悬浮效果缺失
// 5. 动效缺失
```

---

## 三、设计愿景

### 3.1 设计理念

**核心原则**：华丽而不浮夸

```
不是：
✗ 花哨的渐变
✗ 过度装饰的边框
✗ 过于复杂的动画
✗ 炫技式的视觉效果

而是：
✓ 克制的精致
✓ 优雅的简约
✓ 专业的克制
✓ 高级的低调
```

### 3.2 设计目标

**用户体验目标**：
| 指标 | 当前 | 目标 |
|------|------|------|
| 平均找到功能时间 | 30s | 5s |
| 视觉专业感 | 2/5 | 5/5 |
| 操作流畅度 | 3/5 | 5/5 |
| 长时间使用疲劳度 | 高 | 低 |

### 3.3 设计语言

**视觉风格**：Apple Pro + Linear + 监控中心科技感

**关键词**：深色主题、科技感、专业、克制、高级

---

## 四、新设计系统

### 4.1 色彩系统

#### 4.1.1 基础色彩层次

```css
/* 背景层次 - 5层递进 */
--bg-void: #05070B;           /* 最深层：视频区域 */
--bg-deepest: #0A0E14;        /* 最深：页面背景 */
--bg-deep: #0D1117;           /* 深：卡片背景 */
--bg-base: #161B22;           /* 默认：容器背景 */
--bg-elevated: #1C2128;       /* 提升：悬浮元素 */
--bg-surface: #21262D;        /* 表面：按钮背景 */

/* 主色调 - 科技蓝 */
--accent-primary: #4F7FD8;    /* 主强调色 */
--accent-hover: #6B8FF8;      /* 悬浮状态 */
--accent-active: #3D6BC4;      /* 激活状态 */
--accent-glow: rgba(79, 127, 216, 0.4);  /* 光晕效果 */

/* 功能色 */
--success: #2ECC71;            /* 成功 */
--warning: #F39C12;           /* 警告 */
--error: #E74C3C;             /* 错误 */
--info: #3498DB;              /* 信息 */

/* 文字层次 */
--text-primary: #F0F6FC;      /* 主要文字 */
--text-secondary: #8B949E;     /* 次要文字 */
--text-tertiary: #6E7681;      /* 辅助文字 */
--text-disabled: #484F58;     /* 禁用状态 */

/* 边框层次 */
--border-subtle: rgba(255, 255, 255, 0.06);   /* 微弱边框 */
--border-default: rgba(255, 255, 255, 0.1);    /* 默认边框 */
--border-emphasis: rgba(255, 255, 255, 0.2);  /* 强调边框 */
--border-active: rgba(79, 127, 216, 0.5);     /* 激活边框 */
```

#### 4.1.2 渐变系统

```css
/* 背景渐变 */
--gradient-bg-subtle: linear-gradient(
  180deg,
  rgba(79, 127, 216, 0.05) 0%,
  transparent 100%
);

/* 强调渐变 */
--gradient-accent: linear-gradient(
  135deg,
  #4F7FD8 0%,
  #6B8FF8 100%
);

/* 玻璃拟态 */
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-blur: blur(20px);

/* 光晕效果 */
--glow-accent: 0 0 20px rgba(79, 127, 216, 0.3);
--glow-soft: 0 0 40px rgba(79, 127, 216, 0.15);
```

### 4.2 字体系统

```css
/* 主字体 */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-chinese: 'Noto Sans SC', -apple-system, sans-serif;

/* 字号系统 */
--text-xs: 0.75rem;      /* 12px - 辅助信息 */
--text-sm: 0.875rem;     /* 14px - 次要文字 */
--text-base: 1rem;       /* 16px - 正文 */
--text-lg: 1.125rem;     /* 18px - 标题小 */
--text-xl: 1.25rem;      /* 20px - 标题 */
--text-2xl: 1.5rem;     /* 24px - 页面标题 */
--text-3xl: 1.875rem;   /* 30px - 大标题 */
--text-4xl: 2.25rem;    /* 36px - Hero标题 */

/* 字重 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 4.3 间距系统

```css
/* 基础间距单位：4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 4.4 圆角系统

```css
/* 圆角层次 */
--radius-sm: 0.375rem;   /* 6px - 小元素 */
--radius-md: 0.5rem;     /* 8px - 默认 */
--radius-lg: 0.75rem;    /* 12px - 卡片 */
--radius-xl: 1rem;        /* 16px - 大容器 */
--radius-2xl: 1.5rem;    /* 24px - 特殊容器 */
--radius-full: 9999px;    /* 圆形 */
```

### 4.5 阴影系统

```css
/* 阴影层次 */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(79, 127, 216, 0.3);

/* 悬浮阴影 */
--shadow-hover: 0 8px 16px rgba(0, 0, 0, 0.4),
                0 0 20px rgba(79, 127, 216, 0.2);
```

### 4.6 动效系统

#### 4.6.1 缓动函数

```css
/* 基础缓动 */
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* 弹性缓动 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

#### 4.6.2 时长系统

```css
/* 时长层次 */
--duration-fast: 150ms;      /* 微交互 */
--duration-normal: 200ms;    /* 标准过渡 */
--duration-slow: 300ms;      /* 入场动画 */
--duration-slower: 500ms;     /* 大元素动画 */
```

#### 4.6.3 动画类型

```css
/* 入场动画 - 淡入上滑 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 悬浮动画 - 轻微上浮 */
@keyframes hoverLift {
  from {
    transform: translateY(0);
    box-shadow: var(--shadow-md);
  }
  to {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }
}

/* 脉冲动画 - 状态指示 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 发光动画 - 强调效果 */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(79, 127, 216, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(79, 127, 216, 0.6);
  }
}
```

---

## 五、核心组件设计

### 5.1 按钮组件

#### 5.1.1 主要按钮

```tsx
// 样式规范
// 背景：渐变色 + 微光效果
// 阴影：柔和的强调色阴影
// 圆角：12px
// 悬浮：轻微上浮 + 阴影增强

.primary-button {
  background: linear-gradient(135deg, #4F7FD8 0%, #6B8FF8 100%);
  box-shadow: 0 4px 14px rgba(79, 127, 216, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 500;
  color: white;
  transition: all 200ms ease-out;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 127, 216, 0.4);
}

.primary-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(79, 127, 216, 0.3);
}
```

#### 5.1.2 次要按钮

```tsx
.secondary-button {
  background: rgba(79, 127, 216, 0.1);
  border: 1px solid rgba(79, 127, 216, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 500;
  color: #4F7FD8;
  transition: all 200ms ease-out;
}

.secondary-button:hover {
  background: rgba(79, 127, 216, 0.2);
  border-color: rgba(79, 127, 216, 0.5);
  transform: translateY(-1px);
}
```

#### 5.1.3 幽灵按钮

```tsx
.ghost-button {
  background: transparent;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 500;
  color: #8B949E;
  transition: all 200ms ease-out;
}

.ghost-button:hover {
  color: #F0F6FC;
  background: rgba(255, 255, 255, 0.05);
}
```

### 5.2 卡片组件

#### 5.2.1 标准卡片

```tsx
.standard-card {
  background: #161B22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  transition: all 200ms ease-out;
}

.standard-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}
```

#### 5.2.2 玻璃卡片

```tsx
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
}
```

#### 5.2.3 强调卡片

```tsx
.accent-card {
  background: linear-gradient(
    135deg,
    rgba(79, 127, 216, 0.15) 0%,
    rgba(107, 143, 248, 0.05) 100%
  );
  border: 1px solid rgba(79, 127, 216, 0.3);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 0 20px rgba(79, 127, 216, 0.1);
}
```

### 5.3 导航组件

#### 5.3.1 侧边栏（新设计）

```tsx
.sidebar {
  width: 260px;
  background: #0D1117;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 24px 0;

  // Logo区域
  .logo {
    padding: 0 24px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  // 导航项
  .nav-item {
    padding: 12px 24px;
    margin: 4px 12px;
    border-radius: 10px;
    color: #8B949E;
    font-weight: 500;
    transition: all 200ms ease-out;
    cursor: pointer;

    &:hover {
      color: #F0F6FC;
      background: rgba(255, 255, 255, 0.05);
    }

    &.active {
      color: #4F7FD8;
      background: rgba(79, 127, 216, 0.1);
      border-left: 3px solid #4F7FD8;
    }
  }
}
```

**新导航结构**（从11个收敛到4个）：
```tsx
const navItems = [
  { path: '/monitor', label: '监控中心', icon: MonitorIcon, badge: null },
  { path: '/ai', label: 'AI 助手', icon: BotIcon, badge: null },
  { path: '/alerts', label: '告警中心', icon: AlertIcon, badge: 12 }, // 待处理数量
  { path: '/settings', label: '资产管理', icon: SettingsIcon, badge: null },
];
```

### 5.4 输入框组件

```tsx
.input-field {
  background: #0D1117;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 16px;
  color: #F0F6FC;
  font-size: 14px;
  transition: all 200ms ease-out;

  &::placeholder {
    color: #6E7681;
  }

  &:focus {
    outline: none;
    border-color: #4F7FD8;
    box-shadow: 0 0 0 3px rgba(79, 127, 216, 0.2);
  }

  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.2);
  }
}
```

### 5.5 状态指示器

```tsx
// 在线状态
.status-online {
  width: 8px;
  height: 8px;
  background: #2ECC71;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

// 离线状态
.status-offline {
  width: 8px;
  height: 8px;
  background: #6E7681;
  border-radius: 50%;
}

// 告警状态
.status-alert {
  width: 8px;
  height: 8px;
  background: #E74C3C;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.6);
  animation: pulse 1s ease-in-out infinite;
}
```

---

## 六、页面布局规范

### 6.1 整体布局

```tsx
.app-layout {
  display: flex;
  height: 100vh;
  background: #0A0E14;

  // 侧边栏
  .sidebar {
    width: 260px;
    flex-shrink: 0;
  }

  // 主内容区
  .main-content {
    flex: 1;
    overflow: auto;
    padding: 32px;

    // 页面容器
    .page-container {
      max-width: 1600px;
      margin: 0 auto;
    }
  }
}
```

### 6.2 监控中心布局

```tsx
.monitoring-hub {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  height: calc(100vh - 64px);
  padding: 24px;

  // 顶部工具栏
  .top-bar {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // 左侧设备列表
  .device-list {
    grid-row: 2 / 3;
  }

  // 中间视频墙
  .video-wall {
    grid-row: 2 / 3;
  }

  // 右侧信息面板
  .info-panel {
    grid-row: 2 / 3;
  }

  // 底部时间轴
  .timeline {
    grid-column: 1 / -1;
  }
}
```

### 6.3 卡片布局

```tsx
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}
```

---

## 七、交互动效规范

### 7.1 页面入场动画

```tsx
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1
    }
  }
};
```

### 7.2 卡片悬浮动画

```tsx
const cardHover = {
  rest: {
    y: 0,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  hover: {
    y: -4,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(79, 127, 216, 0.3)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};
```

### 7.3 按钮交互

```tsx
const buttonTap = {
  rest: {
    scale: 1
  },
  tap: {
    scale: 0.98
  }
};
```

### 7.4 加载动画

```tsx
// 骨架屏动画
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #161B22 0%,
    #21262D 50%,
    #161B22 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

---

## 八、响应式设计

### 8.1 断点系统

```css
/* 断点 */
--breakpoint-sm: 640px;   /* 手机横屏 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小笔记本 */
--breakpoint-xl: 1280px;  /* 大屏幕 */
--breakpoint-2xl: 1536px; /* 超大屏幕 */
```

### 8.2 响应式策略

```tsx
// 侧边栏
.sidebar {
  @media (max-width: 1024px) {
    width: 80px;  // 折叠模式
  }

  @media (max-width: 768px) {
    position: fixed;  // 移动端固定底部
    width: 100%;
    height: auto;
  }
}

// 视频网格
.video-grid {
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
```

---

## 九、实施优先级

### Phase 1: 设计系统重构（1周）
1. 更新 Tailwind 配置
2. 创建全局 CSS 变量
3. 重构基础组件（按钮、卡片、输入框）
4. 建立动效系统

### Phase 2: 导航重构（1天）
1. 重构侧边栏（11个 → 4个核心入口）
2. 更新路由结构
3. 清理废弃页面

### Phase 3: 核心页面重构（2周）
1. 监控中心重构
2. AI 助手重构
3. 告警中心重构

### Phase 4: 资产管理重构（1周）
1. 资产管理页面重构
2. 用户管理页面
3. 系统设置页面

---

## 十、成功指标

### 视觉质量
- [ ] 专业感评分：4.5/5
- [ ] 高级感评分：4.5/5
- [ ] 整体美观度：4.5/5

### 用户体验
- [ ] 功能发现时间：< 5秒
- [ ] 页面加载时间：< 2秒
- [ ] 操作流畅度：4.5/5

### 技术指标
- [ ] Lighthouse 性能分：> 90
- [ ] Lighthouse 可访问性：> 95
- [ ] 组件复用率：> 80%

---

**核心理念**：华丽而不浮夸，用克制的精致诠释专业。
