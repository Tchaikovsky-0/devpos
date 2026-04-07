#!/bin/bash
# Trae 技能迁移验证脚本
# 验证所有 CodeBuddy 技能是否已迁移至 Trae

echo "=========================================="
echo "  Trae 技能迁移验证工具"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 需要验证的技能列表
declare -a SKILLS=(
  "agent-creativity-master"
  "agent-lifecycle-guardian"
  "agent-max-power"
  "ai-lead"
  "backend-dev"
  "backend-lead"
  "context-manager"
  "debugging"
  "devops-eng"
  "documentation"
  "error-diagnostician"
  "frontend-dev"
  "frontend-lead"
  "frontend-stability"
  "global-dev"
  "inspector"
  "monitor"
  "open-source-fetcher"
  "openclaw-eng"
  "performance-optimization"
  "project-dev"
  "project-lead"
  "qa-lead"
  "refactor"
  "rollback"
  "skill-dispatcher"
  "test-strategy"
  "xunjianbao-dev"
)

# Trae 独有的推荐技能
declare -a NEW_SKILLS=(
  "fullstack-dev"
  "code-review-expert"
  "mcp-builder"
  "lark-unified"
  "content-factory"
  "canvas-design"
  "react-native-dev"
)

# 统计变量
TOTAL_SKILLS=${#SKILLS[@]}
MIGRATED=0
MISSING=0
NEW_AVAILABLE=0

echo "📋 CodeBuddy 技能迁移验证"
echo "------------------------------------------"
echo ""

# 验证迁移的技能
echo "✅ 已迁移技能验证："
echo ""

for skill in "${SKILLS[@]}"; do
  if [ -d ".trae/skills/$skill" ]; then
    echo -e "${GREEN}✓${NC} $skill - 已迁移"
    ((MIGRATED++))
  else
    echo -e "${RED}✗${NC} $skill - 未迁移"
    ((MISSING++))
  fi
done

echo ""
echo "------------------------------------------"
echo "📊 迁移统计："
echo "  总技能数：$TOTAL_SKILLS"
echo "  已迁移：$MIGRATED"
echo "  未迁移：$MISSING"
echo "  迁移率：$(echo "scale=2; $MIGRATED * 100 / $TOTAL_SKILLS" | bc)%"
echo ""

# 验证新技能
echo ""
echo "🆕 Trae 新增技能可用性："
echo ""

for skill in "${NEW_SKILLS[@]}"; do
  if [ -d ".trae/skills/$skill" ]; then
    echo -e "${GREEN}✓${NC} $skill - 可用"
    ((NEW_AVAILABLE++))
  else
    echo -e "${YELLOW}○${NC} $skill - 不可用"
  fi
done

echo ""
echo "------------------------------------------"
echo "📊 新技能统计："
echo "  检查数量：${#NEW_SKILLS[@]}"
echo "  可用数量：$NEW_AVAILABLE"
echo ""

# 最终结论
echo ""
echo "=========================================="
if [ $MISSING -eq 0 ]; then
  echo -e "${GREEN}✅ 迁移完成！所有 CodeBuddy 技能已成功迁移至 Trae${NC}"
  echo ""
  echo "🎯 建议立即尝试以下技能："
  echo "  • fullstack-dev（全栈开发）"
  echo "  • code-review-expert（代码审查）"
  echo "  • mcp-builder（MCP服务器构建）"
else
  echo -e "${RED}⚠️  存在 $MISSING 个技能未迁移${NC}"
fi
echo "=========================================="
echo ""

exit 0
