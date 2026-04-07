---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:46:06.289Z
provider: 
---

# 巡检宝项目 - 数据库规范

> **核心原则**: 规范设计、性能优先、安全可靠

---

## 一、表设计规范

### 必备字段

```sql
-- ✅ 所有表必须包含以下字段
CREATE TABLE example (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,                       -- 软删除
    tenant_id       VARCHAR(64) NOT NULL,            -- 租户ID
    
    -- 业务字段
    name            VARCHAR(255) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'active'
);
```

### 字段类型规范

| 数据类型 | 使用场景 | 示例 |
|---------|---------|------|
| BIGSERIAL | 主键ID | `id BIGSERIAL PRIMARY KEY` |
| VARCHAR(n) | 字符串 | `name VARCHAR(255)` |
| TEXT | 长文本 | `description TEXT` |
| TIMESTAMP | 日期时间 | `created_at TIMESTAMP` |
| JSONB | JSON数据 | `metadata JSONB` |
| BOOLEAN | 布尔值 | `is_active BOOLEAN` |

### 命名规范

```sql
-- ✅ 表名：小写，复数，下划线分隔
CREATE TABLE video_streams (
    id              BIGSERIAL PRIMARY KEY,
    stream_name     VARCHAR(255) NOT NULL,
    rtsp_url        VARCHAR(512),
    is_active       BOOLEAN DEFAULT TRUE
);

-- 索引命名：idx_表名_字段名
CREATE INDEX idx_video_streams_tenant_id ON video_streams(tenant_id);

-- 外键命名：fk_表名_引用表名
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_stream_id 
    FOREIGN KEY (stream_id) REFERENCES video_streams(id);
```

---

## 二、索引规范

### 索引设计原则

```sql
-- ✅ 必须创建索引的场景
-- 1. 外键字段必须有索引
CREATE INDEX idx_alerts_stream_id ON alerts(stream_id);

-- 2. 频繁查询的字段
CREATE INDEX idx_video_streams_status ON video_streams(status);

-- 3. 组合查询（最左前缀）
CREATE INDEX idx_alerts_tenant_status_time 
    ON alerts(tenant_id, status, created_at);

-- 4. 唯一约束
CREATE UNIQUE INDEX idx_users_tenant_email 
    ON users(tenant_id, email) WHERE deleted_at IS NULL;

-- 5. 部分索引（软删除）
CREATE INDEX idx_video_streams_active 
    ON video_streams(tenant_id, status) 
    WHERE deleted_at IS NULL;

-- 6. 覆盖索引
CREATE INDEX idx_streams_covering 
    ON video_streams(tenant_id, status) 
    INCLUDE (name, rtsp_url, created_at);
```

### 索引维护

```sql
-- 查看索引使用情况
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE tablename = 'video_streams'
ORDER BY idx_scan DESC;

-- 重建索引
REINDEX INDEX CONCURRENTLY idx_video_streams_tenant_id;

-- 分析表
ANALYZE video_streams;
```

---

## 三、查询规范

### 基本查询

```sql
-- ✅ 指定字段，禁止SELECT *
SELECT id, name, status, created_at 
FROM video_streams 
WHERE tenant_id = 'tenant_123' AND deleted_at IS NULL;

-- ❌ 禁止SELECT *
SELECT * FROM video_streams;
```

### 分页规范

```sql
-- ✅ 推荐：Keyset Pagination（游标分页）
SELECT id, name, created_at 
FROM video_streams 
WHERE tenant_id = 'tenant_123' 
  AND created_at < '2024-01-01 00:00:00'
ORDER BY created_at DESC 
LIMIT 20;

-- ⚠️ 小数据量可用：Offset Pagination
SELECT id, name FROM video_streams 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 100;  -- 避免大offset

-- ❌ 禁止：深度分页
SELECT * FROM video_streams 
LIMIT 20 OFFSET 1000000;  -- 性能极差！
```

### JOIN规范

```sql
-- ✅ 显式JOIN，不超过3个表
SELECT vs.name, a.level, a.created_at
FROM video_streams vs
INNER JOIN alerts a ON vs.id = a.stream_id
WHERE vs.tenant_id = 'tenant_123';

-- ❌ 禁止隐式JOIN
SELECT * FROM video_streams vs, alerts a 
WHERE vs.id = a.stream_id;
```

### 批量操作

```sql
-- ✅ 批量插入（一次不超过1000条）
INSERT INTO video_streams (tenant_id, name, rtsp_url) 
VALUES 
    ('tenant_1', 'Camera 1', 'rtsp://...'),
    ('tenant_1', 'Camera 2', 'rtsp://...');

-- ✅ 批量更新
UPDATE video_streams 
SET status = CASE id
    WHEN 1 THEN 'active'
    WHEN 2 THEN 'inactive'
END
WHERE id IN (1, 2);
```

---

## 四、事务规范

### 事务使用

```go
// ✅ Go中使用事务
func (r *StreamRepository) Transfer(ctx context.Context, fromID, toID int64) error {
    return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        // 1. 查询源
        var fromStream Stream
        if err := tx.First(&fromStream, fromID).Error; err != nil {
            return err
        }
        
        // 2. 更新目标
        if err := tx.Model(&Stream{}).Where("id = ?", toID).
            Update("status", fromStream.Status).Error; err != nil {
            return err
        }
        
        return nil
    })
}
```

### 死锁预防

```sql
-- ✅ 按固定顺序访问资源
BEGIN;
SELECT * FROM table_a WHERE id = 1 FOR UPDATE;
SELECT * FROM table_b WHERE id = 2 FOR UPDATE;
COMMIT;

-- ✅ 使用乐观锁
ALTER TABLE video_streams ADD COLUMN version INTEGER DEFAULT 0;

UPDATE video_streams 
SET name = 'New Name', version = version + 1
WHERE id = 1 AND version = 5;
```

---

## 五、软删除与审计

### 软删除实现

```go
// ✅ GORM软删除
type Stream struct {
    ID        uint64         `gorm:"primarykey"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
    Name      string
    Status    string
}
```

### 审计日志

```sql
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(64) NOT NULL,
    user_id         VARCHAR(64) NOT NULL,
    action          VARCHAR(32) NOT NULL,
    table_name      VARCHAR(64) NOT NULL,
    record_id       VARCHAR(64) NOT NULL,
    old_data        JSONB,
    new_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_time ON audit_logs(tenant_id, created_at DESC);
```

---

## 六、分区表

### 范围分区（按时间）

```sql
-- ✅ 告警表按时间分区
CREATE TABLE alerts (
    id              BIGSERIAL,
    tenant_id       VARCHAR(64) NOT NULL,
    stream_id       BIGINT NOT NULL,
    level           VARCHAR(16) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 创建分区
CREATE TABLE alerts_2024_01 PARTITION OF alerts
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## 七、Go代码示例

### Repository模式

```go
type StreamRepository struct {
    db *gorm.DB
}

// List 查询列表
func (r *StreamRepository) List(ctx context.Context, tenantID string, 
    lastTime time.Time, limit int) ([]Stream, error) {
    var streams []Stream
    err := r.db.WithContext(ctx).
        Where("tenant_id = ?", tenantID).
        Where("created_at < ?", lastTime).
        Order("created_at DESC").
        Limit(limit).
        Find(&streams).Error
    return streams, err
}

// 防止N+1查询
func (r *StreamRepository) ListWithAlerts(ctx context.Context, tenantID string) ([]Stream, error) {
    var streams []Stream
    err := r.db.WithContext(ctx).
        Preload("Alerts").
        Where("tenant_id = ?", tenantID).
        Find(&streams).Error
    return streams, err
}
```

---

## 八、禁止事项

```yaml
❌ 绝对禁止:
  - SELECT * 查询
  - 深度分页（大offset）
  - 循环内查询数据库
  - 隐式JOIN
  - 没有WHERE条件的UPDATE/DELETE
  - 大事务（执行时间过长）
  - 没有索引的外键
  - 在索引字段上使用函数
  
⚠️ 需要特别注意:
  - 批量操作数量控制
  - 锁超时处理
  - 连接池配置
  - 慢查询监控
```

---

**最后更新**: 2026年4月