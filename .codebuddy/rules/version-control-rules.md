---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:45:19.704Z
provider: 
---

# 巡检宝项目 - 版本管理规范

> **核心原则**: 语义化版本 + Git Flow 工作流

---

## 一、版本号规范

### 语义化版本

```
格式: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

示例:
  v1.0.0        正式版本
  v1.1.0        新功能版本
  v1.1.1        Bug修复版本
  v2.0.0        重大更新版本
  v1.2.0-beta.1 测试版本
  v1.2.0-rc.1   候选版本
```

### 递增规则

| 类型 | 规则 | 示例 | 说明 |
|------|------|------|------|
| MAJOR | 不兼容API变更 | 1.0.0→2.0.0 | 重大升级 |
| MINOR | 向后兼容功能新增 | 1.0.0→1.1.0 | 新功能 |
| PATCH | 向后兼容问题修复 | 1.0.0→1.0.1 | Bug修复 |

### 预发布版本

```yaml
alpha: 内部测试版本，功能不完整
beta:  公开测试版本，功能基本完整
rc:    Release Candidate，候选发布版本

示例: v1.0.0-alpha.1, v1.0.0-beta.1, v1.0.0-rc.1
```

---

## 二、Git分支管理

### 分支策略

```
master ─────●─────●─────●─────●─────●─────
            │           │           │
tag ───────v1.0──────v1.1──────v2.0──────
            │           │           │
develop ────●─────●─────●─────●─────●─────
            │     │     │     │
feature ────●─────●     │     │
            │           │     │
release ────└───────────●─────●
                        │
hotfix ────────────────└───────────●
```

### 分支类型

| 分支 | 命名 | 用途 | 生命周期 |
|------|------|------|---------|
| master/main | master | 生产环境 | 永久 |
| develop | develop | 开发主分支 | 永久 |
| feature | feature/功能名称 | 新功能开发 | 临时 |
| release | release/v版本号 | 发布准备 | 临时 |
| hotfix | hotfix/v版本号 | 紧急修复 | 临时 |

### 分支命名示例

```bash
feature/user-authentication
feature/yolo-detection
release/v1.0.0
hotfix/v1.0.1
```

---

## 三、Commit消息规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

| Type | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat: add user authentication |
| fix | Bug修复 | fix: resolve memory leak |
| docs | 文档更新 | docs: update API documentation |
| refactor | 重构 | refactor: optimize queries |
| perf | 性能优化 | perf: improve video loading |
| test | 测试 | test: add unit tests |
| chore | 构建/工具 | chore: update dependencies |

### Scope范围

```
前端: api, components, routes, store, utils
后端: handler, service, repository, model, middleware
AI: yolo, openclaw, detection
```

### 示例

```bash
# 新功能
feat(api): add stream management API
- Add GET /api/v1/streams endpoint
- Add POST /api/v1/streams endpoint

# Bug修复
fix(video): resolve video player memory leak
Closes #123

# 性能优化
perf(yolo): improve detection speed by 30%
- Use GPU acceleration
- Optimize image preprocessing
```

### 最佳实践

```yaml
✅ 使用现在时态: "add feature" 而不是 "added feature"
✅ 首字母小写: "add feature" 而不是 "Add feature"
✅ 结尾不加句号: "add feature" 而不是 "add feature."
✅ 简洁明了: 主题行不超过50字符
✅ 关联Issue: 使用 "Closes #123" 或 "Fixes #456"
```

---

## 四、发布流程

### 发布前检查

```yaml
代码质量:
  ✅ 所有测试通过
  ✅ 代码审查完成
  ✅ Lint检查通过
  ✅ 无安全漏洞

文档更新:
  ✅ CHANGELOG.md已更新
  ✅ API文档已更新
  ✅ README.md已更新

版本信息:
  ✅ 版本号已更新
  ✅ Git标签已创建
  ✅ Docker镜像已构建
```

### 发布步骤

```bash
# 1. 创建发布分支
git checkout develop && git pull
git checkout -b release/v1.0.0

# 2. 更新版本号
cd app && npm version 1.0.0

# 3. 更新CHANGELOG
# 添加版本更新日志

# 4. 提交版本更新
git add . && git commit -m "chore: bump version to 1.0.0"

# 5. 合并到master
git checkout master
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"

# 6. 合并回develop
git checkout develop
git merge --no-ff release/v1.0.0

# 7. 推送
git push origin master develop v1.0.0

# 8. 删除发布分支
git branch -d release/v1.0.0
```

### 热修复流程

```bash
# 1. 创建热修复分支
git checkout master
git checkout -b hotfix/v1.0.1

# 2. 修复Bug
git commit -m "fix: resolve critical security vulnerability"

# 3. 更新版本号
npm version 1.0.1

# 4. 合并到master和develop
git checkout master && git merge --no-ff hotfix/v1.0.1
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git checkout develop && git merge --no-ff hotfix/v1.0.1

# 5. 推送
git push origin master develop v1.0.1
```

---

## 五、Git标签管理

### 标签操作

```bash
# 创建附注标签（推荐）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0

# 查看标签
git tag -l
git show v1.0.0
```

---

## 六、最佳实践

### 提交频率

```yaml
✅ 小步提交: 每个逻辑变更一个commit
✅ 频繁提交: 每天至少提交一次
✅ 原子提交: 每个commit都能独立运行
❌ 巨型提交: 避免一次提交大量不相关变更
```

### 分支管理

```yaml
✅ 及时合并: 功能分支完成后尽快合并
✅ 保持更新: 定期从develop拉取更新
✅ 清理分支: 合并后及时删除临时分支
❌ 长期分支: 避免长期存在的功能分支
```

### 代码审查

```yaml
✅ 强制审查: 所有代码变更必须经过审查
✅ 及时审查: 审查请求应在24小时内处理
✅ 建设性反馈: 提供具体、有用的反馈
❌ 草率审查: 避免快速批准而不仔细检查
```

---

## 七、常见问题

### Q1: 如何处理多个功能同时开发？

```bash
# 为每个功能创建独立分支
git checkout develop
git checkout -b feature/user-auth
git checkout -b feature/yolo-detection
# 分别开发和测试，完成后分别合并
```

### Q2: 如何处理发布后发现的问题？

```bash
# 小问题：在develop修复，下次发布
git checkout develop && git checkout -b fix/minor-issue

# 紧急问题：使用hotfix
git checkout master && git checkout -b hotfix/v1.0.1
```

### Q3: 如何处理冲突？

```bash
git checkout develop && git pull
git checkout feature/my-feature
git merge develop
# 编辑冲突文件解决冲突
git add . && git commit -m "chore: resolve merge conflicts"
```

---

## 八、禁止事项

```yaml
❌ 绝对禁止:
  - 直接在master上提交代码
  - 强制推送到共享分支
  - 提交敏感信息到Git
  - 不写commit message
  - 删除远程master分支
```

---

**最后更新**: 2026年4月