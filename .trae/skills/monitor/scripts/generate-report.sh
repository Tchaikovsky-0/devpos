#!/bin/bash

# 监控报告生成器 - 生成详细的监控报告
# 使用方法: ./generate-report.sh [--period daily|weekly|monthly]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 参数
PERIOD=${1:-"daily"}
PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REPORT_DIR="${PROJECT_ROOT}/.trae/reports"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="${REPORT_DIR}/monitor-report-${TIMESTAMP}.md"

# 创建报告目录
mkdir -p "${REPORT_DIR}"

echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║       监控报告生成器 - Monitor Agent         ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}报告周期: ${PERIOD}${NC}"
echo -e "${YELLOW}报告文件: ${REPORT_FILE}${NC}"
echo ""

# 初始化统计数据
TOTAL_ERRORS=0
TOTAL_WARNINGS=0
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
START_TIME=$(date +%s)

# 生成报告头部
generate_header() {
    cat > "${REPORT_FILE}" << EOF
# 📊 监控报告

**生成时间**: $(date +"%Y-%m-%d %H:%M:%S")
**报告周期**: ${PERIOD}
**项目路径**: ${PROJECT_ROOT}

---

## 📈 整体健康度

EOF
}

# 检测前端
check_frontend() {
    echo -e "${BLUE}[1/2] 检测前端代码质量...${NC}"
    
    FRONTEND_DIR="${PROJECT_ROOT}/frontend"
    if [ ! -d "${FRONTEND_DIR}" ]; then
        echo -e "${YELLOW}⚠ 未找到前端目录，跳过${NC}"
        return 0
    fi
    
    cd "${FRONTEND_DIR}"
    
    # TypeScript检测
    echo -e "${BLUE}  - TypeScript类型检查...${NC}"
    TS_OUTPUT=$(pnpm exec tsc --noEmit 2>&1 || true)
    TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || true)
    TOTAL_ERRORS=$((TOTAL_ERRORS + TS_ERRORS))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ $TS_ERRORS -eq 0 ]; then
        echo -e "${GREEN}    ✓ TypeScript检查通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        TS_STATUS="✅ 通过"
    else
        echo -e "${RED}    ✗ 发现${TS_ERRORS}个TypeScript错误${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        TS_STATUS="❌ 失败"
    fi
    
    # ESLint检测
    echo -e "${BLUE}  - ESLint代码规范检查...${NC}"
    ESLINT_OUTPUT=$(pnpm lint 2>&1 || true)
    ESLINT_WARNINGS=$(echo "$ESLINT_OUTPUT" | grep -c "warning" || true)
    TOTAL_WARNINGS=$((TOTAL_WARNINGS + ESLINT_WARNINGS))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if echo "$ESLINT_OUTPUT" | grep -q "0 problems"; then
        echo -e "${GREEN}    ✓ ESLint检查通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        ESLINT_STATUS="✅ 通过"
    else
        echo -e "${YELLOW}    ⚠ 发现${ESLINT_WARNINGS}个警告${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        ESLINT_STATUS="⚠️ 警告"
    fi
    
    cd "${PROJECT_ROOT}"
    
    # 写入报告
    cat >> "${REPORT_FILE}" << EOF

### 前端检测结果

| 检测项 | 状态 | 错误数 | 警告数 |
|--------|------|--------|--------|
| TypeScript | ${TS_STATUS} | ${TS_ERRORS} | 0 |
| ESLint | ${ESLINT_STATUS} | 0 | ${ESLINT_WARNINGS} |

EOF
}

# 检测后端
check_backend() {
    echo -e "${BLUE}[2/2] 检测后端代码质量...${NC}"
    
    BACKEND_DIR="${PROJECT_ROOT}/backend"
    if [ ! -d "${BACKEND_DIR}" ]; then
        echo -e "${YELLOW}⚠ 未找到后端目录，跳过${NC}"
        return 0
    fi
    
    cd "${BACKEND_DIR}"
    
    # Go Vet检测
    echo -e "${BLUE}  - Go Vet安全扫描...${NC}"
    VET_OUTPUT=$(go vet ./... 2>&1 || true)
    VET_ERRORS=$(echo "$VET_OUTPUT" | grep -c "go:" || true)
    TOTAL_ERRORS=$((TOTAL_ERRORS + VET_ERRORS))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ $VET_ERRORS -eq 0 ]; then
        echo -e "${GREEN}    ✓ Go Vet检查通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        VET_STATUS="✅ 通过"
    else
        echo -e "${RED}    ✗ 发现${VET_ERRORS}个问题${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        VET_STATUS="❌ 失败"
    fi
    
    # Go Test检测
    echo -e "${BLUE}  - Go单元测试...${NC}"
    TEST_OUTPUT=$(go test ./... 2>&1 || true)
    TEST_FAILED=$(echo "$TEST_OUTPUT" | grep -c "FAIL" || true)
    TOTAL_ERRORS=$((TOTAL_ERRORS + TEST_FAILED))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ $TEST_FAILED -eq 0 ]; then
        echo -e "${GREEN}    ✓ 单元测试通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        TEST_STATUS="✅ 通过"
    else
        echo -e "${RED}    ✗ ${TEST_FAILED}个测试失败${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        TEST_STATUS="❌ 失败"
    fi
    
    cd "${PROJECT_ROOT}"
    
    # 写入报告
    cat >> "${REPORT_FILE}" << EOF

### 后端检测结果

| 检测项 | 状态 | 错误数 | 警告数 |
|--------|------|--------|--------|
| Go Vet | ${VET_STATUS} | ${VET_ERRORS} | 0 |
| 单元测试 | ${TEST_STATUS} | ${TEST_FAILED} | 0 |

EOF
}

# 生成报告尾部
generate_footer() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # 计算健康度
    if [ $TOTAL_ERRORS -eq 0 ] && [ $TOTAL_WARNINGS -eq 0 ]; then
        HEALTH_SCORE=100
        HEALTH_STATUS="优秀"
    elif [ $TOTAL_ERRORS -eq 0 ]; then
        HEALTH_SCORE=$((100 - TOTAL_WARNINGS * 2))
        HEALTH_STATUS="良好"
    else
        HEALTH_SCORE=$((100 - TOTAL_ERRORS * 10 - TOTAL_WARNINGS * 2))
        if [ $HEALTH_SCORE -lt 0 ]; then
            HEALTH_SCORE=0
        fi
        HEALTH_STATUS="需改进"
    fi
    
    # 写入统计信息
    cat >> "${REPORT_FILE}" << EOF

---

## 📊 统计信息

| 指标 | 数值 |
|------|------|
| 总检测项 | ${TOTAL_CHECKS} |
| 通过检测 | ${PASSED_CHECKS} |
| 失败检测 | ${FAILED_CHECKS} |
| 总错误数 | ${TOTAL_ERRORS} |
| 总警告数 | ${TOTAL_WARNINGS} |
| 健康度 | ${HEALTH_SCORE}/100 |
| 健康状态 | ${HEALTH_STATUS} |
| 检测耗时 | ${DURATION}秒 |

---

## 🎯 改进建议

EOF

    # 根据错误类型提供建议
    if [ $TOTAL_ERRORS -gt 0 ]; then
        cat >> "${REPORT_FILE}" << EOF

### 🔴 必须修复 (P0)

1. **修复所有编译错误**
   - TypeScript类型错误
   - Go编译错误
   - Python语法错误

2. **修复安全漏洞**
   - 高危安全漏洞
   - 中危安全漏洞

EOF
    fi

    if [ $TOTAL_WARNINGS -gt 0 ]; then
        cat >> "${REPORT_FILE}" << EOF

### ⚠️ 建议修复 (P1)

1. **清理代码规范问题**
   - 删除未使用的导入
   - 修复ESLint警告
   - 优化代码格式

2. **提升代码质量**
   - 补充单元测试
   - 添加类型定义
   - 优化代码结构

EOF
    fi

    # 添加报告签名
    cat >> "${REPORT_FILE}" << EOF

---

**报告生成器**: Monitor Agent
**报告ID**: MON-${TIMESTAMP}
**下次检测**: $(date -v+1d +"%Y-%m-%d %H:%M:%S" 2>/dev/null || date -d "+1 day" +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "明天此时")

---

> 💡 **提示**: 本报告由Monitor Agent自动生成，如需查看历史报告，请访问 \`.trae/reports/\` 目录
EOF

    echo ""
    echo -e "${GREEN}✓ 报告生成完成: ${REPORT_FILE}${NC}"
}

# 主函数
main() {
    generate_header
    check_frontend
    check_backend
    generate_footer
    
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║              检测结果汇总                     ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ $TOTAL_ERRORS -eq 0 ] && [ $TOTAL_WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ 所有检测通过！代码质量优秀${NC}"
    elif [ $TOTAL_ERRORS -eq 0 ]; then
        echo -e "${YELLOW}⚠️ 检测通过，但有${TOTAL_WARNINGS}个警告${NC}"
    else
        echo -e "${RED}❌ 检测失败: ${TOTAL_ERRORS}个错误, ${TOTAL_WARNINGS}个警告${NC}"
    fi
    
    echo ""
    echo -e "📊 统计信息:"
    echo -e "   - 总检测项: ${BLUE}${TOTAL_CHECKS}${NC}"
    echo -e "   - 通过: ${GREEN}${PASSED_CHECKS}${NC}"
    echo -e "   - 失败: ${RED}${FAILED_CHECKS}${NC}"
    echo -e "   - 错误: ${RED}${TOTAL_ERRORS}${NC}"
    echo -e "   - 警告: ${YELLOW}${TOTAL_WARNINGS}${NC}"
    echo -e "   - 耗时: ${BLUE}${DURATION}秒${NC}"
    echo ""
}

main
