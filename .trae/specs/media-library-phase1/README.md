# 巡检宝 - 媒体库 Phase 1 开发指南

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **阶段**: Phase 1 - 基础架构

---

## 📋 项目概述

### 目标

Phase 1 的目标是建立媒体库模块的基础架构，包括：
- 多租户数据隔离
- 文件夹和文件管理
- 权限控制系统
- MinIO 对象存储集成
- 前端媒体库界面

### 预计工期

**4 周**（每周 5 个工作日，每天 8 小时）

### 团队规模

- Backend Lead: 1 人
- Backend Dev: 1 人
- Frontend Dev: 1 人（Phase 2 开始）

---

## 📁 文档结构

```
.trae/specs/media-library-phase1/
├── README.md           # 本文件 - 开发指南
├── SPEC.md            # 技术规格文档
├── tasks.md           # 详细任务清单
├── checklist.md        # 验收清单
└── docs/
    └── api/           # API 详细定义
```

---

## 🚀 快速开始

### 1. 环境准备

#### 前置条件

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

#### 启动开发环境

```bash
# 1. 启动基础设施
cd backend
docker-compose -f docker-compose.dev.yml up -d

# 2. 等待服务启动
sleep 10

# 3. 执行数据库迁移
psql -U postgres -d xunjianbao -f migrations/001_create_tenants.sql

# 4. 启动后端服务
go run cmd/server/main.go

# 5. 新终端：启动前端（Phase 2）
cd frontend
pnpm install
pnpm dev
```

### 2. 默认账号

```
超级管理员:
  用户名: admin
  密码: admin123
```

### 3. 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8094 | http://localhost:8094 |
| 前端 | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |

---

## 📅 开发计划

### Week 1: 数据库设计与迁移

**目标**: 完成数据库表结构和 GORM 模型

**里程碑检查点**:
- [ ] 数据库迁移脚本完成
- [ ] GORM 模型代码完成
- [ ] 数据库测试覆盖率 > 70%

**交付物**:
- `backend/migrations/001_create_tenants.sql`
- `backend/internal/model/*.go`
- `backend/docs/database_guide.md`

**时间分配**:
- T1.1 创建迁移脚本: 8h
- T1.2 GORM 模型: 8h
- T1.3 数据库连接: 4h
- T1.4 索引优化: 4h
- T1.5 单元测试: 4h
- T1.6 文档编写: 4h

### Week 2: Go 服务基础接口

**目标**: 完成核心业务 API

**里程碑检查点**:
- [ ] 租户管理 API 完成
- [ ] 用户管理 API 完成
- [ ] 文件夹管理 API 完成
- [ ] 文件管理 API 完成
- [ ] JWT 认证中间件完成

**交付物**:
- `backend/internal/service/*.go`
- `backend/internal/handler/*.go`
- `backend/internal/repository/*.go`
- `backend/internal/middleware/*.go`

**时间分配**:
- T2.1 租户管理 API: 8h
- T2.2 用户管理 API: 8h
- T2.3 JWT 认证中间件: 6h
- T2.4 文件夹管理 API: 8h
- T2.5 文件管理 API: 8h
- T2.6-T2.8 其他任务: 2h

### Week 3: MinIO 存储集成

**目标**: 完成文件存储功能

**里程碑检查点**:
- [ ] MinIO 客户端封装完成
- [ ] 文件上传 API 完成（支持分片）
- [ ] 文件下载 API 完成
- [ ] 存储配额控制完成
- [ ] 缩略图生成完成

**交付物**:
- `backend/internal/storage/minio.go`
- `backend/internal/storage/thumbnail.go`
- `backend/internal/handler/upload_handler.go`
- `backend/internal/handler/download_handler.go`

**时间分配**:
- T3.1 MinIO 客户端: 8h
- T3.2 文件上传 API: 8h
- T3.3 文件下载 API: 4h
- T3.4 存储配额: 4h
- T3.5 缩略图: 4h
- T3.6 集成测试: 4h

### Week 4: 权限系统实现

**目标**: 完成权限控制功能

**里程碑检查点**:
- [ ] 权限检查服务完成
- [ ] 权限管理 API 完成
- [ ] 前端权限管理界面完成
- [ ] 权限审计日志完成
- [ ] 权限集成测试覆盖率 > 80%

**交付物**:
- `backend/internal/service/permission_service.go`
- `backend/internal/handler/permission_handler.go`
- `backend/internal/middleware/quota.go`
- `frontend/src/components/permissions/*.tsx`

**时间分配**:
- T4.1 权限检查服务: 8h
- T4.2 权限管理 API: 8h
- T4.3 操作权限控制: 4h
- T4.4 前端权限界面: 8h
- T4.5 权限集成测试: 4h
- T4.6 审计日志: 4h

---

## ✅ 质量标准

### 代码质量

```bash
# Go 代码检查
cd backend
golangci-lint run ./...

# 测试覆盖率
go test -cover ./...
# 目标: > 70%
```

### API 质量

- 所有 API 必须有输入验证
- 所有 API 必须有错误处理
- 所有 API 必须有日志记录
- 所有 API 必须有单元测试

### 性能标准

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| API 响应时间 P95 | < 200ms | APM 监控 |
| 权限检查时间 | < 10ms (缓存) | 单元测试 |
| 文件上传速度 | > 10MB/s | 手动测试 |

### 安全标准

- [ ] 所有 API 需要认证（除登录）
- [ ] 租户数据完全隔离
- [ ] 密码使用 bcrypt 加密
- [ ] 无 SQL 注入漏洞
- [ ] 无 XSS 漏洞
- [ ] 无硬编码敏感信息

---

## 📦 交付物清单

### 代码交付

| 类型 | 路径 | 说明 |
|------|------|------|
| 数据库迁移 | `backend/migrations/*.sql` | 所有数据库表 |
| 数据模型 | `backend/internal/model/*.go` | GORM 模型 |
| 业务服务 | `backend/internal/service/*.go` | 业务逻辑 |
| HTTP 处理器 | `backend/internal/handler/*.go` | API 端点 |
| 数据访问 | `backend/internal/repository/*.go` | 数据库操作 |
| 中间件 | `backend/internal/middleware/*.go` | JWT、限流等 |
| 存储服务 | `backend/internal/storage/*.go` | MinIO 封装 |
| 前端组件 | `frontend/src/components/media/*` | React 组件 |

### 文档交付

| 文档 | 路径 | 说明 |
|------|------|------|
| 技术规格 | `.trae/specs/media-library-phase1/SPEC.md` | 完整技术规格 |
| 任务清单 | `.trae/specs/media-library-phase1/tasks.md` | 详细任务分解 |
| 验收清单 | `.trae/specs/media-library-phase1/checklist.md` | 验收标准 |
| API 文档 | `backend/internal/router/media_library.go` | API 详细定义 |
| 数据库指南 | `backend/docs/database_guide.md` | 数据库使用指南 |

### 测试交付

| 类型 | 覆盖范围 | 覆盖率目标 |
|------|----------|------------|
| 单元测试 | 所有 Service、Repository | > 70% |
| 集成测试 | API 端点、数据库操作 | > 60% |
| E2E 测试 | 关键用户流程 | - |

---

## 🔍 审查流程

### 代码审查清单

每个 PR 必须通过以下审查：

#### 功能性
- [ ] 功能符合需求
- [ ] 边界条件处理
- [ ] 错误处理完善
- [ ] 无明显 Bug

#### 代码质量
- [ ] golangci-lint 通过
- [ ] 命名规范
- [ ] 注释完整
- [ ] 测试覆盖率达标

#### 安全性
- [ ] 无 SQL 注入
- [ ] 无 XSS
- [ ] 无硬编码敏感信息
- [ ] 权限检查正确

#### 性能
- [ ] 无 N+1 查询
- [ ] 无内存泄漏
- [ ] 算法复杂度合理

### 合并标准

- [ ] 所有 CI 检查通过
- [ ] 至少 1 个 Approval
- [ ] 无未解决的评论
- [ ] 分支是最新的

---

## 🐛 问题管理

### 问题分类

| 类型 | 优先级 | 响应时间 | 解决时间 |
|------|--------|----------|----------|
| P0 - 阻断 | 紧急 | 1h | 4h |
| P1 - 严重 | 高 | 4h | 24h |
| P2 - 一般 | 中 | 24h | 72h |
| P3 - 优化 | 低 | 72h | 1周 |

### 问题报告格式

```markdown
**问题描述**: [简述问题]
**复现步骤**: [步骤1, 步骤2, ...]
**期望结果**: [期望的行为]
**实际结果**: [实际的行为]
**环境信息**: [操作系统、版本等]
**截图/日志**: [如果有]
```

---

## 📞 沟通协作

### 每日站会

**时间**: 每天早上 10:00
**时长**: 15 分钟
**形式**: 线上会议

**内容**:
1. 昨天完成了什么
2. 今天计划做什么
3. 遇到什么阻碍

### 周会

**时间**: 每周五下午 3:00
**时长**: 1 小时
**形式**: 线上会议

**内容**:
1. 本周进度回顾
2. 问题总结
3. 下周计划
4. 风险评估

### 文档更新

- 所有技术决策必须记录到 Wiki
- API 变更必须更新 API 文档
- 数据库变更必须更新 ER 图

---

## 🎯 Phase 2 预告

Phase 1 完成后，将进入 **Phase 2: 核心功能开发**，包括：

- AI 检测任务管理
- YOLO 集成
- 自动标注功能
- 照片去重
- 报告生成

---

## 📚 参考资源

### 技术文档

- [Go Web 框架 Gin](https://gin-gonic.com/)
- [GORM 文档](https://gorm.io/)
- [MinIO 文档](https://min.io/docs/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

### 项目文档

- [巡检宝开发规范](../rules/project_rules.md)
- [TDD 开发方法论](../rules/global_dev_rules.md)
- [API 设计规范](../rules/api_design_rules.md)

### 培训材料

- [数据库设计指南](backend/docs/database_guide.md)
- [代码审查指南](../rules/code_review_rules.md)
- [测试最佳实践](../rules/testing_refactoring_rules.md)

---

## ❓ 常见问题

### Q: 如何处理大文件上传？

A: 使用分片上传，参考 T3.2 任务。分片大小建议 5MB，支持断点续传。

### Q: 如何保证租户数据隔离？

A: 所有查询必须包含 `tenant_id` 条件，通过中间件自动注入。

### Q: 如何处理权限继承？

A: 权限检查时会递归检查父文件夹权限，可通过 `inherit_permissions` 字段控制。

### Q: 如何生成缩略图？

A: 使用 `backend/internal/storage/thumbnail.go`，图片使用 PIL，视频使用 ffmpeg。

### Q: 如何添加新的文件类型？

A: 在 `media_files.file_type` CHECK 约束中添加，并更新前端文件类型映射。

---

## 📞 联系方式

- **项目负责人**: [待定]
- **技术负责人**: [待定]
- **UI/UX 负责人**: [待定]

**Slack 频道**: #media-library-dev
**邮件列表**: media-library@company.com

---

**最后更新**: 2026-04-02
**维护人**: AI Assistant
**版本**: v1.0.0
