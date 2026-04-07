#!/bin/bash

# Git Pre-Commit Hook - 代码提交前自动检测
# 安装方法: cp pre-commit.hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Git Pre-Commit 检测 - Monitor Agent      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# 获取项目根目录
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
MONITOR_SCRIPT="${PROJECT_ROOT}/.trae/skills/monitor/scripts/full-check.sh"

# 检查Monitor脚本是否存在
if [ ! -f "${MONITOR_SCRIPT}" ]; then
    echo -e "${YELLOW}⚠ Monitor脚本不存在，跳过检测${NC}"
    echo -e "${YELLOW}脚本路径: ${MONITOR_SCRIPT}${NC}"
    exit 0
fi

# 获取暂存的文件
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|go|py)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✓ 没有代码文件变更，跳过检测${NC}"
    exit 0
fi

echo -e "${YELLOW}检测到以下文件变更:${NC}"
echo "$STAGED_FILES" | while read file; do
    echo -e "  - ${BLUE}${file}${NC}"
done
echo ""

# 运行快速检测
echo -e "${YELLOW}开始执行提交前检测...${NC}"
echo ""

if "${MONITOR_SCRIPT}" --quick; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✅ 检测通过，可以提交代码            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         ❌ 检测失败，请修复后再提交          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "   1. 修复上述错误后再提交"
    echo -e "   2. 使用 ${BLUE}git commit --no-verify${NC} 跳过检测（不推荐）"
    echo -e "   3. 查看详细报告: ${BLUE}${MONITOR_SCRIPT}${NC}"
    echo ""
    exit 1
fi
