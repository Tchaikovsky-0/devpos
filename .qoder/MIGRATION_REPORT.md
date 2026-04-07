# 技能库迁移报告

> 从 `.trae/skills` 迁移到 `.qoder/skills`

## 迁移概览

| 项目 | 数量 |
|------|------|
| 源技能总数 | 68 |
| 已迁移技能 | 28 |
| 迁移规则 | 23 |
| Agent配置 | 28 |

## 已迁移技能列表

### 核心技能 (4个)
✅ global-dev
✅ project-dev
✅ xunjianbao-dev
✅ skill-dispatcher

### Lead层 (5个)
✅ project-lead
✅ frontend-lead
✅ backend-lead
✅ ai-lead
✅ qa-lead

### Dev层 (4个)
✅ frontend-dev
✅ backend-dev
✅ openclaw-eng
✅ devops-eng

### 实用技能 (12个)
✅ context-manager
✅ debugging
✅ documentation
✅ error-diagnostician
✅ frontend-stability
✅ inspector
✅ open-source-fetcher
✅ performance-optimization
✅ refactor
✅ test-strategy
✅ monitor
✅ rollback

### 增强技能 (3个)
✅ agent-max-power
✅ agent-creativity-master
✅ agent-lifecycle-guardian

## 待迁移技能 (40个)

以下技能位于 `.trae/skills`，尚未迁移到 `.qoder/skills`：

### 腾讯生态技能
- apple-notes
- browser-use
- canvas-design
- cloudbase
- content-factory
- content-repurposer
- cos-vectors
- find-skills-cn
- frontend-dev-cn
- fullstack-dev
- gifgrep
- github-cn
- github-trending-cn
- humanizer
- ima-skills
- lark-unified
- market-researcher
- mcp-builder
- mcporter
- minimax-pdf
- multi-search-engine
- nano-pdf
- obsidian-cn
- peekaboo
- react-native-dev
- self-improvement
- shader-dev
- skill-creator-cn
- skill-scanner
- tdesign-miniprogram
- tencent-docs
- tencent-news
- tencent-survey
- tencentcloud-cos
- video-frames
- workbuddy-channel-setup
- xiaohongshu

## 配置文件

| 文件 | 状态 |
|------|------|
| `.qoder/agents.json` | ✅ 已创建 |
| `.qoder/SKILLS_INDEX.md` | ✅ 已创建 |
| `.qoder/rules/` | ✅ 23个规则已复制 |
| `.qoder/settings.local.json` | ✅ 已存在 |

## 使用方式

### 1. 斜杠命令
在 Qoder 中输入斜杠命令即可调用对应技能，例如：
- `/global-dev` - 启动全局开发模式
- `/lead` - 调用项目总负责人
- `/dispatch` - 启动技能调度器

### 2. @提及
使用 @技能名 提及特定Agent：
- `@project-lead` - 项目架构决策
- `@frontend-dev` - 前端开发任务
- `@ai-lead` - AI相关讨论

### 3. 自动触发
根据任务关键词自动匹配技能：
- "前端"、"React" → frontend-dev
- "后端"、"API" → backend-dev
- "AI"、"YOLO" → ai-lead

## 下一步建议

1. **按需迁移**: 根据实际需要，从待迁移列表中选择技能继续迁移
2. **测试验证**: 调用各个技能验证是否正常工作
3. **清理旧文件**: 确认迁移完成后，可选择性清理 .trae 目录

---
*迁移完成时间: 2026-04-07*
*迁移工具: Qoder AI*
