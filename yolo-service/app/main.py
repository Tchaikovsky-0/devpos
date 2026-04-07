"""
YOLO Service - Main Application

FastAPI application for YOLO-based object detection with WebSocket streaming.
"""

import asyncio
import json
import os
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import YOLOConfig, HealthResponse, StreamConfig, StreamStatus
from .detector import init_detector, get_detector
from .websocket_manager import manager, processor


# Configuration
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "models/yolov8n.pt")
DEVICE = os.getenv("YOLO_DEVICE", "cpu")

# In-memory detection history (last 1000 records)
_detection_history: deque = deque(maxlen=1000)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("[Startup] Initializing YOLO detector...")

    config = YOLOConfig(
        model_path=YOLO_MODEL_PATH,
        confidence_threshold=0.5,
        iou_threshold=0.45,
        device=DEVICE
    )

    try:
        init_detector(config)
        print("[Startup] YOLO detector initialized successfully")
    except Exception as e:
        print(f"[Startup] Failed to initialize YOLO detector: {e}")

    yield

    # Shutdown
    print("[Shutdown] Stopping all streams...")
    await processor.stop_all()
    print("[Shutdown] Cleanup complete")


app = FastAPI(
    title="YOLO Detection Service",
    description="Real-time YOLO object detection with WebSocket streaming",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - 生产环境应限制来源
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ============================================================================
# Health & Info Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    detector = get_detector()
    return HealthResponse(
        status="healthy",
        model_loaded=detector is not None,
        device=DEVICE,
        active_streams=len(manager.connections)
    )


@app.get("/streams")
async def list_streams():
    """List all active streams"""
    return {
        "streams": [
            {
                "stream_id": sid,
                "status": manager.get_status(sid).dict() if manager.get_status(sid) else None
            }
            for sid in manager.get_stream_ids()
        ]
    }


# ============================================================================
# Stream Management
# ============================================================================

class StartStreamRequest(BaseModel):
    """Request to start a stream"""
    stream_id: str
    rtsp_url: str
    yolo_enabled: bool = True


@app.post("/streams/start")
async def start_stream(req: StartStreamRequest):
    """Start processing a video stream"""
    config = StreamConfig(
        stream_id=req.stream_id,
        rtsp_url=req.rtsp_url,
        yolo_enabled=req.yolo_enabled
    )

    await processor.start_stream(req.stream_id, config)

    return {"status": "started", "stream_id": req.stream_id}


@app.post("/streams/{stream_id}/stop")
async def stop_stream(stream_id: str):
    """Stop a video stream"""
    await processor.stop_stream(stream_id)
    return {"status": "stopped", "stream_id": stream_id}


# ============================================================================
# Image Detection (HTTP)
# ============================================================================

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    """
    Detect objects in an uploaded image

    Returns detection results directly via HTTP.
    For real-time streaming, use WebSocket instead.
    """
    detector = get_detector()
    if not detector:
        raise HTTPException(status_code=503, detail="YOLO model not loaded")

    contents = await file.read()

    try:
        detections, inference_time_ms, image_size = detector.detect_from_bytes(contents)

        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "detections": [
                {
                    "class": d.class_name,
                    "confidence": round(d.confidence, 4),
                    "bbox": [d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2],
                    "class_id": 0
                }
                for d in detections
            ],
            "inference_time_ms": round(inference_time_ms, 2),
            "model_name": detector.get_model_name(),
            "image_size": image_size
        }

        # Store in history
        _detection_history.append(result)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect/batch")
async def detect_batch(files: list[UploadFile] = File(...)):
    """Detect objects in multiple images"""
    detector = get_detector()
    if not detector:
        raise HTTPException(status_code=503, detail="YOLO model not loaded")

    results = []
    for file in files:
        contents = await file.read()
        try:
            detections, inference_time_ms, image_size = detector.detect_from_bytes(contents)
            result_item = {
                "filename": file.filename,
                "detections": [
                    {
                        "class": d.class_name,
                        "confidence": round(d.confidence, 4),
                        "bbox": [d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2],
                        "class_id": 0
                    }
                    for d in detections
                ],
                "inference_time_ms": round(inference_time_ms, 2),
                "model_name": detector.get_model_name(),
                "image_size": image_size
            }
            results.append(result_item)
            _detection_history.append(result_item)
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })

    return {"results": results}


# ============================================================================
# Stream Frame Detection (HTTP)
# ============================================================================

class StreamDetectRequest(BaseModel):
    """Request to detect from a video stream URL"""
    stream_url: str
    stream_id: Optional[str] = None
    timeout: float = 5.0


@app.post("/detect/stream")
async def detect_from_stream(request: StreamDetectRequest):
    """
    Detect objects by grabbing a frame from a video stream URL.

    Supports RTSP, HTTP, and other OpenCV-compatible stream URLs.
    Grabs a single frame and runs YOLO inference on it.
    """
    detector = get_detector()
    if not detector:
        raise HTTPException(status_code=503, detail="YOLO model not loaded")

    try:
        detections, inference_time_ms, image_size = detector.detect_from_stream_url(
            request.stream_url, timeout=request.timeout
        )

        result = {
            "stream_url": request.stream_url,
            "stream_id": request.stream_id or "",
            "timestamp": datetime.utcnow().isoformat(),
            "detections": [
                {
                    "class": d.class_name,
                    "confidence": round(d.confidence, 4),
                    "bbox": [d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2],
                    "class_id": 0
                }
                for d in detections
            ],
            "inference_time_ms": round(inference_time_ms, 2),
            "model_name": detector.get_model_name(),
            "image_size": image_size
        }

        # Store in history
        _detection_history.append(result)

        return result

    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


# ============================================================================
# Detection History
# ============================================================================

@app.get("/detections")
async def get_detection_history(limit: int = 100):
    """
    Get recent detection history from in-memory store.

    Returns up to `limit` most recent detection records.
    """
    limit = min(max(1, limit), 1000)
    records = list(_detection_history)
    # Return most recent first
    records.reverse()
    return {
        "total": len(_detection_history),
        "limit": limit,
        "detections": records[:limit]
    }


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws/{stream_id}")
async def websocket_endpoint(websocket: WebSocket, stream_id: str):
    """
    WebSocket endpoint for real-time detection streaming

    Clients connect to receive detection results for a specific stream.
    Use /ws/{stream_id}?url={rtsp_url} to specify the RTSP stream.
    Or connect first, then send stream configuration.
    """
    await manager.connect(websocket, stream_id)

    try:
        # Handle incoming messages (stream configuration)
        while True:
            data = await websocket.receive_text()

            # Parse configuration message
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            if msg_type == "config":
                # Configure stream
                rtsp_url = msg.get("url")
                if rtsp_url:
                    config = StreamConfig(
                        stream_id=stream_id,
                        rtsp_url=rtsp_url,
                        yolo_enabled=msg.get("yolo_enabled", True)
                    )
                    await processor.start_stream(stream_id, config)

            elif msg_type == "stop":
                await processor.stop_stream(stream_id)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] Error: {e}")
    finally:
        await manager.disconnect(websocket, stream_id)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8097,
        reload=True,
        log_level="info"
    )
