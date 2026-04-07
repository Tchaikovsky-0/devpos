# 巡检宝 (xunjianbao) 开发规则

> **强制规则**：参与巡检宝项目开发的任何 Agent，必须严格遵守本规则的所有规范。

---

## 一、产品定位

### 一句话定位

```
面向重工业企业的智能监控平台，通过 OpenClaw AI Agent 和 YOLO 检测，
让监控从"被动观看"升级为"主动思考"。
```

### 三大支柱

| 支柱 | 说明 |
|------|------|
| **OpenClaw深度集成** | AI Agent能力融入监控全流程 |
| **YOLO智能检测** | 自动识别火灾、入侵、缺陷 |
| **企业级架构** | 多租户隔离、权限管理、数据安全 |

### 核心模块

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 数据大屏 | 多画面视频流实时监控 | P0 |
| 媒体库 | 企业级文件存储、权限管理 | P0 |
| 视频流接入 | 大疆司空2、RTSP、WebRTC、HLS | P0 |
| YOLO检测 | 火灾、裂缝、入侵、车辆识别 | P1 |
| OpenClaw | AI对话、报告生成、故障诊断 | P1 |
| 告警管理 | 告警规则、实时推送、处理流程 | P1 |

---

## 二、技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (React)                          │
│              React 18 + TypeScript + Tailwind               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Go)                           │
│  认证授权 | 路由转发 | WebSocket | 限流 | 请求日志          │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  业务服务     │  │  AI服务      │  │  媒体服务     │
│  (Go)        │  │  (Python)    │  │  (Go)        │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Tailwind + Redux + Vite + pnpm |
| **后端** | Go 1.21+ + Gin + MySQL + Redis + GORM + JWT |
| **AI服务** | Python 3.10+ + FastAPI + YOLOv8 + OpenCV + OpenClaw |

### 服务端口

| 服务 | 端口 |
|------|------|
| 前端 | 3000/5173 |
| Go服务 | 8094 |
| Python AI服务 | 8095 |
| MySQL | 3306 |
| Redis | 6379 |
| OpenClaw | 8096 |

---

## 三、TDD 开发方法论

### 红绿重构循环

1. 写测试(Red) → 测试失败
2. 写代码(Green) → 测试通过
3. 重构(Refactor) → 改进代码

---

## 四、代码规范

### TypeScript

- ❌ 禁止使用 `any`
- ✅ 函数返回值必须标注
- ✅ 接口和类型定义清晰

### Go

- ✅ 错误必须处理
- ✅ 分层架构 (Handler → Service → Repository)
- ✅ 使用 GORM 进行数据库操作

---

## 五、禁止事项

- ❌ 禁止使用 `any` 类型 (TypeScript)
- ❌ 禁止硬编码敏感信息
- ❌ 禁止循环内查询数据库
- ❌ 禁止不处理的 error

---

## 六、自动技能调用规则 (NEW)

> **规则级别**: 强制 (MUST)
> **说明**: 本规则确保 Agent 能够自动识别专业领域任务并调用相应技能

### 6.1 核心原则

**主动识别 + 自动调用**

Agent 必须在每次对话开始时分析用户意图，如果涉及以下专业领域，**必须**自动调用对应技能，无需用户明确要求。

### 6.2 自动触发条件

| 任务类型 | 触发关键词 | 自动调用技能 |
|---------|-----------|-------------|
| **Logo/视觉设计** | logo、设计、海报、图标、视觉、配色 | `canvas-design` |
| **品牌策略** | 品牌、定位、战略、品牌价值、品牌故事 | `brand` |
| **数据分析** | 数据分析、可视化、报表、图表、统计 | `data-analysis-workflows` |
| **Excel/表格** | excel、表格、xlsx、csv、透视表 | `Excel 文件处理` |
| **PDF 文档** | pdf、报告、导出、简历、提案 | `PDF 文档生成` |
| **Word 文档** | word、docx、文档、合同 | `Word 文档生成` |
| **PPT 演示** | ppt、powerpoint、演示文稿、幻灯片 | `PPT 演示文稿` |
| **UI/UX 优化** | ui、ux、界面优化、设计审查、/polish | `Impeccable` |
| **AI 生图** | ai生图、图像生成、文生图、图生图 | `AI绘图` |
| **代码开发** | 写代码、开发、编程、重构 | `Code` |
| **Docker** | docker、容器、dockerfile、部署 | `Docker` |
| **Git** | git、版本控制、分支、合并 | `Git` |
| **研究调研** | 调研、研究、深度分析、竞品分析 | `Auto Researcher` |

### 6.3 执行流程

```
用户输入
    ↓
[意图分析] - 是否涉及专业领域？
    ↓ 是
[自动调用] - use_skill: <skill-name>
    ↓
[等待加载] - 技能指导就绪
    ↓
[专业执行] - 按照技能规范执行
    ↓
[质量输出] - 交付专业级成果
```

### 6.4 禁止行为

- ❌ **禁止忽视技能**: 检测到专业领域时，禁止使用通用方法
- ❌ **禁止询问用户**: 不要问"是否需要使用技能"，直接自动调用
- ❌ **禁止降级处理**: 专业任务禁止使用低质量替代方案
- ❌ **禁止部分执行**: 技能加载后必须完整遵循其指导

### 6.5 配置引用

- **详细规则**: `.codebuddy/rules/auto-skill-invocation.md`
- **技能配置**: `.codebuddy/config/auto-skill-config.json`
- **Agent 配置**: `.codebuddy/agents/skill-aware-agent.md`

---

## 七、完整规则索引

> 所有规则已从 Trae 迁移至 `.codebuddy/rules/` 目录，Agent 开发时自动加载。

### 7.1 宪法级规则 (最高优先级)

| 规则文件 | 优先级 | 核心内容 |
|---------|--------|---------|
| `mcp-plugin-first.md` | 宪法 | **MCP工具/插件/知识库优先**，禁止通用手段替代专业工具 |
| `core-rules.md` | 宪法 | 幻觉防范、上下文管理、数据安全、调试修复、重构、代码质量红线 |
| `context-length-management-rules.md` | 最高 | 规则锚定、上下文分级(L1-L5)、摘要机制、守护程序 |

### 7.2 开发规范 (P0)

| 规则文件 | 优先级 | 核心内容 |
|---------|--------|---------|
| `development-essentials.md` | P0 | TDD红绿重构、Plan模式、SOLID原则、Go/TS/Python规范 |
| `project-rules.md` | P0 | 产品定位、技术架构、API规范、10个Agent多Agent协作 |
| `agent-development-rules.md` | P0 | Agent通信协议(JSON)、Handoff交接、代码模板、错误码体系 |
| `security-rules.md` | P0 | JWT认证、RBAC权限、SQL注入/XSS/CSRF防护、敏感信息 |
| `database-rules.md` | P0 | 表设计(必备字段/软删除/租户ID)、索引优化、查询规范 |
| `skill-dispatch-rules.md` | P0 | 有技能必调用、技能匹配速查表、自动匹配决策 |
| `command-format-rules.md` | P0 | 零注释命令、可直接复制执行 |
| `version-control-rules.md` | P0 | 语义化版本、Git Flow、Commit规范、分支策略 |
| `video-stream-rules.md` | P0 | RTSP/WebRTC/HLS/RTMP协议接入、重连机制 |

### 7.3 质量保障 (P1)

| 规则文件 | 优先级 | 核心内容 |
|---------|--------|---------|
| `ai-intelligence.md` | P1 | YOLO检测规范(模型管理/推理) + 幻觉防控规范 |
| `alert-rules.md` | P1 | 告警分级(P0-P3)、告警防抖收敛、告警处理流程 |
| `code-review-rules.md` | P1 | PR审查流程、功能性/安全性/性能/规范检查 |
| `code-review-checklist.md` | P1 | 代码审查级别(L1/L2/L3)、审查清单 |
| `monitor-rules.md` | 高 | 实时监控Agent行为规范、早发现早报告 |

### 7.4 性能与清洁开发 (高优先级)

| 规则文件 | 优先级 | 核心内容 |
|---------|--------|---------|
| `performance-optimization-rules.md` | 高 | 正确性>清洁性>性能、测量>优化、SOLID/DRY/KISS/YAGNI |

### 7.5 辅助规则

| 规则文件 | 核心内容 |
|---------|---------|
| `workflow-isolation-rules.md` | 多工作流并行隔离(命名/端口/文件/数据库) |
| `agent-efficiency-rules.md` | 执行前检查清单、防止反复杀端口/清缓存等无效操作 |
| `html-tag-handling-rules.md` | HTML/JSX标签快速决策(Void Element/UI组件) |
| `technical-debt-monitoring.md` | 技术债务分类(故意/意外/环境/测试/文档)、评估与清理 |
| `feature-evaluation-checklist.md` | 功能评估标准(必要性/用户价值/技术可行性) |

### 7.6 技能调用规则

| 规则文件 | 核心内容 |
|---------|---------|
| `auto-skill-invocation.md` | 13类自动技能调用规则(强制MUST) |

### 7.7 Agent 团队配置

| 文件 | 核心内容 |
|------|---------|
| `agents/agents-team.json` | 10个Agent + 5个Squad + 完整通信协议 |
| `agents/skill-aware-agent.md` | 技能感知型 Agent 定义 |
| `config/auto-skill-config.json` | 13个技能的JSON配置(关键词/正则/优先级) |

### 7.8 Skills 目录

`.codebuddy/skills/trae-skills/` 下有完整技能文件，包括 monitor、performance-optimization、context-manager 等专业技能。

---

## 八、Agent 团队结构

```
入口层: skill-dispatcher (技能调度中心)
  ↓
决策层: project-lead (项目总负责人)
  ↓
Lead层: frontend-lead, backend-lead, ai-lead
  ↓
Dev层: frontend-dev, backend-dev, openclaw-eng
  ↓
支撑层: devops-eng, qa-lead
```

**5 个 Squad**: 前端 | 后端 | AI | 平台 | 质量

---

**最后更新**: 2026-04-07
