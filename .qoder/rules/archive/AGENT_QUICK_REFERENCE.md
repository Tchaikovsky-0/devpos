# Agent 开发快速参考卡

> **巡检宝项目 Agent 开发核心规则速查**
> 完整规范请查看各专项规则文档

---

## 🚨 黄金法则

### 1. 通信协议
```json
{
  "type": "task|response|error|status",
  "action": "create|update|complete|fail|handoff",
  "from": "agent-name",
  "to": "agent-name|all",
  "payload": { "task_id": "...", "title": "...", "priority": "P0|P1|P2|P3" }
}
```

### 2. 任务交接 (Handoff)
```json
{
  "type": "handoff",
  "from": "前端Agent", "to": "后端Agent",
  "payload": {
    "completed_work": [...],
    "remaining_work": [...],
    "artifacts": [...],
    "questions": [...]
  }
}
```

---

## ✅ 必须遵守的禁止规则

### 代码质量红线
- ❌ 禁止 `any` (TypeScript)
- ❌ 禁止 `SELECT *`
- ❌ 禁止循环内查询数据库
- ❌ 禁止不处理的 error

### 幻觉防控 ⭐
- ❌ 禁止凭空捏造文件路径、函数名、API端点
- ❌ 禁止在不确定时使用肯定语气
- ✅ 不确定时说"需要验证"或"无法确定"
- ✅ 引用代码时必须先读取文件确认

---

## 🔍 快速检查清单

### 任务前
- [ ] 理解任务目标
- [ ] 查看相关规范
- [ ] 使用标准模板
- [ ] 制定实现计划

### 任务中
- [ ] 遵循代码规范
- [ ] 幻觉防控自检
- [ ] 遇到问题上报

### 任务后
- [ ] 运行代码检查
- [ ] 提交代码审查

---

## 🎯 常用命令

```bash
# Go
cd server && golangci-lint run ./... && go test -v ./...

# TypeScript
cd app && pnpm lint && pnpm test

# Python
cd ai-service && black . && mypy . && pytest

# 前端缓存清理（解决刷新看不到修改的问题）
cd frontend && pnpm run clear-cache        # 清理缓存
cd frontend && pnpm run dev:fresh          # 清理并重启

# 浏览器硬刷新
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R
```

---

## 📚 规范文档索引

### ⭐ 核心规则（每次必读）
| 文档 | 说明 |
|------|------|
| [anti_hallucination_rules.md](./anti_hallucination_rules.md) | 幻觉防范（强制） |
| [context_length_management_rules.md](./context_length_management_rules.md) | 上下文管理（强制） |
| [global_dev_rules.md](./global_dev_rules.md) | TDD、Plan模式、编码规范 |

### 🔧 开发规范
| 文档 | 说明 |
|------|------|
| [performance_optimization_rules.md](./performance_optimization_rules.md) | 性能优化+清洁代码 |
| [testing_refactoring_rules.md](./testing_refactoring_rules.md) | 测试+重构 |
| [debugging_rules.md](./debugging_rules.md) | 系统化调试 |
| [frontend_dev_debug_rules.md](./frontend_dev_debug_rules.md) | 前端调试+缓存清理 ⭐ NEW |
| [project_rules.md](./project_rules.md) | 项目架构 |

### 🤖 Agent协作
| 文档 | 说明 |
|------|------|
| [agent_development_rules.md](./agent_development_rules.md) | Agent通信协议 |
| [skill_dispatch_rules.md](./skill_dispatch_rules.md) | 技能调度 |

### 📖 专项规则
| 文档 | 说明 |
|------|------|
| [security_rules.md](./security_rules.md) | 安全规范 |
| [database_rules.md](./database_rules.md) | 数据库规范 |
| [documentation_rules.md](./documentation_rules.md) | 文档规范 |

---

## 🚨 永久禁止清单

```
🚨 数据安全
- 未确认就删除文件
- 未备份就修改生产数据
- 暴露敏感信息

🚨 幻觉防范
- 提供无法验证的技术信息
- 在不确定时说"我确定"

🚨 调试方法
- 没有复现就修复Bug
- 瞎猜问题原因

🚨 重构规范
- 没有测试就重构
- 重构时改变功能
```

---

**最后更新**: 2026-04-02
