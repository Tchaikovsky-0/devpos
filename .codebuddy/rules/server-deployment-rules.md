# 巡检宝 - 服务器部署规则 (宪法级)

> **核心原则**: 每次操作前确认目标，每步操作后验证结果，绝不猜测
> **规则级别**: 宪法级 - 所有服务器操作必须严格遵守
> **最后更新**: 2026-04-08

---

## 一、服务器身份信息（唯一权威来源）

```yaml
唯一正确的生产服务器:
  云服务: 腾讯云轻量应用服务器 (Lighthouse)
  实例ID: lhins-kuy7gg1y
  实例名称: OpenClaw(龙虾)-1eQB
  公网IP: 150.158.57.221
  地域: ap-shanghai (上海)
  操作系统: Ubuntu (LINUX_UNIX)
  状态: RUNNING

连接方式（按优先级）:
  1. TAT (自动化助手): 通过 call_integration 工具调用
  2. SSH: root@150.158.57.221（需要微信扫码，仅 TAT 不可用时使用）

绝对禁止连接的服务器:
  ❌ 101.43.35.139 (lhins-cuohcy32) — 这是 CVM 实例，不是 Lighthouse，TAT 不支持
  ❌ 任何其他 IP — 除非用户明确指定
```

### 1.1 连接前强制确认

**每次执行服务器操作前，必须先运行以下命令确认实例：**

```bash
# TAT 方式（推荐）
call_integration(lighthouse, describe_running_instances, {"Region": "ap-shanghai"})

# 确认返回结果包含 lhins-kuy7gg1y 后，才执行后续操作
```

**禁止行为：**
```yaml
🚫 不确认实例 ID 就直接操作
🚫 使用记忆中的 IP 地址（可能过期）
🚫 假设服务器配置（必须先检查）
🚫 连接非 Lighthouse 实例执行部署操作
```

---

## 二、call_integration 工具调用规则

### 2.1 正确的调用方式

**参数顺序必须严格遵守：`integrationId` → `toolName` → `arguments`**

```
✅ 正确: integrationId="lighthouse", toolName="execute_command", arguments="{...}"
❌ 错误: integrationId="lighthouse", arguments="{...}", toolName="execute_command"  ← 会失败
```

### 2.2 TAT 工具参数

| 工具 | 必需参数 | 说明 |
|------|---------|------|
| `execute_command` | `Command`, `InstanceId`, `Region` | 远程执行命令 |
| `deploy_project_preparation` | `FolderPath`, `InstanceId`, `Region`, `ProjectName` | 上传文件 |
| `create_firewall_rules` | `InstanceId`, `Region`, 规则参数 | 防火墙规则 |
| `deploy_success` | `InstanceId`, `Region` | 标记部署成功 |
| `describe_running_instances` | `Region` | 查询运行实例 |
| `describe_command_tasks` | `InstanceId`, `Region`, `InvokeId` | 查询任务结果 |

### 2.3 命令执行限制

```yaml
TAT 单次命令限制:
  超时: 60 秒
  ❌ 不要在单次命令中放 sleep > 5
  ❌ 不要在单次命令中执行耗时操作（构建、大数据处理等）
  ✅ 耗时操作拆分为多个命令，或用 nohup & 后台运行

TAT 命令输出限制:
  ❌ 单次输出不要超过 200KB
  ✅ 用 head/tail 限制输出
  ✅ 多步操作用 echo '=== STEP N ===' 分隔
```

---

## 三、服务器基础设施配置

### 3.1 服务清单

| 服务 | 端口 | 管理方式 | 状态检查命令 |
|------|------|---------|-------------|
| Nginx (前端) | 80 | systemctl | `systemctl is-active nginx` |
| Go 后端 | 8094 | systemctl (xunjianbao.service) | `systemctl is-active xunjianbao` |
| MySQL | 3306 | systemctl | `mysqladmin ping -u root -proot123` |
| Redis | 6379 | systemctl | `redis-cli ping` |

### 3.2 关键配置文件

| 文件 | 路径 | 用途 |
|------|------|------|
| Nginx 站点配置 | `/etc/nginx/conf.d/default.conf` | 前端 + API 反向代理 |
| Systemd 服务 | `/etc/systemd/system/xunjianbao.service` | Go 后端进程管理 |
| 后端二进制 | `/opt/xunjianbao/backend/server` | Go 编译产物 |
| 前端静态文件 | `/opt/xunjianbao/frontend/` | npm build 产物 |
| 后端日志 | `/opt/xunjianbao/logs/backend.log` | 运行日志 |
| 环境变量 | systemd service 的 Environment 行 | 所有配置 |

### 3.3 正确的环境变量

```ini
# /etc/systemd/system/xunjianbao.service [Service] 段
Environment=PORT=8094
Environment=ENVIRONMENT=production
Environment=GIN_MODE=release
Environment=LOG_LEVEL=info
Environment=DATABASE_URL=root:root123@tcp(127.0.0.1:3306)/xunjianbao?charset=utf8mb4&parseTime=True&loc=Local
Environment=REDIS_URL=redis://127.0.0.1:6379
Environment=JWT_SECRET=xunjianbao-jwt-secret-key-2026-production-key-minimum-32-characters-long
Environment=CORS_ALLOWED_ORIGINS=http://150.158.57.221,http://localhost:3000
```

**环境变量关键注意事项：**
```yaml
✅ ENVIRONMENT=production（不是 DEPLOY_ENV，Go 代码读的是 ENVIRONMENT）
✅ GIN_MODE=release（生产环境必须）
✅ REDIS_URL=redis://127.0.0.1:6379（当前 Redis 无密码，不要加密码）
✅ CORS_ALLOWED_ORIGINS 必须包含服务器公网 IP
✅ JWT_SECRET 必须 >= 32 字符
❌ DEPLOY_ENV=xxx（无效，代码不读这个变量）
❌ REDIS_URL=redis://:password@host（格式错误，Go url.Parse 会解析失败）
```

### 3.4 正确的 Nginx 配置

```nginx
# /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /opt/xunjianbao/frontend;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;
    client_max_body_size 100m;

    # API 代理 -> 本机 Go 后端
    location /api/ {
        proxy_pass http://127.0.0.1:8094;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://127.0.0.1:8094;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:8094;
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

**Nginx 关键注意事项：**
```yaml
✅ root 必须指向 /opt/xunjianbao/frontend（不是 Docker 容器路径）
✅ proxy_pass 必须指向 http://127.0.0.1:8094（不是 backend:8094）
✅ /etc/nginx/sites-enabled/ 目录必须为空（删除旧 Docker 配置）
✅ 前端文件权限必须为 755
❌ root: /usr/share/nginx/html（Docker 容器内路径，裸机部署不能用）
❌ proxy_pass: http://backend:8094（Docker 内部 DNS，裸机没有）
```

---

## 四、标准部署流程

### 4.1 完整部署步骤

```
Step 1: 确认实例
  → describe_running_instances(Region=ap-shanghai)
  → 确认 lhins-kuy7gg1y 存在

Step 2: 本地构建
  → cd frontend && pnpm install && pnpm build
  → cd backend && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server
  → 验证: frontend/dist/index.html 存在, backend/server 文件存在

Step 3: 上传文件
  → SSH: rsync -avz --delete frontend/dist/ root@150.158.57.221:/opt/xunjianbao/frontend/
  → SSH: scp backend/server root@150.158.57.221:/opt/xunjianbao/backend/server

Step 4: 服务器部署
  → TAT: chmod +x /opt/xunjianbao/backend/server
  → TAT: chmod -R 755 /opt/xunjianbao/frontend/
  → TAT: systemctl stop xunjianbao; sleep 1; systemctl start xunjianbao
  → TAT: nginx -t && systemctl restart nginx

Step 5: 验证
  → TAT: systemctl is-active xunjianbao nginx
  → TAT: curl -s http://127.0.0.1:8094/api/v1/health
  → TAT: curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:80/
  → 浏览器: 访问 http://150.158.57.221
```

### 4.2 仅更新前端

```bash
# 1. 本地构建
cd frontend && pnpm build
# 2. 上传
rsync -avz --delete frontend/dist/ root@150.158.57.221:/opt/xunjianbao/frontend/
# 3. 服务器刷新权限
# TAT: chmod -R 755 /opt/xunjianbao/frontend/
```

### 4.3 仅更新后端

```bash
# 1. 本地构建
cd backend && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server
# 2. 上传
scp backend/server root@150.158.57.221:/opt/xunjianbao/backend/server
# 3. 重启
# TAT: systemctl restart xunjianbao
# 4. 验证（等 5 秒）
# TAT: sleep 5 && systemctl is-active xunjianbao && curl -s http://127.0.0.1:8094/api/v1/health
```

---

## 五、常见故障排查

### 5.1 后端启动失败

```yaml
症状: systemctl status xunjianbao 显示 failed/activating

排查步骤:
  1. 查看日志: journalctl -u xunjianbao --no-pager -n 30
  2. 手动运行: cd /opt/xunjianbao/backend && ENVIRONMENT=production ... ./server 2>&1 | head -20

常见原因及修复:
  JWT_SECRET 太短:
    → 确保 >= 32 字符，修改 systemd Environment 行
    → systemctl daemon-reload && systemctl restart xunjianbao

  MySQL 连接失败:
    → 检查密码: mysql -u root -proot123 -e 'SELECT 1'
    → 检查数据库: mysql -u root -proot123 -e 'SHOW DATABASES'
    → 检查认证插件: mysql -u root -proot123 -e "SELECT user,host,plugin FROM mysql.user WHERE user='root'"
    → 修复: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123';

  Redis 连接失败:
    → 检查 REDIS_URL 格式: 必须是 redis://127.0.0.1:6379（无密码时）
    → 检查 Redis 状态: redis-cli ping（应返回 PONG）
    → 如果返回 NOAUTH: Redis 有密码，REDIS_URL 需要改为 redis://:password@127.0.0.1:6379
      但注意 Go 的 url.Parse 对 redis://:password@host 解析有 bug，Host 会变空
      正确格式: redis://password@127.0.0.1:6379（不带冒号前缀）

  端口被占用:
    → ss -tlnp | grep 8094
    → 杀旧进程: kill -9 <PID>
    → systemctl restart xunjianbao
```

### 5.2 前端 403 Forbidden

```yaml
原因: nginx 对前端目录没有读取权限

修复:
  → chmod -R 755 /opt/xunjianbao/frontend/
  → systemctl restart nginx
```

### 5.3 前端白屏/资源加载失败

```yaml
原因1: nginx root 路径错误
  → 检查: cat /etc/nginx/conf.d/default.conf | grep root
  → 应该是: root /opt/xunjianbao/frontend;
  → 不是: root /usr/share/nginx/html; (Docker 路径)

原因2: nginx sites-enabled 有冲突配置
  → 检查: ls /etc/nginx/sites-enabled/
  → 如果有文件: rm -f /etc/nginx/sites-enabled/*
  → systemctl restart nginx

原因3: try_files 缺失
  → 确认 nginx 配置中有: try_files $uri $uri/ /index.html;
```

### 5.4 API 请求 403 (CORS)

```yaml
原因: 浏览器 Origin 不在 CORS 允许列表

排查:
  → 检查浏览器地址是否为 http://150.158.57.221
  → 检查 systemd 中 CORS_ALLOWED_ORIGINS 是否包含该 IP
  → 检查后端日志是否有 "CORS blocked origin" 输出

修复:
  → 在 systemd 中添加: Environment=CORS_ALLOWED_ORIGINS=http://150.158.57.221
  → systemctl daemon-reload && systemctl restart xunjianbao
```

### 5.5 API 请求 502 Bad Gateway

```yaml
原因: nginx 无法连接到后端

排查:
  → 后端是否运行: systemctl is-active xunjianbao
  → 后端端口: ss -tlnp | grep 8094
  → nginx 配置: proxy_pass 是否为 http://127.0.0.1:8094

修复:
  → 如果后端未运行: systemctl start xunjianbao
  → 如果 nginx 配置错误: 修正 proxy_pass 地址
```

---

## 六、安全加固清单

```yaml
生产环境必须:
  ✅ ENVIRONMENT=production
  ✅ GIN_MODE=release（禁用 debug 日志）
  ✅ LOG_LEVEL=info（不输出 SQL 语句）
  ✅ JWT_SECRET >= 32 字符随机字符串
  ✅ MySQL root 使用强密码（当前: root123，建议更换）
  ✅ Redis 无需认证时不要配置密码（避免连接 bug）
  ✅ 防火墙只开放 80/443/22 端口
  ✅ 定期更新系统: apt update && apt upgrade -y

生产环境禁止:
  ❌ DEPLOY_ENV=development
  ❌ GIN_MODE=debug
  ❌ LOG_LEVEL=debug
  ❌ JWT_SECRET 使用默认值或弱密码
  ❌ MySQL root 使用空密码或弱密码
  ❌ 开放 3306/6379 到公网
```

---

## 七、服务器资源限制

```yaml
硬件配置:
  CPU: 2 核
  内存: 2GB (1967MB 可用)
  磁盘: 50GB (已用 27GB, 剩余 21GB)

资源预算:
  Nginx: ~50MB
  Go 后端: ~200MB（MaxOpenConns 限制为 20）
  MySQL: ~500MB
  Redis: ~100MB
  系统/其他: ~300MB
  总计: ~1150MB / 1967MB

禁止:
  ❌ MaxOpenConns > 50（当前设 20）
  ❌ 在服务器上编译代码（只部署二进制）
  ❌ 在服务器上运行 pnpm install / npm install
  ❌ 在服务器上存储大文件（日志、上传文件等）
```

---

## 八、已知的坑（踩过的雷）

```yaml
1. call_integration 参数顺序
   ❌ toolName 放在 arguments 后面 → 工具调用失败
   ✅ toolName 必须在 arguments 前面

2. REDIS_URL 格式
   ❌ redis://:password@host → Go url.Parse 解析 Host 为空
   ✅ redis://password@host 或 redis://host:port（无密码时）

3. Go 环境变量名
   ❌ DEPLOY_ENV=production → Go 代码不读这个
   ✅ ENVIRONMENT=production → Go 代码读这个

4. MySQL 认证插件
   ❌ caching_sha2_password → Go MySQL 驱动连接失败
   ✅ mysql_native_password → 兼容所有客户端

5. nginx sites-enabled 残留
   ❌ Docker 部署遗留的配置文件会覆盖 conf.d
   ✅ sites-enabled 目录必须为空

6. 前端文件权限
   ❌ 默认权限可能导致 nginx 403
   ✅ chmod -R 755 /opt/xunjianbao/frontend/

7. nohup 进程残留
   ❌ 之前 nohup 启动的进程占端口，systemd 启动失败
   ✅ 切换到 systemd 前先 kill 所有残留进程

8. TAT 超时
   ❌ 单次命令含 sleep 30+ → TAT 超时
   ✅ sleep 拆分到本地执行，或用 nohup 后台
```

---

## 九、快速命令参考

```bash
# 健康检查（一次性检查所有服务）
systemctl is-active xunjianbao nginx mysql redis && ss -tlnp | grep -E ':(80|8094|3306|6379) ' && curl -s http://127.0.0.1:8094/api/v1/health && curl -s -o /dev/null -w 'frontend:%{http_code}\n' http://127.0.0.1:80/

# 重启后端
systemctl restart xunjianbao && sleep 5 && systemctl is-active xunjianbao

# 重启 nginx
nginx -t && systemctl restart nginx

# 查看后端日志
tail -20 /opt/xunjianbao/logs/backend.log

# 查看 nginx 错误日志
tail -20 /var/log/nginx/error.log
```

---

**最后更新**: 2026-04-08
**维护者**: 巡检宝团队
