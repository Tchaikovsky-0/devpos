# 巡检宝 Agent 团队配置

> **项目**: 巡检宝 (XunjianBao)
> **版本**: 1.0.0
> **最后更新**: 2026-04-02
> **状态**: ✅ 已成功导入

---

## 👥 Agent 团队总览

巡检宝项目采用 **10个专业Agent** 的多团队协作架构，形成层次分明、职责明确的开发团队。

### 🎯 团队架构图

```
                    ┌─────────────────┐
                    │ Skill Dispatcher│
                    │  技能调度中心    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Project Lead   │
                    │  项目总负责人    │
                    └────────┬────────┘
           ┌─────────────┬───┴───┬─────────────┐
           │             │       │             │
           ▼             ▼       ▼             ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Frontend  │ │ Backend  │ │   AI     │ │ DevOps   │
    │  Lead    │ │  Lead    │ │  Lead    │ │  Eng     │
    └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘
         │             │            │
         ▼             ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Frontend  │ │ Backend  │ │ OpenClaw │
    │   Dev    │ │   Dev    │ │   Eng    │
    └──────────┘ └──────────┘ └──────────┘

    同时还有: QA Lead (测试负责人)
```

---

## 🤖 Agent 详细列表

### 1️⃣ Skill Dispatcher (技能调度中心)

| 属性 | 值 |
|------|-----|
| **技能** | skill-dispatcher |
| **级别** | Orchestrator (编排层) |
| **职责** | 智能任务路由 - 分析任务类型，精准调度到最佳Agent |
| **管理** | project-lead |
| **触发词** | `/dispatch`, `/skill-dispatch`, `/route` |
| **艾特** | `@skill-dispatcher` |
| **自动触发** | 所有开发任务、任务分析、技能匹配 |

**能力**:
- ✅ 可以分配任务
- ❌ 不能审查
- ❌ 不能审批
- ❌ 不能创建计划

---

### 2️⃣ Project Lead (项目总负责人)

| 属性 | 值 |
|------|-----|
| **技能** | project-lead |
| **级别** | Lead (领导层) |
| **职责** | 全局把控 - 战略规划、技术决策、团队协调、架构审批 |
| **管理** | frontend-lead, backend-lead, ai-lead, devops-eng, qa-lead |
| **触发词** | `/lead`, `/pm`, `/project` |
| **艾特** | `@project-lead` |
| **自动触发** | 项目规划、架构设计、跨团队协调、技术决策、重大发布 |

**能力**:
- ✅ 可以分配任务
- ✅ 可以审查
- ✅ 可以审批
- ✅ 可以创建计划

---

### 3️⃣ Frontend Lead (前端架构师)

| 属性 | 值 |
|------|-----|
| **技能** | frontend-lead |
| **级别** | Lead (领导层) |
| **职责** | 前端架构 - React架构设计、组件库建设、性能优化、代码审查 |
| **汇报给** | project-lead |
| **管理** | frontend-dev |
| **触发词** | `/fe-lead`, `/frontend-arch`, `/fe` |
| **艾特** | `@frontend-lead` |
| **自动触发** | 前端架构、组件设计、性能优化、React问题、前端审查 |

**能力**:
- ✅ 可以分配任务
- ✅ 可以审查
- ❌ 不能审批
- ✅ 可以创建计划

---

### 4️⃣ Frontend Dev (前端开发工程师)

| 属性 | 值 |
|------|-----|
| **技能** | frontend-dev |
| **级别** | Dev (执行层) |
| **职责** | 前端执行 - 页面开发、组件实现、Bug修复、功能交付 |
| **汇报给** | frontend-lead |
| **触发词** | `/fe-dev`, `/frontend-dev` |
| **艾特** | `@frontend-dev` |
| **自动触发** | 页面开发、组件实现、Bug修复、样式调整 |

**能力**:
- ❌ 不能分配任务
- ❌ 不能审查
- ❌ 不能审批
- ❌ 不能创建计划

---

### 5️⃣ Backend Lead (后端架构师)

| 属性 | 值 |
|------|-----|
| **技能** | backend-lead |
| **级别** | Lead (领导层) |
| **职责** | 后端架构 - Go架构设计、API设计、数据库设计、代码审查 |
| **汇报给** | project-lead |
| **管理** | backend-dev |
| **触发词** | `/be-lead`, `/backend-arch`, `/be` |
| **艾特** | `@backend-lead` |
| **自动触发** | 后端架构、API设计、数据库设计、Go问题、后端审查 |

**能力**:
- ✅ 可以分配任务
- ✅ 可以审查
- ❌ 不能审批
- ✅ 可以创建计划

---

### 6️⃣ Backend Dev (后端开发工程师)

| 属性 | 值 |
|------|-----|
| **技能** | backend-dev |
| **级别** | Dev (执行层) |
| **职责** | 后端执行 - API开发、业务逻辑实现、单元测试、功能交付 |
| **汇报给** | backend-lead |
| **触发词** | `/be-dev`, `/backend-dev` |
| **艾特** | `@backend-dev` |
| **自动触发** | API开发、后端功能、Bug修复、Go实现 |

**能力**:
- ❌ 不能分配任务
- ❌ 不能审查
- ❌ 不能审批
- ❌ 不能创建计划

---

### 7️⃣ AI Lead (AI技术负责人)

| 属性 | 值 |
|------|-----|
| **技能** | ai-lead |
| **级别** | Lead (领导层) |
| **职责** | AI架构 - YOLO集成、模型优化、OpenClaw架构、AI效果评估 |
| **汇报给** | project-lead |
| **管理** | openclaw-eng |
| **触发词** | `/ai-lead`, `/ai-arch`, `/ai` |
| **艾特** | `@ai-lead` |
| **自动触发** | YOLO集成、AI检测、模型优化、AI架构、AI审查 |

**能力**:
- ✅ 可以分配任务
- ✅ 可以审查
- ❌ 不能审批
- ✅ 可以创建计划

---

### 8️⃣ OpenClaw Engineer (OpenClaw工程师)

| 属性 | 值 |
|------|-----|
| **技能** | openclaw-eng |
| **级别** | Dev (执行层) |
| **职责** | OpenClaw执行 - 工具开发、Agent开发、Prompt优化、效果调优 |
| **汇报给** | ai-lead |
| **触发词** | `/openclaw`, `/agent` |
| **艾特** | `@openclaw-eng` |
| **自动触发** | OpenClaw集成、Agent开发、工具开发、Prompt优化 |

**能力**:
- ❌ 不能分配任务
- ❌ 不能审查
- ❌ 不能审批
- ❌ 不能创建计划

---

### 9️⃣ DevOps Engineer (DevOps工程师)

| 属性 | 值 |
|------|-----|
| **技能** | devops-eng |
| **级别** | Dev (执行层) |
| **职责** | 平台运维 - CI/CD、容器编排、监控告警、环境管理 |
| **汇报给** | project-lead |
| **触发词** | `/devops`, `/deploy`, `/ops` |
| **艾特** | `@devops-eng` |
| **自动触发** | 部署、CI/CD、监控、环境问题、Docker、K8s |

**能力**:
- ❌ 不能分配任务
- ✅ 可以审查
- ❌ 不能审批
- ✅ 可以创建计划

---

### 🔟 QA Lead (测试负责人)

| 属性 | 值 |
|------|-----|
| **技能** | qa-lead |
| **级别** | Lead (领导层) |
| **职责** | 质量保障 - 测试策略制定、测试执行、Bug追踪、质量评估 |
| **汇报给** | project-lead |
| **触发词** | `/qa`, `/test`, `/quality` |
| **艾特** | `@qa-lead` |
| **自动触发** | 测试、质量保障、Bug分析、测试策略、发布评估 |

**能力**:
- ✅ 可以分配任务
- ✅ 可以审查
- ❌ 不能审批
- ✅ 可以创建计划

---

## 🏢 Squad (小组) 配置

### Frontend Squad (前端小组)
- **组长**: Frontend Lead
- **成员**: Frontend Dev
- **专注**: 前端开发 - React组件、页面实现、UI/UX

### Backend Squad (后端小组)
- **组长**: Backend Lead
- **成员**: Backend Dev
- **专注**: 后端开发 - API服务、业务逻辑、数据存储

### AI Squad (AI小组)
- **组长**: AI Lead
- **成员**: OpenClaw Engineer
- **专注**: AI开发 - YOLO检测、OpenClaw Agent、智能分析

### Platform Squad (平台小组)
- **组长**: DevOps Engineer
- **成员**: (空)
- **专注**: 平台运维 - CI/CD、监控、部署、环境

### Quality Squad (质量小组)
- **组长**: QA Lead
- **成员**: (空)
- **专注**: 质量保障 - 测试、质量把控、发布评估

---

## 🔄 协作流程

### 任务交接协议

1. **Skill Dispatcher → Lead**: 复杂任务需要Lead决策
   - 产物: 任务描述、上下文、约束条件

2. **Lead → Dev**: 任务已拆解可执行
   - 产物: API需求文档、设计文档、验收标准

3. **Dev → Lead**: 任务完成需要审查
   - 产物: 代码变更、测试结果、自检报告

4. **Dev → QA**: 功能开发完成
   - 产物: 功能说明、测试建议、自测报告

5. **QA → Dev**: 发现Bug需要修复
   - 产物: Bug报告、复现步骤、影响范围

---

## 🎯 自动分配规则

| 关键词 | 分配给 | 通知 |
|--------|--------|------|
| 前端, React, 组件, 页面, UI, 样式, Tailwind | frontend-dev | frontend-lead |
| 架构, 设计, 组件设计, 性能优化, 前端Lead | frontend-lead | - |
| 后端, API, 接口, Go, Gin, 数据库, Service | backend-dev | backend-lead |
| 架构设计, API设计, 数据库设计, 后端Lead | backend-lead | - |
| AI, YOLO, 检测, 模型, OpenClaw, Agent | ai-lead | - |
| 部署, CI/CD, Docker, K8s, 环境, 监控 | devops-eng | - |
| 测试, 质量, Bug, QA, 测试用例 | qa-lead | - |
| 项目, 规划, 全局, 架构, 决策, 跨模块 | project-lead | - |

---

## 🚨 升级规则 (Escalation)

| 优先级 | 超时时间 | 升级路径 | 通知 |
|--------|----------|----------|------|
| **P0** (紧急) | 立即 | dev → lead → project-lead | 全部 |
| **P1** (高) | 15分钟 | dev → lead → project-lead | project-lead |
| **P2** (中) | 1小时 | dev → lead | - |
| **P3** (低) | 4小时 | dev | - |

---

## ✅ 质量门禁

### 提交前检查
- 代码格式化
- Linter检查
- 单元测试通过
- 类型检查通过

### 审查前检查
- 自测通过
- 测试覆盖达标
- 无硬编码敏感信息

### 合并前检查
- 代码审查通过
- CI流水线通过
- 无安全漏洞

### 发布前检查
- QA验收通过
- 性能测试通过
- 安全扫描通过
- 文档完整

---

## 📝 使用示例

### 启动 Skill Dispatcher
```
@skill-dispatcher 我需要实现一个用户登录功能
```

### 直接调用 Lead
```
@project-lead 需要进行架构设计评审
@frontend-lead 请审查新的组件设计方案
@backend-lead API设计需要评审
```

### 直接调用 Dev
```
@frontend-dev 开发登录页面组件
@backend-dev 实现登录API
@openclaw-eng 集成OpenClaw身份验证
```

### 调用 DevOps
```
@devops-eng 配置CI/CD流水线
@devops-eng 部署到测试环境
```

### 调用 QA
```
@qa-lead 需要制定测试策略
@qa-lead 执行回归测试
```

---

## 🎉 配置完成

所有10个Agent已成功配置并导入！

**下一步**:
1. 重启 Trae IDE 以加载新的Agent配置
2. 开始使用 `@mention` 召唤Agent
3. 使用 `/command` 快捷命令调用Agent

---

**文档生成时间**: 2026-04-04
**配置来源**: /Volumes/DevDrive/xunjianbao/.trae/agents.json
