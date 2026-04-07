# 巡检宝 - 双项目并行开发协调计划

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **状态**: 🚀 进行中

---

## 🎯 项目概览

### 双项目并行开发

| 项目 | 模块 | 优先级 | 预计工期 |
|------|------|--------|----------|
| **媒体库模块** | 多租户文件管理 + 权限控制 | P0 | 4 周 |
| **AR 眼镜集成** | 实时视频流 + AI 标注 | P0 | 8 周 |

### 并行开发策略

```
Week 1-4: 媒体库基础 + AR 架构
         ↓
Week 5-8: 媒体库 AI + AR 功能
         ↓
Week 9+: 集成测试 + 优化
```

---

## 👥 团队配置

### 虚拟团队

| 角色 | 人数 | 主要任务 |
|------|------|----------|
| **Backend Lead** | 1 | 架构设计、代码审查 |
| **Backend Dev** | 2 | 业务逻辑、API 开发 |
| **AI Lead** | 1 | AI 算法、模型优化 |
| **Frontend Dev** | 1 | 前端界面、组件开发 |
| **DevOps** | 0.5 | 环境搭建、CI/CD |

### 任务分配矩阵

| 人员 | 媒体库任务 | AR 任务 |
|------|-----------|---------|
| Backend Lead | 架构设计 | 架构设计 |
| Backend Dev 1 | 数据库 + 存储 | WebSocket 网关 |
| Backend Dev 2 | 权限系统 | 设备管理 |
| AI Lead | AI 接口 | YOLO 检测 + 标注 |
| Frontend Dev | 媒体库 UI | AR 组件 |

---

## 📅 Week 1-2: 并行启动阶段

### 媒体库 Week 1

| 任务 | 负责人 | 状态 | 依赖 |
|------|--------|------|------|
| T1.1 数据库迁移 | Backend Dev 1 | 🔄 | - |
| T1.2 GORM 模型 | Backend Dev 1 | ⬜ | T1.1 |
| T1.3 数据库连接 | Backend Dev 1 | ⬜ | T1.1 |
| T1.4 索引优化 | Backend Lead | ⬜ | T1.1 |
| T1.5 单元测试 | Backend Dev 1 | ⬜ | T1.2 |

### AR 眼镜 Week 1

| 任务 | 负责人 | 状态 | 依赖 |
|------|--------|------|------|
| AR-T1.1 数据库迁移 | Backend Dev 2 | 🔄 | - |
| AR-T1.2 GORM 模型 | Backend Dev 2 | ⬜ | AR-T1.1 |
| AR-T1.3 WebSocket 网关 | Backend Lead | ⬜ | - |
| AR-T1.4 消息协议 | Backend Dev 2 | ⬜ | AR-T1.3 |
| AR-T1.5 会话管理 | Backend Dev 2 | ⬜ | AR-T1.3 |

---

## 🎯 Week 1 任务详情

### 媒体库: T1.1 数据库迁移

**文件**: `backend/migrations/001_create_tenants.sql`

**已创建内容**:
- ✅ tenants 表（租户）
- ✅ users 表（用户）
- ✅ media_folders 表（文件夹）
- ✅ media_permissions 表（权限）
- ✅ media_files 表（文件）

**验收标准**:
- [ ] 所有表创建成功
- [ ] 外键约束正确
- [ ] 索引创建成功
- [ ] 默认数据插入成功

**测试命令**:
```bash
cd backend
psql -U postgres -d xunjianbao -f migrations/001_create_tenants.sql
psql -U postgres -d xunjianbao -c "\dt"
```

### AR 眼镜: AR-T1.1 数据库迁移

**文件**: `backend/migrations/007_create_ar_devices.sql`

**已创建内容**:
- ✅ ar_devices 表（AR 设备）
- ✅ ar_sessions 表（AR 会话）
- ✅ ar_events 表（AR 事件）
- ✅ ar_detections 表（AR 检测）
- ✅ ar_inspection_routes 表（巡检轨迹）

**验收标准**:
- [ ] 所有表创建成功
- [ ] PostGIS 扩展启用
- [ ] 外键约束正确
- [ ] 视图创建成功

**测试命令**:
```bash
psql -U postgres -d xunjianbao -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d xunjianbao -f migrations/007_create_ar_devices.sql
psql -U postgres -d xunjianbao -c "\dt"
```

---

## 🔧 开发环境快速启动

### 1. 数据库迁移

```bash
# 媒体库数据库
cd backend
psql -U postgres -d xunjianbao -f migrations/001_create_tenants.sql

# AR 数据库
psql -U postgres -d xunjianbao -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d xunjianbao -f migrations/007_create_ar_devices.sql
```

### 2. 启动服务

```bash
# 终端 1: Go 主服务
cd backend
go run cmd/server/main.go
# 端口: 8094

# 终端 2: Go AR WebSocket 服务
cd backend
go run cmd/ar-server/main.go
# 端口: 8097

# 终端 3: Python AI 服务
cd ai-service
uvicorn app.main:app --reload
# 端口: 8095

# 终端 4: 前端
cd frontend
pnpm dev
# 端口: 3000
```

### 3. 验证部署

```bash
# 检查数据库
psql -U postgres -d xunjianbao -c "\dt"

# 检查 Go 服务
curl http://localhost:8094/health

# 检查 AI 服务
curl http://localhost:8095/health

# 检查 WebSocket
wscat -c ws://localhost:8097/ar?token=test
```

---

## 📊 进度追踪

### Week 1 目标

| 项目 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 媒体库 | 数据库迁移完成 | - | ⬜ |
| 媒体库 | GORM 模型完成 | - | ⬜ |
| AR | 数据库迁移完成 | - | 🔄 |
| AR | WebSocket 网关 50% | - | ⬜ |

### 里程碑检查

**Milestone 1: 数据库就绪** (Week 1 结束)
- [ ] 媒体库数据库迁移完成
- [ ] AR 数据库迁移完成
- [ ] GORM 模型基础完成

---

## 🎯 本周优先任务

### 立即开始的任务

#### 任务 1: 验证数据库迁移

```bash
# 1. 执行媒体库迁移
psql -U postgres -d xunjianbao -f backend/migrations/001_create_tenants.sql

# 2. 执行 AR 迁移
psql -U postgres -d xunjianbao -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d xunjianbao -f backend/migrations/007_create_ar_devices.sql

# 3. 验证
psql -U postgres -d xunjianbao -c "\dt"
```

**预期输出**:
```
              List of relations
 Schema |         Name         | Type  |  Owner
--------+------------------------+-------+----------
 public | tenants              | table | postgres
 public | users               | table | postgres
 public | media_folders       | table | postgres
 public | media_permissions  | table | postgres
 public | media_files        | table | postgres
 public | ar_devices         | table | postgres
 public | ar_sessions       | table | postgres
 public | ar_events         | table | postgres
 public | ar_detections     | table | postgres
 public | ar_inspection_routes | table | postgres
(10 rows)
```

#### 任务 2: 创建 GORM 模型基础

**媒体库模型**:
- `backend/internal/model/tenant.go`
- `backend/internal/model/user.go`
- `backend/internal/model/media_folder.go`
- `backend/internal/model/media_file.go`

**AR 模型**:
- `backend/internal/model/ar_device.go`
- `backend/internal/model/ar_session.go`
- `backend/internal/model/ar_event.go`

---

## 🔗 依赖关系

```
媒体库:
T1.1 数据库迁移
  ↓
T1.2 GORM 模型
  ↓
T1.3 数据库连接
  ↓
T1.4 索引优化

AR 眼镜:
AR-T1.1 数据库迁移
  ↓
AR-T1.2 GORM 模型
  ↓
AR-T1.3 WebSocket 网关
  ↓
AR-T1.4 消息协议
```

---

## 📱 沟通机制

### 每日站会

**时间**: 每天早上 10:00
**形式**: 线上会议
**内容**:
1. 昨天完成
2. 今天计划
3. 遇到问题

### 周会

**时间**: 每周五下午 3:00
**形式**: 线上会议
**内容**:
1. 本周进度回顾
2. 问题总结
3. 下周计划

---

## ⚠️ 风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 数据库冲突 | 中 | 高 | 明确表名前缀 |
| API 设计不一致 | 中 | 中 | 统一规范，定期 review |
| 性能瓶颈 | 中 | 中 | 提前做压力测试 |
| 人员协作 | 低 | 中 | 明确分工，文档先行 |

---

## ✅ 验收标准

### Week 1 验收

- [ ] 所有数据库表创建成功
- [ ] 数据库可正常连接
- [ ] GORM 模型编译通过
- [ ] 单元测试覆盖率 > 50%

### Week 2 验收

- [ ] 所有 API 端点可用
- [ ] WebSocket 连接正常
- [ ] 单元测试覆盖率 > 70%

---

## 📚 参考资源

### 技术文档

- [GORM 文档](https://gorm.io/docs/)
- [Gorilla WebSocket](https://github.com/gorilla/websocket)
- [PostgreSQL PostGIS](https://postgis.net/documentation/)

### 项目文档

- [媒体库 SPEC.md](../specs/media-library-phase1/SPEC.md)
- [AR 眼镜 SPEC.md](../specs/ar-glasses-integration/SPEC.md)
- [项目规范](../rules/project_rules.md)

---

## 🎯 下一步行动

### 立即执行

1. ✅ 执行数据库迁移脚本
2. ✅ 验证数据库创建成功
3. ✅ 开始创建 GORM 模型

### 计划中

4. ⬜ 创建 WebSocket 网关基础
5. ⬜ 实现第一个 API 端点
6. ⬜ 编写单元测试

---

**最后更新**: 2026-04-02
**维护人**: AI Assistant
**版本**: v1.0.0
