---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:45:06.186Z
provider: 
---

# 巡检宝项目 - 安全规范

> **核心原则**: 安全第一、最小权限、纵深防御

---

## 一、认证与授权

### JWT认证

```go
// ✅ 正确的JWT验证
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "missing token"})
            return
        }
        
        token = strings.TrimPrefix(token, "Bearer ")
        claims, err := jwt.ValidateToken(token)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "invalid token"})
            return
        }
        
        c.Set("userID", claims.UserID)
        c.Set("tenantID", claims.TenantID)
        c.Next()
    }
}
```

### Token安全策略

```yaml
Token配置:
  过期时间: 
    AccessToken: 2小时
    RefreshToken: 7天
  安全要求:
    - 使用HS256或RS256算法
    - SecretKey长度>=32字节
    - 禁止在客户端存储敏感信息
    - RefreshToken必须绑定设备指纹
```

### 权限控制

```go
// ✅ 基于RBAC的权限控制
func RequirePermission(permission string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("userID")
        tenantID := c.GetString("tenantID")
        
        hasPerm, err := permissionService.Check(c, userID, tenantID, permission)
        if err != nil || !hasPerm {
            c.AbortWithStatusJSON(403, gin.H{"error": "forbidden"})
            return
        }
        c.Next()
    }
}
```

### 多租户隔离

```go
// ✅ 强制租户隔离 - 所有查询必须带tenant_id
func (r *StreamRepository) List(ctx context.Context, tenantID string) ([]Stream, error) {
    var streams []Stream
    err := r.db.WithContext(ctx).
        Where("tenant_id = ?", tenantID). // 必须！
        Find(&streams).Error
    return streams, err
}
```

---

## 二、数据安全

### 密码安全

```go
import "golang.org/x/crypto/bcrypt"

// ✅ 密码加密存储
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(bytes), err
}

// 密码复杂度要求
func ValidatePassword(password string) error {
    if len(password) < 8 {
        return errors.New("密码至少8位")
    }
    // 必须包含大小写字母、数字和特殊字符
    return nil
}
```

### SQL注入防护

```go
// ✅ 使用参数化查询
func (r *UserRepository) FindByName(ctx context.Context, name string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).
        Where("name = ?", name). // 参数化，安全
        First(&user).Error
    return &user, err
}

// ❌ 危险！SQL注入
query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", name)
```

### 敏感数据脱敏

```go
// ✅ 日志脱敏
func LogUserInfo(user User) {
    // 手机号脱敏：138****1234
    maskedPhone := user.Phone[:3] + "****" + user.Phone[len(user.Phone)-4:]
    
    log.Info("user operation",
        zap.String("userID", user.ID),
        zap.String("phone", maskedPhone),
    )
}
```

### 文件上传安全

```go
// ✅ 安全的文件上传
func UploadFile(c *gin.Context) {
    file, header, err := c.Request.FormFile("file")
    
    // 1. 检查文件大小（最大100MB）
    if header.Size > 100*1024*1024 {
        c.JSON(400, gin.H{"error": "file too large"})
        return
    }
    
    // 2. 检查文件类型（白名单）
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "video/mp4":  true,
    }
    
    // 3. 检查文件头（防止伪装）
    buffer := make([]byte, 512)
    file.Read(buffer)
    detectedType := http.DetectContentType(buffer)
    
    // 4. 生成随机文件名
    randomName := uuid.New().String() + filepath.Ext(header.Filename)
}
```

---

## 三、网络安全

### HTTPS强制

```go
// ✅ 强制HTTPS
func ForceHTTPS() gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.Request.Header.Get("X-Forwarded-Proto") == "http" {
            c.Redirect(301, "https://"+c.Request.Host+c.Request.URL.Path)
            return
        }
        c.Next()
    }
}

// HSTS头部
func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Strict-Transport-Security", "max-age=31536000")
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("X-XSS-Protection", "1; mode=block")
        c.Next()
    }
}
```

### CORS配置

```go
// ✅ 严格的CORS配置
func CORSConfig() gin.HandlerFunc {
    config := cors.Config{
        AllowOrigins:     []string{"https://xunjianbao.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }
    return cors.New(config)
}
```

### 限流防刷

```go
// ✅ 限流中间件
func RateLimiter(limit int, window time.Duration) gin.HandlerFunc {
    limiter := rate.NewLimiter(rate.Every(window/time.Duration(limit)), limit)
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.AbortWithStatusJSON(429, gin.H{"error": "too many requests"})
            return
        }
        c.Next()
    }
}

// 使用示例
r.POST("/api/v1/auth/login", RateLimiter(5, time.Minute), authHandler.Login)
r.POST("/api/v1/auth/captcha", RateLimiter(3, time.Minute), authHandler.SendCaptcha)
```

---

## 四、配置安全

### 环境变量管理

```yaml
# ✅ 使用环境变量存储敏感信息
# .env.example（提交到Git，不含真实值）
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key-here
REDIS_PASSWORD=
MINIO_ACCESS_KEY=

# ❌ 禁止提交真实配置文件
# .env（加入.gitignore，不提交）
```

### 密钥管理

```go
// ✅ 从环境变量读取密钥
func LoadConfig() *Config {
    return &Config{
        JWTSecret:     os.Getenv("JWT_SECRET"),
        DatabaseURL:   os.Getenv("DATABASE_URL"),
    }
}

// 启动时检查必要配置
func ValidateConfig(cfg *Config) error {
    if cfg.JWTSecret == "" {
        return errors.New("JWT_SECRET is required")
    }
    if len(cfg.JWTSecret) < 32 {
        return errors.New("JWT_SECRET must be at least 32 characters")
    }
    return nil
}
```

---

## 五、生产环境检查清单

```yaml
部署前检查:
  配置:
    ✅ 所有敏感配置使用环境变量
    ✅ 生产环境使用强密码
    ✅ JWT Secret长度>=32字节
    ✅ 数据库使用SSL连接
    
  网络:
    ✅ 强制HTTPS
    ✅ 配置CORS白名单
    ✅ 开启WAF防护
    
  日志:
    ✅ 敏感信息已脱敏
    ✅ 访问日志开启
    ✅ 错误日志不暴露堆栈
```

---

## 六、安全事件响应

### 事件分级

| 级别 | 描述 | 响应时间 | 示例 |
|------|------|----------|------|
| P0 | 严重 | 15分钟 | 数据泄露、系统被入侵 |
| P1 | 高危 | 1小时 | 漏洞被利用 |
| P2 | 中危 | 4小时 | 潜在漏洞 |
| P3 | 低危 | 24小时 | 安全建议 |

### 应急响应流程

```
1. 发现 → 立即报告安全负责人
2. 评估 → 确定影响范围和级别
3. 遏制 → 停止损害扩散
4. 根除 → 修复漏洞
5. 恢复 → 恢复服务
6. 总结 → 复盘并改进
```

---

## 七、禁止事项

```yaml
❌ 绝对禁止:
  - 明文存储密码
  - 日志输出敏感信息
  - SQL字符串拼接
  - 信任用户输入
  - 禁用HTTPS
  - 使用*作为CORS来源
  - 硬编码密钥到代码
  - 忽略错误处理
```

---

**最后更新**: 2026年4月