---
name: project-dev
description: 巡检宝项目全局开发技能 - 所有开发任务必须调用此技能
---

# 巡检宝 - 全局开发技能

> **强制规则**：参与巡检宝项目开发的任何 Agent，必须严格遵守本技能的所有规范。

---

## 一、产品定位

### 一句话定位

```
面向重工业企业的智能监控平台，通过 OpenClaw AI Agent 和 YOLO 检测，
让监控从"被动观看"升级为"主动思考"。
```

### 三大支柱

| 支柱 | 说明 |
|------|------|
| **OpenClaw深度集成** | AI Agent能力融入监控全流程 |
| **YOLO智能检测** | 自动识别火灾、入侵、缺陷 |
| **企业级架构** | 多租户隔离、权限管理、数据安全 |

### 目标用户

- 重工业企业（矿山、石油化工、电力、制造业）
- 国企、高校
- 无人机用户（大疆司空2集成）

### 核心模块

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 数据大屏 | 多画面视频流实时监控 | P0 |
| 媒体库 | 企业级文件存储、权限管理 | P0 |
| 视频流接入 | 大疆司空2、RTSP、WebRTC、HLS | P0 |
| YOLO检测 | 火灾、裂缝、入侵、车辆识别 | P1 |
| OpenClaw | AI对话、报告生成、故障诊断 | P1 |
| 告警管理 | 告警规则、实时推送、处理流程 | P1 |

---

## 二、技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (React)                          │
│              React 18 + TypeScript + Tailwind               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Go)                           │
│  认证授权 | 路由转发 | WebSocket | 限流 | 请求日志          │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  业务服务     │  │  AI服务      │  │  媒体服务     │
│  (Go)        │  │  (Python)    │  │  (Go)        │
│              │  │              │  │              │
│ 用户/租户    │  │ YOLO检测     │  │ 文件上传      │
│ 视频流管理   │  │ OpenClaw     │  │ 视频转码      │
│ 告警/权限    │  │ 智能分析     │  │ 存储管理      │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Tailwind + Redux + Vite + pnpm |
| **后端** | Go 1.21+ + Gin + PostgreSQL + Redis + GORM + JWT |
| **AI服务** | Python 3.10+ + FastAPI + YOLOv8 + OpenCV + OpenClaw |

### 服务端口

| 服务 | 端口 |
|------|------|
| 前端 | 3000 |
| Go服务 | 8094 |
| Python AI服务 | 8095 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO | 9000 |
| OpenClaw | 8096 |
| Prometheus | 9090 |
| Grafana | 3001 |

---

## 三、TDD 开发方法论

### 核心原则

**TDD = Test Driven Development（测试驱动开发）**

```
Red (写测试) → Green (写代码) → Refactor (重构)
```

### 适用场景

| 场景 | 是否使用 TDD |
|------|-------------|
| 新功能开发 | ✅ 是 |
| Bug 修复 | ✅ 是 |
| 复杂业务逻辑 | ✅ 是 |
| 简单 CRUD | ⚠️ 可选 |
| 原型探索 | ❌ 否 |

### 执行流程

#### 第一步：写测试（Red）

```typescript
// 前端
describe('AlertService', () => {
  it('should fetch alerts with pagination', async () => {
    const result = await AlertService.getAlerts({ page: 1, pageSize: 20 });
    expect(result.items).toBeDefined();
  });
});
```

```go
// 后端
func TestAlertService_GetAlerts(t *testing.T) {
    svc := NewAlertService(mockRepo)
    alerts, err := svc.GetAlerts(context.Background(), 1, 20)
    assert.NoError(t, err)
    assert.NotNil(t, alerts)
}
```

#### 第二步：运行测试

```bash
pnpm test    # 前端
go test -v  # 后端
```

#### 第三步：写代码（Green）

- 写出能通过测试的最小代码
- 不要过度设计

#### 第四步：重构（Refactor）

- 改进代码质量
- 保持测试通过

---

## 四、Plan 模式使用指南

### 何时使用

| 使用 ✅ | 不使用 ❌ |
|--------|-----------|
| 新功能开发（涉及多模块） | 简单 Bug 修复 |
| 架构设计或重构 | 单一文件修改 |
| 数据库 schema 变更 | 已知解决方案的日常任务 |
| 多 Agent 协作任务 | 代码优化（不改变行为） |

### 执行流程

```
1. 触发 /plan 或任务复杂度较高时自动进入
2. Explore 探索代码库
3. Plan 设计实现方案
4. ExitPlanMode 获取批准
5. 实施
```

---

## 五、代码规范

### Go 规范

#### 命名

```go
package handler           // 包: 小写
type UserService struct {} // 结构体: PascalCase
type Repository interface {} // 接口: -er结尾
streamList := []Stream{} // 变量: camelCase
const MaxSize = 100      // 常量: PascalCase
```

#### 分层架构

```go
// Handler层 - 薄（只处理请求响应）
func (h *UserHandler) GetUser(c *gin.Context) {
    id := c.Param("id")
    user, err := h.userService.GetUserByID(c.Request.Context(), id)
    if err != nil {
        response.Error(c, err)
        return
    }
    response.Success(c, user)
}

// Service层 - 厚（业务逻辑）
func (s *UserService) GetUserByID(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, err
    }
    if user.Status == "disabled" {
        return nil, ErrUserDisabled
    }
    return user, nil
}

// Repository层 - 数据访问
func (r *UserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
    return &user, err
}
```

### Python 规范

#### 命名

```python
detection_service.py     # 模块: snake_case
class FireDetector:      # 类: PascalCase
def detect_fire(image):  # 函数/变量: snake_case
MAX_SIZE = 100          # 常量: UPPER_SNAKE_CASE
```

#### 服务结构

```python
# app/api/detection.py
@router.post("/detect")
async def detect(request: DetectionRequest, service: DetectionService = Depends()):
    result = await service.detect(request)
    return {"code": 200, "data": result}
```

### React/TypeScript 规范

#### 组件结构

```typescript
interface StreamCardProps {
  stream: Stream
  onClick?: () => void
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onClick }) => {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false)

  // 2. Effects
  useEffect(() => {}, [])

  // 3. Handlers
  const handleClick = () => onClick?.()

  // 4. Render
  return <div onClick={handleClick}>{stream.name}</div>
}
```

#### 命名

```typescript
VideoPlayer.tsx         // 组件: PascalCase
const streamList = []   // 变量: camelCase
const API_BASE_URL = '' // 常量: UPPER_SNAKE_CASE
```

---

## 六、禁止事项

### 架构禁止

```
❌ Go中直接调用YOLO（必须通过Python服务）
❌ Python中处理WebSocket连接
❌ 跨服务直接访问数据库
❌ 绕过API Gateway直接访问服务
```

### Go 禁止

```
❌ 循环内数据库查询（N+1问题）
❌ 忽略error返回值
❌ goroutine泄漏
❌ 硬编码敏感信息
❌ 在Handler处理业务逻辑
❌ 不使用上下文ctx
```

### Python 禁止

```
❌ 全局变量存储状态
❌ 阻塞主线程
❌ 未关闭文件句柄
❌ 硬编码敏感信息
```

### 前端禁止

```
❌ 使用 any 类型
❌ 硬编码API地址
❌ 使用 npm/yarn（必须用 pnpm）
❌ 直接操作 DOM
❌ 内联样式
```

---

## 七、质量标准

### Go 服务

| 指标 | 要求 |
|------|------|
| go vet | 通过 |
| golangci-lint | 通过 |
| 测试覆盖率 | > 70% |
| API响应 P95 | < 200ms |

### Python 服务

| 指标 | 要求 |
|------|------|
| black | 格式化 |
| mypy | 类型检查通过 |
| pytest覆盖率 | > 70% |
| YOLO推理 | < 100ms/帧 |

### 前端

| 指标 | 要求 |
|------|------|
| TypeScript | 无错误 |
| ESLint | 通过 |
| 测试覆盖率 | > 70% |
| 首屏加载 | < 3秒 |
| Lighthouse | > 90 |

---

## 八、API 规范

### URL 设计

```
GET    /api/v1/streams              # 获取列表
POST   /api/v1/streams              # 创建
GET    /api/v1/streams/:id          # 获取单个
PUT    /api/v1/streams/:id          # 更新
DELETE /api/v1/streams/:id          # 删除

# 嵌套资源
GET    /api/v1/streams/:id/alerts   # 获取视频流的告警
POST   /api/v1/streams/:id/snapshot # 获取截图
POST   /api/v1/streams/:id/control  # 云台控制

# 动作
POST   /api/v1/alerts/:id/resolve   # 处理告警
POST   /api/v1/alerts/:id/assign    # 认领告警
```

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-03-15T10:30:00Z"
}

// 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 200 | 200 | 成功 |
| 201 | 201 | 创建成功 |
| 204 | 204 | 删除成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证 |
| 403 | 403 | 无权限 |
| 404 | 404 | 资源不存在 |
| 500 | 500 | 服务器内部错误 |

---

## 九、项目结构

```
xunjianbao/
├── app/                        # 前端 (React)
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── routes/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
│
├── server/                     # Go 后端服务
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── handler/
│   │   ├── service/
│   │   ├── repository/
│   │   └── model/
│   └── pkg/
│
├── ai-service/                 # Python AI 服务
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   └── models/
│   └── requirements.txt
│
├── deploy/                     # 部署配置
├── docs/                       # 文档
└── .trae/
    ├── rules/project_rules.md
    └── skills/
```

---

## 十、快速命令

```bash
# 前端
cd app && pnpm dev

# Go服务
cd server && go run cmd/server/main.go

# Python服务
cd ai-service && uvicorn app.main:app --reload

# Docker
docker-compose up -d

# 测试
pnpm test            # 前端测试
go test -v ./...     # 后端测试
pytest tests/ -v     # AI 服务测试
```

---

## 十一、Agent 团队角色

| Agent | 职责 | Skill 文件 |
|-------|------|------------|
| **project-lead** | 全局把控、技术决策、团队协调 | project-lead/SKILL.md |
| **frontend-lead** | 前端架构、核心开发、代码审查 | frontend-lead/SKILL.md |
| **frontend-dev** | 页面开发、功能实现、问题修复 | frontend-dev/SKILL.md |
| **backend-lead** | 后端架构、API设计、数据库设计 | backend-lead/SKILL.md |
| **backend-dev** | API开发、业务逻辑、单元测试 | backend-dev/SKILL.md |
| **ai-lead** | AI架构、YOLO集成、模型优化 | ai-lead/SKILL.md |
| **openclaw-eng** | OpenClaw集成、工具集开发、Agent开发 | openclaw-eng/SKILL.md |
| **devops-eng** | 环境管理、CI/CD、监控部署 | devops-eng/SKILL.md |
| **qa-lead** | 测试策略、测试执行、质量保障 | qa-lead/SKILL.md |

---

## 十二、核心记忆

```
Go = 业务 + 视频流 + WebSocket
Python = AI + YOLO + OpenClaw
React = 前端UI

TDD = 先写测试再写代码
Plan = 复杂任务先用计划模式

各取所长，不纠结
架构禁止 = 安全底线
测试覆盖 = 质量底线
```

---

**最后更新**: 2026年4月