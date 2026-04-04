"""
巡检宝 AI 服务 - Main Application

提供 YOLO 检测、AI 聊天分析、报告生成等功能。

功能:
  - YOLO 目标检测 (代理到 yolo-service)
  - AI 聊天/对话分析
  - 智能分析 (火灾、入侵、缺陷)
  - 巡检报告生成
  - 模型管理
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    ChatRequest,
    ChatResponse,
    DetectionRequest,
    DetectionResponse,
    InspectionRequest,
    InspectionResponse,
    ModelInfo,
    ReportGenerateRequest,
    ReportGenerateResponse,
)
from .services.analysis_service import get_analysis_service
from .services.chat_service import get_chat_service
from .services.report_service import get_report_service
from .services.yolo_proxy import get_yolo_service


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup / shutdown"""
    print("[AI-Service] Starting up...")
    yield
    print("[AI-Service] Shutting down...")
    yolo = get_yolo_service()
    await yolo.close()
    chat = get_chat_service()
    await chat.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="巡检宝 AI 服务",
    description="提供 YOLO 检测、AI 分析、报告生成等功能",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check"""
    yolo = get_yolo_service()
    yolo_health = await yolo.health_check()
    return {
        "status": "ok",
        "service": "ai-service",
        "version": "2.0.0",
        "yolo_service": yolo_health,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================================
# Detection Endpoints
# ============================================================================


@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest):
    """
    YOLO 目标检测 - 通过 stream_id 或 image_url
    """
    yolo = get_yolo_service()
    return await yolo.detect_for_stream(request.stream_id)


@app.post("/api/v1/detect/image")
async def detect_from_image(file: UploadFile = File(...)):
    """
    从上传的图片进行检测
    """
    yolo = get_yolo_service()
    image_bytes = await file.read()
    result = await yolo.detect_from_bytes(image_bytes, file.filename or "image.jpg")
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


@app.post("/api/v1/detect/{stream_id}", response_model=DetectionResponse)
async def detect_for_stream(stream_id: str, file: UploadFile = File(...)):
    """
    检测特定视频流 - 上传图片
    """
    yolo = get_yolo_service()
    image_bytes = await file.read()
    return await yolo.detect_for_stream(stream_id, image_bytes)


# ============================================================================
# AI Chat
# ============================================================================


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """
    AI 对话 - 智能巡检助手
    """
    service = get_chat_service()
    return await service.chat(request)


# ============================================================================
# AI Analysis
# ============================================================================


@app.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_data(request: AnalysisRequest):
    """
    AI 智能分析

    支持类型: fire, intrusion, defect, equipment, environment, alert
    """
    service = get_analysis_service()
    return await service.analyze(request)


@app.post("/api/v1/analyze-alert/{alert_id}", response_model=AnalysisResponse)
async def analyze_alert(alert_id: str):
    """分析告警"""
    service = get_analysis_service()
    return await service.analyze(
        AnalysisRequest(
            type="alert",
            data={"alert_id": alert_id, "level": "P2", "type": "unknown"},
        )
    )


@app.post("/api/v1/diagnose-device/{device_id}", response_model=AnalysisResponse)
async def diagnose_device(device_id: str):
    """诊断设备"""
    service = get_analysis_service()
    return await service.analyze(
        AnalysisRequest(
            type="equipment",
            data={"device_id": device_id, "status": "unknown"},
        )
    )


# ============================================================================
# Report Generation
# ============================================================================


@app.post("/api/v1/reports/generate", response_model=ReportGenerateResponse)
async def generate_report(request: ReportGenerateRequest):
    """
    生成巡检报告

    支持类型: daily, weekly, monthly, incident, inspection
    """
    service = get_report_service()
    return await service.generate_report(request)


@app.post("/api/v1/generate-report", response_model=ReportGenerateResponse)
async def generate_report_v0(request: ReportGenerateRequest):
    """Legacy alias for report generation"""
    return await generate_report(request)


# ============================================================================
# Model Management
# ============================================================================


@app.get("/api/v1/models")
async def list_models():
    """列出可用的 AI 模型"""
    yolo = get_yolo_service()
    models = await yolo.list_models()
    return {"models": [m.model_dump() for m in models]}


# ============================================================================
# Inspection
# ============================================================================


@app.get("/api/v1/inspection")
async def run_inspection(stream_id: str, type: str = "general", sensitivity: float = 0.5):
    """运行 AI 巡检"""
    yolo = get_yolo_service()
    return await yolo.run_inspection(stream_id, type, sensitivity)


# ============================================================================
# Storage Prediction
# ============================================================================


@app.get("/api/v1/predict/storage/{stream_id}")
async def predict_storage(stream_id: str):
    """存储空间预测"""
    return {
        "stream_id": stream_id,
        "current_usage": 30.5,
        "predicted_days_remaining": 45,
        "trend": "stable",
        "recommendation": "存储空间充足，无需额外扩容",
    }


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8095"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
