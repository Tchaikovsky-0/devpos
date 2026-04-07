# 巡检宝 UI 体验优化计划

## 产品理念
**核心价值**：专业、简洁、高效、强大 + 自动化和智能化

**问题诊断**：
1. 视觉设计存在严重割裂感
2. 功能模块分布分散，缺乏整合
3. OpenClaw 未能无缝集成到用户完整工作流

---

## 📋 第一阶段：视觉一致性重构

### 1.1 CSS 主题系统统一

**问题现状**：
- 存在 3 个独立的 CSS 主题文件
- 变量命名不一致（`--bg-deep` vs `--surface`, `--bg-deepest`）
- 圆角值混乱（24px, 28px, 22px, 20px）

**优化方案**：
```
统一圆角系统：
- 超大组件（面板、弹窗）：rounded-[28px]
- 中型组件（卡片、列表项）：rounded-[20px]
- 小型组件（按钮、标签）：rounded-[12px]
- 微型组件（图标按钮）：rounded-[8px]

统一间距系统：
- 使用 tailwind 的 spacing scale
- 避免硬编码的 px 值

统一阴影系统：
- 悬浮阴影：shadow-hover
- 激活阴影：shadow-active
- 面板阴影：shadow-panel
```

**实施步骤**：
1. [ ] 审计所有 CSS 文件，提取共同变量
2. [ ] 统一圆角系统为 3 档
3. [ ] 统一间距系统
4. [ ] 统一阴影系统
5. [ ] 创建统一的组件样式基线

### 1.2 组件库一致性

**问题现状**：
- `WorkspacePanel` 在不同文件的实现不一致
- `SectionHeader` 的 eyebrow、title、description 使用不统一
- `MetricTile` 的尺寸和内边距不统一

**优化方案**：
```typescript
// 统一的组件 Props 接口
interface WorkspacePanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  extra?: ReactNode;
  className?: string;
}
```

**实施步骤**：
1. [ ] 创建统一的 Workspace 组件设计规范
2. [ ] 重构 `WorkspacePanel` 组件
3. [ ] 重构 `SectionHeader` 组件
4. [ ] 重构 `MetricTile` 组件
5. [ ] 重构 `StatusPill` 组件
6. [ ] 创建组件变更日志

### 1.3 视觉层级优化

**问题现状**：
- 所有页面元素视觉权重相同
- 缺乏明确的视觉层次
- 信息密度不均匀

**优化方案**：
```
建立视觉层次：
Level 0 (全局): 侧边栏、顶栏 - 固定不变
Level 1 (容器): WorkspacePanel - 页面骨架
Level 2 (区块): SectionHeader - 功能区块
Level 3 (元素): MetricTile、StatusPill - 信息展示
Level 4 (交互): Button、Input - 用户操作

统一状态反馈：
- 悬浮：border-color 变亮 + 轻微背景色变化
- 激活：accent 边框 + 微弱背景色
- 禁用：透明度降低 + cursor 变化
```

**实施步骤**：
1. [ ] 设计视觉层级规范文档
2. [ ] 更新 CSS 变量支持层级
3. [ ] 应用层级规范到所有组件
4. [ ] 验证视觉一致性

---

## 🤖 第二阶段：OpenClaw 深度集成

### 2.1 OpenClaw 上下文感知系统

**问题现状**：
- OpenClaw 是独立的侧边栏面板
- 缺乏跨模块上下文传递
- 每个 workspace 独立管理智能协同

**优化方案**：
```typescript
// 全局上下文管理器
interface OpenClawContext {
  currentModule: string;
  currentObject: {
    type: 'stream' | 'alert' | 'task' | 'asset' | 'media';
    id: string;
    name: string;
    metadata: Record<string, unknown>;
  } | null;
  relatedObjects: Array<{
    type: string;
    id: string;
    name: string;
  }>;
}

// 全局上下文 Hook
function useOpenClawContext() {
  const context = useContext(OpenClawContext);
  return context;
}
```

**实施步骤**：
1. [ ] 创建 `OpenClawContext` 全局上下文
2. [ ] 创建 `useOpenClawContext` Hook
3. [ ] 在 Layout 组件中集成上下文管理器
4. [ ] 实现上下文自动更新机制
5. [ ] 添加上下文变更事件系统

### 2.2 OpenClaw 智能操作建议

**问题现状**：
- `ContextActionStrip` 在各 workspace 中重复实现
- 操作建议不够智能和上下文相关
- 缺乏操作执行的闭环

**优化方案**：
```typescript
// 智能操作建议系统
interface OpenClawAction {
  id: string;
  label: string;
  icon?: ReactNode;
  tone: 'accent' | 'neutral' | 'warning';
  prompt: string;
  enabled?: boolean;
  onClick?: () => void;
  autoExecute?: boolean;
}

// 根据上下文自动生成建议
function useContextualActions(): OpenClawAction[] {
  const context = useOpenClawContext();
  
  // 根据当前上下文类型和状态生成建议
  return useMemo(() => {
    switch (context.currentObject?.type) {
      case 'stream':
        return generateStreamActions(context);
      case 'alert':
        return generateAlertActions(context);
      // ...
    }
  }, [context]);
}
```

**实施步骤**：
1. [ ] 创建统一的 `ContextActionStrip` 组件
2. [ ] 实现 `useContextualActions` Hook
3. [ ] 创建各类型的 Action 生成器
4. [ ] 集成到 Layout 组件
5. [ ] 实现操作执行闭环

### 2.3 OpenClaw 跨模块协同

**问题现状**：
- 功能分散在不同模块
- 切换模块丢失上下文
- 缺乏全局的智能引导

**优化方案**：
```typescript
// OpenClaw 全局智能面板
interface GlobalOpenClawPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: OpenClawContext;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

// 快捷操作按钮（可吸附在任意位置）
interface FloatingOpenClawButton {
  position: 'bottom-right' | 'top-right' | 'sidebar';
  badge?: number;
  onClick: () => void;
}
```

**实施步骤**：
1. [ ] 重构 `OpenClawPanel` 为全局面板
2. [ ] 实现上下文持久化
3. [ ] 添加快捷操作按钮
4. [ ] 实现模块间上下文传递
5. [ ] 添加全局搜索集成

---

## 🎯 第三阶段：交互体验优化

### 3.1 侧边栏导航重构

**问题现状**：
- 8 个模块视觉权重相同
- 缺乏优先级提示
- OpenClaw 入口不够突出

**优化方案**：
```
模块优先级分层：
P0 (核心，必须一眼看到):
  - 监控中枢 - 实时监控状态指示
  - 告警处置 - 未处理告警数量徽章

P1 (常用，高频使用):
  - 媒体库
  - 智能协同 - 独立高亮

P2 (辅助，低频使用):
  - 航拍图库
  - 任务协同
  - 资产设备
  - 系统管理

视觉权重调整：
- P0: 图标更大（20px），带状态指示
- P1: 正常大小（16px），正常颜色
- P2: 图标稍小（14px），颜色淡化

交互优化：
- 悬浮展开详情卡片
- 拖拽排序（用户自定义）
- 键盘快捷键支持
```

**实施步骤**：
1. [ ] 设计侧边栏优先级分层规范
2. [ ] 实现视觉权重分层
3. [ ] 添加状态徽章和数字提示
4. [ ] 实现拖拽排序功能
5. [ ] 添加键盘快捷键
6. [ ] 优化悬浮卡片设计

### 3.2 页面布局优化

**问题现状**：
- 页面内布局不一致
- 信息密度不均匀
- 缺乏统一的视觉节奏

**优化方案**：
```
统一的页面结构：
┌─────────────────────────────────┐
│ Header（页面标题 + 操作区）      │
├─────────────────────────────────┤
│ Context Strip（智能协同区）      │ ← 新增
├─────────────────────────────────┤
│ Metrics Row（指标卡区）          │
├─────────────────────────────────┤
│ Main Content（主内容区）         │
│ ┌──────────────┬──────────────┐ │
│ │ List/Panel   │ Detail       │ │
│ └──────────────┴──────────────┘ │
└─────────────────────────────────┘

响应式策略：
- Desktop (>1280px): 全功能布局
- Tablet (768-1280px): 折叠侧边栏
- Mobile (<768px): 底部导航
```

**实施步骤**：
1. [ ] 设计统一的页面布局模板
2. [ ] 创建 `<PageLayout>` 组件
3. [ ] 应用到所有 workspace
4. [ ] 实现响应式适配
5. [ ] 添加布局切换动画

### 3.3 动画与微交互

**问题现状**：
- 缺乏统一的动画风格
- 页面切换体验不流畅
- 交互反馈不够明确

**优化方案**：
```
统一的动画规范：
- 页面进入：fade-in + slide-up, 200ms
- 列表加载：stagger effect, 50ms 间隔
- 按钮点击：scale(0.98), 100ms
- 面板展开：height + opacity, 250ms
- 悬浮反馈：border-color + shadow, 150ms

交互反馈：
- 加载：骨架屏 + shimmer 动画
- 成功：绿色脉冲 + checkmark
- 错误：红色抖动 + 提示
- 等待：loading spinner + 进度
```

**实施步骤**：
1. [ ] 创建统一的动画规范文档
2. [ ] 定义 CSS 动画变量
3. [ ] 创建动画工具类
4. [ ] 应用到关键组件
5. [ ] 添加 PageTransition

---

## 🎨 第四阶段：设计系统完善

### 4.1 统一的设计 Token

**问题现状**：
- 3 个独立的 CSS 主题文件
- 变量命名不统一
- 缺乏设计规范文档

**优化方案**：
```typescript
// 设计 Token 结构
const designTokens = {
  colors: {
    primary: { value: '#58A6FF', usage: '主要强调色' },
    success: { value: '#3FB950', usage: '成功状态' },
    warning: { value: '#D29922', usage: '警告状态' },
    error: { value: '#F85149', usage: '错误状态' },
  },
  typography: {
    fontSize: { xs: '11px', sm: '12px', base: '14px', lg: '16px' },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: { /* 使用 tailwind spacing */ },
  radius: {
    sm: '6px',    // 按钮
    md: '8px',    // 输入框
    lg: '12px',   // 卡片
    xl: '20px',   // 列表项
    2xl: '28px',  // 面板
  },
  shadows: {
    sm: '0 1px 2px',
    md: '0 4px 6px',
    lg: '0 10px 15px',
    panel: '0 4px 6px -1px',
    hover: '0 8px 24px',
  },
};
```

**实施步骤**：
1. [ ] 审计所有现有 token
2. [ ] 创建统一的设计 Token 文档
3. [ ] 更新 CSS 变量
4. [ ] 创建 TypeScript 类型定义
5. [ ] 生成 Token 使用指南

### 4.2 组件 API 标准化

**问题现状**：
- Props 命名不统一
- 缺乏类型定义
- API 设计不一致

**优化方案**：
```
组件命名规范：
- 容器类：Container, Panel, Card
- 展示类：Header, Footer, List, Grid
- 交互类：Button, Input, Select, Modal
- 反馈类：Toast, Alert, Badge, Tag

Props 命名规范：
- 变体：`variant` (primary | secondary | ghost)
- 尺寸：`size` (sm | md | lg)
- 状态：`status` (default | loading | disabled)
- 颜色：`color` (accent | neutral | ...)

事件命名规范：
- on + 动作：onClick, onChange, onSubmit
- on + 状态：onOpen, onClose, onSelect
- on + 数据：onDataChange, onDataFetch
```

**实施步骤**：
1. [ ] 定义组件命名规范
2. [ ] 定义 Props 命名规范
3. [ ] 重构关键组件 API
4. [ ] 添加 TypeScript 类型
5. [ ] 创建组件文档

### 4.3 主题切换优化

**问题现状**：
- 主题切换有闪烁
- 过渡动画不流畅
- 浅色主题不完整

**优化方案**：
```typescript
// 主题配置
const themes = {
  dark: {
    id: 'dark',
    label: '深色',
    icon: Moon,
  },
  light: {
    id: 'light',
    label: '浅色',
    icon: Sun,
  },
  system: {
    id: 'system',
    label: '跟随系统',
    icon: Monitor,
  },
};

// 主题切换策略
function ThemeProvider({ children }) {
  // 1. 读取用户偏好
  // 2. 应用到 html[data-theme]
  // 3. 持久化到 localStorage
  // 4. 添加过渡动画类
}
```

**实施步骤**：
1. [ ] 完善浅色主题
2. [ ] 实现主题切换优化
3. [ ] 添加主题持久化
4. [ ] 实现平滑过渡
5. [ ] 添加系统主题跟随

---

## 📊 实施优先级与时间估算

### Phase 1: 视觉一致性重构（预计 3-5 天）
- [ ] CSS 主题系统统一
- [ ] 组件库一致性
- [ ] 视觉层级优化

### Phase 2: OpenClaw 深度集成（预计 5-7 天）
- [ ] 上下文感知系统
- [ ] 智能操作建议
- [ ] 跨模块协同

### Phase 3: 交互体验优化（预计 3-5 天）
- [ ] 侧边栏导航重构
- [ ] 页面布局优化
- [ ] 动画与微交互

### Phase 4: 设计系统完善（预计 2-3 天）
- [ ] 统一的设计 Token
- [ ] 组件 API 标准化
- [ ] 主题切换优化

**总计预计**：13-20 个工作日

---

## 🎯 成功指标

1. **视觉一致性**：所有页面面板使用统一的圆角、间距、阴影
2. **OpenClaw 集成度**：用户可在任意页面无缝使用智能协同
3. **用户体验评分**：通过用户测试验证交互流畅度
4. **代码质量**：TypeScript 类型覆盖率 > 90%

---

## 📝 附录：设计参考

### 设计灵感来源
- Linear App（简洁高效的代表）
- Vercel Dashboard（专业的视觉语言）
- Notion（模块化设计）
- Raycast（智能搜索与操作）

### 关键设计原则
1. **克制的华丽**：视觉上有特色但不花哨
2. **功能即形式**：每个视觉元素都有明确目的
3. **上下文感知**：智能系统理解用户当前任务
4. **渐进式披露**：信息层次分明，不一次性展示所有内容

---

**文档版本**：v1.0
**创建日期**：2026-04-07
**最后更新**：待定
