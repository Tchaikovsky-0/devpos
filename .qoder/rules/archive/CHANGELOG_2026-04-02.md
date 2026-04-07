# 规范更新日志

## 2026-04-02 - Agent 开发统一规范 v1.0.0

### 新增内容

#### 1. 核心规范文档
- **新增**: [agent_development_rules.md](./agent_development_rules.md)
  - Agent 通信协议（统一 JSON 消息格式）
  - 代码生成模板（Go/TypeScript/Python）
  - 工作流程规范
  - 错误处理机制
  - 状态管理规范
  - 日志规范
  - API 设计规范

#### 2. 代码模板库
- **新增目录**: `.trae/templates/`
  - `go/` - Go 后端完整模板
    - `handler.template.go` - Handler 层
    - `service.template.go` - Service 层
    - `repository.template.go` - Repository 层
    - `model.template.go` - Model 层
  - `typescript/` - TypeScript 前端模板
    - `component.template.tsx` - React 组件
    - `api.template.ts` - API 模块
    - `hook.template.ts` - 自定义 Hook
  - `python/` - Python AI 服务模板
    - `router.template.py` - FastAPI 路由
    - `service.template.py` - Service 层

#### 3. 快速参考卡
- **新增**: [AGENT_QUICK_REFERENCE.md](./AGENT_QUICK_REFERENCE.md)
  - 通信协议速查
  - 代码模板速查
  - 必须遵守的规则
  - 快速检查清单
  - 常用命令

#### 4. AI 幻觉防控规则 ⭐ NEW
- **新增**: [anti_hallucination_rules.md](./anti_hallucination_rules.md)
  - 什么是AI幻觉（比喻：考试瞎蒙）
  - 核心禁止规则（绝对禁止清单）
  - 验证检查清单（每次回复前必检）
  - 实战场景指南（代码/API/配置）
  - 错误示范 vs 正确示范
  - 特殊场景处理（不知道、超出范围等）
  - 违规惩罚机制（P0-P2分级）
  - 训练指南（思维习惯、快速命令）

### 更新内容

#### 1. project_rules.md
- **更新**: 专项规范索引
  - 新增: Agent开发统一规范（P0）
- **更新**: 多Agent使用指南
  - 新增: Agent协作规范章节
  - 新增: Agent通信示例
  - 新增: 任务交接规范

#### 2. skill_dispatch_rules.md
- **更新**: 黄金法则
  - 新增: Agent协作规范引用
- **更新**: 调度流程
  - 新增: 调度后必须遵循的通信协议
- **更新**: 禁止事项（升级为 Agent通信标准）
  - 新增: 消息格式要求
  - 新增: 通信禁止事项

#### 3. global_dev_rules.md
- **更新**: 核心方法论
  - 新增: Plan 模式下的 Agent 开发注意事项
- **更新**: 禁止事项
  - 新增: 多Agent协作通信协议要求
  - 新增: AI幻觉防控禁止规则
- **新增**: 相关规范索引章节
- **新增**: AI 幻觉防控详细规则（三.1节）
  - 核心原则（必须遵守 vs 严格禁止）
  - 验证检查清单
  - 实践指南（4个场景）

### 规范体系架构

```
巡检宝项目规范体系
├── 全局规则
│   ├── global_dev_rules.md (TDD、代码质量)
│   └── project_rules.md (项目架构、团队协作)
├── Agent 协作规范
│   ├── agent_development_rules.md (核心规范) ⭐ NEW
│   ├── skill_dispatch_rules.md (技能调度)
│   └── AGENT_QUICK_REFERENCE.md (快速参考) ⭐ NEW
├── 代码模板库
│   └── templates/ ⭐ NEW
│       ├── go/
│       ├── typescript/
│       └── python/
└── 专项规范
    ├── security_rules.md
    ├── database_rules.md
    ├── ai_detection_rules.md
    └── ... (其他规范)
```

### 核心创新

1. **统一通信语法**
   - 标准 JSON 消息格式
   - 任务交接协议
   - 错误报告标准

2. **代码模板体系**
   - Go/TypeScript/Python 三语言支持
   - 完整分层架构模板
   - 可直接替换变量使用

3. **工作流程规范**
   - 清晰的任务状态机
   - 标准化的审查流程
   - 完整的检查清单

### 迁移指南

#### 对于现有 Agent：
1. 阅读 [AGENT_QUICK_REFERENCE.md](./AGENT_QUICK_REFERENCE.md)
2. 熟悉新的通信协议格式
3. 开始使用代码模板生成代码

#### 对于新任务：
1. 使用 skill-dispatcher 分析任务类型
2. 遵循新的消息格式进行通信
3. 使用标准模板生成代码
4. 遵循新的工作流程

---

## 2026-04-02 - 规则精简优化 v2.0

### 问题发现
- 规则文件过多（27个）
- 存在大量重复内容（幻觉防范规则有2个相同文件）
- 规则层级混乱，重点不突出

### 优化措施

#### 删除的文件
- `agent_hallucination_prevention_rules.md` - 与 anti_hallucination_rules.md 重复

#### 合并的文件
- `clean_code_standards.md` → 合并到 `performance_optimization_rules.md`
- `testing_rules.md` + `refactoring_rules.md` → 合并为 `testing_refactoring_rules.md`

#### 新增的文件
- `CORE_RULES.md` - 宪法级核心规则（幻觉防范+上下文管理+数据安全）

#### 精简的文件
- `AGENT_QUICK_REFERENCE.md` - 从264行精简到143行，删除重复内容

### 优化后的规则架构

```
第一层 - 宪法级（强制）
├── CORE_RULES.md ⭐ NEW
│   ├── 幻觉防范核心规则
│   ├── 上下文管理核心规则
│   ├── 数据安全红线
│   └── 永久禁止清单

第二层 - 核心规范
├── anti_hallucination_rules.md
├── context_length_management_rules.md
├── global_dev_rules.md
├── agent_development_rules.md
├── performance_optimization_rules.md (+清洁代码)
└── testing_refactoring_rules.md (+重构)

第三层 - 专项规则
├── security_rules.md
├── database_rules.md
└── ...其他专项
```

### 优化效果
| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 规则文件数 | 27个 | 22个 | -5个 |
| 快速参考长度 | 264行 | 143行 | -46% |
| 核心规则集中度 | 分散 | 集中 | ✅ |

---

**最后更新**: 2026-04-02 v2
