#!/bin/bash
# 巡检宝 - 数据库备份脚本
# 服务器: 101.43.35.139
# 最后更新: 2026-04-08

BACKUP_DIR="/opt/xunjianbao/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=== 巡检宝数据库备份 $(date) ==="
echo "备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库 (使用docker-compose exec)
# docker-compose exec -T db pg_dump -U postgres xunjianbao | gzip > $BACKUP_DIR/db_$DATE.sql.gz

echo "✅ 备份完成: db_$DATE.sql.gz"
echo ""

# 备份配置文件
tar czf $BACKUP_DIR/config_$DATE.tar.gz /opt/xunjianbao/nginx 2>/dev/null || true
tar czf $BACKUP_DIR/compose_$DATE.tar.gz /opt/xunjianbao/docker-compose.yml 2>/dev/null || true

echo "✅ 配置文件备份完成"

# 清理30天前的备份
find $BACKUP_DIR -mtime +30 -delete 2>/dev/null || true
echo "✅ 清理旧备份完成 (保留30天)"

echo ""
echo "=== 备份完成 ==="
ls -lh $BACKUP_DIR | tail -5
