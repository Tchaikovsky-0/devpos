# 开发规范文档

## 1. 项目组织规范

### 1.1 Git工作流

#### 分支命名
```
feature/<功能名称>          # 新功能开发
bugfix/<问题描述>           # Bug修复
hotfix/<紧急问题>           # 紧急修复
release/<版本号>            # 发布分支
docs/<文档类型>             # 文档更新
refactor/<重构内容>         # 代码重构
```

**示例**：
```bash
feature/media-library
feature/video-stream-optimization
bugfix/stream-reconnection-issue
hotfix/urgent-security-patch
release/v1.0.0
```

#### 提交规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不影响功能）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```bash
feat(media): 添加文件夹权限管理功能

实现多租户隔离的文件夹权限控制系统
- 支持读/写/删除/分享权限
- 支持用户和角色权限设置
- 支持权限过期时间

Closes #123
```

### 1.2 代码审查

#### PR要求
- 必须通过CI/CD流水线
- 至少1人Code Review
- 无阻塞性问题
- 测试覆盖率达标
- 文档已更新（如需要）

#### Review检查清单
- [ ] 代码逻辑正确性
- [ ] 边界条件处理
- [ ] 安全性（SQL注入、XSS等）
- [ ] 性能影响
- [ ] 代码可读性
- [ ] 测试覆盖
- [ ] 文档完整性

## 2. 前端开发规范

### 2.1 项目结构
```
frontend/
├── src/
│   ├── api/                 # API调用
│   │   ├── request.ts      # 请求封装
│   │   ├── auth.ts         # 认证相关
│   │   ├── streams.ts      # 视频流相关
│   │   ├── media.ts        # 媒体库相关
│   │   └── alerts.ts       # 告警相关
│   │
│   ├── components/         # 公共组件
│   │   ├── common/        # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/        # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── business/      # 业务组件
│   │       ├── VideoPlayer.tsx
│   │       └── FileUploader.tsx
│   │
│   ├── pages/             # 页面组件
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── streams/
│   │   │   ├── StreamList.tsx
│   │   │   └── StreamDetail.tsx
│   │   └── media/
│   │       ├── MediaLibrary.tsx
│   │       └── FolderDetail.tsx
│   │
│   ├── hooks/            # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useStreams.ts
│   │   └── useWebSocket.ts
│   │
│   ├── store/            # 状态管理
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   └── streamSlice.ts
│   │
│   ├── utils/           # 工具函数
│   │   ├── format.ts
│   │   ├── validate.ts
│   │   └── storage.ts
│   │
│   ├── types/           # TypeScript类型
│   │   ├── api.ts
│   │   ├── stream.ts
│   │   └── user.ts
│   │
│   └── App.tsx
│
├── public/
│   └── images/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .eslintrc.js
```

### 2.2 命名规范

#### 组件命名
- 使用PascalCase
- 文件名与组件名一致
- 业务组件放在`components/business/`

**示例**：
```typescript
// ✅ 正确
VideoPlayer.tsx
StreamList.tsx

// ❌ 错误
videoPlayer.tsx
stream-list.tsx
```

#### 变量命名
- 使用camelCase
- 命名要有意义
- 避免无意义的缩写

**示例**：
```typescript
// ✅ 正确
const streamList = []
const currentUser = {}
const isLoading = false

// ❌ 错误
const list = []
const cu = {}
const loading = false
```

#### 常量命名
- 使用UPPER_SNAKE_CASE
- 放在单独的常量文件中

**示例**：
```typescript
// constants/api.ts
export const API_BASE_URL = '/api/v1'
export const REQUEST_TIMEOUT = 30000

// constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  DASHBOARD: '/dashboard'
}
```

### 2.3 代码风格

#### 组件结构
```typescript
import React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'
import type { Stream } from '@/types/stream'

interface StreamCardProps {
  stream: Stream
  onClick?: () => void
}

export const StreamCard: React.FC<StreamCardProps> = ({
  stream,
  onClick
}) => {
  // 1. Hooks
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)

  // 2. Effects
  useEffect(() => {
    // fetch data
  }, [])

  // 3. Handlers
  const handleClick = () => {
    onClick?.()
  }

  // 4. Render
  return (
    <div className="stream-card" onClick={handleClick}>
      <h3>{stream.name}</h3>
      <span className="status">{stream.status}</span>
    </div>
  )
}
```

#### Props定义
```typescript
// ✅ 使用interface定义Props
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

// ✅ 使用type定义联合类型
type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

// ✅ 复杂类型使用type别名
type UserWithRole = User & {
  role: Role
  permissions: Permission[]
}
```

### 2.4 CSS规范

#### Tailwind CSS使用
- 优先使用Tailwind原子类
- 复杂样式使用自定义CSS
- 保持类名整洁

**示例**：
```tsx
// ✅ 正确
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  按钮
</button>

// ❌ 避免
<button className="custom-button">
  按钮
</button>
```

#### 响应式设计
```tsx
// 移动优先
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

## 3. 后端开发规范

### 3.1 项目结构
```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 入口文件
│
├── internal/
│   ├── api/
│   │   ├── router.go           # 路由定义
│   │   ├── middleware/         # 中间件
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   └── logger.go
│   │   └── handler/           # 处理器
│   │       ├── auth.go
│   │       ├── user.go
│   │       ├── stream.go
│   │       └── media.go
│   │
│   ├── service/              # 业务逻辑
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── stream_service.go
│   │   └── media_service.go
│   │
│   ├── repository/          # 数据访问
│   │   ├── user_repo.go
│   │   ├── stream_repo.go
│   │   └── media_repo.go
│   │
│   ├── model/               # 数据模型
│   │   ├── user.go
│   │   ├── stream.go
│   │   └── media.go
│   │
│   └── config/              # 配置
│       ├── config.go
│       └── .env.example
│
├── pkg/
│   ├── utils/               # 工具包
│   │   ├── response.go
│   │   ├── errors.go
│   │   ├── validator.go
│   │   └── crypto.go
│   │
│   └── middleware/          # 公共中间件
│       └── recovery.go
│
├── migrations/              # 数据库迁移
│   ├── 001_create_users.up.sql
│   └── 001_create_users.down.sql
│
├── go.mod
├── go.sum
└── Makefile
```

### 3.2 代码规范

#### 命名规范
```go
// ✅ 包名使用简短小写
package handler
package service

// ✅ 结构体使用PascalCase
type UserService struct {}
type StreamController struct {}

// ✅ 接口名以er结尾
type UserRepository interface {}
type Cache interface {}

// ✅ 变量使用camelCase
var streamList []Stream
currentUser := &User{}

// ✅ 常量使用PascalCase
const MaxUploadSize = 10 * 1024 * 1024 * 1024 // 10GB
```

#### 错误处理
```go
// ✅ 使用错误包装
if err != nil {
    return nil, fmt.Errorf("get user failed: %w", err)
}

// ✅ 自定义错误类型
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// ✅ 统一错误响应
if err != nil {
    switch {
    case errors.Is(err, sql.ErrNoRows):
        response.NotFound(c, "用户不存在")
    case errors.Is(err, ErrUnauthorized):
        response.Unauthorized(c, "未授权")
    default:
        response.InternalError(c, "服务器错误")
    }
    return
}
```

#### 函数设计
```go
// ✅ 函数注释（公共API必须）
// GetUserByID 根据用户ID获取用户信息
// 返回用户信息或错误
func (s *UserService) GetUserByID(ctx context.Context, id string) (*User, error) {}

// ✅ 参数验证
func CreateUser(req *CreateUserRequest) error {
    if req.Username == "" {
        return ErrUsernameRequired
    }
    if len(req.Password) < 6 {
        return ErrPasswordTooShort
    }
    return nil
}

// ✅ 上下文作为第一个参数
func (r *UserRepository) FindByID(ctx context.Context, id string) (*User, error) {}
```

#### 分层架构
```go
// Handler层 - 处理请求响应
func (h *UserHandler) GetUser(c *gin.Context) {
    id := c.Param("id")
    
    user, err := h.userService.GetUserByID(c.Request.Context(), id)
    if err != nil {
        response.Error(c, err)
        return
    }
    
    response.Success(c, user)
}

// Service层 - 业务逻辑
func (s *UserService) GetUserByID(ctx context.Context, id string) (*User, error) {
    // 业务逻辑处理
    user, err := s.userRepo.FindByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    // 业务规则处理
    if user.Status == "disabled" {
        return nil, ErrUserDisabled
    }
    
    return user, nil
}

// Repository层 - 数据访问
func (r *UserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}
```

## 4. 数据库规范

### 4.1 索引设计
```sql
-- ✅ 为外键建立索引
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- ✅ 为频繁查询字段建立索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ✅ 复合索引（注意字段顺序）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- ✅ 部分索引
CREATE INDEX idx_users_active ON users(email) WHERE deleted_at IS NULL;
```

### 4.2 查询优化
```sql
-- ✅ 使用EXPLAIN分析查询
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- ✅ 避免SELECT *
SELECT id, username, email FROM users WHERE id = ?;

-- ✅ 使用批量操作
INSERT INTO users (name, email) VALUES 
('User1', 'user1@example.com'),
('User2', 'user2@example.com');

-- ✅ 使用LIMIT限制
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;
```

## 5. API规范

### 5.1 URL设计
```
GET    /api/v1/users          # 获取用户列表
POST   /api/v1/users          # 创建用户
GET    /api/v1/users/:id      # 获取单个用户
PUT    /api/v1/users/:id      # 更新用户
DELETE /api/v1/users/:id      # 删除用户

# 嵌套资源
GET    /api/v1/streams/:id/alerts      # 获取视频流的告警
POST   /api/v1/streams/:id/snapshot    # 获取视频流截图

# 动作
POST   /api/v1/users/:id/activate     # 激活用户
POST   /api/v1/alerts/:id/resolve     # 处理告警
```

### 5.2 状态码使用
```go
// 2xx 成功
200 OK              // 获取/更新成功
201 Created         // 创建成功
204 No Content      // 删除成功

// 4xx 客户端错误
400 Bad Request     // 参数错误
401 Unauthorized    // 未认证
403 Forbidden       // 无权限
404 Not Found       // 资源不存在
409 Conflict        // 资源冲突
422 Unprocessable   // 验证失败

// 5xx 服务端错误
500 Internal Error  // 服务器错误
503 Service Unavailable // 服务不可用
```

## 6. 测试规范

### 6.1 测试覆盖率要求
- 核心业务逻辑：≥80%
- 公共工具函数：≥90%
- API Handler：≥70%

### 6.2 单元测试
```go
// ✅ 正确的测试结构
func TestUserService_CreateUser(t *testing.T) {
    // 准备测试数据
    req := &CreateUserRequest{
        Username: "testuser",
        Email:    "test@example.com",
        Password: "password123",
    }
    
    // 执行
    user, err := userService.CreateUser(req)
    
    // 断言
    assert.NoError(t, err)
    assert.NotNil(t, user)
    assert.Equal(t, req.Username, user.Username)
    assert.Equal(t, req.Email, user.Email)
}
```

### 6.3 集成测试
```go
// ✅ API集成测试
func TestUserAPI_CreateUser(t *testing.T) {
    // 设置测试服务器
    server := httptest.NewServer(router)
    defer server.Close()
    
    // 准备请求
    body := `{"username":"test","email":"test@example.com","password":"123456"}`
    
    // 发起请求
    resp, err := http.Post(server.URL+"/api/v1/users", "application/json", strings.NewReader(body))
    
    // 断言
    assert.NoError(t, err)
    assert.Equal(t, 201, resp.StatusCode)
}
```

## 7. 文档规范

### 7.1 代码注释
```typescript
/**
 * 获取用户列表
 * @param params - 查询参数
 * @returns 用户列表和分页信息
 */
export async function getUsers(params: UserQueryParams): Promise<UserListResponse> {
  // ...
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的字符串 (e.g., "1.5 MB")
 * 
 * @example
 * formatFileSize(1024 * 1024 * 1.5) // "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  // ...
}
```

### 7.2 README文档
```markdown
# 模块名称

## 功能描述
简要说明模块的功能和用途。

## 安装
```bash
npm install @xunjianbao/stream
```

## 使用
```typescript
import { StreamPlayer } from '@xunjianbao/stream'

<StreamPlayer streamId="xxx" />
```

## API
### StreamPlayer
| 属性 | 类型 | 说明 |
|------|------|------|
| streamId | string | 视频流ID |
| autoplay | boolean | 自动播放 |

## 示例
提供完整的使用示例代码。

## 注意事项
- 重要注意事项1
- 重要注意事项2
```

## 8. 安全规范

### 8.1 敏感信息处理
```typescript
// ✅ 环境变量
const API_KEY = process.env.API_KEY

// ✅ 禁止硬编码
// ❌ 错误
const API_KEY = 'sk-1234567890abcdef'

// ✅ 配置分离
// config.ts
export const config = {
  apiKey: process.env.API_KEY,
  apiUrl: process.env.API_URL
}
```

### 8.2 输入验证
```typescript
// ✅ 使用验证库
import { z } from 'zod'

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(2).max(50)
})

// ✅ 验证请求参数
export const createUser = async (req: Request) => {
  const validated = UserSchema.parse(req.body)
  // ...
}
```

### 8.3 SQL注入防护
```go
// ✅ 使用参数化查询
rows, err := db.Query("SELECT * FROM users WHERE email = ?", email)

// ❌ 避免字符串拼接
query := "SELECT * FROM users WHERE email = '" + email + "'"
```

## 9. 性能规范

### 9.1 前端性能
- 首屏加载 < 3秒
- Lighthouse评分 > 90
- 使用Code Splitting
- 图片懒加载
- 组件按需加载

### 9.2 后端性能
- API响应时间 P95 < 200ms
- 数据库查询使用索引
- 合理使用缓存
- 避免N+1查询

```go
// ✅ 批量查询
var users []User
db.Where("id IN ?", ids).Find(&users)

// ❌ N+1查询
for _, id := range ids {
    user := getUserByID(id) // 循环查询
}
```

## 10. 部署规范

### 10.1 环境配置
```
# .env.development
API_BASE_URL=http://localhost:8094
LOG_LEVEL=debug

# .env.production
API_BASE_URL=https://api.xunjianbao.com
LOG_LEVEL=info
```

### 10.2 Docker配置
```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```