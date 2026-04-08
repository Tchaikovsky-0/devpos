# 巡检宝 - 开发进度与部署总结

> **项目版本**: v2.1.0
> **部署日期**: 2026-04-08
> **部署目标**: 腾讯云服务器 (Ubuntu 24.04, 4核16GB)

---

## 📊 一、项目概述

**项目名称**: 巡检宝 (XunJianBao)
**项目定位**: 面向重工业企业的智能监控平台
**核心特性**: OpenClaw深度集成 + YOLO智能检测

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端** | React 18 + TypeScript + Tailwind + Vite + pnpm | Node 18+ |
| **后端** | Go 1.21+ + Gin + MySQL + Redis + GORM + JWT | Go 1.21+ |
| **AI服务** | Python 3.10+ + FastAPI + YOLOv8 + OpenCV | Python 3.10+ |

---

## ✨ 二、核心功能模块

### 2.1 已完成功能 ✅

#### P0 - 核心功能（生产可用）

1. **多租户架构** ✅
   - 租户数据隔离（tenant_id）
   - 存储配额管理
   - 功能开关配置
   - AI模型配置

2. **用户权限系统** ✅
   - JWT 认证
   - RBAC 权限控制
   - 操作审计日志

3. **媒体库模块** ✅
   - 文件上传/下载/预览
   - 文件夹管理
   - **文件夹上锁**（私有/公开切换 + 细粒度权限）
   - 文件权限管理

4. **视频流管理** ✅
   - 多画面实时监控
   - 大疆司空2接入
   - RTSP/WebRTC/HLS流支持

5. **YOLO智能检测** ✅
   - 火焰检测
   - 入侵检测
   - 缺陷检测
   - 车辆识别

6. **告警管理** ✅
   - 实时告警推送
   - 告警规则配置
   - 告警处理流程

#### P1 - 重要功能（生产可用）

7. **OpenClaw AI Agent** ✅
   - AI对话（智能问答）
   - 故障诊断
   - 知识库RAG

8. **巡检报告** ⚠️
   - 报告生成框架 ✅
   - 数据采集链路 ⚠️ (部分实现)

9. **系统设置** ✅
   - 租户配置管理
   - 功能模块开关
   - 存储配额显示

### 2.2 本次更新内容

#### 最新提交 (2026-04-08)

**Backend 优化**:
- ✨ 添加 Redis 缓存初始化
- 📊 优化数据库连接池配置（生产环境调优）
- 🔧 GORM 日志级别调整（生产环境降低日志噪音）

**AI Service**:
- 📦 依赖版本约束优化（使用 >= 允许更灵活的版本）

**前端修复**:
- 🐛 修复设置模块滚动问题
- 🎨 优化侧边栏固定和滚动行为

---

## 🔧 三、架构设计

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (React)                        │
│           React 18 + TypeScript + Tailwind             │
│                   端口: 3000                            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 API Gateway (Go)                        │
│        Gin + JWT + CORS + WebSocket + RBAC              │
│                   端口: 8094                            │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   业务服务    │ │   AI服务     │ │   媒体服务    │
│    (Go)      │ │  (Python)    │ │    (Go)      │
│              │ │              │ │              │
│ 用户/租户    │ │ YOLO检测     │ │ 文件上传     │
│ 视频流管理   │ │ OpenClaw     │ │ 视频转码     │
│ 告警/权限    │ │ 智能分析     │ │ 存储管理     │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 3.2 部署架构

```
                    ┌─────────────────┐
                    │   腾讯云服务器    │
                    │  101.43.35.139  │
                    │  Ubuntu 24.04   │
                    │  4核 16GB RAM  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Frontend    │  │    Backend    │  │   AI Service  │
│    :3000      │  │    :8094      │  │    :8095      │
│               │  │               │  │               │
│  React SPA    │  │   Go Gin      │  │  Python       │
│  (生产构建)   │  │   (生产)      │  │  FastAPI      │
└───────────────┘  └───────────────┘  └───────────────┘
                             │
                             ▼
                    ┌───────────────┐
                    │    MySQL      │
                    │    :3306      │
                    │   (生产DB)    │
                    └───────────────┘
```

---

## 📁 四、项目结构

```
xunjianbao/
├── frontend/                    # 前端项目 (React + TypeScript)
│   ├── src/
│   │   ├── components/          # React 组件
│   │   ├── pages/              # 页面组件
│   │   ├── store/              # Redux 状态管理
│   │   └── lib/                # 工具函数
│   ├── public/                 # 静态资源
│   └── package.json            # 前端依赖
│
├── backend/                     # 后端项目 (Go)
│   ├── cmd/server/main.go      # 服务入口
│   ├── internal/
│   │   ├── handler/            # HTTP处理器
│   │   ├── service/            # 业务逻辑
│   │   ├── repository/         # 数据访问
│   │   ├── model/              # 数据模型
│   │   └── middleware/         # 中间件
│   └── pkg/
│       ├── config/             # 配置管理
│       └── response/           # 响应封装
│
├── ai-service/                 # AI服务 (Python)
│   ├── app/
│   │   ├── routers/            # API路由
│   │   ├── services/           # 业务服务
│   │   └── models/             # 数据模型
│   └── requirements.txt        # Python依赖
│
├── docker-compose.yml          # Docker Compose配置
├── docker-compose.prod.yml     # 生产环境配置
├── .env.example                # 环境变量模板
└── README.md                   # 项目说明
```

---

## 🚀 五、部署流程

### 5.1 服务器环境准备

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 安装 Nginx (反向代理)
sudo apt install -y nginx

# 5. 配置防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 5.2 应用部署

```bash
# 1. 克隆代码
cd /opt
sudo git clone https://github.com/your-repo/xunjianbao.git
cd xunjianbao

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库密码、JWT密钥等

# 3. 构建并启动服务
docker-compose -f docker-compose.prod.yml up -d --build

# 4. 配置 Nginx 反向代理
sudo cp nginx.conf /etc/nginx/sites-available/xunjianbao
sudo ln -s /etc/nginx/sites-available/xunjianbao /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 验证部署

```bash
# 1. 检查服务状态
docker-compose ps

# 2. 检查服务健康
curl http://localhost:3000/health
curl http://localhost:8094/health
curl http://localhost:8095/health

# 3. 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service
```

---

## 📈 六、性能配置

### 6.1 后端优化

```go
// 数据库连接池配置
sqlDB.SetMaxIdleConns(5)           // 空闲连接数
sqlDB.SetMaxOpenConns(20)          // 最大连接数
sqlDB.SetConnMaxLifetime(time.Hour) // 连接生命周期

// GORM 日志（生产环境）
if !envConfig.IsDevelopment() {
    gormLogLevel = logger.Warn  // 降低日志噪音
}
```

### 6.2 Redis 缓存

```go
// Redis 初始化（非阻塞）
redisURL := os.Getenv("REDIS_URL")
if redisURL == "" {
    redisURL = "redis://localhost:6379"
}
redis.Init(redisURL)
```

---

## 🔐 七、安全配置

### 7.1 环境变量

```bash
# .env 文件必须包含以下敏感信息
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_chars
OPENAI_API_KEY=your_api_key
MINIO_ROOT_PASSWORD=your_minio_password
```

### 7.2 HTTPS 配置

```nginx
# 生产环境应配置 SSL 证书
server {
    listen 443 ssl http2;
    server_name xunjianbao.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # 其他配置...
}
```

---

## 📞 八、运维监控

### 8.1 日志管理

```bash
# 查看实时日志
docker-compose logs -f [service_name]

# 日志轮转配置
sudo nano /etc/logrotate.d/docker-compose
```

### 8.2 备份策略

```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec postgres pg_dump -U postgres xunjianbao > backup_$DATE.sql
```

---

## ❓ 九、常见问题

### Q1: 服务启动失败
```bash
# 检查端口占用
sudo netstat -tlnp | grep :8094

# 检查容器日志
docker-compose logs backend
```

### Q2: 前端构建失败
```bash
# 清理缓存
rm -rf frontend/node_modules/.vite
cd frontend && pnpm install
```

### Q3: 数据库连接失败
```bash
# 检查数据库状态
docker-compose ps postgres
docker exec -it postgres psql -U postgres -d xunjianbao
```

---

## 📞 十、技术支持

- **文档**: 查看项目 README.md
- **API文档**: 查看 docs/API.md
- **架构文档**: 查看 docs/ARCHITECTURE.md

---

**最后更新**: 2026-04-08
**版本**: v2.1.0
**维护者**: 巡检宝开发团队
