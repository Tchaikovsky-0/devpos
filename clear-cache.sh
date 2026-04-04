#!/bin/bash
# 清理前端缓存脚本

set -e

echo "正在清理缓存..."

# 清理 Vite 缓存
if [ -d "frontend/.vite" ]; then
  rm -rf frontend/.vite
  echo "✓ 已清理 .vite 缓存"
fi

# 清理 node_modules 缓存
if [ -d "frontend/node_modules/.cache" ]; then
  rm -rf frontend/node_modules/.cache
  echo "✓ 已清理 node_modules/.cache"
fi

# 清理构建产物
if [ -d "frontend/dist" ]; then
  rm -rf frontend/dist
  echo "✓ 已清理 dist 目录"
fi

# 清理浏览器缓存提示
echo ""
echo "浏览器缓存清理:"
echo "  Mac: Cmd + Shift + R"
echo "  Windows/Linux: Ctrl + Shift + R"

# 如果指定了 --restart 参数，重启开发服务器
if [ "$1" = "--restart" ]; then
  echo ""
  echo "正在重启开发服务器..."
  cd frontend && pnpm dev
fi

echo ""
echo "清理完成！"
