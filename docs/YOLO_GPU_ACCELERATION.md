# YOLO GPU 加速配置指南

> 版本: v1.0.0
> 更新日期: 2026-04-03

## 概述

本文档介绍如何在巡检宝项目中启用 YOLO GPU 加速，将检测推理速度提升 10-100 倍。

## 硬件要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| GPU | NVIDIA GPU with CUDA 11.8+ | NVIDIA RTX 3080+ |
| 显存 | 4GB | 8GB+ |
| 内存 | 8GB | 16GB+ |
| 驱动 | NVIDIA Driver 525+ | NVIDIA Driver 535+ |

## 软件要求

```bash
# 检查 NVIDIA GPU
nvidia-smi

# 检查 CUDA 版本
nvcc --version
```

## 方案一：TensorRT 加速 (推荐)

### 1. 安装 TensorRT

```bash
# 下载 TensorRT 8.6 (for CUDA 11.x)
wget https://developer.nvidia.com/downloads/tensorrt-8-6-ga-2023-07-05-22111-13302d1f1374.tar.gz
tar -xzf tensorrt-8.6.1.6.tar.gz
export TENSORRT_DIR=$PWD/TensorRT-8.6.1
export LD_LIBRARY_PATH=$TENSORRT_DIR/lib:$LD_LIBRARY_PATH
```

### 2. 模型转换为 TensorRT

```python
# ai-service/yolo/export_trt.py
import torch
from tensorrt import torch2trt

def export_yolo_to_trt(model_path, output_path):
    """导出 YOLO 模型为 TensorRT 格式"""
    model = torch.load(model_path)

    # 创建输入 tensor
    x = torch.zeros(1, 3, 640, 640).cuda()

    # 转换为 TensorRT
    model_trt = torch2trt(model, [x], fp16_mode=True)

    # 保存
    torch.save(model_trt.state_dict(), output_path)
    print(f"TensorRT model saved to {output_path}")
```

### 3. AI 服务配置

```yaml
# docker-compose.yml
ai-service:
  environment:
    - GPU_ENABLED=true
    - RUNTIME=trt
    - MODEL_PATH=/models/yolov8n-fp16.trt
    - MAX_BATCH_SIZE=8
  volumes:
    - ./models:/models
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## 方案二：PyTorch CUDA 加速

### 1. 安装 PyTorch with CUDA

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 2. 使用 GPU 推理

```python
# ai-service/yolo/detector.py
import torch
from ultralytics import YOLO

class YOLODetector:
    def __init__(self, model_path, conf_threshold=0.5):
        self.model = YOLO(model_path)
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model.to(self.device)

    def detect(self, frame):
        results = self.model(frame, device=self.device, conf=self.conf_threshold)
        return self._parse_results(results)

    def detect_batch(self, frames):
        results = self.model(frames, device=self.device, conf=self.conf_threshold)
        return [self._parse_results(r) for r in results]
```

## 方案三：OpenCV DNN 加速

### 1. 安装 OpenCV with CUDA

```bash
pip install opencv-contrib-python[cuda]
```

### 2. 使用 OpenCV DNN

```python
import cv2

net = cv2.dnn.readNetFromONNX('yolov8n.onnx')
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)

def detect(frame):
    blob = cv2.dnn.blobFromImage(frame, 1/255.0, (640, 640))
    net.setInput(blob)
    outputs = net.forward()
    return parse_yolo_output(outputs)
```

## 性能对比

| 方案 | FPS (RTX 3080) | 延迟 | 显存占用 |
|------|-----------------|------|----------|
| CPU (i9-13900K) | ~15 FPS | ~67ms | 0 MB |
| CUDA (PyTorch) | ~150 FPS | ~6.7ms | 2 GB |
| TensorRT FP16 | ~300-500 FPS | ~2-3ms | 3 GB |
| TensorRT INT8 | ~500-800 FPS | ~1-2ms | 2 GB |

## Docker 部署

### 1. 构建支持 GPU 的镜像

```dockerfile
# ai-service/Dockerfile.gpu
FROM nvidia/cuda:11.8-cudnn8-runtime-ubuntu22.04

RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
RUN pip install ultralytics tensorrt

COPY ./app /app
WORKDIR /app

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8095"]
```

### 2. docker-compose.gpu.yml

```yaml
services:
  ai-service-gpu:
    build:
      context: ./ai-service
      dockerfile: Dockerfile.gpu
    environment:
      - GPU_ENABLED=true
      - RUNTIME=trt
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./ai-service:/app
      - ./models:/models
    ports:
      - "8095:8095"
```

### 3. 启动 GPU 服务

```bash
docker-compose -f docker-compose.gpu.yml up -d
```

## 监控 GPU 使用

```bash
# 实时监控 GPU
watch -n 1 nvidia-smi

# 查看 GPU 利用率
nvidia-smi --query-gpu=utilization.gpu,utilization.memory,memory.used --format=csv

# Prometheus GPU 指标
nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu,utilization.memory,memory.total,memory.free,memory.used --format=csv -l 1 > /tmp/gpu_metrics.prom
```

## 故障排查

### GPU 不可见

```bash
# 检查 NVIDIA 驱动
ls -la /dev/nvidia*

# 检查容器 GPU 访问
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu22.04 nvidia-smi
```

### CUDA 版本不匹配

```bash
# 检查 PyTorch CUDA 版本
python -c "import torch; print(torch.version.cuda)"

# 检查 TensorRT 版本
python -c "import tensorrt; print(tensorrt.__version__)"
```

### 显存不足

```bash
# 减小 batch size
export MAX_BATCH_SIZE=4

# 使用更小的模型
# yolov8n (3.2M params) instead of yolov8x (68M params)
```

## 性能调优

### 1. 批量处理

```python
class BatchDetector:
    def __init__(self, model_path, batch_size=8):
        self.batch_size = batch_size
        self.model = YOLO(model_path)
        self.buffer = []

    def add(self, frame):
        self.buffer.append(frame)
        if len(self.buffer) >= self.batch_size:
            return self.process_batch()
        return None

    def process_batch(self):
        results = self.model(self.buffer, device='cuda')
        self.buffer = []
        return [self._parse_results(r) for r in results]
```

### 2. 异步推理

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class AsyncDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def detect_async(self, frame):
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor,
            self.model,
            frame
        )
        return self._parse_results(result)
```

### 3. 模型量化

```python
# FP16 量化
model = torch.compile(model, backend="inductor")
model = model.half()  # FP16

# INT8 量化 (需要校准)
import torch.cuda.quantization as quant
model_quantized = quant.quantize_dynamic(model, {torch.nn.Linear}, dtype=torch.qint8)
```

## 总结

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 入门/开发 | PyTorch CUDA | 简单，无需模型转换 |
| 生产环境 | TensorRT FP16 | 最佳性能/精度平衡 |
| 边缘设备 | TensorRT INT8 | 最小显存，最快速度 |

## 参考链接

- [NVIDIA TensorRT](https://developer.nvidia.com/tensorrt)
- [Ultralytics YOLO](https://docs.ultralytics.com/)
- [PyTorch CUDA](https://pytorch.org/)
- [OpenCV DNN CUDA](https://docs.opencv.org/4.8.0/d6/d0f/group__dnn.html)
