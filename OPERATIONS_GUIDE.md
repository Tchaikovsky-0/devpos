# 巡检宝自动化运维指南

## 📋 概述

本文档提供巡检宝项目的完整自动化运维指南，包含CI/CD流程、监控系统、故障处理和最佳实践。

---

## 🚀 CI/CD部署流程

### GitHub Actions工作流
- **触发条件**: 推送到main/develop分支或创建tag
- **工作流程**:
  1. 代码质量检查（lint-and-test）
  2. 安全扫描（security-scan）
  3. Docker构建和推送（docker-build-dev/prod）
  4. 生产环境部署（deploy-production）
  5. 发布版本（release）

### 环境管理
- **开发环境（develop分支）**: 自动构建和推送开发镜像
- **生产环境（main分支）**: 触发完整部署流程
- **版本发布（tag v*）**: 创建GitHub Release

### 部署策略
- **蓝绿部署**: 保持两个环境，零停机切换
- **健康检查**: 部署前后自动验证服务健康
- **自动回滚**: 健康检查失败时自动回滚
- **版本管理**: 保留最近5个部署版本

---

## 🏗️ 基础设施配置

### 目录结构
```
/opt/xunjianbao/
├── current -> deploy_20260404_102030/          # 当前版本符号链接
├── previous -> deploy_20260403_153045/         # 上一个版本符号链接
├── deployments/                                # 所有部署版本
│   ├── deploy_20260404_102030/
│   ├── deploy_20260403_153045/
│   └── ...
├── backups/                                    # 备份目录
├── logs/                                       # 日志目录
├── config/                                     # 配置文件
│   ├── .env                                    # 环境变量
│   ├── docker-compose.prod.yml                 # 生产配置
│   ├── prometheus/                             # 监控配置
│   ├── grafana/                                # 仪表板配置
│   └── loki/                                   # 日志配置
└── scripts/                                    # 运维脚本
    ├── deploy.sh                               # 部署脚本
    ├── rollback.sh                             # 回滚脚本
    └── health-check.sh                         # 健康检查脚本
```

### 环境变量配置
```bash
# .env配置文件
# 数据库配置
MYSQL_ROOT_PASSWORD=secure_root_password
MYSQL_USER=xunjianbao
MYSQL_PASSWORD=secure_password

# Redis配置
REDIS_PASSWORD=redis_secure_password

# JWT配置
JWT_SECRET=your-jwt-secret-at-least-32-characters-long-for-security

# 服务配置
OPENCLAW_URL=http://openclaw:8096
OPENCLAW_TOKEN=your_openclaw_token
AI_SERVICE_URL=http://ai:8095
YOLO_SERVICE_URL=http://yolo:8097

# 部署配置
IMAGE_REPO=ghcr.io/your-org
IMAGE_TAG=latest
DEPLOY_ENV=production

# 监控配置
GRAFANA_ADMIN_PASSWORD=admin123
```

---

## 📊 监控系统

### Prometheus监控指标
- **系统指标**: CPU、内存、磁盘、网络
- **服务指标**: HTTP请求、响应时间、错误率
- **数据库指标**: 连接数、查询性能、慢查询
- **业务指标**: 用户活跃度、AI推理成功率

### Grafana仪表板
1. **系统概览**: 所有服务的健康状态概览
2. **性能监控**: CPU、内存、磁盘使用率
3. **服务监控**: 各微服务的请求量和响应时间
4. **数据库监控**: MySQL和Redis性能指标
5. **业务监控**: 用户活跃度和业务指标

### 告警规则
- **紧急告警（critical）**: 需要立即处理的问题
- **警告告警（warning）**: 需要注意但非紧急的问题
- **信息告警（info）**: 信息性通知

---

## 🔧 运维操作

### 手动部署
```bash
# 设置环境变量
export IMAGE_TAG=sha-abc123
export IMAGE_REPO=ghcr.io/your-org

# 执行部署
cd /opt/xunjianbao/scripts
chmod +x deploy.sh
./deploy.sh
```

### 手动回滚
```bash
# 正常回滚（带健康检查）
cd /opt/xunjianbao/scripts
./rollback.sh

# 紧急回滚（跳过健康检查）
./rollback.sh --emergency
```

### 服务管理
```bash
# 查看服务状态
docker-compose -f /opt/xunjianbao/current/docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f /opt/xunjianbao/current/docker-compose.prod.yml logs -f backend

# 重启单个服务
docker-compose -f /opt/xunjianbao/current/docker-compose.prod.yml restart backend

# 停止所有服务
docker-compose -f /opt/xunjianbao/current/docker-compose.prod.yml down
```

### 健康检查
```bash
# 手动执行健康检查
curl -f http://localhost:8094/health  # 后端服务
curl -f http://localhost:8095/health  # AI服务
curl -f http://localhost:8097/health  # YOLO服务
curl -f http://localhost:3000         # 前端服务

# 数据库健康检查
docker exec xunjianbao-mysql-prod mysqladmin ping -h localhost
docker exec xunjianbao-redis-prod redis-cli ping
```

---

## 🚨 故障处理

### 常见问题解决

#### 1. 部署失败
```bash
# 检查部署日志
tail -f /opt/xunjianbao/logs/deploy.log

# 检查Docker日志
docker logs xunjianbao-backend-prod

# 检查镜像拉取
docker pull ghcr.io/your-org/xunjianbao-backend:latest
```

#### 2. 服务无法启动
```bash
# 检查容器状态
docker ps -a | grep xunjianbao

# 检查容器日志
docker logs <container_id>

# 检查端口冲突
netstat -tlnp | grep :8094

# 检查依赖服务
docker exec xunjianbao-mysql-prod mysql -u root -p -e "SELECT 1"
```

#### 3. 性能问题
```bash
# 查看资源使用
docker stats

# 查看服务指标
curl http://localhost:8094/metrics

# 查看数据库性能
docker exec xunjianbao-mysql-prod mysql -u root -p -e "SHOW PROCESSLIST;"
```

#### 4. 监控告警
```bash
# 查看Prometheus告警
curl http://localhost:9090/api/v1/alerts

# 查看告警管理器
curl http://localhost:9093/api/v2/alerts

# 查看Grafana仪表板
# 访问 http://localhost:3001 (用户名: admin, 密码: admin123)
```

### 紧急恢复流程
1. **立即回滚**: 执行 `./rollback.sh --emergency`
2. **检查日志**: 查看相关服务日志
3. **诊断问题**: 根据错误信息定位问题
4. **修复问题**: 修复代码或配置
5. **重新部署**: 修复后重新触发部署

---

## 📈 性能优化

### Docker优化
```yaml
# 资源限制配置示例
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### 数据库优化
```sql
-- MySQL优化配置
SET GLOBAL innodb_buffer_pool_size = 1073741824;  -- 1GB
SET GLOBAL max_connections = 500;
SET GLOBAL query_cache_size = 134217728;  -- 128MB

-- 创建索引优化查询
CREATE INDEX idx_user_activity ON user_activities(user_id, created_at);
```

### 应用优化
- **启用Gzip压缩**: 减少网络传输
- **使用连接池**: 数据库和Redis连接复用
- **缓存策略**: 合理使用Redis缓存
- **异步处理**: 耗时操作异步执行

---

## 🔒 安全最佳实践

### 密钥管理
- **环境变量**: 所有密钥通过环境变量配置
- **GitHub Secrets**: CI/CD使用GitHub Secrets管理密钥
- **定期轮换**: 定期更新JWT密钥和数据库密码

### 访问控制
- **网络隔离**: 使用Docker网络隔离服务
- **端口限制**: 只开放必要的端口
- **防火墙**: 配置服务器防火墙规则

### 安全扫描
- **依赖扫描**: 定期扫描npm、pip、go依赖
- **容器扫描**: 扫描Docker镜像安全漏洞
- **代码扫描**: 静态代码安全分析

---

## 📝 运维检查清单

### 每日检查
- [ ] 系统健康状态
- [ ] 服务可用性
- [ ] 错误日志审查
- [ ] 资源使用情况
- [ ] 备份状态

### 每周检查
- [ ] 安全扫描结果
- [ ] 性能指标分析
- [ ] 日志归档
- [ ] 备份验证
- [ ] 版本更新计划

### 每月检查
- [ ] 系统审计
- [ ] 安全策略审查
- [ ] 容量规划
- [ ] 灾难恢复演练
- [ ] 运维流程优化

---

## 📞 支持与联系

### 紧急联系方式
- **运维值班**: ops-oncall@your-company.com
- **技术支持**: support@your-company.com
- **安全团队**: security@your-company.com

### 监控通知渠道
- **Slack频道**: #xunjianbao-alerts
- **邮件列表**: xunjianbao-ops@your-company.com
- **短信告警**: +86-138-XXXX-XXXX

### 文档资源
- **运维Wiki**: https://wiki.your-company.com/xunjianbao
- **监控仪表板**: http://monitor.your-company.com
- **部署状态**: http://deploy.your-company.com

---

## 🎯 成功指标

### 部署指标
- **部署频率**: 目标每日多次部署
- **部署成功率**: 目标99.5%以上
- **平均部署时间**: 目标15分钟以内
- **回滚率**: 目标低于5%

### 系统指标
- **系统可用性**: 目标99.9%
- **平均响应时间**: 目标小于2秒
- **错误率**: 目标低于0.1%
- **资源利用率**: CPU<70%, 内存<80%

### 业务指标
- **用户活跃度**: 持续增长
- **功能使用率**: 关键功能高使用率
- **用户满意度**: 定期收集反馈

---

## 🔄 持续改进

### 反馈循环
1. **收集反馈**: 从监控、日志、用户反馈收集信息
2. **分析问题**: 识别根本原因和模式
3. **制定改进**: 制定具体的改进措施
4. **实施改进**: 实施并验证改进效果
5. **监控效果**: 持续监控改进效果

### 自动化改进
- **自动扩缩容**: 基于负载自动调整资源
- **自动修复**: 常见问题自动修复
- **智能告警**: 减少误报，提高告警准确性
- **预测性维护**: 基于历史数据预测问题

---

## 📅 维护计划

### 定期维护
- **每周维护**: 系统更新、安全补丁
- **每月维护**: 性能优化、架构调整
- **季度维护**: 大版本升级、技术债务清理

### 备份策略
- **数据库备份**: 每日全量备份，每小时增量备份
- **配置文件备份**: 版本控制管理
- **日志备份**: 保留90天日志

### 灾难恢复
- **恢复时间目标（RTO）**: 4小时
- **恢复点目标（RPO）**: 15分钟
- **灾难恢复演练**: 每季度一次

---

## 🏁 总结

通过实施这套完整的自动化运维体系，巡检宝项目实现了：

1. **🚀 部署自动化**: 从手工操作转向完全自动化
2. **📊 监控全面**: 全方位的系统和应用监控
3. **🛡️ 安全可靠**: 多层次的安全防护
4. **🔧 运维高效**: 标准化的运维流程和工具
5. **📈 持续改进**: 基于数据的持续优化

**运维团队**: DevOps自动化团队
**最后更新**: 2026-04-04
**文档版本**: v1.0

---
*自动化不是目的，而是手段。真正的目标是让团队专注于创造价值，而不是重复劳动。*