-- 巡检宝数据库迁移脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(64) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    avatar          VARCHAR(512),
    role            VARCHAR(32) DEFAULT 'user',
    tenant_id       VARCHAR(64) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 视频流/设备表
CREATE TABLE IF NOT EXISTS streams (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(32) NOT NULL,
    status              VARCHAR(32) DEFAULT 'offline',
    url                 VARCHAR(512),
    location            VARCHAR(255),
    lat                 DECIMAL(10,6),
    lng                 DECIMAL(10,6),
    description         TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    last_connected_at   TIMESTAMP,
    last_disconnected_at TIMESTAMP,
    reconnect_count     INT DEFAULT 0,
    tenant_id           VARCHAR(64) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status)
);

-- 告警表
CREATE TABLE IF NOT EXISTS alerts (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    level           VARCHAR(16) NOT NULL,
    type            VARCHAR(64) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    location        VARCHAR(255),
    lat             DECIMAL(10,6),
    lng             DECIMAL(10,6),
    sensor_data     TEXT,
    status          VARCHAR(32) DEFAULT 'pending',
    acknowledged    BOOLEAN DEFAULT FALSE,
    stream_id       BIGINT,
    tenant_id       VARCHAR(64) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_stream_id (stream_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 报告表
CREATE TABLE IF NOT EXISTS reports (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id       VARCHAR(64) NOT NULL,
    type            VARCHAR(32) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    date_range_start DATE,
    date_range_end   DATE,
    content         JSON,
    status          VARCHAR(32) DEFAULT 'pending',
    generated_by    VARCHAR(64),
    file_url        VARCHAR(512),
    error_message   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id)
);

-- YOLO检测表
CREATE TABLE IF NOT EXISTS yolo_detections (
    id              VARCHAR(64) PRIMARY KEY,
    stream_id       VARCHAR(64),
    timestamp       TIMESTAMP,
    objects         JSON,
    processing_time DECIMAL(10,4),
    confidence      DECIMAL(5,4),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stream_id (stream_id),
    INDEX idx_timestamp (timestamp)
);
