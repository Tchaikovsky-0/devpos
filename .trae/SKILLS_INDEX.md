# 巡检宝 - Skill 完整索引

> **更新时间**: 2026-04-03
> **Skill 总数**: 28 个

---

## 📊 Skill 统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 核心技能 (Core) | 3 | 全局通用开发技能 |
| 决策层 (Orchestrator) | 1 | 任务调度中心 |
| Lead 层 (Lead) | 5 | 各领域架构设计和审查 |
| Dev 层 (Dev) | 4 | 各领域功能执行 |
| 增强技能 (Enhancement) | 3 | Agent 能力增强 |
| 实用技能 (Utility) | 10 | 专项工具和专家 |
| 紧急技能 (Emergency) | 1 | 紧急回滚 |
| 支撑技能 (Support) | 1 | 质量监控 |

---

## 🛠️ 完整 Skill 列表

### 1. 核心技能 (Core Skills)

#### ✅ global-dev
- **名称**: Global Dev
- **中文**: 全局开发技能
- **描述**: 跨项目通用开发技能 - TDD + Plan 方法论
- **命令**: `/global-dev`, `/gdev`
- **触发词**: 通用开发任务, TDD开发, 开发方法论
- **文件位置**: `.trae/skills/global-dev/SKILL.md`
- **行数**: 485 行

#### ✅ project-dev
- **名称**: Project Dev
- **中文**: 项目开发执行
- **描述**: 项目开发执行 - 功能实现、代码编写、测试编写
- **命令**: `/project-dev`, `/pdev`
- **触发词**: 功能开发, 代码实现, 项目任务
- **文件位置**: `.trae/skills/project-dev/SKILL.md`
- **行数**: 521 行

#### ✅ xunjianbao-dev
- **名称**: XunjianBao Dev
- **中文**: 巡检宝开发
- **描述**: 巡检宝定制开发 - 监控平台功能开发
- **命令**: `/xj-dev`, `/xunjianbao`
- **触发词**: 巡检宝功能, 监控平台开发, AI检测集成
- **文件位置**: `.trae/skills/xunjianbao-dev/SKILL.md`
- **行数**: 467 行

---

### 2. 决策层 (Orchestrator)

#### ✅ skill-dispatcher
- **名称**: Skill Dispatcher
- **中文**: 技能调度中心
- **描述**: 智能任务路由 - 分析任务类型，精准调度到最佳Agent
- **命令**: `/dispatch`, `/skill-dispatch`, `/route`
- **触发词**: 所有开发任务, 任务分析, 技能匹配
- **文件位置**: `.trae/skills/skill-dispatcher/SKILL.md`
- **行数**: 433 行
- **特殊能力**: 任务分析、精准调度

---

### 3. Lead 层 (Lead Skills)

#### ✅ project-lead
- **名称**: Project Lead
- **中文**: 项目总负责人
- **描述**: 全局把控 - 战略规划、技术决策、团队协调、架构审批
- **命令**: `/lead`, `/pm`, `/project`
- **触发词**: 项目规划, 架构设计, 跨团队协调, 技术决策, 重大发布
- **文件位置**: `.trae/skills/project-lead/SKILL.md`
- **行数**: 373 行
- **下属**: frontend-lead, backend-lead, ai-lead, devops-eng, qa-lead
- **特殊能力**: 最终决策权、架构审批

#### ✅ frontend-lead
- **名称**: Frontend Lead
- **中文**: 前端架构师
- **描述**: 前端架构 - React架构设计、组件库建设、性能优化、代码审查
- **命令**: `/fe-lead`, `/frontend-arch`, `/fe`
- **触发词**: 前端架构, 组件设计, 性能优化, React问题, 前端审查
- **文件位置**: `.trae/skills/frontend-lead/SKILL.md`
- **行数**: 487 行
- **下属**: frontend-dev
- **特殊能力**: 前端架构决策、组件设计审查

#### ✅ backend-lead
- **名称**: Backend Lead
- **中文**: 后端架构师
- **描述**: 后端架构 - Go架构设计、API设计、数据库设计、代码审查
- **命令**: `/be-lead`, `/backend-arch`, `/be`
- **触发词**: 后端架构, API设计, 数据库设计, Go问题, 后端审查
- **文件位置**: `.trae/skills/backend-lead/SKILL.md`
- **行数**: 562 行
- **下属**: backend-dev
- **特殊能力**: 后端架构决策、API设计审查

#### ✅ ai-lead
- **名称**: AI Lead
- **中文**: AI技术负责人
- **描述**: AI架构 - YOLO集成、模型优化、OpenClaw架构、AI效果评估
- **命令**: `/ai-lead`, `/ai-arch`, `/ai`
- **触发词**: YOLO集成, AI检测, 模型优化, AI架构, AI审查
- **文件位置**: `.trae/skills/ai-lead/SKILL.md`
- **行数**: 627 行
- **下属**: openclaw-eng
- **特殊能力**: AI架构决策、模型评估

#### ✅ qa-lead
- **名称**: QA Lead
- **中文**: 测试负责人
- **描述**: 质量保障 - 测试策略制定、测试执行、Bug追踪、质量评估
- **命令**: `/qa`, `/test`, `/quality`
- **触发词**: 测试, 质量保障, Bug分析, 测试策略, 发布评估
- **文件位置**: `.trae/skills/qa-lead/SKILL.md`
- **行数**: 652 行
- **特殊能力**: 质量门禁、测试策略制定

---

### 4. Dev 层 (Dev Skills)

#### ✅ frontend-dev
- **名称**: Frontend Dev
- **中文**: 前端开发工程师
- **描述**: 前端执行 - 页面开发、组件实现、Bug修复、功能交付
- **命令**: `/fe-dev`, `/frontend-dev`
- **触发词**: 页面开发, 组件实现, Bug修复, 样式调整
- **文件位置**: `.trae/skills/frontend-dev/SKILL.md`
- **行数**: 411 行
- **上级**: frontend-lead
- **特殊能力**: 功能实现、组件开发

#### ✅ backend-dev
- **名称**: Backend Dev
- **中文**: 后端开发工程师
- **描述**: 后端执行 - API开发、业务逻辑实现、单元测试、功能交付
- **命令**: `/be-dev`, `/backend-dev`
- **触发词**: API开发, 后端功能, Bug修复, Go实现
- **文件位置**: `.trae/skills/backend-dev/SKILL.md`
- **行数**: 710 行
- **上级**: backend-lead
- **特殊能力**: API开发、业务逻辑实现

#### ✅ openclaw-eng
- **名称**: OpenClaw Engineer
- **中文**: OpenClaw工程师
- **描述**: OpenClaw执行 - 工具开发、Agent开发、Prompt优化、效果调优
- **命令**: `/openclaw`, `/agent`
- **触发词**: OpenClaw集成, Agent开发, 工具开发, Prompt优化
- **文件位置**: `.trae/skills/openclaw-eng/SKILL.md`
- **行数**: 902 行
- **上级**: ai-lead
- **特殊能力**: Agent开发、工具开发

#### ✅ devops-eng
- **名称**: DevOps Engineer
- **中文**: DevOps工程师
- **描述**: 平台运维 - CI/CD、容器编排、监控告警、环境管理
- **命令**: `/devops`, `/deploy`, `/ops`
- **触发词**: 部署, CI/CD, 监控, 环境问题, Docker, K8s
- **文件位置**: `.trae/skills/devops-eng/SKILL.md`
- **行数**: 799 行
- **上级**: project-lead
- **特殊能力**: CI/CD配置、容器编排

---

### 5. 增强技能 (Enhancement Skills)

#### ✅ agent-max-power
- **名称**: Agent Max Power
- **中文**: Agent增强模式
- **描述**: Agent能力增强 - 深度思考、全面分析、高质量输出
- **命令**: `/max-power`, `/增强`
- **触发词**: 增强模式, 深度分析, 高质量输出
- **文件位置**: `.trae/skills/agent-max-power/SKILL.md`
- **行数**: 1318 行
- **特殊能力**: 深度思考、全面分析

#### ✅ agent-creativity-master
- **名称**: Creativity Master
- **中文**: 创造力大师
- **描述**: 创意激发 - 头脑风暴、创新方案、功能建议
- **命令**: `/creative`, `/idea`
- **触发词**: 创意生成, 头脑风暴, 创新方案
- **文件位置**: `.trae/skills/agent-creativity-master/SKILL.md`
- **行数**: 1183 行
- **特殊能力**: 创新思维、方案生成

#### ✅ agent-lifecycle-guardian
- **名称**: Lifecycle Guardian
- **中文**: 生命周期守护者
- **描述**: Agent生命周期管理 - 状态监控、错误恢复、协作管理
- **命令**: `/lifecycle`, `/guardian`
- **触发词**: Agent管理, 生命周期, 状态监控
- **文件位置**: `.trae/skills/agent-lifecycle-guardian/SKILL.md`
- **行数**: 724 行
- **特殊能力**: 状态监控、错误恢复

---

### 6. 实用技能 (Utility Skills)

#### ✅ context-manager
- **名称**: Context Manager
- **中文**: 上下文管理器
- **描述**: 上下文管理专家 - 优化上下文使用、管理Token消耗
- **命令**: `/context`, `/ctx`
- **触发词**: 上下文过长, Token优化, 内存管理
- **文件位置**: `.trae/skills/context-manager/SKILL.md`
- **行数**: 497 行
- **特殊能力**: 上下文优化、Token管理

#### ✅ debugging
- **名称**: Debugging Expert
- **中文**: 调试专家
- **描述**: 调试问题定位 - Bug分析、错误追踪、问题诊断
- **命令**: `/debug`, `/debugging`
- **触发词**: Bug修复, 问题调试, 错误分析
- **文件位置**: `.trae/skills/debugging/SKILL.md`
- **行数**: 569 行
- **特殊能力**: 错误追踪、问题诊断

#### ✅ documentation
- **名称**: Documentation
- **中文**: 文档编写
- **描述**: 技术文档编写 - API文档、README、开发指南
- **命令**: `/docs`, `/documentation`
- **触发词**: 写文档, API文档, 开发指南
- **文件位置**: `.trae/skills/documentation/SKILL.md`
- **行数**: 719 行
- **特殊能力**: 文档编写、技术写作

#### ✅ error-diagnostician
- **名称**: Error Diagnostician
- **中文**: 错误诊断专家
- **描述**: 系统错误诊断 - 错误分析、根因定位、解决方案
- **命令**: `/error`, `/diagnose`
- **触发词**: 错误诊断, 系统故障, 根因分析
- **文件位置**: `.trae/skills/error-diagnostician/SKILL.md`
- **行数**: 463 行
- **特殊能力**: 根因分析、解决方案

#### ✅ frontend-stability
- **名称**: Frontend Stability
- **中文**: 前端稳定性专家
- **描述**: 前端稳定性保障 - 错误预防、异常处理、监控告警
- **命令**: `/fe-stability`, `/frontend-stable`
- **触发词**: 前端稳定性, 错误处理, 异常监控
- **文件位置**: `.trae/skills/frontend-stability/SKILL.md`
- **行数**: 491 行
- **上级**: frontend-lead
- **特殊能力**: 错误预防、异常处理

#### ✅ inspector
- **名称**: Inspector
- **中文**: 代码检查员
- **描述**: 代码质量检查 - 规范检查、安全扫描、代码审查
- **命令**: `/inspect`, `/inspector`
- **触发词**: 代码检查, 质量审查, 安全扫描
- **文件位置**: `.trae/skills/inspector/SKILL.md`
- **行数**: 618 行
- **上级**: qa-lead
- **特殊能力**: 规范检查、安全扫描

#### ✅ open-source-fetcher
- **名称**: Open Source Fetcher
- **中文**: 开源资源获取
- **描述**: 开源资源搜索 - 库查找、方案调研、技术选型
- **命令**: `/oss`, `/open-source`
- **触发词**: 找开源库, 技术调研, 方案选型
- **文件位置**: `.trae/skills/open-source-fetcher/SKILL.md`
- **行数**: 326 行
- **特殊能力**: 资源搜索、技术调研

#### ✅ performance-optimization
- **名称**: Performance Optimizer
- **中文**: 性能优化专家
- **描述**: 性能优化 - 前端性能、后端性能、数据库优化
- **命令**: `/perf`, `/performance`
- **触发词**: 性能优化, 速度提升, 资源优化
- **文件位置**: `.trae/skills/performance-optimization/SKILL.md`
- **行数**: 743 行
- **特殊能力**: 性能分析、瓶颈定位

#### ✅ refactor
- **名称**: Refactor Expert
- **中文**: 重构专家
- **描述**: 代码重构 - 重构设计、模式应用、技术债务清理
- **命令**: `/refactor`, `/重构`
- **触发词**: 代码重构, 设计优化, 技术债务
- **文件位置**: `.trae/skills/refactor/SKILL.md`
- **行数**: 654 行
- **特殊能力**: 重构设计、模式应用

#### ✅ test-strategy
- **名称**: Test Strategist
- **中文**: 测试策略专家
- **描述**: 测试策略制定 - 单元测试、集成测试、E2E测试策略
- **命令**: `/test-strategy`, `/testing`
- **触发词**: 测试策略, 测试计划, 自动化测试
- **文件位置**: `.trae/skills/test-strategy/SKILL.md`
- **行数**: 562 行
- **上级**: qa-lead
- **特殊能力**: 测试设计、策略制定

---

### 7. 支撑技能 (Support Skills)

#### ✅ monitor
- **名称**: Monitor
- **中文**: 实时监控Agent
- **描述**: 质量守门员 - 实时监控代码质量、运行状态、性能指标，自动检测并报告问题
- **命令**: `/monitor`, `/check`, `/quality-check`
- **触发词**: 代码质量检测, 实时监控, 提交前检测, CI检测, 质量报告
- **文件位置**: `.trae/skills/monitor/SKILL.md`
- **行数**: 932 行
- **上级**: project-lead
- **特殊能力**: 实时监控、质量报告

---

### 8. 紧急技能 (Emergency Skills)

#### ✅ rollback
- **名称**: Rollback
- **中文**: 回滚操作
- **描述**: 紧急回滚 - 代码回滚、部署回滚、问题恢复
- **命令**: `/rollback`, `/回滚`
- **触发词**: 紧急回滚, 代码撤销, 部署恢复
- **文件位置**: `.trae/skills/rollback/SKILL.md`
- **行数**: 35 行
- **上级**: project-lead
- **特殊能力**: 紧急回滚、需要审批

---

## 📋 Skill 分类速查表

### 按功能分类

| 功能 | Skill |
|------|-------|
| **任务调度** | skill-dispatcher |
| **项目管理** | project-lead |
| **前端开发** | frontend-lead, frontend-dev, frontend-stability |
| **后端开发** | backend-lead, backend-dev |
| **AI开发** | ai-lead, openclaw-eng |
| **测试质量** | qa-lead, inspector, test-strategy, monitor |
| **运维部署** | devops-eng |
| **代码增强** | global-dev, project-dev, xunjianbao-dev |
| **问题诊断** | debugging, error-diagnostician, context-manager |
| **性能优化** | performance-optimization, refactor |
| **文档工具** | documentation, open-source-fetcher |
| **Agent增强** | agent-max-power, agent-creativity-master, agent-lifecycle-guardian |
| **紧急处理** | rollback |

### 按级别分类

| 级别 | Skill |
|------|-------|
| **Orchestrator** | skill-dispatcher |
| **Lead** | project-lead, frontend-lead, backend-lead, ai-lead, qa-lead |
| **Dev** | frontend-dev, backend-dev, openclaw-eng, devops-eng |
| **Core** | global-dev, project-dev, xunjianbao-dev |
| **Enhancement** | agent-max-power, agent-creativity-master, agent-lifecycle-guardian |
| **Utility** | context-manager, debugging, documentation, error-diagnostician, frontend-stability, inspector, open-source-fetcher, performance-optimization, refactor, test-strategy |
| **Support** | monitor |
| **Emergency** | rollback |

---

## 🚀 快速使用指南

### 场景 1: 新功能开发
```bash
# 使用技能调度器自动分配
/dispatch 实现视频流管理模块

# 或直接调用
@project-lead 设计视频流管理模块
@backend-dev 实现后端API
@frontend-dev 实现前端页面
@qa-lead 编写测试用例
```

### 场景 2: Bug修复
```bash
# 使用调试专家
@debugging 修复视频播放卡顿问题

# 或直接修复
@backend-dev 修复后端API问题
@frontend-dev 修复前端显示问题
```

### 场景 3: 性能优化
```bash
# 性能优化
@performance-optimization 优化API响应时间

# 或重构代码
@refactor 重构用户模块代码
```

### 场景 4: 代码审查
```bash
# 代码检查
@inspector 检查代码质量

# 质量监控
@monitor 生成质量报告
```

### 场景 5: 文档编写
```bash
# 文档编写
@documentation 编写API文档

# 技术调研
@open-source-fetcher 调研YOLO替代方案
```

---

## 📖 相关文档

- [skill-config.json](./skill-config.json) - Skill 配置文件
- [agents.json](./agents.json) - Agent 配置文件
- [workflow.md](./workflow.md) - 工作流程文档
- [CONFIGURATION_STATUS.md](./CONFIGURATION_STATUS.md) - 配置状态报告

---

**最后更新**: 2026-04-03
**配置状态**: ✅ 完整配置 (28 个 Skill)
