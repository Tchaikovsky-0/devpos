# 🎉 开发环境配置完成

## ✅ 已完成配置

### 1. 🔥 全链路热加载
- **前端**: Vite 热模块替换（HMR）
- **后端**: Air 自动重编译
- **实时更新**: 代码修改立即生效

### 2. 🔓 认证已移除
- **前端**: 开发模式跳过 token
- **后端**: GIN_MODE=debug 绕过认证
- **直接访问**: 无需登录即可开发

---

## 🚀 立即开始

```bash
# 1. 启动开发环境
./dev-start.sh

# 2. 访问应用（无需登录）
open http://localhost:3000

# 3. 开始开发
# - 修改代码自动刷新
# - API 无需认证
# - 实时查看效果
```

---

## 📚 文档导航

### 快速上手
- **[AUTH_REMOVED.md](./AUTH_REMOVED.md)** - 🔓 认证移除说明（推荐先看）
- **[DEV_QUICKSTART.md](./DEV_QUICKSTART.md)** - ⚡ 快速启动指南

### 详细配置
- **[DEV_AUTH_BYPASS.md](./DEV_AUTH_BYPASS.md)** - 🔓 认证跳过原理
- **[HOT_RELOAD_GUIDE.md](./HOT_RELOAD_GUIDE.md)** - 🔥 热加载配置
- **[DEV_GUIDE.md](./DEV_GUIDE.md)** - 📖 完整开发文档

### 项目文档
- **[README.md](./README.md)** - 项目总览
- **[docker-compose.dev.yaml](./docker-compose.dev.yaml)** - 开发环境配置

---

## 🎯 核心特性

### 🔥 热加载
| 服务 | 技术 | 响应时间 |
|------|------|---------|
| 前端 | Vite HMR | < 1 秒 |
| 后端 | Air | 2-3 秒 |

### 🔓 认证状态
| 环境 | 登录 | Token | 访问 |
|------|------|-------|------|
| 开发 | ❌ 不需要 | ❌ 跳过 | ✅ 无限制 |
| 生产 | ✅ 必须 | ✅ 必需 | 🔒 需认证 |

### 📦 服务端口
| 服务 | 端口 | 状态 |
|------|------|------|
| 前端 | 3000 | 🔥 热加载 |
| 后端 | 8094 | 🔥 热加载 |
| MySQL | 3306 | ✅ 运行 |
| Redis | 6379 | ✅ 运行 |

---

## 🛠️ 常用命令

```bash
# 启动开发环境
./dev-start.sh

# 停止开发环境
./dev-stop.sh

# 健康检查
./dev-health.sh

# 查看日志
docker-compose -f docker-compose.dev.yaml logs -f

# 重启服务
docker-compose -f docker-compose.dev.yaml restart

# 清理数据
docker-compose -f docker-compose.dev.yaml down -v
```

---

## 🐛 调试技巧

### 前端调试
```javascript
// 浏览器控制台
localStorage.getItem('token')  // null（开发模式）

// 查看开发模式日志
// 🔧 Dev mode: Skipping auth for /api/v1/...
```

### 后端调试
```bash
# 进入容器
docker-compose -f docker-compose.dev.yaml exec backend sh

# 查看日志
docker-compose -f docker-compose.dev.yaml logs -f backend

# 测试 API
curl http://localhost:8094/api/v1/dashboard/stats
```

### 数据库访问
```bash
# MySQL
docker-compose -f docker-compose.dev.yaml exec mysql mysql -u xunjianbao -p

# Redis
docker-compose -f docker-compose.dev.yaml exec redis redis-cli
```

---

## 📁 文件结构

```
xunjianbao/
├── docker-compose.dev.yaml      # 开发环境配置
├── dev-start.sh                 # 启动脚本
├── dev-stop.sh                  # 停止脚本
├── dev-health.sh                # 健康检查
├── .env.example                 # 环境变量示例
├── DEV_QUICKSTART.md            # 快速启动
├── DEV_GUIDE.md                 # 完整文档
├── HOT_RELOAD_GUIDE.md          # 热加载说明
├── DEV_AUTH_BYPASS.md           # 认证配置
├── AUTH_REMOVED.md              # 认证移除说明
│
├── frontend/
│   ├── Dockerfile.dev           # 前端开发镜像
│   └── src/api/client.ts        # API 客户端（已修改）
│
└── backend/
    ├── Dockerfile.dev           # 后端开发镜像
    ├── .air.toml                # Air 配置
    └── internal/middleware/auth.go  # 认证中间件（已修改）
```

---

## ⚠️ 重要提醒

### 安全
- ⚠️ 开发模式仅用于本地开发
- ⚠️ 生产环境必须启用认证
- ⚠️ 不要将 .env 文件提交到 Git

### 数据
- ✅ 开发环境使用独立数据卷
- ✅ 不影响生产数据
- ✅ 可随时清理重置

---

## 🎊 准备就绪！

所有配置已完成，现在你可以：

1. **启动环境**: `./dev-start.sh`
2. **访问应用**: http://localhost:3000
3. **直接开发**: 无需登录，代码实时更新

**Happy Coding! 🚀**

---

## 📞 获取帮助

遇到问题？查看以下文档：
- [快速启动指南](./DEV_QUICKSTART.md)
- [认证配置说明](./DEV_AUTH_BYPASS.md)
- [热加载配置](./HOT_RELOAD_GUIDE.md)
- [完整开发文档](./DEV_GUIDE.md)
