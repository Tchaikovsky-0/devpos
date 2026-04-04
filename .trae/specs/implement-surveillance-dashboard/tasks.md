# Tasks

## Phase 1: 基础架构搭建

- [x] Task 1: 创建监控大屏基础页面结构
  - [x] SubTask 1.1: 创建 `/app/src/routes/Monitor.tsx` 主页面组件
  - [x] SubTask 1.2: 在 `router.tsx` 中添加 `/monitor` 路由
  - [x] SubTask 1.3: 创建基础布局容器，包含顶部工具栏、主内容区、侧边栏
  - [x] SubTask 1.4: 实现深色主题样式，符合监控场景的专业感

- [x] Task 2: 实现多画面布局系统
  - [x] SubTask 2.1: 创建 `/app/src/components/monitor/LayoutSelector.tsx` 布局选择器组件
  - [x] SubTask 2.2: 实现布局配置数据结构（1x1、2x2、3x3、4x4、5x5）
  - [x] SubTask 2.3: 创建 `/app/src/components/monitor/VideoGrid.tsx` 视频网格组件
  - [x] SubTask 2.4: 实现布局切换动画（平滑过渡效果）
  - [x] SubTask 2.5: 添加布局切换快捷键支持（数字键1-5）

- [x] Task 3: 创建视频窗口组件
  - [x] SubTask 3.1: 创建 `/app/src/components/monitor/VideoCell.tsx` 单个视频窗口组件
  - [x] SubTask 3.2: 实现视频窗口的基础UI（边框、标题栏、状态指示器）
  - [x] SubTask 3.3: 添加窗口悬停效果（显示控制按钮、状态信息）
  - [x] SubTask 3.4: 实现双击全屏功能
  - [x] SubTask 3.5: 实现窗口焦点管理（点击高亮、自动切换焦点）

## Phase 2: 视频流集成

- [x] Task 4: 创建视频流API和数据层
  - [x] SubTask 4.1: 创建 `/app/src/api/stream.ts` 视频流API接口
  - [x] SubTask 4.2: 定义视频流数据类型（Stream、StreamStatus、StreamType等）
  - [x] SubTask 4.3: 创建 `/app/src/store/stream.ts` 视频流状态管理（使用Redux Toolkit）
  - [x] SubTask 4.4: 实现视频流列表获取、状态更新等API调用

- [x] Task 5: 实现视频播放器集成
  - [x] SubTask 5.1: 创建 `/app/src/components/monitor/VideoPlayer.tsx` 视频播放器组件
  - [x] SubTask 5.2: 集成HLS播放器（使用hls.js）
  - [x] SubTask 5.3: 实现播放器状态管理（播放、暂停、加载中、错误）
  - [x] SubTask 5.4: 添加播放器控制条（音量、全屏、截图等）
  - [x] SubTask 5.5: 实现播放器性能监控（帧率、码率、延迟显示）

- [x] Task 6: 实现无人机视频流专区
  - [x] SubTask 6.1: 创建 `/app/src/components/monitor/DroneZone.tsx` 无人机专区组件
  - [x] SubTask 6.2: 实现固定6块布局（3x2网格）
  - [x] SubTask 6.3: 添加无人机状态信息显示（设备名、电量、信号、高度等）
  - [x] SubTask 6.4: 实现无人机视频流异常处理（信号丢失、自动重连）
  - [x] SubTask 6.5: 添加无人机专区与主视频区的联动（点击放大到主区）

## Phase 3: 交互功能实现

- [ ] Task 7: 实现视频流拖拽排序
  - [ ] SubTask 7.1: 集成拖拽库（dnd-kit或react-beautiful-dnd）
  - [ ] SubTask 7.2: 实现视频窗口拖拽交换功能
  - [ ] SubTask 7.3: 添加拖拽视觉反馈（半透明预览、目标位置高亮）
  - [ ] SubTask 7.4: 实现拖拽后的状态持久化（保存到localStorage）

- [ ] Task 8: 实现视频流状态监控
  - [ ] SubTask 8.1: 创建 `/app/src/components/monitor/StatusBar.tsx` 状态栏组件
  - [ ] SubTask 8.2: 实现实时状态更新（WebSocket或轮询）
  - [ ] SubTask 8.3: 添加状态指示器（绿色=正常、黄色=警告、红色=异常）
  - [ ] SubTask 8.4: 实现异常告警提示（弹窗、声音提示）
  - [ ] SubTask 8.5: 添加状态统计面板（在线数、离线数、告警数）

- [ ] Task 9: 实现自定义布局功能
  - [ ] SubTask 9.1: 创建 `/app/src/components/monitor/LayoutEditor.tsx` 布局编辑器
  - [ ] SubTask 9.2: 实现窗口大小调整功能（拖拽边框）
  - [ ] SubTask 9.3: 实现窗口位置调整功能（拖拽标题栏）
  - [ ] SubTask 9.4: 添加布局保存和加载功能
  - [ ] SubTask 9.5: 实现布局模板管理（预设模板、自定义模板）

## Phase 4: OpenClaw AI集成

- [x] Task 10: 创建AI助手面板
  - [x] SubTask 10.1: 创建 `/app/src/components/monitor/AIPanel.tsx` AI助手面板组件
  - [x] SubTask 10.2: 实现面板的显示/隐藏动画（从右侧滑入）
  - [x] SubTask 10.3: 创建对话界面（消息列表、输入框、发送按钮）
  - [x] SubTask 10.4: 实现快捷键唤起（Ctrl+K）
  - [x] SubTask 10.5: 添加AI助手悬浮按钮（右下角）

- [x] Task 11: 实现AI对话功能
  - [x] SubTask 11.1: 集成OpenClaw API调用
  - [x] SubTask 11.2: 实现对话历史管理
  - [x] SubTask 11.3: 添加对话建议（快捷问题、历史问题）
  - [x] SubTask 11.4: 实现AI响应的流式显示
  - [x] SubTask 11.5: 添加对话结果的视觉反馈（高亮相关视频流）

- [x] Task 12: 实现智能监控功能
  - [x] SubTask 12.1: 创建监控工具函数（查询摄像头、查询告警、查询录像等）
  - [x] SubTask 12.2: 实现AI调用监控工具的逻辑
  - [x] SubTask 12.3: 实现告警自动分析（YOLO检测 → AI分析 → 生成报告）
  - [x] SubTask 12.4: 实现语音控制功能（语音识别 → 指令执行）
  - [x] SubTask 12.5: 添加智能推荐功能（根据当前状态推荐操作）

## Phase 5: 性能优化

- [ ] Task 13: 实现性能优化策略
  - [ ] SubTask 13.1: 实现自适应码率调整（根据窗口数量动态调整）
  - [ ] SubTask 13.2: 实现虚拟滚动优化（只渲染可见区域）
  - [ ] SubTask 13.3: 添加焦点窗口管理（焦点窗口高清，其他窗口降质）
  - [ ] SubTask 13.4: 实现播放器资源池管理（复用播放器实例）
  - [ ] SubTask 13.5: 添加性能监控面板（CPU、内存、网络使用情况）

- [ ] Task 14: 实现数据缓存和预加载
  - [ ] SubTask 14.1: 实现视频流列表缓存（React Query）
  - [ ] SubTask 14.2: 实现布局配置缓存（localStorage）
  - [ ] SubTask 14.3: 实现视频流预加载（提前加载下一页视频流）
  - [ ] SubTask 14.4: 实现截图缓存（IndexedDB存储截图）

## Phase 6: 测试和文档

- [ ] Task 15: 编写单元测试和集成测试
  - [ ] SubTask 15.1: 为视频流API编写单元测试
  - [ ] SubTask 15.2: 为布局系统编写单元测试
  - [ ] SubTask 15.3: 为AI对话功能编写集成测试
  - [ ] SubTask 15.4: 编写E2E测试（用户完整操作流程）

- [ ] Task 16: 性能测试和优化
  - [ ] SubTask 16.1: 测试20路视频流同时播放的性能
  - [ ] SubTask 16.2: 测试布局切换的流畅度
  - [ ] SubTask 16.3: 测试AI对话的响应速度
  - [ ] SubTask 16.4: 根据测试结果优化性能瓶颈

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 3]
- [Task 8] depends on [Task 4]
- [Task 9] depends on [Task 2]
- [Task 11] depends on [Task 10]
- [Task 12] depends on [Task 11]
- [Task 13] depends on [Task 5]
- [Task 14] depends on [Task 4]
- [Task 15] depends on [Task 1-14]
- [Task 16] depends on [Task 1-14]
