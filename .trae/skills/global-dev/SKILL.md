---
name: "global-dev"
description: "Trae IDE 全局开发技能 - TDD + Plan 方法论，专业高效，跨项目通用"
---

# Trae IDE - 全局开发技能

> **强制规则**：所有开发任务必须遵循本技能的 TDD + Plan 方法论。
>
> 本技能基于 `project-dev` 复制而来，适用于所有项目开发场景。

---

## 一、核心理念

### 一句话定位

```
专业高效的开发方法论，通过 TDD 确保代码质量，通过 Plan 模式处理复杂任务，
让开发从"随意编码"升级为"工程化实践"。
```

### 两大支柱

| 支柱 | 说明 |
|------|------|
| **TDD (测试驱动开发)** | 先写测试再写代码，确保功能正确性和可维护性 |
| **Plan (计划模式)** | 复杂任务先规划再执行，避免返工和架构债务 |

### 适用场景

- 任何规模的项目开发
- 新功能开发和 Bug 修复
- 架构设计和重构
- 多 Agent 协作任务

---

## 二、TDD 开发方法论

### 核心原则

**TDD = Test Driven Development（测试驱动开发）**

```
Red (写测试) → Green (写代码) → Refactor (重构)
```

### 适用场景

| 场景 | 是否使用 TDD |
|------|-------------|
| 新功能开发 | ✅ 是 |
| Bug 修复 | ✅ 是 |
| 复杂业务逻辑 | ✅ 是 |
| 简单 CRUD | ⚠️ 可选 |
| 原型探索 | ❌ 否 |

### 执行流程

#### 第一步：写测试（Red）

```typescript
// 前端示例
describe('UserService', () => {
  it('should fetch users with pagination', async () => {
    const result = await UserService.getUsers({ page: 1, pageSize: 20 });
    expect(result.items).toBeDefined();
    expect(result.pagination).toBeDefined();
  });
});
```

```go
// 后端示例
func TestUserService_GetUsers(t *testing.T) {
    svc := NewUserService(mockRepo)
    users, err := svc.GetUsers(context.Background(), 1, 20)
    assert.NoError(t, err)
    assert.NotNil(t, users)
}
```

#### 第二步：运行测试

```bash
# 前端
pnpm test
npm test
yarn test

# 后端
go test -v
python -m pytest
```

#### 第三步：写代码（Green）

- 写出能通过测试的最小代码
- 不要过度设计
- 专注于让当前测试通过

#### 第四步：重构（Refactor）

- 改进代码质量
- 保持测试通过
- 消除重复代码

---

## 三、Plan 模式使用指南

### 何时使用

| 使用 ✅ | 不使用 ❌ |
|--------|-----------|
| 新功能开发（涉及多模块） | 简单 Bug 修复（已知根因） |
| 架构设计或重构 | 单一文件修改 |
| 数据库 schema 变更 | 已知解决方案的日常任务 |
| API 接口设计 | 代码优化（不改变行为） |
| 多 Agent 协作任务 | - |
| 技术方案选型 | - |

### 执行流程

```
1. 触发 Plan 模式
   /plan 或 任务复杂度较高时自动进入

2. 探索代码库 (Phase 1)
   - Launch Explore agent 并行探索
   - 理解现有代码结构和模式
   - 识别可复用的实现

3. 设计方案 (Phase 2)
   - Launch Plan agent 设计实现
   - 考虑多种方案及权衡
   - 确定推荐方案

4. 用户确认 (Phase 3)
   - 展示完整计划
   - 回答用户问题
   - 获取批准

5. 执行实施 (Phase 4)
   - 按计划实施
   - 如需重大变更，重新 Plan
```

### Plan 输出格式

```markdown
# [功能名称] 实现计划

## Context
为什么需要这个功能...

## 方案设计
### 方案 A
优点: ...
缺点: ...

### 方案 B (推荐)
优点: ...
缺点: ...

## 实施步骤
1. [文件] 修改内容
2. [文件] 新增功能
3. ...

## 验证方法
- 测试命令: ...
- 预期结果: ...
```

---

## 四、代码规范

### 通用命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 包/模块 | 小写/小写下划线 | `handler`, `user_service` |
| 类/结构体 | PascalCase | `UserService`, `StreamController` |
| 接口 | -er 结尾 | `UserRepository`, `Detector` |
| 函数/变量 | camelCase/snake_case | `getUser()`, `stream_list` |
| 常量 | PascalCase/UPPER_SNAKE_CASE | `MaxSize`, `API_BASE_URL` |

### 分层架构

```
┌─────────────────────────────────────┐
│  Handler/Controller 层              │  薄：处理请求响应
│  - 参数校验                         │
│  - 调用 Service                     │
│  - 返回响应                         │
├─────────────────────────────────────┤
│  Service 层                         │  厚：业务逻辑
│  - 业务规则                         │
│  - 流程编排                         │
│  - 事务管理                         │
├─────────────────────────────────────┤
│  Repository/DAO 层                  │  数据访问
│  - 数据库操作                       │
│  - 缓存操作                         │
└─────────────────────────────────────┘
```

### 各语言规范

#### Go 规范

```go
// Handler层 - 薄（只处理请求响应）
func (h *UserHandler) GetUser(c *gin.Context) {
    id := c.Param("id")
    user, err := h.userService.GetUserByID(c.Request.Context(), id)
    if err != nil {
        response.Error(c, err)
        return
    }
    response.Success(c, user)
}

// Service层 - 厚（业务逻辑）
func (s *UserService) GetUserByID(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, err
    }
    if user.Status == "disabled" {
        return nil, ErrUserDisabled
    }
    return user, nil
}

// Repository层 - 数据访问
func (r *UserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
    return &user, err
}
```

#### Python 规范

```python
# api/user.py
@router.get("/users/{user_id}")
async def get_user(user_id: str, service: UserService = Depends()):
    user = await service.get_by_id(user_id)
    return {"code": 200, "data": user}

# services/user.py
class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def get_by_id(self, user_id: str) -> User:
        user = await self.repo.find_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user
```

#### React/TypeScript 规范

```typescript
interface UserCardProps {
  user: User
  onClick?: () => void
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false)

  // 2. Effects
  useEffect(() => {}, [])

  // 3. Handlers
  const handleClick = () => onClick?.()

  // 4. Render
  return <div onClick={handleClick}>{user.name}</div>
}
```

---

## 五、禁止事项

### 通用禁止

```
❌ 循环内数据库查询（N+1问题）
❌ 忽略错误返回值
❌ 硬编码敏感信息（密钥、密码）
❌ 日志输出敏感信息
❌ SQL字符串拼接（SQL注入风险）
```

### Go 禁止

```
❌ goroutine泄漏
❌ 忽略error返回值
❌ 循环内数据库查询
```

### Python 禁止

```
❌ 全局变量存储状态
❌ 阻塞主线程
❌ 未关闭文件句柄
```

### 前端禁止

```
❌ 使用 any 类型（TypeScript）
❌ 硬编码API地址
❌ 直接操作 DOM（使用框架 API）
```

---

## 六、质量标准

### 通用标准

| 指标 | 要求 |
|------|------|
| 测试覆盖率 | > 70% |
| 代码审查 | 必须通过 |
| 文档更新 | 接口变更必须更新文档 |

### Go 服务

| 指标 | 要求 |
|------|------|
| go vet | 通过 |
| golangci-lint | 通过 |
| API响应 P95 | < 200ms |

### Python 服务

| 指标 | 要求 |
|------|------|
| black | 格式化 |
| mypy | 类型检查通过 |
| 单测覆盖率 | > 70% |

### 前端

| 指标 | 要求 |
|------|------|
| TypeScript | 无错误 |
| ESLint | 通过 |
| 首屏加载 | < 3秒 |

---

## 七、API 规范

### URL 设计

```
GET    /api/v1/resources              # 获取列表
POST   /api/v1/resources              # 创建
GET    /api/v1/resources/:id          # 获取单个
PUT    /api/v1/resources/:id          # 更新（全量）
PATCH  /api/v1/resources/:id          # 更新（部分）
DELETE /api/v1/resources/:id          # 删除

# 嵌套资源
GET    /api/v1/resources/:id/sub-resources
POST   /api/v1/resources/:id/actions  # 动作
```

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 200 | 200 | 成功 |
| 201 | 201 | 创建成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证 |
| 403 | 403 | 无权限 |
| 404 | 404 | 资源不存在 |
| 500 | 500 | 服务器内部错误 |

---

## 八、项目结构

```
project/
├── frontend/                   # 前端
│   ├── src/
│   │   ├── api/               # API调用
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── store/             # 状态管理
│   │   └── utils/             # 工具函数
│   └── package.json
│
├── backend/                    # 后端
│   ├── cmd/                   # 入口
│   ├── internal/              # 内部代码
│   │   ├── handler/           # HTTP处理器
│   │   ├── service/           # 业务逻辑
│   │   ├── repository/        # 数据访问
│   │   └── model/             # 数据模型
│   └── pkg/                   # 公共包
│
├── docs/                       # 文档
└── tests/                      # 测试
```

---

## 九、快速命令

```bash
# 安装依赖
pnpm install
npm install
pip install -r requirements.txt

# 开发模式
pnpm dev
npm run dev
python main.py

# 测试
pnpm test
npm test
go test -v ./...
pytest

# 代码检查
pnpm lint
npm run lint
golangci-lint run
black .
mypy .

# 构建
pnpm build
npm run build
go build
```

---

## 十、核心记忆

```
TDD = 先写测试再写代码
Plan = 复杂任务先用计划模式

分层架构 = Handler(薄) + Service(厚) + Repository

各取所长，不纠结
```

---

**最后更新**: 2026年4月
**来源**: 基于 project-dev 复制并通用化
