#!/bin/bash
# =================================================================
# 巡检宝 - 腾讯云服务器自动部署脚本
# =================================================================
# 服务器: 101.43.35.139
# 操作系统: Ubuntu Server 24.04 LTS
# 配置: 4核 CPU, 16GB RAM, 180GB SSD
# =================================================================

set -e  # 遇到错误立即退出

# =================================================================
# 配置变量
# =================================================================
SERVER_IP="101.43.35.139"
SERVER_USER="root"
SSH_KEY="~/.ssh/id_ed25519"
APP_DIR="/opt/xunjianbao"
BACKUP_DIR="/opt/xunjianbao-backup"
LOG_FILE="/tmp/deploy-$(date +%Y%m%d_%H%M%S).log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =================================================================
# 辅助函数
# =================================================================
log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# =================================================================
# 1. 环境检查
# =================================================================
check_environment() {
    log "=========================================="
    log "步骤 1: 检查部署环境"
    log "=========================================="

    # 检查 SSH 密钥
    if [ ! -f "$SSH_KEY" ]; then
        error "SSH 密钥不存在: $SSH_KEY"
    fi
    success "SSH 密钥已找到"

    # 检查 SSH 连接
    log "测试 SSH 连接..."
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o BatchMode=yes "${SERVER_USER}@${SERVER_IP}" "echo 'SSH连接成功'" 2>/dev/null; then
        error "无法连接到服务器 ${SERVER_IP}，请检查：\n  1. 服务器是否运行中\n  2. SSH 端口是否开放 (默认22)\n  3. 公钥是否已添加到服务器"
    fi
    success "SSH 连接测试成功"

    # 检查 Git 仓库
    if [ ! -d ".git" ]; then
        error "当前目录不是 Git 仓库"
    fi
    success "Git 仓库检查通过"

    log "环境检查完成！"
}

# =================================================================
# 2. 备份现有部署
# =================================================================
backup_existing() {
    log "=========================================="
    log "步骤 2: 备份现有部署"
    log "=========================================="

    # 检查远程是否有现有部署
    if ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" "test -d ${APP_DIR}" 2>/dev/null; then
        warn "检测到现有部署，将进行备份..."

        # 创建备份目录
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << EOF
            mkdir -p ${BACKUP_DIR}
            if [ -d "${APP_DIR}" ]; then
                cp -r ${APP_DIR} ${BACKUP_DIR}/backup-${TIMESTAMP}
                echo "备份已创建: ${BACKUP_DIR}/backup-${TIMESTAMP}"
            fi
EOF
        success "备份完成"
    else
        log "未检测到现有部署，跳过备份"
    fi
}

# =================================================================
# 3. 上传代码到服务器
# =================================================================
upload_code() {
    log "=========================================="
    log "步骤 3: 上传代码到服务器"
    log "=========================================="

    # 创建应用目录
    ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${APP_DIR}"

    # 使用 git clone 或 rsync 上传代码
    log "上传代码..."

    # 方法1: 如果有 Git 仓库，直接在服务器上 clone
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

    if [ -n "$REMOTE_URL" ]; then
        log "检测到 Git 远程仓库: $REMOTE_URL"
        ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << EOF
            cd ${APP_DIR}
            if [ -d ".git" ]; then
                git pull origin main
            else
                git clone ${REMOTE_URL} .
            fi
            git checkout main
            git pull origin main
EOF
        success "代码同步完成（使用 Git）"
    else
        # 方法2: 使用 rsync 上传
        log "使用 rsync 上传代码..."
        rsync -avz --delete \
            -e "ssh -i $SSH_KEY" \
            --exclude '.git' \
            --exclude 'node_modules' \
            --exclude 'dist' \
            --exclude '.env' \
            --exclude '*.log' \
            ./ "${SERVER_USER}@${SERVER_IP}:${APP_DIR}/"
        success "代码上传完成（使用 rsync）"
    fi
}

# =================================================================
# 4. 服务器环境配置
# =================================================================
setup_server() {
    log "=========================================="
    log "步骤 4: 配置服务器环境"
    log "=========================================="

    ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'EOF'
        set -e

        echo "=== 4.1 更新系统包 ==="
        apt update && apt upgrade -y

        echo "=== 4.2 安装 Docker ==="
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com | sh
            usermod -aG docker root
        fi
        docker --version

        echo "=== 4.3 安装 Docker Compose ==="
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        docker-compose --version

        echo "=== 4.4 安装 Nginx ==="
        apt install -y nginx

        echo "=== 4.5 配置防火墙 ==="
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 8094/tcp  # Backend API
        ufw allow 3000/tcp   # Frontend
        echo "y" | ufw enable

        echo "=== 4.6 创建应用目录 ==="
        mkdir -p /opt/xunjianbao
        mkdir -p /opt/xunjianbao/logs

        echo "=== 4.7 创建环境变量文件 ==="
        cat > /opt/xunjianbao/.env << 'ENVEOF'
# Database
POSTGRES_PASSWORD=xunjianbao_secure_password_2024
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=xunjianbao

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=xunjianbao_jwt_secret_key_32chars_minimum_required_here

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# API Keys (请修改为真实密钥)
OPENAI_API_KEY=your_openai_api_key_here
ENVEOF

        echo "=== 4.8 配置 Nginx 反向代理 ==="
        cat > /etc/nginx/sites-available/xunjianbao << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend (React SPA)
    location / {
        proxy_pass http://localhost:3000;
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
        proxy_pass http://localhost:8094;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8094;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
NGINXEOF

        # 启用站点配置
        ln -sf /etc/nginx/sites-available/xunjianbao /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default

        # 测试 Nginx 配置
        nginx -t

        # 重载 Nginx
        systemctl reload nginx

        echo "=== 环境配置完成 ==="
EOF

    success "服务器环境配置完成"
}

# =================================================================
# 5. 构建并启动服务
# =================================================================
deploy_services() {
    log "=========================================="
    log "步骤 5: 构建并启动服务"
    log "=========================================="

    ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'EOF'
        set -e
        cd /opt/xunjianbao

        echo "=== 5.1 停止现有容器 ==="
        docker-compose down 2>/dev/null || true

        echo "=== 5.2 构建 Docker 镜像 ==="
        docker-compose build --no-cache

        echo "=== 5.3 启动服务 ==="
        docker-compose up -d

        echo "=== 5.4 等待服务启动 ==="
        sleep 10

        echo "=== 5.5 检查服务状态 ==="
        docker-compose ps

        echo "=== 5.6 检查服务健康 ==="
        for i in {1..30}; do
            if curl -sf http://localhost:8094/health > /dev/null 2>&1; then
                echo "Backend API 服务健康检查通过"
                break
            fi
            echo "等待 Backend 服务启动... ($i/30)"
            sleep 2
        done

        for i in {1..30}; do
            if curl -sf http://localhost:3000 > /dev/null 2>&1; then
                echo "Frontend 服务健康检查通过"
                break
            fi
            echo "等待 Frontend 服务启动... ($i/30)"
            sleep 2
        done

        echo "=== 服务部署完成 ==="
EOF

    success "服务构建并启动完成"
}

# =================================================================
# 6. 验证部署
# =================================================================
verify_deployment() {
    log "=========================================="
    log "步骤 6: 验证部署"
    log "=========================================="

    local failed=0

    # 检查 Frontend
    log "检查 Frontend (端口 3000)..."
    if curl -sf http://${SERVER_IP}:3000 > /dev/null 2>&1; then
        success "Frontend 运行正常"
    else
        error "Frontend 检查失败"
        failed=1
    fi

    # 检查 Backend API
    log "检查 Backend API (端口 8094)..."
    if curl -sf http://${SERVER_IP}:8094/health > /dev/null 2>&1; then
        success "Backend API 运行正常"
    else
        error "Backend API 检查失败"
        failed=1
    fi

    # 检查 Nginx
    log "检查 Nginx 反向代理..."
    if curl -sf http://${SERVER_IP}/api/health > /dev/null 2>&1; then
        success "Nginx 反向代理正常"
    else
        warn "Nginx 反向代理检查失败（可能是 /api/health 端点不存在）"
    fi

    # 查看容器日志
    log "查看最近的服务日志..."
    ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" "docker-compose logs --tail=20"

    if [ $failed -eq 0 ]; then
        success "所有服务检查通过！"
    else
        error "部分服务检查失败，请查看日志"
    fi
}

# =================================================================
# 7. 清理
# =================================================================
cleanup() {
    log "=========================================="
    log "步骤 7: 清理临时文件"
    log "=========================================="

    # 清理本地日志
    if [ -f "$LOG_FILE" ]; then
        rm -f "$LOG_FILE"
        log "已清理部署日志"
    fi

    success "清理完成"
}

# =================================================================
# 主流程
# =================================================================
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║     巡检宝 - 腾讯云自动部署脚本                      ║"
    echo "║     服务器: ${SERVER_IP}                      ║"
    echo "║     部署目录: ${APP_DIR}                        ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""

    check_environment
    backup_existing
    upload_code
    setup_server
    deploy_services
    verify_deployment
    cleanup

    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║           🎉 部署完成！                             ║"
    echo "╠════════════════════════════════════════════════════╣"
    echo "║  Frontend: http://${SERVER_IP}:3000             ║"
    echo "║  Backend:  http://${SERVER_IP}:8094              ║"
    echo "║  Nginx:    http://${SERVER_IP}                   ║"
    echo "╠════════════════════════════════════════════════════╣"
    echo "║  管理命令:                                         ║"
    echo "║    ssh -i ~/.ssh/id_ed25519 root@${SERVER_IP}  ║"
    echo "║    cd /opt/xunjianbao                            ║"
    echo "║    docker-compose logs -f                        ║"
    echo "║    docker-compose restart                         ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
}

# 执行主流程
main "$@"
