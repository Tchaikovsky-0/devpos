#!/bin/bash

# 前端检测脚本 (执行前端代码质量检测)
# 使用方法: ./frontend-check.sh [--quick] [--full]

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
echo -e "${BLUE}║      前端代码质量检测 - Monitor Agent        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}检测模式: ${MODE}${NC}"
echo ""

# 切换到前端目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

if [ ! -d "${FRONTEND_DIR}" ]; then
    echo -e "${RED}❌ 未找到前端目录: ${FRONTEND_DIR}${NC}"
    echo -e "${YELLOW}当前目录: $(pwd)${NC}"
    echo -e "${YELLOW}脚本目录: ${SCRIPT_DIR}${NC}"
    echo -e "${YELLOW}项目根目录: ${PROJECT_ROOT}${NC}"
    exit 1
fi

cd "${FRONTEND_DIR}" || exit 1
echo -e "${GREEN}✓ 切换到前端目录: ${FRONTEND_DIR}${NC}"
echo ""

# 初始化计数器
TOTAL_ERRORS=0
TOTAL_WARNINGS=0
START_TIME=$(date +%s)

# 检测函数
check_typescript() {
    echo -e "${BLUE}[1/5] TypeScript 类型检查...${NC}"
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ 未找到 pnpm，请先安装 pnpm${NC}"
        return 1
    fi
    
    OUTPUT=$(pnpm exec tsc --noEmit 2>&1 || true)
    
    if [ -z "$OUTPUT" ]; then
        echo -e "${GREEN}✓ TypeScript 类型检查通过${NC}"
        return 0
    else
        ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error TS" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        
        echo -e "${RED}❌ 发现 ${ERROR_COUNT} 个 TypeScript 错误${NC}"
        echo ""
        echo "$OUTPUT" | head -20
        echo ""
        
        if [ $ERROR_COUNT -gt 5 ]; then
            echo -e "${YELLOW}... 仅显示前20行，完整输出请查看日志${NC}"
        fi
        
        return 1
    fi
}

check_eslint() {
    echo -e "${BLUE}[2/5] ESLint 代码规范检查...${NC}"
    
    OUTPUT=$(pnpm lint 2>&1 || true)
    
    if echo "$OUTPUT" | grep -q "0 problems"; then
        echo -e "${GREEN}✓ ESLint 检查通过${NC}"
        return 0
    else
        ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error" || true)
        WARNING_COUNT=$(echo "$OUTPUT" | grep -c "warning" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        TOTAL_WARNINGS=$((TOTAL_WARNINGS + WARNING_COUNT))
        
        if [ $ERROR_COUNT -gt 0 ]; then
            echo -e "${RED}❌ 发现 ${ERROR_COUNT} 个错误, ${WARNING_COUNT} 个警告${NC}"
        else
            echo -e "${YELLOW}⚠ 发现 ${WARNING_COUNT} 个警告${NC}"
        fi
        
        echo ""
        echo "$OUTPUT" | grep -E "(error|warning)" | head -10
        echo ""
        
        if [ $WARNING_COUNT -gt 10 ]; then
            echo -e "${YELLOW}... 仅显示前10条，完整输出请查看日志${NC}"
        fi
        
        return 1
    fi
}

check_build() {
    if [ "$MODE" == "quick" ]; then
        echo -e "${YELLOW}[3/5] 构建检查 (快速模式，跳过)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}[3/5] 构建检查...${NC}"
    
    OUTPUT=$(pnpm build 2>&1 || true)
    
    if echo "$OUTPUT" | grep -q "Build completed"; then
        echo -e "${GREEN}✓ 构建成功${NC}"
        return 0
    else
        ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
        
        echo -e "${RED}❌ 构建失败，发现 ${ERROR_COUNT} 个错误${NC}"
        echo ""
        echo "$OUTPUT" | grep -E "(error|Error)" | head -10
        echo ""
        
        return 1
    fi
}

check_dependencies() {
    if [ "$MODE" == "quick" ]; then
        echo -e "${YELLOW}[4/5] 依赖安全检查 (快速模式，跳过)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}[4/5] 依赖安全检查...${NC}"
    
    OUTPUT=$(pnpm audit 2>&1 || true)
    
    if echo "$OUTPUT" | grep -q "No known vulnerabilities found"; then
        echo -e "${GREEN}✓ 依赖安全检查通过${NC}"
        return 0
    else
        VULN_COUNT=$(echo "$OUTPUT" | grep -c "vulnerability" || true)
        TOTAL_WARNINGS=$((TOTAL_WARNINGS + VULN_COUNT))
        
        echo -e "${YELLOW}⚠ 发现 ${VULN_COUNT} 个安全漏洞${NC}"
        echo ""
        echo "$OUTPUT" | grep -E "(vulnerability|high|critical)" | head -5
        echo ""
        
        return 1
    fi
}

check_tests() {
    if [ "$MODE" != "full" ]; then
        echo -e "${YELLOW}[5/5] 单元测试 (仅全量模式)${NC}"
        return 0
    fi
    
    echo -e "${BLUE}[5/5] 单元测试...${NC}"
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠ 未配置测试脚本，跳过${NC}"
        return 0
    fi
    
    OUTPUT=$(pnpm test 2>&1 || true)
    
    if echo "$OUTPUT" | grep -q "passed"; then
        PASSED=$(echo "$OUTPUT" | grep -o "[0-9]* passed" | head -1)
        echo -e "${GREEN}✓ 单元测试通过: ${PASSED}${NC}"
        return 0
    else
        FAILED=$(echo "$OUTPUT" | grep -c "failed" || true)
        TOTAL_ERRORS=$((TOTAL_ERRORS + FAILED))
        
        echo -e "${RED}❌ 单元测试失败: ${FAILED} 个测试失败${NC}"
        echo ""
        echo "$OUTPUT" | grep -E "(FAIL|Error)" | head -10
        echo ""
        
        return 1
    fi
}

# 执行检测
echo -e "${YELLOW}开始检测...${NC}"
echo ""

ERRORS=()

check_typescript || ERRORS+=("TypeScript")
check_eslint || ERRORS+=("ESLint")
check_build || ERRORS+=("Build")
check_dependencies || ERRORS+=("Dependencies")
check_tests || ERRORS+=("Tests")

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
    echo -e "   2. 查看详细日志: pnpm lint 或 pnpm exec tsc --noEmit"
    echo -e "   3. 自动修复部分问题: pnpm lint --fix"
    echo ""
    
    exit 1
fi
