# 巡检宝杀手锏功能规划方案

## Why

巡检宝需要找到**对比海康/大华等竞品的差异化竞争优势**。当前监控市场，海康威视占据34%份额，大华16%，华为12.5%，传统AI监控已经陷入同质化竞争。我们需要通过**软硬件一体化 + 本地AI Agent**的创新路线，打破僵局，开辟新蓝海。

## What Changes

### 核心产品定位

```
巡检宝 = 算力盒子（边缘AI）+ 软件平台（OpenClaw + YOLO）

差异化定位：
- 竞品：云端AI，数据上云，价格贵，部署复杂
- 巡检宝：边缘AI，数据本地，开箱即用，成本低
```

### 杀手锏功能矩阵（按优先级排序）

#### 🔥 P0 - 核心杀手锏（必须做）

##### 1. 本地AI Agent（算力盒子 + OpenClaw）
**目标**：成为竞品无法复制的核心壁垒

**功能点**：
- OpenClaw跑在Jetson算力盒子本地
- 实时对话、告警分析、报告生成全本地化
- 数据不出盒子，满足国企/政府合规要求
- 断网可用，偏远地区（矿山/野外）刚需

**技术方案**：
```
硬件：Jetson Xavier NX（8-16路视频流，推荐）
软件：OpenClaw轻量版（量化优化，适配ARM64）
存储：本地SSD 512GB-2TB（根据规模选型）
网络：4G/5G模块（可选，野外场景）
```

**竞品对比**：
| 特性 | 海康威视 | 大华 | 巡检宝 |
|------|---------|------|--------|
| AI能力 | 云端/本地 | 云端/本地 | **本地AI Agent** |
| 数据隐私 | ❌ 云端 | ❌ 云端 | ✅ **本地处理** |
| 离线可用 | ❌ 必须联网 | ❌ 必须联网 | ✅ **离线可用** |
| 部署难度 | 高（需要专业集成） | 高 | ✅ **开箱即用** |
| 成本 | ¥50万+ | ¥30万+ | ✅ **¥7999起** |

##### 2. 开箱即用一体机
**目标**：降低部署门槛，实现快速推广

**产品线**：
```
🏠 轻量版（Jetson Nano）
   - 视频流：2-4路
   - 价格：¥2999-4999
   - 目标：小型项目/家庭/商铺

🏢 标准版（Jetson Xavier NX）⭐ 推荐
   - 视频流：8-16路
   - 价格：¥7999-12999
   - 目标：中型企业/工厂/园区

🏗️ 专业版（Jetson AGX Xavier）
   - 视频流：32+路
   - 价格：¥19999-29999
   - 目标：大型项目/智慧园区/城市治理
```

**功能点**：
- 预装巡检宝软件，扫码激活
- 自动识别RTSP/ONVIF摄像头
- 一键配置，零技术门槛
- 远程运维，批量管理
- 自动OTA升级

#### 🎯 P1 - 差异化功能（重要）

##### 3. 私有知识库 + 行业AI
**目标**：针对特定行业深度优化，提升专业性

**功能点**：
- 本地向量数据库（Milvus Lite/Qdrant）
- 预装行业知识库：
  - 矿山安全规程
  - 化工安全规范
  - 电力巡检标准
- 行业微调模型（可选）
- RAG检索增强问答
- 自动生成行业规范报告

##### 4. 边缘YOLO检测增强
**目标**：实时性 + 低延迟

**功能点**：
- YOLOv8本地推理 < 50ms
- 多目标检测：火焰/烟雾/裂缝/入侵/车辆
- 自定义检测模型上传
- 检测结果本地存储
- 告警规则引擎

#### 💎 P2 - 体验创新（锦上添花）

##### 5. 多模态交互
**目标**：降低使用门槛，吸引新用户

**功能点**：
- 🎤 语音控制："打开摄像头"、"查询告警"
- 📸 截图提问：截图 + AI分析
- 🔍 以文搜视频："上午10点谁经过仓库？"
- 📢 语音播报：告警语音播报

## Impact

### Affected Code

#### 后端（Go服务）
- 算力盒子管理模块
- 本地存储管理
- OTA升级系统
- 远程运维API

#### AI服务（Python）
- OpenClaw轻量版适配
- YOLO边缘优化
- 本地知识库RAG
- 模型量化压缩

#### 前端
- 一体机管理界面
- 批量设备管理
- 运维监控大屏
- 语音交互组件

### Affected Hardware
- Jetson Nano/Xavier NX/AGX Xavier
- 边缘存储方案
- 网络模块（4G/5G）

## ADDED Requirements

### Requirement: 算力盒子管理系统

The system SHALL provide a unified management platform for edge AI boxes.

#### Scenario: 批量添加设备
- **WHEN** admin adds a new AI box
- **THEN** system automatically discovers and registers the device

#### Scenario: 远程监控
- **WHEN** device health degrades
- **THEN** system shows real-time status and alerts

#### Scenario: OTA升级
- **WHEN** new firmware is available
- **THEN** system automatically pushes upgrade during off-peak hours

### Requirement: 本地AI Agent

The system SHALL provide OpenClaw AI capabilities running entirely on edge devices.

#### Scenario: 离线问答
- **WHEN** network is unavailable
- **THEN** AI assistant still responds to queries using local knowledge base

#### Scenario: 隐私保护
- **WHEN** sensitive data is processed
- **THEN** all AI analysis happens locally without transmitting data to cloud

### Requirement: 开箱即用部署

The system SHALL support zero-configuration deployment for non-technical users.

#### Scenario: 快速部署
- **WHEN** user unboxes the device
- **THEN** device automatically boots, connects to network, and displays activation QR code

#### Scenario: 自动摄像头发现
- **WHEN** cameras are connected
- **THEN** system automatically detects and lists available streams

## MODIFIED Requirements

无

## REMOVED Requirements

无

## Phase Plan

### Phase 1: MVP（3个月） - 本地AI Agent + 标准版一体机
**目标**：验证核心价值，发布首款产品

**交付物**：
- ✅ Jetson Xavier NX标准版一体机
- ✅ 本地OpenClaw Agent（基础对话+告警分析）
- ✅ YOLOv8边缘检测（火焰/烟雾/入侵）
- ✅ 基础管理平台（设备注册/监控/OTA）

**技术验证点**：
- OpenClaw在ARM64上的性能
- YOLO边缘推理延迟
- 本地知识库RAG效果
- 离线可用性

### Phase 2: 产品化（3个月） - 全产品线 + 私有知识库
**目标**：完善产品矩阵，拓展行业客户

**交付物**：
- 🔲 Jetson Nano轻量版
- 🔲 Jetson AGX专业版
- 🔲 私有知识库系统
- 🔲 行业报告生成器

### Phase 3: 生态（6个月） - 多模态 + 行业深耕
**目标**：构建生态壁垒，提升客单价

**交付物**：
- 🔲 语音交互系统
- 🔲 行业专用模型（矿山/化工/电力）
- 🔲 开放API（合作伙伴集成）
- 🔲 云边协同平台

## Technical Challenges

### 1. OpenClaw ARM64适配
**挑战**：OpenClaw原本为x86_64设计，需要适配ARM64
**方案**：
- 使用Docker ARM64镜像
- 模型量化（FP16/INT8）
- 依赖库交叉编译

### 2. YOLO边缘性能优化
**挑战**：Jetson算力有限，需要优化推理性能
**方案**：
- TensorRT加速
- 模型量化（INT8）
- 批处理优化
- 流处理管道优化

### 3. 本地知识库RAG
**挑战**：向量数据库在边缘的性能
**方案**：
- 使用轻量级向量数据库（Chroma/Qdrant Lite）
- 知识库分片
- 定期同步更新

### 4. OTA升级可靠性
**挑战**：边缘设备分布广泛，升级失败风险
**方案**：
- 分批灰度升级
- 升级前自动备份
- 失败自动回滚
- 断点续传

## 竞品差异化总结

| 维度 | 海康威视 | 大华 | 巡检宝 |
|------|---------|------|--------|
| **定位** | 大型项目 | 中大型项目 | **中小企业 + 边缘场景** |
| **AI能力** | 云端为主 | 云端+边缘 | **本地AI Agent（核心差异）** |
| **数据隐私** | 云端存储 | 云端存储 | ✅ **本地处理，完全隐私** |
| **部署方式** | 集成商部署 | 集成商部署 | ✅ **开箱即用，一键部署** |
| **离线能力** | ❌ 必须联网 | ❌ 必须联网 | ✅ **离线可用** |
| **成本** | ¥50万+ | ¥30万+ | ✅ **¥7999起** |
| **目标场景** | 政府/大型企业 | 政府/大型企业 | **矿山/化工/中小企业/野外** |

## Next Steps

1. **技术验证**（1-2周）
   - 在Jetson Xavier NX上部署OpenClaw
   - 测试YOLOv8推理性能
   - 验证本地RAG可行性

2. **产品定义**（1周）
   - 明确MVP功能范围
   - 确定定价策略
   - 制定推广计划

3. **原型开发**（2-3个月）
   - 开发标准版一体机
   - 实现核心功能
   - 内部测试+小规模试点

4. **市场验证**（1-2个月）
   - 寻找种子客户
   - 收集反馈
   - 迭代优化

5. **正式发布**（1个月）
   - 产品发布会
   - 渠道建设
   - 营销推广

---

**作者**：巡检宝产品团队
**创建日期**：2026-04-02
**版本**：v1.0.0
