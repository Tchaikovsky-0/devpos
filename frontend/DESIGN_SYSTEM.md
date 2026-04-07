# 巡检宝设计系统规范 v4.0

> **版本**: v4.0.0  
> **更新日期**: 2026-04-07  
> **核心理念**: 专业、简洁、高效、耐疲劳

---

## 目录

1. [设计原则](#设计原则)
2. [色彩系统](#色彩系统)
3. [排版系统](#排版系统)
4. [间距系统](#间距系统)
5. [组件规范](#组件规范)
6. [动画系统](#动画系统)
7. [响应式设计](#响应式设计)
8. [无障碍设计](#无障碍设计)

---

## 设计原则

### 1. 克制的华丽
- 视觉上有特色但不花哨
- 每个视觉元素都有明确目的
- 避免过度装饰和特效

### 2. 功能即形式
- 设计服务于功能
- 信息层次分明
- 交互流程清晰直观

### 3. 上下文感知
- 智能系统理解用户当前任务
- 界面状态反映使用场景
- 渐进式披露信息

### 4. 渐进式披露
- 信息层次分明
- 不一次性展示所有内容
- 根据需要逐步展开

---

## 色彩系统

### 深色主题 (默认)

#### 背景层次 (4层递进)
```css
--canvas: rgb(10 14 20);           /* 最深层：页面背景 */
--surface: rgb(13 17 23);          /* 深：卡片背景 */
--surface-raised: rgb(22 27 34);   /* 提升：悬浮元素 */
--surface-elevated: rgb(28 33 40); /* 更高：菜单/弹窗 */
```

#### 主强调色：科技蓝
```css
--accent: rgb(88 166 255);
--accent-strong: rgb(56 139 253);
--accent-soft: rgb(121 184 255);
```

#### 功能色
```css
--success: rgb(63 185 80);   /* 成功/在线 */
--warning: rgb(210 153 34);   /* 警告/待处理 */
--error: rgb(248 81 73);      /* 错误/离线 */
--info: rgb(88 166 255);      /* 信息 */
```

#### 文字层次
```css
--text-primary: rgb(240 246 252);     /* 主要文字 */
--text-secondary: rgb(139 148 158);   /* 次要文字 */
--text-tertiary: rgb(110 118 129);    /* 辅助文字 */
--text-disabled: rgb(72 79 88);       /* 禁用文字 */
```

#### 边框层次
```css
--border: rgba(255 255 255 / 0.06);
--border-strong: rgba(255 255 255 / 0.10);
--border-hover: rgba(255 255 255 / 0.15);
--border-accent: rgba(88 166 255 / 0.30);
```

### 浅色主题

#### 背景层次
```css
--canvas: rgb(248 250 252);
--surface: rgb(255 255 255);
--surface-raised: rgb(241 245 249);
--surface-elevated: rgb(226 232 240);
```

#### 主强调色
```css
--accent: rgb(79 70 229);
--accent-strong: rgb(67 56 202);
--accent-soft: rgb(99 102 241);
```

#### 功能色
```css
--success: rgb(22 163 74);
--warning: rgb(217 119 6);
--error: rgb(220 38 38);
--info: rgb(37 99 235);
```

---

## 排版系统

### 字体家族
```css
--font-sans: 'Inter Variable', 'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

### 字体大小层级
| 层级 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| xs | 0.75rem (12px) | 1rem | 400 | 辅助文字、标签 |
| sm | 0.875rem (14px) | 1.25rem | 400 | 次要内容 |
| base | 1rem (16px) | 1.5rem | 400 | 正文 |
| lg | 1.125rem (18px) | 1.75rem | 500 | 小标题 |
| xl | 1.25rem (20px) | 1.75rem | 600 | 标题 |
| 2xl | 1.5rem (24px) | 2rem | 600 | 大标题 |
| 3xl | 1.875rem (30px) | 2.25rem | 700 | 页面标题 |

---

## 间距系统

### 基础间距 (基于 4px 网格)
```css
--space-0: 0;
--space-1: 0.25rem (4px);
--space-2: 0.5rem (8px);
--space-3: 0.75rem (12px);
--space-4: 1rem (16px);
--space-5: 1.25rem (20px);
--space-6: 1.5rem (24px);
--space-8: 2rem (32px);
--space-10: 2.5rem (40px);
--space-12: 3rem (48px);
--space-16: 4rem (64px);
```

### 圆角系统 (4档)
```css
--radius-sm: 0.375rem (6px);    /* 微型组件 */
--radius-md: 0.5rem (8px);      /* 小型组件 */
--radius-lg: 0.75rem (12px);    /* 中型组件 */
--radius-xl: 1.25rem (20px);    /* 大型组件 */
--radius-2xl: 1.75rem (28px);   /* 超大组件 */
--radius-full: 9999px;
```

---

## 组件规范

### 按钮 (Button)

#### 变体
- **Primary**: 主要操作，使用 accent 色
- **Secondary**: 次要操作，使用背景色
- **Outline**: 轮廓按钮
- **Ghost**: 幽灵按钮
- **Destructive**: 危险操作

#### 尺寸
- **sm**: 小按钮，高度 32px
- **md**: 中按钮，高度 40px (默认)
- **lg**: 大按钮，高度 48px
- **icon**: 图标按钮，正方形

#### 状态
- Default: 默认状态
- Hover: 悬浮状态 (上移 1px, 增强阴影)
- Active: 点击状态 (缩放 0.98)
- Disabled: 禁用状态 (透明度 0.5)

### 卡片 (Card)

#### 变体
- **Default**: 标准卡片
- **Elevated**: 提升卡片 (更强阴影)
- **Outlined**: 轮廓卡片

#### 结构
```
┌─────────────────────────┐
│  Header (可选)          │
├─────────────────────────┤
│  Body                   │
│                         │
├─────────────────────────┤
│  Footer (可选)          │
└─────────────────────────┘
```

### 输入框 (Input)

#### 状态
- Default: 默认状态
- Hover: 边框颜色加深
- Focus:  accent 边框 + 外发光
- Error: 错误边框 + 错误提示
- Disabled: 禁用状态

---

## 动画系统

### 动画原则

1. **有意义**: 动画帮助用户理解界面
2. **流畅**: 60fps，避免跳动或卡顿
3. **克制**: 不要过度使用动画
4. **一致**: 整个应用使用统一的动效语言

### 时长规范

| 类型 | 时长 | 示例 |
|------|------|------|
| 微交互 | 100-150ms | 按钮点击、悬浮 |
| 标准过渡 | 200-300ms | 页面元素过渡 |
| 页面过渡 | 300-500ms | 路由切换 |
| 大元素动画 | 500ms+ | 模态框、大卡片 |

### 缓动函数

| 类型 | 缓动函数 | 用途 |
|------|---------|------|
| 标准过渡 | cubic-bezier(0.4, 0, 0.2, 1) | 大多数动画 |
| 弹性效果 | cubic-bezier(0.34, 1.56, 0.64, 1) | 进入动画 |
| 进入动画 | cubic-bezier(0, 0, 0.2, 1) | 元素出现 |
| 退出动画 | cubic-bezier(0.4, 0, 1, 1) | 元素消失 |

### 动画组件

项目提供以下 Framer Motion 封装组件：

#### 入场动画
- `FadeIn`: 淡入
- `FadeInUp`: 淡入上滑
- `FadeInDown`: 淡入下滑
- `FadeInLeft`: 淡入左滑
- `FadeInRight`: 淡入右滑
- `ScaleIn`: 缩放淡入

#### 列表动画
- `StaggerContainer`: 交错容器
- `StaggerItem`: 交错子项

#### 交互动画
- `HoverLift`: 悬浮上浮
- `HoverScale`: 悬浮放大
- `TapScale`: 点击缩放

#### 状态动画
- `Pulse`: 脉冲
- `Bounce`: 弹跳
- `SlideIn`: 滑入

### 动画示例

```tsx
// 交错列表动画
<StaggerContainer>
  {items.map((item) => (
    <StaggerItem key={item.id}>
      <HoverLift>
        <TapScale>
          <Card>{item.content}</Card>
        </TapScale>
      </HoverLift>
    </StaggerItem>
  ))}
</StaggerContainer>

// 页面元素入场
<FadeInUp delay={0.1}>
  <MetricTile />
</FadeInUp>
<FadeInUp delay={0.2}>
  <MetricTile />
</FadeInUp>
<FadeInUp delay={0.3}>
  <MetricTile />
</FadeInUp>
```

---

## 响应式设计

### 断点
```css
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
2xl: 1536px /* 超超大屏幕 */
```

### 布局策略

#### 移动端 (< 640px)
- 单列布局
- 隐藏非必要元素
- 增大触控区域 (最小 44px)
- 简化导航

#### 平板端 (640px - 1024px)
- 双列布局
- 侧边栏可折叠
- 优化表格显示

#### 桌面端 (> 1024px)
- 三列或多列布局
- 完整功能展示
- 充分利用屏幕空间

---

## 无障碍设计

### 键盘导航
- 所有交互元素可通过 Tab 键访问
- 清晰的焦点状态 (`:focus-visible`)
- 支持常见快捷键 (Cmd+K, Esc 等)

### 屏幕阅读器
- 语义化 HTML
- ARIA 标签和角色
- 表单标签关联
- 错误信息可访问

### 色彩对比度
- 文字对比度 ≥ 4.5:1 (AA 标准)
- 大文字对比度 ≥ 3:1
- 不依赖颜色传达信息

### 减少动画
- 尊重 `prefers-reduced-motion` 设置
- 提供禁用动画选项

---

## 设计资源

### Figma 组件库
(待补充)

### 图标库
- Lucide React (主要使用)
- 统一 24px 网格
- 线条粗细 2px

### 图片资源
- 使用真实场景图片
- 占位图使用 Unsplash 或本地资源
- 图片优化: WebP 格式，适当压缩

---

## 更新日志

### v4.0.0 (2026-04-07)
- 完整重写设计系统
- 添加深色/浅色双主题
- 建立完整的色彩、排版、间距规范
- 添加 Framer Motion 动画系统
- 完善无障碍设计规范

---

**最后更新**: 2026-04-07  
**维护者**: 设计团队
