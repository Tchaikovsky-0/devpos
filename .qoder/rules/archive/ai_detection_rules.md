# 巡检宝项目 - AI检测规范

> 本规范适用于巡检宝项目的YOLO检测和AI分析功能。
> **核心原则**: 准确、快速、低误报

---

## 一、模型管理

### 1.1 模型版本控制

```yaml
模型存储:
  路径: /models/{model_name}/{version}/
  命名: yolov8-fire-v1.0.0.onnx
  
版本策略:
  - 生产环境只能使用稳定版
  - 模型文件存储在对象存储
  - 服务启动时自动拉取
  - 支持热更新，不重启切换
```

### 1.2 模型加载

```python
# ✅ 模型管理器
class ModelManager:
    def __init__(self):
        self.models = {}
        self.current_version = {}
    
    def load_model(self, name: str, version: str):
        """加载模型"""
        path = f"/models/{name}/{version}/model.onnx"
        
        # 使用TensorRT加速
        if torch.cuda.is_available():
            model = torch.hub.load('ultralytics/yolov8', name)
            model = torch.compile(model)  # PyTorch 2.0优化
        else:
            model = YOLO(path)
        
        self.models[f"{name}:{version}"] = model
        self.current_version[name] = version
        
        return model
    
    def get_model(self, name: str):
        """获取当前版本模型"""
        version = self.current_version.get(name)
        return self.models.get(f"{name}:{version}")
    
    def hot_swap(self, name: str, new_version: str):
        """热更新模型"""
        self.load_model(name, new_version)
        # 旧模型延迟卸载
        threading.Timer(60, self.unload_old, args=[name]).start()
```

---

## 二、检测策略

### 2.1 检测配置

```python
# ✅ 检测配置
DETECTION_CONFIG = {
    # 置信度阈值
    'confidence_threshold': 0.5,
    
    # NMS阈值
    'nms_threshold': 0.45,
    
    # 输入尺寸
    'input_size': (640, 640),
    
    # 防抖：连续N帧检测到才触发
    'debounce_frames': 3,
    
    # 感兴趣区域(ROI)
    'roi': {
        'enabled': True,
        'regions': [
            {'x': 100, 'y': 100, 'w': 400, 'h': 300}
        ]
    },
    
    # 时间段配置
    'schedule': {
        'day': {'sensitivity': 1.0},
        'night': {'sensitivity': 0.7, 'start': '18:00', 'end': '06:00'}
    }
}
```

### 2.2 防抖机制

```python
# ✅ 检测防抖器
class DetectionDebouncer:
    def __init__(self, threshold: int = 3):
        self.threshold = threshold
        self.frame_buffer = defaultdict(int)
        self.confirmed_detections = set()
    
    def process(self, detections: List[Detection]) -> List[Detection]:
        """处理检测结果，返回确认的告警"""
        current_ids = set()
        confirmed = []
        
        for det in detections:
            obj_id = self.get_object_id(det)
            current_ids.add(obj_id)
            
            # 计数增加
            self.frame_buffer[obj_id] += 1
            
            # 达到阈值，确认告警
            if self.frame_buffer[obj_id] >= self.threshold:
                if obj_id not in self.confirmed_detections:
                    self.confirmed_detections.add(obj_id)
                    confirmed.append(det)
        
        # 清理消失的物体
        for obj_id in list(self.frame_buffer.keys()):
            if obj_id not in current_ids:
                del self.frame_buffer[obj_id]
                self.confirmed_detections.discard(obj_id)
        
        return confirmed
```

---

## 三、性能优化

### 3.1 批量推理

```python
# ✅ 批量推理
class BatchDetector:
    def __init__(self, model, batch_size: int = 4):
        self.model = model
        self.batch_size = batch_size
        self.buffer = []
        self.last_infer_time = time.time()
    
    def add(self, frame: np.ndarray) -> Optional[List[Detection]]:
        """添加帧到缓冲区"""
        self.buffer.append(frame)
        
        # 达到批次或超时，执行推理
        if (len(self.buffer) >= self.batch_size or 
            time.time() - self.last_infer_time > 0.1):
            return self.infer()
        
        return None
    
    def infer(self) -> List[List[Detection]]:
        """批量推理"""
        if not self.buffer:
            return []
        
        # 堆叠成batch
        batch = np.stack(self.buffer)
        
        # 推理
        results = self.model(batch)
        
        # 清空缓冲区
        self.buffer = []
        self.last_infer_time = time.time()
        
        return results
```

### 3.2 推理加速

```python
# ✅ TensorRT加速
import tensorrt as trt
import pycuda.driver as cuda

class TensorRTDetector:
    def __init__(self, engine_path: str):
        self.logger = trt.Logger(trt.Logger.WARNING)
        
        # 加载引擎
        with open(engine_path, 'rb') as f:
            runtime = trt.Runtime(self.logger)
            self.engine = runtime.deserialize_cuda_engine(f.read())
        
        self.context = self.engine.create_execution_context()
        
        # 分配GPU内存
        self.d_input = cuda.mem_alloc(input_size)
        self.d_output = cuda.mem_alloc(output_size)
        self.stream = cuda.Stream()
    
    def infer(self, image: np.ndarray) -> np.ndarray:
        """TensorRT推理"""
        # 拷贝到GPU
        cuda.memcpy_htod_async(self.d_input, image, self.stream)
        
        # 执行推理
        self.context.execute_async_v2(
            bindings=[int(self.d_input), int(self.d_output)],
            stream_handle=self.stream.handle
        )
        
        # 拷贝回CPU
        output = np.empty(output_shape, dtype=np.float32)
        cuda.memcpy_dtoh_async(output, self.d_output, self.stream)
        self.stream.synchronize()
        
        return output
```

---

## 四、检测结果处理

### 4.1 结果缓存

```python
# ✅ 检测结果缓存
class DetectionCache:
    def __init__(self, ttl: int = 60):
        self.cache = {}
        self.ttl = ttl
    
    def get(self, key: str) -> Optional[DetectionResult]:
        """获取缓存结果"""
        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return result
            del self.cache[key]
        return None
    
    def set(self, key: str, result: DetectionResult):
        """设置缓存"""
        self.cache[key] = (result, time.time())
    
    def generate_key(self, stream_id: str, scene_hash: str) -> str:
        """生成缓存key（基于场景特征）"""
        return f"{stream_id}:{scene_hash}"
```

### 4.2 后处理

```python
# ✅ 检测结果后处理
def post_process(
    detections: List[Detection],
    min_area: int = 1000,
    max_area: int = 100000
) -> List[Detection]:
    """过滤不合理检测结果"""
    filtered = []
    
    for det in detections:
        # 面积过滤
        area = det.box.width * det.box.height
        if area < min_area or area > max_area:
            continue
        
        # 宽高比过滤（排除细长物体误报）
        ratio = det.box.width / det.box.height
        if ratio < 0.2 or ratio > 5:
            continue
        
        filtered.append(det)
    
    return filtered
```

---

## 五、禁止事项

```yaml
❌ 绝对禁止:
  - 在主线程执行推理
  - 不设置置信度阈值
  - 单帧检测直接告警（无防抖）
  - 模型文件提交到Git
  - 不释放GPU内存
  
⚠️ 需要特别注意:
  - 推理超时处理
  - 模型加载失败回退
  - GPU显存泄漏
  - 多线程模型调用
```

---

**最后更新**: 2026年4月
