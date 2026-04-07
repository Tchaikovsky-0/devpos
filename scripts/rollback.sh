#!/bin/bash

# 巡检宝回滚脚本
# 自动回滚到上一个版本

set -e

# 配置常量
DEPLOY_BASE_DIR="/opt/xunjianbao"
CURRENT_LINK="$DEPLOY_BASE_DIR/current"
PREVIOUS_LINK="$DEPLOY_BASE_DIR/previous"
BACKUP_DIR="$DEPLOY_BASE_DIR/backups"
LOG_DIR="$DEPLOY_BASE_DIR/logs"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/rollback.log"
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

# 检查是否有上一个版本
check_previous_version() {
    info "检查上一个版本..."
    
    if [ ! -L "$PREVIOUS_LINK" ]; then
        error "找不到上一个版本链接"
        return 1
    fi
    
    local previous_dir=$(readlink -f "$PREVIOUS_LINK")
    
    if [ ! -d "$previous_dir" ]; then
        error "上一个版本目录不存在: $previous_dir"
        return 1
    fi
    
    if [ ! -f "$previous_dir/docker-compose.prod.yml" ]; then
        error "上一个版本缺少docker-compose配置文件"
        return 1
    fi
    
    info "找到上一个版本: $previous_dir"
    echo "$previous_dir"
}

# 停止当前版本
stop_current_version() {
    info "停止当前版本..."
    
    if [ -L "$CURRENT_LINK" ]; then
        local current_dir=$(readlink -f "$CURRENT_LINK")
        
        if [ -d "$current_dir" ]; then
            info "当前版本目录: $current_dir"
            cd "$current_dir"
            
            if docker-compose -f docker-compose.prod.yml down; then
                success "当前版本已停止"
                
                # 备份当前版本配置
                local backup_name="failed_$(date +%Y%m%d_%H%M%S)"
                cp -r "$current_dir" "$BACKUP_DIR/$backup_name"
                info "失败版本已备份到: $BACKUP_DIR/$backup_name"
            else
                warning "停止当前版本时遇到问题，继续回滚..."
            fi
        else
            warning "当前版本目录不存在"
        fi
    else
        warning "没有当前版本链接"
    fi
}

# 启动上一个版本
start_previous_version() {
    local previous_dir="$1"
    
    info "启动上一个版本: $previous_dir"
    
    cd "$previous_dir"
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        warning "缺少.env文件，使用默认配置"
        # 创建基本的.env文件
        echo "IMAGE_TAG=previous" > .env
        echo "DEPLOY_ENV=production" >> .env
    fi
    
    # 设置环境变量
    export $(grep -v '^#' .env | xargs)
    
    # 启动服务
    if docker-compose -f docker-compose.prod.yml up -d; then
        success "上一个版本启动成功"
        return 0
    else
        error "启动上一个版本失败"
        return 1
    fi
}

# 健康检查
perform_health_check() {
    info "执行回滚后健康检查..."
    
    local max_retries=20
    local retry_interval=10
    local required_services=4  # 后端、AI、YOLO、前端
    
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
        
        if [ $healthy_count -eq $required_services ]; then
            success "所有必需服务健康检查通过"
            return 0
        fi
        
        info "健康检查进度: $healthy_count/$required_services"
        sleep $retry_interval
    done
    
    error "回滚后健康检查失败"
    return 1
}

# 更新当前链接
update_current_link() {
    local previous_dir="$1"
    
    info "更新当前版本链接..."
    
    # 删除当前链接
    if [ -L "$CURRENT_LINK" ]; then
        rm "$CURRENT_LINK"
    fi
    
    # 创建新的当前链接
    ln -sf "$previous_dir" "$CURRENT_LINK"
    
    success "当前版本链接已更新: $previous_dir"
}

# 清理旧的失败备份
cleanup_failed_backups() {
    info "清理旧的失败备份..."
    
    cd "$BACKUP_DIR"
    
    # 查找所有失败备份
    local failed_backups=($(ls -dt failed_* 2>/dev/null))
    local keep_count=3  # 保留最近3个失败备份
    
    if [ ${#failed_backups[@]} -gt $keep_count ]; then
        for ((i=keep_count; i<${#failed_backups[@]}; i++)); do
            local old_backup="${failed_backups[$i]}"
            info "清理旧失败备份: $old_backup"
            rm -rf "$BACKUP_DIR/$old_backup"
        done
    fi
    
    success "失败备份清理完成"
}

# 发送回滚通知
send_rollback_notification() {
    local status="$1"
    local message="$2"
    local previous_dir="$3"
    
    # 获取回滚版本信息
    local rollback_version="unknown"
    if [ -n "$previous_dir" ]; then
        rollback_version=$(basename "$previous_dir")
    fi
    
    # 如果有Slack Webhook，发送通知
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="warning"
        if [ "$status" = "success" ]; then
            color="good"
        elif [ "$status" = "failure" ]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"回滚$status\",\"text\":\"$message\",\"fields\":[{\"title\":\"回滚版本\",\"value\":\"$rollback_version\",\"short\":true},{\"title\":\"时间\",\"value\":\"$(date '+%Y-%m-%d %H:%M:%S')\",\"short\":true}]}]}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # 记录到日志
    log "回滚通知: $status - $message"
}

# 主回滚流程
main() {
    info "🔄 开始巡检宝回滚流程"
    
    local previous_dir=""
    
    # 步骤1: 检查上一个版本
    previous_dir=$(check_previous_version)
    if [ $? -ne 0 ]; then
        error "无法找到有效的上一个版本"
        send_rollback_notification "failure" "找不到有效的上一个版本" ""
        exit 1
    fi
    
    # 步骤2: 停止当前版本
    stop_current_version
    
    # 步骤3: 启动上一个版本
    if ! start_previous_version "$previous_dir"; then
        error "启动上一个版本失败"
        send_rollback_notification "failure" "启动上一个版本失败" "$previous_dir"
        exit 1
    fi
    
    # 步骤4: 健康检查
    if ! perform_health_check; then
        error "回滚后健康检查失败"
        send_rollback_notification "failure" "回滚后健康检查失败" "$previous_dir"
        exit 1
    fi
    
    # 步骤5: 更新当前链接
    update_current_link "$previous_dir"
    
    # 步骤6: 清理失败备份
    cleanup_failed_backups
    
    # 步骤7: 发送成功通知
    send_rollback_notification "success" "回滚成功完成" "$previous_dir"
    
    success "🔄 回滚流程完成"
    info "当前版本: $previous_dir"
    info "回滚时间: $(date)"
    
    # 显示回滚版本信息
    if [ -f "$previous_dir/.env" ]; then
        info "回滚版本配置:"
        grep -E "IMAGE_TAG|DEPLOY_ENV" "$previous_dir/.env" || true
    fi
    
    return 0
}

# 快速回滚函数（紧急情况使用）
emergency_rollback() {
    echo "⚠️  紧急回滚模式启动！"
    echo "这将立即回滚到上一个版本，不进行健康检查..."
    
    read -p "确认执行紧急回滚？(yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "回滚已取消"
        exit 0
    fi
    
    if [ ! -L "$PREVIOUS_LINK" ]; then
        echo "错误: 找不到上一个版本"
        exit 1
    fi
    
    local previous_dir=$(readlink -f "$PREVIOUS_LINK")
    
    # 停止所有服务
    echo "停止所有服务..."
    docker-compose -f "$(readlink -f $CURRENT_LINK)/docker-compose.prod.yml" down 2>/dev/null || true
    
    # 启动上一个版本
    echo "启动上一个版本..."
    cd "$previous_dir"
    docker-compose -f docker-compose.prod.yml up -d
    
    # 更新链接
    rm -f "$CURRENT_LINK"
    ln -sf "$previous_dir" "$CURRENT_LINK"
    
    echo "紧急回滚完成"
    echo "注意: 请手动检查服务状态"
}

# 命令行参数处理
case "$1" in
    --emergency|-e)
        emergency_rollback
        ;;
    --help|-h)
        echo "巡检宝回滚脚本"
        echo "用法:"
        echo "  $0          正常回滚（带健康检查）"
        echo "  $0 --emergency  紧急回滚（跳过健康检查）"
        echo "  $0 --help       显示帮助信息"
        ;;
    *)
        main
        ;;
esac

exit $?