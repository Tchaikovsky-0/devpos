# 巡检宝 - AR 眼镜集成模块

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **预计工期**: 8 周

---

## 🎯 项目概述

巡检宝 AR 眼镜集成模块将 AR 智能眼镜深度融入企业级智能监控系统，实现：

- 👓 **现场实时 AI 检测** - 眼镜实时显示检测到的缺陷
- 🎥 **远程专家协助** - 专家实时看到现场并标注指导
- 📋 **智能作业指导** - 眼镜显示 SOP 指引
- 📍 **巡检轨迹记录** - 自动记录巡检路径

---

## 📁 文档结构

```
.trae/specs/ar-glasses-integration/
├── README.md           # 本文件 - 开发指南
├── SPEC.md            # 技术规格文档
└── tasks.md           # 详细任务清单
```

---

## 🚀 快速开始

### 1. 环境准备

#### 前置条件

- Go 1.21+
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (已安装 Geo 扩展)
- Redis 6+
- Docker & Docker Compose

#### 安装 Geo 扩展

```bash
# PostgreSQL 安装 PostGIS
psql -U postgres -d xunjianbao -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 验证
psql -U postgres -d xunjianbao -c "SELECT PostGIS_Version();"
```

### 2. 启动服务

```bash
# 1. 执行数据库迁移
cd backend
psql -U postgres -d xunjianbao -f migrations/007_create_ar_devices.sql

# 2. 启动 Redis
docker run -d --name ar-redis -p 6379:6379 redis:6

# 3. 启动 Go WebSocket 服务
go run cmd/ar-server/main.go
# 端口: 8097

# 4. 启动 Python AI 服务
cd ai-service
uvicorn app.ar.main:app --host 0.0.0.0 --port 8095 --reload
# 端口: 8095
```

### 3. 默认测试

```bash
# 测试设备注册
curl -X POST http://localhost:8094/api/v1/ar/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "device_type": "rokid_glasses",
    "device_name": "测试眼镜",
    "device_sn": "TEST-001"
  }'

# 测试 WebSocket 连接
wscat -c ws://localhost:8097/ar?token=<jwt_token>
```

---

## 📅 开发计划

### Week 1-2: 基础架构

| 任务 | 工时 | 状态 |
|------|------|------|
| 数据库迁移 | 8h | ✅ |
| GORM 模型 | 8h | ✅ |
| WebSocket 网关 | 12h | 🔄 |
| 消息协议 | 4h | 🔄 |
| 会话管理 | 4h | 🔄 |
| 单元测试 | 4h | 🔄 |

### Week 3-4: 设备与视频流

| 任务 | 工时 | 状态 |
|------|------|------|
| 设备管理 | 8h | ⬜ |
| 会话管理 | 8h | ⬜ |
| 视频流处理 | 12h | ⬜ |
| 视频压缩 | 8h | ⬜ |
| Redis 集成 | 4h | ⬜ |
| 集成测试 | 8h | ⬜ |

### Week 5-6: AI 检测与标注

| 任务 | 工时 | 状态 |
|------|------|------|
| YOLO 检测器 | 8h | ⬜ |
| AR 标注生成 | 8h | ⬜ |
| FastAPI 接口 | 8h | ⬜ |
| 标注推送 | 4h | ⬜ |
| 性能优化 | 8h | ⬜ |
| 单元测试 | 4h | ⬜ |

### Week 7-8: 远程协助

| 任务 | 工时 | 状态 |
|------|------|------|
| 远程协助服务 | 12h | ⬜ |
| Web 组件 | 12h | ⬜ |
| 专家端页面 | 8h | ⬜ |
| WebSocket 客户端 | 8h | ⬜ |
| 事件管理 | 4h | ⬜ |
| 集成测试 | 8h | ⬜ |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      AR 眼镜集成系统架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Rokid 眼镜   │  │   手机 App  │  │   Web 端    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 WebSocket 网关 (Go)                     │   │
│  │  端口: 8097                                            │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐             │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AI 检测服务  │  │ AR 标注服务  │  │ 协作服务     │     │
│  │  (Python)    │  │  (Python)    │  │  (Go)       │     │
│  │  端口: 8095  │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 API 端点

### REST API (Go: 8094)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/ar/devices` | GET | 获取设备列表 |
| `/api/v1/ar/devices` | POST | 注册设备 |
| `/api/v1/ar/devices/:id` | GET | 获取设备详情 |
| `/api/v1/ar/sessions` | GET | 获取会话列表 |
| `/api/v1/ar/sessions` | POST | 创建会话 |
| `/api/v1/ar/sessions/:id/join` | POST | 加入会话 |
| `/api/v1/ar/sessions/:id/end` | POST | 结束会话 |

### WebSocket (Go: 8097)

```
ws://localhost:8097/ar?token=<jwt_token>&session_id=<session_id>
```

**消息类型**:
- `video_frame` - 视频帧上传
- `detection_result` - 检测结果推送
- `ar_annotation` - AR 标注推送
- `expert_annotation` - 专家标注
- `guidance` - 作业指引

### AI API (Python: 8095)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/ar/detect` | POST | 检测缺陷 |
| `/ar/detect/batch` | POST | 批量检测 |
| `/health` | GET | 健康检查 |

---

## 🔧 核心服务

### 1. WebSocket 网关

**文件**: `backend/internal/ws/ar_gateway.go`

**功能**:
- 设备连接管理
- 消息路由
- 心跳检测
- 限流控制

**启动命令**:
```bash
cd backend
go run cmd/ar-server/main.go
```

### 2. AI 检测服务

**文件**: `ai-service/ar/detector.py`

**功能**:
- YOLO 缺陷检测
- AR 标注生成
- 结果推送

**启动命令**:
```bash
cd ai-service
uvicorn app.ar.main:app --reload
```

### 3. 标注生成服务

**文件**: `ai-service/ar/annotation_generator.py`

**功能**:
- 标注框生成
- 颜色映射
- 标签生成

---

## 📊 数据流

### 视频流转

```
眼镜摄像头
    ↓ 采集
眼镜端 App
    ↓ 编码 (H.265)
WebSocket
    ↓ 上传
Go 网关 (8097)
    ↓ 转发
Python AI (8095)
    ↓ 检测
Go 网关
    ↓ 广播
专家端 Web
```

### 标注推送

```
Python AI
    ↓ 检测结果
标注生成
    ↓ 标注指令
Go 网关
    ↓ WebSocket
眼镜端 App
    ↓ 渲染
AR 眼镜显示
```

---

## 🎨 UI 设计

### 眼镜端页面

```
┌─────────────────────────────┐
│  👓 AR 实时视图              │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   摄像头画面          │  │
│  │                       │  │
│  │   🔴 [火情 95%]      │  │ ← AR 标注
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  [1/5] 第2步：检查阀门     │
│                             │
│  [📸] [📹] [📍] [📞]    │ ← 快捷按钮
└─────────────────────────────┘
```

### 专家端页面

```
┌─────────────────────────────────────────┐
│  👨‍💻 远程协助 - 会话 #12345              │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │         现场视频画面               │  │
│  │                                   │  │
│  │      🔴 [火情 95%]               │  │
│  │                                   │  │
│  │   ⭕ 请检查这里 ← 专家标注       │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [🔴] [🟠] [🔵] [📝] [🗑️] ← 标注工具  │
│                                         │
│  检测记录:                              │
│  ├─ 🔥 火情 (95%) - 严重              │
│  ├─ 🔱 裂缝 (87%) - 中等              │
│  └─ 💧 水体污染 (76%) - 轻微          │
│                                         │
│  [📞 通话中]  [📍 定位]  [📸 截图]    │
└─────────────────────────────────────────┘
```

---

## ✅ 质量标准

### 性能指标

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 视频流延迟 | < 500ms | 端到端测试 |
| AR 标注延迟 | < 200ms | 检测到显示 |
| AI 推理时间 | < 100ms | 单帧检测 |
| WebSocket 延迟 | < 50ms | 消息往返 |

### 代码质量

```bash
# Go 代码检查
cd backend
golangci-lint run ./...

# Python 代码检查
cd ai-service
black --check app/
mypy app/

# 前端代码检查
pnpm lint
```

---

## 📦 交付物

### 代码交付

| 模块 | 文件路径 | 说明 |
|------|----------|------|
| WebSocket 网关 | `backend/internal/ws/*` | AR 通信核心 |
| AI 检测 | `ai-service/ar/*` | YOLO 检测 |
| 前端组件 | `frontend/src/components/ar/*` | React 组件 |

### 文档交付

| 文档 | 路径 | 说明 |
|------|------|------|
| 技术规格 | `SPEC.md` | 完整技术规格 |
| 任务清单 | `tasks.md` | 详细任务分解 |
| 数据库 | `backend/migrations/007_create_ar_devices.sql` | 数据库迁移 |

---

## 🐛 问题反馈

如发现问题，请：

1. 查看日志文件
2. 复现问题步骤
3. 提交 Issue 到 GitHub

**紧急问题**: 联系项目负责人

---

## 📚 参考资源

- [Rokid 开发者平台](https://developer.rokid.com/)
- [WebRTC 文档](https://webrtc.org/)
- [YOLOv8 文档](https://docs.ultralytics.com/)
- [Gorilla WebSocket](https://github.com/gorilla/websocket)

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](../LICENSE) 文件

---

**最后更新**: 2026-04-02
**维护人**: AI Assistant
**版本**: v1.0.0
