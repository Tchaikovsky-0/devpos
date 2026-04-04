# 🔓 开发模式认证配置说明

## 已完成的修改

### ✅ 前端修改

#### 1. API 客户端 (`frontend/src/api/client.ts`)
```typescript
private getAuthToken(): string | null {
  // 开发模式：跳过认证
  if (import.meta.env.DEV) {
    return null;
  }
  return localStorage.getItem('token');
}
```

- 在开发模式下不发送认证 token
- 自动检测 `import.meta.env.DEV`（Vite 开发模式）

### ✅ 后端修改

#### 1. 认证中间件 (`backend/internal/middleware/auth.go`)
```go
func AuthMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    // 开发模式：跳过认证
    if os.Getenv("GIN_MODE") == "debug" {
      // 设置默认用户信息
      c.Set("user_id", uint(1))
      c.Set("username", "dev_user")
      c.Set("tenant_id", "tenant_default")
      c.Next()
      return
    }
    // ... 正常认证逻辑
  }
}
```

- 检测 `GIN_MODE=debug` 环境变量
- 自动注入默认用户信息
- 无需 token 即可访问所有 API

---

## 🚀 使用方法

### 方式一：使用热加载开发环境（推荐）

```bash
# 启动开发环境（已配置 GIN_MODE=debug）
./dev-start.sh
```

**✅ 自动配置**：
- 后端自动设置 `GIN_MODE=debug`
- 前端自动检测开发模式
- 无需手动登录

### 方式二：手动启动

#### 前端
```bash
cd frontend
pnpm dev  # 自动启用开发模式
```

#### 后端
```bash
cd backend
GIN_MODE=debug go run cmd/server/main.go
```

---

## 📝 开发模式特性

### 🔓 认证跳过
- ✅ 无需登录即可访问所有页面
- ✅ API 请求自动携带默认用户信息
- ✅ 所有需要认证的接口都可以直接访问

### 👤 默认用户信息
```json
{
  "user_id": 1,
  "username": "dev_user",
  "tenant_id": "tenant_default"
}
```

### 🛠️ 开发提示
- 前端控制台会显示：`🔧 Dev mode: Skipping auth for /api/...`
- 后端日志会显示 Gin debug 模式信息

---

## 🔄 恢复认证功能

### 生产环境
```bash
# 使用生产配置启动
docker-compose up -d
```

**自动启用认证**：
- `GIN_MODE=release`（生产模式）
- 需要 token 认证
- 必须登录才能访问

### 手动测试认证
```bash
# 临时禁用开发模式
cd backend
GIN_MODE=release go run cmd/server/main.go
```

---

## 🎯 开发流程

### 1. 启动开发环境
```bash
./dev-start.sh
```

### 2. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:8094

### 3. 直接开发
- 无需登录，直接访问所有页面
- 实时查看修改效果（热加载）
- API 正常工作

### 4. 检查状态
```bash
./dev-health.sh
```

---

## 🐛 调试技巧

### 查看认证状态
```javascript
// 浏览器控制台
localStorage.getItem('token')  // 应该为 null
```

### 测试 API
```bash
# 无需 token 即可访问
curl http://localhost:8094/api/v1/dashboard/stats
```

### 查看后端日志
```bash
docker-compose -f docker-compose.dev.yaml logs -f backend
```

---

## 📊 对比表

| 特性 | 开发模式 | 生产模式 |
|------|---------|---------|
| 登录要求 | ❌ 不需要 | ✅ 必须登录 |
| Token 认证 | ❌ 跳过 | ✅ 必需 |
| 用户信息 | 自动注入 | 从 token 解析 |
| API 访问 | 无限制 | 需认证 |
| 热加载 | ✅ 启用 | ❌ 禁用 |
| 调试日志 | ✅ 详细 | ❌ 精简 |

---

## ⚠️ 注意事项

### 安全提醒
- ⚠️ **仅用于开发环境**
- ⚠️ **生产环境必须启用认证**
- ⚠️ **不要在生产环境设置 GIN_MODE=debug**

### 数据隔离
- 开发环境使用独立的 Docker 数据卷
- 不会影响生产数据
- 可以随时清理重置

---

## 🔗 相关文档

- [热加载开发指南](./HOT_RELOAD_GUIDE.md)
- [快速启动指南](./DEV_QUICKSTART.md)
- [完整开发文档](./DEV_GUIDE.md)
