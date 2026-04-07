# 规则文件优化方案

> **优化日期**: 2026-04-04
> **目标**: 精简规则、提升可维护性、保持功能完整

---

## 📊 当前状态分析

### 问题
1. **规则过多**: 26个规则文件，管理困难
2. **内容重复**: 某些规则之间有重叠内容
3. **结构混乱**: 缺乏清晰的分类和组织
4. **维护困难**: 更新时需要修改多个文件

### 优化目标
- **减少文件数量**: 从26个减少到12-15个
- **提升可读性**: 每个规则文件职责单一
- **便于维护**: 模块化管理，逻辑清晰
- **保持完整**: 不丢失任何功能

---

## 🎯 优化方案

### 1️⃣ 合并前端规则 (3 → 1)

**源文件**:
- `frontend_dev_debug_rules.md` (12K)
- `frontend_performance_rules.md` (8K)
- `frontend_stability_rules.md` (16K)

**目标文件**:
- `frontend_comprehensive_rules.md` (约36K)

**合并内容**:
- 调试技巧
- 性能优化
- 稳定性保障
- 最佳实践

---

### 2️⃣ 合并AI规则 (2 → 1)

**源文件**:
- `ai_detection_rules.md` (8K)
- `anti_hallucination_rules.md` (12K)

**目标文件**:
- `ai_intelligence_rules.md` (约20K)

**合并内容**:
- YOLO检测规则
- AI幻觉防范
- 智能推理规范
- 知识库管理

---

### 3️⃣ 合并通用开发规则 (4 → 1)

**源文件**:
- `global_dev_rules.md` (8K)
- `debugging_rules.md` (4K)
- `testing_refactoring_rules.md` (4K)
- `documentation_rules.md` (4K)

**目标文件**:
- `development_essentials.md` (约20K)

**合并内容**:
- 通用开发规范
- 调试方法论
- 测试与重构
- 文档编写规范

---

### 4️⃣ 保留核心规则 (12个)

**保留文件**:
1. `CORE_RULES.md` - 核心规则
2. `project_rules.md` - 项目规则
3. `security_rules.md` - 安全规则
4. `database_rules.md` - 数据库规则
5. `video_stream_rules.md` - 视频流规则
6. `monitor_rules.md` - 监控规则
7. `performance_optimization_rules.md` - 性能优化
8. `version_control_rules.md` - 版本控制
9. `context_length_management_rules.md` - 上下文管理
10. `code_review_rules.md` - 代码审查
11. `alert_rules.md` - 告警规则
12. `agent_development_rules.md` - Agent开发
13. `skill_dispatch_rules.md` - 技能分发

---

### 5️⃣ 归档文件

**移至 archive/ 目录**:
- `CHANGELOG_2026-04-02.md`
- `CHANGELOG_2026-04-02_v2.md`
- `AGENT_INTEGRATION_SUMMARY.md`
- `AGENT_QUICK_REFERENCE.md`

---

## 📁 优化后的规则结构

```
.trae/rules/
├── 核心规则/
│   ├── CORE_RULES.md              # 核心规则 (保留)
│   ├── project_rules.md           # 项目规则 (保留)
│   └── security_rules.md          # 安全规则 (保留)
│
├── 开发规范/
│   ├── development_essentials.md   # 通用开发规范 (新建)
│   ├── version_control_rules.md   # 版本控制 (保留)
│   └── code_review_rules.md       # 代码审查 (保留)
│
├── 专项规则/
│   ├── database_rules.md          # 数据库 (保留)
│   ├── video_stream_rules.md       # 视频流 (保留)
│   ├── ai_intelligence_rules.md    # AI智能 (新建)
│   └── frontend_comprehensive_rules.md  # 前端综合 (新建)
│
├── 质量保障/
│   ├── performance_optimization_rules.md  # 性能优化 (保留)
│   ├── monitor_rules.md            # 监控 (保留)
│   ├── context_length_management_rules.md  # 上下文管理 (保留)
│   └── alert_rules.md              # 告警 (保留)
│
├── Agent规范/
│   ├── agent_development_rules.md  # Agent开发 (保留)
│   └── skill_dispatch_rules.md     # 技能分发 (保留)
│
└── archive/                        # 归档目录
    ├── CHANGELOG_2026-04-02.md
    ├── CHANGELOG_2026-04-02_v2.md
    ├── AGENT_INTEGRATION_SUMMARY.md
    └── AGENT_QUICK_REFERENCE.md
```

---

## ✅ 预期效果

### 文件数量
- **优化前**: 26个文件
- **优化后**: 13个文件
- **减少**: 50%

### 可维护性
- **分类清晰**: 按领域分类
- **职责单一**: 每个文件专注一个领域
- **便于查找**: 命名规范，易于定位

### 功能完整性
- **零丢失**: 所有功能完整保留
- **逻辑优化**: 内容更连贯
- **引用清晰**: 跨文件引用关系明确

---

## 🚀 实施步骤

1. [ ] 创建合并后的新规则文件
2. [ ] 验证合并内容完整性
3. [ ] 更新项目主规则引用
4. [ ] 创建归档目录
5. [ ] 移动归档文件
6. [ ] 删除旧文件
7. [ ] 生成优化报告
8. [ ] 验证所有Agent配置

---

**方案制定时间**: 2026-04-04
