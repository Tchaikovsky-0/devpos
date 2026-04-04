#!/bin/bash

# 开发环境验证清单

echo "🔍 开发环境配置验证"
echo "========================================"
echo ""

# 1. 检查必要文件
echo "📁 检查配置文件..."
files=(
  "docker-compose.dev.yaml"
  "dev-start.sh"
  "dev-stop.sh"
  "dev-health.sh"
  ".env.example"
  "backend/Dockerfile.dev"
  "backend/.air.toml"
  "frontend/Dockerfile.dev"
)

missing_files=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (缺失)"
    missing_files=$((missing_files + 1))
  fi
done

echo ""

# 2. 检查脚本权限
echo "🔐 检查脚本权限..."
scripts=("dev-start.sh" "dev-stop.sh" "dev-health.sh")
for script in "${scripts[@]}"; do
  if [ -x "$script" ]; then
    echo "  ✅ $script 可执行"
  else
    echo "  ⚠️  $script 不可执行，正在修复..."
    chmod +x "$script"
  fi
done

echo ""

# 3. 检查代码修改
echo "📝 检查认证跳过配置..."
if grep -q "import.meta.env.DEV" frontend/src/api/client.ts; then
  echo "  ✅ 前端认证跳过已配置"
else
  echo "  ❌ 前端认证跳过未配置"
fi

if grep -q "GIN_MODE.*debug" backend/internal/middleware/auth.go; then
  echo "  ✅ 后端认证跳过已配置"
else
  echo "  ❌ 后端认证跳过未配置"
fi

if grep -q "GIN_MODE: debug" docker-compose.dev.yaml; then
  echo "  ✅ Docker Compose 环境变量已配置"
else
  echo "  ❌ Docker Compose 环境变量未配置"
fi

echo ""

# 4. 检查文档
echo "📚 检查文档..."
docs=(
  "DEV_QUICKSTART.md"
  "DEV_GUIDE.md"
  "DEV_AUTH_BYPASS.md"
  "HOT_RELOAD_GUIDE.md"
  "AUTH_REMOVED.md"
  "DEV_READY.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc (缺失)"
  fi
done

echo ""

# 5. 检查环境变量
echo "🔧 检查环境变量..."
if [ -f ".env" ]; then
  echo "  ✅ .env 文件存在"
  if grep -q "JWT_SECRET" .env; then
    echo "  ✅ JWT_SECRET 已设置"
  else
    echo "  ⚠️  JWT_SECRET 未设置"
  fi
else
  echo "  ⚠️  .env 文件不存在（请复制 .env.example）"
  echo "  💡 运行: cp .env.example .env"
fi

echo ""

# 6. Docker 检查
echo "🐳 检查 Docker..."
if command -v docker &> /dev/null; then
  if docker info &> /dev/null; then
    echo "  ✅ Docker 运行正常"
  else
    echo "  ❌ Docker 未运行"
  fi
else
  echo "  ❌ Docker 未安装"
fi

if command -v docker-compose &> /dev/null; then
  echo "  ✅ Docker Compose 已安装"
else
  echo "  ⚠️  Docker Compose 未安装（可使用 docker compose）"
fi

echo ""
echo "========================================"

if [ $missing_files -eq 0 ]; then
  echo "✅ 所有配置文件完整"
  echo ""
  echo "🚀 准备就绪！运行以下命令启动："
  echo "   ./dev-start.sh"
  echo ""
  echo "📖 查看快速启动指南："
  echo "   cat DEV_QUICKSTART.md"
else
  echo "❌ 有 $missing_files 个文件缺失，请检查"
fi

echo ""
echo "========================================"
