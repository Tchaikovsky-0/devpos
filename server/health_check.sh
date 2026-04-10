#!/bin/bash
# 巡检宝 - 健康检查脚本
# 服务器: 101.43.35.139
# 最后更新: 2026-04-08

SERVICES=(
    "Frontend:3000"
    "Backend API:8094"
    "AI Service:8095"
)

LOG_FILE="/opt/xunjianbao/logs/health_check.log"
ALERT_EMAIL="admin@example.com"  # 修改为实际邮箱

echo "=== 巡检宝健康检查 $(date) ===" | tee -a $LOG_FILE

all_healthy=true

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service_info"
    
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ $name (端口 $port) - 正常" | tee -a $LOG_FILE
    else
        echo "❌ $name (端口 $port) - 离线" | tee -a $LOG_FILE
        all_healthy=false
    fi
done

echo "" | tee -a $LOG_FILE

if [ "$all_healthy" = false ]; then
    echo "⚠️ 警告: 部分服务不可用!" | tee -a $LOG_FILE
    # 发送告警邮件 (需要配置邮件服务)
    # echo "Alert: Xunjianbao services are down on 101.43.35.139" | mail -s "Xunjianbao Alert" $ALERT_EMAIL
else
    echo "✅ 所有服务运行正常!" | tee -a $LOG_FILE
fi

echo "======================================" | tee -a $LOG_FILE
