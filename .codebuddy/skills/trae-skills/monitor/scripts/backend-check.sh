#!/bin/bash

# 后端检测脚本 (执行后端代码质量检测)
# 使用方法: ./backend-check.sh [--quick] [--full]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检测模式
MODE="standard"
if [ "$1" == "--quick" ]; then
    MODE="quick"
elif [ "$1" == "--full" ]; then
    MODE="full"
fi

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      后端代码质量检测 - Monitor Agent        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}检测模式: ${MODE}${NC}"
echo ""

# 切换到后端目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"

if [ ! -d "${BACKEND_DIR}" ]; then
    echo -e "${RED}❌ 未找到后端目录: ${BACKEND_DIR}${NC}"
    exit 1
fi

cd "${BACKEND_DIR}" || exit 1

# 初始化计数器
TOTAL_ERRORS=0
TOTAL_WARNINGS=0
START_TIME=$(date +%s)

# 检测函数
check_go_vet() {
    echo -e "${BLUE}[1/5] Go Vet 安全扫描...${NC}"
    
    if ! command -v go &> /dev/null; then
        echo -e "${RED}❌ 未找到 go，请先安装 Go${NC}"
        return 1
    fi
    
    OUTPUT=$(go vet ./... 2>&1 || true)
    
    if [ -z "$OUTPUT" ]; then
        echo -e "${GREEN}✓ Go Vet 检查通过${NC}"
        return 0
    else
        ERROR_COUNT=$(echo "$OUTPUT" | grep -c "go:" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        
        echo -e "${RED}❌ 发现 ${ERROR_COUNT} 个问题${NC}"
        echo ""
        echo "$OUTPUT" | head -20
        echo ""
        
        if [ $ERROR_COUNT -gt 5 ]; then
            echo -e "${YELLOW}... 仅显示前20行，完整输出请查看日志${NC}"
        fi
        
        return 1
    fi
}

check_golangci_lint() {
    echo -e "${BLUE}[2/5] GolangCI-Lint 代码规范检查...${NC}"
    
    if ! command -v golangci-lint &> /dev/null; then
        echo -e "${YELLOW}⚠ 未安装 golangci-lint，跳过此检测${NC}"
        echo -e "${YELLOW}安装方法: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest${NC}"
        return 0
    fi
    
    OUTPUT=$(golangci-lint run ./... 2>&1 || true)
    
    if [ -z "$OUTPUT" ]; then
        echo -e "${GREEN}✓ GolangCI-Lint 检查通过${NC}"
        return 0
    else
        ERROR_COUNT=$(echo "$OUTPUT" | grep -c "Error\|error" || true)
        WARNING_COUNT=$(echo "$OUTPUT" | grep -c "Warning\|warning" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        TOTAL_WARNINGS=$((TOTAL_WARNINGS + WARNING_COUNT))
        
        if [ $ERROR_COUNT -gt 0 ]; then
            echo -e "${RED}❌ 发现 ${ERROR_COUNT} 个错误, ${WARNING_COUNT} 个警告${NC}"
        else
            echo -e "${YELLOW}⚠ 发现 ${WARNING_COUNT} 个警告${NC}"
        fi
        
        echo ""
        echo "$OUTPUT" | head -20
        echo ""
        
        if [ $WARNING_COUNT -gt 10 ]; then
            echo -e "${YELLOW}... 仅显示前20行，完整输出请查看日志${NC}"
        fi
        
        return 1
    fi
}

check_go_test() {
    if [ "$MODE" == "quick" ]; then
        echo -e "${YELLOW}[3/5] 单元测试 (快速模式，跳过)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}[3/5] 单元测试...${NC}"
    
    OUTPUT=$(go test -v ./... 2>&1 || true)
    
    if echo "$OUTPUT" | grep -q "PASS"; then
        PASSED=$(echo "$OUTPUT" | grep -c "PASS" || true)
        echo -e "${GREEN}✓ 单元测试通过: ${PASSED} 个测试${NC}"
        return 0
    else
        FAILED=$(echo "$OUTPUT" | grep -c "FAIL" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + FAILED))
        
        echo -e "${RED}❌ 单元测试失败: ${FAILED} 个测试失败${NC}"
        echo ""
        echo "$OUTPUT" | grep -E "(FAIL|Error)" | head -10
        echo ""
        
        return 1
    fi
}

check_go_build() {
    if [ "$MODE" == "quick" ]; then
        echo -e "${YELLOW}[4/5] 构建检查 (快速模式，跳过)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}[4/5] 构建检查...${NC}"
    
    OUTPUT=$(go build ./... 2>&1 || true)
    
    if [ -z "$OUTPUT" ]; then
        echo -e "${GREEN}✓ 构建成功${NC}"
        return 0
    else
        ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        
        echo -e "${RED}❌ 构建失败，发现 ${ERROR_COUNT} 个错误${NC}"
        echo ""
        echo "$OUTPUT" | head -20
        echo ""
        
        return 1
    fi
}

check_dependencies() {
    if [ "$MODE" == "quick" ]; then
        echo -e "${YELLOW}[5/5] 依赖检查 (快速模式，跳过)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}[5/5] 依赖检查...${NC}"
    
    OUTPUT=$(go list -m all 2>&1 || true)
    
    if [ $? -eq 0 ]; then
        DEP_COUNT=$(echo "$OUTPUT" | wc -l | tr -d ' ')
        echo -e "${GREEN}✓ 依赖检查通过: ${DEP_COUNT} 个依赖${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ 依赖检查出现问题${NC}"
        echo ""
        echo "$OUTPUT" | head -10
        echo ""
        
        return 1
    fi
}

# 执行检测
echo -e "${YELLOW}开始检测...${NC}"
echo ""

ERRORS=()

check_go_vet || ERRORS+=("Go Vet")
check_golangci_lint || ERRORS+=("GolangCI-Lint")
check_go_test || ERRORS+=("Tests")
check_go_build || ERRORS+=("Build")
check_dependencies || ERRORS+=("Dependencies")

# 计算耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 生成报告
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              检测结果汇总                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

if [ $TOTAL_ERRORS -eq 0 ] && [ $TOTAL_WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检测通过！${NC}"
    echo ""
    echo -e "📊 统计信息:"
    echo -e "   - 错误: ${GREEN}0${NC}"
    echo -e "   - 警告: ${GREEN}0${NC}"
    echo -e "   - 耗时: ${BLUE}${DURATION}秒${NC}"
    exit 0
else
    echo -e "${RED}❌ 检测发现问题${NC}"
    echo ""
    echo -e "📊 统计信息:"
    echo -e "   - 错误: ${RED}${TOTAL_ERRORS}${NC}"
    echo -e "   - 警告: ${YELLOW}${TOTAL_WARNINGS}${NC}"
    echo -e "   - 耗时: ${BLUE}${DURATION}秒${NC}"
    echo ""
    
    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  失败的检测项:${NC}"
        for error in "${ERRORS[@]}"; do
            echo -e "   - ${RED}${error}${NC}"
        done
        echo ""
    fi
    
    echo -e "${YELLOW}💡 建议:${NC}"
    echo -e "   1. 修复所有错误后再提交代码"
    echo -e "   2. 查看详细日志: go vet ./... 或 golangci-lint run ./..."
    echo -e "   3. 自动修复部分问题: go fmt ./..."
    echo ""
    
    exit 1
fi
