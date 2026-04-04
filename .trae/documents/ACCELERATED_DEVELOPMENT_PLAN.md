# 巡检宝 - 全速开发执行计划

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **状态**: 🚀🚀🚀 全速推进中

---

## 🎯 执行策略

### 三线并行开发

```
Line 1: Go Backend        → API + WebSocket
Line 2: Python AI         → YOLO + 检测
Line 3: Frontend React    → UI 组件
```

### 目标

- **Week 1**: 完成基础架构，所有模块可运行
- **Week 2**: 完成核心功能，端到端测试通过
- **Week 3**: 完成高级功能，性能优化
- **Week 4**: 完成测试，文档，发布准备

---

## 📋 Week 1 任务分配

### Line 1: Go Backend

| 任务 | 优先级 | 负责人 | 状态 |
|------|--------|--------|------|
| 1.1 完善 AR 模型 | P0 | Backend Dev 1 | 🔄 |
| 1.2 创建 AR Handler | P0 | Backend Dev 1 | ⬜ |
| 1.3 创建 AR Service | P0 | Backend Dev 1 | ⬜ |
| 1.4 创建 AR Repository | P0 | Backend Dev 1 | ⬜ |
| 1.5 WebSocket 网关 | P0 | Backend Lead | ⬜ |
| 1.6 AR 路由注册 | P0 | Backend Dev 1 | ⬜ |

### Line 2: Python AI

| 任务 | 优先级 | 负责人 | 状态 |
|------|--------|--------|------|
| 2.1 AI 服务基础 | P0 | AI Lead | ⬜ |
| 2.2 YOLO 检测器 | P0 | AI Lead | ⬜ |
| 2.3 AR 标注生成 | P0 | AI Lead | ⬜ |
| 2.4 FastAPI 路由 | P0 | AI Lead | ⬜ |
| 2.5 Redis 集成 | P1 | AI Lead | ⬜ |

### Line 3: Frontend

| 任务 | 优先级 | 负责人 | 状态 |
|------|--------|--------|------|
| 3.1 AR 组件库 | P0 | Frontend Dev | ⬜ |
| 3.2 设备列表页面 | P0 | Frontend Dev | ⬜ |
| 3.3 会话管理页面 | P0 | Frontend Dev | ⬜ |
| 3.4 WebSocket 客户端 | P0 | Frontend Dev | ⬜ |

---

## 🔥 立即执行任务

### Task 1.1: 完善 AR 模型

**目标**: 确保所有 AR 模型有正确的 Tenant/User 关联

**文件**:
- `backend/internal/model/ar_device.go` ← 需要添加 Tenant/User 关联
- `backend/internal/model/ar_session.go` ← 需要添加 Tenant/User 关联
- `backend/internal/model/ar_event.go` ← 需要添加 Tenant/User 关联

**执行**:
```bash
# 检查现有模型
ls -la backend/internal/model/
```

### Task 1.2: 创建 AR Handler

**目标**: 创建 AR 设备的 CRUD Handler

**文件**:
- `backend/internal/handler/ar_device_handler.go`
- `backend/internal/handler/ar_session_handler.go`
- `backend/internal/handler/ar_event_handler.go`

**代码结构**:
```go
// backend/internal/handler/ar_device_handler.go

package handler

import (
    "github.com/gin-gonic/gin"
    "xunjianbao/backend/internal/model"
    "xunjianbao/backend/pkg/response"
)

type ARDeviceHandler struct {
    service *ARDeviceService
}

func NewARDeviceHandler(svc *ARDeviceService) *ARDeviceHandler {
    return &ARDeviceHandler{service: svc}
}

// CreateDevice 创建设备
// @Summary 创建设备
// @Tags AR设备
// @Accept json
// @Produce json
// @Param body body model.CreateARDeviceRequest true "创建设备"
// @Success 201 {object} response.Response
// @Router /api/v1/ar/devices [post]
func (h *ARDeviceHandler) CreateDevice(c *gin.Context) {
    var req model.CreateARDeviceRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    device, err := h.service.Create(c.Request.Context(), &req)
    if err != nil {
        response.InternalError(c, err.Error())
        return
    }

    response.Created(c, device.ToResponse())
}

// ListDevices 获取设备列表
// @Summary 获取设备列表
// @Tags AR设备
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} response.Response
// @Router /api/v1/ar/devices [get]
func (h *ARDeviceHandler) ListDevices(c *gin.Context) {
    var req model.PaginationRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    devices, total, err := h.service.List(c.Request.Context(), &req)
    if err != nil {
        response.InternalError(c, err.Error())
        return
    }

    response.Success(c, &model.ARDeviceListResponse{
        Items: devices,
        Total: total,
        Page:  req.Page,
    })
}
```

### Task 1.3: 创建 AR Service

**目标**: 创建 AR 设备的业务逻辑

**文件**:
- `backend/internal/service/ar_device_service.go`
- `backend/internal/service/ar_session_service.go`
- `backend/internal/service/ar_event_service.go`

**代码结构**:
```go
// backend/internal/service/ar_device_service.go

package service

import (
    "context"
    "xunjianbao/backend/internal/model"
    "xunjianbao/backend/internal/repository"
)

type ARDeviceService struct {
    repo *repository.ARDeviceRepository
}

func NewARDeviceService(repo *repository.ARDeviceRepository) *ARDeviceService {
    return &ARDeviceService{repo: repo}
}

func (s *ARDeviceService) Create(ctx context.Context, req *model.CreateARDeviceRequest) (*model.ARDevice, error) {
    device := &model.ARDevice{
        TenantID:   req.TenantID,
        DeviceType: req.DeviceType,
        DeviceName: req.DeviceName,
        DeviceSN:  req.DeviceSN,
        Status:     "offline",
        Config:     req.Config,
    }

    if err := s.repo.Create(ctx, device); err != nil {
        return nil, err
    }

    return device, nil
}

func (s *ARDeviceService) List(ctx context.Context, req *model.PaginationRequest) ([]*model.ARDeviceResponse, int64, error) {
    devices, total, err := s.repo.List(ctx, req.Page, req.PageSize)
    if err != nil {
        return nil, 0, err
    }

    responses := make([]*model.ARDeviceResponse, len(devices))
    for i, device := range devices {
        responses[i] = device.ToResponse()
    }

    return responses, total, nil
}
```

### Task 1.4: 创建 AR Repository

**目标**: 创建 AR 设备的数据访问层

**文件**:
- `backend/internal/repository/ar_device_repository.go`
- `backend/internal/repository/ar_session_repository.go`
- `backend/internal/repository/ar_event_repository.go`

**代码结构**:
```go
// backend/internal/repository/ar_device_repository.go

package repository

import (
    "context"
    "xunjianbao/backend/internal/model"
    "gorm.io/gorm"
)

type ARDeviceRepository struct {
    db *gorm.DB
}

func NewARDeviceRepository(db *gorm.DB) *ARDeviceRepository {
    return &ARDeviceRepository{db: db}
}

func (r *ARDeviceRepository) Create(ctx context.Context, device *model.ARDevice) error {
    return r.db.WithContext(ctx).Create(device).Error
}

func (r *ARDeviceRepository) FindByID(ctx context.Context, id uint) (*model.ARDevice, error) {
    var device model.ARDevice
    err := r.db.WithContext(ctx).Preload("Tenant").Preload("CurrentUser").
        First(&device, id).Error
    if err != nil {
        return nil, err
    }
    return &device, nil
}

func (r *ARDeviceRepository) List(ctx context.Context, page, pageSize int) ([]model.ARDevice, int64, error) {
    var devices []model.ARDevice
    var total int64

    // 统计总数
    if err := r.db.WithContext(ctx).Model(&model.ARDevice{}).Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // 分页查询
    offset := (page - 1) * pageSize
    if err := r.db.WithContext(ctx).
        Preload("Tenant").
        Preload("CurrentUser").
        Order("created_at DESC").
        Offset(offset).
        Limit(pageSize).
        Find(&devices).Error; err != nil {
        return nil, 0, err
    }

    return devices, total, nil
}

func (r *ARDeviceRepository) UpdateStatus(ctx context.Context, id uint, status string) error {
    return r.db.WithContext(ctx).Model(&model.ARDevice{}).
        Where("id = ?", id).
        Update("status", status).Error
}
```

### Task 1.5: WebSocket 网关

**目标**: 创建 AR 实时通信的 WebSocket 网关

**文件**:
- `backend/internal/ws/ar_gateway.go`
- `backend/cmd/ar-server/main.go`

**代码结构**:
```go
// backend/internal/ws/ar_gateway.go

package ws

import (
    "net/http"
    "sync"
    "github.com/gorilla/websocket"
    "github.com/redis/go-redis/v9"
)

type ARGateway struct {
    upgrader    websocket.Upgrader
    redis       *redis.Client
    connections  sync.Map  // device_id -> *Client
    sessions    sync.Map  // session_id -> *Session
}

func NewARGateway(redis *redis.Client) *ARGateway {
    return &ARGateway{
        upgrader: websocket.Upgrader{
            CheckOrigin: func(r *http.Request) bool {
                return true // 生产环境需要验证
            },
            ReadBufferSize:  1024,
            WriteBufferSize: 1024,
        },
        redis: redis,
    }
}

func (g *ARGateway) HandleConnection(w http.ResponseWriter, r *http.Request) {
    conn, err := g.upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    
    client := NewClient(conn)
    g.connections.Store(client.ID, client)
    go client.HandleMessages(g)
}
```

---

## 📊 进度追踪

### 今日目标

| 模块 | 目标 | 实际 | 状态 |
|------|------|------|------|
| Go Backend | 4 个任务 | 1/4 | 🔄 |
| Python AI | 2 个任务 | 0/2 | ⬜ |
| Frontend | 2 个任务 | 0/2 | ⬜ |

### 里程碑

- [ ] **Day 1**: AR 模型完善，Handler 基础
- [ ] **Day 2**: Service + Repository 完成
- [ ] **Day 3**: WebSocket 网关完成
- [ ] **Day 4**: AI 检测服务完成
- [ ] **Day 5**: 前端组件完成

---

## 🎯 下一步行动

### 立即执行

1. ✅ 完善 AR 模型
2. ⬜ 创建 AR Handler
3. ⬜ 创建 AR Service
4. ⬜ 创建 AR Repository

### 计划中

5. ⬜ WebSocket 网关
6. ⬜ AI 检测服务
7. ⬜ 前端组件

---

**最后更新**: 2026-04-02
**状态**: 🚀🚀🚀 全速推进中
