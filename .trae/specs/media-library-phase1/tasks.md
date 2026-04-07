# 巡检宝 - 媒体库 Phase 1 详细任务清单

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **阶段**: Phase 1 - 基础架构 (Week 1-4)

---

## 任务总览

| 阶段 | 任务数 | 预计工时 | 负责人 |
|------|--------|----------|--------|
| Week 1: 数据库设计 | 6 | 32h | Backend Lead |
| Week 2: Go 服务基础接口 | 8 | 40h | Backend Dev |
| Week 3: MinIO 存储集成 | 6 | 32h | Backend Dev |
| Week 4: 权限系统实现 | 6 | 32h | Backend Dev |
| **总计** | **26** | **136h** | |

---

## Week 1: 数据库设计与迁移

### 任务 1.1: 创建数据库迁移脚本

**任务 ID**: T1.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: 无
**负责人**: Backend Lead

**任务描述**:
创建完整的数据库迁移脚本，包括：
- 租户表 (tenants)
- 用户表 (users)
- 媒体文件夹表 (media_folders)
- 媒体权限表 (media_permissions)
- 媒体文件表 (media_files)

**具体步骤**:
1. [ ] 创建 `backend/migrations/001_create_tenants.sql`
   - 定义 tenants 表结构
   - 添加注释和约束
   - 创建索引

2. [ ] 创建 `backend/migrations/002_create_users.sql`
   - 定义 users 表结构
   - 添加外键约束
   - 创建索引

3. [ ] 创建 `backend/migrations/003_create_media_folders.sql`
   - 定义 media_folders 表结构
   - 添加自引用外键
   - 创建索引

4. [ ] 创建 `backend/migrations/004_create_media_permissions.sql`
   - 定义 media_permissions 表结构
   - 添加约束

5. [ ] 创建 `backend/migrations/005_create_media_files.sql`
   - 定义 media_files 表结构
   - 创建索引

6. [ ] 创建 `backend/migrations/006_seed_data.sql`
   - 插入默认租户
   - 插入超级管理员用户

**验收标准**:
- [ ] 所有迁移脚本可独立执行
- [ ] 迁移脚本幂等（重复执行不会报错）
- [ ] 外键约束正确
- [ ] 索引创建成功
- [ ] 默认数据插入成功

**测试方法**:
```bash
# 本地测试
psql -U postgres -d xunjianbao -f backend/migrations/001_create_tenants.sql
psql -U postgres -d xunjianbao -f backend/migrations/002_create_users.sql
# ...

# 检查表结构
psql -U postgres -d xunjianbao -c "\dt"
psql -U postgres -d xunjianbao -c "\di"
```

---

### 任务 1.2: 实现 GORM 模型代码

**任务 ID**: T1.2
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T1.1
**负责人**: Backend Dev

**任务描述**:
基于数据库表结构创建 GORM 模型代码。

**具体步骤**:
1. [ ] 创建 `backend/internal/model/tenant.go`
   - Tenant 结构体
   - TableName() 方法
   - GORM 标签

2. [ ] 创建 `backend/internal/model/user.go`
   - User 结构体（扩展现有）
   - 关联关系

3. [ ] 创建 `backend/internal/model/media_folder.go`
   - MediaFolder 结构体
   - FolderType 枚举

4. [ ] 创建 `backend/internal/model/media_permission.go`
   - MediaPermission 结构体
   - PermissionType 枚举

5. [ ] 创建 `backend/internal/model/media_file.go`
   - MediaFile 结构体
   - FileType 枚举
   - UploadStatus 枚举

6. [ ] 创建 `backend/internal/model/converters.go`
   - 模型转换函数
   - DTO 转换

**验收标准**:
- [ ] 所有模型字段与数据库一致
- [ ] GORM 标签正确
- [ ] 关联关系定义正确
- [ ] 编译通过
- [ ] golangci-lint 通过

**代码示例**:
```go
// backend/internal/model/media_folder.go

package model

import (
    "time"

    "github.com/google/uuid"
)

type FolderType string

const (
    FolderTypePrivate FolderType = "private"
    FolderTypeShared  FolderType = "shared"
    FolderTypePublic  FolderType = "public"
)

type MediaFolder struct {
    ID                   uuid.UUID    `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
    TenantID             uuid.UUID    `gorm:"type:uuid;not null;index" json:"tenant_id"`
    ParentID             *uuid.UUID   `gorm:"type:uuid;index" json:"parent_id,omitempty"`
    Name                 string       `gorm:"size:255;not null" json:"name"`
    Type                 FolderType   `gorm:"type:varchar(20);not null;default:'private'" json:"type"`
    OwnerID              uuid.UUID    `gorm:"type:uuid;not null;index" json:"owner_id"`
    Path                 string       `gorm:"size:1000;not null" json:"path"`
    Depth                int          `gorm:"default:0" json:"depth"`

    // 权限设置
    InheritPermissions   bool         `gorm:"default:true" json:"inherit_permissions"`
    DefaultPermission    string       `gorm:"size:20;default:'none'" json:"default_permission"`

    // 统计
    FileCount            int          `gorm:"default:0" json:"file_count"`
    TotalSize            int64        `gorm:"default:0" json:"total_size"`

    // 时间戳
    CreatedAt            time.Time    `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt            time.Time    `gorm:"autoUpdateTime" json:"updated_at"`
    DeletedAt            *time.Time   `gorm:"index" json:"-"`

    // 关联
    Tenant               *Tenant      `gorm:"foreignKey:TenantID" json:"-"`
    Owner                *User        `gorm:"foreignKey:OwnerID" json:"-"`
    Parent               *MediaFolder `gorm:"foreignKey:ParentID" json:"-"`
    Children             []MediaFolder `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (MediaFolder) TableName() string {
    return "media_folders"
}
```

**测试方法**:
```bash
cd backend
go build ./internal/model/...
golangci-lint run ./internal/model/...
```

---

### 任务 1.3: 创建数据库连接和迁移工具

**任务 ID**: T1.3
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: T1.2
**负责人**: Backend Dev

**任务描述**:
创建数据库连接管理和自动迁移功能。

**具体步骤**:
1. [ ] 更新 `backend/connection/database.go`
   - 添加数据库连接池配置
   - 添加日志记录

2. [ ] 创建 `backend/connection/migration.go`
   - 自动迁移函数
   - 迁移版本记录

3. [ ] 更新 `backend/cmd/server/main.go`
   - 添加迁移调用
   - 添加错误处理

**验收标准**:
- [ ] 数据库连接正常
- [ ] 自动迁移成功
- [ ] 连接池配置正确
- [ ] 错误处理完善

---

### 任务 1.4: 数据库索引优化

**任务 ID**: T1.4
**任务类型**: Backend
**优先级**: P1
**预计工时**: 4h
**依赖**: T1.1
**负责人**: Backend Lead

**任务描述**:
创建复合索引和查询优化。

**具体步骤**:
1. [ ] 创建 `backend/migrations/007_create_indexes.sql`
   - 复合索引
   - 部分索引

2. [ ] 创建 `backend/internal/model/query_builder.go`
   - 查询构建器
   - 常用查询模板

3. [ ] 创建 `backend/internal/model/queries.sql`
   - 常用 SQL 查询
   - 注释说明

**验收标准**:
- [ ] 索引创建成功
- [ ] 查询性能提升
- [ ] EXPLAIN 分析正常

---

### 任务 1.5: 数据库单元测试

**任务 ID**: T1.5
**任务类型**: Testing
**优先级**: P0
**预计工时**: 4h
**依赖**: T1.2
**负责人**: Backend Dev

**任务描述**:
为数据模型编写单元测试。

**具体步骤**:
1. [ ] 创建 `backend/internal/model/model_test.go`
   - 模型验证测试
   - 转换函数测试

2. [ ] 创建 `backend/internal/model/tenant_test.go`
   - Tenant 模型测试

3. [ ] 创建 `backend/internal/model/user_test.go`
   - User 模型测试

4. [ ] 创建 `backend/internal/model/media_folder_test.go`
   - MediaFolder 模型测试

5. [ ] 创建 `backend/internal/model/media_file_test.go`
   - MediaFile 模型测试

**验收标准**:
- [ ] 测试覆盖率 > 70%
- [ ] 所有测试通过
- [ ] 测试命名规范

**测试命令**:
```bash
cd backend
go test -v -cover ./internal/model/...
```

---

### 任务 1.6: 数据库文档编写

**任务 ID**: T1.6
**任务类型**: Documentation
**优先级**: P2
**预计工时**: 4h
**依赖**: T1.1
**负责人**: Backend Lead

**任务描述**:
编写数据库设计文档。

**具体步骤**:
1. [ ] 更新 `docs/DB.md`
   - 添加 ER 图
   - 添加表结构说明
   - 添加字段说明

2. [ ] 创建 `backend/docs/database_guide.md`
   - 数据库使用指南
   - 常见问题解答

**验收标准**:
- [ ] 文档完整
- [ ] 说明清晰
- [ ] 示例充分

---

## Week 2: Go 服务基础接口

### 任务 2.1: 实现租户管理 API

**任务 ID**: T2.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T1.2
**负责人**: Backend Dev

**任务描述**:
实现租户管理的 CRUD API。

**具体步骤**:
1. [ ] 创建 `backend/internal/service/tenant_service.go`
   - TenantService 结构体
   - Create 方法
   - GetByID 方法
   - Update 方法
   - List 方法
   - Delete 方法

2. [ ] 创建 `backend/internal/handler/tenant_handler.go`
   - CreateTenant 处理函数
   - GetTenant 处理函数
   - UpdateTenant 处理函数
   - ListTenants 处理函数
   - DeleteTenant 处理函数

3. [ ] 创建 `backend/internal/repository/tenant_repository.go`
   - TenantRepository 结构体
   - Create 方法
   - FindByID 方法
   - FindByCode 方法
   - Update 方法
   - Delete 方法
   - List 方法

4. [ ] 更新 `backend/internal/router/router.go`
   - 添加租户路由

**验收标准**:
- [ ] 所有 API 端点工作正常
- [ ] 输入验证通过
- [ ] 错误处理完善
- [ ] 单元测试通过

---

### 任务 2.2: 实现用户管理 API

**任务 ID**: T2.2
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T2.1
**负责人**: Backend Dev

**任务描述**:
实现用户管理的 CRUD API。

**具体步骤**:
1. [ ] 创建 `backend/internal/service/user_service.go`
   - UserService 结构体
   - Create 方法（密码加密）
   - GetByID 方法
   - Update 方法
   - List 方法
   - Delete 方法
   - ChangePassword 方法

2. [ ] 创建 `backend/internal/handler/user_handler.go`
   - CreateUser 处理函数
   - GetUser 处理函数
   - UpdateUser 处理函数
   - ListUsers 处理函数
   - DeleteUser 处理函数
   - ChangePassword 处理函数

3. [ ] 创建 `backend/internal/repository/user_repository.go`
   - UserRepository 结构体
   - Create 方法
   - FindByID 方法
   - FindByEmail 方法
   - FindByUsername 方法
   - Update 方法
   - Delete 方法
   - List 方法

4. [ ] 更新路由

**验收标准**:
- [ ] 密码加密正常（bcrypt）
- [ ] 用户列表分页正常
- [ ] 角色验证正常
- [ ] 单元测试通过

---

### 任务 2.3: JWT 认证中间件

**任务 ID**: T2.3
**任务类型**: Backend
**优先级**: P0
**预计工时**: 6h
**依赖**: T2.2
**负责人**: Backend Dev

**任务描述**:
实现 JWT 认证中间件。

**具体步骤**:
1. [ ] 创建 `backend/internal/middleware/auth.go`
   - JWT 生成函数
   - JWT 验证中间件
   - Token 刷新逻辑

2. [ ] 创建 `backend/internal/middleware/tenant.go`
   - 租户上下文注入
   - 租户隔离中间件

3. [ ] 更新 `backend/internal/middleware/cors.go`
   - CORS 配置

4. [ ] 创建 `backend/internal/middleware/ratelimit.go`
   - 限流中间件

**验收标准**:
- [ ] JWT 生成正常
- [ ] JWT 验证正常
- [ ] Token 刷新正常
- [ ] 租户隔离正常

**代码示例**:
```go
// backend/internal/middleware/auth.go

func JWTAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            response.Unauthorized(c, "缺少认证信息")
            c.Abort()
            return
        }

        // 提取 Token
        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            response.Unauthorized(c, "认证格式错误")
            c.Abort()
            return
        }

        tokenString := parts[1]

        // 验证 Token
        claims, err := utils.ParseJWT(tokenString)
        if err != nil {
            response.Unauthorized(c, "Token 无效或已过期")
            c.Abort()
            return
        }

        // 设置用户信息到上下文
        c.Set("user_id", claims.UserID)
        c.Set("tenant_id", claims.TenantID)
        c.Set("username", claims.Username)
        c.Set("role", claims.Role)

        c.Next()
    }
}
```

---

### 任务 2.4: 文件夹管理 API

**任务 ID**: T2.4
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T2.3
**负责人**: Backend Dev

**任务描述**:
实现文件夹的 CRUD 和树形结构 API。

**具体步骤**:
1. [ ] 创建 `backend/internal/service/folder_service.go`
   - Create 方法（构建路径）
   - GetByID 方法
   - Update 方法
   - Delete 方法（级联删除）
   - List 方法（支持分页）
   - GetTree 方法（树形结构）
   - GetChildren 方法

2. [ ] 创建 `backend/internal/handler/folder_handler.go`
   - CreateFolder 处理函数
   - GetFolder 处理函数
   - UpdateFolder 处理函数
   - DeleteFolder 处理函数
   - ListFolders 处理函数
   - GetFolderTree 处理函数

3. [ ] 创建 `backend/internal/repository/folder_repository.go`
   - Create 方法
   - FindByID 方法
   - FindByParentID 方法
   - FindByPath 方法
   - Update 方法
   - Delete 方法
   - List 方法
   - GetTree 方法（递归查询）

4. [ ] 更新路由

**验收标准**:
- [ ] 文件夹创建成功，路径自动构建
- [ ] 树形结构正确
- [ ] 权限检查正常
- [ ] 单元测试通过

---

### 任务 2.5: 文件管理 API

**任务 ID**: T2.5
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T2.4
**负责人**: Backend Dev

**任务描述**:
实现文件的基本管理 API（不含上传下载）。

**具体步骤**:
1. [ ] 创建 `backend/internal/service/file_service.go`
   - Create 方法
   - GetByID 方法
   - Update 方法（重命名等）
   - Delete 方法
   - List 方法（支持筛选、分页）
   - Search 方法

2. [ ] 创建 `backend/internal/handler/file_handler.go`
   - GetFile 处理函数
   - UpdateFile 处理函数
   - DeleteFile 处理函数
   - ListFiles 处理函数
   - SearchFiles 处理函数

3. [ ] 创建 `backend/internal/repository/file_repository.go`
   - Create 方法
   - FindByID 方法
   - FindByFolderID 方法
   - FindByChecksum 方法（秒传）
   - Update 方法
   - Delete 方法
   - List 方法
   - Search 方法

4. [ ] 更新路由

**验收标准**:
- [ ] 文件列表正常
- [ ] 筛选功能正常
- [ ] 搜索功能正常
- [ ] 单元测试通过

---

### 任务 2.6: 响应格式化

**任务 ID**: T2.6
**任务类型**: Backend
**优先级**: P1
**预计工时**: 2h
**依赖**: T2.1
**负责人**: Backend Dev

**任务描述**:
统一 API 响应格式。

**具体步骤**:
1. [ ] 更新 `backend/pkg/response/response.go`
   - 添加分页响应
   - 添加错误码
   - 添加响应包装

2. [ ] 创建 `backend/pkg/response/errors.go`
   - 错误定义
   - 错误映射

**验收标准**:
- [ ] 响应格式统一
- [ ] 错误码规范
- [ ] 文档完整

---

### 任务 2.7: 输入验证

**任务 ID**: T2.7
**任务类型**: Backend
**优先级**: P1
**预计工时**: 4h
**依赖**: T2.1
**负责人**: Backend Dev

**任务描述**:
实现请求参数的验证。

**具体步骤**:
1. [ ] 创建 `backend/internal/validators/tenant_validator.go`
   - 创建租户验证
   - 更新租户验证

2. [ ] 创建 `backend/internal/validators/user_validator.go`
   - 创建用户验证
   - 更新用户验证

3. [ ] 创建 `backend/internal/validators/folder_validator.go`
   - 创建文件夹验证

4. [ ] 创建 `backend/internal/validators/file_validator.go`
   - 文件类型验证
   - 文件大小验证

**验收标准**:
- [ ] 验证规则完善
- [ ] 错误提示清晰
- [ ] 单元测试通过

---

### 任务 2.8: API 文档生成

**任务 ID**: T2.8
**任务类型**: Documentation
**优先级**: P2
**预计工时**: 4h
**依赖**: T2.1
**负责人**: Backend Dev

**任务描述**:
使用 Swagger 生成 API 文档。

**具体步骤**:
1. [ ] 添加 Swagger 注解
   - 路由注解
   - 参数注解
   - 响应注解

2. [ ] 配置 Swagger UI
   - 路由配置
   - 静态文件

**验收标准**:
- [ ] Swagger UI 可访问
- [ ] 文档完整
- [ ] 示例充分

---

## Week 3: MinIO 存储集成

### 任务 3.1: MinIO 客户端封装

**任务 ID**: T3.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: 无
**负责人**: Backend Dev

**任务描述**:
封装 MinIO 客户端，提供统一的文件存储接口。

**具体步骤**:
1. [ ] 创建 `backend/internal/storage/minio.go`
   - MinioClient 结构体
   - 初始化函数
   - 存储桶管理

2. [ ] 实现文件上传方法
   - UploadFile 方法
   - UploadChunk 方法
   - CompleteUpload 方法

3. [ ] 实现文件下载方法
   - DownloadFile 方法
   - GetPresignedURL 方法

4. [ ] 实现文件管理方法
   - DeleteFile 方法
   - ListFiles 方法

5. [ ] 实现缩略图方法
   - GenerateThumbnail 方法
   - UploadThumbnail 方法

**验收标准**:
- [ ] 文件上传成功
- [ ] 文件下载成功
- [ ] 文件删除成功
- [ ] 缩略图生成成功

**代码示例**:
```go
// backend/internal/storage/minio.go

package storage

import (
    "context"
    "fmt"
    "io"
    "time"

    "github.com/minio/minio-go/v7"
    "github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
    client *minio.Client
    bucket string
}

func NewMinioClient(endpoint, accessKey, secretKey, bucket string) (*MinioClient, error) {
    client, err := minio.New(endpoint, &minio.Options{
        Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
        Secure: true,
    })
    if err != nil {
        return nil, err
    }

    // 确保存储桶存在
    ctx := context.Background()
    exists, err := client.BucketExists(ctx, bucket)
    if err != nil {
        return nil, err
    }

    if !exists {
        err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
        if err != nil {
            return nil, err
        }
    }

    return &MinioClient{
        client: client,
        bucket: bucket,
    }, nil
}

func (m *MinioClient) UploadFile(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) error {
    _, err := m.client.PutObject(ctx, m.bucket, objectName, reader, size, minio.PutObjectOptions{
        ContentType: contentType,
    })
    return err
}

func (m *MinioClient) DownloadFile(ctx context.Context, objectName string) (io.ReadCloser, error) {
    obj, err := m.client.GetObject(ctx, m.bucket, objectName, minio.GetObjectOptions{})
    if err != nil {
        return nil, err
    }
    return obj, nil
}

func (m *MinioClient) DeleteFile(ctx context.Context, objectName string) error {
    return m.client.RemoveObject(ctx, m.bucket, objectName, minio.RemoveObjectOptions{})
}

func (m *MinioClient) GetPresignedURL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
    url, err := m.client.PresignedGetObject(ctx, m.bucket, objectName, expiry, nil)
    if err != nil {
        return "", err
    }
    return url.String(), nil
}
```

---

### 任务 3.2: 文件上传 API

**任务 ID**: T3.2
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T3.1
**负责人**: Backend Dev

**任务描述**:
实现完整的文件上传 API，支持分片上传和秒传。

**具体步骤**:
1. [ ] 创建 `backend/internal/handler/upload_handler.go`
   - SimpleUpload 处理函数（小文件）
   - ChunkUploadInit 处理函数（初始化分片）
   - ChunkUpload 处理函数（上传分片）
   - ChunkUploadComplete 处理函数（合并）
   - CheckRapid 处理函数（秒传检测）

2. [ ] 更新文件服务
   - AddUpload 方法
   - CompleteUpload 方法

3. [ ] 创建分片管理
   - 分片存储
   - 分片合并

4. [ ] 集成 MinIO

**验收标准**:
- [ ] 小文件直接上传成功
- [ ] 大文件分片上传成功
- [ ] 秒传功能正常
- [ ] 断点续传正常

---

### 任务 3.3: 文件下载 API

**任务 ID**: T3.3
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: T3.1
**负责人**: Backend Dev

**任务描述**:
实现文件下载 API，支持断点续传。

**具体步骤**:
1. [ ] 创建 `backend/internal/handler/download_handler.go`
   - DownloadFile 处理函数
   - GetDownloadURL 处理函数

2. [ ] 实现断点续传
   - Range 请求处理

3. [ ] 添加防盗链
   - Referer 检查

**验收标准**:
- [ ] 文件下载成功
- [ ] 断点续传正常
- [ ] 防盗链正常

---

### 任务 3.4: 存储配额控制

**任务 ID**: T3.4
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: T3.2
**负责人**: Backend Dev

**任务描述**:
实现租户存储配额控制。

**具体步骤**:
1. [ ] 创建 `backend/internal/middleware/quota.go`
   - 配额检查中间件
   - 配额更新逻辑

2. [ ] 更新文件服务
   - 上传前检查配额
   - 上传后更新配额

3. [ ] 创建配额管理 API
   - 获取配额信息
   - 管理员调整配额

**验收标准**:
- [ ] 配额检查正常
- [ ] 配额更新正确
- [ ] 超额拒绝正常

---

### 任务 3.5: 缩略图生成

**任务 ID**: T3.5
**任务类型**: Backend
**优先级**: P1
**预计工时**: 4h
**依赖**: T3.1
**负责人**: Backend Dev

**任务描述**:
实现图片和视频的缩略图生成。

**具体步骤**:
1. [ ] 创建 `backend/internal/storage/thumbnail.go`
   - 图片缩略图生成
   - 视频缩略图生成（使用 ffmpeg）

2. [ ] 集成到上传流程

3. [ ] 添加配置选项
   - 缩略图尺寸
   - 缩略图质量

**验收标准**:
- [ ] 图片缩略图生成成功
- [ ] 视频缩略图生成成功
- [ ] 缩略图上传成功

---

### 任务 3.6: 存储集成测试

**任务 ID**: T3.6
**任务类型**: Testing
**优先级**: P0
**预计工时**: 4h
**依赖**: T3.1, T3.2
**负责人**: Backend Dev

**任务描述**:
编写存储模块的集成测试。

**具体步骤**:
1. [ ] 创建 `backend/tests/storage/minio_test.go`
   - 上传下载测试
   - 分片上传测试

2. [ ] 创建 `backend/tests/storage/thumbnail_test.go`
   - 缩略图生成测试

**验收标准**:
- [ ] 所有测试通过
- [ ] 覆盖率 > 70%

---

## Week 4: 权限系统实现

### 任务 4.1: 权限检查服务

**任务 ID**: T4.1
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T2.4, T2.5
**负责人**: Backend Dev

**任务描述**:
实现文件夹和文件的权限检查服务。

**具体步骤**:
1. [ ] 创建 `backend/internal/service/permission_service.go`
   - CheckFolderAccess 方法
   - CheckFileAccess 方法
   - GetUserAccessibleFolders 方法

2. [ ] 实现权限检查算法
   - 超级管理员检查
   - 租户管理员检查
   - 所有者检查
   - 公共文件夹检查
   - 显式授权检查
   - 权限继承检查

3. [ ] 创建权限缓存
   - Redis 缓存
   - 缓存过期策略

**验收标准**:
- [ ] 权限检查准确
- [ ] 缓存命中率高
- [ ] 性能满足要求

**代码示例**:
```go
// backend/internal/service/permission_service.go

func (s *PermissionService) CheckFolderAccess(ctx context.Context, userID, folderID string, required PermissionLevel) (bool, error) {
    // 1. 获取用户信息
    user, err := s.userRepo.FindByID(ctx, userID)
    if err != nil {
        return false, err
    }

    // 2. 获取文件夹信息
    folder, err := s.folderRepo.FindByID(ctx, folderID)
    if err != nil {
        return false, err
    }

    // 3. 超级管理员
    if user.Role == "super_admin" {
        return true, nil
    }

    // 4. 租户管理员
    if user.Role == "org_admin" && user.TenantID == folder.TenantID {
        return true, nil
    }

    // 5. 文件夹所有者
    if folder.OwnerID.String() == userID {
        return true, nil
    }

    // 6. 公共文件夹的读权限
    if folder.Type == "public" && required == Read {
        return true, nil
    }

    // 7. 检查显式授权
    permission, err := s.repo.FindUserFolderPermission(ctx, userID, folderID)
    if err != nil {
        return false, err
    }

    if permission != nil && !permission.IsExpired() {
        return permission.Level >= required, nil
    }

    // 8. 检查父文件夹权限（如果启用继承）
    if folder.InheritPermissions && folder.ParentID != nil {
        return s.CheckFolderAccess(ctx, userID, folder.ParentID.String(), required)
    }

    return false, nil
}
```

---

### 任务 4.2: 权限管理 API

**任务 ID**: T4.2
**任务类型**: Backend
**优先级**: P0
**预计工时**: 8h
**依赖**: T4.1
**负责人**: Backend Dev

**任务描述**:
实现权限授予、撤销、查询的 API。

**具体步骤**:
1. [ ] 创建 `backend/internal/handler/permission_handler.go`
   - GrantPermission 处理函数
   - RevokePermission 处理函数
   - ListFolderPermissions 处理函数
   - ListUserPermissions 处理函数

2. [ ] 更新权限服务
   - Grant 方法
   - Revoke 方法
   - ListByFolder 方法
   - ListByUser 方法

3. [ ] 更新路由

**验收标准**:
- [ ] 权限授予成功
- [ ] 权限撤销成功
- [ ] 权限列表正常
- [ ] 权限过期正常

---

### 任务 4.3: 文件夹操作权限控制

**任务 ID**: T4.3
**任务类型**: Backend
**优先级**: P0
**预计工时**: 4h
**依赖**: T4.1
**负责人**: Backend Dev

**任务描述**:
在文件夹和文件操作中集成权限检查。

**具体步骤**:
1. [ ] 更新文件夹 Handler
   - 创建文件夹权限检查
   - 更新文件夹权限检查
   - 删除文件夹权限检查

2. [ ] 更新文件 Handler
   - 上传文件权限检查
   - 下载文件权限检查
   - 删除文件权限检查

3. [ ] 更新中间件
   - 权限检查中间件

**验收标准**:
- [ ] 权限检查集成到所有操作
- [ ] 权限不足时正确返回错误
- [ ] 管理员绕过权限正常

---

### 任务 4.4: 权限管理界面

**任务 ID**: T4.4
**任务类型**: Frontend
**优先级**: P0
**预计工时**: 8h
**依赖**: T4.2
**负责人**: Frontend Dev

**任务描述**:
开发前端权限管理界面。

**具体步骤**:
1. [ ] 创建 `frontend/src/components/permissions/PermissionDialog.tsx`
   - 权限授予对话框
   - 用户搜索
   - 权限级别选择

2. [ ] 创建 `frontend/src/components/permissions/PermissionList.tsx`
   - 权限列表展示
   - 撤销操作

3. [ ] 更新文件夹组件
   - 添加权限设置按钮
   - 权限指示器

**验收标准**:
- [ ] 权限授予界面友好
- [ ] 权限列表清晰
- [ ] 操作反馈及时

---

### 任务 4.5: 权限系统集成测试

**任务 ID**: T4.5
**任务类型**: Testing
**优先级**: P0
**预计工时**: 4h
**依赖**: T4.1, T4.2
**负责人**: Backend Dev

**任务描述**:
编写权限系统的完整集成测试。

**具体步骤**:
1. [ ] 创建 `backend/tests/permission/permission_test.go`
   - 权限检查测试
   - 权限授予测试
   - 权限继承测试

2. [ ] 创建 `backend/tests/permission/security_test.go`
   - 越权访问测试
   - 隔离性测试

**验收标准**:
- [ ] 所有测试通过
- [ ] 覆盖率 > 80%
- [ ] 安全测试通过

---

### 任务 4.6: 权限审计日志

**任务 ID**: T4.6
**任务类型**: Backend
**优先级**: P1
**预计工时**: 4h
**依赖**: T4.2
**负责人**: Backend Dev

**任务描述**:
实现权限操作的审计日志。

**具体步骤**:
1. [ ] 创建审计日志表

2. [ ] 创建审计日志服务

3. [ ] 集成到权限操作

4. [ ] 创建审计日志查询 API

**验收标准**:
- [ ] 审计日志记录完整
- [ ] 查询功能正常
- [ ] 导出功能正常

---

## 里程碑

### Milestone 1: 数据库完成 (Week 1 结束)
- [ ] 所有数据库表创建完成
- [ ] GORM 模型完成
- [ ] 数据库测试通过

### Milestone 2: 核心 API 完成 (Week 2 结束)
- [ ] 租户管理 API 完成
- [ ] 用户管理 API 完成
- [ ] 文件夹管理 API 完成
- [ ] 文件管理 API 完成
- [ ] 认证中间件完成

### Milestone 3: 存储集成完成 (Week 3 结束)
- [ ] MinIO 集成完成
- [ ] 文件上传下载完成
- [ ] 缩略图生成完成
- [ ] 配额控制完成

### Milestone 4: 权限系统完成 (Week 4 结束)
- [ ] 权限检查服务完成
- [ ] 权限管理 API 完成
- [ ] 前端权限管理完成
- [ ] 集成测试通过

### Final: Phase 1 完成
- [ ] 所有任务完成
- [ ] 代码审查通过
- [ ] 文档完成
- [ ] 部署测试通过

---

## 资源分配

### Backend Lead
- T1.1, T1.4, T1.6
- T2.1, T2.8
- 代码审查

### Backend Dev
- T1.2, T1.3, T1.5
- T2.2, T2.3, T2.4, T2.5, T2.6, T2.7
- T3.1, T3.2, T3.3, T3.4, T3.5, T3.6
- T4.1, T4.2, T4.3, T4.5, T4.6

### Frontend Dev
- T4.4
- (其他前端任务在 Phase 2)

---

## 依赖关系图

```
T1.1 ─┬─ T1.2 ─ T1.3 ─ T1.5
      ├─ T1.4 ─ T1.6
      │
T2.1 ─┼─ T2.2 ─ T2.3 ─┬─ T2.4 ─ T2.5 ─ T2.6 ─ T2.7 ─ T2.8
      │                │
      └────────────────┴─ T3.1 ─ T3.2 ─ T3.3 ─ T3.4 ─ T3.5 ─ T3.6
                              │
                              └─ T4.1 ─ T4.2 ─ T4.3 ─ T4.4 ─ T4.5 ─ T4.6
```

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-02
**维护人**: AI Assistant
