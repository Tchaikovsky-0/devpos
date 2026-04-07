"""
AI Service - Pydantic Schemas
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Detection Models
# ============================================================================


class BBox(BaseModel):
    """Bounding box"""
    x1: float = Field(..., ge=0)
    y1: float = Field(..., ge=0)
    x2: float = Field(..., ge=0)
    y2: float = Field(..., ge=0)


class DetectedObject(BaseModel):
    """Single detected object"""
    class_name: str
    confidence: float = Field(..., ge=0, le=1)
    bbox: BBox


class DetectionRequest(BaseModel):
    """Request for YOLO detection by stream_id"""
    stream_id: str
    image_url: Optional[str] = None


class DetectionResponse(BaseModel):
    """Detection result with metadata"""
    id: str
    stream_id: str
    objects: List[DetectedObject] = []
    confidence: float = 0.0
    processing_time: float = 0.0


class DetectionFromImageResponse(BaseModel):
    """Detection result from uploaded image"""
    timestamp: str
    detections: List[DetectedObject] = []
    processing_time: float = 0.0


class InspectionRequest(BaseModel):
    """AI inspection request"""
    stream_id: str
    inspection_type: str = "general"
    sensitivity: float = Field(default=0.5, ge=0.1, le=1.0)


class InspectionResponse(BaseModel):
    """AI inspection result"""
    stream_id: str
    inspection_type: str
    status: str
    findings: List[Dict[str, Any]]
    score: float = Field(..., ge=0, le=100)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Chat Models
# ============================================================================


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat completion request"""
    messages: List[ChatMessage]
    model: Optional[str] = None
    stream_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat completion response"""
    message: ChatMessage
    model: str
    usage: Optional[Dict[str, int]] = None
    session_id: Optional[str] = None
    suggestions: Optional[List[str]] = None


class SessionSummary(BaseModel):
    """Chat session summary"""
    id: str
    title: str
    last_message: str
    message_count: int
    created_at: str
    updated_at: str


class SessionDetail(BaseModel):
    """Chat session detail with messages"""
    id: str
    title: str
    messages: List[ChatMessage]
    message_count: int
    created_at: str
    updated_at: str


# ============================================================================
# Analysis Models
# ============================================================================


class AnalysisRequest(BaseModel):
    """AI analysis request"""
    type: str
    data: Dict[str, Any]
    stream_id: Optional[str] = None
    tenant_id: Optional[str] = None


class AnalysisResponse(BaseModel):
    """AI analysis result"""
    type: str
    result: Dict[str, Any]
    confidence: float
    recommendations: List[str] = []
    severity: str = "info"


# ============================================================================
# Report Models
# ============================================================================


class ReportGenerateRequest(BaseModel):
    """Report generation request"""
    title: str
    report_type: str
    tenant_id: Optional[str] = None
    stream_ids: Optional[List[str]] = None
    date_range: Optional[Dict[str, str]] = None
    include_detections: bool = True
    include_alerts: bool = True
    include_sensors: bool = True
    additional_context: Optional[str] = None


class ReportGenerateResponse(BaseModel):
    """Report generation result"""
    title: str
    report_type: str
    content: str
    summary: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    sections: List[Dict[str, Any]] = []


# ============================================================================
# Model Management
# ============================================================================


class ModelInfo(BaseModel):
    """AI model information"""
    name: str
    type: str
    description: str
    loaded: bool = False
    device: str = "cpu"


class ModelsResponse(BaseModel):
    """List of available models"""
    models: List[ModelInfo]


# ============================================================================
# Root Cause / Trend Models
# ============================================================================


class RootCauseResult(BaseModel):
    """Root cause analysis result"""
    alert_type: str
    probable_causes: List[str]
    confidence: float
    recommendations: List[str]
    severity: str = "info"


class TrendResult(BaseModel):
    """Trend analysis result"""
    metric: str
    trend_direction: str  # up, down, stable
    change_percentage: float
    forecast: str
    recommendations: List[str]
