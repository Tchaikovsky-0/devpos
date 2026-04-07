# 媒体库多租户改造计划

> **目标**：将媒体库从当前"半成品"状态改造为完整的多租户文件管理系统，用户可以自建文件夹、上传/管理文件、按租户隔离。

---

## 现状分析

### 后端已有的（可复用）
- `Media` / `MediaFolder` 模型：已有多租户 `TenantID`、树形文件夹 `ParentID`
- `MediaService`：文件列表、上传、下载、删除、文件夹 CRUD、存储统计
- 路由：`/api/v1/media/*` 已注册
- 租户存储配额：`TenantConfig.StorageQuota` + `StorageUsed`

### 后端缺失的
- 文件夹**重命名**接口（Handler 层没注册 Update 路由）
- 文件**移动**到其他文件夹（Service 有 `UpdateMediaRequest.FolderID` 但 Handler 没注册）
- 收藏（Starred）功能：后端模型没有此字段
- 前后端 API 路径不一致（前端 `/media/files` vs 后端 `/media`）

### 前端问题
- `Media.tsx` 页面**被缺陷案例页占用**，不是媒体库
- `mediaApi.ts` 已定义好 API hooks 但**没有被任何页面使用**
- 前端 `MediaItem` 类型有 `starred`、`thumbnail_path` 等后端不存在的字段

---

## 改造方案

### Phase 1：后端补全（让 API 完整可用）

#### 1.1 修复前后端 API 路径一致性
- 后端添加缺失的 Handler 路由：
  - `PUT /media/:id` — 更新文件（移动文件夹、修改描述）
  - `PUT /media/folders/:id` — 重命名文件夹
- 统一路径风格，确保前端 `mediaApi.ts` 能正确调用

#### 1.2 补充后端功能
- 添加 `starred` 字段到 `Media` 模型（布尔值，默认 false）
- 添加 `PUT /media/:id/star` 端点 — 收藏/取消收藏
- 确保所有 API 严格按 `tenant_id` 隔离

### Phase 2：前端媒体库页面重写

#### 2.1 新建独立的媒体库页面组件
替换当前被缺陷案例占用的 `Media.tsx`，实现：

**左侧栏 — 文件夹树**：
- 显示当前租户的所有文件夹（树形结构）
- 支持：新建文件夹、重命名、删除
- 点击文件夹 → 右侧显示该文件夹下的文件
- "全部文件" 根节点

**右侧主区域 — 文件列表**：
- 网格视图 / 列表视图 切换
- 文件卡片：缩略图（图片）、文件名、大小、时间
- 支持按类型筛选：全部 / 图片 / 视频 / 文档
- 支持搜索
- 支持文件上传（拖拽 + 点击）
- 支持删除、下载、移动到其他文件夹

**顶部栏**：
- 面包屑导航（显示当前文件夹路径）
- 存储空间使用情况（已用 / 总配额）
- 搜索框

### Phase 3：前后端联调 & 完善

#### 3.1 修复前端 API 层
- 修正 `mediaApi.ts` 中的 URL 路径与后端一致
- 修正 `MediaItem` 类型定义与后端模型对齐
- 确保所有 API 调用带 `tenant_id`（通过 JWT 中间件自动注入）

#### 3.2 联调验证
- 上传文件 → 文件出现在对应文件夹下
- 创建文件夹 → 文件夹树更新
- 删除文件 → 存储用量扣减
- 租户隔离 → 不同租户看不到对方的文件

---

## 具体实施步骤

### Step 1：后端 — 补全 Media 模型和 Handler
**文件**：`backend/internal/model/media.go`
- Media 结构体添加 `Starred bool` 字段

**文件**：`backend/internal/handler/media.go`
- 添加 `Update` handler（修改描述、移动文件夹）
- 添加 `UpdateFolder` handler（重命名文件夹）
- 添加 `ToggleStar` handler（收藏/取消收藏）

**文件**：`backend/internal/service/media.go`
- 添加 `UpdateMedia` 方法
- 添加 `UpdateFolder` 方法
- 添加 `ToggleStar` 方法

**文件**：`backend/internal/router/router.go`
- 注册新路由：`PUT /media/:id`、`PUT /media/folders/:id`、`PUT /media/:id/star`

### Step 2：前端 — 修复 API 层
**文件**：`frontend/src/store/api/mediaApi.ts`
- 修正 URL 路径与后端一致
- 修正 `MediaItem` 类型（添加 `starred`、移除后端没有的 `thumbnail_path`）
- 添加 `useUpdateMediaMutation`（移动文件、改描述）
- 添加 `useRenameFolderMutation`
- 添加 `useToggleStarMutation`

### Step 3：前端 — 重写媒体库页面
**文件**：`frontend/src/routes/Media.tsx`
- 完全重写为媒体库页面
- 左侧文件夹树 + 右侧文件网格/列表
- 顶部面包屑 + 搜索 + 存储用量
- 文件上传、删除、下载、移动、收藏功能

### Step 4：前端 — 新建子组件
**新建文件**：
- `frontend/src/components/media/FolderTree.tsx` — 文件夹树组件
- `frontend/src/components/media/FileGrid.tsx` — 文件网格组件
- `frontend/src/components/media/FileUploader.tsx` — 文件上传组件
- `frontend/src/components/media/Breadcrumb.tsx` — 面包屑导航
- `frontend/src/components/media/CreateFolderDialog.tsx` — 新建文件夹弹窗

### Step 5：联调验证
- 启动前后端，逐一验证所有功能
- 验证多租户隔离

---

## 不做的事（本次不涉及）
- ❌ MinIO/对象存储替换（当前本地存储够用）
- ❌ 分片上传/断点续传（Phase 2 再做）
- ❌ 文件秒传（MD5 去重）
- ❌ 文件夹权限管理（读/写/删/分享，后续迭代）
- ❌ 缩略图生成（后续迭代）
- ❌ 回收站功能（后续迭代）

---

## 预计影响范围

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/internal/model/media.go` | 修改 | 添加 Starred 字段 |
| `backend/internal/service/media.go` | 修改 | 添加 Update/Star 方法 |
| `backend/internal/handler/media.go` | 修改 | 添加 Update/Folder/Star handler |
| `backend/internal/router/router.go` | 修改 | 注册新路由 |
| `frontend/src/store/api/mediaApi.ts` | 修改 | 修正路径和类型 |
| `frontend/src/routes/Media.tsx` | 重写 | 从缺陷案例页改为媒体库页 |
| `frontend/src/components/media/*` | 新建 | 媒体库子组件 |
