# 巡检宝 UI 重构任务清单

> **版本**: v1.0
> **更新日期**: 2026-04-04
> **状态**: Phase 1 & Phase 2 ✅ 已完成

---

## 一、设计系统重构 ✅

### 1.1 Tailwind 配置升级

- [x] 更新 `tailwind.config.js`，添加完整的色彩系统
  - [x] 背景层次（5层）
  - [x] 主色调（科技蓝）
  - [x] 功能色（成功、警告、错误、信息）
  - [x] 文字层次（3层）
  - [x] 边框层次（4层）

- [x] 添加渐变系统配置
  - [x] 背景渐变
  - [x] 强调渐变
  - [x] 玻璃拟态渐变

- [x] 添加圆角系统
  - [x] 6种圆角尺寸（sm/md/lg/xl/2xl/full）

- [x] 添加阴影系统
  - [x] 4种阴影层次
  - [x] 悬浮阴影
  - [x] 光晕效果

- [x] 添加间距系统
  - [x] 标准化间距（基于4px）

### 1.2 全局 CSS 变量

- [x] 创建 `src/styles/globals.css` 文件
  - [x] CSS 变量定义（5层背景、科技蓝、功能色、文字层次、边框层次）
  - [x] 字体配置（Inter + Noto Sans SC）
  - [x] 动画关键帧
  - [x] 响应式断点

- [x] 更新 `index.css`
  - [x] 导入全局变量
  - [x] 基础样式重置
  - [x] 滚动条样式

### 1.3 动效系统

- [x] 创建 `src/styles/animations.css`
  - [x] 入场动画（fadeInUp, fadeIn, fadeInDown, fadeInLeft, fadeInRight, fadeInScale）
  - [x] 悬浮动画（hoverLift, hoverScale, hoverGlow）
  - [x] 脉冲动画（pulse, pulseFast, glowPulse）
  - [x] 发光动画（glow）
  - [x] 骨架屏动画（shimmer）
  - [x] 交互动画（tapScale, ripple）
  - [x] 特殊效果（blink, borderGlow, scanLine, countUp）

- [ ] 配置 Framer Motion
  - [ ] 安装 framer-motion
  - [ ] 创建动画变体配置
  - [ ] 创建自定义 Hooks

---

## 二、基础组件重构 ✅

### 2.1 按钮组件（Button） ✅

- [x] 创建 `components/ui/Button.tsx`
  - [x] 主要按钮（primary）
  - [x] 次要按钮（secondary）
  - [x] 幽灵按钮（ghost）
  - [x] 危险按钮（danger）
  - [x] 成功按钮（success）
  - [x] 轮廓按钮（outline）
  - [x] 加载状态
  - [x] 禁用状态

- [x] 组件特性
  - [x] 渐变背景 + 微光效果
  - [x] 悬浮上浮动画
  - [x] 点击缩放效果
  - [x] 5种尺寸（xs/sm/md/lg/xl）
  - [x] 图标支持
  - [x] 图标位置（left/right）

### 2.2 卡片组件（Card） ✅

- [x] 创建 `components/ui/Card.tsx`
  - [x] 标准卡片（standard）
  - [x] 玻璃卡片（glass）
  - [x] 强调卡片（accent）
  - [x] 可交互卡片（interactive）
  - [x] CardHeader, CardTitle, CardContent, CardFooter 子组件

- [x] 组件特性
  - [x] 悬浮边框变亮
  - [x] 悬浮阴影增强
  - [x] 悬浮上浮动画
  - [x] 动画包装器支持
  - [x] 4种内边距选项

### 2.3 输入框组件（Input） ✅

- [x] 创建 `components/ui/Input.tsx`
  - [x] 默认样式（default）
  - [x] 填充样式（filled）
  - [x] 轮廓样式（outline）
  - [x] 玻璃样式（glass）
  - [x] SearchInput 搜索输入框组件

- [x] 组件特性
  - [x] 聚焦发光效果
  - [x] 悬浮边框变化
  - [x] 错误状态
  - [x] 前缀/后缀图标
  - [x] 标签和提示文本
  - [x] 3种尺寸（sm/md/lg）

### 2.4 导航组件 ✅

- [x] 重构 `components/Layout.tsx`
  - [x] 新的侧边栏设计
  - [x] Logo 区域（带渐变背景）
  - [x] 导航项动画（图标缩放）
  - [x] 激活状态指示（左侧边框 + 背景色）

- [x] 简化导航结构
  - [x] 从 11 个入口收敛到 4 个核心入口（监控中心、AI助手、告警中心、资产管理）
  - [x] 添加徽章支持（告警数量）
  - [ ] 移动端响应式处理（待后续优化）

- [ ] 创建子菜单组件
  - [ ] 支持展开/折叠
  - [ ] 动画过渡

### 2.5 状态指示器 ✅

- [x] 创建 `components/ui/StatusIndicator.tsx`
  - [x] 在线状态（绿色脉冲 + 光晕）
  - [x] 离线状态（灰色）
  - [x] 告警状态（红色脉冲 + 光晕）
  - [x] 警告状态（黄色脉冲 + 光晕）
  - [x] 待处理状态（蓝色光晕）

- [x] 组件特性
  - [x] 3种尺寸（sm/md/lg）
  - [x] 可选标签显示
  - [x] 可控脉冲动画
  - [x] 光晕效果

### 2.6 UI 组件导出索引 ✅

- [x] 创建 `components/ui/index.ts`
  - [x] 导出 Button 组件
  - [x] 导出 Card 相关组件
  - [x] 导出 Input 相关组件
  - [x] 导出 StatusIndicator 组件
  - [x] 导出类型定义

---

## 三、核心页面重构

### 3.1 监控中心（Monitor Hub）

- [ ] 重构 `routes/Dashboard.tsx`
  - [ ] 新的统计卡片布局
  - [ ] 设备列表组件
  - [ ] 实时数据展示
  - [ ] 告警列表组件

- [ ] 重构 `routes/Monitor.tsx`
  - [ ] 新的视频墙设计
  - [ ] 布局切换器
  - [ ] 全屏播放
  - [ ] 设备状态指示

- [ ] 优化动效
  - [ ] 入场动画
  - [ ] 悬浮交互
  - [ ] 实时数据更新动画

### 3.2 AI 助手（AI Copilot）

- [ ] 重构 `routes/AICenter.tsx`
  - [ ] 新的对话界面
  - [ ] 快捷操作卡片
  - [ ] 上下文展示
  - [ ] 多模态输入

- [ ] 优化对话体验
  - [ ] 消息动画
  - [ ] 加载状态
  - [ ] 打字机效果

### 3.3 告警中心（Alert Center）

- [ ] 重构 `routes/AlertCenter.tsx`
  - [ ] 新的告警列表设计
  - [ ] 级别筛选
  - [ ] 状态管理
  - [ ] 快速处理操作

- [ ] 添加新功能
  - [ ] 工作流看板
  - [ ] SLA 倒计时
  - [ ] 根因分析入口

### 3.4 资产管理（Asset Management）

- [ ] 重构 `routes/Settings.tsx`
  - [ ] 设备拓扑图
  - [ ] 健康度评分
  - [ ] 用户权限管理
  - [ ] 系统设置

---

## 四、高级组件

### 4.1 数据可视化

- [ ] 创建 `components/ui/DataCard.tsx`
  - [ ] 统计数字卡片
  - [ ] 趋势指示器
  - [ ] 实时数据脉冲

- [ ] 创建 `components/ui/Chart.tsx`
  - [ ] 折线图
  - [ ] 柱状图
  - [ ] 饼图
  - [ ] 深色主题配色

### 4.2 容器组件

- [ ] 创建 `components/ui/Panel.tsx`
  - [ ] 面板容器
  - [ ] 标题栏
  - [ ] 操作按钮

- [ ] 创建 `components/ui/Modal.tsx`
  - [ ] 模态框
  - [ ] 侧边抽屉
  - [ ] 动画过渡

### 4.3 加载组件

- [ ] 创建 `components/ui/Skeleton.tsx`
  - [ ] 骨架屏
  - [ ] 骨架卡片
  - [ ] 骨架文本

- [ ] 创建 `components/ui/Spinner.tsx`
  - [ ] 加载动画
  - [ ] 进度条

---

## 五、性能优化

### 5.1 代码分割

- [ ] 路由级代码分割
  - [ ] 使用 React.lazy
  - [ ] 预加载关键路由

- [ ] 组件级代码分割
  - [ ] 图表组件懒加载
  - [ ] 编辑器组件懒加载

### 5.2 渲染优化

- [ ] React.memo 应用
  - [ ] 卡片组件
  - [ ] 列表项组件

- [ ] useMemo/useCallback
  - [ ] 复杂计算
  - [ ] 回调函数

### 5.3 资源优化

- [ ] 图片优化
  - [ ] 懒加载
  - [ ] WebP 格式

- [ ] 图标优化
  - [ ] 按需导入
  - [ ] SVG 优化

---

## 六、响应式适配

### 6.1 断点适配

- [ ] 移动端（< 768px）
  - [ ] 侧边栏折叠
  - [ ] 视频网格调整
  - [ ] 触摸优化

- [ ] 平板端（768px - 1024px）
  - [ ] 侧边栏收窄
  - [ ] 两栏布局

- [ ] 桌面端（> 1024px）
  - [ ] 完整布局

### 6.2 适配测试

- [ ] 浏览器测试
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

- [ ] 设备测试
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] iPad
  - [ ] 笔记本

---

## 七、质量保证

### 7.1 代码质量

- [ ] ESLint 配置
  - [ ] React 插件
  - [ ] TypeScript 规则
  - [ ] Tailwind 插件

- [ ] Prettier 配置
  - [ ] 格式化规则
  - [ ] Git Hook

### 7.2 类型安全

- [ ] TypeScript 严格模式
  - [ ] 无 any 类型
  - [ ] 完整类型定义

- [ ] 组件 Props 类型
  - [ ] 接口定义
  - [ ] 泛型应用

### 7.3 可访问性

- [ ] 语义化 HTML
- [ ] ARIA 标签
- [ ] 键盘导航
- [ ] 焦点管理
- [ ] 颜色对比度

---

## 八、文档与规范

### 8.1 组件文档

- [ ] Storybook 集成
  - [ ] 基础组件
  - [ ] 高级组件
  - [ ] 页面模板

- [ ] README 编写
  - [ ] 组件使用说明
  - [ ] Props 文档
  - [ ] 示例代码

### 8.2 设计规范

- [ ] 设计令牌文档
- [ ] 组件规范文档
- [ ] 动效规范文档

---

## 完成进度

**Phase 1 - 设计系统重构**: ✅ 已完成
**Phase 2 - 基础组件重构**: ✅ 已完成

**当前完成**: 35/89 项任务 (39%)
**预计周期**: 4-5 周
**已完成周期**: 1 周

---

## 已创建的文件

1. `frontend/tailwind.config.js` - 完整的 Tailwind 配置（256行）
2. `frontend/src/styles/globals.css` - 全局 CSS 变量（358行）
3. `frontend/src/styles/animations.css` - 动效系统（520行）
4. `frontend/src/components/ui/Button.tsx` - 按钮组件（110行）
5. `frontend/src/components/ui/Card.tsx` - 卡片组件（148行）
6. `frontend/src/components/ui/Input.tsx` - 输入框组件（114行）
7. `frontend/src/components/ui/StatusIndicator.tsx` - 状态指示器（98行）
8. `frontend/src/components/ui/index.ts` - UI 组件导出（11行）
9. `frontend/src/components/Layout.tsx` - 导航组件重构（143行）
10. `frontend/src/index.css` - 入口样式（34行）

**总计**: 10 个文件，约 1,793 行代码

---

**核心理念**: 华丽而不浮夸，用克制的精致诠释专业。
**下一步**: Phase 3 - 核心页面重构
