# 巡检宝技能索引

> 本文档列出了所有已配置到 Qoder 的技能，方便快速查找和调用。

## 核心技能 (Core Skills) - P0

| 技能 | 命令 | 说明 |
|------|------|------|
| global-dev | `/global-dev` `/gdev` | TDD + Plan 方法论，跨项目通用 |
| project-dev | `/project-dev` `/pdev` | 项目开发执行 |
| xunjianbao-dev | `/xj-dev` `/xunjianbao` | 巡检宝定制开发 |

## 决策层 (Orchestrator) - P0

| 技能 | 命令 | 说明 |
|------|------|------|
| skill-dispatcher | `/dispatch` `/route` | 智能任务路由调度 |

## Lead 层 (架构师) - P1

| 技能 | 命令 | 说明 |
|------|------|------|
| project-lead | `/lead` `/pm` `/project` | 项目总负责人 |
| frontend-lead | `/fe-lead` `/fe` | 前端架构师 |
| backend-lead | `/be-lead` `/be` | 后端架构师 |
| ai-lead | `/ai-lead` `/ai` | AI技术负责人 |
| qa-lead | `/qa` `/test` | 测试负责人 |

## Dev 层 (工程师) - P1

| 技能 | 命令 | 说明 |
|------|------|------|
| frontend-dev | `/fe-dev` | 前端开发工程师 |
| backend-dev | `/be-dev` | 后端开发工程师 |
| openclaw-eng | `/openclaw` `/agent` | OpenClaw工程师 |
| devops-eng | `/devops` `/deploy` | DevOps工程师 |

## 实用技能 (Utility) - P2

| 技能 | 命令 | 说明 |
|------|------|------|
| context-manager | `/context` `/ctx` | 上下文管理 |
| debugging | `/debug` | 调试专家 |
| documentation | `/docs` | 文档编写 |
| error-diagnostician | `/error` `/diagnose` | 错误诊断 |
| frontend-stability | `/fe-stability` | 前端稳定性 |
| inspector | `/inspect` | 代码检查 |
| open-source-fetcher | `/oss` | 开源资源获取 |
| performance-optimization | `/perf` | 性能优化 |
| refactor | `/refactor` | 重构专家 |
| test-strategy | `/test-strategy` | 测试策略 |
| monitor | `/monitor` `/check` | 实时监控 |
| rollback | `/rollback` | 紧急回滚 |

## 增强技能 (Enhancement) - P2

| 技能 | 命令 | 说明 |
|------|------|------|
| agent-max-power | `/max-power` | Agent增强模式 |
| agent-creativity-master | `/creative` `/idea` | 创造力大师 |
| agent-lifecycle-guardian | `/lifecycle` | 生命周期守护 |

## 调用方式

1. **命令调用**: 直接输入斜杠命令，如 `/global-dev`
2. **@提及**: 使用 @技能名 提及，如 `@project-lead`
3. **自动触发**: 根据任务关键词自动匹配

## 技能目录结构

```
.qoder/
├── skills/              # 技能定义 (SKILL.md)
│   ├── global-dev/
│   ├── project-dev/
│   ├── xunjianbao-dev/
│   ├── skill-dispatcher/
│   ├── project-lead/
│   ├── frontend-lead/
│   ├── backend-lead/
│   ├── ai-lead/
│   ├── qa-lead/
│   ├── frontend-dev/
│   ├── backend-dev/
│   ├── openclaw-eng/
│   ├── devops-eng/
│   └── ...
├── agents.json          # Agent配置总表
├── rules/               # 规则文件
│   ├── project_rules.md
│   └── ...
└── SKILLS_INDEX.md      # 本文件
```

## 统计

- **已配置技能**: 25个核心技能
- **待配置技能**: 43个扩展技能（位于 .trae/skills）
- **规则文件**: 23个
- **Agent角色**: 28个

---
*最后更新: 2026-04-07*
