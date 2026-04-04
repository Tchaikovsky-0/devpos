# 媒体库 Gallery 复刻 Spec

> **源项目**: `/Volumes/DevDrive/xunjianbao/` (远洋的外置硬盘项目)
> **目标项目**: `/Users/fanxing/xunjianbao/` (当前项目)
> **复刻时间**: 2026-04-04
> **版本**: v1.0.0

---

## 一、Why - 为什么要复刻？

当前项目的 Gallery 媒体库功能过于基础，只有简单的文件列表、搜索和筛选功能。相比之下，远洋在外置硬盘项目中已经开发了功能完善的媒体库，包含收藏、回收站、AI分析、报告生成等高级功能。

**核心问题**：
- 当前媒体库功能单一，用户体验差
- 缺乏收藏、回收站等实用功能
- 没有AI分析和报告生成能力
- 无法满足企业级监控平台的媒体管理需求

---

## 二、What Changes - 复刻内容

### 2.1 功能复刻清单

#### 基础功能增强
- [ ] **Tab 切换**：全部/收藏/回收站 三标签页
- [ ] **收藏功能**：收藏/取消收藏图片
- [ ] **回收站功能**：
  - 移入回收站
  - 从回收站恢复
  - 彻底删除
  - 清空回收站
- [ ] **多选模式**：批量选择、批量操作
- [ ] **全屏预览**：原始比例大图预览、元数据展示

#### AI功能集成
- [ ] **AI分析**：对选中图片进行AI分析
- [ ] **报告生成**：
  - 生成巡检报告（PDF格式）
  - 生成巡检报告（Markdown格式）

#### UI/UX 增强
- [ ] **右键菜单**：快捷操作菜单
- [ ] **分享功能**：复制链接、Web Share API
- [ ] **下载功能**：单张图片下载
- [ ] **动画效果**：卡片入场动画、过渡动画

#### 数据管理
- [ ] **本地存储**：使用 localStorage 持久化收藏和回收站数据
- [ ] **Mock数据**：航拍照片模拟数据（高度、经纬度、时间等元数据）

---

## 三、Impact - 影响范围

### 3.1 受影响文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/routes/Gallery.tsx` | 重写 | 完整复刻高级Gallery功能 |
| `frontend/src/components/ui/dialog.tsx` | 检查 | Dialog组件（远洋项目已存在） |
| `frontend/src/components/ui/alert-dialog.tsx` | 检查 | AlertDialog组件（远洋项目已存在） |
| `frontend/src/components/ui/context-menu.tsx` | 检查 | ContextMenu组件（远洋项目已存在） |
| `frontend/src/components/ui/scroll-area.tsx` | 检查 | ScrollArea组件（远洋项目已存在） |
| `frontend/src/components/AnalysisDialog.tsx` | 新增 | AI分析对话框组件 |
| `frontend/src/reports/buildPayload.ts` | 新增 | 报告生成工具 |
| `frontend/src/reports/exportPdf.tsx` | 新增 | PDF导出工具 |
| `frontend/src/reports/markdownFromPayload.ts` | 新增 | Markdown导出工具 |

### 3.2 技术栈适配

**远洋项目使用的技术**：
- React + TypeScript
- shadcn/ui 组件库
- framer-motion 动画库
- react-i18next 国际化
- sonner toast通知

**当前项目使用的技术**：
- React + TypeScript
- Tailwind CSS (自定义样式)
- Lucide React 图标

**适配策略**：
由于当前项目使用 Tailwind CSS + 自定义组件，不使用 shadcn/ui，需要：
1. 保留核心功能逻辑
2. 使用当前项目的 UI 组件库（Button, Dialog等）
3. 适配当前项目的样式系统
4. 移除对 shadcn/ui 的依赖

---

## 四、功能详细规格

### 4.1 标签页系统

```typescript
type GalleryTab = "all" | "starred" | "trash";
```

- **全部**：显示所有照片
- **收藏**：只显示收藏的照片
- **回收站**：显示已删除的照片

### 4.2 照片数据结构

```typescript
type Photo = {
  id: number;
  time: string;        // 拍摄时间
  date: string;        // 拍摄日期
  alt: number;         // 飞行高度(m)
  lat: number;         // 纬度
  lng: number;         // 经度
  tag: string;         // 标签（巡检/监测/测绘/搜救）
  starred: boolean;    // 是否收藏
  image: string;       // 网格缩略图
  imageFull: string;   // 预览大图
};
```

### 4.3 本地存储

```typescript
const STORAGE_KEY = "coai-gallery-v1";
// 存储格式：{ photos: Photo[], trash: Photo[] }
```

### 4.4 核心操作

| 操作 | 触发方式 | 行为 |
|------|----------|------|
| 预览 | 单击图片 | 打开全屏预览模式 |
| 收藏 | 右键菜单/预览页 | 切换收藏状态 |
| 删除 | 右键菜单/预览页 | 移入回收站 |
| 恢复 | 回收站右键菜单 | 从回收站恢复 |
| 彻底删除 | 回收站右键菜单 | 永久删除 |
| AI分析 | 批量选择后按钮 | 打开AI分析对话框 |
| 生成报告 | 批量选择后按钮 | 打开报告生成对话框 |

### 4.5 Mock数据

使用 Unsplash 的航拍照片作为Mock数据：
- 12张航拍照片
- 包含高度、经纬度、时间等元数据
- 使用URL参数控制缩略图尺寸

---

## 五、性能考虑

### 5.1 图片加载优化

- 使用懒加载：`loading="lazy"`
- 使用缩略图：网格用小图，预览用大图
- 渐进式加载：网格到预览无缝切换

### 5.2 状态管理

- 使用 `useState` 管理状态
- 使用 `useMemo` 缓存过滤结果
- 使用 `useCallback` 缓存回调函数

### 5.3 动画性能

- 使用 CSS `transform` 和 `opacity` 实现动画
- 避免布局抖动（reflow）
- 控制动画数量，避免性能问题

---

## 六、兼容性

### 6.1 浏览器兼容

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 6.2 功能降级

- Web Share API：不支持时降级为复制链接
- localStorage：存储失败时使用内存存储

---

## 七、测试计划

### 7.1 功能测试

- [ ] Tab切换正常
- [ ] 收藏功能正常
- [ ] 回收站功能正常
- [ ] 多选模式正常
- [ ] 全屏预览正常
- [ ] 下载功能正常
- [ ] 分享功能正常
- [ ] 搜索功能正常
- [ ] AI分析对话框正常
- [ ] 报告生成功能正常

### 7.2 边界测试

- [ ] 空状态显示
- [ ] 大量数据性能
- [ ] 本地存储溢出处理
- [ ] 网络异常处理

---

## 八、后续扩展

### Phase 2: 后端对接
- [ ] 对接真实API获取照片列表
- [ ] 实现真正的文件上传
- [ ] 实现真正的文件删除（后端API）

### Phase 3: AI增强
- [ ] 集成真实的AI分析服务
- [ ] 支持更多AI功能

### Phase 4: 存储优化
- [ ] 支持分页加载
- [ ] 实现虚拟滚动
- [ ] 支持更多存储介质（NAS、云存储等）

---

**最后更新**: 2026-04-04
**版本**: v1.0.0
**状态**: 待实施
