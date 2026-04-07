# 左侧边栏扁平化重构规范

## Why
当前左侧边栏模块过多（20个），且分组设计增加了用户的认知负担。用户希望通过扁平化设计，精简模块数量，提升导航效率。

## What Changes
- 移除导航分组设计（核心业务区、功能整合区等分组标题）
- 精简导航模块数量，从20个减少到10-12个核心模块
- 优化模块排列顺序，按使用频率和重要性排序
- 保留核心功能模块的视觉标识（徽章、星标等）
- **BREAKING**: 删除冗余和低频使用的导航项

## Impact
- Affected specs: 
  - redesign-ui-minimalist (导航组件重构部分)
- Affected code: 
  - `/app/src/components/layout/AppSidebar.tsx` - 导航配置和渲染逻辑
  - `/app/src/router.tsx` - 路由配置（可能需要调整）

## ADDED Requirements

### Requirement: 扁平化导航设计
系统 SHALL 提供扁平化的左侧导航栏，不使用分组标题或分隔符对模块进行分组。

#### Scenario: 用户查看导航栏
- **WHEN** 用户打开应用查看左侧导航栏
- **THEN** 看到的是扁平排列的导航项，没有分组标题
- **AND** 导航项按优先级和使用频率排列
- **AND** 核心功能模块有明显的视觉标识

### Requirement: 精简导航模块
系统 SHALL 只保留核心和高频使用的导航模块，删除冗余和低频模块。

#### Scenario: 导航模块数量
- **WHEN** 用户查看导航栏
- **THEN** 导航项总数不超过12个
- **AND** 每个导航项都有明确的功能定位
- **AND** 没有功能重叠的导航项

### Requirement: 导航项优先级排序
系统 SHALL 按照使用频率和功能重要性对导航项进行排序。

#### Scenario: 导航项排列顺序
- **WHEN** 用户查看导航栏
- **THEN** 最常用的功能排在最前面
- **AND** 核心业务功能优先于管理功能
- **AND** 相关功能项保持相邻

## MODIFIED Requirements

### Requirement: 导航项配置
原有的分组配置（divider、section字段）将被移除，导航项配置简化为：
```typescript
type NavItem = {
  id: string;
  name: string;
  icon: LucideIcon;
  path?: string;
  badge?: number;
  core?: boolean;
  priority?: number; // 新增：优先级字段，用于排序
}
```

## REMOVED Requirements

### Requirement: 导航分组显示
**Reason**: 用户不希望对模块进行分组，扁平化设计更符合用户习惯。
**Migration**: 移除所有 divider 类型的导航项，移除 section 字段配置。

### Requirement: 冗余导航项
**Reason**: 以下导航项功能重叠或使用频率低，将被合并或删除：
- AI 对话、智能分析、报告中心、知识库 → 合并为"AI 助手"
- 视频设备、设备状态 → 合并为"设备管理"
- 工作流、定时任务 → 合并为"任务中心"
- 统计看板、地图视图、运维报表 → 合并为"数据中心"
- 用户管理、权限管理、租户管理、系统设置 → 合并为"系统管理"

**Migration**: 合并后的模块内部通过子页面或标签页展示详细功能。
