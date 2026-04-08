#!/bin/bash
# =============================================================================
# 巡检宝 - 一键部署到腾讯云轻量应用服务器
# 用法: bash scripts/deploy-to-lighthouse.sh
# =============================================================================

set -e

# ---- 配置（按需修改） ----
SERVER_IP="150.158.57.221"
SERVER_USER="root"
REMOTE_DIR="/opt/xunjianbao"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Step 1: 本地构建 ----
log_info "====== Step 1: 本地构建 ======"

# 1a. 构建前端
log_info "构建前端..."
cd "$PROJECT_DIR/frontend"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build
log_info "前端构建完成: frontend/dist/"

# 1b. 交叉编译后端 (Linux amd64)
log_info "交叉编译后端 (linux/amd64)..."
cd "$PROJECT_DIR/backend"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server ./cmd/server
log_info "后端编译完成: backend/server"

# ---- Step 2: 上传文件到服务器 ----
log_info "====== Step 2: 上传文件到服务器 ======"

# 创建远程目录
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR/{frontend,backend,logs,config}"

# 上传前端构建产物
log_info "上传前端文件..."
rsync -avz --delete "$PROJECT_DIR/frontend/dist/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/frontend/"

# 上传后端二进制
log_info "上传后端二进制..."
scp "$PROJECT_DIR/backend/server" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/server"
ssh "$SERVER_USER@$SERVER_IP" "chmod +x $REMOTE_DIR/backend/server"

# 上传 nginx 配置
log_info "上传 nginx 配置..."
scp "$PROJECT_DIR/deploy/nginx.conf" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/config/nginx.conf"
ssh "$SERVER_USER@$SERVER_IP" "
  sudo cp $REMOTE_DIR/config/nginx.conf /etc/nginx/sites-available/xunjianbao 2>/dev/null || true
  sudo ln -sf /etc/nginx/sites-available/xunjianbao /etc/nginx/sites-enabled/xunjianbao 2>/dev/null || true
  sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  # 如果没有 sites-available/sites-enabled 结构，直接写到 conf.d
  if [ ! -d /etc/nginx/sites-available ]; then
    sudo cp $REMOTE_DIR/config/nginx.conf /etc/nginx/conf.d/default.conf
    sudo rm -f /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
  fi
"

# 生成 systemd service（如果不存在）
log_info "配置 systemd 服务..."
ssh "$SERVER_USER@$SERVER_IP" 'cat > /etc/systemd/system/xunjianbao.service << EOFSERVICE
[Unit]
Description=Xunjianbao Backend Service
After=network.target mysql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/xunjianbao/backend
ExecStart=/opt/xunjianbao/backend/server
Restart=always
RestartSec=5
Environment=PORT=8094
Environment=DATABASE_URL=root:change_me_secure_password@tcp(127.0.0.1:3306)/xunjianbao?charset=utf8mb4&parseTime=True&loc=Local
Environment=REDIS_URL=redis://:redis_secure_password@127.0.0.1:6379
Environment=DEPLOY_ENV=production
Environment=LOG_LEVEL=info
StandardOutput=append:/opt/xunjianbao/logs/backend.log
StandardError=append:/opt/xunjianbao/logs/backend.log

[Install]
WantedBy=multi-user.target
EOFSERVICE'

# ---- Step 3: 服务器端操作 ----
log_info "====== Step 3: 服务器端部署 ======"

ssh "$SERVER_USER@$SERVER_IP" bash -s << 'REMOTE_SCRIPT'

set -e

echo ""
echo ">>> 3a. 停止旧服务..."
systemctl stop xunjianbao 2>/dev/null || true
echo "    已停止 xunjianbao"

echo ">>> 3b. 启动后端服务..."
systemctl daemon-reload
systemctl enable xunjianbao
systemctl start xunjianbao
sleep 2
echo "    后端状态: $(systemctl is-active xunjianbao)"

echo ">>> 3c. 重启 nginx..."
nginx -t 2>&1
systemctl restart nginx
sleep 1
echo "    Nginx 状态: $(systemctl is-active nginx)"

echo ">>> 3d. 健康检查..."
sleep 2

# 检查前端
FRONTEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:80/)
echo "    前端 (80):   HTTP $FRONTEND_CODE"

# 检查后端
BACKEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8094/health 2>/dev/null || echo "000")
echo "    后端 (8094): HTTP $BACKEND_CODE"

# 检查端口
echo ">>> 3e. 端口监听:"
ss -tlnp | grep -E ':(80|8094|3306|6379)\s' || netstat -tlnp | grep -E ':(80|8094|3306|6379)\s' || true

# 查看最新后端日志
echo ">>> 3f. 后端日志(最新3行):"
tail -3 /opt/xunjianbao/logs/backend.log 2>/dev/null || echo "    (暂无日志)"

echo ""
echo "========================================="
echo "  部署完成!"
echo "  前端: http://$(curl -s ifconfig.me 2>/dev/null || echo '150.158.57.221')"
echo "  API:  http://$(curl -s ifconfig.me 2>/dev/null || echo '150.158.57.221')/api/v1/"
echo "========================================="

REMOTE_SCRIPT

log_info "====== 部署流程结束 ======"
