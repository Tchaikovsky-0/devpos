# 巡检宝 API 文档

> 版本: v1.0.0
> 更新日期: 2026-04-03

## 概述

巡检宝 API 是一个 RESTful API，提供企业级智能监控平台的全部功能。

## Base URL

```
开发环境: http://localhost:8094
```

## 认证

除健康检查和登录/注册接口外，所有接口都需要 JWT Token 认证。

### 请求头格式

```
Authorization: Bearer <token>
```

## 认证流程

### 1. 登录获取 Token

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**响应示例:**

```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "tenant_id": "tenant_abc123"
    }
  }
}
```

### 2. 使用 Token 访问受保护资源

```bash
GET /api/v1/streams
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API 端点

### 健康检查

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /health | 服务健康检查 | 否 |

### 认证

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/auth/login | 用户登录 | 否 |
| POST | /api/v1/auth/register | 用户注册 | 否 |
| POST | /api/v1/auth/logout | 用户登出 | 是 |
| GET | /api/v1/user/info | 获取当前用户信息 | 是 |

### 视频流

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/streams | 获取视频流列表 | 是 |
| POST | /api/v1/streams | 创建视频流 | 是 |
| GET | /api/v1/streams/:id | 获取视频流详情 | 是 |
| PUT | /api/v1/streams/:id | 更新视频流 | 是 |
| DELETE | /api/v1/streams/:id | 删除视频流 | 是 |

### 告警

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/alerts | 获取告警列表 | 是 |
| POST | /api/v1/alerts | 创建告警 | 是 |
| GET | /api/v1/alerts/:id | 获取告警详情 | 是 |
| PUT | /api/v1/alerts/:id | 更新告警 | 是 |
| POST | /api/v1/alerts/:id/resolve | 解决告警 | 是 |

### 仪表盘

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/dashboard/stats | 获取统计信息 | 是 |
| GET | /api/v1/dashboard/health | 获取设备健康统计 | 是 |

### AI 中心

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/ai/center/models | 获取AI模型列表 | 是 |
| POST | /api/v1/ai/center/detect | 发送图片进行AI检测 | 是 |
| GET | /api/v1/ai/center/history | 获取检测历史 | 是 |

### AI 值班分析师

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/ai/oncall/analyze/:alert_id | 手动触发告警分析 | 是 |
| GET | /api/v1/ai/oncall/analysis/:alert_id | 获取分析结果 | 是 |

### 报告生成

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/ai/reports/generate | 生成报告 | 是 |
| GET | /api/v1/ai/reports | 获取报告列表 | 是 |
| GET | /api/v1/ai/reports/:id | 获取报告详情 | 是 |
| DELETE | /api/v1/ai/reports/:id | 删除报告 | 是 |

### 智能问答

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/ai/qa/chat | 智能运维问答 | 是 |

### AI 配置

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/ai/config | 获取AI配置 | 是 |
| PUT | /api/v1/ai/config | 更新AI配置 | 是 |

### 设备健康

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/ai/health/predict | 设备健康预测 | 是 |

## 数据模型

### User (用户)

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "avatar": "https://example.com/avatar.png",
  "role": "admin",
  "tenant_id": "tenant_abc123",
  "register_days": 30,
  "last_login_at": "2026-04-03T10:30:00Z"
}
```

### Stream (视频流)

```json
{
  "id": 1,
  "name": "东门监控",
  "type": "camera",
  "status": "online",
  "rtsp_url": "rtsp://192.168.1.100:554/stream",
  "location": "东门入口",
  "tenant_id": "tenant_abc123"
}
```

### Alert (告警)

```json
{
  "id": 1,
  "level": "CRIT",
  "type": "fire",
  "title": "火灾检测",
  "message": "检测到明火",
  "stream_id": 1,
  "status": "pending",
  "created_at": "2026-04-03T10:30:00Z"
}
```

## 错误响应

所有错误响应都遵循以下格式:

```json
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

### 错误码

| 错误码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## Swagger UI

API 文档已集成 Swagger UI，访问地址:

```
http://localhost:8094/swagger/index.html
```

## 测试

可以使用以下方式测试 API:

1. **Swagger UI**: 访问 /swagger/index.html 进行交互式测试
2. **cURL**: 使用 cURL 命令行工具
3. **Postman**: 导入 API 规范到 Postman

### cURL 示例

```bash
# 登录
curl -X POST http://localhost:8094/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 获取告警列表
curl -X GET http://localhost:8094/api/v1/alerts \
  -H "Authorization: Bearer <your_token>"

# 创建告警
curl -X POST http://localhost:8094/api/v1/alerts \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"level":"CRIT","type":"fire","title":"火灾检测","stream_id":1}'
```

## 更多信息

- [Swagger UI](http://localhost:8094/swagger/index.html)
- [项目仓库](https://github.com/your-repo)
