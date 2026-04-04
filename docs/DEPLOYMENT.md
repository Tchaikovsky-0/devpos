# 巡检宝 - Docker Compose 部署详解

> 版本: v1.0.0
> 更新日期: 2026-04-03

## 概述

本文档详细介绍巡检宝项目的 Docker Compose 部署方案，包括服务架构、环境配置、运维命令等。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                              │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   MySQL  │  │   Redis  │  │ Backend  │  │  Frontend│        │
│  │  :5432   │  │  :6379   │  │  :8094   │  │  :3000   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │AI Service│  │ OpenClaw │  │  MinIO   │  │ Prometheus│        │
│  │  :8095   │  │  :8096   │  │  :9000   │  │  :9090   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 服务说明

### 1. MySQL 数据库

```yaml
服务名: mysql
端口: 5432
镜像: mysql:8.0
用途: 主数据库，存储所有业务数据
```

**配置**:
- 字符集: `utf8mb4`
- 排序规则: `utf8mb4_unicode_ci`
- 最大连接数: 200
- 缓冲池大小: 256MB

**数据持久化**: `./data/mysql` 目录

### 2. Redis 缓存

```yaml
服务名: redis
端口: 6379
镜像: redis:7-alpine
用途: 缓存、Session、实时数据
```

**配置**:
- 最大内存: 256MB
- 淘汰策略: `allkeys-lru`

**数据持久化**: `./data/redis` 目录

### 3. Go 后端服务

```yaml
服务名: backend
端口: 8094
镜像: xunjianbao-backend (本地构建)
用途: API服务，处理业务逻辑
```

**环境变量**:
```yaml
DATABASE_URL: mysql://root:password@mysql:5432/xunjianbao
JWT_SECRET: <32字符密钥>
REDIS_URL: redis://redis:6379
OPENCLAW_URL: http://openclaw:8096
AI_SERVICE_URL: http://ai-service:8095
PORT: 8094
```

**健康检查**: `GET /health`

### 4. React 前端

```yaml
服务名: frontend
端口: 3000
镜像: xunjianbao-frontend (本地构建)
用途: Web UI
```

**环境变量**:
```yaml
VITE_API_BASE_URL: http://localhost:8094
VITE_WS_URL: ws://localhost:8094
```

**功能**:
- 监控大屏
- 视频流管理
- 告警管理
- AI 交互界面

### 5. AI 服务 (Python YOLO)

```yaml
服务名: ai-service
端口: 8095
镜像: xunjianbao-ai (本地构建)
用途: YOLO 目标检测服务
```

**环境变量**:
```yaml
MODEL_PATH: /models
GPU_ENABLED: "false"
MAX_BATCH_SIZE: "4"
```

**健康检查**: `GET /health`

### 6. OpenClaw AI Agent

```yaml
服务名: openclaw
端口: 8096
镜像: openclaw (外部服务)
用途: AI 对话、报告生成、NL2SQL
```

**功能**:
- AI 值班分析师
- 一键报告生成
- 智能运维问答

### 7. MinIO 对象存储

```yaml
服务名: minio
端口: 9000 (API), 9001 (Console)
镜像: minio/minio
用途: 文件存储、视频存储
```

**配置**:
- Root 用户: `minioadmin`
- Root 密码: `minioadmin`
- 存储路径: `/data`

**数据持久化**: `./data/minio` 目录

### 8. Prometheus 监控

```yaml
服务名: prometheus
端口: 9090
镜像: prom/prometheus
用途: 指标收集和存储
```

**配置**:
- 保留时间: 15天
- 采集间隔: 15秒

**数据持久化**: `./data/prometheus` 目录

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/xunjianbao.git
cd xunjianbao
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
vim .env
```

**必填配置**:
```env
# 数据库
DATABASE_URL=mysql://root:your_password@mysql:5432/xunjianbao

# JWT 密钥 (至少32字符)
JWT_SECRET=your-super-secret-key-at-least-32-chars

# OpenClaw (可选)
OPENCLAW_URL=http://openclaw:8096
OPENCLAW_TOKEN=your_openclaw_token

# AI 服务 (可选)
AI_SERVICE_URL=http://ai-service:8095
```

### 3. 构建并启动

```bash
# 构建前端镜像
docker build -t xunjianbao-frontend ./frontend

# 构建后端镜像
docker build -t xunjianbao-backend ./backend

# 构建 AI 服务镜像
docker build -t xunjianbao-ai ./ai-service

# 启动所有服务
docker-compose up -d
```

### 4. 验证服务

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 健康检查
curl http://localhost:8094/health
```

**预期输出**:
```json
{"status":"ok","version":"1.0.0"}
```

## 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | Web UI |
| 后端 API | http://localhost:8094 | REST API |
| Swagger UI | http://localhost:8094/swagger/index.html | API 文档 |
| OpenClaw | http://localhost:8096 | AI Agent |
| AI 服务 | http://localhost:8095 | YOLO 检测 |
| MinIO Console | http://localhost:9001 | 对象存储 |
| Prometheus | http://localhost:9090 | 监控指标 |

## 运维命令

### 启动/停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启指定服务
docker-compose restart backend

# 停止并删除数据卷
docker-compose down -v
```

### 日志查看

```bash
# 查看所有日志
docker-compose logs -f

# 查看指定服务日志
docker-compose logs -f backend

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 服务管理

```bash
# 进入后端容器
docker exec -it xunjianbao-backend bash

# 进入数据库
docker exec -it xunjianbao-mysql mysql -u root -p

# 查看服务状态
docker-compose ps

# 检查服务健康
curl http://localhost:8094/health
curl http://localhost:8095/health
```

### 数据库操作

```bash
# 备份数据库
docker exec xunjianbao-mysql mysqldump -u root -p xunjianbao > backup.sql

# 恢复数据库
docker exec -i xunjianbao-mysql mysql -u root -p xunjianbao < backup.sql

# 查看数据库大小
docker exec xunjianbao-mysql mysql -u root -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'xunjianbao';"
```

### 清理

```bash
# 清理未使用的镜像
docker image prune -f

# 清理未使用的卷
docker volume prune -f

# 完全重建
docker-compose down --rmi all -v
docker-compose up -d --build
```

## 生产环境部署

### 1. SSL 证书

```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
```

### 2. Nginx 配置

```nginx
server {
    listen 80;
    server_name xunjianbao.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name xunjianbao.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # 前端
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
    }

    # 后端 API
    location /api {
        proxy_pass http://backend:8094;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend:8094;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. 环境变量安全

```bash
# 使用 Docker Secrets
echo "your-database-password" | docker secret create db_password -
echo "your-jwt-secret" | docker secret create jwt_secret -
```

### 4. 资源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 故障排查

### 服务无法启动

```bash
# 1. 检查端口占用
lsof -i :8094

# 2. 查看错误日志
docker-compose logs backend

# 3. 检查环境变量
docker exec xunjianbao-backend env | grep -E "DATABASE|JWT"
```

### 数据库连接失败

```bash
# 1. 检查 MySQL 状态
docker-compose ps mysql

# 2. 测试连接
docker exec -it xunjianbao-backend ping mysql

# 3. 查看 MySQL 日志
docker-compose logs mysql
```

### 前端无法访问后端

```bash
# 1. 检查后端健康
curl http://localhost:8094/health

# 2. 检查网络连通性
docker network inspect xunjianbao_default

# 3. 查看前端代理配置
docker-compose logs frontend | grep proxy
```

### 性能问题

```bash
# 1. 查看资源使用
docker stats

# 2. 查看慢查询日志
docker exec xunjianbao-mysql cat /var/log/mysql/slow.log

# 3. 分析 API 响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8094/api/v1/dashboard/stats
```

## 数据备份

### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec xunjianbao-mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" xunjianbao > $BACKUP_DIR/db_$DATE.sql

# 备份 MinIO 数据
docker run --rm -v xunjianbao_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/minio_$DATE.tar.gz -C /data .

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

## 监控告警

### Prometheus 告警规则

```yaml
groups:
- name: xunjianbao
  rules:
  - alert: BackendDown
    expr: up{job="backend"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Backend service is down"

  - alert: HighResponseTime
    expr: http_request_duration_seconds{quantile="0.95"} > 2
    for: 5m
    labels:
      severity: warning
```

## 更多信息

- [项目文档](../README.md)
- [API 文档](./API.md)
- [快速开始](./QUICK_START.md)
- [开发指南](./QUICK_START.md#开发环境搭建)
