# 巡检宝 - 腾讯云手动部署指南

> **部署目标**: 腾讯云服务器
> **服务器 IP**: 101.43.35.139
> **操作系统**: Ubuntu Server 24.04 LTS
> **配置**: 4核 CPU, 16GB RAM, 180GB SSD

---

## 📋 部署前准备

### 1.1 连接到服务器

使用以下命令连接到服务器（使用您的密码）：

```bash
ssh root@101.43.35.139
# 输入密码: Tchaikovsky_0
```

### 1.2 检查服务器状态

连接成功后，执行以下命令检查系统状态：

```bash
# 查看系统信息
uname -a
# 输出应该类似: Linux Ubuntu-OgfC 6.8.0-49-generic #49-Ubuntu SMP ...

# 查看磁盘空间
df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/vda1      176G   31G  136G  18% /

# 查看内存
free -h
#               total        used        free      shared  buff/cache   available
# Mem:            15Gi       1.1Gi        13Gi       45Mi       1.3Gi        13Gi

# 查看 CPU
lscpu | grep -E "^CPU\(s\)|^Model name|^Architecture"
# CPU(s):              4
# Model name:          Intel Xeon Processor (Skylake, IBRS)
# Architecture:         x86_64
```

---

## 🔧 步骤 1: 系统环境配置

### 1.1 更新系统包

```bash
apt update && apt upgrade -y
```

### 1.2 安装必要工具

```bash
apt install -y curl wget git vim unzip software-properties-common
```

---

## 🐳 步骤 2: 安装 Docker

### 2.1 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 验证安装
docker --version
# 输出: Docker version 26.0.0, build xxxxx

# 将当前用户添加到 docker 组（避免每次用 sudo）
usermod -aG docker root
```

### 2.2 安装 Docker Compose

```bash
# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
# 输出: Docker Compose version v2.24.0
```

---

## 🌐 步骤 3: 安装 Nginx

```bash
# 安装 Nginx
apt install -y nginx

# 启动 Nginx
systemctl start nginx
systemctl enable nginx

# 测试 Nginx
curl http://localhost
# 应该看到 Nginx 欢迎页面
```

---

## 🔥 步骤 4: 配置防火墙

```bash
# 配置防火墙规则
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8094/tcp  # Backend API
ufw allow 3000/tcp  # Frontend

# 启用防火墙（如果提示确认，输入 'y'）
echo "y" | ufw enable

# 查看防火墙状态
ufw status
```

---

## 📁 步骤 5: 创建应用目录

```bash
# 创建应用目录
mkdir -p /opt/xunjianbao
mkdir -p /opt/xunjianbao/logs
mkdir -p /opt/xunjianbao-backup

# 设置目录权限
chmod -R 755 /opt/xunjianbao
```

---

## ⚙️ 步骤 6: 配置环境变量

创建 `.env` 文件：

```bash
cd /opt/xunjianbao
nano .env
```

粘贴以下内容（**请务必修改密码和密钥**）：

```bash
# 数据库配置
POSTGRES_PASSWORD=xunjianbao_secure_password_2024
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=xunjianbao

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 密钥（请修改为安全的随机字符串，至少32字符）
JWT_SECRET=xunjianbao_jwt_secret_key_32chars_minimum_required_here_2024

# MinIO 配置
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# API 密钥（请修改为真实密钥）
OPENAI_API_KEY=sk-your-openai-api-key-here

# 应用配置
APP_ENV=production
PORT=8094
```

保存文件（Ctrl+O, Enter, Ctrl+X）

---

## 🔄 步骤 7: 上传代码

### 方法 1: Git Clone（推荐）

如果您的代码在 Git 仓库中：

```bash
cd /opt/xunjianbao
git clone https://your-git-repo-url/xunjianbao.git .
git checkout main
```

### 方法 2: 手动上传

如果您在本地机器上，可以使用 scp 上传：

```bash
# 在本地机器上执行（不是服务器上）
scp -r /path/to/xunjianbao/* root@101.43.35.139:/opt/xunjianbao/
```

---

## 🐳 步骤 8: 创建 Docker Compose 配置

如果项目中没有 `docker-compose.prod.yml`，创建它：

```bash
cd /opt/xunjianbao
nano docker-compose.prod.yml
```

粘贴以下内容：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: xunjianbao-postgres
    restart: always
    environment:
      POSTGRES_DB: xunjianbao
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:6-alpine
    container_name: xunjianbao-redis
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: xunjianbao-backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: xunjianbao
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8094:8094"
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8094/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: xunjianbao-ai
    restart: always
    depends_on:
      - backend
    environment:
      API_BASE_URL: http://backend:8094
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "8095:8095"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: xunjianbao-frontend
    restart: always
    environment:
      API_BASE_URL: http://101.43.35.139:8094
      WS_BASE_URL: ws://101.43.35.139:8094
    ports:
      - "3000:80"

volumes:
  postgres_data:
  redis_data:
```

保存文件

---

## 🔀 步骤 9: 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置文件
nano /etc/nginx/sites-available/xunjianbao
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name 101.43.35.139;

    # Frontend (React SPA)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8094;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8094;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

保存文件，然后启用配置：

```bash
# 移除默认配置
rm -f /etc/nginx/sites-enabled/default

# 启用我们的配置
ln -s /etc/nginx/sites-available/xunjianbao /etc/nginx/sites-enabled/

# 测试 Nginx 配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

## 🚀 步骤 10: 构建并启动服务

```bash
cd /opt/xunjianbao

# 停止现有容器（如果存在）
docker-compose -f docker-compose.prod.yml down

# 构建 Docker 镜像
docker-compose -f docker-compose.prod.yml build --no-cache

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

**预期输出**：
```
NAME                IMAGE               COMMAND                  SERVICE   CREATED   STATUS   PORTS
xunjianbao-postgres   postgres:14-alpine  "docker-entrypoint.s…"   postgres  ...       Up      0.0.0.0:5432->5432/tcp
xunjianbao-redis     redis:6-alpine     "docker-entrypoint.s…"   redis     ...       Up      0.0.0.0:6379->6379/tcp
xunjianbao-backend   xunjianbao-backend  "/server"                backend   ...       Up      0.0.0.0:8094->8094/tcp
xunjianbao-frontend  xunjianbao-frontend "/docker-entrypoint…"   frontend  ...       Up      0.0.0.0:3000->80/tcp
```

---

## ✅ 步骤 11: 验证部署

### 11.1 检查容器状态

```bash
docker-compose -f docker-compose.prod.yml ps
```

所有容器状态应该都是 `Up`

### 11.2 检查服务健康

```bash
# 检查 Backend API
curl http://localhost:8094/health

# 检查 Frontend
curl http://localhost:3000

# 检查通过 Nginx
curl http://localhost/api/health
```

### 11.3 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 只看 Backend 日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 查看最近 50 行日志
docker-compose -f docker-compose.prod.yml logs --tail=50
```

---

## 🌐 步骤 12: 访问应用

现在您可以通过以下地址访问应用：

| 服务 | 地址 | 说明 |
|------|------|------|
| **Frontend** | http://101.43.35.139:3000 | React SPA 应用 |
| **Backend API** | http://101.43.35.139:8094 | Go API 服务 |
| **Nginx** | http://101.43.35.139 | 通过 Nginx 反向代理访问 |

### 测试 API

```bash
# 健康检查
curl http://101.43.35.139/api/health

# 预期响应: {"status":"ok","timestamp":"..."}
```

---

## 🔧 运维命令

### 启动/停止服务

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml start

# 停止服务
docker-compose -f docker-compose.prod.yml stop

# 重启服务
docker-compose -f docker-compose.prod.yml restart
```

### 查看日志

```bash
# 实时查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看指定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 查看最近 100 行日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart backend
```

### 更新部署

```bash
cd /opt/xunjianbao

# 拉取最新代码
git pull origin main

# 重新构建
docker-compose -f docker-compose.prod.yml build

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🛡️ 安全建议

### 1. 修改默认密码

立即修改以下密码：
- [ ] PostgreSQL 密码 (`POSTGRES_PASSWORD`)
- [ ] Redis 密码（如果启用）
- [ ] JWT Secret (`JWT_SECRET`)
- [ ] MinIO 密码
- [ ] OpenAI API Key

### 2. 配置 HTTPS（生产环境）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d yourdomain.com

# 自动续期
systemctl enable certbot.timer
```

### 3. 定期更新

```bash
# 定期更新系统和 Docker
apt update && apt upgrade -y
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🆘 故障排查

### 问题 1: 容器启动失败

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps -a

# 查看容器日志
docker-compose -f docker-compose.prod.yml logs [service_name]

# 重启单个容器
docker-compose -f docker-compose.prod.yml restart [service_name]
```

### 问题 2: 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 8094

# 或者
lsof -i :8094
```

### 问题 3: 数据库连接失败

```bash
# 检查 PostgreSQL 容器
docker exec -it xunjianbao-postgres psql -U postgres

# 测试连接
docker exec -it xunjianbao-postgres pg_isready -U postgres
```

### 问题 4: 磁盘空间不足

```bash
# 清理未使用的 Docker 资源
docker system prune -a

# 清理日志
truncate -s 0 /var/log/nginx/*.log

# 查看磁盘使用
df -h
```

---

## 📞 技术支持

如遇到问题，请提供以下信息：

1. 执行的所有命令及输出
2. `docker-compose ps` 输出
3. 相关服务的日志：`docker-compose logs [service_name]`
4. 服务器系统信息：`uname -a && df -h`

---

**最后更新**: 2026-04-08
**版本**: v2.1.0
