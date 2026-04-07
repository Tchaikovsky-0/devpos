# 巡检宝 - 数据模型总结

> **版本**: v1.0.0
> **创建日期**: 2026-04-02
> **模块**: 媒体库 + AR 眼镜集成

---

## 📦 创建的模型文件

### 媒体库模块

| 文件 | 模型 | 说明 | 状态 |
|------|------|------|------|
| `media_tenant.go` | MediaTenant | 租户模型 | ✅ |
| `media_folder.go` | MediaFolder | 文件夹模型 | ✅ 待创建 |
| `media_permission.go` | MediaPermission | 权限模型 | ✅ 待创建 |
| `media_file.go` | MediaFile | 文件模型 | ✅ 待创建 |

### AR 眼镜模块

| 文件 | 模型 | 说明 | 状态 |
|------|------|------|------|
| `ar_device.go` | ARDevice | AR 设备 | ✅ 已创建 |
| `ar_session.go` | ARSession | AR 会话 | ✅ 已创建 |
| `ar_event.go` | AREvent | AR 事件 | ✅ 已创建 |

### 辅助模型

| 文件 | 模型 | 说明 |
|------|------|------|
| `common.go` | UserBriefInfo, PaginationMeta | 通用类型 |
| `common.go` | APIResponse | API 响应格式 |

---

## 🗄️ 数据库表对应

### 媒体库表

| 表名 | 对应模型 | 主要字段 |
|------|----------|----------|
| `tenants` | MediaTenant | name, code, storage_quota |
| `users` | MediaUser | username, email, tenant_id |
| `media_folders` | MediaFolder | name, type, owner_id, parent_id |
| `media_permissions` | MediaPermission | folder_id, user_id, permission |
| `media_files` | MediaFile | name, file_type, size, checksum |

### AR 表

| 表名 | 对应模型 | 主要字段 |
|------|----------|----------|
| `ar_devices` | ARDevice | device_type, device_name, status |
| `ar_sessions` | ARSession | session_type, status, field_user_id |
| `ar_events` | AREvent | event_type, content, latitude, longitude |

---

## 🎯 模型关系图

```
媒体库模块:
tenants (租户)
  │
  └── users (用户)
        │
        ├── media_folders (文件夹)
        │     │
        │     ├── media_permissions (权限)
        │     │
        │     └── media_files (文件)
        │
        └── media_folders

AR 眼镜模块:
ar_devices (AR 设备)
  │
  └── ar_sessions (AR 会话)
        │
        └── ar_events (AR 事件)
```

---

## 🚀 快速使用

### 1. 租户操作

```go
// 创建租户
tenant := &model.MediaTenant{
    Name: "测试公司",
    Code: "test-corp",
    StorageQuota: 107374182400, // 100GB
}
db.Create(tenant)

// 查询租户
var tenants []model.MediaTenant
db.Where("status = ?", "active").Find(&tenants)
```

### 2. AR 设备操作

```go
// 创建设备
device := &model.ARDevice{
    TenantID:   1,
    DeviceType: "rokid_glasses",
    DeviceName: "Rokid眼镜-001",
    Status:     "offline",
}
db.Create(device)

// 查询设备
var devices []model.ARDevice
db.Preload("CurrentUser").Where("tenant_id = ?", tenantID).Find(&devices)
```

### 3. AR 会话操作

```go
// 创建会话
session := &model.ARSession{
    TenantID:    1,
    SessionType: "inspection",
    Status:      "active",
    FieldUserID: 1,
}
db.Create(session)

// 查询活跃会话
var activeSessions []model.ARSession
db.Preload("FieldUser").Preload("Device").
    Where("status = ?", "active").
    Find(&activeSessions)
```

### 4. 事件记录

```go
// 记录检测事件
event := &model.AREvent{
    SessionID:  1,
    TenantID:   1,
    EventType:  "detection",
    Content:    `{"defect_type":"fire","confidence":0.95}`,
    Latitude:   30.123,
    Longitude:  120.456,
}
db.Create(event)
```

---

## 📝 字段说明

### MediaTenant

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | uint | 主键 |
| Name | string | 租户名称 |
| Code | string | 租户编码（唯一） |
| StorageQuota | int64 | 存储配额（字节） |
| StorageUsed | int64 | 已使用存储 |
| Status | string | 状态 |

### ARDevice

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | uint | 主键 |
| TenantID | uint | 租户 ID |
| DeviceType | string | 设备类型 |
| DeviceName | string | 设备名称 |
| DeviceSN | string | 设备序列号 |
| Status | string | 在线状态 |
| LastHeartbeat | time.Time | 最后心跳时间 |

### ARSession

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | uint | 主键 |
| SessionType | string | 会话类型 |
| Status | string | 会话状态 |
| FieldUserID | uint | 现场人员 ID |
| RemoteUserID | uint | 远程专家 ID |
| DeviceID | uint | AR 设备 ID |
| Duration | int | 持续时间（秒） |
| EventCount | int | 事件数量 |

### AREvent

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | uint | 主键 |
| SessionID | uint | 会话 ID |
| EventType | string | 事件类型 |
| Content | string | 事件内容（JSON） |
| Latitude | float64 | 纬度 |
| Longitude | float64 | 经度 |
| Acknowledged | bool | 是否已确认 |

---

## ⚠️ 注意事项

1. **使用 GORM 的 Preload** 来加载关联数据
2. **Content 字段** 使用 JSON 格式存储复杂数据
3. **时间字段** 使用 `autoCreateTime` 和 `autoUpdateTime`
4. **软删除** 使用 `DeletedAt` 字段

---

**最后更新**: 2026-04-02
