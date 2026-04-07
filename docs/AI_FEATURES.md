# 巡检宝 AI 功能使用指南

> 版本：v2.0.0
> 日期：2026-04-03
> OpenClaw 深度集成版本

## 核心 AI 功能

巡检宝基于 OpenClaw AI Agent 提供四大杀手锏功能：

| 功能 | 说明 | 优先级 |
|------|------|--------|
| AI 值班分析师 | 7x24 小时智能告警分析 | P0 |
| 一键报告生成 | 日/周/月报自动生成 | P0 |
| 智能运维问答 | NL2SQL + RAG 知识库问答 | P0 |
| 多租户 AI 配置 | 按企业配置模型和工具权限 | P0 |
| 预测性维护 | 设备健康预测与故障预警 | P1 |

## 功能详情

### 1. AI 值班分析师

**路由**: `/monitor` (Monitor 页面 AI Tab)

**功能**:
- 新告警自动触发 AI 分析
- 相似历史告警检索
- 故障原因分析
- 处置建议生成
- 支持核销/转工单/通知操作

**API 端点**:
```
POST /api/v1/ai/oncall/analyze/:alert_id  - 触发分析
GET  /api/v1/ai/oncall/analysis/:alert_id - 获取分析结果
GET  /api/v1/ai/oncall/analysis/:alert_id/stream - SSE 流式推送
```

### 2. 一键报告生成

**路由**: `/reports` (报告管理页面)

**功能**:
- 日报/周报/月报/自定义报告
- 自动采集告警统计、设备健康、维护记录
- OpenClaw AI 填充报告内容
- 支持 PDF 导出

**API 端点**:
```
POST /api/v1/ai/reports/generate - 生成报告
GET  /api/v1/ai/reports          - 获取报告列表
GET  /api/v1/ai/reports/:id      - 获取报告详情
GET  /api/v1/ai/reports/:id/download - 下载报告
DELETE /api/v1/ai/reports/:id    - 删除报告
GET  /api/v1/ai/reports/templates - 获取报告模板
```

### 3. 智能运维问答

**路由**: `/monitor` (Monitor 页面 AI Tab)

**功能**:
- 自然语言查询数据库 (NL2SQL)
- RAG 知识库问答
- 意图自动识别
- 统计查询结果表格展示

**意图类型**:
- `query_stat` - 统计查询 (如 "过去一周有多少条告警")
- `knowledge_qa` - 知识问答 (如 "如何处理设备离线")
- `operation` - 操作指令 (如 "帮我创建一个工单")
- `general` - 通用问答

**API 端点**:
```
POST /api/v1/ai/qa/chat    - 智能问答入口
GET  /api/v1/ai/qa/intent - 意图检测
GET  /api/v1/ai/qa/tables - 获取允许查询的表
```

### 4. 多租户 AI 配置

**路由**: `/admin` (管理页面 AI 配置 Tab)

**功能**:
- 按租户配置 AI 模型 (对话/分析/报告)
- 功能开关 (自动告警分析、自动报告、NL2SQL、语音)
- 工具权限管理
- 每日查询次数限制
- 报告接收人配置

**AI 模型选择**:
- 对话模型: qwen-turbo / qwen-plus / qwen-max / claude-3-haiku / claude-3-sonnet / gpt-4o-mini / gpt-4o
- 分析模型: 同上
- 报告模型: 同上

**可用工具**:
- `get_device_info` - 获取设备信息
- `get_alert_history` - 获取告警历史
- `get_tenant_config` - 获取租户配置
- `query_knowledge_base` - 查询知识库
- `run_nl2sql_query` - 执行 NL2SQL 查询

**API 端点**:
```
GET  /api/v1/ai/config          - 获取当前租户配置
PUT  /api/v1/ai/config          - 更新当前租户配置
GET  /api/v1/admin/ai/configs  - 获取所有租户配置 (管理员)
PUT  /api/v1/admin/ai/configs/:tenant_id - 更新指定租户配置 (管理员)
```

### 5. 预测性维护

**路由**: `/monitor` (Monitor 页面 Health Tab)

**功能**:
- 设备健康评分 (0-100)
- 故障概率预测
- 预测下次维护时间
- 风险设备识别
- 维护计划建议

**API 端点**:
```
GET  /api/v1/ai/predict-health       - 获取所有设备健康预测
GET  /api/v1/ai/predict-health/:device_id - 获取单个设备预测
GET  /api/v1/ai/health-report        - 获取健康报告
POST /api/v1/ai/predict-health/refresh - 刷新预测
```

## OpenClaw 集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                     巡检宝 Go 后端                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ OnCall     │  │ Report      │  │ QA          │          │
│  │ Analyst    │  │ Generator   │  │ Handler     │          │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘          │
│         │               │               │                  │
│  ┌──────┴───────────────┴───────────────┴─────┐            │
│  │         OpenClaw Service                   │            │
│  │  (Go Client - /pkg/openclaw/client.go)    │            │
│  └──────────────────┬───────────────────────┘            │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP (tenant_id header)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenClaw AI Agent                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Tools:     │  │ RAG:       │  │ NL2SQL:    │          │
│  │ get_device │  │ knowledge   │  │ query      │          │
│  │ get_alert  │  │ base       │  │ database   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 环境变量配置

```bash
# OpenClaw 服务
OPENCLAW_URL=http://localhost:8096
OPENCLAW_TOKEN=your-openclaw-token

# 数据库 (MySQL)
DATABASE_URL=root:password@tcp(localhost:3306)/xunjianbao

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-at-least-32-characters
```

## Docker 部署

```yaml
# docker-compose.yaml
services:
  backend:
    environment:
      OPENCLAW_URL: ${OPENCLAW_URL:-http://openclaw:8096}
      OPENCLAW_TOKEN: ${OPENCLAW_TOKEN:-}

  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "8096:8096"
```

## 快速开始

### 1. 启动 OpenClaw (本地开发)

```bash
# 安装 OpenClaw
npm install -g @openclaw/cli

# 启动 OpenClaw
openclaw dev
```

### 2. 启动后端

```bash
cd backend

# 设置环境变量
export DATABASE_URL="root:password@tcp(localhost:3306)/xunjianbao"
export JWT_SECRET="your-jwt-secret-at-least-32-chars"
export OPENCLAW_URL="http://localhost:8096"
export OPENCLAW_TOKEN="your-token"

# 启动服务
go run cmd/server/main.go
```

### 3. 启动前端

```bash
cd frontend
pnpm dev
```

### 4. 访问 AI 功能

- AI 值班分析师: http://localhost:3000/monitor
- 报告管理: http://localhost:3000/reports
- AI 配置: http://localhost:3000/admin (需要管理员权限)

## 知识库配置

RAG 知识库位于 `backend/internal/service/knowledge_base_rag_service.go`

当前包含领域知识:
- 矿山安全规程
- 化工安全规范
- 电力巡检标准
- 设备故障诊断

如需添加自定义知识，修改上述文件中的 `DefaultKnowledgeBase` 变量。

## 技术支持

如有问题，请联系开发团队。
