# API设计文档

## 1. API设计原则

### 1.1 RESTful规范
- 使用HTTP方法表达语义
- 使用名词表示资源
- 使用复数形式
- 使用标准HTTP状态码
- 版本控制

### 1.2 基础规范
- **协议**：HTTPS
- **字符编码**：UTF-8
- **内容类型**：application/json
- **认证方式**：Bearer Token (JWT)
- **版本控制**：URL路径 /api/v1/

### 1.3 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-03-15T10:30:00Z",
  "request_id": "req_abc123"
}
```

### 1.4 错误响应
```json
{
  "code": 400,
  "message": "参数错误",
  "error": {
    "field": "email",
    "detail": "邮箱格式不正确"
  },
  "timestamp": "2024-03-15T10:30:00Z",
  "request_id": "req_abc123"
}
```

### 1.5 分页响应
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

## 2. 认证模块 /api/v1/auth

### 2.1 用户登录
```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "username": "string",      // 用户名
  "password": "string",      // 密码
  "captcha": "string",       // 验证码（可选）
  "captcha_id": "string"     // 验证码ID（可选）
}

Response:
{
  "code": 200,
  "data": {
    "access_token": "string",      // 访问令牌
    "refresh_token": "string",      // 刷新令牌
    "expires_in": 7200,           // 过期时间（秒）
    "token_type": "Bearer",
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "tenant": {
        "id": "uuid",
        "name": "string"
      }
    }
  }
}
```

### 2.2 用户登出
```
POST /api/v1/auth/logout
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "message": "登出成功"
}
```

### 2.3 刷新Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

Request:
{
  "refresh_token": "string"
}

Response:
{
  "code": 200,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 7200
  }
}
```

### 2.4 获取当前用户
```
GET /api/v1/auth/me
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "role": "org_admin",
    "tenant": {
      "id": "uuid",
      "name": "string",
      "code": "string"
    },
    "permissions": ["read", "write", "admin"],
    "settings": {}
  }
}
```

## 3. 租户模块 /api/v1/tenants

### 3.1 获取租户列表
```
GET /api/v1/tenants
Authorization: Bearer <token> (super_admin only)

Query Parameters:
- page: int (default: 1)
- page_size: int (default: 20, max: 100)
- status: string (active/suspended/all)

Response:
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "code": "string",
        "logo": "string",
        "storage_quota": 107374182400,
        "storage_used": 53687091200,
        "user_count": 50,
        "status": "active",
        "created_at": "2024-03-01T00:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### 3.2 创建租户
```
POST /api/v1/tenants
Authorization: Bearer <token> (super_admin only)
Content-Type: application/json

Request:
{
  "name": "string",           // 公司名称
  "code": "string",           // 租户编码（唯一）
  "logo": "string",            // Logo URL
  "storage_quota": 107374182400,  // 存储配额（字节）
  "admin_email": "string",     // 管理员邮箱
  "admin_password": "string"   // 管理员密码
}

Response:
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "string",
    "code": "string"
  }
}
```

### 3.3 获取租户详情
```
GET /api/v1/tenants/:id
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "name": "string",
    "code": "string",
    "logo": "string",
    "storage_quota": 107374182400,
    "storage_used": 53687091200,
    "user_count": 50,
    "settings": {},
    "status": "active",
    "created_at": "2024-03-01T00:00:00Z",
    "updated_at": "2024-03-15T10:00:00Z"
  }
}
```

### 3.4 更新租户
```
PUT /api/v1/tenants/:id
Authorization: Bearer <token> (super_admin or org_admin)
Content-Type: application/json

Request:
{
  "name": "string",
  "logo": "string",
  "storage_quota": 214748364800,
  "settings": {}
}

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "updated_at": "2024-03-15T10:00:00Z"
  }
}
```

## 4. 用户模块 /api/v1/users

### 4.1 获取用户列表
```
GET /api/v1/users
Authorization: Bearer <token>
Query Parameters:
- page: int
- page_size: int
- role: string
- status: string

Response:
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "phone": "string",
        "avatar": "string",
        "role": "normal_user",
        "status": "active",
        "last_login_at": "2024-03-15T10:00:00Z",
        "created_at": "2024-03-01T00:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### 4.2 创建用户
```
POST /api/v1/users
Authorization: Bearer <token> (org_admin)
Content-Type: application/json

Request:
{
  "username": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "role": "normal_user"
}

Response:
{
  "code": 201,
  "data": {
    "id": "uuid",
    "username": "string"
  }
}
```

### 4.3 更新用户
```
PUT /api/v1/users/:id
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "email": "string",
  "phone": "string",
  "role": "normal_user",
  "status": "active"
}

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "updated_at": "2024-03-15T10:00:00Z"
  }
}
```

### 4.4 重置密码
```
PUT /api/v1/users/:id/password
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "old_password": "string",   // 可选，验证旧密码
  "new_password": "string"
}

Response:
{
  "code": 200,
  "message": "密码重置成功"
}
```

## 5. 视频流模块 /api/v1/streams

### 5.1 获取视频流列表
```
GET /api/v1/streams
Authorization: Bearer <token>
Query Parameters:
- page: int
- page_size: int
- type: string (drone/camera/external)
- category: string
- status: string (online/offline/all)

Response:
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "type": "drone",
        "source_type": "dj_sikong",
        "category": "园区巡检",
        "location": "东区仓库",
        "status": "online",
        "thumbnail_url": "string",
        "last_heartbeat_at": "2024-03-15T10:00:00Z",
        "created_at": "2024-03-01T00:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### 5.2 创建视频流
```
POST /api/v1/streams
Authorization: Bearer <token> (org_admin)
Content-Type: application/json

Request:
{
  "name": "string",
  "type": "camera",
  "source_type": "rtsp",
  "stream_url": "rtsp://admin:password@192.168.1.100:554/stream1",
  "category": "仓库监控",
  "location": "东区仓库1号",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "ptz_enabled": true,
  "config": {
    "fps": 25,
    "bitrate": 2000,
    "resolution": "1080p"
  }
}

Response:
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "string"
  }
}
```

### 5.3 获取视频流详情
```
GET /api/v1/streams/:id
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "name": "string",
    "type": "camera",
    "source_type": "rtsp",
    "stream_url": "rtsp://***:***@***",  // 敏感信息脱敏
    "category": "仓库监控",
    "location": "东区仓库1号",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "status": "online",
    "ptz_enabled": true,
    "config": {},
    "thumbnail_url": "string",
    "last_heartbeat_at": "2024-03-15T10:00:00Z",
    "statistics": {
      "uptime": 86400,
      "total_alerts": 25,
      "total_detections": 156
    },
    "created_at": "2024-03-01T00:00:00Z"
  }
}
```

### 5.4 更新视频流
```
PUT /api/v1/streams/:id
Authorization: Bearer <token> (org_admin)
Content-Type: application/json

Request:
{
  "name": "string",
  "category": "string",
  "location": "string",
  "config": {}
}

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "updated_at": "2024-03-15T10:00:00Z"
  }
}
```

### 5.5 删除视频流
```
DELETE /api/v1/streams/:id
Authorization: Bearer <token> (org_admin)

Response:
{
  "code": 200,
  "message": "删除成功"
}
```

### 5.6 云台控制
```
POST /api/v1/streams/:id/control
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "action": "string",    // left/right/up/down/zoom_in/zoom_out/home
  "speed": 50             // 速度 0-100
}

Response:
{
  "code": 200,
  "message": "控制指令已发送"
}
```

### 5.7 获取视频流状态
```
GET /api/v1/streams/:id/status
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "status": "online",
    "online_duration": 86400,
    "current_fps": 25,
    "current_bitrate": 2048,
    "network_delay": 50,
    "last_frame_at": "2024-03-15T10:00:00Z",
    "error_message": null
  }
}
```

### 5.8 获取截图
```
GET /api/v1/streams/:id/snapshot
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "url": "string",
    "width": 1920,
    "height": 1080,
    "timestamp": "2024-03-15T10:00:00Z"
  }
}
```

## 6. 媒体库模块 /api/v1/media

### 6.1 获取文件夹列表
```
GET /api/v1/media/folders
Authorization: Bearer <token>
Query Parameters:
- parent_id: uuid (null表示根目录)
- type: string (private/shared/all)

Response:
{
  "code": 200,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "type": "private",
      "parent_id": null,
      "owner": {
        "id": "uuid",
        "username": "string"
      },
      "file_count": 10,
      "total_size": 1073741824,
      "permission": "admin",
      "created_at": "2024-03-01T00:00:00Z"
    }
  ]
}
```

### 6.2 创建文件夹
```
POST /api/v1/media/folders
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "string",
  "parent_id": "uuid",      // null表示根目录
  "type": "private"        // private/shared
}

Response:
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "string"
  }
}
```

### 6.3 设置文件夹权限
```
POST /api/v1/media/folders/:id/permissions
Authorization: Bearer <token> (admin only)
Content-Type: application/json

Request:
{
  "permissions": [
    {
      "user_id": "uuid",
      "permission": "read",  // read/write/delete/share/admin
      "expires_at": "2024-12-31T23:59:59Z"  // 可选
    },
    {
      "role_id": "uuid",
      "permission": "read"
    }
  ]
}

Response:
{
  "code": 200,
  "message": "权限设置成功"
}
```

### 6.4 获取文件列表
```
GET /api/v1/media/files
Authorization: Bearer <token>
Query Parameters:
- folder_id: uuid
- file_type: string (video/image/document/all)
- page: int
- page_size: int
- keyword: string

Response:
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string.mp4",
        "file_type": "video",
        "size": 1073741824,
        "thumbnail_url": "string",
        "duration": 3600,
        "uploader": {
          "id": "uuid",
          "username": "string"
        },
        "created_at": "2024-03-01T00:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### 6.5 上传文件
```
POST /api/v1/media/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: binary
- folder_id: uuid
- description: string

Response:
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "string.mp4",
    "size": 1073741824
  }
}
```

### 6.6 下载文件
```
GET /api/v1/media/files/:id/download
Authorization: Bearer <token>

Query Parameters:
- thumbnail: boolean (default: false)

Response:
文件流或重定向到预签名URL
```

## 7. 告警模块 /api/v1/alerts

### 7.1 获取告警列表
```
GET /api/v1/alerts
Authorization: Bearer <token>
Query Parameters:
- page: int
- page_size: int
- level: string (critical/important/general/tip/all)
- status: string (pending/processing/resolved/all)
- stream_id: uuid
- start_time: datetime
- end_time: datetime

Response:
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "fire_detection",
        "level": "critical",
        "title": "火焰检测告警",
        "message": "东区仓库检测到火焰",
        "status": "pending",
        "stream": {
          "id": "uuid",
          "name": "东区仓库1号"
        },
        "assignee": {
          "id": "uuid",
          "username": "string"
        },
        "created_at": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### 7.2 获取告警详情
```
GET /api/v1/alerts/:id
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "data": {
    "id": "uuid",
    "type": "fire_detection",
    "level": "critical",
    "title": "火焰检测告警",
    "message": "详细描述...",
    "status": "processing",
    "metadata": {
      "confidence": 0.95,
      "location": {"x": 100, "y": 200}
    },
    "stream": {},
    "defect": {},
    "assignee": {},
    "ai_analysis": "AI分析结果...",
    "timeline": [
      {"action": "创建", "user": "system", "time": "2024-03-15T10:00:00Z"},
      {"action": "认领", "user": "张三", "time": "2024-03-15T10:15:00Z"}
    ],
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

### 7.3 认领告警
```
PUT /api/v1/alerts/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "assignee_id": "uuid"  // null表示分配给自己
}

Response:
{
  "code": 200,
  "message": "认领成功"
}
```

### 7.4 处理告警
```
PUT /api/v1/alerts/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "status": "resolved",  // resolved/ignored
  "note": "string",
  "false_alarm": false   // 是否误报
}

Response:
{
  "code": 200,
  "message": "处理成功"
}
```

### 7.5 告警统计
```
GET /api/v1/alerts/statistics
Authorization: Bearer <token>
Query Parameters:
- start_time: datetime
- end_time: datetime
- group_by: string (level/type/status/stream)

Response:
{
  "code": 200,
  "data": {
    "total": 156,
    "by_level": {
      "critical": 5,
      "important": 23,
      "general": 128
    },
    "by_status": {
      "pending": 12,
      "processing": 8,
      "resolved": 136
    },
    "trends": [
      {"date": "2024-03-15", "count": 25},
      {"date": "2024-03-14", "count": 18}
    ]
  }
}
```

## 8. 检测模块 /api/v1/detections

### 8.1 获取缺陷列表
```
GET /api/v1/detections/defects
Authorization: Bearer <token>
Query Parameters:
- page: int
- page_size: int
- type: string (fire/flooding/crack/intrusion/vehicle/all)
- severity: string (critical/major/minor/all)
- status: string (detected/confirmed/false_alarm/resolved/all)
- start_time: datetime
- end_time: datetime

Response:
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "fire",
        "confidence": 0.95,
        "severity": "critical",
        "status": "detected",
        "stream": {
          "id": "uuid",
          "name": "东区仓库1号"
        },
        "thumbnail_url": "string",
        "detected_at": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### 8.2 获取检测任务列表
```
GET /api/v1/detections/tasks
Authorization: Bearer <token>
Query Parameters:
- stream_id: uuid
- status: string (running/paused/stopped/all)

Response:
{
  "code": 200,
  "data": [
    {
      "id": "uuid",
      "name": "火灾检测任务",
      "stream": {
        "id": "uuid",
        "name": "东区仓库1号"
      },
      "model_type": "fire",
      "status": "running",
      "statistics": {
        "total_detections": 156,
        "today_detections": 3,
        "uptime": 86400
      },
      "started_at": "2024-03-01T00:00:00Z"
    }
  ]
}
```

### 8.3 创建检测任务
```
POST /api/v1/detections/tasks
Authorization: Bearer <token> (org_admin)
Content-Type: application/json

Request:
{
  "name": "string",
  "stream_id": "uuid",
  "model_type": "fire",
  "config": {
    "confidence_threshold": 0.8,
    "alert_on_detection": true
  },
  "schedule": {
    "type": "realtime",  // realtime/scheduled
    "cron": null
  }
}

Response:
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "string"
  }
}
```

## 9. AI模块 /api/v1/ai

### 9.1 AI对话
```
POST /api/v1/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "message": "今天上午9点到10点之间有哪些告警？",
  "session_id": "uuid",  // 会话ID，用于多轮对话
  "context": {
    "stream_id": "uuid"  // 可选，限定上下文
  }
}

Response:
{
  "code": 200,
  "data": {
    "session_id": "uuid",
    "message": "根据告警记录，今天上午9点到10点之间共有3条告警...",
    "tool_calls": [
      {
        "tool": "get_alerts",
        "params": {"start_time": "2024-03-15T09:00:00Z", "end_time": "2024-03-15T10:00:00Z"}
      }
    ],
    "sources": [
      {"type": "alert", "id": "uuid"}
    ],
    "timestamp": "2024-03-15T10:05:00Z"
  }
}
```

### 9.2 AI分析
```
POST /api/v1/ai/analyze
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "type": "alert",        // alert/defect/stream
  "target_id": "uuid",
  "options": {
    "include_trends": true,
    "include_comparisons": true
  }
}

Response:
{
  "code": 200,
  "data": {
    "summary": "分析总结...",
    "details": {
      "patterns": ["高峰期在上午9-10点"],
      "factors": ["温度升高", "湿度降低"],
      "recommendations": ["建议增加巡检频次"]
    },
    "confidence": 0.85,
    "related_items": [
      {"type": "alert", "id": "uuid", "relevance": 0.8}
    ]
  }
}
```

### 9.3 生成报告
```
POST /api/v1/ai/report
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "type": "daily",      // daily/weekly/monthly/custom
  "start_time": "2024-03-01T00:00:00Z",
  "end_time": "2024-03-15T23:59:59Z",
  "include_sections": ["overview", "alerts", "detections", "recommendations"],
  "format": "markdown"  // markdown/pdf
}

Response:
{
  "code": 200,
  "data": {
    "report_id": "uuid",
    "content": "# 监控日报...",
    "preview_url": "string"
  }
}
```

## 10. 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 200 | 200 | 成功 |
| 201 | 201 | 创建成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证 |
| 403 | 403 | 无权限访问 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源冲突 |
| 422 | 422 | 请求数据验证失败 |
| 429 | 429 | 请求过于频繁 |
| 500 | 500 | 服务器内部错误 |
| 502 | 502 | 网关错误 |
| 503 | 503 | 服务不可用 |