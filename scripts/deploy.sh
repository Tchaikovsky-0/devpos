#!/bin/bash

# 巡检宝自动化部署脚本
# 支持蓝绿部署、健康检查、自动回滚

set -e  # 遇到错误立即退出

# 配置常量
DEPLOY_BASE_DIR="/opt/xunjianbao"
DEPLOY_DIR="$DEPLOY_BASE_DIR/deployments"
CURRENT_LINK="$DEPLOY_BASE_DIR/current"
PREVIOUS_LINK="$DEPLOY_BASE_DIR/previous"
BACKUP_DIR="$DEPLOY_BASE_DIR/backups"
LOG_DIR="$DEPLOY_BASE_DIR/logs"
CONFIG_DIR="$DEPLOY_BASE_DIR/config"

# 默认镜像标签
IMAGE_TAG=${IMAGE_TAG:-latest}
IMAGE_REPO=${IMAGE_REPO:-ghcr.io/your-org}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/deploy.log"
}

info() {
    log "${BLUE}ℹ️  $1${NC}"
}

success() {
    log "${GREEN}✅ $1${NC}"
}

warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

error() {
    log "${RED}❌ $1${NC}"
}

# 检查依赖
check_dependencies() {
    info "检查系统依赖..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "缺少必要的依赖: ${missing_deps[*]}"
        exit 1
    fi
    
    success "所有依赖检查通过"
}

# 检查Docker服务状态
check_docker_status() {
    info "检查Docker服务状态..."
    
    if ! systemctl is-active --quiet docker 2>/dev/null && ! docker info &> /dev/null; then
        error "Docker服务未运行"
        return 1
    fi
    
    success "Docker服务运行正常"
}

# 创建目录结构
setup_directories() {
    info "创建部署目录结构..."
    
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$CONFIG_DIR"
    
    # 创建必要的子目录
    mkdir -p "$CONFIG_DIR/mysql/conf.d"
    mkdir -p "$CONFIG_DIR/redis"
    mkdir -p "$CONFIG_DIR/prometheus"
    mkdir -p "$CONFIG_DIR/grafana/dashboards"
    mkdir -p "$CONFIG_DIR/grafana/datasources"
    mkdir -p "$CONFIG_DIR/loki"
    
    success "目录结构创建完成"
}

# 拉取最新镜像
pull_images() {
    info "拉取最新Docker镜像..."
    
    local services=("frontend" "backend" "ai-service" "yolo-service")
    
    for service in "${services[@]}"; do
        info "拉取 $service:$IMAGE_TAG"
        if docker pull "$IMAGE_REPO/xunjianbao-$service:$IMAGE_TAG"; then
            success "成功拉取 $service"
        else
            error "拉取 $service 失败"
            return 1
        fi
    done
    
    # 拉取基础设施镜像
    info "拉取基础设施镜像..."
    docker pull mysql:8.0
    docker pull redis:7-alpine
    docker pull openclaw/openclaw:latest
    docker pull prom/prometheus:latest
    docker pull grafana/grafana:latest
    docker pull grafana/loki:latest
    docker pull grafana/promtail:latest
    
    success "所有镜像拉取完成"
}

# 备份当前版本
backup_current_version() {
    info "备份当前版本..."
    
    if [ -L "$CURRENT_LINK" ]; then
        local current_dir=$(readlink -f "$CURRENT_LINK")
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        
        info "备份当前目录: $current_dir -> $BACKUP_DIR/$backup_name"
        cp -r "$current_dir" "$BACKUP_DIR/$backup_name"
        
        # 更新previous链接
        if [ -L "$PREVIOUS_LINK" ]; then
            rm "$PREVIOUS_LINK"
        fi
        ln -sf "$current_dir" "$PREVIOUS_LINK"
        
        success "当前版本备份完成: $backup_name"
    else
        warning "没有找到当前版本，首次部署"
    fi
}

# 创建新部署目录
create_new_deployment() {
    info "创建新部署..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local new_deploy_dir="$DEPLOY_DIR/deploy_$timestamp"
    
    mkdir -p "$new_deploy_dir"
    
    # 复制配置文件
    info "复制配置文件..."
    cp "$CONFIG_DIR/.env" "$new_deploy_dir/.env" 2>/dev/null || warning ".env文件不存在，将使用默认值"
    cp "$CONFIG_DIR/docker-compose.prod.yml" "$new_deploy_dir/docker-compose.prod.yml"
    
    # 更新环境变量中的镜像标签
    if [ -f "$new_deploy_dir/.env" ]; then
        sed -i "s|IMAGE_TAG=.*|IMAGE_TAG=$IMAGE_TAG|" "$new_deploy_dir/.env"
        sed -i "s|IMAGE_REPO=.*|IMAGE_REPO=$IMAGE_REPO|" "$new_deploy_dir/.env"
    else
        echo "IMAGE_TAG=$IMAGE_TAG" > "$new_deploy_dir/.env"
        echo "IMAGE_REPO=$IMAGE_REPO" >> "$new_deploy_dir/.env"
    fi
    
    echo "$new_deploy_dir"
}

# 启动新版本（绿色环境）
start_new_version() {
    local deploy_dir="$1"
    
    info "启动新版本服务..."
    cd "$deploy_dir"
    
    # 设置环境变量
    export $(grep -v '^#' .env | xargs)
    
    # 启动服务
    if docker-compose -f docker-compose.prod.yml up -d; then
        success "新版本服务启动成功"
        return 0
    else
        error "新版本服务启动失败"
        return 1
    fi
}

# 健康检查
perform_health_check() {
    info "执行健康检查..."
    
    local max_retries=30
    local retry_interval=10
    local services_healthy=0
    local total_services=6  # 后端、AI、YOLO、OpenClaw、前端、MySQL、Redis
    
    for ((i=1; i<=max_retries; i++)); do
        info "健康检查尝试 $i/$max_retries"
        
        local healthy_count=0
        
        # 检查后端服务
        if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8094/health | grep -q "200"; then
            ((healthy_count++))
            info "✅ 后端服务健康"
        fi
        
        # 检查AI服务
        if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8095/health | grep -q "200"; then
            ((healthy_count++))
            info "✅ AI服务健康"
        fi
        
        # 检查YOLO服务
        if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8097/health | grep -q "200"; then
            ((healthy_count++))
            info "✅ YOLO服务健康"
        fi
        
        # 检查前端服务
        if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
            ((healthy_count++))
            info "✅ 前端服务健康"
        fi
        
        # 检查MySQL
        if docker exec xunjianbao-mysql-prod mysqladmin ping -h localhost --silent; then
            ((healthy_count++))
            info "✅ MySQL健康"
        fi
        
        # 检查Redis
        if docker exec xunjianbao-redis-prod redis-cli ping | grep -q "PONG"; then
            ((healthy_count++))
            info "✅ Redis健康"
        fi
        
        if [ $healthy_count -eq $total_services ]; then
            success "所有服务健康检查通过"
            return 0
        fi
        
        info "健康检查进度: $healthy_count/$total_services"
        sleep $retry_interval
    done
    
    error "健康检查失败"
    return 1
}

# 切换流量（蓝绿部署）
switch_traffic() {
    local new_deploy_dir="$1"
    
    info "切换流量到新版本..."
    
    # 更新current链接
    if [ -L "$CURRENT_LINK" ]; then
        rm "$CURRENT_LINK"
    fi
    ln -sf "$new_deploy_dir" "$CURRENT_LINK"
    
    success "流量切换完成"
}

# 清理旧版本
cleanup_old_versions() {
    info "清理旧版本..."
    
    # 保留最近5个部署
    cd "$DEPLOY_DIR"
    local deployments=($(ls -dt deploy_* 2>/dev/null))
    local keep_count=5
    
    if [ ${#deployments[@]} -gt $keep_count ]; then
        for ((i=keep_count; i<${#deployments[@]}; i++)); do
            local old_deploy="${deployments[$i]}"
            info "清理旧部署: $old_deploy"
            
            # 停止并删除容器
            cd "$DEPLOY_DIR/$old_deploy" 2>/dev/null && \
            docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
            
            # 删除目录
            rm -rf "$DEPLOY_DIR/$old_deploy"
        done
    fi
    
    # 清理旧备份（保留最近10个）
    cd "$BACKUP_DIR"
    local backups=($(ls -dt backup_* 2>/dev/null))
    local backup_keep_count=10
    
    if [ ${#backups[@]} -gt $backup_keep_count ]; then
        for ((i=backup_keep_count; i<${#backups[@]}; i++)); do
            local old_backup="${backups[$i]}"
            info "清理旧备份: $old_backup"
            rm -rf "$BACKUP_DIR/$old_backup"
        done
    fi
    
    success "旧版本清理完成"
}

# 回滚到上一个版本
rollback() {
    error "部署失败，执行回滚..."
    
    if [ -L "$PREVIOUS_LINK" ]; then
        local previous_dir=$(readlink -f "$PREVIOUS_LINK")
        
        info "回滚到上一个版本: $previous_dir"
        
        # 停止当前版本（如果有）
        if [ -L "$CURRENT_LINK" ]; then
            local current_dir=$(readlink -f "$CURRENT_LINK")
            info "停止当前版本: $current_dir"
            cd "$current_dir" && docker-compose -f docker-compose.prod.yml down
        fi
        
        # 启动上一个版本
        info "启动上一个版本..."
        cd "$previous_dir" && docker-compose -f docker-compose.prod.yml up -d
        
        # 更新current链接
        rm -f "$CURRENT_LINK"
        ln -sf "$previous_dir" "$CURRENT_LINK"
        
        # 健康检查
        if perform_health_check; then
            success "回滚成功"
            return 0
        else
            error "回滚后健康检查失败"
            return 1
        fi
    else
        error "没有可回滚的上一个版本"
        return 1
    fi
}

# 发送部署通知
send_notification() {
    local status="$1"
    local message="$2"
    
    # 如果有Slack Webhook，发送通知
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        if [ "$status" = "failure" ]; then
            color="danger"
        elif [ "$status" = "warning" ]; then
            color="warning"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"部署$status\",\"text\":\"$message\",\"fields\":[{\"title\":\"环境\",\"value\":\"生产环境\",\"short\":true},{\"title\":\"版本\",\"value\":\"$IMAGE_TAG\",\"short\":true}]}]}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # 记录到日志
    log "部署通知: $status - $message"
}

# 主部署流程
main() {
    info "🚀 开始巡检宝部署流程"
    info "版本: $IMAGE_TAG"
    info "镜像仓库: $IMAGE_REPO"
    
    local new_deploy_dir=""
    
    # 步骤1: 检查依赖
    check_dependencies
    
    # 步骤2: 检查Docker状态
    check_docker_status || exit 1
    
    # 步骤3: 设置目录结构
    setup_directories
    
    # 步骤4: 备份当前版本
    backup_current_version
    
    # 步骤5: 拉取镜像
    if ! pull_images; then
        error "镜像拉取失败"
        send_notification "failure" "镜像拉取失败"
        exit 1
    fi
    
    # 步骤6: 创建新部署
    new_deploy_dir=$(create_new_deployment)
    info "新部署目录: $new_deploy_dir"
    
    # 步骤7: 启动新版本
    if ! start_new_version "$new_deploy_dir"; then
        error "新版本启动失败"
        send_notification "failure" "新版本启动失败"
        rollback || exit 1
        exit 1
    fi
    
    # 步骤8: 健康检查
    if ! perform_health_check; then
        error "健康检查失败"
        send_notification "failure" "健康检查失败"
        
        # 停止新版本
        info "停止失败的新版本..."
        cd "$new_deploy_dir" && docker-compose -f docker-compose.prod.yml down
        
        # 回滚
        rollback || exit 1
        send_notification "success" "已回滚到上一个版本"
        exit 1
    fi
    
    # 步骤9: 切换流量
    switch_traffic "$new_deploy_dir"
    
    # 步骤10: 清理旧版本
    cleanup_old_versions
    
    # 步骤11: 发送成功通知
    send_notification "success" "部署成功完成"
    
    success "🎉 部署流程完成"
    info "新版本目录: $new_deploy_dir"
    info当前版本: $(readlink -f "$CURRENT_LINK" 2>/dev/null || echo "无")
    info上一个版本: $(readlink -f "$PREVIOUS_LINK" 2>/dev/null || echo "无")
    
    return 0
}

# 执行主函数
main "$@"

exit $?