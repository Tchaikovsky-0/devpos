# 巡检宝 - 端到端测试指南

> **版本**: v1.0.0
> **更新日期**: 2026-04-03

## 概述

本文档记录巡检宝项目的端到端测试流程，用于验证各模块功能的完整集成。

## 测试环境要求

### 硬件要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 4 核 | 8 核+ |
| 内存 | 8GB | 16GB+ |
| 磁盘 | 20GB 可用 | 50GB+ |
| GPU | 可选 | NVIDIA RTX 3080+ (用于 YOLO) |

### 软件要求

```bash
# Docker 和 Docker Compose
Docker version 20.10+
Docker Compose v2.0+

# Node.js (前端开发)
Node.js >= 18.0.0
pnpm >= 8.0.0

# Go (后端开发)
Go >= 1.21
```

## 快速启动测试环境

### 1. 使用 Docker Compose 启动所有服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 服务端口

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | React 应用 |
| 后端 API | http://localhost:8094 | Go REST API |
| OpenClaw | http://localhost:8096 | AI Agent |
| AI Service | http://localhost:8095 | YOLO 检测服务 |
| Swagger UI | http://localhost:8094/swagger/index.html | API 文档 |
| Prometheus | http://localhost:9090 | 指标监控 |
| Grafana | http://localhost:3001 | 可视化监控 |

### 3. 验证服务健康

```bash
# 后端健康检查
curl http://localhost:8094/api/health

# OpenClaw 健康检查
curl http://localhost:8096/health

# AI Service 健康检查
curl http://localhost:8095/health
```

---

## 模块测试流程

### 模块 1: 用户认证

**测试目标**: 验证用户注册、登录、JWT 认证功能

**测试步骤**:

```bash
# 1. 注册新用户
curl -X POST http://localhost:8094/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'

# 2. 用户登录
curl -X POST http://localhost:8094/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'

# 3. 使用 Token 访问受保护资源
curl -X GET http://localhost:8094/api/v1/streams \
  -H "Authorization: Bearer <token>"
```

**预期结果**:
- ✅ 注册返回用户 ID 和成功消息
- ✅ 登录返回 JWT token
- ✅ Token 有效时可访问受保护资源
- ✅ Token 过期或无效时返回 401

---

### 模块 2: 视频流管理

**测试目标**: 验证视频流的创建、列表、查看功能

**测试步骤**:

```bash
# 1. 创建视频流
curl -X POST http://localhost:8094/api/v1/streams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Camera 1",
    "type": "rtsp",
    "url": "rtsp://example.com/cam1",
    "location": "Building A"
  }'

# 2. 获取视频流列表
curl -X GET http://localhost:8094/api/v1/streams \
  -H "Authorization: Bearer <token>"

# 3. 获取单个视频流详情
curl -X GET http://localhost:8094/api/v1/streams/<stream_id> \
  -H "Authorization: Bearer <token>"
```

**预期结果**:
- ✅ 创建成功返回视频流 ID
- ✅ 列表返回当前租户的所有视频流
- ✅ 详情返回视频流完整信息

---

### 模块 3: 告警管理

**测试目标**: 验证告警的生成、列表、状态更新功能

**测试步骤**:

```bash
# 1. 获取告警列表
curl -X GET "http://localhost:8094/api/v1/alerts?page=1&page_size=20" \
  -H "Authorization: Bearer <token>"

# 2. 获取告警统计
curl -X GET http://localhost:8094/api/v1/alerts/statistics \
  -H "Authorization: Bearer <token>"

# 3. 更新告警状态
curl -X PUT http://localhost:8094/api/v1/alerts/<alert_id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

**预期结果**:
- ✅ 告警列表返回分页数据
- ✅ 统计返回各状态告警数量
- ✅ 状态更新成功

---

### 模块 4: AI 值班分析师

**测试目标**: 验证 AI 分析告警功能

**测试步骤**:

```bash
# 1. 手动触发告警分析
curl -X POST http://localhost:8094/api/v1/ai/oncall/analyze/<alert_id> \
  -H "Authorization: Bearer <token>"

# 2. 获取分析结果
curl -X GET http://localhost:8094/api/v1/ai/oncall/analysis/<alert_id> \
  -H "Authorization: Bearer <token>"

# 3. SSE 流式订阅 (在另一终端)
curl -N http://localhost:8094/api/v1/ai/oncall/analysis/<alert_id>/stream \
  -H "Authorization: Bearer <token>"
```

**预期结果**:
- ✅ 分析请求返回 202 Accepted
- ✅ 分析结果包含 Summary、Severity、LikelyCause
- ✅ SSE 流在分析完成时推送结果

---

### 模块 5: 一键报告生成

**测试目标**: 验证 AI 报告生成功能

**测试步骤**:

```bash
# 1. 生成日报
curl -X POST http://localhost:8094/api/v1/ai/reports/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "daily",
    "date_range": {
      "start": "2026-04-02",
      "end": "2026-04-02"
    }
  }'

# 2. 获取报告列表
curl -X GET http://localhost:8094/api/v1/ai/reports \
  -H "Authorization: Bearer <token>"

# 3. 获取报告详情
curl -X GET http://localhost:8094/api/v1/ai/reports/<report_id> \
  -H "Authorization: Bearer <token>"
```

**预期结果**:
- ✅ 报告生成请求返回报告 ID
- ✅ 报告内容包含各章节数据和图表
- ✅ 报告可下载

---

### 模块 6: 智能运维问答

**测试目标**: 验证 NL2SQL 和知识库问答功能

**测试步骤**:

```bash
# 1. 发送统计查询
curl -X POST http://localhost:8094/api/v1/ai/qa/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "过去一周总共有多少条告警？"
  }'

# 2. 发送知识库查询
curl -X POST http://localhost:8094/api/v1/ai/qa/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "如何处理设备离线问题？"
  }'

# 3. 发送操作指令
curl -X POST http://localhost:8094/api/v1/ai/qa/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "帮我创建一个巡检任务"
  }'
```

**预期结果**:
- ✅ 统计查询返回 SQL 和查询结果
- ✅ 知识库查询返回相关内容
- ✅ 操作指令返回执行结果或确认

---

### 模块 7: YOLO 检测服务

**测试目标**: 验证 YOLO 火灾/入侵检测功能

**测试步骤**:

```bash
# 1. 获取检测模型列表
curl -X GET http://localhost:8095/api/v1/models \
  -H "Content-Type: application/json"

# 2. 上传图片进行检测
curl -X POST http://localhost:8095/api/v1/detect \
  -F "image=@test_image.jpg" \
  -F "model=yolov8n-fire"

# 3. 获取检测统计
curl -X GET http://localhost:8095/api/v1/statistics

# 4. 获取活跃告警
curl -X GET http://localhost:8095/api/v1/alerts?status=active
```

**预期结果**:
- ✅ 模型列表返回可用模型
- ✅ 检测返回 bounding box 和置信度
- ✅ 统计返回检测数量和类型分布

---

### 模块 8: 多租户 AI 配置

**测试目标**: 验证租户级 AI 配置功能

**测试步骤**:

```bash
# 1. 获取当前租户 AI 配置
curl -X GET http://localhost:8094/api/v1/ai/config \
  -H "Authorization: Bearer <token>"

# 2. 更新 AI 配置
curl -X PUT http://localhost:8094/api/v1/ai/config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_model": "qwen-plus",
    "enable_auto_analyze": true,
    "enable_nl2sql": true
  }'

# 3. 管理员获取所有租户配置
curl -X GET http://localhost:8094/api/v1/admin/ai/configs \
  -H "Authorization: Bearer <admin_token>"
```

**预期结果**:
- ✅ 获取配置返回当前租户的 AI 设置
- ✅ 更新配置返回更新后的配置
- ✅ 管理员可查看所有租户配置

---

## 前端功能测试

### 测试清单

| 功能 | 测试内容 | 预期结果 |
|------|----------|----------|
| 登录 | 输入正确凭据登录 | 登录成功，跳转到首页 |
| 登录 | 输入错误凭据 | 显示错误提示 |
| 视频流列表 | 查看视频流卡片 | 显示流名称、状态、缩略图 |
| 告警列表 | 查看告警列表 | 显示告警等级、类型、时间 |
| 告警详情 | 点击告警查看详情 | 显示告警信息和 AI 分析 |
| AI 对话 | 发送问题 | AI 返回回答 |
| 报告生成 | 选择日期生成报告 | 显示生成进度和预览 |
| 设置 | 修改 AI 配置 | 配置保存成功 |

---

## 性能测试

### 压力测试

```bash
# 使用 wrk 进行 API 压力测试
wrk -t4 -c100 -d30s http://localhost:8094/api/v1/streams

# 使用 ab 进行并发测试
ab -n 1000 -c 100 http://localhost:8094/api/v1/streams
```

### 性能指标

| 指标 | 目标值 | 可接受 |
|------|--------|--------|
| API 响应时间 P50 | < 100ms | < 200ms |
| API 响应时间 P99 | < 500ms | < 1s |
| 并发用户数 | > 100 | > 50 |
| 前端首屏加载 | < 3s | < 5s |
| 前端 Lighthouse | > 90 | > 80 |

---

## 故障排查

### 常见问题

#### 1. 服务启动失败

```bash
# 检查 Docker 状态
docker-compose ps

# 查看服务日志
docker-compose logs <service_name>

# 重启服务
docker-compose restart <service_name>
```

#### 2. 数据库连接失败

```bash
# 检查 MySQL 容器
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 进入 MySQL 容器
docker-compose exec mysql mysql -u root -p
```

#### 3. AI 服务调用失败

```bash
# 检查 AI Service 健康
curl http://localhost:8095/health

# 查看 AI Service 日志
docker-compose logs ai-service

# 检查 OpenClaw 连接
curl http://localhost:8096/health
```

#### 4. 前端构建失败

```bash
# 清理缓存
cd frontend && rm -rf node_modules .vite dist

# 重新安装依赖
pnpm install

# 重新构建
pnpm build
```

---

## 测试报告模板

```markdown
# 端到端测试报告

**测试日期**: YYYY-MM-DD
**测试人员**:
**测试环境**:

## 测试结果汇总

| 模块 | 测试用例数 | 通过数 | 失败数 | 通过率 |
|------|-----------|--------|--------|--------|
| 用户认证 | X | X | X | X% |
| 视频流管理 | X | X | X | X% |
| 告警管理 | X | X | X | X% |
| AI 值班分析师 | X | X | X | X% |
| 报告生成 | X | X | X | X% |
| 智能问答 | X | X | X | X% |
| YOLO 检测 | X | X | X | X% |
| 多租户配置 | X | X | X | X% |

## 问题记录

### P0 问题 (阻断)

| ID | 问题描述 | 严重程度 | 状态 |
|----|----------|----------|------|
| | | | |

### P1 问题 (严重)

| ID | 问题描述 | 严重程度 | 状态 |
|----|----------|----------|------|
| | | | |

### P2 问题 (一般)

| ID | 问题描述 | 严重程度 | 状态 |
|----|----------|----------|------|
| | | | |

## 总结

- 测试覆盖率: X%
- 发现问题总数: X
- 已解决问题: X
- 遗留问题: X
- 测试结论:

## 签名

- 测试人员:
- 日期:
```

---

**最后更新**: 2026-04-03
