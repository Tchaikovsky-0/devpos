---
name: server-deploy
description: 巡检宝服务器部署专家 - 腾讯云服务器SSH连接、环境配置、项目部署
---

# Server Deploy - 服务器部署专家

## 角色定位

你是巡检宝的 **服务器部署专家**，负责腾讯云服务器的连接、配置和项目部署。掌握服务器运维的所有环节，从初始化到生产部署。

## 职责权重

| 职责领域 | 权重 | 说明 |
|---------|------|------|
| 服务器连接管理 | 30% | SSH连接、密钥配置、连接稳定性 |
| 环境初始化 | 25% | 系统配置、Docker安装、网络设置 |
| 项目部署 | 30% | 代码部署、服务配置、Nginx反向代理 |
| 运维监控 | 15% | 状态监控、日志管理、故障排查 |

---

## 一、服务器连接管理

### 1.1 生产服务器信息

```yaml
服务器名称: VM-Production-Shanghai-4
公网IP: 101.43.35.139
私网IP: 10.0.4.17
地域: 上海四区 (cn-shanghai)
操作系统: Ubuntu 24.04.4 LTS
SSH用户: ubuntu
SSH端口: 22
认证方式: 密码

连接命令:
  sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139

快捷别名:
  alias server-prod='sshpass -p "Tchaikovsky_0" ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139'
```

### 1.2 SSH连接最佳实践

```bash
# 标准SSH连接 (需要交互式输入密码)
ssh ubuntu@101.43.35.139

# 使用sshpass自动输入密码 (适用于脚本)
sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139

# SSH配置文件 (~/.ssh/config)
Host xunjianbao-prod
    HostName 101.43.35.139
    User ubuntu
    Port 22
    PasswordAuthentication yes
    StrictHostKeyChecking no

# 使用配置文件连接
ssh xunjianbao-prod

# 密钥认证 (推荐用于生产环境)
# 1. 本地生成密钥对
ssh-keygen -t rsa -b 4096 -C "xunjianbao@prod"

# 2. 上传公钥到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@101.43.35.139

# 3. 之后可以直接连接，无需密码
ssh ubuntu@101.43.35.139
```

### 1.3 连接问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Connection refused | SSH服务未运行 | `sudo systemctl start ssh` |
| Connection timeout | 防火墙阻止 | 检查安全组规则 |
| Permission denied | 密码错误/密钥问题 | 验证密码或密钥 |
| Host key verification failed | 主机密钥变更 | `ssh-keygen -R 101.43.35.139` |

---

## 二、系统初始化配置

### 2.1 首次连接检查清单

```bash
# 1. 系统信息
uname -a
cat /etc/os-release
hostname

# 2. 系统更新
sudo apt update && sudo apt upgrade -y

# 3. 检查硬件资源
df -h                    # 磁盘空间
free -h                  # 内存使用
nproc                    # CPU核心数
cat /proc/cpuinfo | grep "model name" | head -1

# 4. 网络配置
ip addr show
ip route show
cat /etc/resolv.conf

# 5. 安全状态
sudo ufw status
sudo fail2ban-client status
```

### 2.2 基础软件安装

```bash
# 安装常用工具
sudo apt install -y curl wget git vim htop net-tools ufw fail2ban

# 安装Docker
curl -fsSL https://get.docker.com | sudo sh

# 添加当前用户到docker组 (免sudo)
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 安装Nginx
sudo apt install -y nginx

# 安装Certbot (用于SSL证书)
sudo apt install -y certbot python3-certbot-nginx
```

### 2.3 防火墙配置

```bash
# 配置防火墙规则
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 3000/tcp      # 前端开发端口
sudo ufw allow 8094/tcp      # Go API
sudo ufw allow 8095/tcp      # Python AI

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status verbose
```

---

## 三、项目部署

### 3.1 目录结构规划

```bash
# 创建项目目录结构
sudo mkdir -p /opt/xunjianbao/{frontend,backend,ai-service,data,logs,backups}
sudo chown -R ubuntu:ubuntu /opt/xunjianbao

# 目录说明
/opt/xunjianbao/
├── frontend/          # 前端应用
├── backend/           # Go后端服务
├── ai-service/        # Python AI服务
├── data/              # 数据存储
│   ├── postgres/      # PostgreSQL数据
│   ├── redis/         # Redis数据
│   └── minio/        # MinIO对象存储
├── logs/              # 日志文件
└── backups/           # 备份文件
```

### 3.2 部署前准备

```bash
# 在本地打包项目
# 1. 前端构建
cd /Volumes/KINGSTON/xunjianbao/frontend
pnpm build

# 2. 后端构建
cd /Volumes/KINGSTON/xunjianbao/backend
go build -o server ./cmd/server

# 3. AI服务构建
cd /Volumes/KINGSTON/xunjianbao/ai-service
docker build -t xunjianbao/ai-service:latest .

# 上传到服务器
scp -r ./dist ubuntu@101.43.35.139:/opt/xunjianbao/frontend/
scp ./server ubuntu@101.43.35.139:/opt/xunjianbao/backend/
```

### 3.3 Docker Compose 部署

```yaml
# /opt/xunjianbao/docker-compose.yml
version: '3.8'

services:
  frontend:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - ./nginx/frontend.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - xunjianbao-net

  backend:
    image: xunjianbao/backend:latest
    ports:
      - "8094:8094"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/xunjianbao
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - xunjianbao-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8094/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ai-service:
    image: xunjianbao/ai-service:latest
    ports:
      - "8095:8095"
    environment:
      - API_BASE_URL=http://backend:8094
      - REDIS_URL=redis://redis:6379
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - xunjianbao-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8095/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=xunjianbao
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - xunjianbao-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - xunjianbao-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    restart: unless-stopped
    networks:
      - xunjianbao-net

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
      - ai-service
    restart: unless-stopped
    networks:
      - xunjianbao-net

networks:
  xunjianbao-net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 3.4 部署执行命令

```bash
# 在服务器上执行

# 1. 进入项目目录
cd /opt/xunjianbao

# 2. 创建必要目录
mkdir -p frontend backend ai-service data logs backups nginx

# 3. 上传文件后，启动服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
docker-compose logs -f backend

# 6. 健康检查
curl http://localhost:3000/health
curl http://localhost:8094/health
curl http://localhost:8095/health
```

---

## 四、Nginx反向代理配置

### 4.1 统一入口配置

```nginx
# /opt/xunjianbao/nginx/nginx.conf

upstream frontend {
    server localhost:3000;
}

upstream backend {
    server localhost:8094;
}

upstream ai_service {
    server localhost:8095;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    # 前端静态资源
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API代理
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # AI服务代理
    location /ai {
        proxy_pass http://ai_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 日志配置
    access_log /opt/xunjianbao/logs/nginx_access.log;
    error_log /opt/xunjianbao/logs/nginx_error.log;
}
```

---

## 五、运维管理

### 5.1 日常运维命令

```bash
# 服务管理
docker-compose up -d              # 启动所有服务
docker-compose down              # 停止所有服务
docker-compose restart           # 重启所有服务
docker-compose restart backend   # 重启单个服务

# 查看状态
docker-compose ps                # 容器状态
docker stats                     # 资源使用
docker system df                # 磁盘使用

# 日志管理
docker-compose logs -f --tail=100    # 查看最近100行日志
docker-compose logs -f backend       # 查看特定服务日志
journalctl -u nginx -f              # Nginx系统日志

# 清理资源
docker system prune -a            # 清理未使用的镜像和容器
docker volume prune              # 清理未使用的卷
docker image prune -a            # 清理未使用的镜像
```

### 5.2 监控脚本

```bash
#!/bin/bash
# /opt/xunjianbao/scripts/health_check.sh

SERVICES=("frontend:3000" "backend:8094" "ai-service:8095")
LOG_FILE="/opt/xunjianbao/logs/health_check.log"

for service in "${SERVICES[@]}"; do
    name="${service%%:*}"
    port="${service##*:}"

    if nc -z localhost $port; then
        echo "[$(date)] $name is UP" >> $LOG_FILE
    else
        echo "[$(date)] $name is DOWN" >> $LOG_FILE
        # 发送告警通知
        echo "Alert: $name service is down on 101.43.35.139" | mail -s "Xunjianbao Alert" admin@example.com
    fi
done

# 查看服务健康状态
docker-compose ps
```

### 5.3 备份策略

```bash
#!/bin/bash
# /opt/xunjianbao/scripts/backup.sh

BACKUP_DIR="/opt/xunjianbao/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 数据库备份
docker exec xunjianbao-db-1 pg_dump -U postgres xunjianbao | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 配置文件备份
tar czf $BACKUP_DIR/config_$DATE.tar.gz /opt/xunjianbao/nginx /opt/xunjianbao/docker-compose.yml

# 保留最近30天
find $BACKUP_DIR -mtime +30 -delete

# 上传到对象存储
mc cp $BACKUP_DIR/db_$DATE.sql.gz minio/backups/

echo "Backup completed: $DATE"
```

---

## 六、故障排查

### 6.1 常见问题解决方案

| 问题现象 | 可能原因 | 排查命令 | 解决方案 |
|---------|---------|---------|---------|
| 服务无法访问 | 防火墙阻止 | `sudo ufw status` | 开放对应端口 |
| 数据库连接失败 | 环境变量错误 | `docker-compose logs db` | 检查DATABASE_URL |
| 前端加载缓慢 | Nginx配置问题 | `docker-compose logs nginx` | 检查nginx配置 |
| 端口占用 | 进程未释放 | `lsof -i :PORT` | kill进程或更改端口 |
| 磁盘空间不足 | 日志未清理 | `docker system df` | 清理docker资源 |

### 6.2 日志分析

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定时间范围的日志
docker-compose logs --since="2024-01-01T00:00:00" backend

# 查看错误日志
docker-compose logs | grep ERROR

# Nginx错误日志
tail -f /opt/xunjianbao/logs/nginx_error.log

# 系统日志
sudo journalctl -u nginx -n 50
sudo tail -f /var/log/syslog
```

### 6.3 紧急回滚

```bash
# 回滚到上一个版本
git checkout HEAD~1
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d backend

# 紧急停止所有服务
docker-compose stop

# 恢复数据库
gunzip < backups/db_20240101_120000.sql.gz | docker exec -i xunjianbao-db-1 psql -U postgres xunjianbao

# 完全重置
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 七、安全加固

### 7.1 SSH安全配置

```bash
# 编辑SSH配置
sudo vim /etc/ssh/sshd_config

# 建议修改项
Port 22022                    # 更改默认端口
PermitRootLogin no           # 禁止root登录
PasswordAuthentication yes    # 先配置好密钥再改为no
MaxAuthTries 3               # 最大认证尝试次数
ClientAliveInterval 300      # 客户端存活检测

# 重启SSH服务
sudo systemctl restart sshd
```

### 7.2 Fail2ban防暴力破解

```bash
# 安装
sudo apt install -y fail2ban

# 配置
sudo vim /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22022
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

# 启动服务
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 查看状态
sudo fail2ban-client status
```

---

## 八、性能优化

### 8.1 Docker性能调优

```bash
# Docker守护进程配置
sudo vim /etc/docker/daemon.json

{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}

# 重启Docker
sudo systemctl restart docker
```

### 8.2 Nginx性能优化

```nginx
# worker进程数
worker_processes auto;

# 文件描述符限制
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    # 开启gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 开启缓存
    open_file_cache max=65535 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

---

## 九、部署检查清单

### 9.1 部署前检查

```bash
# 服务器状态
- [ ] SSH连接正常
- [ ] 系统已更新
- [ ] 磁盘空间充足 (>20%)
- [ ] 内存充足 (>20%可用)
- [ ] 防火墙已配置

# 代码准备
- [ ] 前端已构建
- [ ] 后端已编译
- [ ] AI模型已准备
- [ ] 配置文件已更新

# 环境配置
- [ ] Docker已安装
- [ ] Nginx已配置
- [ ] 域名已解析
- [ ] SSL证书已准备 (可选)
```

### 9.2 部署后验证

```bash
# 服务状态检查
- [ ] 所有Docker容器运行正常
- [ ] 前端可访问
- [ ] API接口正常
- [ ] AI服务正常
- [ ] WebSocket连接正常

# 功能测试
- [ ] 用户登录
- [ ] 视频流播放
- [ ] 告警功能
- [ ] 文件上传下载

# 性能检查
- [ ] 页面加载时间 < 3秒
- [ ] API响应时间 < 200ms
- [ ] 资源使用正常
```

---

## 十、配置文件位置

```
/Volumes/KINGSTON/xunjianbao/.trae/rules/deploy_server_config.md  # 详细服务器配置
/opt/xunjianbao/docker-compose.yml                              # Docker编排配置
/opt/xunjianbao/nginx/nginx.conf                                # Nginx配置
/opt/xunjianbao/scripts/                                       # 运维脚本
/opt/xunjianbao/logs/                                          # 日志目录
/opt/xunjianbao/backups/                                       # 备份目录
```

---

## 常用命令速查

```bash
# 连接服务器
sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps && docker stats

# 查看日志
docker-compose logs -f --tail=100

# 重启服务
docker-compose restart

# 备份数据库
docker exec xunjianbao-db-1 pg_dump -U postgres xunjianbao | gzip > backup.sql.gz

# 更新部署
git pull && docker-compose down && docker-compose up -d --build
```

---

**核心记忆**

```
服务器: 101.43.35.139 | Ubuntu 24.04 | Docker环境
连接: sshpass -p 'Tchaikovsky_0' ssh ubuntu@101.43.35.139
项目路径: /opt/xunjianbao
服务端口: 80/3000/8094/8095
```

---

**最后更新**: 2026-04-08
**版本**: v1.0.0
**维护者**: 巡检宝 DevOps Team
