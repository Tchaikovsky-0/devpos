#!/bin/bash

# 巡检宝数据备份脚本
# 使用方法: ./scripts/backup.sh [backup_dir]

set -e

BACKUP_DIR=${1:-"/tmp/xunjianbao_backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

# 数据库配置 (从环境变量读取,有默认值)
MYSQL_HOST=${MYSQL_HOST:-"localhost"}
MYSQL_PORT=${MYSQL_PORT:-"3306"}
MYSQL_USER=${MYSQL_USER:-"xunjianbao"}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-""}
MYSQL_DATABASE=${MYSQL_DATABASE:-"xunjianbao"}

# Redis配置
REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-"6379"}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}

# 保留策略 (天数)
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo "=========================================="
echo "巡检宝数据备份"
echo "=========================================="
echo "备份目录: $BACKUP_PATH"
echo "时间戳: $TIMESTAMP"
echo "数据库: $MYSQL_DATABASE@$MYSQL_HOST:$MYSQL_PORT"
echo "Redis: $REDIS_HOST:$REDIS_PORT"
echo "保留策略: $RETENTION_DAYS 天"
echo "=========================================="

# 创建备份目录
mkdir -p "$BACKUP_PATH"
mkdir -p "$BACKUP_PATH/mysql"
mkdir -p "$BACKUP_PATH/redis"
mkdir -p "$BACKUP_PATH/configs"

# 备份MySQL数据库
echo ""
echo "[1/4] 备份MySQL数据库..."
if command -v mysqldump &> /dev/null; then
    if [ -n "$MYSQL_PASSWORD" ]; then
        mysqldump -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            "$MYSQL_DATABASE" > "$BACKUP_PATH/mysql/database_$TIMESTAMP.sql"
    else
        mysqldump -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            "$MYSQL_DATABASE" > "$BACKUP_PATH/mysql/database_$TIMESTAMP.sql"
    fi
    echo "✓ MySQL备份完成"
else
    echo "✗ mysqldump 未安装,跳过MySQL备份"
fi

# 备份Redis数据
echo ""
echo "[2/4] 备份Redis数据..."
if command -v redis-cli &> /dev/null; then
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGSAVE
    else
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGSAVE
    fi
    
    # 等待保存完成
    sleep 2
    
    # 复制RDB文件
    REDIS_DIR=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET dir | tail -1)
    REDIS_DB=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" CONFIG GET dbfilename | tail -1)
    
    if [ -f "$REDIS_DIR/$REDIS_DB" ]; then
        cp "$REDIS_DIR/$REDIS_DB" "$BACKUP_PATH/redis/dump_$TIMESTAMP.rdb"
        echo "✓ Redis备份完成"
    else
        echo "⚠ Redis RDB文件未找到"
    fi
else
    echo "✗ redis-cli 未安装,跳过Redis备份"
fi

# 备份配置文件
echo ""
echo "[3/4] 备份配置文件..."
CONFIG_FILES=(
    ".env"
    ".env.docker"
    "docker-compose.yaml"
    "docker-compose.dev.yaml"
    "config/prometheus/prometheus.yml"
    "config/prometheus/alerts.yml"
)

for config_file in "${CONFIG_FILES[@]}"; do
    if [ -f "$config_file" ]; then
        cp "$config_file" "$BACKUP_PATH/configs/"
        echo "✓ 已备份: $config_file"
    fi
done

# 创建备份元数据
echo ""
echo "[4/4] 创建备份元数据..."
cat > "$BACKUP_PATH/backup_info.txt" << EOF
备份信息
========================================
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
时间戳: $TIMESTAMP
数据库: $MYSQL_DATABASE@$MYSQL_HOST:$MYSQL_PORT
Redis: $REDIS_HOST:$REDIS_PORT

备份内容:
- MySQL数据库完整备份 (SQL格式)
- Redis数据备份 (RDB格式)
- 配置文件备份

恢复命令:
MySQL: mysql -u $MYSQL_USER -p $MYSQL_DATABASE < mysql/database_$TIMESTAMP.sql
Redis: 复制 redis/dump_$TIMESTAMP.rdb 到Redis数据目录

保留策略: $RETENTION_DAYS 天
========================================
EOF

echo "✓ 备份元数据创建完成"

# 压缩备份
echo ""
echo "压缩备份文件..."
cd "$BACKUP_DIR"
tar -czf "xunjianbao_backup_$TIMESTAMP.tar.gz" "$TIMESTAMP"
rm -rf "$TIMESTAMP"
echo "✓ 压缩完成: xunjianbao_backup_$TIMESTAMP.tar.gz"

# 清理旧备份
echo ""
echo "清理 $RETENTION_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "xunjianbao_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✓ 旧备份清理完成"

# 显示备份大小
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/xunjianbao_backup_$TIMESTAMP.tar.gz" | cut -f1)
echo ""
echo "=========================================="
echo "备份完成!"
echo "备份文件: $BACKUP_DIR/xunjianbao_backup_$TIMESTAMP.tar.gz"
echo "备份大小: $BACKUP_SIZE"
echo "=========================================="
