---
name: 巡检宝Logo整合方案
overview: 将新设计的Logo整合到巡检宝项目中，包括文件存放位置、加载页面设计和动画效果，确保与"精密秩序"设计系统风格统一
design:
  architecture:
    framework: react
  styleKeywords:
    - 极简主义
    - 精密秩序
    - 力量感
    - 克制
    - 科技感
    - 流畅动画
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 14px
      weight: 400
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#58A6FF"
      - "#0969DA"
    background:
      - "#0D1117"
      - "#1E2228"
      - "#F5F7FA"
    text:
      - "#E6EDF3"
      - "#E8EDF2"
      - "#1F2328"
    functional:
      - "#58A6FF"
      - "#3FB950"
      - "#F85149"
todos:
  - id: explore-logo-refs
    content: 使用[subagent:code-explorer]探索项目中现有Logo引用位置
    status: completed
  - id: copy-logo-files
    content: 将新Logo文件复制到frontend/public/logo/标准目录
    status: completed
    dependencies:
      - explore-logo-refs
  - id: generate-logo-variants
    content: 使用[skill:canvas-design]生成各主题适配的Logo变体（反白/标准）
    status: completed
  - id: create-splash-component
    content: 使用[skill:frontend-dev]创建SplashScreen加载页组件
    status: completed
    dependencies:
      - copy-logo-files
      - generate-logo-variants
  - id: implement-logo-animation
    content: 实现Logo入场/呼吸/完成动画序列
    status: completed
    dependencies:
      - create-splash-component
  - id: implement-progress-bar
    content: 实现主题感知的进度条组件
    status: completed
    dependencies:
      - create-splash-component
  - id: integrate-to-app
    content: 将加载页集成到App入口，与数据加载逻辑绑定
    status: completed
    dependencies:
      - implement-logo-animation
      - implement-progress-bar
  - id: update-manifest
    content: 更新PWA manifest.json和index.html中的图标引用
    status: completed
    dependencies:
      - copy-logo-files
  - id: test-theme-switch
    content: 测试三档主题下加载页的显示效果
    status: completed
    dependencies:
      - integrate-to-app
---

## 需求概述

将新设计的巡检宝Logo（线宽32px、中心点40px的双环对称设计）整合到产品中，包括：

1. Logo文件标准化存放位置设计
2. 加载页面（Splash Screen）设计与实现
3. 加载动画设计（符合"精密秩序"设计系统）
4. 确保与整体UI风格统一，支持深色/浅色主题自适应

## 核心要求

- Logo存放：符合前端项目标准，支持多主题切换
- 加载页：体现"精密·秩序·力量·克制"品牌调性
- 动画：流畅克制，符合设计系统动效规范（150-300ms过渡，cubic-bezier缓动）
- 主题适配：完美适配深境/均衡/清境三档主题

## 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **样式方案**: Tailwind CSS + CSS Variables
- **状态管理**: Redux + React Context（主题）
- **动画**: CSS Animations + Framer Motion（可选）

## 实现策略

### 1. Logo文件组织

采用分层目录结构，按用途和主题分类：

```
frontend/public/
├── logo/
│   ├── favicon/          # 浏览器图标
│   ├── app-icon/         # PWA/App图标
│   ├── brand/            # 品牌展示用
│   └── ui/               # UI组件用（多尺寸）
└── manifest.json         # PWA配置更新
```

### 2. 加载页架构

- **组件位置**: `frontend/src/components/SplashScreen/`
- **显示时机**: App初始化时，数据加载完成后淡出
- **技术实现**: Portal渲染 + CSS动画 + 主题感知

### 3. 动画设计原则

遵循设计系统动效规范：

- 时长: 200-300ms（标准过渡）
- 缓动: `cubic-bezier(0.4, 0, 0.2, 1)`
- 效果: Logo缩放 + 淡出 + 进度指示

### 4. 主题适配方案

利用现有CSS Variables系统，通过`data-theme`属性切换：

- 深境/均衡模式: 使用反白Logo
- 清境模式: 使用标准黑线Logo

## 加载页视觉设计

### 整体风格

延续"Precision Order · 精密秩序"设计哲学，加载页呈现极简、专业、有力的视觉感受。

### 页面结构

```
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────────┐             │
│         │   Logo      │  ← 双环    │
│         │  (动画)     │    对称    │
│         └─────────────┘             │
│                                     │
│         巡检宝                       │
│    智能监控平台                      │
│                                     │
│    ████████░░░░  加载中...          │
│    ↑ 进度条（品牌蓝）                │
│                                     │
└─────────────────────────────────────┘
```

### 动画设计

**Logo动画序列**:

1. **入场** (0-400ms): 从0.8缩放到1.0，透明度0→1，ease-out
2. **呼吸** (400-2000ms): 轻微缩放1.0→1.02→1.0，循环2次
3. **完成** (2000ms+): 快速放大1.0→1.1并淡出，ease-in

**进度条动画**:

- 宽度从0%到100%，与数据加载同步
- 使用品牌强调色 `#58A6FF`
- 微光效果增强科技感

### 主题适配

| 主题 | 背景色 | Logo版本 | 文字色 | 进度条 |
| --- | --- | --- | --- | --- |
| 深境 | `#0D1117` | 反白 | `#E6EDF3` | `#58A6FF` |
| 均衡 | `#1E2228` | 反白 | `#E8EDF2` | `#58A6FF` |
| 清境 | `#F5F7FA` | 标准黑 | `#1F2328` | `#0969DA` |


## Agent Extensions

### Skill

- **frontend-dev**: 前端组件开发、样式实现、动画编码
- Purpose: 实现SplashScreen组件、CSS动画、主题适配逻辑
- Expected outcome: 完整的加载页组件，符合设计规范

- **canvas-design（视觉设计）**: 生成Logo各主题版本、加载页背景素材
- Purpose: 创建反白Logo、适配各主题的Logo变体
- Expected outcome: 全套Logo资源文件（PNG/SVG）

### SubAgent

- **code-explorer**: 探索前端项目结构，定位现有Logo引用位置
- Purpose: 查找所有需要替换Logo的文件位置
- Expected outcome: 完整的Logo引用清单和替换方案