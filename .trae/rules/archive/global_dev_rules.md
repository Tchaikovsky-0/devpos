# 全局开发规则 - Trae AI 开发约束

> **强制规则，所有开发任务必须遵循**

---

## 一、核心方法论

### 1.1 TDD 测试驱动开发

**红绿重构循环**：
```
写测试(Red) → 测试失败 → 写代码(Green) → 测试通过 → 重构(Refactor) → 改进代码
```

**TDD 三定律**：
1. 在编写能够通过的单元测试前，不可编写生产代码
2. 只可编写刚好无法通过的单元测试（编译失败不算）
3. 只可编写刚好让当前测试通过的生产代码

**测试分层**：
- 单元测试 60-70%：核心业务逻辑验证
- 集成测试 20-30%：模块间协作验证
- E2E测试 5-10%：关键用户路径验证

**适用场景**：
- ✅ 必须：核心业务逻辑、新功能开发、Bug修复、复杂算法
- ⚠️ 可选：简单CRUD、紧急hotfix
- ❌ 不用：原型探索/实验

### 1.2 Plan 模式

> **⚠️ Agent 开发注意事项**
> 
> 当涉及多 Agent 协作开发时，必须遵循 [Agent开发统一规范](./agent_development_rules.md)：
> - 使用统一的消息格式通信
> - 遵循标准化的任务交接协议
> - 使用代码生成模板
> - 规范化错误报告

**触发条件**：
- ✅ 必须进入：新功能开发（多文件/多模块）、架构重构、数据库Schema变更、多服务协同、技术选型评估
- ❌ 可跳过：简单变量修改、单行Bug修复、代码格式调整、注释/文档更新

**执行流程**：
1. 探索：理解现有代码结构，识别相关函数和模式
2. 设计：制定详细实现方案，评估风险和备选方案
3. 审查：与用户确认方案，澄清疑问
4. 实施：按步骤执行，验证每步结果

**Plan文档格式**：
```markdown
# Plan: [功能名称]
## Context - 为什么需要这个功能
## 目标 (SMART原则)
## 实现步骤 - 涉及文件、操作类型、详细改动、验证方式
## 风险评估 - 可能性、影响、应对策略
## 验证清单
```

---

## 二、代码质量规范

### 2.1 SOLID 原则

| 原则 | 核心概念 | 实践检验 |
|------|----------|----------|
| S | 单一职责 | 类是否只有一个变更理由？ |
| O | 开闭原则 | 扩展是否通过新增而非修改实现？ |
| L | 里氏替换 | 子类是否能替换父类而不破坏程序？ |
| I | 接口隔离 | 接口是否保持精简？ |
| D | 依赖反转 | 是否依赖抽象而非具体？ |

### 2.2 TypeScript 规范

**类型约束**：
- ❌ 禁止使用 `any`，必须使用 `unknown`
- ✅ 函数返回值必须标注（除 void）
- ✅ 简单对象用 `interface`，复杂类型用 `type`
- ✅ 泛型嵌套不超过 2 层
- ✅ 优先使用类型守卫

**示例**：
```typescript
// ✅ 正确
interface User {
  readonly id: string;
  name: string;
  email: string;
}

const parseJSON = (json: string): unknown => JSON.parse(json);

// ❌ 错误
const forbidden = (data: any): any => { ... };
```

### 2.3 组件规范

**设计原则**：
- 单一职责：组件只做一件事
- 高内聚：相关逻辑放在一起
- 低耦合：减少对外部依赖
- 可测试：逻辑可单独测试
- 可复用：通过 props 适配不同场景

**示例**：
```tsx
// ✅ 正确：函数式组件 + 完整 Props 类型
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

### 2.4 命名约定

| 类别 | 规范 | 示例 | 备注 |
|------|------|------|------|
| 变量 | camelCase | `userName`, `isActive` | 布尔值用 is/has/can 前缀 |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` | 配置类常量 |
| 函数 | camelCase | `getUserById()` | 动词或动词短语 |
| 类/接口/类型 | PascalCase | `UserService` | 名词或名词短语 |
| 组件 | PascalCase | `UserProfile.tsx` | 文件名与导出名一致 |
| 事件处理 | handle + 动作 | `handleClick()` | 统一前缀 |
| React Hooks | use + 动作 | `useDebounce()` | Hooks 规范 |
| 数据库表 | snake_case | `user_accounts` | 关系型数据库 |
| API 端点 | kebab-case | `/user-profiles` | RESTful 风格 |

---

## 三、禁止事项

```yaml
❌ 绝对禁止:
  - 使用 any 类型
  - 跳过 TDD 流程（核心业务逻辑）
  - 不写 Plan 直接开发（多模块功能）
  - 类组件（除非有特殊需求）
  - 隐式 JOIN
  - SELECT * 查询
  - 硬编码敏感信息
  - 循环内查询数据库
  - 忽略错误处理
  - 多Agent协作时不遵循通信协议（详见 agent_development_rules.md）
  - Agent产生幻觉：编造不存在的API、不确定的信息、技术细节（详见 anti_hallucination_rules.md）
```

## 三.1 AI 幻觉防控规则 ⭐

> **背景**: AI幻觉是指模型产生看似合理但实际上不正确、不存在或无法验证的信息。就像考试时遇到不会的题瞎写，不如写"我不会"。

### 核心原则

```yaml
✅ 必须遵守:
  - 当信息不确定时，明确说"不确定"或"需要验证"
  - 引用代码时，必须先读取实际文件
  - 描述API时，必须基于实际代码或文档
  - 技术细节必须可验证、可追溯

❌ 严格禁止:
  - 凭空捏造文件路径、函数名、变量名
  - 声称某API存在但未经确认
  - 描述不存在的配置项或参数
  - 在不确定时给出"应该是这样"的肯定语气
```

### 验证检查清单

**每次回复前必须自检**：

```yaml
当提供以下信息时，必须验证:
  □ 文件路径 → 必须读取文件确认存在
  □ 函数名/方法名 → 必须搜索代码库确认
  □ API端点 → 必须查看路由定义或文档
  □ 配置项 → 必须查看配置文件或文档
  □ 技术参数 → 必须基于实际代码或官方文档
  □ 版本号 → 必须基于实际依赖或文档

当遇到以下情况时，必须明确说明:
  □ 信息来源不明 → "我无法确认这个信息，需要查看源码"
  □ 多个可能 → "可能是A或B，建议验证"
  □ 超出知识范围 → "这个问题超出我的知识范围，建议查询官方文档"
  □ 时间相关 → "这个信息基于当前代码库，时间点为[具体时间]"
```

### 实践指南

**场景1: 描述代码结构**
```yaml
# ❌ 错误示范 (幻觉)
这个函数在 utils/auth.ts 中，它接受一个 token 参数...

# ✅ 正确示范
让我先读取相关文件...
[读取文件后]
根据 src/utils/auth.ts:23，authenticate 函数接受 token 参数...
```

**场景2: 描述API端点**
```yaml
# ❌ 错误示范 (幻觉)
应该有一个 /api/users 的 GET 端点...

# ✅ 正确示范
让我检查路由配置...
[搜索路由后]
在 routes/api.ts:45 找到了 GET /api/users 端点...
```

**场景3: 不确定时**
```yaml
# ❌ 错误示范 (幻觉)
这应该使用 bcrypt 加密...

# ✅ 正确示范
我需要查看密码相关的代码...
[检查后发现使用argon2]
实际上项目使用 argon2 进行密码加密（在 utils/password.ts 中定义）...
```

**场景4: 超出知识范围**
```yaml
# ❌ 错误示范 (幻觉)
这个问题可以用最新的React 19的useTransition解决...

# ✅ 正确示范
这个问题我无法确定最优解决方案。建议:
  1. 查看 React 官方文档
  2. 参考项目其他类似场景的处理方式
  3. 进行技术调研后决定
```

## 四、相关规范索引

> **重要：以下规范与本规则配合使用**

| 规范 | 说明 | 优先级 |
|------|------|--------|
| [Agent开发统一规范](./agent_development_rules.md) | Agent通信协议、代码模板、工作流程 | P0 |
| [AI 幻觉防控规则](./anti_hallucination_rules.md) | 防止Agent胡说八道、确保信息准确 | P0 |
| [项目规则](./project_rules.md) | 项目架构、模块优先级、团队协作 | P0 |
| [技能调度规则](./skill_dispatch_rules.md) | 智能任务分析、技能精准调用 | P0 |

---

**最后更新**: 2026年4月
