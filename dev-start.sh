#!/bin/bash

# 全链路开发环境启动脚本
# 支持前后端热加载

set -e

echo "🚀 启动全链路开发环境（热加载模式）"
echo "========================================"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，正在创建..."
    cat > .env << EOF
# 数据库配置
MYSQL_ROOT_PASSWORD=root_password_change_me
MYSQL_DATABASE=xunjianbao
MYSQL_USER=xunjianbao
MYSQL_PASSWORD=change_password

# Redis 配置
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your-jwt-secret-at-least-32-chars-change-in-production

# 服务配置
OPENCLAW_URL=http://openclaw:8096
OPENCLAW_TOKEN=
AI_SERVICE_URL=http://ai:8095
YOLO_SERVICE_URL=http://yolo:8097
YOLO_DEVICE=cpu

# 数据库 URL（本地开发用）
DATABASE_URL=xunjianbao:change_password@tcp(localhost:3306)/xunjianbao?charset=utf8mb4&parseTime=True&loc=Local
EOF
    echo "✅ .env 文件已创建"
fi

# 停止现有容器
echo ""
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.dev.yaml down

# 清理旧的构建缓存（可选）
# echo "🧹 清理构建缓存..."
# docker-compose -f docker-compose.dev.yaml build --no-cache

# 构建镜像
echo ""
echo "🔨 构建开发镜像..."
docker-compose -f docker-compose.dev.yaml build

# 启动服务
echo ""
echo "🎯 启动服务..."
docker-compose -f docker-compose.dev.yaml up -d

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 显示服务状态
echo ""
echo "📊 服务状态:"
docker-compose -f docker-compose.dev.yaml ps

# 显示日志
echo ""
echo "📋 实时日志（按 Ctrl+C 退出）:"
echo "========================================"
docker-compose -f docker-compose.dev.yaml logs -f
