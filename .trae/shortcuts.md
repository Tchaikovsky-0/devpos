# 巡检宝 - 快捷指令配置

> 本文档定义了所有 Agent 的快捷调用指令

---

## 一、Agent 快捷指令

### 项目管理层

| 指令 | Agent | 用途 |
|------|-------|------|
| `/lead` | Project Lead | 项目总负责人 |
| `/pm` | Project Lead | 项目管理 |
| `/project` | Project Lead | 项目相关 |

### 前端团队

| 指令 | Agent | 用途 |
|------|-------|------|
| `/fe-lead` | Frontend Lead | 前端架构师 |
| `/frontend-arch` | Frontend Lead | 前端架构设计 |
| `/fe` | Frontend Dev | 前端开发 |
| `/frontend` | Frontend Dev | 前端开发任务 |

### 后端团队

| 指令 | Agent | 用途 |
|------|-------|------|
| `/be-lead` | Backend Lead | 后端架构师 |
| `/backend-arch` | Backend Lead | 后端架构设计 |
| `/be` | Backend Dev | 后端开发 |
| `/backend` | Backend Dev | 后端开发任务 |

### AI团队

| 指令 | Agent | 用途 |
|------|-------|------|
| `/ai-lead` | AI Lead | AI技术负责人 |
| `/ai-arch` | AI Lead | AI架构设计 |
| `/openclaw` | OpenClaw Eng | OpenClaw工程师 |
| `/agent` | OpenClaw Eng | Agent开发 |

### 运维&测试

| 指令 | Agent | 用途 |
|------|-------|------|
| `/devops` | DevOps Eng | DevOps工程师 |
| `/deploy` | DevOps Eng | 部署相关 |
| `/qa` | QA Lead | 测试负责人 |
| `/test` | QA Lead | 测试相关 |

---

## 二、功能快捷指令

### 开发流程

| 指令 | 用途 | 示例 |
|------|------|------|
| `/plan` | 进入计划模式 | `/plan 设计用户认证模块` |
| `/tdd` | TDD开发流程 | `/tdd 实现登录API` |
| `/review` | 代码审查 | `/review 检查这个PR` |

### 模块开发

| 指令 | 用途 | 自动分配 |
|------|------|----------|
| `/dashboard` | 数据大屏开发 | Frontend Dev |
| `/alert` | 告警模块开发 | Backend Dev |
| `/media` | 媒体库开发 | Backend Dev |
| `/stream` | 视频流模块 | Backend Dev |
| `/detect` | 检测功能 | AI Lead |
| `/report` | 报告功能 | OpenClaw Eng |

### 质量保障

| 指令 | 用途 | 自动分配 |
|------|------|----------|
| `/bug` | Bug报告 | QA Lead |
| `/test-case` | 测试用例 | QA Lead |
| `/perf` | 性能测试 | QA Lead |
| `/security` | 安全检查 | DevOps Eng |

---

## 三、@ 提及方式

### 直接提及

```
@project-lead     # 项目总负责人
@frontend-lead    # 前端架构师
@frontend-dev     # 前端开发
@backend-lead     # 后端架构师
@backend-dev      # 后端开发
@ai-lead          # AI技术负责人
@openclaw-eng     # OpenClaw工程师
@devops-eng       # DevOps工程师
@qa-lead          # 测试负责人
```

### 使用示例

```
@frontend-lead 这个组件的设计是否合理？
@backend-lead 帮我设计用户认证的API
@ai-lead YOLO检测准确率如何提升？
@devops-eng Docker部署配置有问题
@qa-lead 帮我设计登录模块的测试用例
```

---

## 四、组合指令

### 多Agent协作

```
# 前后端联调
/fe + /be 实现用户登录功能

# 架构评审
/lead + /fe-lead + /be-lead 评审系统架构

# 功能开发全流程
/plan → /be → /fe → /qa 开发告警模块
```

### 任务流转

```
# 需求 → 设计 → 开发 → 测试
/lead 分析需求
  ↓
/be-lead 设计API
  ↓
/be 实现API
  ↓
/fe 实现界面
  ↓
/qa 测试验证
```

---

## 五、自动触发规则

当用户输入包含以下关键词时，自动分配对应Agent：

| 关键词 | 自动分配Agent |
|--------|---------------|
| 前端、React、组件、页面、UI、样式、Tailwind | `frontend-dev` |
| 后端、API、接口、数据库、Go、Gin、PostgreSQL | `backend-dev` |
| AI、YOLO、检测、模型、OpenClaw、智能 | `ai-lead` |
| 部署、Docker、CI、CD、环境、监控、K8s | `devops-eng` |
| 测试、Bug、质量、QA、用例、覆盖率 | `qa-lead` |
| 架构、设计、规划、协调、决策 | `project-lead` |

---

## 六、常用场景速查

### 新功能开发

```
1. /plan 设计xxx功能
2. /be-lead 设计API
3. /be 实现后端
4. /fe-lead 设计组件
5. /fe 实现前端
6. /qa 编写测试
```

### Bug修复

```
1. /bug 描述问题
2. /qa 分析原因
3. /fe 或 /be 修复
4. /qa 验证修复
```

### 架构调整

```
1. /lead 发起架构讨论
2. 相关lead参与评审
3. /plan 制定重构计划
4. 分配执行
```

---

**最后更新**: 2026年4月
