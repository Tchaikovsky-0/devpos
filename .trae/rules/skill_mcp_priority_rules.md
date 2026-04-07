# 巡检宝 - MCP 优先使用规则

> **强制执行 | 最高优先级**
> 版本: v2.0.0（更新 MCP 优先）
> 创建日期: 2026-04-07
> 最后更新: 2026-04-07

---

## 📌 规则概述

本规则定义了 Agent 执行任务时的**解决方案优先级体系**，**MCP 优先于 Skill**，确保优先使用已有的专用工具和组件，避免资源浪费和重复造轮子。所有 Agent 必须严格遵循此优先级顺序。

### 核心原则

```
🥇 MCP（模块化组件/流程）> 🥈 Skill（专用技能）> 🥉 专用工具 > 🛡️ 通用方法
```

> 💡 **MCP = 专用工具箱（精准快速）**
> **Skill = 通用工具箱（灵活强大）**

---

# 第一章：优先级体系 ⭐

## 1.1 四级优先级定义

```yaml
🥇 第一优先级 - MCP（模块化组件/流程）
   定义: 项目已集成的 MCP 工具（桌面命令、ECS实例管理等）
   示例: mcp_ecs_* 系列工具、mcp_DesktopCommander_* 系列工具

🥈 第二优先级 - Skill（专用技能）
   定义: 项目已集成的 Agent 技能
   示例: frontend-dev, backend-dev, ai-lead, xiaohongshu, tencentcloud-cos 等

🥉 第三优先级 - 专用工具/方法
   定义: 针对特定任务场景的专用工具或方法
   示例: 专用脚本、命令行工具、专用API客户端

🛡️ 第四优先级 - 通用方法
   定义: 通用的开发方式或问题解决方法
   示例: 手动编写代码、使用通用API、手动调试
```

## 1.2 优先级决策流程

```
任务输入
   ↓
┌─────────────────────────────────────┐
│ 步骤1: 检查 MCP 可用性（最高）     │
│ → 查看 MCP 工具描述                 │
│ → 匹配任务关键词                   │
│ → 判断是否有适用的 MCP             │
└─────────────────────────────────────┘
   ↓ 是否有匹配？
   ├─ 是 → 调用 MCP → 任务完成 ✅
   │
   ├─ 否 → 进入步骤2
   ↓
┌─────────────────────────────────────┐
│ 步骤2: 检查 Skill 可用性           │
│ → 查看 Skill 工具描述               │
│ → 匹配任务关键词                   │
│ → 判断是否有适用的 Skill           │
└─────────────────────────────────────┘
   ↓ 是否有匹配？
   ├─ 是 → 调用 Skill → 任务完成 ✅
   │
   ├─ 否 → 进入步骤3
   ↓
┌─────────────────────────────────────┐
│ 步骤3: 检查专用工具/方法           │
│ → 搜索项目中的专用脚本             │
│ → 查看是否有命令行工具             │
│ → 检查专用API客户端               │
└─────────────────────────────────────┘
   ↓ 是否有可用专用工具？
   ├─ 是 → 使用专用工具 → 任务完成 ✅
   │
   ├─ 否 → 进入步骤4
   ↓
┌─────────────────────────────────────┐
│ 步骤4: 使用通用方法（最后手段）     │
│ → 通用开发方式                     │
│ → 手动编写代码                     │
│ → 通用调试方法                     │
└─────────────────────────────────────┘
```

## 1.3 优先级记忆口诀

```
🎯 MCP 是大哥，Skill 是二哥
   专用工具排老三，通用方法垫底走
```

---

# 第二章：强制检查清单 ✅

## 2.1 任务开始前检查

> ⚠️ **每个任务开始前必须完成以下检查**

```yaml
□ 我理解任务了吗？
   → 如果不确定，先向用户确认

□ 任务涉及哪些关键词？
   → 列出关键词：ECS实例、桌面命令、前端、后端、AI等

□ 我查看了 MCP 工具描述吗？
   → 首先检查 MCP 工具列表（mcp_ecs_*、mcp_DesktopCommander_* 等）
   → MCP 是第一优先级，必须首先检查

□ 有匹配的 MCP 吗？
   → 如果有，必须调用 MCP，不能跳过
   → ECS 相关 → mcp_ecs_* 系列
   → 桌面命令 → mcp_DesktopCommander_* 系列

□ 有匹配的 Skill 吗？（MCP 没有时）
   → 查看 Skill 工具的 available_skills 列表
   → 如果 MCP 不适用，检查对应的 Skill

□ 有专用工具/方法吗？
   → 搜索项目中是否有专用脚本或工具

□ 是否必须使用通用方法？
   → 只有在上述都不适用时才使用
```

## 2.2 MCP + Skill 匹配检查表（按优先级排序）

### 🥇 MCP 检查表（第一优先级）

| 任务关键词 | 应检查的 MCP 工具 |
|-----------|------------------|
| ECS 实例管理、查询实例 | `mcp_ecs_describe_instances` |
| ECS 系统事件、运维事件 | `mcp_ecs_describe_system_events` |
| ECS 地域、可用区 | `mcp_ecs_describe_regions`, `mcp_ecs_describe_zones` |
| ECS 实例规格、镜像 | `mcp_ecs_describe_instance_types`, `mcp_ecs_describe_images` |
| ECS 启动、续费、重启 | `mcp_ecs_start_instances`, `mcp_ecs_renew_instance` |
| ECS 控制台输出、截图 | `mcp_ecs_get_console_output`, `mcp_ecs_get_console_screenshot` |
| 桌面命令执行 | `mcp_DesktopCommander_*` 系列 |

### 🥈 Skill 检查表（第二优先级）

| 任务关键词 | 应检查的 Skill |
|-----------|----------------|
| 前端、页面、组件、UI | `frontend-dev`, `frontend-lead`, `frontend-design` |
| 后端、API、接口、服务 | `backend-dev`, `backend-lead`, `api-design` |
| AI、YOLO、检测、模型 | `ai-lead`, `ai-skill` |
| 数据库、SQL、迁移 | `database-design`, `database` |
| 部署、CI/CD、运维 | `devops-eng`, `cloudbase` |
| 测试、测试策略 | `qa-lead`, `testing`, `testing-strategy` |
| 性能、优化、分析 | `performance`, `performance-optimization` |
| 安全、漏洞、审计 | `security`, `security-audit` |
| 文档、编写、说明 | `documentation` |
| Bug、错误、异常 | `bug-fix`, `debugging`, `error-diagnostician` |
| 架构、设计、系统 | `architecture`, `architecture-design`, `project-lead` |
| 代码审查、重构 | `code-review`, `refactor` |
| 小红书、内容、笔记 | `xiaohongshu` |
| 腾讯云、COS、存储 | `tencentcloud-cos`, `tencent-survey` |
| GitHub、模板、开源 | `github`, `open-source-fetcher`, `github-trending-cn` |
| 新闻、资讯、热点 | `tencent-news` |
| 问卷、调查、表单 | `tencent-survey` |

---

# 第三章：绝对禁止 🚫

## 3.1 禁止行为清单

```yaml
🚫 有适用 MCP 却跳过直接用 Skill 或通用方法
   → 场景: 需要查询 ECS 实例，但有 mcp_ecs_* 却用 Skill 或自己写代码
   → 正确做法: 必须先调用 MCP

🚫 有适用 Skill 却直接使用通用方法
   → 场景: 需要写前端代码，但有 frontend-dev 却自己写
   → 正确做法: 先调用 Skill（前提是没有适用的 MCP）

🚫 有适用 MCP/Skill 却跳过不调用
   → 场景: 需要调试错误，但有 error-diagnostician 却自己猜
   → 正确做法: 先调用适用的 MCP（如果有），否则调用 Skill

🚫 不检查 MCP 就开始用 Skill
   → 场景: 接到 ECS 相关任务，直接看 Skill 列表
   → 正确做法: 必须先检查 MCP 工具列表

🚫 不检查 Skill/MCP 列表就开始开发
   → 场景: 接到任务就直接写代码，不看有哪些工具可用
   → 正确做法: 必须先查看 MCP 工具描述，再查看 Skill 工具描述

🚫 声称"MCP/Skill 不够好"来回避使用
   → 场景: 有 MCP/Skill 但觉得不够完美，选择自己干
   → 正确做法: 使用 MCP/Skill，并在任务中反馈改进建议
```

## 3.2 违规示例

### ❌ 错误示例 1：跳过 MCP

```yaml
用户: "帮我查询一下 ECS 实例列表"
Agent: 开始写 Python 代码调用火山引擎 API

❌ 违反规则: 有 mcp_ecs_describe_instances MCP 却没有调用
✅ 正确做法: 先调用 mcp_ecs_describe_instances MCP
```

### ❌ 错误示例 2：跳过 Skill

```yaml
用户: "帮我写一个用户登录页面"
Agent: 直接开始用通用方式写 React 组件

❌ 违反规则: 有 frontend-dev 技能却没有调用
✅ 正确做法: 先调用 frontend-dev 技能（前提是没有适用的 MCP）
```

### ❌ 错误示例 3：跳过 MCP 和 Skill

```yaml
用户: "后端接口报错，帮我看看"
Agent: 开始猜测可能的原因，然后尝试修复

❌ 违反规则: 有 error-diagnostician Skill 和 debugging Skill 却没有调用
✅ 正确做法: 先调用相关技能进行错误诊断
```

### ❌ 错误示例 4：不检查工具就动手

```yaml
用户: "上传这个图片到腾讯云 COS"
Agent: 开始写 Python 代码调用 COS API

❌ 违反规则: 有 tencentcloud-cos Skill 却没有调用
✅ 正确做法: 先调用 tencentcloud-cos Skill（前提是没有适用的 MCP）
```

---

# 第四章：正确示例 ✅

## 4.1 正确流程示例

### ✅ 正确示例 1：MCP 优先（ECS 实例查询）

```yaml
用户: "帮我查询一下北京区域的 ECS 实例"
Agent 思考过程:
   1. 分析任务关键词: "ECS 实例" → 云服务器、ECS
   2. 首先检查 MCP: 发现有 mcp_ecs_describe_instances ✅
   3. 判断匹配度: mcp_ecs_describe_instances 完全匹配
   4. 行动: 调用 mcp_ecs_describe_instances MCP
   5. 结果: MCP 返回实例列表，任务完成

✅ 符合规则: MCP 是最高优先级，正确调用
```

### ✅ 正确示例 2：MCP 没有时使用 Skill

```yaml
用户: "帮我创建一个用户管理页面"
Agent 思考过程:
   1. 分析任务关键词: "用户管理页面" → 前端、页面、组件
   2. 首先检查 MCP: 没有适用的 MCP ❌
   3. 然后检查 Skill: 发现有 frontend-dev ✅
   4. 判断匹配度: frontend-dev 非常适合
   5. 行动: 调用 frontend-dev 技能
   6. 结果: 技能完成任务，符合项目规范

✅ 符合规则: MCP 没有时使用 Skill，层级正确
```

### ✅ 正确示例 3：MCP 处理 ECS，Skill 处理业务逻辑

```yaml
用户: "查询 ECS 实例状态，如果有关机的就帮我启动"
Agent 思考过程:
   1. 分析任务关键词: "ECS 实例状态" → ECS
   2. 首先检查 MCP:
      - 查询实例 → mcp_ecs_describe_instances ✅
      - 启动实例 → mcp_ecs_start_instances ✅
   3. 判断匹配度: 两个 MCP 完全匹配
   4. 行动:
      - 调用 mcp_ecs_describe_instances 获取实例列表
      - 分析结果，找出状态为 STOPPED 的实例
      - 调用 mcp_ecs_start_instances 启动实例
   5. 结果: MCP 完成了所有 ECS 操作

✅ 符合规则: MCP 优先处理底层操作
```

### ✅ 正确示例 4：错误诊断

```yaml
用户: "接口返回 500 错误，怎么回事？"
Agent 思考过程:
   1. 分析任务关键词: "500 错误" → 错误、调试、异常
   2. 首先检查 MCP: 没有适用的 MCP ❌
   3. 然后检查 Skill: 发现有 error-diagnostician, debugging, bug-fix ✅
   4. 判断匹配度: error-diagnostician 最适合
   5. 行动: 调用 error-diagnostician 技能
   6. 结果: 技能进行了系统化诊断，给出根因分析

✅ 符合规则: MCP 没有时正确使用 Skill
```

### ✅ 正确示例 5：云存储操作

```yaml
用户: "上传这个图片到腾讯云 COS"
Agent 思考过程:
   1. 分析任务关键词: "腾讯云 COS" → 云存储、腾讯云
   2. 首先检查 MCP: 没有直接可用的 MCP（目前没有 COS 的 MCP）
   3. 然后检查 Skill: 发现有 tencentcloud-cos ✅
   4. 判断匹配度: tencentcloud-cos 完全匹配
   5. 行动: 调用 tencentcloud-cos 技能
   6. 结果: 技能完成了上传，并提供了完整的操作日志

✅ 符合规则: MCP 没有时正确使用 Skill
```

## 4.2 需要跳级使用通用方法的场景

> ⚠️ 以下特殊场景可以跳过 Skill/MCP，但必须说明原因

```yaml
场景1: Skill 不可用
   → 情况: Skill 工具暂时不可用或连接失败
   → 操作: 使用通用方法，但需要说明 "Skill 不可用，使用通用方法"

场景2: Skill 功能不完整
   → 情况: Skill 可以部分完成任务，但不完整
   → 操作: 用 Skill 完成部分，然后补充剩余部分

场景3: 紧急修复
   → 情况: 生产环境紧急故障，需要立即修复
   → 操作: 先修复，然后补充 Skill 调用（如果适用）

场景4: 用户明确拒绝
   → 情况: 用户明确说 "不用 Skill，我自己来"
   → 操作: 尊重用户选择，但提供 Skill 作为备选
```

---

# 第五章：MCP + Skill 调用标准 📋

## 5.1 调用时机

```yaml
✅ 必须调用 MCP 的时机:
   - 任务涉及 ECS 实例管理
   - 任务涉及桌面命令执行
   - 有适用的 MCP 工具

✅ 必须调用 Skill 的时机（MCP 没有时）:
   - 任务涉及已集成的 Skill 领域
   - 用户明确提到了相关关键词
   - 任务描述匹配 Skill 的适用场景

✅ 建议调用 MCP/Skill 的时机:
   - 不确定最优解决方案时
   - 任务复杂度较高时
   - 需要专业领域知识时

❌ 不需要调用 MCP/Skill 的时机:
   - 纯文本对话、信息查询
   - 文件浏览、路径确认
   - 规则咨询、流程确认
```

## 5.2 调用格式

```yaml
调用 MCP 时必须:
   ✅ 首先检查 MCP 是否可用
   ✅ 明确说明调用原因
   ✅ 说明匹配的 MCP 工具名称
   ✅ 等待 MCP 完成
   ✅ 整合 MCP 的输出

调用 Skill 时必须（MCP 没有时）:
   ✅ 明确说明调用原因
   ✅ 说明匹配的任务类型
   ✅ 等待 Skill 完成
   ✅ 整合 Skill 的输出

MCP 调用示例:
   "好的，这个任务涉及 ECS 实例查询，我将调用 mcp_ecs_describe_instances MCP 来处理..."
   → 调用 mcp_ecs_describe_instances MCP
   → 等待 MCP 完成
   → 整合结果返回给用户

Skill 调用示例（MCP 没有时）:
   "好的，这个任务涉及前端页面开发，我将调用 frontend-dev 技能来处理..."
   → 调用 frontend-dev 技能
   → 等待技能完成
   → 整合结果返回给用户
```

---

# 第六章：检查与监督 🔍

## 6.1 自我检查

> ⚠️ **每次回复前必须完成以下自我检查**

```yaml
□ 我理解任务了吗？
   → 如果不确定，先向用户确认

□ 任务涉及哪些关键词？
   → 列出关键词

□ 我检查过 MCP 列表了吗？（第一步）
   → 首先检查 MCP 工具是否可用
   → 如果任务涉及 ECS，优先看 mcp_ecs_* 系列

□ 我应该调用哪个 MCP？
   → 列出最匹配的 MCP 工具名称
   → 如果有匹配的 MCP，必须调用，不能跳过

□ 我检查过 Skill 列表了吗？（第二步，只有 MCP 没有时）
   → 如果 MCP 没有匹配的，才检查 Skill

□ 我应该调用哪个 Skill？
   → 列出最匹配的 Skill 名称
   → 如果 MCP 没有但 Skill 有，必须调用 Skill

□ 有没有更低的优先级方法？
   → 如果有 MCP/Skill 更简单，必须优先使用

□ 我使用了最高优先级的方法吗？
   → 如果没有，说明为什么
```

## 6.2 违规处理

```yaml
🚨 违反此规则的处罚:
   1. 轻度过失:
      → 提醒 Agent 调用正确优先级
      → 要求重新执行

   2. 中度过失:
      → 记录违规到规则遵守档案
      → 要求详细说明原因

   3. 严重过失:
      → 暂停任务执行
      → 要求重新培训规则理解
      → 记录到 Agent 绩效评估
```

---

# 第七章：快速参考卡 ⚡

## 7.1 决策速查

```yaml
遇到任务时的思考顺序:
   1️⃣ "有 MCP 吗？" → 如果有，用它（最高优先级）
   2️⃣ "有 Skill 吗？" → 如果有，用它（MCP 没有时）
   3️⃣ "有专用工具吗？" → 如果有，用它
   4️⃣ "必须用通用方法吗？" → 只有前三个都没有时才用

判断是否调用 MCP 的问题:
   ❓ 任务涉及 ECS 实例吗？ → 是 → 调用 mcp_ecs_describe_instances 等
   ❓ 任务涉及桌面命令吗？ → 是 → 调用 mcp_DesktopCommander_* 系列

判断是否调用 Skill 的问题（只有在 MCP 没有时）:
   ❓ 任务涉及前端/UI吗？ → 是 → 调用 frontend-dev
   ❓ 任务涉及后端/API吗？ → 是 → 调用 backend-dev
   ❓ 任务涉及错误调试吗？ → 是 → 调用 error-diagnostician
   ❓ 任务涉及云服务吗？ → 是 → 调用对应的云服务 Skill
   ❓ 任务涉及AI/模型吗？ → 是 → 调用 ai-lead
```

## 7.2 常见错误

```yaml
❌ "不需要检查 MCP，直接看 Skill"
   ✅ 正确: "必须首先检查 MCP，因为它优先级最高"

❌ "MCP/Skill 好像不太合适，我自己写吧"
   ✅ 正确: "MCP/Skill 可以处理这个，我将调用它"

❌ "直接用通用方法更快"
   ✅ 正确: "让我先检查 MCP 和 Skill 是否可用"

❌ "我忘了有 MCP 这回事"
   ✅ 正确: "这是我的失误，我将先调用 MCP"

❌ "MCP/Skill 功能有限"
   ✅ 正确: "MCP/Skill 可以完成主要功能，剩余部分我来补充"
```

---

# 第八章：与现有规则的关系 🔗

## 8.1 规则层级

```yaml
宪法级 (CORE_RULES.md):
   ↓ 包含
本规则 (skill_mcp_priority_rules.md):
   ↓ 优先于
技能调度规则 (skill_dispatch_rules.md):
   ↓ 包含
Agent 开发统一规范 (agent_development_rules.md)
```

## 8.2 规则冲突处理

```yaml
优先级顺序:
   1. CORE_RULES.md (宪法级)
   2. skill_mcp_priority_rules.md (本文件 - MCP优先)
   3. skill_dispatch_rules.md (技能调度)
   4. 其他规则文件

冲突解决:
   → 上级规则优先
   → 本规则与 CORE_RULES.md 冲突时，以 CORE_RULES.md 为准
   → 本规则与 skill_dispatch_rules.md 冲突时，以本规则为准（因为更严格）
   → 本规则强调 MCP > Skill > 专用工具 > 通用方法
```

## 8.3 MCP 优先原则说明

```yaml
MCP 优先原则:
   MCP 是模块化组件/流程，专为特定操作设计
   Skill 是通用的 Agent 技能，适合复杂任务
   MCP 更轻量、更快速、更精准
   Skill 更灵活、但优先级低于 MCP

简单理解:
   🥇 MCP = 专用工具（最快最准）
   🥈 Skill = 通用工具（稍慢但灵活）
   🥉 专用脚本 = 备选方案
   🛡️ 通用方法 = 万不得已才用
```

---

# 附录：MCP + Skill 完整清单（按优先级排序）

## A.1 MCP 清单（🥇 第一优先级）

### ECS 管理 MCP

| MCP 名称 | 用途 | 说明 |
|---------|------|------|
| `mcp_ecs_describe_instances` | 查询 ECS 实例列表 | 按地域、状态等条件查询实例 |
| `mcp_ecs_describe_system_events` | 查询系统事件 | ECS 运维事件、告警事件 |
| `mcp_ecs_describe_regions` | 查询地域列表 | 可用地域信息 |
| `mcp_ecs_describe_zones` | 查询可用区 | 指定地域下的可用区 |
| `mcp_ecs_describe_instance_types` | 查询实例规格 | 规格详细信息 |
| `mcp_ecs_describe_instance_type_families` | 查询规格族 | 实例规格族分类 |
| `mcp_ecs_describe_images` | 查询镜像 | 公共镜像、自定义镜像 |
| `mcp_ecs_describe_event_types` | 查询事件类型 | 支持的事件类型 |
| `mcp_ecs_describe_subscriptions` | 查询事件订阅 | 订阅列表和配置 |
| `mcp_ecs_describe_available_resource` | 查询可用资源 | 可购买资源检查 |
| `mcp_ecs_start_instances` | 启动实例 | 启动已停止的实例 |
| `mcp_ecs_stop_instances` | 停止实例 | 停止运行中的实例 |
| `mcp_ecs_reboot_instances` | 重启实例 | 重启实例 |
| `mcp_ecs_renew_instance` | 续费实例 | 包年包月续费 |
| `mcp_ecs_get_console_output` | 获取控制台输出 | 实例串口日志 |
| `mcp_ecs_get_console_screenshot` | 获取控制台截图 | 实例屏幕截图 |
| `mcp_ecs_update_system_events` | 更新系统事件 | 响应运维事件 |

### 桌面命令 MCP

| MCP 名称 | 用途 | 说明 |
|---------|------|------|
| `mcp_DesktopCommander_get_config` | 获取配置 | 获取桌面命令配置 |
| `mcp_DesktopCommander_set_config_value` | 设置配置 | 修改配置项 |
| `mcp_DesktopCommander_read_multiple_files` | 读取多个文件 | 批量文件读取 |
| `mcp_DesktopCommander_create_directory` | 创建目录 | 创建文件夹 |
| `mcp_DesktopCommander_move_file` | 移动文件 | 移动或重命名 |

## A.2 Skill 清单（🥈 第二优先级）

### 巡检宝专用 Skill

| Skill 名称 | 用途 | 优先级 |
|-----------|------|--------|
| `project-lead` | 项目全局管理 | ⭐⭐⭐ |
| `frontend-dev` | 前端开发 | ⭐⭐⭐ |
| `backend-dev` | 后端开发 | ⭐⭐⭐ |
| `frontend-lead` | 前端架构 | ⭐⭐⭐ |
| `backend-lead` | 后端架构 | ⭐⭐⭐ |
| `ai-lead` | AI 技术 | ⭐⭐⭐ |
| `devops-eng` | DevOps 运维 | ⭐⭐⭐ |
| `qa-lead` | 测试质量 | ⭐⭐⭐ |

### 通用 Skill

| Skill 名称 | 用途 | 优先级 |
|-----------|------|--------|
| `bug-fix` | Bug 修复 | ⭐⭐ |
| `debugging` | 系统调试 | ⭐⭐ |
| `error-diagnostician` | 错误诊断 | ⭐⭐ |
| `code-review` | 代码审查 | ⭐⭐ |
| `refactor` | 重构优化 | ⭐⭐ |
| `performance` | 性能优化 | ⭐⭐ |
| `security` | 安全审计 | ⭐⭐ |
| `documentation` | 文档编写 | ⭐⭐ |
| `testing` | 测试编写 | ⭐⭐ |
| `testing-strategy` | 测试策略 | ⭐⭐ |
| `architecture` | 架构设计 | ⭐⭐ |
| `architecture-design` | 架构设计 | ⭐⭐ |
| `database-design` | 数据库设计 | ⭐⭐ |
| `api-design` | API 设计 | ⭐⭐ |

### 第三方集成 Skill

| Skill 名称 | 用途 | 优先级 |
|-----------|------|--------|
| `xiaohongshu` | 小红书工具 | ⭐⭐ |
| `tencentcloud-cos` | 腾讯云存储 | ⭐⭐ |
| `tencent-survey` | 腾讯问卷 | ⭐⭐ |
| `tencent-news` | 腾讯新闻 | ⭐ |
| `github` | GitHub 操作 | ⭐⭐ |
| `open-source-fetcher` | 开源模板 | ⭐⭐ |
| `github-trending-cn` | GitHub 趋势 | ⭐ |
| `lark-unified` | 飞书工具 | ⭐⭐ |
| `cloudbase` | 腾讯云开发 | ⭐⭐ |
| `browser-use` | 浏览器自动化 | ⭐⭐ |

---

**最后更新**: 2026-04-07
**版本**: v1.0.0
**创建者**: Agent System

> ⚠️ 本规则是 Agent 执行的强制规范，违反将导致任务被拒绝或重新执行。
