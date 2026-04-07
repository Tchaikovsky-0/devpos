# 巡检宝 - 响应式布局优化计划

> 日期: 2026-04-05
> 目标: 让软件随窗口大小灵活布局，覆盖从 768px 平板到 2560px 超宽屏

---

## 问题诊断

经过全面扫描，当前布局存在 **3 大类共性问题**，影响 8 个页面：

### 问题一：侧边栏断点过高（4 个页面）
TasksWorkspace / AssetsWorkspace / OpenClawWorkspace / SystemWorkspace 的右侧面板只在 `2xl`(1536px) 才出现。主流笔记本(1366-1440px)的用户永远看不到侧面板。

### 问题二：统计卡片过早展开多列（3 个页面）
Media / Reports / OpenClaw 在 `md`(768px) 就展开 4 列，每列仅 ~180px，文字溢出。

### 问题三：中等屏幕(768-1280px)布局空白（所有页面）
`lg` 到 `xl` 之间(1024-1280px)几乎所有页面仍为单列堆叠，大量留白浪费。

---

## 改动方案

### 原则
1. **渐进式响应**: sm→md→lg→xl→2xl 每个断点都有合理的布局变化
2. **最小改动**: 只改 CSS 类名，不改组件结构和逻辑
3. **统一模式**: 所有 Workspace 页面采用统一的断点策略

### 统一断点策略

```
<768px (移动端):     单列堆叠，统计 2 列
768-1023px (平板):   统计 2-3 列，主内容 + 面板仍堆叠
1024-1279px (lg):    统计 3-4 列，主内容 + 侧面板双栏
1280-1535px (xl):    侧面板加宽，三栏布局（如适用）
≥1536px (2xl):       最优布局，面板最宽
```

---

## 具体改动清单

### 1. Layout.tsx（全局布局框架）
- 侧边栏 `md:w-16` → 保持不变（64px 在平板以上足够窄）
- 头部标题行 `lg:flex-row` → `md:flex-row`（更早水平排列，减少垂直占用）

### 2. Center.tsx（监控中枢）
- 主体双栏 `xl:grid-cols-[minmax(0,1fr)_320px]` → `lg:grid-cols-[minmax(0,1fr)_300px]`
- 2xl 保持 360px
- 画面列表+Grid `lg:grid-cols-[200px_minmax(0,1fr)]` → `md:grid-cols-[180px_minmax(0,1fr)]`

### 3. Media.tsx（媒体库+缺陷工作台）
- 统计卡片 `md:grid-cols-4` → `md:grid-cols-2 xl:grid-cols-4`
- 工作台三栏 `xl:grid-cols-[260px_...]` → `lg:grid-cols-[240px_minmax(0,1fr)_280px]`
- 审计双栏 `xl:grid-cols-[320px_...]` → `lg:grid-cols-[280px_minmax(0,1fr)]`
- 时间范围 `grid-cols-3` → `grid-cols-2 md:grid-cols-3`

### 4. AlertsWorkspace.tsx（告警工作台）
- 主体双栏 `xl:grid-cols-[...] ` → `lg:grid-cols-[minmax(0,1fr)_300px]`

### 5. TasksWorkspace.tsx（任务工作台）
- 主体双栏 `2xl:grid-cols-[...]` → `lg:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_360px]`

### 6. AssetsWorkspace.tsx（资产工作台）
- 同 TasksWorkspace: `2xl:` → `lg:` + `2xl:`

### 7. OpenClawWorkspace.tsx（AI 对话）
- 统计卡片 `md:grid-cols-4` → `md:grid-cols-2 xl:grid-cols-4`
- 主体双栏 `2xl:grid-cols-[...]` → `lg:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_360px]`

### 8. SystemWorkspace.tsx（系统设置）
- 主体双栏 `2xl:grid-cols-[...]` → `lg:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_360px]`

### 9. Reports.tsx（报告页面）
- 统计卡片 `md:grid-cols-4` → `md:grid-cols-2 xl:grid-cols-4`

---

## 实施顺序

```
1. Layout.tsx（全局框架）
2. 4 个简单 Workspace 页面（Tasks/Assets/System/Alerts）— 统一断点策略
3. Reports.tsx（统计卡片断点）
4. Center.tsx（双栏断点下调）
5. Media.tsx（最复杂：三栏 + 统计 + 时间范围）
6. OpenClawWorkspace.tsx（统计卡片 + 双栏）
7. pnpm build + pnpm test:run 验证
```

## 验证方式

- `pnpm build` 编译通过
- `pnpm test:run` 测试通过
- 浏览器手动检查：在 DevTools 中切换 768px / 1024px / 1280px / 1536px 四个宽度
