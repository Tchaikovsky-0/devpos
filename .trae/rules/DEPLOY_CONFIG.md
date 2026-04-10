# 部署配置

## 生产服务器

- IP: 101.43.35.139（上海四区）
- OS: Ubuntu 24.04.4 LTS
- SSH: sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139
- 资源：AMD EPYC 7K62 48核 / 15GB RAM / 178GB 磁盘
- 已安装：Docker v24.0+, Nginx, curl/wget/git/vim/htop

---

## 端口规划

前端 3000 | Go API 8094 | Python AI 8095 | PostgreSQL 5432 | Redis 6379 | MinIO 9000 | Nginx 80/443

---

## 项目目录

/opt/xunjianbao/{frontend,backend,ai-service,data}

---

## 部署命令

- 连接：sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no ubuntu@101.43.35.139
- 部署：cd /opt/xunjianbao && git pull && docker-compose build --no-cache && docker-compose up -d
- 查看状态：docker-compose ps
- 查看日志：docker-compose logs -f --tail=100
- 备份数据：docker-compose exec db pg_dump -U user xunjianbao > backup_$(date +%Y%m%d).sql
- 回滚：docker-compose down && git checkout HEAD~1 && docker-compose build && docker-compose up -d

---

## 安全要求

- 所有敏感配置使用环境变量
- JWT Secret 长度 >= 32 字节
- 生产环境强制 HTTPS
- CORS 配置白名单，禁止使用 *
- 敏感信息日志脱敏
- 登录接口限流

---

## YOLO 检测配置

- 模型存储路径：/models/{model_name}/{version}/
- 支持类型：火灾、入侵、裂缝、烟雾、车辆
- 置信度阈值：0.5，NMS 阈值：0.45
- 防抖：连续 3 帧检测到才触发
- 生产环境只能使用稳定版模型
