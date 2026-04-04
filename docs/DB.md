# 数据库设计文档

## 1. 数据库选型

### 1.1 主数据库：PostgreSQL
**选择理由**：
- 强大的事务支持
- 优秀的JSON支持（适合配置存储）
- 完善的权限系统
- 丰富的索引类型
- 支持GIS扩展（PostGIS）
- 活跃的社区支持

**版本要求**：PostgreSQL 14+

### 1.2 缓存数据库：Redis
**选择理由**：
- 高性能内存缓存
- 支持丰富的数据结构
- 完善的持久化支持
- 集群支持

**版本要求**：Redis 6+

### 1.3 对象存储：MinIO (S3兼容)
**选择理由**：
- S3兼容性好
- 部署简单
- 支持大规模文件存储
- 支持数据加密

**版本要求**：MinIO RELEASE.2023+

### 1.4 时序数据库（可选）：TimescaleDB
**用途**：
- 存储监控指标数据
- 存储设备状态历史

## 2. 命名规范

### 2.1 表命名
- 使用snake_case命名法
- 使用复数名词
- 模块前缀：按业务模块划分
  - `tenants_` - 租户相关
  - `users_` - 用户相关
  - `media_` - 媒体相关
  - `streams_` - 视频流相关
  - `alerts_` - 告警相关
  - `detections_` - 检测相关

**示例**：
```sql
tenants                    -- 租户表
users                      -- 用户表
media_folders              -- 文件夹表
media_files                -- 文件表
streams                    -- 视频流表
alerts                     -- 告警表
detection_defects          -- 缺陷表
detection_tasks            -- 检测任务表
```

### 2.2 字段命名
- 使用snake_case命名法
- 主键：使用 `id`（UUID类型）
- 外键：`{表名单数}_id`
- 时间戳：`created_at`, `updated_at`, `deleted_at`
- 状态字段：`status`（枚举类型）
- 软删除：`deleted_at`

**示例**：
```sql
id                        -- 主键
tenant_id                 -- 租户ID
user_id                   -- 用户ID
created_at                -- 创建时间
updated_at                -- 更新时间
deleted_at                -- 删除时间
```

### 2.3 索引命名
- 主键索引：`pk_{表名}`
- 唯一索引：`uq_{表名}_{字段名}`
- 普通索引：`idx_{表名}_{字段名}`
- 外键索引：`fk_{表名}_{外键表名}`

## 3. 表结构设计

### 3.1 租户模块

#### tenants（租户表）
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL COMMENT '公司名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '租户编码',
    logo VARCHAR(500) COMMENT 'Logo URL',
    storage_quota BIGINT DEFAULT 107374182400 COMMENT '存储配额(100GB)',
    settings JSONB DEFAULT '{}'::jsonb COMMENT '租户设置',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX uq_tenants_code ON tenants(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 3.2 用户模块

#### users（用户表）
```sql
CREATE TABLE users (
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
```

#### user_sessions（用户会话表）
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

### 3.3 权限模块

#### roles（角色表）
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_roles_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
```

#### user_roles（用户角色关联表）
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

### 3.4 媒体库模块

#### media_folders（文件夹表）
```sql
CREATE TABLE media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'shared', 'system')),
    owner_id UUID NOT NULL REFERENCES users(id),
    path VARCHAR(1000) NOT NULL COMMENT '完整路径，用于快速查询',
    depth INT DEFAULT 0 COMMENT '目录深度',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_media_folders_tenant_id ON media_folders(tenant_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX idx_media_folders_owner_id ON media_folders(owner_id);
CREATE INDEX idx_media_folders_path ON media_folders(path);
```

#### folder_permissions（文件夹权限表）
```sql
CREATE TABLE folder_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES media_folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'delete', 'share', 'admin')),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_or_role CHECK (
        (user_id IS NOT NULL AND role_id IS NULL) OR
        (user_id IS NULL AND role_id IS NOT NULL)
    )
);

CREATE INDEX idx_folder_permissions_folder_id ON folder_permissions(folder_id);
CREATE INDEX idx_folder_permissions_user_id ON folder_permissions(user_id);
CREATE INDEX idx_folder_permissions_role_id ON folder_permissions(role_id);
```

#### media_files（文件表）
```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    folder_id UUID NOT NULL REFERENCES media_folders(id),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL COMMENT 'video/image/document',
    mime_type VARCHAR(100),
    size BIGINT NOT NULL COMMENT '文件大小(字节)',
    storage_path VARCHAR(500) NOT NULL COMMENT '存储路径',
    storage_bucket VARCHAR(100) NOT NULL,
    checksum VARCHAR(64) COMMENT 'MD5校验',
    metadata JSONB DEFAULT '{}'::jsonb COMMENT '文件元数据',
    thumbnail_path VARCHAR(500),
    uploader_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_media_files_tenant_id ON media_files(tenant_id);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX idx_media_files_uploader_id ON media_files(uploader_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
```

### 3.5 视频流模块

#### streams（视频流表）
```sql
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('drone', 'camera', 'external')),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('rtsp', 'webrtc', 'hls', 'dj_sikong', 'rtmp')),
    stream_url TEXT NOT NULL COMMENT '加密存储',
    stream_key VARCHAR(255),
    category VARCHAR(100) COMMENT '分类：无人机/园区/仓库等',
    location VARCHAR(500) COMMENT '物理位置描述',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ptz_enabled BOOLEAN DEFAULT FALSE COMMENT '是否支持云台控制',
    config JSONB DEFAULT '{}'::jsonb COMMENT '配置参数',
    thumbnail_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'maintenance')),
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_streams_tenant_id ON streams(tenant_id);
CREATE INDEX idx_streams_type ON streams(type);
CREATE INDEX idx_streams_category ON streams(category);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_location ON streams(latitude, longitude);
```

#### stream_snapshots（视频流截图表）
```sql
CREATE TABLE stream_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    file_id UUID REFERENCES media_files(id),
    capture_time TIMESTAMP WITH TIME ZONE NOT NULL,
    trigger_type VARCHAR(20) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'alert', 'detection')),
    alert_id UUID REFERENCES alerts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stream_snapshots_stream_id ON stream_snapshots(stream_id);
CREATE INDEX idx_stream_snapshots_capture_time ON stream_snapshots(capture_time);
```

### 3.6 告警模块

#### alerts（告警表）
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    stream_id UUID REFERENCES streams(id),
    defect_id UUID,
    type VARCHAR(50) NOT NULL COMMENT '告警类型',
    level VARCHAR(20) NOT NULL CHECK (level IN ('critical', 'important', 'general', 'tip')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'ignored')),
    assignee_id UUID REFERENCES users(id),
    source VARCHAR(50) COMMENT '告警来源',
    metadata JSONB DEFAULT '{}'::jsonb,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    handled_at TIMESTAMP WITH TIME ZONE,
    handled_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX idx_alerts_stream_id ON alerts(stream_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_level ON alerts(level);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_assignee_id ON alerts(assignee_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
```

#### alert_rules（告警规则表）
```sql
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT '规则类型',
    conditions JSONB NOT NULL COMMENT '触发条件',
    actions JSONB NOT NULL COMMENT '执行动作',
    level VARCHAR(20) DEFAULT 'general',
    enabled BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_rules_tenant_id ON alert_rules(tenant_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);
```

### 3.7 检测模块

#### detection_defects（缺陷表）
```sql
CREATE TABLE detection_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    stream_id UUID REFERENCES streams(id),
    task_id UUID,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fire', 'flooding', 'crack', 'intrusion', 'vehicle', 'left_object', 'smoke', 'other')),
    confidence DECIMAL(5, 4) NOT NULL COMMENT '置信度 0.0000-1.0000',
    severity VARCHAR(20) DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor')),
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'confirmed', 'false_alarm', 'resolved')),
    location JSONB COMMENT '检测位置坐标',
    image_file_id UUID REFERENCES media_files(id),
    video_file_id UUID REFERENCES media_files(id),
    thumbnail_url VARCHAR(500),
    description TEXT,
    ai_analysis TEXT COMMENT 'AI分析结果',
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detection_defects_tenant_id ON detection_defects(tenant_id);
CREATE INDEX idx_detection_defects_stream_id ON detection_defects(stream_id);
CREATE INDEX idx_detection_defects_type ON detection_defects(type);
CREATE INDEX idx_detection_defects_severity ON detection_defects(severity);
CREATE INDEX idx_detection_defects_status ON detection_defects(status);
CREATE INDEX idx_detection_defects_detected_at ON detection_defects(detected_at DESC);
```

#### detection_tasks（检测任务表）
```sql
CREATE TABLE detection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    stream_id UUID NOT NULL REFERENCES streams(id),
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('fire', 'flooding', 'crack', 'intrusion', 'vehicle', 'custom')),
    custom_model_id UUID,
    config JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'paused' CHECK (status IN ('running', 'paused', 'stopped', 'error')),
    schedule JSONB COMMENT '定时配置',
    statistics JSONB DEFAULT '{}'::jsonb COMMENT '检测统计',
    started_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detection_tasks_tenant_id ON detection_tasks(tenant_id);
CREATE INDEX idx_detection_tasks_stream_id ON detection_tasks(stream_id);
CREATE INDEX idx_detection_tasks_status ON detection_tasks(status);
```

### 3.8 审计日志

#### audit_logs（审计日志表）
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## 4. 性能优化

### 4.1 索引策略
- 主键自动建立唯一索引
- 外键字段建立普通索引
- 频繁查询的字段建立索引
- 使用复合索引优化多字段查询
- 定期分析表统计信息

### 4.2 分区策略
- 审计日志表按月分区
- 告警表按月分区
- 检测记录表按月分区
- 定期归档历史数据

### 4.3 缓存策略
- Redis缓存：
  - 用户会话信息
  - 租户配置信息
  - 视频流状态
  - 频繁访问的配置数据
- 缓存过期时间：30分钟

## 5. 数据安全

### 5.1 敏感数据加密
- 视频流URL：使用AES-256加密存储
- 用户密码：bcrypt加密
- API密钥：加密存储

### 5.2 数据备份
- 每日全量备份
- 实时增量备份（WAL）
- 备份保留时间：30天
- 备份加密存储

### 5.3 权限控制
- 行级安全策略（RLS）
- 列级权限控制
- 数据脱敏处理