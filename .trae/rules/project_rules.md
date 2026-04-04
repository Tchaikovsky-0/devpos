# 巡检宝项目规则 - 全局开发规范

> **核心方法论**: TDD (测试驱动开发) + Plan (计划模式)

---

## 一、产品定位

```
面向重工业企业的智能监控平台，通过 OpenClaw AI Agent 和 YOLO 检测，
让监控从"被动观看"升级为"主动思考"。

三大支柱:
├── OpenClaw深度集成 → AI Agent能力融入监控全流程
├── YOLO智能检测 → 自动识别火灾、入侵、缺陷
└── 企业级架构 → 多租户隔离、权限管理、数据安全
```

### 核心模块优先级

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 数据大屏 | 多画面视频流实时监控 | P0 |
| 媒体库 | 企业级文件存储、权限管理 | P0 |
| 视频流接入 | 大疆司空2、RTSP、WebRTC | P0 |
| YOLO检测 | 火灾、入侵、缺陷识别 | P1 |
| OpenClaw | AI对话、报告生成 | P1 |
| 告警管理 | 告警规则、实时推送 | P1 |

---

## 二、技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (React)                          │
│              React 18 + TypeScript + Tailwind               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Go)                           │
│  认证授权(JWT) | 路由转发 | WebSocket管理 | 限流熔断         │
└─────────────────────────┬───────────────────────────────────┘
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  业务服务(Go) │  │  AI服务(Python)│  │  媒体服务(Go) │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript | 禁止使用 any |
| 样式 | Tailwind CSS + Shadcn UI | 原子类优先 |
| 构建 | Vite + pnpm | 禁止 npm/yarn |
| 后端 | Go 1.21+ + Gin | - |
| 数据库 | PostgreSQL 14+ + Redis 6+ | - |
| AI服务 | Python 3.10+ + FastAPI | YOLO/OpenCV |

### 服务端口

```yaml
前端: 3000 | Go服务: 8094 | Python AI: 8095
PostgreSQL: 5432 | Redis: 6379 | MinIO: 9000
```

---

## 三、TDD开发方法论

```
TDD红绿重构循环:
1. 写测试(Red) → 明确预期行为，测试失败
2. 写代码(Green) → 最小实现，让测试通过
3. 重构(Refactor) → 改进代码，保持测试通过
```

### TDD适用场景

| 场景 | 是否使用 | 原因 |
|------|---------|------|
| 新功能开发 | ✅ 是 | 明确需求、保证质量 |
| Bug修复 | ✅ 是 | 防止回归、验证修复 |
| 复杂业务逻辑 | ✅ 是 | 减少调试时间 |
| 简单CRUD | ⚠️ 可选 | ROI不高 |
| 原型探索 | ❌ 否 | 需求不明确 |

---

## 四、Plan模式使用指南

### 何时使用

```yaml
✅ 使用:
  - 新功能开发（涉及多个模块）
  - 架构设计或重构
  - 数据库schema变更
  - API接口设计
  - 多Agent协作任务

❌ 不使用:
  - 简单Bug修复（已知根因）
  - 单一文件修改
  - 已知解决方案的日常任务
```

### Plan输出格式

```markdown
# [功能名称] 实现计划

## Context - 为什么需要这个功能
## 方案设计 - 多种方案及权衡
## 实施步骤 - 具体文件修改
## 验证方法 - 测试命令和预期结果
```

---

## 五、代码规范

### Go代码规范

```go
// 命名规范
package handler          // 包名：简短小写
type UserService struct{} // 结构体：PascalCase
type UserRepository interface{} // 接口：以er结尾

// 分层架构
// Handler层 - 处理请求响应（薄）
// Service层 - 业务逻辑（厚）
// Repository层 - 数据访问

// 错误处理
if err != nil {
    return nil, fmt.Errorf("get user failed: %w", err)
}
```

### Python代码规范

```python
# 模块：snake_case | 类：PascalCase | 函数/变量：snake_case
# 常量：UPPER_SNAKE_CASE

class DetectionService:
    def detect(self, request):
        detections = self.yolo.predict(request.image)
        return {"detections": detections}
```

### React/TypeScript代码规范

```typescript
// 组件：PascalCase | 变量/函数：camelCase | 常量：UPPER_SNAKE_CASE
// 禁止使用any类型

interface StreamCardProps {
  stream: Stream
  onClick?: () => void
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  return <div onClick={onClick}>{stream.name}</div>
}
```

---

## 六、API规范

### URL设计

```
GET    /api/v1/streams              # 获取列表
POST   /api/v1/streams              # 创建
GET    /api/v1/streams/:id          # 获取单个
PUT    /api/v1/streams/:id          # 更新
DELETE /api/v1/streams/:id          # 删除
GET    /api/v1/streams/:id/alerts   # 嵌套资源
POST   /api/v1/alerts/:id/resolve   # 动作
```

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-03-15T10:30:00Z"
}
```

---

## 七、禁止事项

```yaml
架构禁止:
  ❌ Go中直接调用YOLO（必须通过Python服务）
  ❌ Python中处理WebSocket连接
  ❌ 跨服务直接访问数据库
  ❌ 绕过API Gateway直接访问服务

代码禁止:
  Go: 循环内数据库查询 | 忽略error | goroutine泄漏 | 硬编码敏感信息
  Python: 全局变量存储状态 | 阻塞主线程 | 未关闭文件句柄
  前端: 使用any类型 | 硬编码API地址 | 使用npm/yarn
```

---

## 八、质量标准

```yaml
Go服务:
  - go vet通过 | golangci-lint通过 | 单元测试覆盖率>70%
  - API响应P95<200ms | WebSocket连接>10000 | 内存<500MB

Python服务:
  - black格式化 | mypy类型检查 | pytest覆盖率>70%
  - YOLO推理<100ms | GPU利用率>80%

前端:
  - TypeScript无错误 | ESLint通过 | 测试覆盖率>70%
  - 首屏<3秒 | Lighthouse>90
```

---

## 九、项目结构

```
xunjianbao/
├── app/                    # 前端(React)
│   └── src/{api,components,routes,store,utils}
├── server/                 # Go后端
│   ├── cmd/server/main.go  # 入口
│   └── internal/{handler,service,repository,model}
├── ai-service/             # Python AI服务
│   └── app/{api,services,models}
├── deploy/                 # 部署配置
└── .trae/rules/            # 项目规则
```

---

## 十、快速命令

```bash
# 前端: cd app && pnpm dev
# Go服务: cd server && go run cmd/server/main.go
# Python服务: cd ai-service && uvicorn app.main:app --reload
# 测试: pnpm test | go test -v ./...
```

---

## 十一、专项规范索引

| 规范 | 说明 | 优先级 |
|------|------|--------|
| [全局开发规则](./global_dev_rules.md) | TDD、Plan模式、代码质量规范 | P0 |
| [前端稳定性规则](./frontend_stability_rules.md) | 错误预防、调试流程、监控告警 | P0 |
| [安全规范](./security_rules.md) | 认证授权、数据安全 | P0 |
| [数据库规范](./database_rules.md) | 表设计、索引优化 | P0 |
| [视频流规范](./video_stream_rules.md) | 接入协议、播放存储 | P0 |
| [版本管理规范](./version_control_rules.md) | Git Flow、Commit规范 | P0 |
| [技能调度规则](./skill_dispatch_rules.md) | 智能任务分析、技能精准调用 | P0 |
| [Agent开发统一规范](./agent_development_rules.md) | Agent通信协议、代码模板、工作流程 | P0 |
| [AI检测规范](./ai_detection_rules.md) | 模型管理、检测策略 | P1 |
| [告警规范](./alert_rules.md) | 分级、收敛、处理 | P1 |
| [前端性能规范](./frontend_performance_rules.md) | 渲染优化、资源优化 | P1 |
| [测试规范](./testing_rules.md) | 单元测试、集成测试 | P1 |
| [Code Review规范](./code_review_rules.md) | Review流程、检查清单 | P1 |

---

## 十二、多Agent使用指南

```
巡检宝项目配置了10个专业Agent，逻辑严密、环环相扣：

入口层: @skill-dispatcher (技能调度中心) - 所有任务的入口，自动分析任务类型并精准调度
         └─→ /dispatch 或 /skill-dispatch

决策层: @project-lead (项目总负责人) - 全局把控、技术决策、架构审批
         └─→ /lead 或 /pm

Lead层: @frontend-lead, @backend-lead, @ai-lead - 各领域架构设计和代码审查
         └─→ /fe-lead, /be-lead, /ai-lead

Dev层: @frontend-dev, @backend-dev, @openclaw-eng - 各领域功能执行和交付
         └─→ /fe-dev, /be-dev, /openclaw

支撑层: @devops-eng, @qa-lead - 平台运维和质量保障
         └─→ /devops, /qa

团队编队 (5个 Squad):
  前端 Squad: frontend-lead + frontend-dev
  后端 Squad: backend-lead + backend-dev
  AI Squad: ai-lead + openclaw-eng
  平台 Squad: devops-eng
  质量 Squad: qa-lead

⚠️ 重要：
1. 所有开发任务开始前，必须先调用 skill-dispatcher 分析任务类型！
2. Agent间协作必须遵循 Agent开发统一规范 (JSON消息格式、Handoff协议)
3. 代码跨Agent修改必须通过 PR + Code Review，禁止直接修改
```

### Agent调用层级

```
用户请求
    ↓
skill-dispatcher 分析任务类型
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 简单任务 → 直接调度到对应 Dev Agent                         │
│ 复杂任务 → project-lead 决策 → Lead 拆解 → Dev 执行         │
│ 架构任务 → project-lead 审批 → Lead 设计 → Dev 实现         │
│ Bug修复   → qa-lead 定位 → 对应 Dev 修复 → Lead 审查 → qa 验证 │
└─────────────────────────────────────────────────────────────┘
```

### Agent协作规范

> **所有Agent协作必须遵循 [Agent开发统一规范](./agent_development_rules.md)**

**核心要求：**

```
✅ 必须遵循:
  - 统一的消息格式 (JSON)
  - 标准化的任务交接协议 (Handoff)
  - 规范的错误报告格式
  - 代码生成使用统一模板
  
✅ 禁止行为:
  - Agent间直接修改对方代码
  - 跳过代码审查
  - 不遵循通信协议
```

### Agent通信示例

```json
// 任务分配
{
  "type": "task",
  "from": "project-lead",
  "to": "backend-dev",
  "payload": {
    "task_id": "XJ-2024-001",
    "title": "实现用户管理API",
    "priority": "P0",
    "acceptance_criteria": ["✓ 支持CRUD", "✓ 分页查询", "✓ 权限控制"]
  }
}

// 状态更新
{
  "type": "status",
  "from": "backend-dev",
  "to": "all",
  "payload": {
    "task_id": "XJ-2024-001",
    "status": "in_progress",
    "progress": "50%"
  }
}

// 错误报告
{
  "type": "error",
  "from": "frontend-dev",
  "to": "backend-lead",
  "payload": {
    "error_code": "ERR_API_001",
    "severity": "P1",
    "message": "用户列表接口响应超时"
  }
}
```

### 典型使用场景

```
新功能开发:
1. @project-lead 规划功能
2. @backend-lead 设计API
3. @backend-dev 实现API
4. @frontend-lead 设计组件
5. @frontend-dev 实现页面
6. @qa-lead 编写测试

Bug修复:
1. @qa-lead 发现Bug
2. @backend-dev/@frontend-dev 修复
3. @qa-lead 验证修复

任务交接 (Handoff):
当任务从一个Agent转移到另一个时，必须使用标准Handoff格式，包含：
- 已完成的工作
- 剩余工作
- 涉及的文件
- 待解答的问题
```

---

**最后更新**: 2026年4月
