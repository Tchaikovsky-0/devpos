#!/bin/bash

# 巡检宝全栈服务启动脚本
# 使用说明: ./scripts/start-all.sh

set -e

PROJECT_ROOT="/Volumes/KINGSTON/xunjianbao"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

echo "=========================================="
echo "巡检宝全栈服务启动"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查服务是否已经在运行
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# 启动后端服务
start_backend() {
    echo -e "${YELLOW}[1/3] 启动后端服务 (端口 8094)...${NC}"
    
    if check_port 8094; then
        echo -e "${RED}后端服务已在运行，跳过${NC}"
        return 0
    fi
    
    cd "$PROJECT_ROOT/backend"
    
    # 设置环境变量
    export DATABASE_URL=""
    export JWT_SECRET="xunjianbao-jwt-secret-key-2026-at-least-32-chars"
    export PORT="8094"
    export GIN_MODE="debug"
    
    # 启动后端 (后台运行)
    ./bin/server > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"
    
    echo -e "${GREEN}✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
    echo -e "   日志: $LOG_DIR/backend.log"
    echo ""
}

# 启动前端服务
start_frontend() {
    echo -e "${YELLOW}[2/3] 启动前端服务 (端口 3000)...${NC}"
    
    if check_port 3000; then
        echo -e "${RED}前端服务已在运行，跳过${NC}"
        return 0
    fi
    
    cd "$PROJECT_ROOT/frontend"
    
    # 启动前端开发服务器 (后台运行)
    pnpm dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
    
    echo -e "${GREEN}✓ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
    echo -e "   日志: $LOG_DIR/frontend.log"
    echo ""
}

# 启动AI服务
start_ai_service() {
    echo -e "${YELLOW}[3/3] 启动AI服务 (端口 8095)...${NC}"
    
    if check_port 8095; then
        echo -e "${RED}AI服务已在运行，跳过${NC}"
        return 0
    fi
    
    cd "$PROJECT_ROOT/ai-service"
    
    # 启动AI服务 (后台运行)
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8095 --reload > "$LOG_DIR/ai-service.log" 2>&1 &
    AI_PID=$!
    echo $AI_PID > "$LOG_DIR/ai-service.pid"
    
    echo -e "${GREEN}✓ AI服务已启动 (PID: $AI_PID)${NC}"
    echo -e "   日志: $LOG_DIR/ai-service.log"
    echo ""
}

# 等待服务启动
wait_for_services() {
    echo "等待服务启动..."
    echo ""
    
    # 等待后端
    for i in {1..30}; do
        if check_port 8094; then
            echo -e "${GREEN}✓ 后端服务就绪 (端口 8094)${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    
    # 等待前端
    for i in {1..30}; do
        if check_port 3000; then
            echo -e "${GREEN}✓ 前端服务就绪 (端口 3000)${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    
    # 等待AI服务
    for i in {1..30}; do
        if check_port 8095; then
            echo -e "${GREEN}✓ AI服务就绪 (端口 8095)${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
}

# 打印服务信息
print_info() {
    echo "=========================================="
    echo -e "${GREEN}全栈服务启动完成!${NC}"
    echo "=========================================="
    echo ""
    echo "服务地址:"
    echo -e "  ${GREEN}前端:${NC}     http://localhost:3000"
    echo -e "  ${GREEN}后端:${NC}     http://localhost:8094"
    echo -e "  ${GREEN}AI服务:${NC}   http://localhost:8095"
    echo -e "  ${GREEN}Swagger:${NC}  http://localhost:8094/swagger/index.html"
    echo ""
    echo "日志文件:"
    echo "  后端: $LOG_DIR/backend.log"
    echo "  前端: $LOG_DIR/frontend.log"
    echo "  AI服务: $LOG_DIR/ai-service.log"
    echo ""
    echo "停止服务:"
    echo "  ./scripts/stop-all.sh"
    echo ""
    echo "查看日志:"
    echo "  tail -f $LOG_DIR/backend.log"
    echo "  tail -f $LOG_DIR/frontend.log"
    echo "  tail -f $LOG_DIR/ai-service.log"
    echo "=========================================="
}

# 主流程
start_backend
start_frontend
start_ai_service

wait_for_services
print_info
