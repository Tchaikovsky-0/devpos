# 巡检宝 - 媒体库模块 Phase 1 技术规格文档

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **阶段**: Phase 1 - 基础架构
> **预计工期**: 4 周

---

## 1. 项目概述

### 1.1 项目背景

巡检宝媒体库是面向企业级客户的智能监控平台核心模块，主要用于：
- 存储和管理无人机、工业相机等设备拍摄的图片和视频
- 提供企业级的文件管理和权限控制
- 支持 AI 智能检测和自动标注
- 生成专业的检测报告

### 1.2 项目目标

**Phase 1 目标（基础架构）**：
1. ✅ 建立多租户数据隔离机制
2. ✅ 实现文件夹和文件的基础管理
3. ✅ 完成权限控制系统
4. ✅ 集成 MinIO 对象存储
5. ✅ 实现文件上传下载功能
6. ✅ 开发前端媒体库界面

### 1.3 成功标准

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| API 响应时间 P95 | < 200ms | APM 监控 |
| 文件上传成功率 | > 99.9% | 日志统计 |
| 权限检查准确率 | 100% | 安全测试 |
| 单元测试覆盖率 | > 70% | 代码覆盖率工具 |
| 系统可用性 | > 99.5% | 监控告警 |

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (React)                            │
│         媒体库页面 | 文件上传 | 权限管理 | 预览查看              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS/WSS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (Go) - :8094                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ JWT 认证   │  │ 租户隔离   │  │ 限流中间件  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       业务逻辑层 (Go)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 用户服务     │  │ 租户服务     │  │ 文件服务     │         │
│  │ (User)      │  │ (Tenant)     │  │ (Media)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 权限服务     │  │ 文件夹服务   │  │ 存储服务     │         │
│  │ (Permission)│  │ (Folder)    │  │ (Storage)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          数据层                                   │
│  ┌──────────────┐                           ┌──────────────┐    │
│  │ PostgreSQL   │                           │   MinIO      │    │
│  │              │                           │   (S3)       │    │
│  │ • 租户表    │                           │              │    │
│  │ • 用户表    │                           │ • 原始文件   │    │
│  │ • 文件夹表  │                           │ • 缩略图     │    │
│  │ • 文件表    │                           │ • 临时文件   │    │
│  │ • 权限表    │                           │              │    │
│  └──────────────┘                           └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端** | React | 18.x | UI 框架 |
| | TypeScript | 5.x | 类型安全 |
| | Tailwind CSS | 3.x | 样式框架 |
| | Redux Toolkit | 2.x | 状态管理 |
| | pnpm | 8.x | 包管理器 |
| **后端** | Go | 1.21+ | 服务端语言 |
| | Gin | 1.9+ | HTTP 框架 |
| | GORM | 1.25+ | ORM 框架 |
| | go-redis | 9.x | Redis 客户端 |
| | minio-go | 7.x | MinIO 客户端 |
| **数据库** | PostgreSQL | 14+ | 主数据库 |
| | Redis | 6+ | 缓存 |
| **存储** | MinIO | RELEASE.2023+ | 对象存储 |

### 2.3 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 3000 | React 开发服务器 |
| Go API | 8094 | 主 API 服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO API | 9000 | 对象存储 API |
| MinIO Console | 9001 | 对象存储控制台 |

---

## 3. 数据库设计

### 3.1 ER 图

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   tenants   │ 1    N  │    users    │ N    N  │    roles    │
├─────────────┤─────────├─────────────┤─────────├─────────────┤
│ id (PK)    │         │ id (PK)     │         │ id (PK)     │
│ name       │         │ tenant_id(FK)│         │ tenant_id(FK)│
│ code       │         │ username    │         │ name        │
│ logo       │         │ email       │         │ code        │
│ storage_quota│        │ password_hash│        │ permissions │
│ status      │         │ role        │         │ is_system   │
└─────────────┘         │ status      │         └─────────────┘
        │               └─────────────┘
        │ 1:N                  │
        │               ┌──────┴────────┐
        │               │ user_roles     │
        │               ├───────────────┤
        │               │ id (PK)       │
        └───────────────│ user_id (FK)  │
                        │ role_id (FK)  │
                        └───────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│media_folders│ 1    N  │media_permissions│ N   1│media_files │
├─────────────┤─────────├───────────────┤─────────├─────────────┤
│ id (PK)     │         │ id (PK)      │         │ id (PK)     │
│ tenant_id(FK)│        │ folder_id(FK) │         │ tenant_id(FK)│
│ parent_id(FK)│        │ user_id (FK) │         │ folder_id(FK)│
│ name        │         │ permission   │         │ name        │
│ type        │         │ granted_by(FK)│        │ file_type   │
│ owner_id(FK)│         │ expires_at   │         │ size        │
│ path        │         │ created_at   │         │ storage_path│
│ depth       │         └───────────────┘         │ checksum    │
│ created_at  │                                  │ uploader_id │
└─────────────┘                                  │ created_at  │
                                                └─────────────┘
```

### 3.2 表结构详细定义

#### 3.2.1 tenants 表（租户表）

```sql
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL COMMENT '公司名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '租户编码，用于URL等',
    logo VARCHAR(500) COMMENT 'Logo URL',
    storage_quota BIGINT DEFAULT 107374182400 COMMENT '存储配额，默认为100GB',
    storage_used BIGINT DEFAULT 0 COMMENT '已使用存储',
    settings JSONB DEFAULT '{}'::jsonb COMMENT '租户配置',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uk_tenants_code UNIQUE (code)
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
```

**字段说明**：
- `code`: 租户唯一标识，用于 URL 路径，如 `acme-corp`
- `storage_quota`: 存储配额，单位字节
- `storage_used`: 已使用存储，自动更新
- `settings`: JSON 格式配置，如默认权限、上传限制等

#### 3.2.2 users 表（用户表）

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'normal_user' CHECK (role IN ('super_admin', 'org_admin', 'normal_user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uk_users_tenant_username UNIQUE (tenant_id, username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
```

**字段说明**：
- `role`: 用户角色
  - `super_admin`: 超级管理员（系统级）
  - `org_admin`: 组织管理员（租户级）
  - `normal_user`: 普通用户
- `settings`: 用户偏好设置，如主题、通知设置等

#### 3.2.3 media_folders 表（文件夹表）

```sql
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'shared', 'public')),
    owner_id UUID NOT NULL REFERENCES users(id),
    path VARCHAR(1000) NOT NULL COMMENT '完整路径，如 /无人机/巡检/2024-03',
    depth INT DEFAULT 0 COMMENT '目录深度，根目录为0',

    -- 权限设置
    inherit_permissions BOOLEAN DEFAULT TRUE COMMENT '是否继承父文件夹权限',
    default_permission VARCHAR(20) DEFAULT 'none' CHECK (default_permission IN ('none', 'read', 'write', 'admin')),

    -- 统计信息
    file_count INT DEFAULT 0,
    total_size BIGINT DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_media_folders_tenant_id ON media_folders(tenant_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX idx_media_folders_owner_id ON media_folders(owner_id);
CREATE INDEX idx_media_folders_type ON media_folders(type);
CREATE INDEX idx_media_folders_path ON media_folders(path);
CREATE INDEX idx_media_folders_created_at ON media_folders(created_at);
```

**字段说明**：
- `type`: 文件夹类型
  - `private`: 私有文件夹，仅所有者和被授权用户可见
  - `shared`: 共享文件夹，可被授权给其他用户
  - `public`: 公共文件夹，租户内所有用户可见
- `path`: 完整路径，支持快速查询子文件夹
- `inherit_permissions`: 是否继承父文件夹权限

#### 3.2.4 media_permissions 表（文件夹权限表）

```sql
CREATE TABLE IF NOT EXISTS media_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES media_folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'admin')),

    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE COMMENT '权限过期时间，NULL表示永不过期',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_permissions_folder_id ON media_permissions(folder_id);
CREATE INDEX idx_media_permissions_user_id ON media_permissions(user_id);
CREATE INDEX idx_media_permissions_expires_at ON media_permissions(expires_at);
```

**字段说明**：
- `permission`: 权限级别
  - `read`: 只读，可查看和下载
  - `write`: 读写，可上传和修改
  - `admin`: 管理，可删除和授权
- `expires_at`: 权限过期时间，支持临时授权

#### 3.2.5 media_files 表（文件表）

```sql
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    folder_id UUID NOT NULL REFERENCES media_folders(id),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',

    -- 文件信息
    file_type VARCHAR(30) NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'archive')),
    mime_type VARCHAR(100),
    size BIGINT NOT NULL COMMENT '文件大小，单位字节',

    -- 存储信息
    storage_path VARCHAR(500) NOT NULL COMMENT 'MinIO 存储路径',
    storage_bucket VARCHAR(100) NOT NULL COMMENT 'MinIO Bucket',
    checksum VARCHAR(64) COMMENT 'MD5 校验码，用于去重',

    -- 缩略图
    thumbnail_path VARCHAR(500),
    thumbnail_bucket VARCHAR(100),
    thumbnail_size INT COMMENT '缩略图大小',

    -- 元数据
    metadata JSONB DEFAULT '{}'::jsonb COMMENT '文件元数据，如EXIF、视频信息等',
    tags TEXT[] DEFAULT '{}'::text[] COMMENT '文件标签',

    -- 上传信息
    uploader_id UUID REFERENCES users(id),
    upload_status VARCHAR(20) DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed')),
    upload_session VARCHAR(100) COMMENT '分片上传会话ID',

    -- AI 分析状态
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_analysis_id UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_media_files_tenant_id ON media_files(tenant_id);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX idx_media_files_uploader_id ON media_files(uploader_id);
CREATE INDEX idx_media_files_checksum ON media_files(checksum);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX idx_media_files_name ON media_files(name);
```

**字段说明**：
- `checksum`: MD5 校验码，用于秒传和去重
- `thumbnail_path`: 缩略图路径，支持图片和视频
- `metadata`: JSON 格式元数据
  - 图片：EXIF 信息、分辨率
  - 视频：时长、分辨率、编码
- `upload_status`: 上传状态
  - `uploading`: 上传中
  - `completed`: 上传完成
  - `failed`: 上传失败

### 3.3 权限检查算法

```go
// 权限检查伪代码

func CheckFolderAccess(userID, folderID string, requiredPermission string) bool {
    folder := GetFolder(folderID)
    user := GetUser(userID)

    // 1. 超级管理员拥有所有权限
    if user.Role == "super_admin" {
        return true
    }

    // 2. 租户管理员拥有租户内所有权限
    if user.Role == "org_admin" && user.TenantID == folder.TenantID {
        return true
    }

    // 3. 文件夹所有者拥有所有权限
    if folder.OwnerID == userID {
        return true
    }

    // 4. 公共文件夹的读权限
    if folder.Type == "public" && requiredPermission == "read" {
        return true
    }

    // 5. 检查显式授权
    permission := GetUserFolderPermission(userID, folderID)
    if permission != nil && !permission.Expired() {
        return permission.Level >= requiredPermission.Level
    }

    // 6. 检查父文件夹权限（如果启用继承）
    if folder.InheritPermissions && folder.ParentID != nil {
        return CheckFolderAccess(userID, folder.ParentID, requiredPermission)
    }

    return false
}

func CheckFileAccess(userID, fileID string, operation string) bool {
    file := GetFile(fileID)
    return CheckFolderAccess(userID, file.FolderID, operation)
}
```

---

## 4. API 设计

### 4.1 API 规范

**基础信息**：
- 基础 URL: `http://localhost:8094/api/v1`
- 认证方式: JWT Bearer Token
- 请求格式: JSON
- 响应格式: JSON

**通用响应格式**：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

**错误响应格式**：

```json
{
  "code": 400,
  "message": "参数错误",
  "details": "folder_id 不能为空",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

**HTTP 状态码**：
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器错误

### 4.2 租户管理 API

#### 创建租户

```
POST /tenants
```

**请求体**：

```json
{
  "name": "ACME 公司",
  "code": "acme-corp",
  "storage_quota": 107374182400,
  "settings": {
    "default_file_types": ["image", "video"],
    "max_file_size": 104857600
  }
}
```

**响应**：

```json
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "ACME 公司",
    "code": "acme-corp",
    "storage_quota": 107374182400,
    "storage_used": 0,
    "status": "active",
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

#### 获取租户信息

```
GET /tenants/:id
```

**响应**：

```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "name": "ACME 公司",
    "code": "acme-corp",
    "logo": "https://...",
    "storage_quota": 107374182400,
    "storage_used": 5368709120,
    "settings": { ... },
    "status": "active",
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

### 4.3 用户管理 API

#### 创建用户

```
POST /users
```

**请求体**：

```json
{
  "username": "zhangsan",
  "email": "zhangsan@acme.com",
  "password": "SecurePass123!",
  "role": "normal_user"
}
```

#### 获取用户列表

```
GET /users
```

**查询参数**：
- `page`: 页码，默认 1
- `page_size`: 每页数量，默认 20
- `role`: 角色筛选
- `status`: 状态筛选

**响应**：

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "username": "zhangsan",
        "email": "zhangsan@acme.com",
        "role": "normal_user",
        "status": "active",
        "last_login_at": "2024-03-15T10:00:00Z",
        "created_at": "2024-03-15T09:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  }
}
```

### 4.4 文件夹管理 API

#### 创建文件夹

```
POST /folders
```

**请求体**：

```json
{
  "name": "无人机巡检",
  "parent_id": "parent-folder-uuid",
  "type": "private",
  "inherit_permissions": true,
  "default_permission": "none"
}
```

**响应**：

```json
{
  "code": 201,
  "data": {
    "id": "uuid",
    "name": "无人机巡检",
    "parent_id": "parent-folder-uuid",
    "type": "private",
    "owner_id": "user-uuid",
    "path": "/无人机巡检",
    "depth": 1,
    "file_count": 0,
    "total_size": 0,
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

#### 获取文件夹列表

```
GET /folders
```

**查询参数**：
- `parent_id`: 父文件夹 ID，null 表示根目录
- `type`: 文件夹类型筛选
- `page`: 页码
- `page_size`: 每页数量

**响应**：

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "无人机巡检",
        "type": "private",
        "owner": {
          "id": "user-uuid",
          "username": "zhangsan"
        },
        "file_count": 15,
        "total_size": 5368709120,
        "created_at": "2024-03-15T10:00:00Z",
        "user_permission": "admin"
      }
    ],
    "total": 10
  }
}
```

#### 获取文件夹树形结构

```
GET /folders/tree
```

**查询参数**：
- `root_id`: 根文件夹 ID，null 表示整个租户

**响应**：

```json
{
  "code": 200,
  "data": [
    {
      "id": "folder-uuid",
      "name": "无人机巡检",
      "type": "private",
      "children": [
        {
          "id": "child-folder-uuid",
          "name": "2024-03",
          "type": "private",
          "children": []
        }
      ]
    },
    {
      "id": "public-folder-uuid",
      "name": "公共资料",
      "type": "public",
      "children": []
    }
  ]
}
```

### 4.5 文件管理 API

#### 上传文件

```
POST /files/upload
Content-Type: multipart/form-data
```

**表单字段**：
- `file`: 文件（必填）
- `folder_id`: 目标文件夹 ID（必填）
- `tags`: 标签，逗号分隔（可选）

**响应**：

```json
{
  "code": 201,
  "data": {
    "id": "file-uuid",
    "name": "drone_001.jpg",
    "original_name": "DJI_0001.jpg",
    "file_type": "image",
    "size": 5242880,
    "storage_path": "tenants/uuid/folders/uuid/files/uuid.jpg",
    "checksum": "d41d8cd98f00b204e9800998ecf8427e",
    "thumbnail_url": "/api/v1/files/uuid/thumbnail",
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

#### 获取文件列表

```
GET /files
```

**查询参数**：
- `folder_id`: 文件夹 ID（必填）
- `file_type`: 文件类型筛选
- `tags`: 标签筛选
- `page`: 页码
- `page_size`: 每页数量
- `sort_by`: 排序字段（name, created_at, size）
- `sort_order`: 排序方向（asc, desc）

#### 获取文件详情

```
GET /files/:id
```

**响应**：

```json
{
  "code": 200,
  "data": {
    "id": "file-uuid",
    "name": "drone_001.jpg",
    "original_name": "DJI_0001.jpg",
    "file_type": "image",
    "mime_type": "image/jpeg",
    "size": 5242880,
    "storage_path": "...",
    "checksum": "...",
    "thumbnail_url": "/api/v1/files/uuid/thumbnail",
    "metadata": {
      "width": 3840,
      "height": 2160,
      "exif": { ... }
    },
    "tags": ["无人机", "巡检"],
    "uploader": {
      "id": "user-uuid",
      "username": "zhangsan"
    },
    "folder": {
      "id": "folder-uuid",
      "name": "无人机巡检"
    },
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

#### 下载文件

```
GET /files/:id/download
```

**响应**：文件二进制流

**请求头**：
- `If-None-Match`: 条件请求，用于缓存验证

#### 删除文件

```
DELETE /files/:id
```

**响应**：

```json
{
  "code": 200,
  "message": "删除成功"
}
```

### 4.6 权限管理 API

#### 获取文件夹权限列表

```
GET /folders/:id/permissions
```

**响应**：

```json
{
  "code": 200,
  "data": [
    {
      "id": "permission-uuid",
      "user": {
        "id": "user-uuid",
        "username": "zhangsan",
        "email": "zhangsan@acme.com"
      },
      "permission": "write",
      "granted_by": {
        "id": "owner-uuid",
        "username": "owner"
      },
      "expires_at": "2024-04-15T10:00:00Z",
      "created_at": "2024-03-15T10:00:00Z"
    }
  ]
}
```

#### 授予权限

```
POST /folders/:id/permissions
```

**请求体**：

```json
{
  "user_id": "user-uuid",
  "permission": "read",
  "expires_at": "2024-04-15T10:00:00Z"
}
```

#### 撤销权限

```
DELETE /permissions/:id
```

#### 获取用户可访问的文件夹

```
GET /users/:id/accessible-folders
```

**响应**：

```json
{
  "code": 200,
  "data": [
    {
      "folder_id": "folder-uuid",
      "folder_name": "无人机巡检",
      "permission": "write",
      "is_owner": true,
      "path": "/无人机巡检"
    }
  ]
}
```

---

## 5. 功能规格

### 5.1 文件夹管理

#### 5.1.1 创建文件夹

**用户故事**：
作为用户，我可以创建文件夹来组织我的媒体文件。

**功能描述**：
- 用户可以在任意目录下创建子文件夹
- 文件夹名称不能为空，最长 255 字符
- 文件夹名称不能包含特殊字符：`/\:*?"<>|`
- 同一目录下不能有重名文件夹
- 支持创建私有、共享、公共三种类型

**用户流程**：
1. 用户点击"新建文件夹"按钮
2. 输入文件夹名称
3. 选择文件夹类型
4. 点击确认创建

**验收标准**：
- ✅ 可以创建根目录文件夹
- ✅ 可以创建子文件夹
- ✅ 文件夹名称验证正常
- ✅ 重名检查正常
- ✅ 三种类型均可创建

#### 5.1.2 文件夹树形导航

**功能描述**：
- 左侧显示文件夹树形结构
- 支持展开/折叠
- 支持拖拽排序
- 支持右键菜单（重命名、删除、权限设置）

### 5.2 文件管理

#### 5.2.1 文件上传

**用户故事**：
作为用户，我可以上传图片和视频到指定文件夹。

**功能描述**：
- 支持拖拽上传和点击上传
- 支持分片上传（单文件 > 100MB）
- 支持断点续传
- 支持秒传（基于 MD5）
- 显示上传进度
- 支持批量上传
- 限制上传文件类型和大小

**上传限制**：
- 图片：jpg, png, gif, webp，最大 100MB
- 视频：mp4, mov, avi，最大 2GB
- 文档：pdf, doc, docx，最大 50MB

**技术实现**：
1. 计算文件 MD5
2. 检查秒传（查询服务器是否存在相同 MD5）
3. 如果秒传成功，直接返回文件信息
4. 如果秒传失败，开始分片上传
5. 分片大小：5MB
6. 上传完成后合并分片
7. 生成缩略图
8. 更新数据库

**验收标准**：
- ✅ 小文件（< 100MB）直接上传
- ✅ 大文件（> 100MB）分片上传
- ✅ 秒传功能正常
- ✅ 断点续传功能正常
- ✅ 上传进度显示正常
- ✅ 批量上传功能正常
- ✅ 文件类型验证正常
- ✅ 文件大小验证正常

#### 5.2.2 文件预览

**功能描述**：
- 图片支持缩放、旋转、下载
- 视频支持播放、暂停、全屏、音量控制
- 支持预览缩略图

**验收标准**：
- ✅ 图片预览正常
- ✅ 视频播放正常
- ✅ 缩略图显示正常

### 5.3 权限管理

#### 5.3.1 权限授予

**用户故事**：
作为文件夹所有者，我可以授予其他用户访问我文件夹的权限。

**功能描述**：
- 授予读权限（只读）
- 授予写权限（可上传、修改）
- 授予管理权限（可删除、授权）
- 支持设置权限过期时间
- 支持批量授予

**验收标准**：
- ✅ 可以授予读权限
- ✅ 可以授予写权限
- ✅ 可以授予管理权限
- ✅ 可以设置过期时间
- ✅ 权限生效时间正确

#### 5.3.2 权限继承

**功能描述**：
- 子文件夹默认继承父文件夹权限
- 可以禁用权限继承
- 禁用后需要单独设置权限

**验收标准**：
- ✅ 权限继承正常工作
- ✅ 可以禁用权限继承
- ✅ 禁用后独立权限正常

---

## 6. 非功能规格

### 6.1 性能要求

| 指标 | 要求 | 说明 |
|------|------|------|
| API 响应时间 P95 | < 200ms | 不含文件传输 |
| 文件上传速度 | > 10MB/s | 百兆网络环境 |
| 文件列表查询 | < 500ms | 1000 条数据 |
| 并发上传数 | > 100 | 支持 100 用户同时上传 |
| 缩略图生成 | < 2s | 单张图片 |

### 6.2 可用性要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 系统可用性 | > 99.5% | 月度统计 |
| 故障恢复时间 | < 30 分钟 | MTTR |
| 计划内维护窗口 | < 4 小时/月 | 凌晨时段 |
| 数据备份频率 | 每小时 | 增量备份 |

### 6.3 安全性要求

| 要求 | 说明 |
|------|------|
| 传输加密 | HTTPS/TLS 1.2+ |
| 存储加密 | MinIO 服务端加密 |
| 密码加密 | bcrypt |
| JWT 有效期 | 24 小时 |
| 刷新令牌有效期 | 7 天 |
| 密码强度 | 至少 8 位，包含大小写字母和数字 |
| SQL 注入防护 | 参数化查询 |
| XSS 防护 | 输入输出转义 |
| CSRF 防护 | Token 验证 |

### 6.4 可扩展性要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 最大租户数 | > 1000 | 单实例 |
| 最大用户数/租户 | > 10000 | 单租户 |
| 最大文件数/租户 | > 1,000,000 | 单租户 |
| 最大存储/租户 | > 10TB | 单租户 |

---

## 7. 前端规格

### 7.1 页面结构

```
媒体库
├── 侧边栏
│   ├── 文件夹树形导航
│   ├── 快速筛选
│   └── 存储使用统计
├── 主内容区
│   ├── 工具栏
│   │   ├── 上传按钮
│   │   ├── 新建文件夹按钮
│   │   ├── 筛选下拉
│   │   └── 视图切换
│   ├── 文件列表/网格视图
│   └── 分页器
└── 详情面板
    ├── 文件预览
    ├── 文件信息
    └── 操作按钮
```

### 7.2 组件清单

| 组件 | 说明 | 状态 |
|------|------|------|
| FolderTree | 文件夹树形组件 | 待开发 |
| FileGrid | 文件网格视图 | 待开发 |
| FileList | 文件列表视图 | 待开发 |
| FileCard | 文件卡片组件 | 待开发 |
| FileUpload | 文件上传组件 | 待开发 |
| FolderDialog | 文件夹对话框 | 待开发 |
| PermissionDialog | 权限管理对话框 | 待开发 |
| FilePreview | 文件预览组件 | 待开发 |
| StorageStats | 存储统计组件 | 待开发 |

### 7.3 状态管理

```typescript
// store/mediaSlice.ts

interface MediaState {
  // 文件夹状态
  folders: Folder[];
  currentFolder: Folder | null;
  folderTree: FolderTreeNode[];

  // 文件状态
  files: MediaFile[];
  selectedFiles: string[];
  viewMode: 'grid' | 'list';

  // 上传状态
  uploadQueue: UploadTask[];
  uploadProgress: Record<string, number>;

  // 权限状态
  accessibleFolders: AccessibleFolder[];
  currentFolderPermissions: Permission[];

  // UI 状态
  loading: boolean;
  error: string | null;
}
```

---

## 8. 部署架构

### 8.1 开发环境

```yaml
# docker-compose.dev.yml

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: xunjianbao
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8094:8094"
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/xunjianbao
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio:9000
    depends_on:
      - postgres
      - redis
      - minio

volumes:
  postgres_data:
```

### 8.2 生产环境

```
┌─────────────────────────────────────────────────────────────────┐
│                        负载均衡层                                 │
│                    (Nginx / 云负载均衡)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        应用服务层                                 │
│              ┌─────────────────┐  ┌─────────────────┐          │
│              │  Go API 服务 1  │  │  Go API 服务 2  │          │
│              └────────┬────────┘  └────────┬────────┘          │
│                       │                    │                     │
│              ┌────────┴────────────────────┴────────┐          │
│              │           Redis 集群               │          │
│              │        (会话 + 缓存)              │          │
│              └────────┬────────────────────┬────────┘          │
└───────────────────────────┼────────────────────┼─────────────────┘
                            │                    │
        ┌───────────────────┼────────────────────┼───────────────────┐
        │                   │                    │                    │
        ▼                   ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │    MinIO     │  │   MinIO      │  │   MinIO      │
│   主库        │  │   节点 1     │  │   节点 2     │  │   节点 3     │
│               │  │   (数据)     │  │   (数据)     │  │   (奇偶校验) │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
```

---

## 9. 测试计划

### 9.1 单元测试

**覆盖率目标**：> 70%

**测试重点**：
- 权限检查逻辑
- 文件夹树操作
- 文件上传逻辑
- MD5 计算

**测试命令**：

```bash
cd backend
go test -v -cover ./internal/service/...
go test -v -cover ./internal/repository/...
```

### 9.2 集成测试

**测试范围**：
- API 端到端测试
- 数据库操作测试
- MinIO 存储测试

**测试命令**：

```bash
cd backend
go test -v ./tests/integration/...
```

### 9.3 E2E 测试

**测试工具**：Playwright

**测试用例**：
- 创建文件夹流程
- 上传文件流程
- 权限授予流程
- 文件预览流程

---

## 10. 风险评估

### 10.1 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| MinIO 性能瓶颈 | 中 | 中 | 提前进行压力测试，优化配置 |
| 大文件上传稳定性 | 中 | 高 | 实现断点续传，完善错误处理 |
| 数据库扩展性 | 低 | 高 | 提前规划分表策略 |
| 前端性能问题 | 中 | 中 | 使用虚拟列表，优化渲染 |

### 10.2 业务风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 需求变更 | 高 | 中 | 敏捷开发，快速迭代 |
| 客户验收延迟 | 中 | 中 | 提前沟通，确认验收标准 |
| 数据安全问题 | 低 | 极高 | 严格安全审计，权限最小化 |

---

## 11. 附录

### 11.1 术语表

| 术语 | 定义 |
|------|------|
| 租户 (Tenant) | 使用系统的组织或公司 |
| 私有文件夹 (Private) | 仅所有者和被授权用户可访问 |
| 共享文件夹 (Shared) | 可被授权给其他用户 |
| 公共文件夹 (Public) | 租户内所有用户可访问 |
| 秒传 | 通过 MD5 检测，服务器已存在则直接完成 |
| 缩略图 | 文件的预览图片，用于列表展示 |

### 11.2 参考资料

- [Gin 框架文档](https://gin-gonic.com/)
- [GORM 文档](https://gorm.io/)
- [MinIO 文档](https://min.io/docs/)
- [React 最佳实践](../rules/frontend_dev_rules.md)

### 11.3 变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0.0 | 2024-03-15 | AI Assistant | 初始版本 |

---

**文档状态**：待审核
**审核人**：
**审核日期**：
