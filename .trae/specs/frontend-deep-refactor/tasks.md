# 前端深度重构任务清单

## 阶段一：设计系统重构 ✅

### Task 1.1: 重构全局样式系统 ✅
- [x] 更新 tailwind.config.js (颜色、圆角、阴影、字体)
- [x] 重构 index.css (CSS 变量、基础样式)
- [x] 更新 design tokens (色彩、间距、圆角)

**详细步骤**：
1. 修改 tailwind.config.js 中的 colors 配置
2. 更新 borderRadius 为 8/12/16px 三级
3. 简化 boxShadow 为两层
4. 重构 index.css 中的 CSS 变量
5. 更新字体配置

### Task 1.2: 重构基础组件 ✅
- [x] 重构 Button 组件 (极简风格)
- [x] 重构 Card 组件 (统一圆角和边框)
- [x] 重构 Badge/StatusPill 组件
- [x] 重构 Input 组件

**详细步骤**：
1. 简化 Button 变体，移除复杂样式
2. 统一 Card 圆角为 12px
3. 简化 Badge 样式
4. 更新 Input 聚焦样式

### Task 1.3: 创建新的 Pattern 组件 ✅
- [x] 创建 ListItem 组件 (统一列表项)
- [x] 创建 MetricTile 组件 (关键指标卡片)
- [x] 创建 DetailPanel 组件 (详情面板)
- [x] 创建 WorkspaceLayout 组件 (三栏布局)

**详细步骤**：
1. 设计 ListItem API (icon, title, description, tags, status)
2. 设计 MetricTile API (label, value, helper, trend)
3. 设计 DetailPanel API (title, children, onClose)
4. 设计 WorkspaceLayout API (leftPanel, mainContent, rightPanel)

## 阶段二：布局重构 ✅

### Task 2.1: 重构 Layout 组件 ✅
- [x] 简化侧边栏设计
- [x] 添加侧边栏折叠功能
- [x] 重构头部设计
- [x] 优化整体布局结构

**详细步骤**：
1. 简化 Sidebar 样式，移除复杂装饰
2. 添加 collapse/expand 功能
3. 重构 Header，减少视觉层级
4. 优化 main content 区域

### Task 2.2: 重构 Context Action Strip ✅
- [x] 简化 ContextActionStrip 设计
- [x] 统一所有页面的操作栏
- [x] 优化按钮布局

**详细步骤**：
1. 简化背景样式
2. 统一按钮样式
3. 优化标题和描述排版

### Task 2.3: 创建 Workspace 模板 ✅
- [x] 创建 WorkspaceShell 组件
- [x] 统一三栏布局
- [x] 添加响应式适配

**详细步骤**：
1. 设计 WorkspaceShell 结构
2. 实现可折叠的左右面板
3. 添加移动端适配

## 阶段三：页面重构 ✅

### Task 3.1: 重构 Center 页面 (监控中枢) ✅
- [x] 简化布局结构
- [x] 重构视频流展示
- [x] 添加告警面板 (从 Alerts 合并)
- [x] 优化右侧上下文面板

**详细步骤**：
1. 简化三栏布局
2. 重构 StreamGrid 组件
3. 将 Alerts 整合为右侧面板
4. 优化选中态展示

### Task 3.2: 重构 Media 页面 (媒体库) ✅
- [x] 移除 library/defect 双模式
- [x] 统一为缺陷案例工作流
- [x] 简化案例列表展示
- [x] 重构证据板

**详细步骤**：
1. 移除 mode 切换逻辑
2. 简化案例列表
3. 重构证据展示
4. 优化报告草稿区域

### Task 3.3: 重构 Tasks 页面 (任务协同) ✅
- [x] 应用新的 ListItem 组件
- [x] 简化任务列表
- [x] 优化详情面板
- [x] 添加强化关联展示

**详细步骤**：
1. 替换任务列表为 ListItem
2. 简化任务卡片样式
3. 优化详情面板布局
4. 添加来源对象关联

### Task 3.4: 重构 Assets 页面 (资产设备) ✅
- [x] 应用新的 ListItem 组件
- [x] 添加健康度可视化
- [x] 优化设备详情展示
- [x] 简化诊断信息

**详细步骤**：
1. 替换设备列表为 ListItem
2. 添加健康度进度条
3. 优化详情面板
4. 简化诊断摘要

### Task 3.5: 移除 Alerts 独立页面 ✅
- [x] 将 Alerts 功能合并到 Center
- [x] 更新路由配置
- [x] 移除 AlertsWorkspace 组件

**详细步骤**：
1. 在 Center 页面添加告警面板
2. 更新 router.tsx 移除 alerts 路由
3. 删除 AlertsWorkspace.tsx
4. 更新导航配置

## 阶段四：动效优化 ✅

### Task 4.1: 统一入场动画 ✅
- [x] 创建 FadeIn 动画组件
- [x] 创建 StaggerContainer 组件
- [x] 应用动画到所有页面

**详细步骤**：
1. 设计 FadeIn 组件 (opacity + translateY)
2. 设计 StaggerContainer 组件
3. 应用到页面和列表

### Task 4.2: 优化交互动效 ✅
- [x] 统一悬浮效果
- [x] 统一点击反馈
- [x] 优化状态切换动画

**详细步骤**：
1. 设计 hover 样式规范
2. 添加 active/pressed 状态
3. 优化过渡时间

### Task 4.3: 添加骨架屏 ✅
- [x] 创建 Skeleton 组件
- [x] 创建 SkeletonCard, SkeletonListItem, SkeletonDetailPanel 变体
- [x] 应用到数据加载场景

**详细步骤**：
1. 设计 Skeleton 样式
2. 创建 SkeletonCard, SkeletonList 变体
3. 替换现有 loading 状态

## 阶段五：测试验证 ✅

### Task 5.1: 功能回归测试 ✅
- [x] 测试所有页面功能
- [x] 测试路由跳转
- [x] 测试响应式布局

### Task 5.2: 视觉一致性检查 ✅
- [x] 检查色彩一致性
- [x] 检查圆角一致性
- [x] 检查间距一致性

### Task 5.3: 性能测试 ✅
- [x] 测试首屏加载时间
- [x] 测试动画流畅度
- [x] 测试内存占用

# 任务依赖关系

```
阶段一 (设计系统) ✅
  ├── Task 1.1 (全局样式) ✅
  ├── Task 1.2 (基础组件) ✅
  └── Task 1.3 (Pattern组件) ✅

阶段二 (布局重构) ✅
  ├── Task 2.1 (Layout) ✅
  ├── Task 2.2 (Action Strip) ✅
  └── Task 2.3 (Workspace模板) ✅

阶段三 (页面重构) ✅
  ├── Task 3.1 (Center) ✅
  ├── Task 3.2 (Media) ✅
  ├── Task 3.3 (Tasks) ✅
  ├── Task 3.4 (Assets) ✅
  └── Task 3.5 (移除Alerts) ✅

阶段四 (动效优化) ✅
  ├── Task 4.1 (入场动画) ✅
  ├── Task 4.2 (交互动效) ✅
  └── Task 4.3 (骨架屏) ✅

阶段五 (测试验证) ✅
```

# 重构成果总结

## 设计系统
- ✅ 极简深色主题：三层背景色 (#0a0c10 → #111318 → #1a1d24)
- ✅ 统一圆角系统：8px / 12px / 16px
- ✅ 精简阴影：仅两层 (默认 + 悬浮)
- ✅ 低饱和科技蓝主色调 (#5B82D8)

## 组件库
- ✅ Button: 极简风格，4种变体
- ✅ Card: 统一圆角 12px
- ✅ Badge: 简洁标签样式
- ✅ Input: 极简输入框
- ✅ ListItem: 统一列表项组件
- ✅ MetricTile: 关键指标卡片
- ✅ DetailPanel: 详情面板组件
- ✅ WorkspaceLayout: 三栏布局组件

## 页面重构
- ✅ Center: 监控中枢，整合告警功能
- ✅ Media: 缺陷管理，统一工作流
- ✅ Tasks: 任务协同，看板视图
- ✅ Assets: 资产设备，健康度可视化

## 动效系统
- ✅ FadeIn: 淡入动画组件
- ✅ StaggerContainer: 交错动画容器
- ✅ Skeleton: 骨架屏组件

## 路由优化
- ✅ 移除独立 Alerts 页面
- ✅ 告警功能整合到 Center
- ✅ 简化路由配置
