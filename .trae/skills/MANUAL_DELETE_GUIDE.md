# 手动删除冗余技能指南

> **创建日期**: 2026-04-06
> **目的**: 指导手动删除3个已废弃的冗余技能
> **原因**: 由于系统安全限制，无法直接删除.trae目录下的文件

---

## ⚠️ 重要说明

由于系统安全机制保护 `.trae` 目录不被意外修改，需要您手动删除以下3个冗余技能目录。

---

## 📦 待删除的冗余技能

| 技能名称 | 原因 | 替代技能 |
|---------|------|---------|
| `project-dev` | 与`xunjianbao-dev`内容95%重复 | xunjianbao-dev |
| `project-lead` | 与其他lead技能职责重叠 | xunjianbao-dev中的Agent角色 |
| `code-review-expert` | 与`code-review`功能完全重叠 | code-review |

---

## 🗑️ 删除方法

### 方法1: 终端命令删除

打开终端，执行以下命令：

```bash
# 进入项目目录
cd /Volumes/KINGSTON/xunjianbao

# 删除3个冗余技能目录
rm -rf .trae/skills/project-dev
rm -rf .trae/skills/project-lead
rm -rf .trae/skills/code-review-expert

# 验证删除
ls .trae/skills/
```

### 方法2: Finder手动删除

1. 打开 Finder
2. 前往文件夹: `/Volumes/KINGSTON/xunjianbao/.trae/skills/`
3. 删除以下文件夹:
   - `project-dev`
   - `project-lead`
   - `code-review-expert`

### 方法3: VS Code/Trae 删除

1. 在VS Code或Trae中打开项目
2. 展开 `.trae/skills/` 目录
3. 右键点击以下文件夹，选择"删除"或"Move to Trash":
   - `project-dev`
   - `project-lead`
   - `code-review-expert`

---

## ✅ 删除后验证

删除后，可以通过以下方式验证：

```bash
# 查看技能目录
ls -la .trae/skills/ | grep -E "project|code-review-expert"

# 应该没有任何输出，表示已成功删除

# 查看剩余技能数量
ls -1 .trae/skills/ | wc -l
# 应该显示 51 (原来是54)
```

---

## 📊 删除效果

| 指标 | 删除前 | 删除后 | 变化 |
|------|--------|--------|------|
| 技能总数 | 54个 | 51个 | ↓ 3个 |
| 冗余技能 | 3个 | 0个 | ↓ 100% |
| 功能重复 | 存在 | 消除 | ✅ |

---

## 🔄 回滚方法（如果需要）

如果误删或需要恢复，可以从Git历史中恢复：

```bash
# 查看删除操作
git status

# 恢复单个目录
git checkout HEAD -- .trae/skills/project-dev

# 或者恢复所有已删除的技能
git checkout HEAD -- .trae/skills/
```

---

## 📝 相关文档

- [SKILL_CATALOG.md](./SKILL_CATALOG.md) - 技能清单
- [OPTIMIZATION_LOG.md](./OPTIMIZATION_LOG.md) - 优化日志

---

**最后更新**: 2026-04-06
**版本**: v1.0.0
**操作**: 手动删除冗余技能
