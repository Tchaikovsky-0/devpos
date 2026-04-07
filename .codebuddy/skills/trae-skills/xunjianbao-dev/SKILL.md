---
name: "xunjianbao-dev"
description: "巡检宝项目全局开发技能 - 所有开发任务必须调用此技能"
---

# 巡检宝项目 - 全局开发技能

> **强制规则**：参与巡检宝项目开发的所有 Agent，必须严格遵守本技能的所有规范。

---

## 一、产品认知

### 一句话定位

```
"面向重工业企业的智能监控平台，通过 OpenClaw AI Agent 和 YOLO 检测，
让监控从'被动观看'升级为'主动思考'。"
```

### 三大支柱

```
├── OpenClaw深度集成 → AI Agent能力融入监控全流程
├── YOLO智能检测 → 自动识别火灾、入侵、缺陷
└── 企业级架构 → 多租户隔离、权限管理、数据安全
```

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

## 二、技术架构（Go + Python 混合）

```
┌─────────────────────────────────────────────────────┐
│                  前端层 (React)                      │
│              React 18 + TypeScript + Tailwind       │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/WebSocket
                      ▼
┌─────────────────────────────────────────────────────┐
│               API Gateway (Go)                       │
│  认证 | 路由 | WebSocket | 限流 | 日志              │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  业务服务     │ │  AI服务      │ │  媒体服务     │
│  (Go)        │ │  (Python)    │ │  (Go)        │
│              │ │              │ │              │
│ 用户/租户    │ │ YOLO检测     │ │ 文件上传     │
│ 视频流管理   │ │ OpenClaw     │ │ 视频转码     │
│ 告警/权限    │ │ 智能分析     │ │ 存储管理     │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 技术栈速查

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Tailwind CSS + Redux + pnpm |
| **Go服务** | Go 1.21+ + Gin + PostgreSQL + Redis + GORM |
| **Python服务** | Python 3.10+ + FastAPI + YOLOv8 + OpenCV + OpenClaw |

### 服务端口

```
前端: 3000
Go服务: 8094
Python AI服务: 8095
OpenClaw: 8096
PostgreSQL: 5432
Redis: 6379
MinIO: 9000
Prometheus: 9090
Grafana: 3001
```

---

## 三、TDD 开发方法论

### 核心原则

```
TDD = Test Driven Development (测试驱动开发)

Red (写测试) → Green (写代码) → Refactor (重构)
```

### TDD 执行流程

**第一步：写测试（Red）**

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

**第二步：运行测试验证失败**

```bash
pnpm test    # 前端
go test -v  # 后端
pytest -v   # Python
```

**第三步：写代码（Green）**

- 写出能通过测试的最小代码
- 不要过度设计

**第四步：重构（Refactor）**

- 改进代码质量
- 保持测试通过

---

## 四、Plan 模式使用指南

### 何时使用

```
✅ 新功能开发（涉及多模块）
✅ 架构设计或重构
✅ 数据库 schema 变更
✅ 多 Agent 协作任务

❌ 简单 Bug 修复
❌ 单一文件修改
❌ 已知解决方案的日常任务
```

### 执行流程

```
1. 触发 /plan 或任务复杂度较高时自动进入
2. Explore 探索代码库
3. Plan 设计实现方案
4. ExitPlanMode 获取批准
5. 实施
```

---

## 五、Agent 团队角色

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

### Agent 协作矩阵

```
                    ┌─────────────┐
                    │ Project Lead│
                    └──────┬──────┘
           ┌────────────┼────────────┐
           │            │            │
    ┌──────┴──────┐ ┌┴────────┐ ┌─┴──────┐
    │Frontend Lead │ │AI Lead  │ │DevOps  │
    └──────┬──────┘ └───┬─────┘ └───┬────┘
           │            │            │
    ┌──────┴──────┐ ┌┴────────┐ ┌─┴──────┐
    │Frontend Dev │ │OpenClaw │ │QA Lead │
    └─────────────┘ └─────────┘ └────────┘
                          │
                   ┌──────┴──────┐
                   │ Backend Lead│
                   └──────┬──────┘
                          │
                   ┌──────┴──────┐
                   │ Backend Dev │
                   └─────────────┘
```

---

## 六、代码规范速查

### Go命名

```go
package handler           // 包: 小写
type UserService struct {} // 结构体: PascalCase
type Repository interface {} // 接口: -er结尾
streamList := []Stream{} // 变量: camelCase
const MaxSize = 100      // 常量: PascalCase
```

### 分层架构

```go
// Handler层 - 薄
func (h *UserHandler) GetUser(c *gin.Context) {
    user, err := h.userService.GetUserByID(c.Request.Context(), id)
    if err != nil {
        response.Error(c, err)
        return
    }
    response.Success(c, user)
}

// Service层 - 厚
func (s *UserService) GetUserByID(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, err
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

### Python命名

```python
detection_service.py     # 模块: snake_case
class FireDetector:      # 类: PascalCase
def detect_fire(image):  # 函数/变量: snake_case
MAX_SIZE = 100          # 常量: UPPER_SNAKE_CASE
```

### 前端命名

```typescript
VideoPlayer.tsx         // 组件: PascalCase
const streamList = []   // 变量/函数: camelCase
const API_URL = '/api'  // 常量: UPPER_SNAKE_CASE
```

---

## 七、禁止事项

### 架构禁止

```
❌ Go中直接调用YOLO（必须通过Python服务）
❌ Python中处理WebSocket连接
❌ 跨服务直接访问数据库
❌ 绕过API Gateway直接访问服务
```

### 代码禁止

```
Go:
  ❌ 循环内数据库查询
  ❌ 忽略error返回值
  ❌ goroutine泄漏
  ❌ 硬编码敏感信息
  ❌ 在Handler处理业务逻辑
  ❌ 不使用上下文ctx

Python:
  ❌ 全局变量存储状态
  ❌ 阻塞主线程
  ❌ 未关闭文件句柄
  ❌ 硬编码敏感信息

前端:
  ❌ 使用any类型
  ❌ 硬编码API地址
  ❌ 使用npm/yarn
  ❌ 直接操作DOM
  ❌ 内联样式
```

---

## 八、质量标准

### Go服务

```
✅ go vet通过
✅ golangci-lint通过
✅ 测试覆盖率 > 70%
✅ API P95 < 200ms
✅ SQL注入防护
```

### Python服务

```
✅ black格式化
✅ mypy类型检查
✅ pytest覆盖率 > 70%
✅ YOLO推理 < 100ms
```

### 前端

```
✅ TypeScript无错误
✅ ESLint通过
✅ 测试覆盖率 > 70%
✅ 首屏 < 3秒
✅ Lighthouse > 90
```

---

## 九、快速命令

```bash
# 前端
cd app && pnpm dev

# Go服务
cd server && go run cmd/server/main.go

# Python服务
cd ai-service && uvicorn app.main:app --reload

# Docker开发环境
docker-compose up -d

# 测试
pnpm test            # 前端测试
go test -v ./...    # 后端测试
pytest tests/ -v     # AI服务测试

# 代码检查
pnpm lint           # 前端Lint
golangci-lint run   # Go Lint
black --check app/  # Python格式化
```

---

## 十、重要文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 全局规则 | `.trae/rules/project_rules.md` | 开发规范、TDD、Plan |
| 各角色技能 | `.trae/skills/*/SKILL.md` | Agent专属提示词 |
| 技术规格 | `docs/SPEC.md` | 系统设计 |
| API设计 | `docs/API.md` | 接口文档 |
| 数据库设计 | `docs/DB.md` | 数据模型 |

---

## 十一、核心架构约束

```
1. Go 服务职责：
   - HTTP/WebSocket API
   - 业务逻辑
   - 数据访问
   - 视频流管理
   - 用户/租户管理
   - 告警管理

2. Python 服务职责：
   - YOLO 目标检测
   - OpenClaw AI Agent
   - 图像/视频处理
   - AI 智能分析

3. 严禁跨越：
   - Go 不能直接调用 YOLO
   - Python 不能处理 WebSocket
   - 跨服务不能直接访问 DB
```

---

## 十二、协作规范

### 任务分配流程

```
1. Project Lead 规划功能
2. Backend Lead 设计API
3. Backend Dev 实现API
4. Frontend Lead 设计组件
5. Frontend Dev 实现页面
6. AI Lead 设计AI方案
7. OpenClaw Eng 实现Agent
8. QA Lead 执行测试
```

### 代码审查流程

```
1. 开发人员提交PR
2. Lead审查代码
3. 检查清单：
   - 功能正确性
   - 架构合理性
   - 安全性
   - 性能影响
   - 测试覆盖
4. 通过后合并
```

---

**核心记忆**：

```
Go = 业务 + 视频流 + WebSocket
Python = AI + YOLO + OpenClaw
React = 前端UI

TDD = 先写测试再写代码
Plan = 复杂任务先用计划模式

架构禁止 = 安全底线
测试覆盖 = 质量底线

各取所长，不纠结
```

---

**最后更新**: 2026年4月
