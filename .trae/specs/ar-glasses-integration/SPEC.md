# 巡检宝 - AR 眼镜集成模块技术规格文档

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **模块**: AR Glasses Integration
> **预计工期**: 8 周

---

## 1. 项目概述

### 1.1 项目背景

巡检宝 AR 眼镜集成模块旨在将 AR 智能眼镜（如 Rokid Glasses）深度融入企业级智能监控系统，实现：

- **现场实时 AI 检测** - 巡检人员佩戴眼镜，眼镜实时显示 AI 检测结果
- **远程专家协助** - 远程专家实时看到现场画面并标注指导
- **智能作业指导** - 眼镜显示 SOP 指引，减少操作失误
- **数据采集自动化** - 自动记录巡检轨迹，生成数字化档案

### 1.2 项目目标

**Phase 1 目标（核心功能）**：
1. ✅ AR 设备管理（注册、连接、状态）
2. ✅ 实时视频流转（眼镜 → 服务器）
3. ✅ AI 缺陷检测与 AR 标注
4. ✅ 标注结果实时推送
5. ✅ Web 端远程协助

**Phase 2 目标（高级功能）**：
1. ⬜ 智能作业指导（SOP 指引）
2. ⬜ 巡检轨迹记录
3. ⬜ OpenClaw 对话助手
4. ⬜ 疲劳检测

### 1.3 成功标准

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 视频流延迟 | < 500ms | 端到端延迟测试 |
| AR 标注延迟 | < 200ms | 检测到推送延迟 |
| AI 检测准确率 | > 90% | 测试集验证 |
| 系统可用性 | > 99% | 监控告警 |
| 同时在线设备 | > 50 | 压力测试 |

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      AR 眼镜集成系统架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Rokid 眼镜   │  │   手机 App  │  │   Web 端    │        │
│  │  (AR 显示)   │  │  (控制中枢) │  │  (专家端)   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                   │                  │                   │
│         │   WebSocket      │                  │ WebSocket         │
│         │   实时通信       │                  │ 实时通信          │
│         └──────────────────┼──────────────────┘                   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 WebSocket 网关 (Go)                     │   │
│  │  • 设备连接管理    • 消息路由    • 会话管理            │   │
│  │  • 权限验证        • 心跳检测    • 限流控制            │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐             │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AI 检测服务  │  │ AR 标注服务  │  │ 协作服务     │     │
│  │  (Python)    │  │  (Python)    │  │  (Go)       │     │
│  │              │  │              │  │              │     │
│  │ • YOLO 推理  │  │ • 标注生成   │  │ • 远程协助   │     │
│  │ • 缺陷分析   │  │ • 指引生成   │  │ • 视频流转   │     │
│  │ • 报告生成   │  │ • 推送服务   │  │ • 状态同步   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    数据层                                   │  │
│  │  PostgreSQL  │  MinIO  │  Redis  │  媒体库           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **眼镜端** | React Native | 0.72+ | AR 应用框架 |
| | Rokid SDK | Latest | 眼镜专用 SDK |
| | WebRTC | Latest | 实时通信 |
| **手机端** | React Native | 0.72+ | 控制中枢 App |
| | WebSocket | - | 设备通信 |
| **后端** | Go | 1.21+ | WebSocket 网关 |
| | Gin | 1.9+ | HTTP 框架 |
| | Redis | 6+ | 会话存储 |
| **AI 服务** | Python | 3.10+ | AI 推理 |
| | FastAPI | 0.100+ | HTTP API |
| | YOLOv8 | Latest | 目标检测 |
| | OpenCV | 4.8+ | 图像处理 |
| **存储** | PostgreSQL | 14+ | 主数据库 |
| | MinIO | Latest | 对象存储 |

### 2.3 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Go WebSocket | 8097 | AR 实时通信 |
| Python AI | 8095 | AI 推理服务 |
| Redis | 6379 | 会话缓存 |

---

## 3. 核心功能设计

### 3.1 功能总览

```
AR 眼镜集成模块
├── 1. 设备管理
│   ├── 设备注册
│   ├── 设备连接
│   ├── 状态监控
│   └── 设备控制
│
├── 2. 实时视频流
│   ├── 视频采集
│   ├── 视频压缩
│   ├── 流传输
│   └── 流分发
│
├── 3. AI 检测与标注
│   ├── YOLO 缺陷检测
│   ├── AR 标注生成
│   ├── 标注推送
│   └── 标注渲染
│
├── 4. 远程协助
│   ├── 双向视频
│   ├── 实时标注
│   ├── 语音通话
│   └── 协助记录
│
├── 5. 作业指导
│   ├── SOP 加载
│   ├── AR 指引叠加
│   └── 步骤追踪
│
└── 6. 数据管理
    ├── 巡检轨迹
    ├── 事件记录
    └── 媒体存储
```

### 3.2 功能 1: 设备管理

#### 3.2.1 设备注册

**流程**：
```
眼镜开机 → 扫描二维码 → 连接手机 App → 注册设备到服务器
```

**数据结构**：
```go
type ARDevice struct {
    ID            string    `json:"id"`
    TenantID      string    `json:"tenant_id"`
    DeviceType    string    `json:"device_type"`  // "rokid_glasses", "mobile_app"
    DeviceName   string    `json:"device_name"`
    DeviceSN     string    `json:"device_sn"`
    Status       string    `json:"status"`       // "offline", "online", "busy"
    CurrentUser  string    `json:"current_user_id"`
    LastHeartbeat time.Time `json:"last_heartbeat"`
    Config       map[string]interface{} `json:"config"`
}
```

#### 3.2.2 设备连接

**WebSocket 连接流程**：
```
眼镜 → 发起连接 → 鉴权验证 → 建立会话 → 心跳保活
```

**消息格式**：
```json
{
    "type": "connect",
    "device_id": "device-uuid",
    "user_id": "user-uuid",
    "token": "jwt-token",
    "timestamp": "2024-03-15T10:00:00Z"
}
```

### 3.3 功能 2: 实时视频流

#### 3.3.1 视频采集

**技术实现**：
- 眼镜摄像头采集 1080p@30fps 视频
- 使用 H.265 编码（带宽优化）
- 分辨率自适应（网络差时降级）

#### 3.3.2 流传输协议

**自定义协议**：
```go
type VideoFrame struct {
    FrameID     uint64    `json:"frame_id"`
    Timestamp   int64     `json:"timestamp"`
    Width       int       `json:"width"`
    Height      int       `json:"height"`
    Codec       string    `json:"codec"`        // "h265", "h264"
    KeyFrame    bool      `json:"key_frame"`
    Data        []byte    `json:"data"`         // 压缩后的视频帧
    Metadata    FrameMetadata `json:"metadata"`
}

type FrameMetadata struct {
    GPS        *GPSData  `json:"gps,omitempty"`
    IMU        *IMUData  `json:"imu,omitempty"`
    DeviceID   string    `json:"device_id"`
    UserID     string    `json:"user_id"`
    SessionID  string    `json:"session_id"`
}
```

#### 3.3.3 流分发

**架构**：
```
眼镜 → WebSocket → Go 网关 → Redis Pub/Sub → Python AI
                                              ↓
                                          专家端 (Web)
```

### 3.4 功能 3: AI 检测与 AR 标注

#### 3.4.1 YOLO 检测流程

```python
# ai_service/ar/detector.py

class ARDefectDetector:
    """AR 缺陷检测器"""
    
    def __init__(self):
        self.model = YOLO('yolov8n.pt')
    
    async def detect(self, frame: bytes) -> List[Detection]:
        """
        检测视频帧中的缺陷
        
        Args:
            frame: 原始视频帧数据
        
        Returns:
            检测结果列表
        """
        # 1. 解码视频帧
        image = self.decode_frame(frame)
        
        # 2. YOLO 推理
        results = self.model.predict(image, conf=0.5)
        
        # 3. 解析结果
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                detection = Detection(
                    type=self.map_class_to_defect(box.cls),
                    confidence=float(box.conf),
                    bbox=BBox(
                        x=int(box.xyxy[0][0]),
                        y=int(box.xyxy[0][1]),
                        width=int(box.xyxy[0][2] - box.xyxy[0][0]),
                        height=int(box.xyxy[0][3] - box.xyxy[0][1])
                    )
                )
                detections.append(detection)
        
        return detections
```

#### 3.4.2 AR 标注生成

**标注类型**：
```go
type ARAnnotation struct {
    Type        string      `json:"type"`        // "box", "circle", "arrow", "text"
    DefectType  string      `json:"defect_type"`
    Confidence  float64     `json:"confidence"`
    BBox        *BBox       `json:"bbox,omitempty"`
    Color       string      `json:"color"`       // "#FF0000"
    Label       string      `json:"label"`
    Severity    string      `json:"severity"`     // "critical", "major", "minor"
}
```

**颜色映射**：
| 缺陷类型 | 颜色 | 说明 |
|---------|------|------|
| fire | #FF0000 | 红色 - 火情 |
| crack | #FFA500 | 橙色 - 裂缝 |
| flood | #0000FF | 蓝色 - 水体污染 |
| intrusion | #FF00FF | 紫色 - 入侵 |

#### 3.4.3 标注推送

**推送流程**：
```
AI 检测 → 生成标注 → WebSocket → 眼镜端 → 渲染显示
```

**推送消息格式**：
```json
{
    "type": "ar_annotation",
    "session_id": "session-uuid",
    "device_id": "device-uuid",
    "timestamp": "2024-03-15T10:00:00Z",
    "annotations": [
        {
            "type": "box",
            "defect_type": "fire",
            "confidence": 0.95,
            "bbox": {"x": 100, "y": 200, "width": 150, "height": 120},
            "color": "#FF0000",
            "label": "火情 95%",
            "severity": "critical"
        }
    ]
}
```

### 3.5 功能 4: 远程协助

#### 3.5.1 会话管理

**流程**：
```
现场人员发起协助 → 服务器分配会话 → 专家加入 → 双向视频 → 标注指导 → 结束会话
```

**会话状态机**：
```
PENDING → ACTIVE → COMPLETED
         ↘ CANCELLED
```

#### 3.5.2 双向视频

**技术方案**：
- 眼镜端：发送现场视频到服务器
- 专家端：接收视频并显示
- 服务器：转发视频流

**标注同步**：
```go
type ExpertAnnotation struct {
    Type        string      `json:"type"`     // "circle", "arrow", "freehand"
    Color       string      `json:"color"`
    Points      []Point     `json:"points"`
    Text        string      `json:"text,omitempty"`
    CreatedBy   string      `json:"created_by"`
    CreatedAt   time.Time   `json:"created_at"`
}
```

### 3.6 功能 5: 作业指导

#### 3.6.1 SOP 加载

**数据结构**：
```go
type SOPGuidance struct {
    ID          string           `json:"id"`
    TaskID      string           `json:"task_id"`
    Steps       []GuidanceStep  `json:"steps"`
    CurrentStep int              `json:"current_step"`
}

type GuidanceStep struct {
    ID          int              `json:"id"`
    Instruction string           `json:"instruction"`
    Media       *MediaContent   `json:"media,omitempty"`   // 图片/视频
    Highlight   *HighlightRegion `json:"highlight,omitempty"` // 高亮区域
    Checkpoints []Checkpoint     `json:"checkpoints,omitempty"`
}
```

#### 3.6.2 AR 指引叠加

**显示效果**：
```
┌─────────────────────────────┐
│  👓 当前步骤: 2/5          │
│                             │
│  请检查 3 号阀门            │
│  ┌─────────┐               │
│  │ 🔴 阀门   │ ← 高亮标注   │
│  └─────────┘               │
│                             │
│  ✓ 第 1 步已完成           │
│  → 第 2 步进行中           │
│  ○ 第 3 步待执行           │
└─────────────────────────────┘
```

---

## 4. 数据库设计

### 4.1 表结构

#### 表 1: ar_devices (AR 设备表)

```sql
CREATE TABLE ar_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    device_type VARCHAR(30) NOT NULL CHECK (device_type IN ('rokid_glasses', 'mobile_app')),
    device_name VARCHAR(100) NOT NULL,
    device_sn VARCHAR(100) UNIQUE,
    
    -- 连接状态
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    current_user_id UUID REFERENCES users(id),
    
    -- 配置
    config JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ar_devices_tenant ON ar_devices(tenant_id);
CREATE INDEX idx_ar_devices_user ON ar_devices(current_user_id);
CREATE INDEX idx_ar_devices_status ON ar_devices(status);
```

#### 表 2: ar_sessions (AR 会话表)

```sql
CREATE TABLE ar_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- 会话类型
    session_type VARCHAR(30) NOT NULL CHECK (session_type IN (
        'inspection',      -- 巡检会话
        'remote_assist',   -- 远程协助
        'training'         -- 培训会话
    )),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'pending', 'active', 'paused', 'completed', 'cancelled'
    )),
    
    -- 参与者
    field_user_id UUID NOT NULL REFERENCES users(id),  -- 现场人员
    remote_user_id UUID REFERENCES users(id),          -- 远程专家
    device_id UUID REFERENCES ar_devices(id),         -- AR 设备
    
    -- 统计
    duration_seconds INT DEFAULT 0,
    event_count INT DEFAULT 0,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_sessions_tenant ON ar_sessions(tenant_id);
CREATE INDEX idx_ar_sessions_field_user ON ar_sessions(field_user_id);
CREATE INDEX idx_ar_sessions_remote_user ON ar_sessions(remote_user_id);
CREATE INDEX idx_ar_sessions_status ON ar_sessions(status);
```

#### 表 3: ar_events (AR 事件表)

```sql
CREATE TABLE ar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ar_sessions(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- 事件类型
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'detection',       -- AI 检测
        'annotation',       -- 标注事件
        'capture',          -- 拍照事件
        'guidance',        -- 指引事件
        'alert',           -- 告警事件
        'chat'             -- 语音消息
    )),
    
    -- 内容
    content JSONB NOT NULL,
    media_file_id UUID REFERENCES media_files(id),
    
    -- 位置
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- 状态
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_events_session ON ar_events(session_id);
CREATE INDEX idx_ar_events_type ON ar_events(event_type);
CREATE INDEX idx_ar_events_created ON ar_events(created_at);
```

#### 表 4: ar_detections (AR 检测记录表)

```sql
CREATE TABLE ar_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ar_sessions(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- 检测信息
    defect_type VARCHAR(50) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    severity VARCHAR(20) DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor')),
    
    -- 位置信息
    bbox JSONB NOT NULL,
    location_point GEOGRAPHY(POINT, 4326),
    
    -- 标注信息
    annotated BOOLEAN DEFAULT FALSE,
    annotated_path VARCHAR(500),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN (
        'detected', 'confirmed', 'false_alarm', 'resolved'
    )),
    
    -- 关联媒体
    snapshot_file_id UUID REFERENCES media_files(id),
    
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_detections_session ON ar_detections(session_id);
CREATE INDEX idx_ar_detections_type ON ar_detections(defect_type);
CREATE INDEX idx_ar_detections_severity ON ar_detections(severity);
```

#### 表 5: ar_inspection_routes (巡检轨迹表)

```sql
CREATE TABLE ar_inspection_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ar_sessions(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- 轨迹数据
    route_data JSONB NOT NULL COMMENT '轨迹点列表',
    
    -- 统计
    total_distance DECIMAL(10, 2) COMMENT '总距离（米）',
    total_duration INT COMMENT '总时长（秒）',
    checkpoint_count INT DEFAULT 0,
    
    -- 地图快照
    map_snapshot_path VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_routes_session ON ar_inspection_routes(session_id);
```

---

## 5. API 设计

### 5.1 REST API

#### 5.1.1 设备管理

```
# 注册设备
POST /api/v1/ar/devices
Body: {
    "device_type": "rokid_glasses",
    "device_name": "Rokid眼镜-001",
    "device_sn": "Rokid-xxxx-xxxx"
}

# 获取设备列表
GET /api/v1/ar/devices
Query: ?tenant_id=xxx&status=online

# 获取设备详情
GET /api/v1/ar/devices/:id

# 更新设备状态
PUT /api/v1/ar/devices/:id/status
Body: {
    "status": "online",
    "current_user_id": "user-uuid"
}

# 删除设备
DELETE /api/v1/ar/devices/:id
```

#### 5.1.2 会话管理

```
# 创建会话
POST /api/v1/ar/sessions
Body: {
    "session_type": "inspection",
    "field_user_id": "user-uuid",
    "device_id": "device-uuid"
}

# 获取会话列表
GET /api/v1/ar/sessions
Query: ?tenant_id=xxx&status=active&user_id=xxx

# 获取会话详情
GET /api/v1/ar/sessions/:id

# 加入会话（远程专家）
POST /api/v1/ar/sessions/:id/join
Body: {
    "user_id": "expert-uuid"
}

# 结束会话
POST /api/v1/ar/sessions/:id/end

# 获取会话统计
GET /api/v1/ar/sessions/:id/stats
```

#### 5.1.3 事件管理

```
# 获取事件列表
GET /api/v1/ar/sessions/:id/events
Query: ?event_type=detection&page=1&page_size=20

# 创建事件
POST /api/v1/ar/sessions/:id/events
Body: {
    "event_type": "detection",
    "content": {...},
    "latitude": 30.123,
    "longitude": 120.456
}

# 确认事件
POST /api/v1/ar/events/:id/acknowledge
```

#### 5.1.4 检测管理

```
# 获取检测列表
GET /api/v1/ar/sessions/:id/detections
Query: ?defect_type=fire&severity=critical

# 确认检测
POST /api/v1/ar/detections/:id/confirm

# 标记误报
POST /api/v1/ar/detections/:id/false_alarm
Body: {
    "reason": "误检，实际是红色油漆"
}

# 标记已解决
POST /api/v1/ar/detections/:id/resolve
```

### 5.2 WebSocket API

#### 5.2.1 连接管理

```json
// 连接请求
{
    "type": "connect",
    "action": "connect",
    "payload": {
        "device_id": "device-uuid",
        "user_id": "user-uuid",
        "token": "jwt-token",
        "session_id": "session-uuid"
    }
}

// 连接响应
{
    "type": "connect",
    "action": "connected",
    "payload": {
        "session_id": "session-uuid",
        "role": "field_user"
    }
}

// 断开连接
{
    "type": "disconnect",
    "reason": "user_initiated"
}
```

#### 5.2.2 视频流

```json
// 上传视频帧
{
    "type": "video_frame",
    "payload": {
        "frame_id": 12345,
        "timestamp": 1710494400000,
        "width": 1920,
        "height": 1080,
        "codec": "h265",
        "key_frame": true,
        "data": "base64-encoded-data..."
    }
}
```

#### 5.2.3 AI 检测结果

```json
// 服务器推送检测结果
{
    "type": "detection_result",
    "payload": {
        "frame_id": 12345,
        "detections": [
            {
                "id": "detection-uuid",
                "defect_type": "fire",
                "confidence": 0.95,
                "bbox": {"x": 100, "y": 200, "width": 150, "height": 120},
                "severity": "critical"
            }
        ]
    }
}
```

#### 5.2.4 AR 标注

```json
// 推送 AR 标注
{
    "type": "ar_annotation",
    "payload": {
        "annotations": [
            {
                "type": "box",
                "defect_type": "fire",
                "confidence": 0.95,
                "bbox": {"x": 100, "y": 200, "width": 150, "height": 120},
                "color": "#FF0000",
                "label": "火情 95%",
                "severity": "critical"
            }
        ]
    }
}
```

#### 5.2.5 远程协助

```json
// 专家标注
{
    "type": "expert_annotation",
    "payload": {
        "annotation": {
            "type": "circle",
            "color": "#FFFF00",
            "center": {"x": 500, "y": 300},
            "radius": 50,
            "text": "请检查这里"
        }
    }
}

// 标注清除
{
    "type": "clear_annotations"
}
```

#### 5.2.6 作业指导

```json
// 推送指引
{
    "type": "guidance",
    "payload": {
        "step": {
            "id": 2,
            "instruction": "请检查 3 号阀门",
            "media": {
                "type": "image",
                "url": "https://..."
            },
            "highlight": {
                "bbox": {"x": 100, "y": 200, "width": 80, "height": 80},
                "color": "#00FF00"
            }
        },
        "total_steps": 5,
        "current_step": 2
    }
}

// 完成步骤
{
    "type": "guidance",
    "action": "step_complete",
    "payload": {
        "step_id": 2
    }
}
```

---

## 6. 前端设计

### 6.1 眼镜端 App (React Native)

#### 6.1.1 核心页面

```
眼镜端 App
├── 连接页面
│   ├── 扫码连接
│   └── 手动连接
│
├── AR 视图页面
│   ├── 摄像头画面
│   ├── AR 标注层
│   ├── 状态信息
│   └── 快捷操作
│
├── 作业指引页面
│   ├── 指引内容
│   ├── AR 高亮
│   └── 步骤追踪
│
└── 设置页面
    ├── 连接设置
    ├── 显示设置
    └── 权限设置
```

#### 6.1.2 AR 标注组件

```tsx
// components/AROverlay.tsx

interface AROverlayProps {
    annotations: ARAnnotation[];
    onAnnotationClick?: (annotation: ARAnnotation) => void;
}

export const AROverlay: React.FC<AROverlayProps> = ({
    annotations,
    onAnnotationClick
}) => {
    return (
        <View style={StyleSheet.absoluteFill}>
            {annotations.map((annotation) => (
                <ARAnnotationView
                    key={annotation.id}
                    annotation={annotation}
                    onPress={() => onAnnotationClick?.(annotation)}
                />
            ))}
        </View>
    );
};

// 标注类型组件
const ARAnnotationView: React.FC<{annotation: ARAnnotation}> = ({
    annotation
}) => {
    const style = {
        borderColor: annotation.color,
        borderWidth: 3,
        position: 'absolute',
        left: annotation.bbox.x,
        top: annotation.bbox.y,
        width: annotation.bbox.width,
        height: annotation.bbox.height,
    };

    return (
        <View style={style}>
            <Text style={[styles.label, {color: annotation.color}]}>
                {annotation.label}
            </Text>
        </View>
    );
};
```

### 6.2 Web 专家端

#### 6.2.1 核心页面

```
Web 专家端
├── 设备列表页面
│   ├── 在线设备
│   ├── 设备状态
│   └── 快速连接
│
├── 远程协助页面
│   ├── 视频画面
│   ├── 标注工具栏
│   ├── 标注列表
│   ├── 语音通话
│   └── 协助记录
│
├── 巡检会话页面
│   ├── 会话列表
│   ├── 轨迹地图
│   └── 检测统计
│
└── 历史记录页面
    ├── 会话历史
    ├── 检测记录
    └── 导出报告
```

#### 6.2.2 视频播放组件

```tsx
// components/RemoteVideo.tsx

export const RemoteVideo: React.FC = () => {
    const [videoRef, setVideoRef] = useState<HTMLVideoElement>();
    const [annotations, setAnnotations] = useState<ExpertAnnotation[]>([]);
    
    // 订阅视频流
    useEffect(() => {
        const unsubscribe = arService.subscribe('video_stream', (frame) => {
            if (videoRef) {
                videoRef.srcObject = frame;
            }
        });
        return unsubscribe;
    }, [videoRef]);
    
    return (
        <div className="remote-video">
            <video ref={setVideoRef} autoPlay />
            <AnnotationLayer
                annotations={annotations}
                onAnnotationCreate={handleAnnotationCreate}
            />
        </div>
    );
};
```

---

## 7. 性能优化

### 7.1 视频流优化

| 优化项 | 方案 | 效果 |
|--------|------|------|
| 编码优化 | H.265 + ROI | 带宽降低 50% |
| 分辨率自适应 | 动态调整 | 网络差时流畅 |
| 帧率控制 | 30fps → 15fps | 降低延迟 |
| 关键帧间隔 | 2s → 1s | 快速刷新 |

### 7.2 AI 推理优化

| 优化项 | 方案 | 效果 |
|--------|------|------|
| 模型优化 | YOLOv8n + INT8 | 推理速度 2x |
| 批处理 | 多帧并行 | 吞吐量提升 |
| 缓存 | 结果缓存 | 重复检测跳过 |
| 降采样 | 720p 推理 | 速度提升 50% |

### 7.3 网络优化

| 优化项 | 方案 | 效果 |
|--------|------|------|
| CDN 加速 | 边缘节点 | 加载更快 |
| WebSocket 压缩 | permessage-deflate | 流量降低 30% |
| 断线重连 | 指数退避 | 稳定性提升 |

---

## 8. 安全设计

### 8.1 认证授权

- JWT Token 认证（24h 有效期）
- 设备绑定验证
- 会话权限控制

### 8.2 数据安全

- 视频流 TLS 加密
- 媒体文件 AES-256 加密存储
- 敏感数据脱敏

### 8.3 审计日志

- 设备连接记录
- 会话操作记录
- 异常事件记录

---

## 9. 实施计划

### 9.1 开发阶段

| 阶段 | 周数 | 主要任务 |
|------|------|----------|
| Phase 1 | Week 1-2 | 基础架构、WebSocket 网关 |
| Phase 2 | Week 3-4 | 设备管理、视频流 |
| Phase 3 | Week 5-6 | AI 检测、AR 标注 |
| Phase 4 | Week 7-8 | 远程协助、作业指导 |

### 9.2 测试计划

| 阶段 | 测试内容 |
|------|----------|
| 单元测试 | 服务逻辑、工具函数 |
| 集成测试 | API 端点、WebSocket 连接 |
| E2E 测试 | 完整用户流程 |
| 性能测试 | 延迟、并发、压力 |
| 安全测试 | 认证、授权、数据安全 |

---

## 10. 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 视频延迟高 | 中 | 高 | 优化编码参数、CDN 加速 |
| 网络不稳定 | 高 | 中 | 断线重连、本地缓存 |
| AI 误检率高 | 中 | 高 | 收集数据持续优化模型 |
| 设备兼容性 | 中 | 高 | 多设备适配测试 |

---

## 11. 附录

### 11.1 术语表

| 术语 | 定义 |
|------|------|
| AR | 增强现实 (Augmented Reality) |
| WebSocket | 双向通信协议 |
| YOLO | 目标检测算法 |
| SOP | 标准操作程序 (Standard Operating Procedure) |
| ROI | 感兴趣区域 (Region of Interest) |

### 11.2 参考资料

- [Rokid 开发者平台](https://developer.rokid.com/)
- [WebRTC 文档](https://webrtc.org/)
- [YOLOv8 文档](https://docs.ultralytics.com/)

---

**文档状态**: 待审核
**审核人**:
**审核日期**:
