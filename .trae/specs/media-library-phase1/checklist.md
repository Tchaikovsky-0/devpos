# 巡检宝 - 媒体库 Phase 1 验收清单

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **阶段**: Phase 1 - 基础架构

---

## 验收说明

本文档包含 Phase 1 所有任务的验收标准。每个任务完成后，必须对照本清单进行自检，提交代码审查前必须所有验收项通过。

**验收流程**：
1. 开发者自检（对照清单）
2. 代码审查（Reviewer 检查）
3. 测试验证（QA 验证）
4. 文档确认（确认所有文档完成）

**符号说明**：
- ✅ 完成
- ❌ 未完成
- ⚠️ 部分完成/有问题
- N/A 不适用

---

## Week 1: 数据库设计与迁移

### T1.1: 创建数据库迁移脚本

#### 代码检查
- [ ] `backend/migrations/001_create_tenants.sql` 存在
- [ ] `backend/migrations/002_create_users.sql` 存在
- [ ] `backend/migrations/003_create_media_folders.sql` 存在
- [ ] `backend/migrations/004_create_media_permissions.sql` 存在
- [ ] `backend/migrations/005_create_media_files.sql` 存在
- [ ] `backend/migrations/006_seed_data.sql` 存在

#### 功能验证
- [ ] 所有迁移脚本可以独立执行
- [ ] 迁移脚本幂等（重复执行不报错）
- [ ] 外键约束定义正确
- [ ] 索引创建成功
- [ ] 默认数据插入成功

#### 测试验证
```bash
# 执行迁移
psql -U postgres -d xunjianbao -f backend/migrations/001_create_tenants.sql
psql -U postgres -d xunjianbao -f backend/migrations/002_create_users.sql
psql -U postgres -d xunjianbao -f backend/migrations/003_create_media_folders.sql
psql -U postgres -d xunjianbao -f backend/migrations/004_create_media_permissions.sql
psql -U postgres -d xunjianbao -f backend/migrations/005_create_media_files.sql
psql -U postgres -d xunjianbao -f backend/migrations/006_seed_data.sql

# 检查表结构
psql -U postgres -d xunjianbao -c "\dt"
psql -U postgres -d xunjianbao -c "\di"
psql -U postgres -d xunjianbao -c "SELECT * FROM tenants LIMIT 1;"
psql -U postgres -d xunjianbao -c "SELECT * FROM users LIMIT 1;"
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T1.2: 实现 GORM 模型代码

#### 代码检查
- [ ] `backend/internal/model/tenant.go` 存在
- [ ] `backend/internal/model/user.go` 存在
- [ ] `backend/internal/model/media_folder.go` 存在
- [ ] `backend/internal/model/media_permission.go` 存在
- [ ] `backend/internal/model/media_file.go` 存在
- [ ] `backend/internal/model/converters.go` 存在

#### 功能验证
- [ ] 所有模型字段与数据库一致
- [ ] GORM 标签正确
- [ ] 关联关系定义正确
- [ ] TableName() 方法正确实现
- [ ] 枚举类型定义正确

#### 代码质量
- [ ] 编译通过: `go build ./internal/model/...`
- [ ] golangci-lint 通过: `golangci-lint run ./internal/model/...`
- [ ] 命名规范（PascalCase 结构体，camelCase 字段）
- [ ] 注释完整（公共方法、关键逻辑）
- [ ] 错误处理完善

#### 测试验证
```bash
cd backend
go build ./internal/model/...
golangci-lint run ./internal/model/...
go test -v ./internal/model/...
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T1.3: 创建数据库连接和迁移工具

#### 代码检查
- [ ] `backend/connection/database.go` 已更新
- [ ] `backend/connection/migration.go` 存在
- [ ] `backend/cmd/server/main.go` 已更新

#### 功能验证
- [ ] 数据库连接成功
- [ ] 自动迁移执行成功
- [ ] 连接池配置正确（最大连接数、空闲连接数）
- [ ] 错误处理完善
- [ ] 日志记录正确

#### 测试验证
```bash
cd backend
go run cmd/server/main.go
# 观察日志输出，确认迁移执行
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T1.4: 数据库索引优化

#### 代码检查
- [ ] `backend/migrations/007_create_indexes.sql` 存在
- [ ] `backend/internal/model/query_builder.go` 存在
- [ ] `backend/internal/model/queries.sql` 存在

#### 功能验证
- [ ] 复合索引创建成功
- [ ] 部分索引创建成功
- [ ] 查询性能提升验证

#### 测试验证
```sql
-- 检查索引
psql -U postgres -d xunjianbao -c "\di"

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM media_files WHERE folder_id = 'xxx';
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T1.5: 数据库单元测试

#### 代码检查
- [ ] `backend/internal/model/model_test.go` 存在
- [ ] `backend/internal/model/tenant_test.go` 存在
- [ ] `backend/internal/model/user_test.go` 存在
- [ ] `backend/internal/model/media_folder_test.go` 存在
- [ ] `backend/internal/model/media_file_test.go` 存在

#### 功能验证
- [ ] 测试覆盖率 > 70%
- [ ] 所有测试通过
- [ ] 测试命名规范（TestXxx）
- [ ] 断言清晰明确

#### 测试验证
```bash
cd backend
go test -v -cover ./internal/model/...
# 确认覆盖率 > 70%
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T1.6: 数据库文档编写

#### 代码检查
- [ ] `docs/DB.md` 已更新
- [ ] `backend/docs/database_guide.md` 存在

#### 功能验证
- [ ] ER 图完整
- [ ] 表结构说明详细
- [ ] 字段说明清晰
- [ ] 示例充分

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______

---

## Week 2: Go 服务基础接口

### T2.1: 实现租户管理 API

#### 代码检查
- [ ] `backend/internal/service/tenant_service.go` 存在
- [ ] `backend/internal/handler/tenant_handler.go` 存在
- [ ] `backend/internal/repository/tenant_repository.go` 存在
- [ ] 路由已注册

#### 功能验证
- [ ] POST `/api/v1/tenants` 创建租户成功
- [ ] GET `/api/v1/tenants/:id` 获取租户成功
- [ ] PUT `/api/v1/tenants/:id` 更新租户成功
- [ ] GET `/api/v1/tenants` 列表查询成功
- [ ] DELETE `/api/v1/tenants/:id` 删除租户成功
- [ ] 输入验证通过
- [ ] 错误处理完善

#### 测试验证
```bash
# 启动服务
cd backend && go run cmd/server/main.go &

# 测试 API
curl -X POST http://localhost:8094/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"测试租户","code":"test"}'

curl http://localhost:8094/api/v1/tenants
```

#### 代码质量
- [ ] golangci-lint 通过
- [ ] 单元测试覆盖率 > 70%
- [ ] 注释完整

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T2.2: 实现用户管理 API

#### 代码检查
- [ ] `backend/internal/service/user_service.go` 存在
- [ ] `backend/internal/handler/user_handler.go` 存在
- [ ] `backend/internal/repository/user_repository.go` 存在
- [ ] 路由已注册

#### 功能验证
- [ ] POST `/api/v1/users` 创建用户成功
- [ ] GET `/api/v1/users/:id` 获取用户成功
- [ ] PUT `/api/v1/users/:id` 更新用户成功
- [ ] GET `/api/v1/users` 列表查询成功（分页正常）
- [ ] DELETE `/api/v1/users/:id` 删除用户成功
- [ ] 密码加密正常（bcrypt）
- [ ] 角色验证正常

#### 测试验证
```bash
# 测试密码加密
curl -X POST http://localhost:8094/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!","role":"normal_user"}'

# 测试用户列表
curl http://localhost:8094/api/v1/users?page=1&page_size=20
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T2.3: JWT 认证中间件

#### 代码检查
- [ ] `backend/internal/middleware/auth.go` 存在
- [ ] `backend/internal/middleware/tenant.go` 存在
- [ ] `backend/internal/middleware/ratelimit.go` 存在

#### 功能验证
- [ ] JWT 生成成功
- [ ] JWT 验证成功
- [ ] Token 刷新成功
- [ ] 租户隔离正常
- [ ] 限流正常
- [ ] 401/403 错误正确返回

#### 测试验证
```bash
# 测试登录获取 Token
curl -X POST http://localhost:8094/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 Token 访问受保护资源
curl http://localhost:8094/api/v1/tenants \
  -H "Authorization: Bearer <token>"

# 测试无 Token 访问
curl http://localhost:8094/api/v1/tenants
# 应该返回 401
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T2.4: 文件夹管理 API

#### 代码检查
- [ ] `backend/internal/service/folder_service.go` 存在
- [ ] `backend/internal/handler/folder_handler.go` 存在
- [ ] `backend/internal/repository/folder_repository.go` 存在
- [ ] 路由已注册

#### 功能验证
- [ ] POST `/api/v1/folders` 创建文件夹成功
- [ ] GET `/api/v1/folders/:id` 获取文件夹成功
- [ ] PUT `/api/v1/folders/:id` 更新文件夹成功
- [ ] DELETE `/api/v1/folders/:id` 删除文件夹成功（级联）
- [ ] GET `/api/v1/folders` 列表查询成功
- [ ] GET `/api/v1/folders/tree` 树形结构正常
- [ ] 路径自动构建正确
- [ ] 深度计算正确

#### 测试验证
```bash
# 创建根文件夹
curl -X POST http://localhost:8094/api/v1/folders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"无人机巡检","type":"private"}'

# 创建子文件夹
curl -X POST http://localhost:8094/api/v1/folders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"2024-03","parent_id":"<folder_id>","type":"private"}'

# 获取树形结构
curl http://localhost:8094/api/v1/folders/tree \
  -H "Authorization: Bearer <token>"
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T2.5: 文件管理 API

#### 代码检查
- [ ] `backend/internal/service/file_service.go` 存在
- [ ] `backend/internal/handler/file_handler.go` 存在
- [ ] `backend/internal/repository/file_repository.go` 存在
- [ ] 路由已注册

#### 功能验证
- [ ] GET `/api/v1/files/:id` 获取文件成功
- [ ] PUT `/api/v1/files/:id` 更新文件成功
- [ ] DELETE `/api/v1/files/:id` 删除文件成功
- [ ] GET `/api/v1/files` 列表查询成功
- [ ] 筛选功能正常（file_type, tags）
- [ ] 分页功能正常
- [ ] 搜索功能正常

#### 测试验证
```bash
# 获取文件列表
curl "http://localhost:8094/api/v1/files?folder_id=<folder_id>&page=1&page_size=20" \
  -H "Authorization: Bearer <token>"

# 搜索文件
curl "http://localhost:8094/api/v1/files/search?q=test&folder_id=<folder_id>" \
  -H "Authorization: Bearer <token>"
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T2.6-T2.8: 其他任务

#### T2.6: 响应格式化
- [ ] 响应格式统一
- [ ] 错误码规范
- [ ] 分页响应正常

#### T2.7: 输入验证
- [ ] 验证规则完善
- [ ] 错误提示清晰

#### T2.8: API 文档生成
- [ ] Swagger UI 可访问
- [ ] 文档完整

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______

---

## Week 3: MinIO 存储集成

### T3.1: MinIO 客户端封装

#### 代码检查
- [ ] `backend/internal/storage/minio.go` 存在

#### 功能验证
- [ ] MinIO 连接成功
- [ ] 存储桶创建成功
- [ ] 文件上传成功
- [ ] 文件下载成功
- [ ] 文件删除成功
- [ ] 预签名 URL 生成成功

#### 测试验证
```bash
# 启动 MinIO
docker run -d --name minio -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"

# 测试上传
curl -X POST http://localhost:8094/api/v1/storage/test \
  -F "file=@test.jpg"
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T3.2: 文件上传 API

#### 代码检查
- [ ] `backend/internal/handler/upload_handler.go` 存在

#### 功能验证
- [ ] 小文件直接上传成功
- [ ] 大文件分片上传成功
- [ ] 秒传功能正常（MD5 检测）
- [ ] 断点续传正常
- [ ] 上传进度正常
- [ ] 文件类型验证正常
- [ ] 文件大小验证正常

#### 测试验证
```bash
# 测试小文件上传
curl -X POST http://localhost:8094/api/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@small.jpg" \
  -F "folder_id=<folder_id>"

# 测试大文件分片上传
curl -X POST http://localhost:8094/api/v1/files/upload/init \
  -H "Authorization: Bearer <token>" \
  -d '{"filename":"large.zip","size":524288000}'

# 测试秒传
curl -X POST http://localhost:8094/api/v1/files/upload/rapid \
  -H "Authorization: Bearer <token>" \
  -d '{"checksum":"d41d8cd98f00b204e9800998ecf8427e","folder_id":"<folder_id>"}'
```

#### 性能验证
- [ ] 10MB 文件上传 < 2s
- [ ] 100MB 文件分片上传 < 30s

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T3.3: 文件下载 API

#### 功能验证
- [ ] 文件下载成功
- [ ] 断点续传正常（Range 请求）
- [ ] 防盗链正常

#### 测试验证
```bash
# 测试下载
curl -O http://localhost:8094/api/v1/files/<file_id>/download \
  -H "Authorization: Bearer <token>"

# 测试断点续传
curl -H "Range: bytes=0-1023" \
  http://localhost:8094/api/v1/files/<file_id>/download \
  -H "Authorization: Bearer <token>"
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T3.4-T3.6: 存储配额、缩略图、测试

#### T3.4: 存储配额控制
- [ ] 配额检查正常
- [ ] 配额更新正确
- [ ] 超额拒绝正常

#### T3.5: 缩略图生成
- [ ] 图片缩略图生成成功
- [ ] 视频缩略图生成成功

#### T3.6: 存储集成测试
- [ ] 所有测试通过
- [ ] 覆盖率 > 70%

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

## Week 4: 权限系统实现

### T4.1: 权限检查服务

#### 代码检查
- [ ] `backend/internal/service/permission_service.go` 存在

#### 功能验证
- [ ] 超级管理员权限正常
- [ ] 租户管理员权限正常
- [ ] 所有者权限正常
- [ ] 公共文件夹读权限正常
- [ ] 显式授权检查正常
- [ ] 权限继承检查正常
- [ ] 权限缓存正常

#### 性能验证
- [ ] 权限检查 < 10ms（缓存命中）
- [ ] 权限检查 < 50ms（缓存未命中）

#### 测试验证
```bash
# 测试超级管理员
curl http://localhost:8094/api/v1/folders \
  -H "Authorization: Bearer <super_admin_token>"
# 应该可以访问所有租户的文件夹

# 测试普通用户访问公共文件夹
curl http://localhost:8094/api/v1/folders/<public_folder_id> \
  -H "Authorization: Bearer <normal_user_token>"
# 应该返回 200

# 测试普通用户访问私有文件夹
curl http://localhost:8094/api/v1/folders/<private_folder_id> \
  -H "Authorization: Bearer <normal_user_token>"
# 应该返回 403
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T4.2: 权限管理 API

#### 代码检查
- [ ] `backend/internal/handler/permission_handler.go` 存在

#### 功能验证
- [ ] POST `/api/v1/folders/:id/permissions` 授予权限成功
- [ ] DELETE `/api/v1/permissions/:id` 撤销权限成功
- [ ] GET `/api/v1/folders/:id/permissions` 列表权限成功
- [ ] GET `/api/v1/users/:id/accessible-folders` 获取可访问文件夹成功
- [ ] 权限过期时间设置正常

#### 测试验证
```bash
# 授予读权限
curl -X POST http://localhost:8094/api/v1/folders/<folder_id>/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<user_id>","permission":"read"}'

# 检查被授权用户访问
curl http://localhost:8094/api/v1/folders/<folder_id> \
  -H "Authorization: Bearer <authorized_user_token>"
# 应该返回 200
```

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T4.3: 文件夹操作权限控制

#### 功能验证
- [ ] 创建文件夹权限检查正常
- [ ] 更新文件夹权限检查正常
- [ ] 删除文件夹权限检查正常
- [ ] 上传文件权限检查正常
- [ ] 下载文件权限检查正常
- [ ] 删除文件权限检查正常
- [ ] 权限不足时返回 403

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

### T4.4: 权限管理界面

#### UI 检查
- [ ] 权限设置按钮可见
- [ ] 权限授予对话框正常
- [ ] 权限列表展示正常
- [ ] 撤销操作正常
- [ ] 加载状态显示正常
- [ ] 错误提示正常

#### 功能验证
- [ ] 授予权限功能正常
- [ ] 撤销权限功能正常
- [ ] 列表刷新正常
- [ ] 用户搜索正常

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] UI 审查通过: _________ 日期: _______
- [ ] 功能验证通过: _________ 日期: _______

---

### T4.5-T4.6: 权限测试、审计日志

#### T4.5: 权限系统集成测试
- [ ] 权限检查测试通过
- [ ] 权限授予测试通过
- [ ] 权限继承测试通过
- [ ] 越权访问测试通过
- [ ] 覆盖率 > 80%

#### T4.6: 权限审计日志
- [ ] 审计日志记录完整
- [ ] 查询功能正常

#### 验收签字
- [ ] 开发者自检: _________ 日期: _______
- [ ] 代码审查通过: _________ 日期: _______
- [ ] 测试验证通过: _________ 日期: _______

---

## 最终验收

### 代码质量验收
- [ ] 所有代码通过 golangci-lint
- [ ] 所有单元测试通过
- [ ] 代码覆盖率 > 70%
- [ ] 无安全漏洞（SQL 注入、XSS 等）
- [ ] 无硬编码敏感信息

### API 验收
- [ ] 所有 API 端点工作正常
- [ ] API 响应时间 P95 < 200ms
- [ ] API 文档完整
- [ ] Swagger UI 可访问

### 功能验收
- [ ] 租户管理功能正常
- [ ] 用户管理功能正常
- [ ] 文件夹管理功能正常
- [ ] 文件上传下载功能正常
- [ ] 权限管理功能正常
- [ ] 权限检查功能正常

### 文档验收
- [ ] SPEC.md 完整
- [ ] tasks.md 完整
- [ ] checklist.md 完整
- [ ] API 文档完整
- [ ] 数据库文档完整

### 部署验收
- [ ] Docker Compose 配置正确
- [ ] 本地部署成功
- [ ] 所有服务正常运行

---

## 总体评估

### 完成度评估

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 任务完成率 | 100% | ___% | |
| 代码覆盖率 | > 70% | ___% | |
| API 覆盖率 | 100% | ___% | |
| 文档完成率 | 100% | ___% | |
| 测试通过率 | 100% | ___% | |

### 风险评估

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| | | | |

### 遗留问题

| 问题 | 严重程度 | 负责人 | 计划修复时间 |
|------|----------|--------|--------------|
| | | | |

### 最终结论

- [ ] **通过验收** - 可以进入 Phase 2
- [ ] **有条件通过** - 需修复以下问题后进入 Phase 2
- [ ] **不通过** - 需重新开发以下模块

**验收结论**: _______________

**验收人**: _______________

**验收日期**: _______________

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-02
**维护人**: AI Assistant
