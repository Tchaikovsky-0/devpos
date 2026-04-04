# 企业级智能监控系统 - 技术规格说明书

## 1. 项目概述

### 1.1 项目名称
**产品名称**：巡检宝（XunjianBao）
**项目代号**：XunjianBao
**版本号**：v1.0.0

### 1.2 项目定位
面向重工业、企业、国企、高校、无人机等用户的企业级智能监控平台，核心特点：
- **OpenClaw深度集成** - AI Agent能力融入监控全流程
- **智能化分析** - YOLO算法自动识别缺陷/异常
- **多租户隔离** - 企业级数据安全与权限管理
- **简洁高效** - 专业级UI/UX设计

### 1.3 核心价值
- **OpenClaw深度集成** - AI Agent能力融入监控全流程
- **智能化分析** - YOLO算法自动识别缺陷/异常
- **多租户隔离** - 企业级数据安全与权限管理
- **简洁高效** - 专业级UI/UX设计

## 2. 技术架构

### 2.1 技术栈

#### 前端
- **框架**：React 18 + TypeScript
- **样式**：Tailwind CSS + Shadcn UI
- **状态管理**：Redux Toolkit
- **路由**：React Router v6
- **视频播放**：FLV.js + HLS.js + WebRTC
- **图表**：ECharts + Tremor
- **构建工具**：Vite
- **包管理**：pnpm

#### 后端
- **语言**：Go 1.20+
- **框架**：Gin
- **数据库**：PostgreSQL
- **缓存**：Redis
- **ORM**：GORM
- **认证**：JWT
- **API**：RESTful + WebSocket

#### AI/ML
- **AI Agent**：OpenClaw
- **目标检测**：YOLOv8
- **图像处理**：OpenCV
- **视频处理**：FFmpeg

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ Web端   │  │ 移动端  │  │ 大屏端  │  │ 第三方集成  │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘ │
└───────┼────────────┼────────────┼───────────────┼─────────┘
        │            │            │               │
        └────────────┴─────┬──────┴───────────────┘
                          │
                    ┌─────▼─────┐
                    │  API Gateway │  (Nginx/Gateway)
                    └─────┬─────┘
                          │
┌─────────────────────────┼─────────────────────────────────┐
│                         │                                  │
│  ┌─────────────────────▼─────────────────────┐             │
│  │              业务服务层                    │             │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │             │
│  │  │ 监控服务 │  │ 媒体服务 │  │ 告警服务 │   │             │
│  │  └────┬────┘  └────┬────┘  └────┬────┘   │             │
│  │       │            │            │         │             │
│  │  ┌────▼────────────▼────────────▼────┐    │             │
│  │  │       OpenClaw AI 中枢          │    │             │
│  │  └────────────────────────────────────┘    │             │
│  └─────────────────────────────────────────────┘             │
│                         │                                  │
│  ┌─────────────────────▼─────────────────────────────────┐  │
│  │                    数据层                              │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │PostgreSQL│ │  Redis  │  │  S3存储 │  │时序数据库│ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                  │
│  ┌─────────────────────▼─────────────────────────────────┐  │
│  │                    AI/ML层                             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │ YOLOv8  │  │OpenCV  │  │ FFmpeg  │  │ TensorRT│ │  │
│  │  │ 检测引擎 │  │ 图像处理│  │ 视频处理│  │ GPU加速 │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 部署架构

#### 开发环境
- 本地Docker Compose一键启动
- PostgreSQL + Redis + MinIO (S3兼容)
- 前端：Vite开发服务器
- 后端：Go Hot Reload

#### 生产环境
- **服务器**：腾讯云Ubuntu 4C8G
- **容器**：Docker + Docker Compose
- **Web服务**：Nginx反向代理
- **HTTPS**：Let's Encrypt自动证书
- **CDN**：腾讯云COS

## 3. 功能规格

### 3.1 核心模块

#### 3.1.1 数据大屏模块
**功能描述**：多画面视频流实时监控展示

**功能点**：
- [ ] 视频流网格布局（支持1x1到5x5，最大25画面）
- [ ] 视频流分类管理（无人机、普通监控）
- [ ] 实时预览与全屏播放
- [ ] 视频流质量监控（帧率、码率、延迟）
- [ ] 画面拖拽排序
- [ ] 分组收藏与快速切换
- [ ] 云台控制（PTZ）

**技术要求**：
- 支持同时播放20+路视频流
- 首屏加载时间 < 3秒
- 视频延迟 < 500ms
- 断流自动重连

#### 3.1.2 媒体库模块 ⭐核心
**功能描述**：企业级文件存储与管理

**功能点**：
- [ ] 多租户隔离存储
- [ ] 文件夹权限管理（读/写/删/分享）
- [ ] 用户文件夹（私有）
- [ ] 公共文件夹（共享）
- [ ] 存储内容类型：
  - 监控视频录像
  - 图像截图
  - 检测报告
  - 缺陷记录
- [ ] 文件预览与下载
- [ ] 批量操作（上传/删除/移动）
- [ ] 存储空间配额管理
- [ ] 文件搜索与筛选

**技术要求**：
- 单文件最大支持10GB
- 支持断点续传
- 支持文件夹拖拽上传
- 文件秒传（MD5去重）

#### 3.1.3 视频流接入模块
**功能描述**：第三方平台视频流接入与管理

**功能点**：
- [ ] 大疆司空2视频流接入
- [ ] 通用RTSP流接入
- [ ] WebRTC流接入
- [ ] HLS/MP4流接入
- [ ] 视频流配置管理
- [ ] 连接状态监控
- [ ] 断流告警与自动重连
- [ ] 视频流质量分析

**技术要求**：
- 支持100+路视频流并发接入
- 支持多种编码格式（H.264/H.265/VP8/VP9）
- 断流检测时间 < 10秒
- 自动重连次数可配置

#### 3.1.4 YOLO智能检测模块
**功能描述**：AI目标检测与缺陷识别

**功能点**：
- [ ] 🔥 火灾检测
- [ ] 💧 水体污染检测
- [ ] 🧱 墙体破损检测
- [ ] 👤 人员入侵检测
- [ ] 🚗 车辆识别
- [ ] 📦 遗留物检测
- [ ] 🔍 烟雾检测
- [ ] 📋 自定义检测模型（扩展）

**技术要求**：
- 检测延迟 < 200ms
- 检测准确率 > 90%
- 支持GPU加速推理
- 支持实时流检测
- 支持离线视频检测

#### 3.1.5 OpenClaw集成模块 ⭐核心
**功能描述**：AI Agent深度集成

**功能点**：
- [ ] 智能问答（自然语言查询）
- [ ] 智能巡检报告生成
- [ ] 告警深度分析与建议
- [ ] 设备故障智能诊断
- [ ] 自动化工作流编排
- [ ] 定时任务执行
- [ ] 事件触发响应
- [ ] 知识库问答（RAG）

**AI Agent设计**：
1. **巡检Agent** - 定时自动巡检系统
2. **告警Agent** - 深度分析告警上下文
3. **运维Agent** - 诊断和解决故障
4. **报告Agent** - 自动生成各类报告
5. **客服Agent** - 解答用户问题

#### 3.1.6 告警管理模块
**功能描述**：统一告警处理平台

**功能点**：
- [ ] 告警规则配置
- [ ] 告警级别管理（紧急/重要/一般/提示）
- [ ] 告警实时推送（WebSocket/APP/短信/邮件）
- [ ] 告警认领与处理
- [ ] 告警升级机制
- [ ] 告警统计分析
- [ ] 告警关联分析
- [ ] 告警抑制与去重

#### 3.1.7 用户权限模块
**功能描述**：企业级权限管理

**功能点**：
- [ ] 多租户架构
- [ ] 角色管理（超级管理员/企业管理员/普通用户）
- [ ] 资源权限（文件夹/视频流/报告）
- [ ] 操作权限（查看/编辑/删除/分享）
- [ ] 权限继承与覆盖
- [ ] 操作审计日志
- [ ] SSO单点登录（扩展）

### 3.2 非功能需求

#### 3.2.1 性能指标
| 指标 | 要求 |
|------|------|
| 系统可用性 | ≥99.5% |
| API响应时间 | P95 < 200ms |
| 视频流延迟 | < 500ms |
| 页面加载时间 | < 3s |
| 并发用户数 | ≥500 |
| 视频流并发 | ≥100路 |

#### 3.2.2 安全要求
- 传输加密：HTTPS/TLS 1.3
- 存储加密：AES-256（敏感数据）
- 认证方式：JWT + RefreshToken
- 会话超时：30分钟
- 密码策略：强密码+定期更换
- 审计日志：完整记录所有操作

#### 3.2.3 兼容性要求
- 浏览器：Chrome/Firefox/Safari/Edge最新2个版本
- 操作系统：Windows/macOS/Linux
- 移动端：iOS 14+/Android 10+

## 4. 数据模型

### 4.1 核心实体

#### Tenant（租户/公司）
```
- id: UUID (PK)
- name: string (公司名称)
- code: string (唯一编码)
- logo: string (Logo URL)
- storage_quota: int64 (存储配额，字节)
- status: enum (active/suspended)
- created_at: timestamp
- updated_at: timestamp
```

#### User（用户）
```
- id: UUID (PK)
- tenant_id: UUID (FK -> Tenant)
- username: string
- email: string
- phone: string
- password_hash: string
- avatar: string
- role: enum (super_admin/org_admin/normal_user)
- status: enum (active/disabled)
- last_login_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### Folder（文件夹）
```
- id: UUID (PK)
- tenant_id: UUID (FK -> Tenant)
- parent_id: UUID (FK -> Folder, nullable)
- name: string
- type: enum (private/shared/system)
- owner_id: UUID (FK -> User)
- permissions: JSON (权限配置)
- created_at: timestamp
- updated_at: timestamp
```

#### VideoStream（视频流）
```
- id: UUID (PK)
- tenant_id: UUID (FK -> Tenant)
- name: string
- type: enum (drone/camera/external)
- source_type: enum (rtsp/webrtc/hls/dj_sikong)
- stream_url: string (加密存储)
- category: string
- location: string
- status: enum (online/offline/error)
- config: JSON (配置参数)
- created_at: timestamp
- updated_at: timestamp
```

#### Defect（缺陷/异常）
```
- id: UUID (PK)
- tenant_id: UUID (FK -> Tenant)
- stream_id: UUID (FK -> VideoStream)
- type: enum (fire/flooding/crack/intrusion/vehicle/other)
- confidence: float (置信度)
- location: JSON (坐标信息)
- image_url: string (截图)
- video_url: string (录像片段)
- severity: enum (critical/major/minor)
- status: enum (detected/confirmed/false_alarm/resolved)
- description: text
- detected_at: timestamp
- confirmed_at: timestamp
- resolved_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### Alert（告警）
```
- id: UUID (PK)
- tenant_id: UUID (FK -> Tenant)
- stream_id: UUID (FK -> VideoStream, nullable)
- defect_id: UUID (FK -> Defect, nullable)
- type: string
- level: enum (critical/important/general/tip)
- title: string
- message: text
- status: enum (pending/processing/resolved/ignored)
- assignee_id: UUID (FK -> User, nullable)
- handled_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### DetectionTask（检测任务）
```
- id: UUID (PK)
- tenant_id: UUID (FK -> Tenant)
- stream_id: UUID (FK -> VideoStream)
- model_type: enum (fire/flooding/crack/intrusion/custom)
- config: JSON (检测配置)
- status: enum (running/paused/stopped/error)
- result_summary: JSON (检测结果汇总)
- started_at: timestamp
- stopped_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

## 5. API设计

### 5.1 API规范

#### 基础规范
- 协议：HTTPS
- 数据格式：JSON
- 字符编码：UTF-8
- 版本控制：URL Path (/api/v1/)
- 认证：Bearer Token (JWT)

#### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-03-15T10:30:00Z"
}
```

#### 错误码
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 5.2 API列表

#### 认证模块 /api/v1/auth
- POST /login - 用户登录
- POST /logout - 用户登出
- POST /refresh - 刷新Token
- GET /me - 获取当前用户信息

#### 租户模块 /api/v1/tenants
- GET /tenants - 获取租户列表
- POST /tenants - 创建租户
- GET /tenants/:id - 获取租户详情
- PUT /tenants/:id - 更新租户
- DELETE /tenants/:id - 删除租户

#### 用户模块 /api/v1/users
- GET /users - 获取用户列表
- POST /users - 创建用户
- GET /users/:id - 获取用户详情
- PUT /users/:id - 更新用户
- DELETE /users/:id - 删除用户

#### 视频流模块 /api/v1/streams
- GET /streams - 获取视频流列表
- POST /streams - 创建视频流
- GET /streams/:id - 获取视频流详情
- PUT /streams/:id - 更新视频流
- DELETE /streams/:id - 删除视频流
- GET /streams/:id/status - 获取视频流状态
- POST /streams/:id/control - 云台控制
- GET /streams/:id/snapshot - 获取截图

#### 媒体库模块 /api/v1/media
- GET /folders - 获取文件夹列表
- POST /folders - 创建文件夹
- GET /folders/:id - 获取文件夹详情
- PUT /folders/:id - 更新文件夹
- DELETE /folders/:id - 删除文件夹
- POST /folders/:id/permissions - 设置文件夹权限
- GET /files - 获取文件列表
- POST /files/upload - 上传文件
- GET /files/:id - 获取文件详情
- DELETE /files/:id - 删除文件
- GET /files/:id/download - 下载文件

#### 告警模块 /api/v1/alerts
- GET /alerts - 获取告警列表
- POST /alerts - 创建告警
- GET /alerts/:id - 获取告警详情
- PUT /alerts/:id - 更新告警
- PUT /alerts/:id/assign - 认领告警
- PUT /alerts/:id/resolve - 处理告警
- GET /alerts/statistics - 告警统计

#### 检测模块 /api/v1/detections
- GET /defects - 获取缺陷列表
- POST /defects - 创建缺陷记录
- GET /defects/:id - 获取缺陷详情
- PUT /defects/:id - 更新缺陷
- GET /detections/tasks - 获取检测任务
- POST /detections/tasks - 创建检测任务
- PUT /detections/tasks/:id - 更新检测任务
- DELETE /detections/tasks/:id - 删除检测任务

#### OpenClaw模块 /api/v1/ai
- POST /ai/chat - AI对话
- POST /ai/analyze - AI分析
- POST /ai/report - 生成报告
- GET /ai/history - 对话历史

## 6. 项目结构

```
/XunjianBao
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/               # API调用
│   │   ├── components/         # 公共组件
│   │   ├── pages/             # 页面组件
│   │   ├── store/             # 状态管理
│   │   ├── hooks/             # 自定义Hook
│   │   ├── utils/             # 工具函数
│   │   ├── types/             # TypeScript类型
│   │   └── App.tsx
│   ├── public/
│   ├── tests/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # 后端项目
│   ├── cmd/
│   │   └── server/           # 入口文件
│   ├── internal/
│   │   ├── api/              # API处理
│   │   ├── service/          # 业务逻辑
│   │   ├── repository/       # 数据访问
│   │   ├── model/            # 数据模型
│   │   ├── middleware/        # 中间件
│   │   └── config/           # 配置
│   ├── pkg/
│   │   ├── utils/            # 工具包
│   │   ├── errors/          # 错误定义
│   │   └── response/         # 响应封装
│   ├── migrations/            # 数据库迁移
│   ├── go.mod
│   └── go.sum
│
├── ai/                         # AI模块
│   ├── models/                # YOLO模型
│   ├── detector/              # 检测器
│   ├── openclaw/             # OpenClaw集成
│   └── tools/                 # Agent工具集
│
├── docker/                     # Docker配置
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
│
├── deploy/                     # 部署脚本
│   ├── production/
│   └── development/
│
├── docs/                       # 文档
│   ├── SPEC.md
│   ├── API.md
│   ├── DB.md
│   └── DEPLOY.md
│
└── README.md
```

## 7. 开发里程碑

### Phase 1: 基础架构（2周）
- [ ] 项目脚手架搭建
- [ ] 数据库设计与迁移
- [ ] 基础API框架
- [ ] 用户认证系统
- [ ] 权限基础功能

### Phase 2: 核心功能（4周）
- [ ] 媒体库模块开发
- [ ] 视频流接入
- [ ] 数据大屏界面
- [ ] 基础告警系统

### Phase 3: 智能检测（3周）
- [ ] YOLO集成
- [ ] 缺陷检测功能
- [ ] 告警智能分析
- [ ] 检测报告生成

### Phase 4: OpenClaw集成（3周）
- [ ] OpenClaw部署
- [ ] 工具集开发
- [ ] Agent设计与实现
- [ ] 智能对话界面

### Phase 5: 测试与上线（2周）
- [ ] 功能测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 部署上线

## 8. 验收标准

### 8.1 功能验收
- 所有功能点完成并通过测试
- API接口文档完整
- 用户操作手册完成

### 8.2 性能验收
- 系统响应时间满足要求
- 视频流播放流畅
- 并发处理能力达标

### 8.3 安全验收
- 安全漏洞扫描通过
- 权限控制正确
- 数据隔离有效

### 8.4 文档验收
- 技术文档完整
- 开发规范明确
- 运维手册完成