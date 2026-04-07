---
name: core-pages-ui-polish
overview: 基于「深空指挥台」视觉设计哲学，对监控中枢、告警处置、媒体库三大核心页面进行精细打磨：统一设计系统、优化组件一致性、提升视觉层次感。
design:
  architecture:
    framework: react
  styleKeywords:
    - Deep Space Command
    - Dark Tech
    - High Information Density
    - Subtle Glow
    - Precision Craftsmanship
  fontSystem:
    fontFamily: Inter, Noto Sans SC
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#58a6ff"
      - "#79c0ff"
      - "#1f6feb"
    background:
      - "#0d1117"
      - "#161b22"
      - "#21262d"
    text:
      - "#f0f6fc"
      - "#8b949e"
      - "#6e7681"
    functional:
      - "#3fb950"
      - "#d29922"
      - "#f85149"
todos:
  - id: fix-design-system
    content: 使用 [skill:canvas-design] 指导，合并 CSS 变量为单一真相源，统一圆角和色彩系统
    status: completed
  - id: unify-components
    content: 提取 FilterPill 组件，统一 Button、ListItem、DetailPanel 圆角和样式
    status: completed
    dependencies:
      - fix-design-system
  - id: upgrade-center
    content: 使用 [subagent:code-explorer] 分析后，升级监控中枢页面视觉
    status: completed
    dependencies:
      - unify-components
  - id: upgrade-alerts
    content: 升级告警处置页面，优化事件列表和详情面板
    status: completed
    dependencies:
      - unify-components
  - id: upgrade-media
    content: 简化 Media.tsx，统一三种模式的卡片样式
    status: completed
    dependencies:
      - unify-components
  - id: verify-consistency
    content: 验证三大页面视觉一致性，检查无硬编码值残留
    status: completed
    dependencies:
      - upgrade-center
      - upgrade-alerts
      - upgrade-media
---

## 产品概述

巡检宝前端 UI 升级 - 聚焦三大核心页面（监控中枢、告警处置、媒体库）的视觉设计打磨，采用「深空指挥台」设计哲学。

## 核心功能

- 统一设计系统：修复 CSS 变量冲突、圆角混乱、缺失 danger 色值
- 组件模式统一：筛选按钮、列表项、面板样式标准化
- 三大页面视觉升级：监控中枢、告警处置、媒体库的卡片层次、信息密度、交互反馈优化
- 保持深色科技监控台风格，强调色统一为科技蓝

## Tech Stack

- 前端框架: React 18 + TypeScript
- 样式方案: Tailwind CSS + CSS Variables
- 组件库: 自建组件系统 (CVA + Radix UI)
- 构建工具: Vite

## 实现策略

1. **设计系统层**: 合并 index.css 和 design-system.css 为单一真相源，统一 5 档圆角系统，补全 danger 颜色映射
2. **组件层**: 提取 FilterPill、ListItem、DetailPanel 等统一组件，消除 5 种按钮实现方式
3. **页面层**: 逐页应用新设计系统，优化卡片层次、信息密度、视觉反馈

## 架构设计

```
设计系统层 (index.css + tailwind.config.js)
    ↓
组件基元层 (WorkspacePrimitives.tsx + Button.tsx + 新增 FilterPill.tsx)
    ↓
页面实现层 (Center.tsx / AlertsWorkspace.tsx / Media.tsx)
```

## 关键实现细节

- 圆角统一: 6px(sm) / 8px(md) / 12px(lg) / 20px(xl) / 28px(2xl)
- 色彩系统: 极深蓝灰 canvas `#0d1117`，科技蓝 accent `#58a6ff`，告警红 danger `#f85149`
- 阴影系统: 三层（环境光/悬浮/聚焦辉光）
- 网格系统: 8px 基础网格

## 目录结构变更

```
frontend/src/
├── index.css                    # [MODIFY] 合并设计系统变量，统一为单一真相源
├── tailwind.config.js           # [MODIFY] 补全 danger 颜色，统一圆角配置
├── components/ui/
│   ├── Button.tsx               # [MODIFY] 统一圆角到设计系统
│   └── FilterPill.tsx           # [NEW] 统一筛选按钮组件
├── components/workspace/
│   ├── WorkspacePrimitives.tsx  # [MODIFY] 统一圆角，优化 ListItem/DetailPanel
│   └── Workbench.tsx            # [MODIFY] 统一圆角系统
└── routes/
    ├── Center.tsx               # [MODIFY] 应用新设计系统，优化视频网格和画面列表
    ├── AlertsWorkspace.tsx      # [MODIFY] 应用新设计系统，优化事件列表和详情面板
    └── Media.tsx                # [MODIFY] 简化代码，统一三种模式的卡片样式
```

## 设计风格：深空指挥台 (Deep Space Command)

### 设计理念

面向重工业监控场景的深色科技风格，强调信息密度与操作效率的平衡。通过深邃的暗色背景减少视觉疲劳，科技蓝强调色引导注意力，三层阴影系统构建清晰的空间层次。

### 空间与层次

- **背景层**: 极深蓝灰 `#0d1117` 作为画布，营造深邃的监控台氛围
- **表面层**: 悬浮卡片使用微妙的边框和阴影，创造层次感
- **强调层**: 科技蓝 `#58a6ff` 用于交互元素和重要信息，告警红 `#f85149` 用于紧急状态

### 色彩系统

- **主背景**: `#0d1117` (canvas) / `#161b22` (surface)
- **强调色**: `#58a6ff` (accent) / `#79c0ff` (accent-hover)
- **功能色**: `#3fb950` (success) / `#d29922` (warning) / `#f85149` (danger)
- **文字色**: `#f0f6fc` (primary) / `#8b949e` (secondary) / `#6e7681` (tertiary)
- **边框色**: `rgba(255,255,255,0.08)` (border) / `rgba(255,255,255,0.15)` (border-hover)

### 圆角系统

- **sm**: 6px - 标签、小按钮
- **md**: 8px - 标准按钮、输入框
- **lg**: 12px - 卡片、面板
- **xl**: 20px - 大面板、模态框
- **2xl**: 28px - 超大容器

### 阴影系统

- **环境光**: `0 1px 2px rgba(0,0,0,0.3)` - 基础层次
- **悬浮**: `0 8px 24px rgba(0,0,0,0.4)` - 悬浮状态
- **聚焦辉光**: `0 0 20px rgba(88,166,255,0.15)` - 选中/聚焦状态

### 交互反馈

- 按钮悬停: 轻微上移 + 阴影增强
- 卡片悬停: 边框高亮 + 微妙发光
- 选中状态: 科技蓝背景 + 辉光阴影

## Agent Extensions

### Skill

- **canvas-design（视觉设计）**
- Purpose: 提供「深空指挥台」设计哲学指导，确保视觉一致性和专业级设计质量
- Expected outcome: 设计系统文档和视觉参考

### SubAgent

- **code-explorer**
- Purpose: 在修改前深度探索三大核心页面的代码结构，确保变更的完整性和准确性
- Expected outcome: 详细的代码分析报告，包括所有需要修改的样式和组件位置