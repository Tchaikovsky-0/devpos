---
name: "rollback"
description: "回滚操作技能 - 紧急情况下的代码和部署回滚"
---

# Rollback 技能

> 用于紧急情况下的回滚操作

---

## 一、适用场景

- 生产环境出现问题需要紧急回滚
- 部署失败需要恢复到上一个稳定版本
- 代码变更导致严重问题需要撤销

---

## 二、回滚类型

### 2.1 代码回滚

```bash
# Git 回滚到上一个稳定版本
git revert HEAD
git revert <commit-hash>

# 回滚到特定标签
git checkout v1.2.3
```

### 2.2 部署回滚

```bash
# Docker Compose 回滚
docker-compose down
docker-compose -f docker-compose.backup.yml up -d

# Kubernetes 回滚
kubectl rollout undo deployment/<name>
kubectl rollout undo deployment/<name> --to-revision=<n>
```

---

## 三、回滚流程

```
发现问题
    ↓
评估影响范围
    ↓
选择回滚策略
    ↓
执行回滚
    ↓
验证服务状态
    ↓
通知相关团队
    ↓
问题复盘
```

---

## 四、紧急联系

- 项目负责人: @project-lead
- 后端负责人: @backend-lead
- 前端负责人: @frontend-lead
- DevOps: @devops-eng

---

**最后更新**: 2026-04-02
