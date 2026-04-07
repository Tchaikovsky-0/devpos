# 巡检宝项目 - 告警规范

> 本规范适用于巡检宝项目的告警管理功能。
> **核心原则**: 及时、准确、可追溯

---

## 一、告警分级

| 级别 | 场景 | 通知方式 | 响应时间 |
|------|------|----------|----------|
| P0 | 火灾、人员倒地 | 电话+短信+App | 立即 |
| P1 | 入侵、设备异常 | 短信+App推送 | 5分钟 |
| P2 | 离线、画质下降 | App推送 | 30分钟 |
| P3 | 存储空间不足 | 邮件 | 24小时 |

---

## 二、告警收敛

### 2.1 防抖策略

```go
// ✅ 告警防抖
type AlertThrottler struct {
    alerts map[string]time.Time
    window time.Duration
}

func (t *AlertThrottler) ShouldSend(key string) bool {
    last, exists := t.alerts[key]
    if !exists || time.Since(last) > t.window {
        t.alerts[key] = time.Now()
        return true
    }
    return false
}

// 使用：相同类型5分钟内只发一次
throttler := &AlertThrottler{window: 5 * time.Minute}
```

### 2.2 升级策略

```yaml
告警升级:
  P1告警:
    - 0分钟: 首次通知
    - 15分钟: 未处理，升级给主管
    - 30分钟: 未处理，升级给经理
    
  静默规则:
    - 维护模式: 暂停所有告警
    - 夜间模式: P2以下延迟到白天发送
```

---

## 三、告警内容

```go
// ✅ 告警数据结构
type Alert struct {
    ID          string    `json:"id"`
    Level       string    `json:"level"`        // P0/P1/P2/P3
    Type        string    `json:"type"`         // fire/intrusion/...
    Title       string    `json:"title"`
    Message     string    `json:"message"`
    StreamID    string    `json:"stream_id"`
    StreamName  string    `json:"stream_name"`
    Location    string    `json:"location"`
    SnapshotURL string    `json:"snapshot_url"`
    VideoURL    string    `json:"video_url"`
    CreatedAt   time.Time `json:"created_at"`
    Status      string    `json:"status"`       // pending/processing/resolved
}
```

---

## 四、处理流程

```
告警产生 → 分级 → 收敛 → 通知 → 处理 → 确认 → 归档

1. 产生: AI检测或系统监控触发
2. 分级: 根据类型自动分级
3. 收敛: 防抖、去重
4. 通知: 多渠道推送
5. 处理: 人工介入处理
6. 确认: 处理结果记录
7. 归档: 历史数据存储
```

---

## 五、禁止事项

```yaml
❌ 绝对禁止:
  - 无分级全部P0
  - 不收敛导致轰炸
  - 告警无处理入口
  - 不记录处理历史
  
⚠️ 需要特别注意:
  - 通知渠道可用性
  - 告警疲劳
  - 误报处理
  - 处理时效
```

---

**最后更新**: 2026年4月
