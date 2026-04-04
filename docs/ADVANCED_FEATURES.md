# 巡检宝高级功能开发 - Phase 2

> 版本：v2.0.0
> 日期：2026-04-02

---

## 🎯 新增高级功能

### 1. 预测性分析服务
**文件**: `backend/internal/service/predictive_analysis_service.go`

**功能**：
- 📊 存储使用预测 - 预测未来N天的存储使用情况
- 📈 告警趋势预测 - 预测告警数量变化趋势
- ⚠️ 设备故障预测 - 预测设备可能故障的时间
- 📶 网络质量预测 - 预测网络延迟和稳定性
- 🔄 批量预测 - 批量预测多个设备

**API端点**：
```
GET  /api/v1/ai/predict/storage/:device_id
GET  /api/v1/ai/predict/alerts
GET  /api/v1/ai/predict/failure/:device_id
GET  /api/v1/ai/predict/network/:device_id
POST /api/v1/ai/predict/batch
```

### 2. 自动化运维服务
**文件**: `backend/internal/service/auto_operations_service.go`

**功能**：
- 🧹 自动清理存储 - 自动清理过期数据
- 🔄 自动重启服务 - 自动重启异常服务
- 📊 自动调整阈值 - 根据历史数据自动调整告警阈值
- ⏰ 计划任务管理 - 创建、管理自动化计划任务
- 📜 执行历史 - 记录所有自动化操作历史

**API端点**：
```
POST /api/v1/ai/ops/cleanup
POST /api/v1/ai/ops/restart
POST /api/v1/ai/ops/adjust-threshold
GET  /api/v1/ai/ops/scheduled
POST /api/v1/ai/ops/scheduled
GET  /api/v1/ai/ops/history
```

### 3. WebSocket实时通信
**文件**: `backend/internal/websocket/ai_ws_handler.go`

**功能**：
- 🔌 实时AI对话 - WebSocket双向通信
- 📡 实时巡检 - 实时推送巡检进度和结果
- ⚡ 实时告警 - 实时推送告警通知
- 📊 实时诊断 - 实时诊断设备状态
- 👥 多客户端支持 - 支持多个WebSocket客户端

**WebSocket端点**：
```
ws://localhost:8094/ws/ai/chat
```

**支持的消息类型**：
```json
{
  "type": "chat|inspection|analysis|diagnosis",
  "payload": {...},
  "timestamp": "2026-04-02T10:00:00Z"
}
```

---

## 🚀 快速开始

### 1. 启动后端
```bash
cd backend
go build -o xunjianbao-server ./cmd/server
./xunjianbao-server
```

### 2. 测试预测性分析
```bash
# 预测存储使用
curl http://localhost:8094/api/v1/ai/predict/storage/device-001

# 预测告警趋势
curl http://localhost:8094/api/v1/ai/predict/alerts

# 批量预测
curl -X POST http://localhost:8094/api/v1/ai/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"device_ids":["device-001","device-002","device-003"]}'
```

### 3. 测试自动化运维
```bash
# 自动清理存储
curl -X POST http://localhost:8094/api/v1/ai/ops/cleanup \
  -H "Content-Type: application/json" \
  -d '{"device_id":"storage-001","retention_days":30}'

# 获取计划任务
curl http://localhost:8094/api/v1/ai/ops/scheduled

# 获取执行历史
curl http://localhost:8094/api/v1/ai/ops/history
```

### 4. 测试WebSocket
```javascript
// 前端WebSocket连接示例
const ws = new WebSocket('ws://localhost:8094/ws/ai/chat?client_id=test');

ws.onopen = () => {
  console.log('Connected to AI WebSocket');

  // 发送聊天消息
  ws.send(JSON.stringify({
    type: 'chat',
    payload: { content: '执行系统巡检' },
    timestamp: new Date().toISOString()
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

---

## 📊 功能详解

### 预测性分析

#### 存储使用预测
```json
{
  "device_id": "storage-001",
  "device_name": "主存储",
  "prediction_type": "storage_usage",
  "predicted_value": 75.0,
  "confidence": 0.85,
  "time_range": "未来7天",
  "risk_level": "medium",
  "recommendations": [
    "关注存储使用趋势",
    "计划清理时间"
  ]
}
```

#### 告警趋势预测
```json
{
  "type": "alert_count",
  "direction": "increasing",
  "change_rate": 5.0,
  "forecast": 15.5,
  "confidence": 0.78
}
```

### 自动化运维

#### 自动化任务类型
1. **存储清理** - 自动清理过期数据
2. **服务重启** - 自动重启异常服务
3. **阈值调整** - 根据历史数据自动调整阈值

#### 计划任务示例
```json
{
  "id": "schedule-001",
  "name": "每日存储清理",
  "type": "storage_cleanup",
  "schedule": "0 2 * * *",
  "enabled": true,
  "description": "每天凌晨2点自动清理过期数据"
}
```

### WebSocket实时通信

#### 客户端发送消息
```json
{
  "type": "chat",
  "payload": {
    "content": "执行系统巡检"
  },
  "timestamp": "2026-04-02T10:00:00Z"
}
```

#### 服务端响应
```json
{
  "type": "inspection_result",
  "payload": {
    "status": "completed",
    "checked": 5,
    "normal": 4,
    "issues": 1,
    "summary": "发现1个问题：存储空间使用率较高（75%）"
  },
  "timestamp": "2026-04-02T10:00:01Z"
}
```

---

## 🎨 技术架构

```
┌─────────────────────────────────────────┐
│              前端 (WebSocket)              │
│  ┌──────────────────────────────────┐  │
│  │  WebSocket Client                  │  │
│  │  - AI Chat                       │  │
│  │  - Real-time Updates             │  │
│  └──────────────────────────────────┘  │
└────────────────────┬────────────────────┘
                     │ WebSocket
                     ▼
┌─────────────────────────────────────────┐
│         WebSocket Handler                │
│  - AIWebSocketHandler                 │
│  - Multi-client Support               │
│  - Message Routing                   │
└────────────────────┬────────────────────┘
                     │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│预测性分析Service│ │自动化运维Service│ │AI Service   │
│             │ │             │ │             │
│- 存储预测  │ │- 存储清理  │ │- 对话      │
│- 趋势预测  │ │- 服务重启  │ │- 巡检      │
│- 故障预测  │ │- 阈值调整  │ │- 分析      │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔜 下一步计划

### Phase 3: 智能增强
- [ ] 机器学习模型集成
- [ ] 自适应阈值调整
- [ ] 智能告警聚合
- [ ] 根因分析

### Phase 4: 生态系统
- [ ] 第三方集成API
- [ ] Webhook通知
- [ ] 数据导出
- [ ] 移动端支持

---

## 📞 技术支持

- 邮箱: support@xunjianbao.com
- 电话: 400-xxx-xxxx
- 官网: https://xunjianbao.com

---

**文档版本**: v2.0.0
**最后更新**: 2026-04-02
**维护团队**: 巡检宝开发团队
