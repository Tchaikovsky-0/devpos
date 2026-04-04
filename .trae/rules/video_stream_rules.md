# 巡检宝项目 - 视频流规范

> **核心原则**: 稳定可靠、低延迟、高并发

---

## 一、视频流接入

### 支持的协议

| 协议 | 用途 | 优先级 | 说明 |
|------|------|--------|------|
| RTSP | 摄像头接入 | P0 | 最常用，延迟低 |
| WebRTC | 浏览器播放 | P0 | 低延迟，双向通信 |
| HLS | 移动端兼容 | P1 | 兼容性好 |
| RTMP | 推流 | P1 | 直播推流 |
| 大疆司空2 | 无人机 | P1 | 特定场景 |

### RTSP接入规范

```go
// ✅ RTSP流管理（带重连机制）
type RTSPClient struct {
    url        string
    client     *rtsp.Client
    maxRetry   int           // 最大重试次数
    retryDelay time.Duration // 重试间隔
    stopChan   chan struct{}
}

func (c *RTSPClient) Connect(ctx context.Context) error {
    for c.reconnect < c.maxRetry {
        client, err := rtsp.Dial(c.url)
        if err != nil {
            c.reconnect++
            time.Sleep(c.retryDelay)
            continue
        }
        
        c.client = client
        go c.keepalive()  // 启动保活
        return nil
    }
    return fmt.Errorf("RTSP连接失败")
}

// 保活检测（30秒心跳）
func (c *RTSPClient) keepalive() {
    ticker := time.NewTicker(30 * time.Second)
    for {
        select {
        case <-ticker.C:
            if err := c.client.Options(); err != nil {
                c.reconnect()  // 保活失败，重连
            }
        }
    }
}
```

### WebRTC接入规范

```go
// ✅ WebRTC信令服务器
type SignalingServer struct {
    peers map[string]*Peer
}

func (s *SignalingServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    // 1. 验证token
    token := r.URL.Query().Get("token")
    if !validateToken(token) {
        http.Error(w, "unauthorized", 401)
        return
    }
    
    // 2. 升级WebSocket
    conn, _ := s.upgrader.Upgrade(w, r, nil)
    defer conn.Close()
    
    // 3. 创建PeerConnection
    config := webrtc.Configuration{
        ICEServers: []webrtc.ICEServer{
            {URLs: []string{"stun:stun.l.google.com:19302"}},
        },
    }
    pc, _ := webrtc.NewPeerConnection(config)
    
    // 4. 处理信令消息
    for {
        var msg SignalingMessage
        conn.ReadJSON(&msg)
        // 处理offer/answer/ice-candidate
    }
}
```

---

## 二、视频播放

### 多画面布局

```typescript
// ✅ React多画面播放器
export const MultiPlayer: React.FC<MultiPlayerProps> = ({
  layout, streams, maxStreams
}) => {
  const playersRef = useRef<Map<string, Player>>(new Map());
  
  // 根据布局计算可见流
  const visibleStreams = useMemo(() => {
    const count = getLayoutCount(layout); // 1x1到5x5
    return streams.slice(0, Math.min(count, maxStreams));
  }, [layout, streams]);
  
  // 动态调整播放路数
  useEffect(() => {
    if (playersRef.current.size > maxStreams) {
      adjustQualityForPerformance();  // 降低非焦点窗口码率
    }
  }, [visibleStreams]);
  
  return (
    <div className={`grid grid-${layout} gap-2 h-full`}>
      {visibleStreams.map(stream => (
        <VideoCell key={stream.id} stream={stream} />
      ))}
    </div>
  );
};
```

### 播放器性能优化

```typescript
// ✅ 使用WebWorker解码
class VideoDecoder {
  private worker: Worker;
  
  constructor() {
    this.worker = new Worker('/workers/video-decoder.js');
    this.worker.onmessage = this.handleDecodedFrame.bind(this);
  }
  
  decode(frame: ArrayBuffer) {
    this.worker.postMessage({ type: 'decode', data: frame }, [frame]);
  }
}

// ✅ 虚拟滚动（只渲染可见区域）
const VirtualStreamGrid = ({ streams }) => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const streamId = entry.target.getAttribute('data-stream-id');
        if (entry.isIntersecting) {
          startPlaying(streamId);  // 进入视野，开始播放
        } else {
          stopPlaying(streamId);   // 离开视野，暂停播放
        }
      });
    }, { threshold: 0.5 });
  }, []);
};
```

---

## 三、视频存储

### 录像存储结构

```go
// ✅ 录像文件管理
const (
    MaxFileSize    = 1 * 1024 * 1024 * 1024  // 单文件最大1GB
    MaxDuration    = 1 * time.Hour            // 单文件最大1小时
    RetentionDays  = 7                        // 本地保留7天
)

// 存储路径：/recordings/{stream_id}/{YYYY}/{MM}/{DD}/{HH}/{stream_id}_{timestamp}.mp4
func (m *RecordingManager) generatePath(timestamp time.Time) string {
    return filepath.Join(
        m.basePath, m.streamID,
        fmt.Sprintf("%04d", timestamp.Year()),
        fmt.Sprintf("%02d", timestamp.Month()),
        fmt.Sprintf("%02d", timestamp.Day()),
        fmt.Sprintf("%s_%d.mp4", m.streamID, timestamp.Unix()),
    )
}

// 自动切分文件
func (m *RecordingManager) needNewFile() bool {
    info, _ := m.currentFile.Stat()
    return info.Size() >= MaxFileSize || time.Since(m.startTime) >= MaxDuration
}
```

### 云端备份

```go
// ✅ 云端存储管理
func (s *CloudStorage) Upload(ctx context.Context, localPath string) error {
    objectName := s.generateObjectName(localPath)
    
    // 上传到MinIO
    _, err := s.client.FPutObject(ctx, s.bucket, objectName, localPath,
        minio.PutObjectOptions{ContentType: "video/mp4"})
    
    // 设置生命周期（自动删除）
    s.setLifecycle(ctx, objectName)
    
    // 删除本地文件
    os.Remove(localPath)
    return err
}
```

---

## 四、性能优化

### 硬件加速

```go
// ✅ 使用GPU解码
func NewHardwareDecoder() (*HardwareDecoder, error) {
    // 查找NVIDIA解码器
    codec := C.avcodec_find_decoder_by_name(C.CString("h264_cuvid"))
    
    // 创建CUDA设备上下文
    C.av_hwdevice_ctx_create(&hwDeviceCtx, C.AV_HWDEVICE_TYPE_CUDA, nil, nil, 0)
    
    return &HardwareDecoder{codecCtx: codecCtx, hwDeviceCtx: hwDeviceCtx}, nil
}
```

### 内存池管理

```go
// ✅ 内存池避免GC压力
type FramePool struct {
    pool *sync.Pool
    size int
}

func NewFramePool(frameSize int) *FramePool {
    return &FramePool{
        size: frameSize,
        pool: &sync.Pool{
            New: func() interface{} {
                return make([]byte, frameSize)
            },
        },
    }
}

// 使用示例
var framePool = NewFramePool(1920 * 1080 * 3 / 2)

func processFrame(data []byte) {
    frame := framePool.Get()
    defer framePool.Put(frame)
    copy(frame, data)
}
```

### 连接池管理

```go
// ✅ WebSocket连接池
type WebSocketPool struct {
    maxConns    int
    current     int32
    connections chan *websocket.Conn
}

func (p *WebSocketPool) Acquire() (*websocket.Conn, error) {
    if atomic.AddInt32(&p.current, 1) <= int32(p.maxConns) {
        return p.createConnection()
    }
    return nil, fmt.Errorf("连接数超限")
}
```

---

## 五、监控与告警

### 流状态监控

```go
// ✅ 流健康检查
type StreamHealth struct {
    StreamID      string
    LastFrameTime time.Time
    FrameCount    int64
    Bitrate       float64
    Status        string // healthy/warning/error
}

func (m *StreamMonitor) CheckHealth(streamID string) {
    health := m.streams[streamID]
    
    // 检查最后帧时间
    if time.Since(health.LastFrameTime) > 10*time.Second {
        health.Status = "error"
        m.alert(streamID, "no_frame", "10秒未收到视频帧")
    }
    
    // 检查帧率
    if calculateFPS(health) < 5 {
        health.Status = "warning"
        m.alert(streamID, "low_fps", "帧率过低")
    }
}
```

### 性能指标

```yaml
监控指标:
  流级别:
    - 帧率 (FPS)
    - 码率 (Bitrate)
    - 延迟 (Latency)
    - 丢包率 (Packet Loss)
    
  系统级别:
    - 并发流数量
    - CPU/内存/GPU使用率
    - 网络带宽
    
  告警阈值:
    - FPS < 5: 警告
    - FPS = 0: 错误
    - 延迟 > 500ms: 警告
    - 丢包率 > 5%: 错误
```

---

## 六、禁止事项

```yaml
❌ 绝对禁止:
  - 不设置重连机制
  - 内存无限增长（不释放）
  - 不限制并发路数
  - 硬编码视频参数
  - 阻塞主线程
  - 不处理WebSocket异常关闭
  
⚠️ 需要特别注意:
  - 资源泄漏（文件句柄、连接）
  - 内存碎片
  - 解码失败恢复
  - 网络抖动处理
```

---

**最后更新**: 2026年4月
