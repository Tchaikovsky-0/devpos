#!/bin/bash

# 规则文件清理脚本
# 执行前请确保已备份重要文件

echo "🧹 开始清理旧规则文件..."
echo ""

cd "$(dirname "$0")"

# 待删除的文件列表
OLD_FILES=(
    "frontend_dev_debug_rules.md"
    "frontend_performance_rules.md"
    "frontend_stability_rules.md"
    "ai_detection_rules.md"
    "anti_hallucination_rules.md"
    "global_dev_rules.md"
    "debugging_rules.md"
    "testing_refactoring_rules.md"
    "documentation_rules.md"
    "CHANGELOG_2026-04-02.md"
    "CHANGELOG_2026-04-02_v2.md"
    "AGENT_INTEGRATION_SUMMARY.md"
    "AGENT_QUICK_REFERENCE.md"
    "RULES_OPTIMIZATION_PLAN.md"
)

# 创建归档目录
mkdir -p archive

# 移动到归档目录
for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📦 归档: $file → archive/"
        mv "$file" archive/
    else
        echo "⏭️  跳过: $file (不存在)"
    fi
done

echo ""
echo "✅ 清理完成！"
echo ""
echo "当前规则目录结构："
echo "├── $(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ') 个核心规则文件"
echo "└── archive/ $(ls -1 archive/ 2>/dev/null | wc -l | tr -d ' ') 个归档文件"
echo ""
echo "新规则文件："
ls -1 *.md 2>/dev/null | sed 's/^/  • /'
echo ""
echo "归档文件："
ls -1 archive/ 2>/dev/null | sed 's/^/  • /'
