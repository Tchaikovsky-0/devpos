#!/bin/bash

# 巡检宝全栈服务停止脚本

set -e

PROJECT_ROOT="/Volumes/KINGSTON/xunjianbao"
LOG_DIR="$PROJECT_ROOT/logs"

echo "=========================================="
echo "巡检宝全栈服务停止"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 停止服务函数
stop_service() {
    local service_name=$1
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null || true
            echo -e "${GREEN}✓ ${service_name} 服务已停止 (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠ ${service_name} 服务未运行${NC}"
        fi
        rm -f "$pid_file"
    else
        # 尝试通过端口查找并停止
        local port=""
        case $service_name in
            "backend") port=8094 ;;
            "frontend") port=3000 ;;
            "ai-service") port=8095 ;;
        esac
        
        if [ -n "$port" ]; then
            local pid=$(lsof -ti :$port 2>/dev/null || true)
            if [ -n "$pid" ]; then
                kill $pid 2>/dev/null || true
                echo -e "${GREEN}✓ ${service_name} 服务已停止 (端口 $port)${NC}"
            else
                echo -e "${YELLOW}⚠ ${service_name} 服务未运行${NC}"
            fi
        fi
    fi
}

# 停止所有服务
stop_service "backend"
stop_service "frontend"
stop_service "ai-service"

echo ""
echo "=========================================="
echo -e "${GREEN}所有服务已停止${NC}"
echo "=========================================="
