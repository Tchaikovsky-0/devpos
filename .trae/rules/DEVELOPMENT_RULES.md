# 开发规范

## 产品定位

面向重工业企业的智能监控平台：OpenClaw AI Agent + YOLO 检测 + 企业级架构

---

## 前端架构规范（最高优先级）

### 唯一前端系统

- **项目唯一前端**: `frontend/` 目录下的 Admin 管理系统
- **技术栈**: React 18 + TypeScript + Ant Design 6 + Tailwind CSS + Vite + pnpm
- **禁止创建任何其他前端项目、HTML页面、独立Web应用**
- **所有前端开发必须基于现有 Admin 系统进行**

### Admin 系统八个模块（禁止删除/修改模块数量）

| 序号 | 模块名称 | 文件路径 | 功能 |
|------|---------|---------|------|
| 1 | 监控大屏 | `frontend/src/routes/Center.tsx` | 实时视频监控与态势感知 |
| 2 | 视频流监控 | `frontend/src/routes/Monitor.tsx` | 视频流管理与YOLO检测 |
| 3 | 媒体库 | `frontend/src/routes/Media.tsx` | 文件存储、标注与取证 |
| 4 | 图片库 | `frontend/src/routes/Gallery/index.tsx` | 图片浏览与管理 |
| 5 | 告警处置 | `frontend/src/routes/AlertsWorkspace.tsx` | 告警分析与处置 |
| 6 | 设备资产 | `frontend/src/routes/AssetsWorkspace.tsx` | 设备管理与诊断 |
| 7 | 任务协同 | `frontend/src/routes/TasksWorkspace.tsx` | 任务管理与执行 |
| 8 | 系统设置 | `frontend/src/routes/SystemWorkspace.tsx` | 系统配置与管理 |

### 前端目录结构

```
frontend/
├── src/
│   ├── routes/              # 路由与页面入口
│   │   ├── Admin.tsx        # Admin入口 → SystemWorkspace
│   │   ├── Center.tsx       # 监控大屏
│   │   ├── Monitor.tsx      # 视频流监控
│   │   ├── Media.tsx        # 媒体库
│   │   ├── Gallery/         # 图片库
│   │   ├── AlertsWorkspace.tsx   # 告警处置
│   │   ├── AssetsWorkspace.tsx   # 设备资产
│   │   ├── TasksWorkspace.tsx    # 任务协同
│   │   ├── SystemWorkspace.tsx   # 系统设置
│   │   ├── OpenClawWorkspace.tsx # OpenClaw集成
│   │   └── Login.tsx        # 登录页
│   ├── components/          # 组件库
│   │   ├── workspace/       # Workspace基础组件
│   │   ├── layout/          # 布局组件
│   │   ├── ui/              # 基础UI组件
│   │   └── ...
│   ├── store/               # Redux状态管理
│   ├── api/                 # API客户端
│   ├── hooks/               # 自定义Hooks
│   └── types/               # TypeScript类型定义
└── package.json
```

### 前端清理规则

- **禁止保留**: 独立HTML页面、测试页面(test.html/test-simple.html)、旧构建产物(frontend-dist-*)
- **禁止创建**: 新的前端项目目录、独立Web应用、Vue/Angular项目
- **必须删除**: macOS元数据文件(._*)、测试缓存(test-results/)、旧备份文件
- **必须保留**: Admin系统源码、workspace组件、构建配置

---

## 技术架构

- 前端：React 18 + TypeScript + Tailwind CSS + Shadcn UI + Ant Design
- 构建：Vite + pnpm（禁止 npm/yarn）
- 后端：Go 1.21+ + Gin
- 数据库：PostgreSQL 14+ + Redis 6+
- AI服务：Python 3.10+ + FastAPI + YOLO/OpenCV
- 端口：前端 3000 | Go 8094 | Python 8095 | PG 5432 | Redis 6379 | MinIO 9000

---

## 架构约束

- Go 禁止直接调用 YOLO，必须通过 Python 服务
- Python 禁止处理 WebSocket 连接
- 禁止跨服务直接访问数据库
- 禁止绕过 API Gateway 直接访问服务

---

## 分层架构

- Go：Handler（薄）-> Service（厚）-> Repository -> Model
- Python：Router -> Service -> Model
- 前端：Page -> Component -> API -> Store

---

## API 规范

- RESTful：GET 列表、POST 创建、GET 单个、PUT 更新、DELETE 删除
- URL 使用复数名词、kebab-case
- 响应格式：{ code, message, data, timestamp }
- 嵌套资源限制 3 层

---

## TypeScript 规范

- 禁止 any，使用 unknown
- 函数必须标注返回值
- interface 用于简单对象，type 用于复杂类型
- 组件使用 PascalCase，函数使用 camelCase
- 禁止类组件（React）
- 使用 React.memo / useMemo / useCallback 优化性能
- 使用 ErrorBoundary 处理错误
- 可选链 user?.profile?.name，空值合并 value ?? defaultValue

---

## Go 规范

- 禁止忽略 error 返回值
- 禁止循环内数据库查询
- 禁止 goroutine 泄漏
- 禁止全局变量存储状态
- 错误处理使用 fmt.Errorf("context: %w", err)
- 所有查询必须带 tenant_id（多租户隔离）

---

## Python 规范

- 模块 snake_case，类 PascalCase
- 禁止全局变量存储状态
- 禁止阻塞主线程
- 必须关闭文件句柄

---

## 数据库规范

- 所有表必须包含：id, created_at, updated_at, deleted_at, tenant_id
- 表名小写复数、下划线分隔
- 索引命名：idx_表名_字段名
- 禁止 SELECT *
- 禁止深度分页（offset > 1000）
- 禁止隐式 JOIN
- 禁止无 WHERE 的 UPDATE/DELETE
- 外键字段必须有索引
- 推荐 Keyset Pagination

---

## 测试

- 单元测试 60-70%，集成测试 20-30%，E2E 5-10%
- 重构前必须有测试覆盖
- 重构时禁止改变功能
- 修复后必须运行测试验证

---

## Agent 协作

- 通信使用标准 JSON 格式（type, from, to, payload, metadata）
- 任务交接必须包含：已完成工作、剩余工作、涉及文件、待解答问题
- 禁止 Agent 间直接修改对方代码，必须通过 PR + Code Review

---

## 禁止事项汇总

- 禁止 any 类型 (TS)
- 禁止 SELECT *
- 禁止循环内数据库查询
- 禁止忽略 error (Go)
- 禁止硬编码敏感信息
- 禁止使用 npm/yarn（前端用 pnpm）
- 禁止提交 node_modules/.cache/.vite/dist
- 禁止在生产代码中使用 debugger
- 禁止不处理的 error/exception
- 禁止未 Review 直接合并代码
