# 巡检宝 AI 服务

## 目录结构

```
ai-service/
├── app/                    # 巡检宝 FastAPI 服务 (旧版, mock YOLO)
├── yolo/                   # YOLO 目标检测服务 (生产可用)
│   ├── main.py            # CPU 版本
│   └── optimized_main.py  # GPU 优化版 + 批量处理
├── plugins/                # OpenClaw 插件
│   ├── knowledge-base/    # RAG 知识库 (BM25 + 向量搜索)
│   └── openclaw-yolo/     # OpenClaw YOLO 工具集
└── box/                   # Linux Box 基础设施
    ├── health_server.py   # 设备健康监控
    └── update_checker.py  # OTA 更新服务
```

## 服务启动

### YOLO 检测服务 (生产推荐)
```bash
cd yolo
pip install -r requirements.txt
python optimized_main.py  # GPU + 批量处理
# 或
python main.py  # CPU 版本

# 端口: 8001
# API: POST /detect, POST /detect/batch, POST /detect/file
```

### 设备健康监控
```bash
cd box
pip install -r requirements.txt
python health_server.py

# 端口: 8002
```

### OTA 更新服务
```bash
cd box
python update_checker.py

# 端口: 8003
```

## 依赖

- Python 3.10+
- FastAPI >= 0.104.0
- Ultralytics YOLOv8 >= 8.1.0
- OpenCV
- Pydantic >= 2.5.0

## 部署

推荐使用 Docker 部署，见各子目录的 Dockerfile。
