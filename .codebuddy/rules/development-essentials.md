---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:46:13.783Z
provider: 
---

# 巡检宝 - 开发必备规范

> **合并版本**: global_dev + debugging + testing_refactoring + documentation
> **版本**: v2.0.0
> **更新日期**: 2026-04-04

---

本文件整合了以下四个规范：
1. `global_dev_rules.md` - 全局开发规则
2. `debugging_rules.md` - 调试方法论
3. `testing_refactoring_rules.md` - 测试与重构
4. `documentation_rules.md` - 文档编写规范

---

## 第一部分：全局开发规则

### 1.1 TDD 测试驱动开发

**红绿重构循环**：
```
写测试(Red) → 测试失败 → 写代码(Green) → 测试通过 → 重构(Refactor)
```

**TDD 三定律**：
1. 在编写能够通过的单元测试前，不可编写生产代码
2. 只可编写刚好无法通过的单元测试
3. 只可编写刚好让当前测试通过的生产代码

**测试分层**：
- 单元测试 60-70%：核心业务逻辑验证
- 集成测试 20-30%：模块间协作验证
- E2E测试 5-10%：关键用户路径验证

### 1.2 Plan 模式

**触发条件**：
- ✅ 必须：多文件/多模块开发、架构重构、数据库变更、多服务协同
- ❌ 可跳过：简单修改、单行Bug修复、格式调整

**执行流程**：
1. 探索：理解现有代码结构
2. 设计：制定实现方案
3. 审查：与用户确认方案
4. 实施：按步骤执行验证

### 1.3 SOLID 原则

| 原则 | 核心概念 | 实践检验 |
|------|----------|----------|
| S | 单一职责 | 类是否只有一个变更理由？ |
| O | 开闭原则 | 扩展是否通过新增而非修改实现？ |
| L | 里氏替换 | 子类是否能替换父类而不破坏程序？ |
| I | 接口隔离 | 接口是否保持精简？ |
| D | 依赖反转 | 是否依赖抽象而非具体？ |

### 1.4 TypeScript 规范

```yaml
类型约束:
  ❌ 禁止: any
  ✅ 必须: unknown（不确定时）
  ✅ 必须: 函数返回值标注
  ✅ 推荐: interface（简单对象）/ type（复杂类型）
```

---

## 第二部分：调试方法论

### 2.1 科学调试流程

```yaml
调试顺序:
  1️⃣ 复现问题 → 找到最小复现步骤
  2️⃣ 收集信息 → 错误日志、环境信息
  3️⃣ 分析假设 → 列出所有可能原因
  4️⃣ 验证排除 → 逐一验证，排除不可能
  5️⃣ 定位根因 → 找到真正的问题
  6️⃣ 修复验证 → 确认修复有效

核心法则:
  ✅ 复现为王: 找不到复现步骤就别想修好
  ✅ 科学方法: 假设-验证-结论
  ✅ 分而治之: 大问题拆成小问题
  ✅ 最小案例: 找到能复现的最小代码
```

### 2.2 问题复现规则

**必须记录的信息**：
```yaml
✅ 问题现象
✅ 复现步骤
✅ 环境信息
✅ 期望行为
✅ 实际行为
```

### 2.3 日志调试技巧

```typescript
// ✅ 结构化日志
console.log({
  event: 'user_login',
  userId: user.id,
  timestamp: new Date().toISOString()
});

// ✅ 分组日志
console.group('API Request');
console.log('URL:', url);
console.log('Method:', method);
console.groupEnd();

// ✅ 计时日志
console.time('api_call');
await fetch(url);
console.timeEnd('api_call');
```

---

## 第三部分：测试与重构

### 3.1 测试金字塔

```yaml
        ┌─────────┐
        │   E2E   │ 少量、慢
        │  Tests  │ 验证完整流程
        └─────────┘
       ┌───────────┐
       │ Integration│ 中等数量
       │  Tests   │ 验证模块协作
       └───────────┘
      ┌─────────────┐
      │   Unit     │ 大量、快速
      │  Tests     │ 测试最小单元
      └─────────────┘

理想比例: 单元70% + 集成20% + E2E10%
```

### 3.2 TDD流程

```yaml
Red: 先写失败的测试
Green: 最快速度让测试通过
Refactor: 重构代码
```

### 3.3 重构安全规则

```yaml
重构前:
  ✅ 编写测试用例覆盖现有功能
  ✅ 制定重构计划，分步骤实施
  ✅ 理解现有代码逻辑

重构中:
  ✅ 每次只做一个小改动
  ✅ 频繁运行测试确保功能不变
  ✅ 保持代码可运行状态

重构后:
  ✅ 所有测试通过
  ✅ 代码更简洁、可读性更好
  ✅ 没有引入新的问题
```

### 3.4 禁止重构清单

```yaml
🚫 重构时禁止:
- 改变已有API的外部行为
- 跳过测试直接提交
- 进行大规模重构不提交
- 忽略测试失败继续重构
```

---

## 第四部分：文档编写规范

### 4.1 文档优先级

```yaml
优先级排序:
  1️⃣ API文档 (如何使用)
  2️⃣ 架构文档 (如何设计)
  3️⃣ 开发指南 (如何开发)
  4️⃣ 运维文档 (如何运维)

核心原则:
  ✅ 代码即文档
  ✅ 文档同步
  ✅ 简洁明了
  ✅ 实用为主
```

### 4.2 API文档规范

```yaml
必须包含:
  ✅ 端点描述
  ✅ 请求参数 (名称、类型、必填、说明)
  ✅ 响应格式 (成功/失败)
  ✅ 使用示例 (cURL、代码)
  ✅ 错误码说明
```

### 4.3 代码注释规范

```typescript
// ✅ 解释为什么，不解释是什么
// 使用JWT而非Session，因为无状态更易扩展
const token = jwt.sign(payload, secret);

// ❌ 解释是什么（代码已经说明）
// 创建一个用户对象
const user = new User();
```

### 4.4 README 规范

```yaml
必须包含:
  ✅ 项目简介（一句话）
  ✅ 快速开始（3步以内）
  ✅ 核心功能列表
  ✅ 环境要求
  ✅ 联系方式
```

---

## 第五部分：Go开发规范

### 5.1 错误处理

```go
// ❌ 错误示例
func getUser(id string) User {
  user, _ := db.Find(id)  // 忽略错误
  return user
}

// ✅ 正确示例
func getUser(id string) (User, error) {
  user, err := db.Find(id)
  if err != nil {
    return User{}, fmt.Errorf("getUser: %w", err)
  }
  return user, nil
}
```

### 5.2 分层架构

```go
// Handler层：处理HTTP请求
func (h *Handler) GetUser(c *gin.Context) {
  id := c.Param("id")
  user, err := h.service.GetUser(id)
  // 处理错误、返回响应
}

// Service层：业务逻辑
func (s *Service) GetUser(id string) (*User, error) {
  // 业务逻辑
  return s.repo.FindByID(id)
}

// Repository层：数据访问
func (r *Repository) FindByID(id string) (*User, error) {
  var user User
  if err := r.db.First(&user, id).Error; err != nil {
    return nil, err
  }
  return &user, nil
}
```

### 5.3 禁止事项

```yaml
🚫 Go开发禁止:
- 循环内数据库查询
- 忽略error返回值
- goroutine泄漏
- 全局变量
- 硬编码配置
```

---

## 第六部分：禁止事项汇总

```yaml
🚫 开发禁止:
- 使用 any 类型 (TS)
- 循环内数据库查询 (Go)
- 忽略 error 返回值 (Go)
- 硬编码敏感信息
- 不写测试直接提交

🚫 调试禁止:
- 不复现就修复
- 不写日志
- 不记录问题

🚫 重构禁止:
- 改变API行为
- 跳过测试
- 大规模重构不提交

🚫 文档禁止:
- 不更新文档
- 文档与代码不一致
- 冗余、无用文档
```

---

## 第七部分：快速参考

### 开发命令
```bash
# Go
go test ./...          # 运行所有测试
go build              # 构建
go vet                # 检查

# 前端
pnpm test             # 运行测试
pnpm lint             # 代码检查
pnpm type-check       # 类型检查
```

### 测试覆盖
```bash
# Go
go test -cover ./...

# 前端
pnpm test --coverage
```

---

## 📚 关联规范

- [CORE_RULES.md](CORE_RULES.md) - 核心规则
- [project_rules.md](project_rules.md) - 项目规则
- [frontend_rules.md](README.md) - 前端规范

---

**最后更新**: 2026-04-04
**版本**: v2.0.0
**合并来源**:
- global_dev_rules.md
- debugging_rules.md
- testing_refactoring_rules.md
- documentation_rules.md