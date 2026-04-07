-- 巡检宝种子数据

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO users (username, email, password_hash, role, tenant_id, is_active)
VALUES (
    'admin',
    'admin@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'admin',
    'tenant_default',
    TRUE
);

-- 插入示例视频流
INSERT INTO streams (name, type, status, url, location, tenant_id)
VALUES
    ('主入口摄像头', 'camera', 'online', 'rtsp://example.com/cam1', '工厂主入口', 'tenant_default'),
    ('仓库监控1', 'camera', 'online', 'rtsp://example.com/cam2', '1号仓库', 'tenant_default'),
    ('生产线A', 'camera', 'warning', 'rtsp://example.com/cam3', '生产车间A', 'tenant_default'),
    ('无人机巡检', 'drone', 'offline', 'rtsp://example.com/drone1', '全厂区', 'tenant_default');

-- 插入示例告警
INSERT INTO alerts (level, type, title, message, location, status, tenant_id)
VALUES
    ('INFO', 'system', '系统启动', 'AI检测服务已启动', '服务器', 'resolved', 'tenant_default'),
    ('WARN', 'connection', '设备离线', '摄像头3连接中断', '生产车间A', 'pending', 'tenant_default'),
    ('CRIT', 'intrusion', '入侵检测', '检测到未授权人员进入', '1号仓库', 'pending', 'tenant_default');
