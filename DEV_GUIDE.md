# 开发环境指南

## 🔓 开发模式特性

### 认证已禁用
- ✅ 无需登录即可访问所有页面
- ✅ API 请求自动携带默认用户信息
- ✅ 所有需要认证的接口都可以直接访问

查看 [认证配置详细说明](./DEV_AUTH_BYPASS.md)

---

## 🚀 快速启动

### 一键启动（推荐）

```bash
# 启动全链路开发环境（前后端热加载）
./dev-start.sh

# 停止开发环境
./dev-stop.sh
```

### 手动启动

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yaml up -d

# 查看日志
docker-compose -f docker-compose.dev.yaml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yaml down
```

## 📦 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| **前端** | 3000 | React + Vite (热加载) |
| **后端** | 8094 | Go + Gin (热加载) |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| AI Service | 8095 | AI 服务 |
| YOLO Service | 8097 | 目标检测服务 |
| OpenClaw | 8096 | OpenClaw 服务 |

## 🔥 热加载说明

### 前端热加载（Vite）
- 修改 `frontend/src/` 下的任何文件
- 浏览器自动刷新，无需手动重启
- 访问地址: http://localhost:3000

### 后端热加载（Air）
- 修改 `backend/` 下的 `.go` 文件
- Air 自动检测变化并重新编译运行
- 日志实时输出到终端
- API 地址: http://localhost:8094

## 🛠️ 开发工具

### 前端开发

```bash
# 进入前端容器
docker-compose -f docker-compose.dev.yaml exec frontend sh

# 安装新依赖
pnpm add <package-name>

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

### 后端开发

```bash
# 进入后端容器
docker-compose -f docker-compose.dev.yaml exec backend sh

# 下载新依赖
go get <package-name>

# 运行测试
go test ./...

# 代码格式化
go fmt ./...
```

## 📝 环境变量

项目根目录的 `.env` 文件：

```env
# 数据库配置
MYSQL_ROOT_PASSWORD=root_password_change_me
MYSQL_DATABASE=xunjianbao
MYSQL_USER=xunjianbao
MYSQL_PASSWORD=change_password

# Redis 配置
REDIS_PASSWORD=

# JWT 配置（生产环境必须修改）
JWT_SECRET=your-jwt-secret-at-least-32-chars-change-in-production

# 服务配置
OPENCLAW_URL=http://openclaw:8096
OPENCLAW_TOKEN=
AI_SERVICE_URL=http://ai:8095
YOLO_SERVICE_URL=http://yolo:8097
YOLO_DEVICE=cpu
```

## 🔍 调试技巧

### 查看服务状态

```bash
# 查看所有服务状态
docker-compose -f docker-compose.dev.yaml ps

# 查看特定服务日志
docker-compose -f docker-compose.dev.yaml logs backend
docker-compose -f docker-compose.dev.yaml logs frontend
```

### 重启单个服务

```bash
# 重启后端
docker-compose -f docker-compose.dev.yaml restart backend

# 重启前端
docker-compose -f docker-compose.dev.yaml restart frontend
```

### 进入数据库

```bash
# MySQL
docker-compose -f docker-compose.dev.yaml exec mysql mysql -u xunjianbao -p

# Redis
docker-compose -f docker-compose.dev.yaml exec redis redis-cli
```

## 🧹 清理数据

### 清理开发数据

```bash
# 停止并删除容器和数据卷
docker-compose -f docker-compose.dev.yaml down -v

# 重新启动
./dev-start.sh
```

### 清理构建缓存

```bash
# 清理所有构建缓存
docker-compose -f docker-compose.dev.yaml build --no-cache
```

## 📊 性能优化

### 前端优化
- Vite 开发服务器使用 SWC 编译，速度极快
- 模块热替换 (HMR) 无需整页刷新
- 依赖预构建提升启动速度

### 后端优化
- Air 使用增量编译，重新构建快速
- Go 模块缓存持久化到 Docker Volume
- GCC 编译优化

## 🐛 常见问题

### 端口占用

如果端口被占用，修改 `docker-compose.dev.yaml` 中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # 改为其他端口
```

### 依赖安装失败

```bash
# 清理依赖重新安装
docker-compose -f docker-compose.dev.yaml exec frontend pnpm install --force
docker-compose -f docker-compose.dev.yaml exec backend go mod download
```

### 热加载不生效

```bash
# 检查文件挂载
docker-compose -f docker-compose.dev.yaml exec backend ls -la /app

# 重启服务
docker-compose -f docker-compose.dev.yaml restart backend
```

## 🎯 生产部署

生产环境请使用原始的 `docker-compose.yaml`：

```bash
# 生产部署
docker-compose up -d

# 生产停止
docker-compose down
```

## 📚 相关文档

- [前端开发文档](./frontend/NOTES.md)
- [后端 API 文档](./backend/docs/)
- [项目总览](./README.md)
