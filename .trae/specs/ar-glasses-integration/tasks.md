# 巡检宝 - AR 眼镜集成详细任务清单

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **模块**: AR Glasses Integration
> **预计工期**: 8 周

---

## 任务总览

| 阶段 | 任务数 | 预计工时 | 负责人 |
|------|--------|----------|--------|
| Phase 1: 基础架构 | 8 | 48h | Backend Lead |
| Phase 2: 设备与视频流 | 8 | 48h | Backend Dev |
| Phase 3: AI 检测与标注 | 6 | 40h | AI Lead |
| Phase 4: 远程协助 | 6 | 40h | Frontend Dev |
| **总计** | **28** | **176h** | |

---

## Phase 1: 基础架构 (Week 1-2)

### 任务 1.1: 数据库迁移

**任务 ID**: AR-T1.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: 无
**负责人**: Backend Lead

**具体步骤**:
1. [ ] 创建 `backend/migrations/007_create_ar_devices.sql`
2. [ ] 创建 `backend/migrations/008_create_ar_sessions.sql`
3. [ ] 创建 `backend/migrations/009_create_ar_events.sql`
4. [ ] 创建 `backend/migrations/010_create_ar_detections.sql`
5. [ ] 创建 `backend/migrations/011_create_ar_inspection_routes.sql`
6. [ ] 创建索引和约束
7. [ ] 添加注释

**验收标准**:
- [ ] 所有表创建成功
- [ ] 外键约束正确
- [ ] 索引创建成功
- [ ] 可重复执行

**测试命令**:
```bash
psql -U postgres -d xunjianbao -f backend/migrations/007_create_ar_devices.sql
psql -U postgres -d xunjianbao -f backend/migrations/008_create_ar_sessions.sql
psql -U postgres -d xunjianbao -f backend/migrations/009_create_ar_events.sql
psql -U postgres -d xunjianbao -f backend/migrations/010_create_ar_detections.sql
psql -U postgres -d xunjianbao -f backend/migrations/011_create_ar_inspection_routes.sql
```

---

### 任务 1.2: GORM 模型实现

**任务 ID**: AR-T1.2
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T1.1
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/model/ar_device.go`
2. [ ] 创建 `backend/internal/model/ar_session.go`
3. [ ] 创建 `backend/internal/model/ar_event.go`
4. [ ] 创建 `backend/internal/model/ar_detection.go`
5. [ ] 创建 `backend/internal/model/ar_inspection_route.go`
6. [ ] 创建 DTO 和转换函数

**验收标准**:
- [ ] 所有模型字段与数据库一致
- [ ] GORM 标签正确
- [ ] 编译通过
- [ ] golangci-lint 通过

---

### 任务 1.3: WebSocket 网关基础

**任务 ID**: AR-T1.3
**任务类型**: Backend
**优先级**: P0
**预计工时**: 12h
**依赖**: AR-T1.2
**负责人**: Backend Lead

**具体步骤**:
1. [ ] 创建 `backend/internal/ws/ar_gateway.go`
2. [ ] 实现连接管理
3. [ ] 实现消息路由
4. [ ] 实现心跳检测
5. [ ] 实现错误处理
6. [ ] 实现限流控制

**代码结构**:
```go
// backend/internal/ws/ar_gateway.go

package ws

import (
    "net/http"
    "github.com/gorilla/websocket"
    "github.com/redis/go-redis/v9"
)

type ARGateway struct {
    upgrader    websocket.Upgrader
    redis       *redis.Client
    connections  sync.Map  // device_id -> *Client
    sessions    sync.Map  // session_id -> *Session
    handlers    map[string]MessageHandler
}

func NewARGateway(redis *redis.Client) *ARGateway {
    gateway := &ARGateway{
        upgrader: websocket.Upgrader{
            CheckOrigin: func(r *http.Request) bool {
                return true // 生产环境需要验证
            },
            ReadBufferSize:  1024,
            WriteBufferSize: 1024,
        },
        redis: redis,
    }
    
    gateway.registerHandlers()
    return gateway
}

func (g *ARGateway) HandleConnection(w http.ResponseWriter, r *http.Request) {
    // 1. 升级到 WebSocket
    conn, err := g.upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Error("WebSocket upgrade failed:", err)
        return
    }
    
    // 2. 鉴权
    token := r.URL.Query().Get("token")
    claims, err := g.authenticate(token)
    if err != nil {
        conn.WriteJSON(Message{Type: "error", Payload: err.Error()})
        conn.Close()
        return
    }
    
    // 3. 创建客户端
    client := NewClient(conn, claims.UserID, claims.TenantID)
    
    // 4. 注册连接
    g.connections.Store(claims.UserID, client)
    
    // 5. 处理消息
    go client.HandleMessages(g)
}
```

**验收标准**:
- [ ] WebSocket 连接正常
- [ ] 消息路由正常
- [ ] 心跳检测正常
- [ ] 限流控制正常

---

### 任务 1.4: 消息协议定义

**任务 ID**: AR-T1.4
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T1.3
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/ws/message.go`
2. [ ] 定义消息类型
3. [ ] 定义消息结构体
4. [ ] 实现序列化/反序列化

**消息类型定义**:
```go
// backend/internal/ws/message.go

type MessageType string

const (
    // 连接相关
    MsgTypeConnect     MessageType = "connect"
    MsgTypeDisconnect  MessageType = "disconnect"
    
    // 视频流相关
    MsgTypeVideoFrame  MessageType = "video_frame"
    MsgTypeVideoStart  MessageType = "video_start"
    MsgTypeVideoStop   MessageType = "video_stop"
    
    // AI 检测相关
    MsgTypeDetection   MessageType = "detection_result"
    MsgTypeAnnotation  MessageType = "ar_annotation"
    
    // 远程协助相关
    MsgTypeExpertAnnotation MessageType = "expert_annotation"
    MsgTypeGuidance         MessageType = "guidance"
    
    // 错误
    MsgTypeError       MessageType = "error"
)

type Message struct {
    Type    MessageType     `json:"type"`
    Action  string          `json:"action,omitempty"`
    Payload json.RawMessage `json:"payload"`
}
```

**验收标准**:
- [ ] 消息类型定义完整
- [ ] 序列化正常
- [ ] 反序列化正常

---

### 任务 1.5: Redis 会话管理

**任务 ID**: AR-T1.5
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T1.3
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/ws/session_manager.go`
2. [ ] 实现会话存储
3. [ ] 实现会话查询
4. [ ] 实现会话过期

**验收标准**:
- [ ] 会话存储正常
- [ ] 会话查询正常
- [ ] 过期清理正常

---

### 任务 1.6: 消息广播服务

**任务 ID**: AR-T1.6
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T1.3, AR-T1.5
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/ws/broadcaster.go`
2. [ ] 实现广播功能
3. [ ] 实现组播功能
4. [ ] 实现单播功能

**验收标准**:
- [ ] 广播正常
- [ ] 组播正常
- [ ] 单播正常

---

### 任务 1.7: 基础 API 路由

**任务 ID**: AR-T1.7
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T1.2
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/router/ar_router.go`
2. [ ] 注册设备管理路由
3. [ ] 注册会话管理路由
4. [ ] 注册事件管理路由

**验收标准**:
- [ ] 路由注册正常
- [ ] 基础 API 可访问

---

### 任务 1.8: 单元测试

**任务 ID**: AR-T1.8
**任务类型**: Testing
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T1.3, AR-T1.4, AR-T1.5
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/ws/ar_gateway_test.go`
2. [ ] 创建 `backend/internal/ws/message_test.go`
3. [ ] 创建 `backend/internal/ws/session_manager_test.go`

**验收标准**:
- [ ] 测试覆盖率 > 70%
- [ ] 所有测试通过

---

## Phase 2: 设备与视频流 (Week 3-4)

### 任务 2.1: 设备管理服务

**任务 ID**: AR-T2.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T1.2
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/service/ar_device_service.go`
2. [ ] 实现设备注册
3. [ ] 实现设备查询
4. [ ] 实现设备状态更新
5. [ ] 实现设备删除

**验收标准**:
- [ ] 设备注册成功
- [ ] 设备列表正常
- [ ] 状态更新正常

---

### 任务 2.2: 设备管理 Handler

**任务 ID**: AR-T2.2
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T2.1
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/handler/ar_device_handler.go`
2. [ ] 实现 HTTP 处理函数
3. [ ] 添加输入验证
4. [ ] 添加权限检查

**验收标准**:
- [ ] 所有 API 端点正常
- [ ] 输入验证正常

---

### 任务 2.3: 会话管理服务

**任务 ID**: AR-T2.3
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T2.1
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/service/ar_session_service.go`
2. [ ] 实现会话创建
3. [ ] 实现会话查询
4. [ ] 实现会话加入
5. [ ] 实现会话结束
6. [ ] 实现会话统计

**验收标准**:
- [ ] 会话创建成功
- [ ] 会话加入成功
- [ ] 会话结束正常
- [ ] 统计准确

---

### 任务 2.4: 会话管理 Handler

**任务 ID**: AR-T2.4
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T2.3
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/handler/ar_session_handler.go`
2. [ ] 实现 HTTP 处理函数
3. [ ] 添加权限检查

**验收标准**:
- [ ] 所有 API 端点正常
- [ ] 权限检查正常

---

### 任务 2.5: 视频流处理

**任务 ID**: AR-T2.5
**任务类型**: Backend
**优先级**: P0
**预计工时**: 12h
**依赖**: AR-T1.3
**负责人**: Backend Lead

**具体步骤**:
1. [ ] 创建 `backend/internal/ws/video_handler.go`
2. [ ] 实现视频帧接收
3. [ ] 实现视频帧解码
4. [ ] 实现帧分发
5. [ ] 实现关键帧处理

**代码结构**:
```go
// backend/internal/ws/video_handler.go

package ws

type VideoHandler struct {
    gateway       *ARGateway
    frameBuffer   *RingBuffer
    aiServiceAddr string
}

func (h *VideoHandler) HandleVideoFrame(client *Client, msg *Message) error {
    // 1. 解析视频帧
    var frame VideoFrame
    if err := json.Unmarshal(msg.Payload, &frame); err != nil {
        return err
    }
    
    // 2. 验证帧顺序
    if !h.validateFrameSequence(frame) {
        return ErrFrameOutOfOrder
    }
    
    // 3. 发送到 AI 服务
    go h.sendToAIService(frame)
    
    // 4. 广播到专家端
    if client.Session != nil {
        h.broadcastToExperts(client.Session.ID, msg)
    }
    
    return nil
}

func (h *VideoHandler) sendToAIService(frame VideoFrame) error {
    // 调用 Python AI 服务
    resp, err := http.Post(
        fmt.Sprintf("http://%s/detect", h.aiServiceAddr),
        "application/json",
        toJSON(frame),
    )
    if err != nil {
        log.Error("Failed to send frame to AI service:", err)
        return err
    }
    defer resp.Body.Close()
    
    return nil
}
```

**验收标准**:
- [ ] 视频帧接收正常
- [ ] 帧顺序正确
- [ ] 分发正常
- [ ] 延迟 < 500ms

---

### 任务 2.6: 视频压缩与优化

**任务 ID**: AR-T2.6
**任务类型**: Backend
**优先级**: P1
**预计工时**: 8h
**依赖**: AR-T2.5
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 实现 H.265 编码支持
2. [ ] 实现分辨率自适应
3. [ ] 实现帧率控制

**验收标准**:
- [ ] H.265 编码正常
- [ ] 分辨率自适应正常
- [ ] 带宽降低 50%

---

### 任务 2.7: Redis Pub/Sub 集成

**任务 ID**: AR-T2.7
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T1.5
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 Redis Pub/Sub 客户端
2. [ ] 实现订阅逻辑
3. [ ] 实现发布逻辑

**验收标准**:
- [ ] 发布正常
- [ ] 订阅正常
- [ ] 消息不丢失

---

### 任务 2.8: 集成测试

**任务 ID**: AR-T2.8
**任务类型**: Testing
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T2.1, AR-T2.3, AR-T2.5
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建设备管理测试
2. [ ] 创建会话管理测试
3. [ ] 创建视频流测试

**验收标准**:
- [ ] 所有测试通过
- [ ] 测试覆盖率 > 70%

---

## Phase 3: AI 检测与标注 (Week 5-6)

### 任务 3.1: AI 服务基础架构

**任务 ID**: AR-T3.1
**任务类型**: AI
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T2.5
**负责人**: AI Lead

**具体步骤**:
1. [ ] 创建 `ai-service/ar/detector.py`
2. [ ] 实现 YOLO 模型加载
3. [ ] 实现推理接口
4. [ ] 实现结果后处理

**代码结构**:
```python
# ai-service/ar/detector.py

from ultralytics import YOLO
from typing import List, Dict
import numpy as np

class ARDefectDetector:
    """AR 缺陷检测器"""
    
    DEFECT_TYPE_MAP = {
        0: 'fire',
        1: 'crack',
        2: 'flood',
        3: 'intrusion'
    }
    
    SEVERITY_THRESHOLDS = {
        'fire': {'critical': 0.8, 'major': 0.6, 'minor': 0.0},
        'crack': {'critical': 0.7, 'major': 0.5, 'minor': 0.0},
        'flood': {'critical': 0.75, 'major': 0.55, 'minor': 0.0},
        'intrusion': {'critical': 0.9, 'major': 0.7, 'minor': 0.0}
    }
    
    def __init__(self, model_path: str = 'yolov8n.pt'):
        self.model = YOLO(model_path)
    
    async def detect(self, frame_data: bytes) -> List[Dict]:
        """检测视频帧中的缺陷"""
        # 解码帧
        image = self.decode_frame(frame_data)
        
        # YOLO 推理
        results = self.model.predict(image, conf=0.5, verbose=False)
        
        # 解析结果
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                detection = self.parse_detection(box)
                detections.append(detection)
        
        return detections
    
    def parse_detection(self, box) -> Dict:
        """解析检测结果"""
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        defect_type = self.DEFECT_TYPE_MAP.get(class_id, 'unknown')
        
        # 计算严重程度
        severity = self.calculate_severity(defect_type, confidence)
        
        return {
            'defect_type': defect_type,
            'confidence': confidence,
            'severity': severity,
            'bbox': {
                'x': int(box.xyxy[0][0].item()),
                'y': int(box.xyxy[0][1].item()),
                'width': int((box.xyxy[0][2] - box.xyxy[0][0]).item()),
                'height': int((box.xyxy[0][3] - box.xyxy[0][1]).item())
            }
        }
    
    def calculate_severity(self, defect_type: str, confidence: float) -> str:
        """计算严重程度"""
        thresholds = self.SEVERITY_THRESHOLDS.get(defect_type, {})
        if confidence >= thresholds.get('critical', 0.8):
            return 'critical'
        elif confidence >= thresholds.get('major', 0.6):
            return 'major'
        else:
            return 'minor'
```

**验收标准**:
- [ ] 模型加载正常
- [ ] 推理正常
- [ ] 延迟 < 100ms

---

### 任务 3.2: AR 标注生成服务

**任务 ID**: AR-T3.2
**任务类型**: AI
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T3.1
**负责人**: AI Lead

**具体步骤**:
1. [ ] 创建 `ai-service/ar/annotation_generator.py`
2. [ ] 实现标注生成逻辑
3. [ ] 实现颜色映射
4. [ ] 实现标注推送

**验收标准**:
- [ ] 标注生成正确
- [ ] 颜色映射正确
- [ ] 推送正常

---

### 任务 3.3: FastAPI 接口

**任务 ID**: AR-T3.3
**任务类型**: AI
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T3.1
**负责人**: AI Lead

**具体步骤**:
1. [ ] 创建 `ai-service/ar/router.py`
2. [ ] 实现检测接口
3. [ ] 实现批量检测接口
4. [ ] 实现健康检查

**API 定义**:
```python
# ai-service/ar/router.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/ar", tags=["AR Detection"])

class DetectionRequest(BaseModel):
    frame_data: str  # Base64 编码的视频帧
    device_id: str
    session_id: str
    timestamp: int

class DetectionResponse(BaseModel):
    session_id: str
    detections: List[Dict]
    processing_time_ms: float

@router.post("/detect", response_model=DetectionResponse)
async def detect_defects(request: DetectionRequest):
    """检测视频帧中的缺陷"""
    start_time = time.time()
    
    # 检测
    detections = await detector.detect(request.frame_data)
    
    # 生成标注
    annotations = annotation_generator.generate(detections)
    
    # 推送到 Go 服务
    await push_to_gateway(request.session_id, annotations)
    
    processing_time = (time.time() - start_time) * 1000
    
    return DetectionResponse(
        session_id=request.session_id,
        detections=detections,
        processing_time_ms=processing_time
    )
```

**验收标准**:
- [ ] API 可访问
- [ ] 检测正常
- [ ] 响应正确

---

### 任务 3.4: 标注推送集成

**任务 ID**: AR-T3.4
**任务类型**: AI
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T3.2, AR-T3.3
**负责人**: AI Lead

**具体步骤**:
1. [ ] 实现 Redis 发布
2. [ ] 实现 WebSocket 推送
3. [ ] 实现重试机制

**验收标准**:
- [ ] 推送延迟 < 200ms
- [ ] 重试机制正常

---

### 任务 3.5: 性能优化

**任务 ID**: AR-T3.5
**任务类型**: AI
**优先级**: P1
**预计工时**: 8h
**依赖**: AR-T3.1
**负责人**: AI Lead

**具体步骤**:
1. [ ] 实现 INT8 量化
2. [ ] 实现批处理
3. [ ] 实现结果缓存

**验收标准**:
- [ ] 推理速度提升 2x
- [ ] 内存使用降低 50%

---

### 任务 3.6: 单元测试

**任务 ID**: AR-T3.6
**任务类型**: Testing
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T3.1, AR-T3.2, AR-T3.3
**负责人**: AI Lead

**具体步骤**:
1. [ ] 创建检测器测试
2. [ ] 创建标注生成测试
3. [ ] 创建 API 测试

**验收标准**:
- [ ] 测试覆盖率 > 70%
- [ ] 所有测试通过

---

## Phase 4: 远程协助 (Week 7-8)

### 任务 4.1: 远程协助服务

**任务 ID**: AR-T4.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 12h
**依赖**: AR-T2.5
**负责人**: Backend Lead

**具体步骤**:
1. [ ] 创建 `backend/internal/service/remote_assist_service.go`
2. [ ] 实现专家标注
3. [ ] 实现标注同步
4. [ ] 实现语音消息

**验收标准**:
- [ ] 标注同步正常
- [ ] 延迟 < 200ms

---

### 任务 4.2: 专家端 Web 组件

**任务 ID**: AR-T4.2
**任务类型**: Frontend
**优先级**: P0
**预计工时**: 12h
**依赖**: AR-T4.1
**负责人**: Frontend Dev

**具体步骤**:
1. [ ] 创建 `frontend/src/components/ar/RemoteAssist.tsx`
2. [ ] 实现视频播放
3. [ ] 实现标注工具
4. [ ] 实现标注列表

**验收标准**:
- [ ] 视频播放正常
- [ ] 标注工具正常
- [ ] 响应流畅

---

### 任务 4.3: 专家端页面

**任务 ID**: AR-T4.3
**任务类型**: Frontend
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T4.2
**负责人**: Frontend Dev

**具体步骤**:
1. [ ] 创建 `frontend/src/pages/RemoteAssist.tsx`
2. [ ] 实现设备列表
3. [ ] 实现视频区域
4. [ ] 实现工具栏
5. [ ] 实现会话控制

**验收标准**:
- [ ] 页面功能完整
- [ ] 布局合理
- [ ] 交互流畅

---

### 任务 4.4: WebSocket 客户端

**任务 ID**: AR-T4.4
**任务类型**: Frontend
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T1.3
**负责人**: Frontend Dev

**具体步骤**:
1. [ ] 创建 `frontend/src/services/ar/WebSocketClient.ts`
2. [ ] 实现连接管理
3. [ ] 实现消息处理
4. [ ] 实现重连机制

**代码结构**:
```typescript
// frontend/src/services/ar/WebSocketClient.ts

class ARWebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    
    constructor(
        private url: string,
        private onMessage: (msg: ARMessage) => void,
        private onError: (err: Error) => void,
        private onConnect: () => void,
        private onDisconnect: () => void
    ) {}
    
    connect(token: string, sessionId: string): void {
        const wsUrl = `${this.url}?token=${token}&session_id=${sessionId}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.onConnect();
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.onMessage(message);
        };
        
        this.ws.onerror = (error) => {
            this.onError(new Error('WebSocket error'));
        };
        
        this.ws.onclose = () => {
            this.onDisconnect();
            this.attemptReconnect();
        };
    }
    
    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000;
            setTimeout(() => this.connect(token, sessionId), delay);
        }
    }
    
    send(message: ARMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    disconnect(): void {
        this.ws?.close();
    }
}
```

**验收标准**:
- [ ] 连接正常
- [ ] 重连机制正常
- [ ] 消息收发正常

---

### 任务 4.5: 事件管理

**任务 ID**: AR-T4.5
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: AR-T2.3
**负责人**: Backend Dev

**具体步骤**:
1. [ ] 创建 `backend/internal/service/ar_event_service.go`
2. [ ] 实现事件记录
3. [ ] 实现事件查询
4. [ ] 实现事件确认

**验收标准**:
- [ ] 事件记录正常
- [ ] 查询正常

---

### 任务 4.6: 集成测试与优化

**任务 ID**: AR-T4.6
**任务类型**: Testing
**优先级**: P0
**预计工时**: 8h
**依赖**: AR-T4.1, AR-T4.4, AR-T4.5
**负责人**: Frontend Dev

**具体步骤**:
1. [ ] 创建端到端测试
2. [ ] 性能测试
3. [ ] 稳定性测试
4. [ ] 优化改进

**验收标准**:
- [ ] 所有测试通过
- [ ] 性能达标
- [ ] 稳定性达标

---

## 里程碑

### Milestone 1: 基础架构完成 (Week 2 结束)
- [ ] 数据库表创建完成
- [ ] WebSocket 网关运行正常
- [ ] 消息协议定义完成

### Milestone 2: 设备与视频流完成 (Week 4 结束)
- [ ] 设备管理功能完成
- [ ] 视频流转正常
- [ ] 会话管理功能完成

### Milestone 3: AI 检测完成 (Week 6 结束)
- [ ] YOLO 检测正常
- [ ] AR 标注生成正常
- [ ] 标注推送正常

### Milestone 4: 远程协助完成 (Week 8 结束)
- [ ] 远程协助功能完成
- [ ] Web 端专家界面完成
- [ ] 集成测试通过

---

## 资源分配

### Backend Lead
- AR-T1.3: WebSocket 网关
- AR-T2.5: 视频流处理
- AR-T4.1: 远程协助服务

### Backend Dev
- AR-T1.1, AR-T1.2, AR-T1.4, AR-T1.5, AR-T1.6, AR-T1.7, AR-T1.8
- AR-T2.1, AR-T2.2, AR-T2.3, AR-T2.4, AR-T2.6, AR-T2.7, AR-T2.8
- AR-T4.5: 事件管理

### AI Lead
- AR-T3.1, AR-T3.2, AR-T3.3, AR-T3.4, AR-T3.5, AR-T3.6

### Frontend Dev
- AR-T4.2, AR-T4.3, AR-T4.4, AR-T4.6

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-02
**维护人**: AI Assistant
