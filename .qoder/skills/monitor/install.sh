#!/bin/bash

# Monitor Agent 安装脚本
# 使用方法: ./install.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MONITOR_DIR="${PROJECT_ROOT}/.trae/skills/monitor"

echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║      Monitor Agent 安装程序                  ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# 检查必要文件
echo -e "${BLUE}[1/5] 检查必要文件...${NC}"
REQUIRED_FILES=(
    "${MONITOR_DIR}/SKILL.md"
    "${MONITOR_DIR}/scripts/frontend-check.sh"
    "${MONITOR_DIR}/scripts/backend-check.sh"
    "${MONITOR_DIR}/scripts/full-check.sh"
    "${MONITOR_DIR}/scripts/generate-report.sh"
    "${MONITOR_DIR}/hooks/pre-commit.hook.sh"
    "${MONITOR_DIR}/config.json"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}  ✗ 文件不存在: ${file}${NC}"
        ALL_FILES_EXIST=false
    else
        echo -e "${GREEN}  ✓ ${file}${NC}"
    fi
done

if [ "$ALL_FILES_EXIST" = false ]; then
    echo -e "${RED}❌ 缺少必要文件，请先创建Monitor Agent${NC}"
    exit 1
fi

# 设置脚本权限
echo ""
echo -e "${BLUE}[2/5] 设置脚本执行权限...${NC}"
SCRIPTS=(
    "${MONITOR_DIR}/scripts/frontend-check.sh"
    "${MONITOR_DIR}/scripts/backend-check.sh"
    "${MONITOR_DIR}/scripts/full-check.sh"
    "${MONITOR_DIR}/scripts/generate-report.sh"
    "${MONITOR_DIR}/hooks/pre-commit.hook.sh"
)

for script in "${SCRIPTS[@]}"; do
    chmod +x "$script"
    echo -e "${GREEN}  ✓ ${script}${NC}"
done

# 创建报告目录
echo ""
echo -e "${BLUE}[3/5] 创建报告目录...${NC}"
REPORT_DIR="${PROJECT_ROOT}/.trae/reports"
mkdir -p "${REPORT_DIR}"
echo -e "${GREEN}  ✓ ${REPORT_DIR}${NC}"

# 安装Git Hook
echo ""
echo -e "${BLUE}[4/5] 安装Git Hook...${NC}"
GIT_HOOKS_DIR="${PROJECT_ROOT}/.git/hooks"

if [ -d "${GIT_HOOKS_DIR}" ]; then
    # 备份现有的pre-commit hook
    if [ -f "${GIT_HOOKS_DIR}/pre-commit" ]; then
        BACKUP_FILE="${GIT_HOOKS_DIR}/pre-commit.backup.$(date +%Y%m%d_%H%M%S)"
        cp "${GIT_HOOKS_DIR}/pre-commit" "${BACKUP_FILE}"
        echo -e "${YELLOW}  ⚠ 已备份现有的pre-commit hook到: ${BACKUP_FILE}${NC}"
    fi
    
    # 复制新的hook
    cp "${MONITOR_DIR}/hooks/pre-commit.hook.sh" "${GIT_HOOKS_DIR}/pre-commit"
    chmod +x "${GIT_HOOKS_DIR}/pre-commit"
    echo -e "${GREEN}  ✓ Git pre-commit hook已安装${NC}"
else
    echo -e "${YELLOW}  ⚠ 未找到.git/hooks目录，跳过Git Hook安装${NC}"
    echo -e "${YELLOW}  提示: 请确保在Git仓库中运行此脚本${NC}"
fi

# 创建快捷命令
echo ""
echo -e "${BLUE}[5/5] 创建快捷命令...${NC}"
BIN_DIR="${PROJECT_ROOT}/.trae/bin"
mkdir -p "${BIN_DIR}"

# 创建monitor命令
cat > "${BIN_DIR}/monitor" << 'EOF'
#!/bin/bash
# Monitor Agent 快捷命令

MONITOR_SCRIPTS="$(cd "$(dirname "$0")/../skills/monitor/scripts" && pwd)"

case "$1" in
    check|c)
        shift
        "${MONITOR_SCRIPTS}/full-check.sh" "$@"
        ;;
    frontend|f)
        shift
        "${MONITOR_SCRIPTS}/frontend-check.sh" "$@"
        ;;
    backend|b)
        shift
        "${MONITOR_SCRIPTS}/backend-check.sh" "$@"
        ;;
    report|r)
        shift
        "${MONITOR_SCRIPTS}/generate-report.sh" "$@"
        ;;
    *)
        echo "Monitor Agent - 代码质量监控工具"
        echo ""
        echo "使用方法:"
        echo "  monitor check [options]      - 全量检测"
        echo "  monitor frontend [options]   - 前端检测"
        echo "  monitor backend [options]    - 后端检测"
        echo "  monitor report [period]      - 生成报告"
        echo ""
        echo "选项:"
        echo "  --quick     - 快速检测（仅P0项目）"
        echo "  --full      - 全量检测（P0+P1+P2）"
        echo ""
        echo "示例:"
        echo "  monitor check --quick        - 快速全量检测"
        echo "  monitor frontend             - 前端标准检测"
        echo "  monitor backend --full       - 后端全量检测"
        echo "  monitor report daily         - 生成日报"
        ;;
esac
EOF

chmod +x "${BIN_DIR}/monitor"
echo -e "${GREEN}  ✓ 快捷命令已创建: ${BIN_DIR}/monitor${NC}"

# 完成
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Monitor Agent 安装完成！          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 使用方法:${NC}"
echo ""
echo -e "  ${BLUE}# 方式一：使用快捷命令${NC}"
echo -e "  ${BIN_DIR}/monitor check --quick"
echo ""
echo -e "  ${BLUE}# 方式二：直接运行脚本${NC}"
echo -e "  ${MONITOR_DIR}/scripts/full-check.sh"
echo ""
echo -e "  ${BLUE}# 方式三：Git提交前自动检测${NC}"
echo -e "  git commit  # 会自动触发pre-commit hook"
echo ""
echo -e "${YELLOW}📚 文档:${NC}"
echo -e "  - Skill文档: ${MONITOR_DIR}/SKILL.md"
echo -e "  - 规则文档: ${PROJECT_ROOT}/.trae/rules/monitor_rules.md"
echo -e "  - 配置文件: ${MONITOR_DIR}/config.json"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "  - 将 ${BIN_DIR} 添加到 PATH 可以直接使用 'monitor' 命令"
echo -e "  - 运行 '${BIN_DIR}/monitor' 查看所有可用命令"
echo ""
