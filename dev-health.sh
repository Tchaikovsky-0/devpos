#!/bin/bash

# 开发环境健康检查脚本

set -e

echo "🔍 检查开发环境健康状态"
echo "========================================"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi
echo "✅ Docker 运行正常"

# 检查容器状态
echo ""
echo "📊 容器状态:"
docker-compose -f docker-compose.dev.yaml ps

# 检查前端
echo ""
echo "🌐 检查前端服务..."
if curl -fsS http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务正常 (http://localhost:3000)"
else
    echo "⚠️  前端服务未响应"
fi

# 检查后端
echo ""
echo "🔧 检查后端服务..."
if curl -fsS http://localhost:8094/health > /dev/null; then
    echo "✅ 后端服务正常 (http://localhost:8094/health)"
else
    echo "⚠️  后端服务未响应"
fi

# 检查 MySQL
echo ""
echo "🗄️  检查 MySQL..."
if docker-compose -f docker-compose.dev.yaml exec -T mysql mysqladmin ping -h localhost > /dev/null 2>&1; then
    echo "✅ MySQL 正常"
else
    echo "⚠️  MySQL 未就绪"
fi

# 检查 Redis
echo ""
echo "📦 检查 Redis..."
if docker-compose -f docker-compose.dev.yaml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 正常"
else
    echo "⚠️  Redis 未就绪"
fi

echo ""
echo "========================================"
echo "✨ 健康检查完成"
