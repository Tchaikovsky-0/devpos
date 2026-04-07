#!/bin/bash

# 巡检宝数据恢复脚本
# 使用方法: ./scripts/restore.sh <backup_file>

set -e

if [ -z "$1" ]; then
    echo "用法: $0 <backup_file>"
    echo "示例: $0 /tmp/xunjianbao_backups/xunjianbao_backup_20260406_120000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 数据库配置
MYSQL_HOST=${MYSQL_HOST:-"localhost"}
MYSQL_PORT=${MYSQL_PORT:-"3306"}
MYSQL_USER=${MYSQL_USER:-"xunjianbao"}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-""}
MYSQL_DATABASE=${MYSQL_DATABASE:-"xunjianbao"}

REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-"6379"}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}

echo "=========================================="
echo "巡检宝数据恢复"
echo "=========================================="
echo "备份文件: $BACKUP_FILE"
echo "数据库: $MYSQL_DATABASE@$MYSQL_HOST:$MYSQL_PORT"
echo "Redis: $REDIS_HOST:$REDIS_PORT"
echo "=========================================="

# 确认恢复操作
echo ""
read -p "⚠️  警告: 此操作将覆盖当前数据! 是否继续? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "恢复已取消"
    exit 0
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo ""
echo "[1/4] 解压备份文件..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
echo "✓ 解压完成"

# 找到备份目录
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "20*" | head -1)
if [ -z "$BACKUP_DIR" ]; then
    echo "错误: 无法找到备份数据目录"
    exit 1
fi

# 恢复MySQL数据库
echo ""
echo "[2/4] 恢复MySQL数据库..."
MYSQL_FILE=$(find "$BACKUP_DIR/mysql" -name "*.sql" | head -1)
if [ -n "$MYSQL_FILE" ] && [ -f "$MYSQL_FILE" ]; then
    echo "正在恢复数据库..."
    if [ -n "$MYSQL_PASSWORD" ]; then
        mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$MYSQL_FILE"
    else
        mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" "$MYSQL_DATABASE" < "$MYSQL_FILE"
    fi
    echo "✓ MySQL恢复完成"
else
    echo "⚠ 未找到MySQL备份文件,跳过恢复"
fi

# 恢复Redis数据
echo ""
echo "[3/4] 恢复Redis数据..."
REDIS_FILE=$(find "$BACKUP_DIR/redis" -name "*.rdb" | head -1)
if [ -n "$REDIS_FILE" ] && [ -f "$REDIS_FILE" ]; then
    if command -v redis-cli &> /dev/null; then
        # 获取Redis数据目录
        REDIS_DIR=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET dir | tail -1)
        REDIS_DB=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET dbfilename | tail -1)
        
        # 停止Redis保存
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG SET save ""
        
        # 复制RDB文件
        echo "正在复制RDB文件到 $REDIS_DIR/$REDIS_DB..."
        cp "$REDIS_FILE" "$REDIS_DIR/$REDIS_DB"
        
        # 重启Redis加载数据
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGREWRITEAOF
        
        echo "✓ Redis恢复完成"
    else
        echo "✗ redis-cli 未安装,跳过Redis恢复"
    fi
else
    echo "⚠ 未找到Redis备份文件,跳过恢复"
fi

# 恢复配置文件
echo ""
echo "[4/4] 恢复配置文件..."
if [ -d "$BACKUP_DIR/configs" ]; then
    for config_file in "$BACKUP_DIR/configs"/*; do
        if [ -f "$config_file" ]; then
            filename=$(basename "$config_file")
            read -p "是否恢复配置文件 $filename? (yes/no): " restore_config
            if [ "$restore_config" = "yes" ]; then
                cp "$config_file" "./$filename"
                echo "✓ 已恢复: $filename"
            fi
        fi
    done
else
    echo "⚠ 未找到配置文件备份,跳过恢复"
fi

# 清理临时目录
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo "数据恢复完成!"
echo "=========================================="
echo ""
echo "建议操作:"
echo "1. 验证数据完整性"
echo "2. 重启相关服务"
echo "3. 检查应用日志"
echo "=========================================="
