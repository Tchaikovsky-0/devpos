"""
Detection API Routes
"""

from fastapi import APIRouter, File, UploadFile

from ..services.yolo_proxy import get_yolo_service

router = APIRouter()


@router.post("/api/v1/detect")
async def detect_objects(request: dict):
    """YOLO object detection by stream_id"""
    service = get_yolo_service()
    stream_id = request.get("stream_id", "")
    return await service.detect_for_stream(stream_id)


@router.post("/api/v1/detect/image")
async def detect_from_image(file: UploadFile = File(...)):
    """Detect objects from uploaded image"""
    service = get_yolo_service()
    image_bytes = await file.read()
    result = await service.detect_from_bytes(image_bytes, file.filename or "image.jpg")
    return {
        "timestamp": result.timestamp,
        "detections": [
            {
                "class_name": d.class_name,
                "confidence": d.confidence,
                "bbox": [d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2],
            }
            for d in result.detections
        ],
        "processing_time": result.processing_time,
    }


@router.post("/api/v1/detect/{stream_id}")
async def detect_for_stream(stream_id: str, file: UploadFile = File(...)):
    """Detect objects for a specific stream"""
    service = get_yolo_service()
    image_bytes = await file.read()
    return await service.detect_for_stream(stream_id, image_bytes)


@router.get("/api/v1/models")
async def list_models():
    """List available AI models"""
    service = get_yolo_service()
    models = await service.list_models()
    return {"models": [m.model_dump() for m in models]}


@router.get("/api/v1/inspection")
async def run_inspection(stream_id: str, type: str = "general", sensitivity: float = 0.5):
    """Run AI inspection"""
    service = get_yolo_service()
    return await service.run_inspection(stream_id, type, sensitivity)
