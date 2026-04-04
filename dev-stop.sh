#!/bin/bash

# 停止开发环境脚本

set -e

echo "🛑 停止开发环境"
echo "========================================"

# 停止服务
docker-compose -f docker-compose.dev.yaml down

echo ""
echo "✅ 开发环境已停止"
