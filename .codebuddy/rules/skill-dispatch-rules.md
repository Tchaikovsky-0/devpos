---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:44:58.214Z
provider: 
---

# 巡检宝项目 - 技能调度规则

> **核心原则**: 有技能必调用，精准匹配，避免滥用

---

## 一、黄金法则

```
🚨 最重要：
   - 遇到任何开发任务，先检查是否有相关技能
   - 有技能必调用！
   - 先分析任务类型，再调度技能

💡 决策顺序：
   1. 用户指定 → 直接调用指定技能
   2. 自动匹配 → 根据任务类型调用最合适技能
   3. 自己处理 → 没有匹配技能时才自己处理

📋 Agent协作规范：
   所有Agent间的通信和协作必须遵循 [Agent开发统一规范](./agent_development_rules.md)
   包括：统一消息格式、任务交接协议、错误报告标准、代码模板使用
```

---

## 二、技能匹配速查表

| 任务类型 | 匹配技能 | 关键词 |
|---------|---------|--------|
| 前端页面开发 | `frontend-dev` | 页面、组件、前端功能 |
| 前端架构设计 | `frontend-lead` | 架构、组件设计、性能 |
| 后端API开发 | `backend-dev` | API、接口、后端功能 |
| 后端架构设计 | `backend-lead` | 架构、API设计、数据库 |
| AI检测集成 | `ai-lead` | YOLO、检测、模型 |
| OpenClaw集成 | `openclaw-eng` | OpenClaw、Agent、工具集 |
| 部署运维 | `devops-eng` | 部署、CI/CD、监控 |
| 测试质量 | `qa-lead` | 测试、质量保障 |
| Bug修复 | `bug-fix` | Bug、修复、问题 |
| 代码审查 | `code-review` | 审查、review |
| 项目全局 | `project-lead` | 项目规划、架构、跨模块 |
| 开源模板拉取 | `open-source-fetcher` | GitHub、模板、开源项目、boilerplate |
| 错误诊断分析 | `error-diagnostician` | 报错、Error、TypeError、panic、异常、调试 |

---

## 三、调度流程

```
用户请求 → 分析任务类型 → 查询技能库 → 匹配技能？
                                    ↓是      ↓否
                                 调用技能  自己处理

⚠️ 调度后必须遵循Agent通信协议：
   - 使用标准JSON消息格式
   - 明确指定任务目标和验收标准
   - 记录任务交接信息
   - 及时更新任务状态
```

---

## 四、Agent通信标准

> **所有Agent通信必须使用统一格式，详见 [Agent开发统一规范](./agent_development_rules.md)**

### 消息格式要求

```json
{
  "type": "task|response|error|status",
  "action": "create|update|complete|fail|handoff",
  "from": "agent-name",
  "to": "agent-name|all",
  "payload": {
    "task_id": "唯一任务ID",
    "title": "任务标题",
    "priority": "P0|P1|P2|P3",
    "status": "pending|in_progress|completed|failed"
  },
  "metadata": {
    "timestamp": "ISO8601时间戳",
    "correlation_id": "关联ID"
  }
}
```

### 禁止事项

```
❌ 绝对禁止：
   - 有匹配技能却自己处理
   - 同一任务调用多个技能
   - 调用无关技能
   - 不遵循统一消息格式
   - Agent间直接修改代码（跳过PR）

⚠️ 特别注意：
   - 不确定时，列出选项让用户选
   - 尊重用户明确指定的技能
   - 任务完成后必须更新状态
   - 遇到错误必须标准化报告
```

---

**最后更新**: 2026年4月