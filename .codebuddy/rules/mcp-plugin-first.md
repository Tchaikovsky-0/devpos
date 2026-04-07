---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:45:34.340Z
provider: 
---

# MCP 工具与插件优先规则

> **规则级别**: 强制 (MUST) — 与宪法级规则同等效力
> **适用对象**: 所有 CodeBuddy Agent，覆盖一切工作场景
> **最后更新**: 2026-04-07

---

## 一、核心原则

```
工具优先，拒绝裸奔。
能调 MCP 不手写，能调插件不通用。
```

**一句话**：在执行任何任务之前，Agent 必须先扫描可用的 MCP 工具和已加载插件/技能，优先使用专业工具完成工作，而非依赖自身通用能力从零手写或凭记忆处理。

---

## 二、决策流程

每次收到任务时，严格按以下顺序执行：

```
任务进入
  │
  ▼
[Step 1] 扫描可用 MCP 工具 ──→ 有匹配？──→ 调用 MCP 工具
  │                                     │
  │ 无                                 完成任务
  ▼
[Step 2] 扫描可用插件/技能 ──→ 有匹配？──→ 调用插件/技能
  │                                     │
  │ 无                                 完成任务
  ▼
[Step 3] 搜索 knowledge base ──→ 有匹配？──→ 参考知识库输出
  │                                     │
  │ 无                                 完成任务
  ▼
[Step 4] 仅当以上均不覆盖时，才使用通用能力处理
```

---

## 三、MCP 工具优先级

### 3.1 必须优先使用的 MCP 工具

以下 MCP 工具在对应场景下**必须优先于通用方法**：

| 场景 | 优先 MCP 工具 | 禁止的替代做法 |
|------|-------------|---------------|
| 股票/金融数据查询 | `get_hist_data`, `get_realtime_data`, `get_financial_metrics` | 手动 web_search 爬取财经网站 |
| 公司财务报表 | `get_balance_sheet`, `get_income_statement`, `get_cash_flow` | 让用户手动查财报 |
| 新闻/舆情数据 | `get_news_data` | 手动搜索新闻聚合站 |
| CloudBase 环境管理 | `envQuery`, `envDomainManagement` | 手动登录腾讯云控制台 |
| CloudBase 数据库操作 | `readNoSqlDatabaseStructure`, `querySqlDatabase` | 手动写 SQL 让用户执行 |
| CloudBase 云函数管理 | `queryFunctions`, `manageFunctions` | 手动部署脚本 |
| CloudBase 静态托管 | `uploadFiles`, `deleteFiles`, `findFiles` | 手动上传 COS |
| CloudBase 云存储 | `queryStorage`, `manageStorage` | 手动管理存储桶 |
| CloudBase 身份认证 | `auth`, `callCloudApi` | 手动配置控制台 |
| TDesign 组件查询 | `get-component-list`, `get-component-docs`, `get-component-dom` | 凭记忆写组件 API |
| 联网信息检索 | `searchWeb` (MCP) 优于 web_search | 仅在 MCP 不可用时降级 |

### 3.2 调用前必须做的事

调用任何 MCP 工具前，**必须**先通过 `mcp_get_tool_description` 获取工具的参数 schema，确保参数正确后再调用。

```
mcp_get_tool_description → mcp_call_tool
```

禁止凭记忆猜测 MCP 工具的参数名和格式。

---

## 四、插件/技能优先级

### 4.1 必须优先使用的插件能力

| 场景 | 优先插件 | 触发关键词 |
|------|---------|-----------|
| 数据分析与可视化 | `data-analysis-workflows` | 分析、图表、统计、报表、dashboard |
| Excel 文件处理 | `Excel 文件处理` | excel、表格、xlsx、csv |
| PDF 文档生成 | `PDF 文档生成` | pdf、报告导出、简历、提案 |
| Word 文档生成 | `Word 文档生成` | word、docx、文档 |
| PPT 演示文稿 | `PPT 演示文稿` | ppt、演示文稿、幻灯片 |
| 前端开发 | `前端开发` | 页面、组件、UI、前端 |
| 全栈开发 | `全栈开发` | API + 前端、全栈、CRUD 应用 |
| React Native 开发 | `React Native 开发` | 移动端、iOS、Android、expo |
| 产品管理 | `product-management-workflows` | PRD、路线图、竞品分析、需求文档 |
| 设计转代码 | `design-to-code-workflows` | Figma、截图转代码、设计稿 |
| 金融分析 | `bond-futures-basis`, `fx-carry-trade` 等 | 债券、外汇、期权、衍生品 |
| CloudBase 开发 | `cloudbase` | 云开发、云函数、云数据库、托管 |
| 内容创作 | `内容工厂`, `内容分发` | 社交媒体、内容、文案 |
| 深度研究 | `deep-research` | 调研、深度分析、研究报告 |
| 代码重构 | `refactor` | 重构、代码优化、设计改进 |
| 调试诊断 | `debugging` | bug、报错、异常、调试 |
| 性能优化 | `performance-optimization` | 慢、性能、优化、内存 |
| GitHub 操作 | `github` | issue、PR、CI/CD、release |

### 4.2 技能调用铁律

1. **有匹配技能时，禁止不调用直接动手**
2. **禁止询问"是否需要使用技能"**，直接自动调用
3. **技能调用后必须完整遵循其指导**，禁止部分执行
4. **禁止以"任务简单"为由跳过技能** — 即使任务看起来简单，技能可能包含你不知道的专业规范或最佳实践

---

## 五、知识库优先

### 5.1 以下场景优先查询知识库

在编写涉及以下领域的代码或文档前，**必须先通过 `RAG_search` 查询知识库**获取最新官方文档：

| 知识库 | 适用场景 |
|--------|---------|
| 腾讯云API | 腾讯云产品 API 调用 |
| 微信云开发 | 云开发架构、云函数、数据库 |
| 腾讯云实时音视频 | TRTC 音视频功能集成 |
| TDesign | TDesign 组件使用、API、最佳实践 |
| 微信支付 | 支付接口、商户平台对接 |
| 微信小程序 | 小程序开发、审核、发布 |
| 微信小游戏 | 小游戏开发、广告、支付 |
| 腾讯地图小程序 | 地图组件、定位、路线规划 |

### 5.2 降级条件

仅当以下情况同时满足时，才允许不查询知识库：
- 知识库返回无相关结果
- Agent 对该领域有高度确定的近期经验
- 任务极其简单且无歧义

---

## 六、禁止行为

```yaml
严禁:
  - 有 MCP 工具可用却用 web_search 或手写替代
  - 有插件技能覆盖却用通用方法从零处理
  - 有知识库文档却凭记忆或幻觉输出
  - 不查 MCP 工具 schema 就凭猜测调用
  - 以"任务简单"、"赶时间"为由跳过工具/技能

严重违规示例:
  - 需要查股票数据 → 不调用 get_realtime_data，而是 web_search "贵州茅台 股价"
  - 需要 TDesign 组件文档 → 不调用 get-component-docs，而是凭记忆写 API
  - 需要创建 PDF 报告 → 不调用 PDF 技能，而是输出纯 Markdown 文本
  - 需要部署 CloudBase → 不调用 MCP 工具，而是生成 CLI 命令让用户手动执行
  - 需要写小程序代码 → 不查询微信小程序知识库，而是凭旧版本记忆编写
```

---

## 七、例外情况

以下情况允许使用通用能力：

1. MCP 工具报错或不可用时，允许降级为 web_search 或通用方法
2. 插件/技能加载失败时，允许降级（但必须在回复中说明降级原因）
3. 用户明确要求不使用某工具/技能时，遵从用户意愿
4. 任务是对工具/技能本身的开发、测试或修复时

降级时必须声明：
```
⚠️ [降级说明] MCP 工具 xxx 不可用，降级使用 web_search 处理。
```

---

## 八、与现有规则的关系

本规则是 `skill-dispatch-rules.md` 和 `auto-skill-invocation.md` 的**上位规则**：

- `skill-dispatch-rules.md`：定义项目内 Agent 间的技能调度
- `auto-skill-invocation.md`：定义特定技能的自动触发条件
- **本规则**：定义 MCP 工具、插件能力和知识库的优先使用，覆盖更广泛的工具层

当存在冲突时，本规则优先级最高。

---

**规则制定**: 用户指令
**生效日期**: 2026-04-07
**适用范围**: 所有 CodeBuddy Agent，所有工作场景