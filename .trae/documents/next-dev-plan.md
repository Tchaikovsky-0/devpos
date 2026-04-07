# 巡检宝 - 下一轮开发计划

> 日期: 2026-04-05
> 前置: 深链收口 ✅ → 审计导出 CSV/JSON ✅

---

## 当前项目状态

已完成的核心闭环：
- ✅ 缺陷案例全生命周期（创建 → 证据 → 合并/拆分 → 报告 → 审计）
- ✅ 活动深链（URL ↔ 筛选 ↔ 选中活动 三向同步）
- ✅ 审计结果导出 CSV/JSON
- ✅ 视频流/告警/任务/传感器/报告 API 对接
- ✅ 监控中枢多画面网格 + 沉浸模式

---

## 本轮开发任务（按优先级排序）

### 任务 1: 媒体库 API 对接（P0）

**现状**: `mediaApi.ts` 全是 Mock 数据（Unsplash 占位图），后端 `/api/v1/media` 已经有完整的 CRUD。

**改动范围**:
1. **`store/api/mediaApi.ts`**（媒体库 API 切片）:
   - 新增后端对齐的 TypeScript 类型：`MediaFile`、`MediaFolder`、`MediaUploadResponse`、`MediaStorageInfo`
   - 将 `listMedia` 的 `queryFn`（Mock）改为 `query: '/media'`
   - 将 `getMediaStatistics` 的 `queryFn`（Mock）改为 `query: '/media/storage-info'`
   - 新增 `listMediaFolders` → `GET /media/folders`
   - 新增 `uploadMedia` → `POST /media/upload`（FormData）
   - 新增 `deleteMedia` → `DELETE /media/:id`
   - 删除所有 Mock 数据（Unsplash 图片 ID、`generateMockPhotos` 等）

2. **`routes/Media.tsx`**（媒体库 + 工作台页面）:
   - `LibraryMediaItem` 接口对齐后端返回结构
   - 媒体库模式（`mode=library`）从 `useGetAlertsQuery` 派生数据改为 `useListMediaQuery`
   - 目录/文件夹筛选接入 `useListMediaFoldersQuery`
   - 媒体统计接入真实 API

### 任务 2: Center.tsx 关联资料面板接入（P1）

**现状**: `relatedMedia` 是空数组常量，"关联资料"区块永远不会显示。

**改动范围**:
- 使用 `useListMediaQuery` 或直接从 `useGetAlertsQuery` 的快照/附件中提取关联媒体
- 让 `relatedMedia` 有真实数据，使关联资料面板真正可用

### 任务 3: Monitor.tsx 全屏功能（P1）

**现状**: `handleFullscreen` 是空函数。

**改动范围**:
- 用 `Fullscreen API`（`document.requestFullscreen()`）实现画面全屏
- Esc 退出全屏（浏览器原生支持）

### 任务 4: Center.tsx 重复按钮去重（P2）

**现状**: "转为缺陷案例" 和 "送去工作台研判" 功能完全相同。

**改动范围**:
- 保留 "转为缺陷案例" 按钮
- 将 "送去工作台研判" 改为 "送去 OpenClaw 研判"（跳转 OpenClaw 页面并携带上下文）
- 与 Media 工作台的 `ensureCaseAndNavigate("media")` 区分开

---

## 实施顺序

```
任务 1（媒体库 API 对接）
  → 任务 2（Center 关联资料）
  → 任务 3（Monitor 全屏）
  → 任务 4（Center 按钮去重）
```

每个任务完成后执行 `pnpm build` + `pnpm test:run` 验证。

---

## 风险与注意事项

1. **媒体库 API 对接**: 需要确认后端 `/api/v1/media` 的实际返回字段结构，类型定义要匹配
2. **Center 关联资料**: 后端 media API 可能没有按 `stream_id` 筛选的能力，需要确认
3. **Mock 数据移除**: 改完后 Media.tsx 的 library 模式数据来源完全变了，需要同步更新
