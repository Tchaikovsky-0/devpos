# YOLO Detection Service

巡检宝 YOLO 检测微服务 - 独立开发，后期与主系统合并。

## 目录结构

```
yolo-service/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 应用入口
│   ├── models.py        # 数据模型
│   ├── detector.py      # YOLO 检测器
│   └── websocket_manager.py  # WebSocket 管理
├── models/             # YOLO 模型文件
│   └── yolov8n.pt
├── tests/
│   └── test_detector.py
├── requirements.txt
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd yolo-service
pip install -r requirements.txt
```

### 2. 下载 YOLO 模型

```bash
# 创建 models 目录
mkdir -p models

# 下载 YOLOv8n (nano, 最小最块)
wget -O models/yolov8n.pt https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt

# 或下载 YOLOv8s (small)
wget -O models/yolov8s.pt https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8s.pt
```

### 3. 启动服务

```bash
# 开发模式
python -m uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. 测试

```bash
# 健康检查
curl http://localhost:8000/health

# 上传图片检测 (HTTP)
curl -X POST http://localhost:8000/detect \
  -F "file=@test.jpg"

# WebSocket 连接
ws://localhost:8000/ws/stream-001?url=rtsp://example.com/stream
```

## API 文档

启动服务后访问: http://localhost:8000/docs

### 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /streams | 列出活跃流 |
| POST | /streams/start | 启动视频流处理 |
| POST | /streams/{id}/stop | 停止视频流处理 |
| POST | /detect | 图片检测 (HTTP) |
| WS | /ws/{stream_id} | WebSocket 实时检测 |

## WebSocket 消息格式

### 发送到服务器

```json
{
  "type": "config",
  "url": "rtsp://example.com/stream",
  "yolo_enabled": true
}
```

### 接收检测结果

```json
{
  "type": "detection",
  "stream_id": "stream-001",
  "timestamp": "2026-04-04T10:30:00Z",
  "detections": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": [0.1, 0.2, 0.5, 0.8]
    }
  ]
}
```

## 与主系统合并

合并时只需：

1. **YOLO 服务注册** - 添加到 docker-compose.yaml
2. **YOLO 网关开发** - 在 Go 服务中添加 YOLO 网关
3. **前端集成** - 接入 YOLOOverlay 组件

详细合并方案见 `xunjianbao/CLAUDE.md` 或主项目文档。

## 性能目标

| 指标 | 开发环境 (MacMini) | 生产环境 (NVIDIA) |
|------|-------------------|------------------|
| 推理延迟 | < 50ms | < 20ms |
| 同时处理流 | 4 路 | 20+ 路 |
| FPS | 15-20 | 25-30 |

## 支持的检测类别

### 预训练模型 (YOLOv8)

- person
- vehicle (car, truck, bus, motorcycle)
- animal (bird, cat, dog, horse, etc.)
- 详见 [Ultralytics COCO](https://docs.ultralytics.com/datasets/detect/coco/)

### 自定义类别 (需训练)

- 蓝藻 (blue_algae)
- 楼房侵蚀 (corrosion)
- 人员入侵 (intrusion)
- 火灾 (fire)
- 裂缝 (crack)

## 开发团队

- 后端: Python FastAPI + YOLOv8
- 前端测试: 可选 Vue/React 独立页面
