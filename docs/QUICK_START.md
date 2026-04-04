# 巡检宝 - 快速开始指南

> 版本：v2.1.0
> 日期：2026-04-03

---

## 🚀 快速开始

### 1. Docker Compose 部署 (推荐)

```bash
cd xunjianbao

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

服务端口：
- 前端: http://localhost:3000
- 后端: http://localhost:8094
- OpenClaw: http://localhost:8096
- AI Service: http://localhost:8095

### 2. 本地开发部署

#### 后端
```bash
cd backend

# 设置环境变量
export DATABASE_URL="root:password@tcp(localhost:3306)/xunjianbao"
export JWT_SECRET="your-jwt-secret-at-least-32-chars"
export OPENCLAW_URL="http://localhost:8096"
export AI_SERVICE_URL="http://localhost:8095"

# 编译
go build -o xunjianbao-server ./cmd/server

# 启动
./xunjianbao-server
```

#### 前端
```bash
cd frontend
pnpm install
pnpm dev
```

### 3. 测试健康检查

```bash
curl http://localhost:8094/health
```

预期响应：
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### 4. 测试AI功能

#### 测试 AI 中心
```bash
curl -X GET http://localhost:8094/api/v1/ai/inspection \
  -H "Authorization: Bearer $TOKEN"
```

#### 测试 YOLO 检测
```bash
curl -X POST http://localhost:8094/api/v1/ai/detection \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stream_id":"stream-001","types":["fire","smoke"]}'
```

#### 获取检测告警
```bash
curl -X GET http://localhost:8094/api/v1/alerts?stream_id=stream-001 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📂 项目结构

```
xunjianbao/
├── backend/                          # Go后端
│   ├── cmd/server/main.go            # 服务入口
│   ├── internal/
│   │   ├── handler/                 # HTTP处理器
│   │   │   ├── ai_center_handler.go     # AI中心
│   │   │   ├── oncall_analyst_handler.go  # AI值班分析师
│   │   │   ├── report_handler.go      # 报告生成
│   │   │   ├── qa_handler.go         # 智能问答
│   │   │   ├── tenant_config_handler.go  # 租户配置
│   │   │   └── device_health_predictor.go # 设备健康预测
│   │   ├── service/                 # 业务逻辑
│   │   │   ├── yolo_detection_service.go  # YOLO检测
│   │   │   ├── knowledge_base_rag_service.go  # 知识库RAG
│   │   │   └── ...
│   │   ├── model/                   # 数据模型
│   │   └── router/                  # 路由
│   └── pkg/
│       ├── ai_service/              # AI服务HTTP客户端
│       └── openclaw/                # OpenClaw客户端
│
├── frontend/                         # React前端
│   └── src/
│       ├── routes/                 # 页面路由
│       ├── components/             # 组件
│       └── api/                   # API调用
│
├── ai-service/                      # Python AI服务
│   └── yolo/                      # YOLO推理
│
└── docs/                            # 文档
```

---

## 🎯 核心功能

### 1. AI 值班分析师
- 7x24小时智能告警分析
- 相似历史告警检索
- 故障原因分析
- 处置建议生成

### 2. 一键报告生成
- 日报/周报/月报自动生成
- AI填充报告内容
- PDF导出

### 3. 智能运维问答
- NL2SQL自然语言查询
- RAG知识库问答
- 意图自动识别

### 4. YOLO 检测
- 火焰检测
- 烟雾检测
- 入侵检测
- 设备异常检测

### 5. 预测性维护
- 设备健康评分
- 故障概率预测
- 维护计划建议

---

## 🔌 API端点

### 认证
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/logout` - 用户登出

### 告警
- `GET /api/v1/alerts` - 获取告警列表
- `POST /api/v1/alerts/:id/resolve` - 解决告警

### AI 功能
- `GET /api/v1/ai/inspection` - 智能巡检
- `POST /api/v1/ai/detection` - YOLO目标检测
- `POST /api/v1/ai/oncall/analyze/:alert_id` - 触发AI分析
- `GET /api/v1/ai/oncall/analysis/:alert_id` - 获取分析结果
- `POST /api/v1/ai/reports/generate` - 生成报告
- `POST /api/v1/ai/qa/chat` - 智能问答

### 仪表盘
- `GET /api/v1/dashboard/stats` - 获取统计数据
- `GET /api/v1/dashboard/health` - 获取健康状态

---

## 📊 性能指标

| 指标 | 目标值 | 状态 |
|------|--------|------|
| 后端API响应 P95 | < 200ms | ✅ |
| YOLO推理延迟 | < 100ms | ✅ |
| 前端首屏加载 | < 3s | ✅ |
| AI对话响应 | < 2s | ✅ |

---

## 🔐 安全

- JWT认证
- 多租户隔离
- 敏感信息环境变量管理

---

## 📞 技术支持

- 邮箱: support@xunjianbao.com

---

**文档版本**: v2.1.0
**最后更新**: 2026-04-03
