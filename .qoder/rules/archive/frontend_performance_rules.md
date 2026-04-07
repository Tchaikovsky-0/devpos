# 巡检宝项目 - 前端性能规范

> 本规范适用于巡检宝前端项目的性能优化。
> **核心原则**: 快速渲染、流畅交互、资源优化

---

## 一、渲染优化

### 1.1 组件优化

```typescript
// ✅ 使用React.memo避免不必要渲染
const StreamCard = React.memo<StreamCardProps>(({ stream, onClick }) => {
  return <div onClick={onClick}>{stream.name}</div>;
}, (prev, next) => {
  // 自定义比较函数
  return prev.stream.id === next.stream.id && 
         prev.stream.status === next.stream.status;
});

// ✅ 使用useMemo缓存计算
const filteredStreams = useMemo(() => {
  return streams.filter(s => s.status === 'active');
}, [streams]);

// ✅ 使用useCallback缓存函数
const handleClick = useCallback((id: string) => {
  navigate(`/streams/${id}`);
}, [navigate]);
```

### 1.2 虚拟列表

```typescript
// ✅ 大数据量使用虚拟滚动
import { FixedSizeList as List } from 'react-window';

const StreamList: React.FC<{ streams: Stream[] }> = ({ streams }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <StreamCard stream={streams[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={streams.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

---

## 二、资源优化

### 2.1 代码分割

```typescript
// ✅ 路由懒加载
const StreamDetail = lazy(() => import('./pages/StreamDetail'));

// ✅ 组件懒加载
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

// ✅ 预加载关键资源
const preloadStreamData = () => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/api/streams';
  document.head.appendChild(link);
};
```

### 2.2 图片优化

```typescript
// ✅ 响应式图片
<img
  src="image-800w.webp"
  srcSet="image-400w.webp 400w, image-800w.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
  alt="监控画面"
/>

// ✅ 使用WebP格式
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="监控画面" />
</picture>
```

---

## 三、状态管理

### 3.1 状态分离

```typescript
// ✅ 视频状态单独管理
const useVideoStore = create<VideoState>((set) => ({
  streams: {},
  setStream: (id, data) => set((state) => ({
    streams: { ...state.streams, [id]: data }
  })),
}));

// ✅ 使用selector精确订阅
const streamStatus = useVideoStore(
  useCallback(state => state.streams[id]?.status, [id])
);
```

### 3.2 批量更新

```typescript
// ✅ 批量更新减少重渲染
const batchUpdate = () => {
  flushSync(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
  });
};
```

---

## 四、网络优化

### 4.1 请求优化

```typescript
// ✅ 使用React Query缓存
const { data } = useQuery({
  queryKey: ['streams'],
  queryFn: fetchStreams,
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000,
});

// ✅ 防抖请求
const debouncedSearch = useDebouncedCallback((value) => {
  searchAPI(value);
}, 300);
```

### 4.2 WebSocket优化

```typescript
// ✅ WebSocket消息批量处理
const messageBuffer = useRef<any[]>([]);

useEffect(() => {
  const interval = setInterval(() => {
    if (messageBuffer.current.length > 0) {
      processBatch(messageBuffer.current);
      messageBuffer.current = [];
    }
  }, 100);
  
  return () => clearInterval(interval);
}, []);
```

---

## 五、性能指标

```yaml
目标指标:
  - 首屏加载 < 3秒
  - 首次可交互 < 1.5秒
  - 累积布局偏移 < 0.1
  - 帧率 > 30fps
  - Lighthouse > 90
  
监控项:
  - Web Vitals (LCP, FID, CLS)
  - 资源加载时间
  - 内存占用
  - 组件渲染时间
```

---

## 六、禁止事项

```yaml
❌ 绝对禁止:
  - 在render中执行副作用
  - 不必要的状态提升
  - 大对象作为依赖项
  - 内联函数作为props
  - 图片无压缩上传
  
⚠️ 需要特别注意:
  - 内存泄漏
  - 事件监听清理
  - 定时器清理
  - 闭包陷阱
```

---

**最后更新**: 2026年4月
