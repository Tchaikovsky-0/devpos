#!/bin/bash

# 全量检测脚本 (执行前后端代码质量检测)
# 使用方法: ./full-check.sh [--quick]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 检测模式
MODE="full"
if [ "$1" == "--quick" ]; then
    MODE="quick"
fi

echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║    全量代码质量检测 - Monitor Agent          ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}检测模式: ${MODE}${NC}"
echo ""

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

# 初始化计数器
TOTAL_ERRORS=0
TOTAL_WARNINGS=0
START_TIME=$(date +%s)

# 前端检测
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}              前端检测                        ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "${PROJECT_ROOT}/frontend" ]; then
    cd "${PROJECT_ROOT}/frontend"
    
    # 执行前端检测脚本
    if [ "$MODE" == "quick" ]; then
        "${SCRIPT_DIR}/frontend-check.sh" --quick || FRONTEND_FAILED=true
    else
        "${SCRIPT_DIR}/frontend-check.sh" --full || FRONTEND_FAILED=true
    fi
    
    cd "${PROJECT_ROOT}"
else
    echo -e "${YELLOW}⚠ 未找到前端目录，跳过前端检测${NC}"
    FRONTEND_FAILED=false
fi

echo ""

# 后端检测
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}              后端检测                        ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "${PROJECT_ROOT}/backend" ]; then
    cd "${PROJECT_ROOT}/backend"
    
    # 执行后端检测脚本
    if [ "$MODE" == "quick" ]; then
        "${SCRIPT_DIR}/backend-check.sh" --quick || BACKEND_FAILED=true
    else
        "${SCRIPT_DIR}/backend-check.sh" --full || BACKEND_FAILED=true
    fi
    
    cd "${PROJECT_ROOT}"
else
    echo -e "${YELLOW}⚠ 未找到后端目录，跳过后端检测${NC}"
    BACKEND_FAILED=false
fi

echo ""

# AI服务检测（可选）
if [ -d "${PROJECT_ROOT}/ai-service" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}              AI服务检测                      ${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "${PROJECT_ROOT}/ai-service"
    
    # Python类型检查
    if command -v mypy &> /dev/null; then
        echo -e "${BLUE}[1/3] Python类型检查...${NC}"
        OUTPUT=$(mypy . 2>&1 || true)
        if [ -z "$OUTPUT" ]; then
            echo -e "${GREEN}✓ Python类型检查通过${NC}"
        else
            echo -e "${YELLOW}⚠ Python类型检查发现问题${NC}"
            echo "$OUTPUT" | head -10
        fi
    else
        echo -e "${YELLOW}[1/3] Python类型检查 (未安装mypy，跳过)${NC}"
    fi
    
    # Python代码格式检查
    if command -v black &> /dev/null; then
        echo -e "${BLUE}[2/3] Python代码格式检查...${NC}"
        OUTPUT=$(black --check . 2>&1 || true)
        if echo "$OUTPUT" | grep -q "would reformat"; then
            echo -e "${YELLOW}⚠ 发现格式问题，运行 black . 修复${NC}"
        else
            echo -e "${GREEN}✓ Python代码格式检查通过${NC}"
        fi
    else
        echo -e "${YELLOW}[2/3] Python代码格式检查 (未安装black，跳过)${NC}"
    fi
    
    # Python单元测试
    if [ "$MODE" != "quick" ]; then
        if command -v pytest &> /dev/null; then
            echo -e "${BLUE}[3/3] Python单元测试...${NC}"
            OUTPUT=$(pytest tests/ -v 2>&1 || true)
            if echo "$OUTPUT" | grep -q "passed"; then
                PASSED=$(echo "$OUTPUT" | grep -o "[0-9]* passed" | head -1)
                echo -e "${GREEN}✓ Python单元测试通过: ${PASSED}${NC}"
            else
                echo -e "${RED}❌ Python单元测试失败${NC}"
            fi
        else
            echo -e "${YELLOW}[3/3] Python单元测试 (未安装pytest，跳过)${NC}"
        fi
    else
        echo -e "${YELLOW}[3/3] Python单元测试 (快速模式，跳过)${NC}"
    fi
    
    cd "${PROJECT_ROOT}"
    echo ""
fi

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 生成最终报告
echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║           全量检测结果汇总                   ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# 判断整体状态
if [ "$FRONTEND_FAILED" = true ] || [ "$BACKEND_FAILED" = true ]; then
    echo -e "${RED}❌ 检测发现问题，请修复后再提交代码${NC}"
    echo ""
    echo -e "📊 统计信息:"
    echo -e "   - 耗时: ${BLUE}${DURATION}秒${NC}"
    echo ""
    
    if [ "$FRONTEND_FAILED" = true ]; then
        echo -e "${YELLOW}⚠️  前端检测失败${NC}"
    fi
    
    if [ "$BACKEND_FAILED" = true ]; then
        echo -e "${YELLOW}⚠️  后端检测失败${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}💡 建议:${NC}"
    echo -e "   1. 先修复前端问题: cd frontend && ./scripts/frontend-check.sh"
    echo -e "   2. 再修复后端问题: cd backend && ./scripts/backend-check.sh"
    echo -e "   3. 修复完成后重新运行全量检测"
    echo ""
    
    exit 1
else
    echo -e "${GREEN}✅ 所有检测通过！代码质量良好${NC}"
    echo ""
    echo -e "📊 统计信息:"
    echo -e "   - 耗时: ${BLUE}${DURATION}秒${NC}"
    echo ""
    echo -e "${GREEN}🎉 恭喜！您的代码质量非常棒！${NC}"
    echo ""
    
    exit 0
fi
