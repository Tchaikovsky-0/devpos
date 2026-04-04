"""
YOLO Service - Data Models
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class BBox(BaseModel):
    """Bounding box in normalized coordinates (0-1)"""
    x1: float = Field(..., ge=0, le=1, description="Top-left x")
    y1: float = Field(..., ge=0, le=1, description="Top-left y")
    x2: float = Field(..., ge=0, le=1, description="Bottom-right x")
    y2: float = Field(..., ge=0, le=1, description="Bottom-right y")


class Detection(BaseModel):
    """Single detection result"""
    class_name: str = Field(..., description="Class name (e.g., 'person', 'blue_algae')")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score")
    bbox: BBox = Field(..., description="Bounding box")


class DetectionMessage(BaseModel):
    """WebSocket message format for detections"""
    type: str = "detection"
    stream_id: str = Field(..., description="Stream identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    detections: List[Detection] = Field(default_factory=list)
    frame_width: Optional[int] = Field(None, description="Frame width for bbox scaling")
    frame_height: Optional[int] = Field(None, description="Frame height for bbox scaling")


class StreamConfig(BaseModel):
    """Configuration for a video stream"""
    stream_id: str
    rtsp_url: Optional[str] = None
    webrtc_url: Optional[str] = None
    type: str = "rtsp"  # rtsp, webrtc, file
    enabled: bool = True
    yolo_enabled: bool = True
    classes: Optional[List[str]] = None  # Filter by specific classes


class StreamStatus(BaseModel):
    """Status of a stream"""
    stream_id: str
    status: str  # connecting, active, inactive, error
    last_frame: Optional[datetime] = None
    fps: float = 0
    error: Optional[str] = None


class YOLOConfig(BaseModel):
    """YOLO model configuration"""
    model_path: str = "models/yolov8n.pt"
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    device: str = "cpu"  # cpu, cuda, mps
    max_det: int = 300
    classes: Optional[List[int]] = None  # Filter by class indices


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    model_loaded: bool
    device: str
    active_streams: int = 0
