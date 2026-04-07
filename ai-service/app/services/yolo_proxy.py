"""
YOLO Proxy Service
Proxies detection requests to the yolo-service
"""

import os
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from ..models.schemas import (
    BBox,
    DetectedObject,
    DetectionFromImageResponse,
    DetectionResponse,
    InspectionResponse,
    ModelInfo,
)


class YOLOProxyService:
    """Proxies requests to the standalone YOLO service"""

    def __init__(self, yolo_service_url: str = "http://localhost:8097"):
        self.base_url = yolo_service_url.rstrip("/")
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    async def health_check(self) -> dict:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.base_url}/health")
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            return {"status": "unavailable", "model_loaded": False, "device": "cpu"}
        except Exception as exc:
            return {"status": "error", "error": str(exc)}

    # ------------------------------------------------------------------
    # Detection from image bytes
    # ------------------------------------------------------------------

    async def detect_from_bytes(
        self, image_bytes: bytes, filename: str = "image.jpg"
    ) -> DetectionFromImageResponse:
        client = await self._get_client()
        start_time = time.time()

        try:
            files = {"file": (filename, image_bytes, "image/jpeg")}
            resp = await client.post(f"{self.base_url}/detect", files=files)
            resp.raise_for_status()
            data = resp.json()

            detections: List[DetectedObject] = []
            for d in data.get("detections", []):
                bbox_raw = d.get("bbox", [0, 0, 1, 1])
                detections.append(
                    DetectedObject(
                        class_name=d.get("class", "unknown"),
                        confidence=d.get("confidence", 0.0),
                        bbox=BBox(
                            x1=float(bbox_raw[0]),
                            y1=float(bbox_raw[1]),
                            x2=float(bbox_raw[2]),
                            y2=float(bbox_raw[3]),
                        ),
                    )
                )

            return DetectionFromImageResponse(
                timestamp=data.get("timestamp", datetime.utcnow().isoformat()),
                detections=detections,
                processing_time=time.time() - start_time,
            )
        except httpx.ConnectError:
            return DetectionFromImageResponse(
                timestamp=datetime.utcnow().isoformat(),
                detections=[],
                processing_time=0.0,
            )

    # ------------------------------------------------------------------
    # Detection for stream
    # ------------------------------------------------------------------

    async def detect_for_stream(
        self, stream_id: str, image_bytes: Optional[bytes] = None
    ) -> DetectionResponse:
        start_time = time.time()

        if image_bytes:
            result = await self.detect_from_bytes(image_bytes)
            dets = result.detections
            avg_conf = (
                sum(d.confidence for d in dets) / len(dets) if dets else 0.0
            )
            return DetectionResponse(
                id=f"det_{uuid.uuid4().hex[:8]}",
                stream_id=stream_id,
                objects=dets,
                confidence=avg_conf,
                processing_time=result.processing_time,
            )

        return DetectionResponse(
            id=f"det_{uuid.uuid4().hex[:8]}",
            stream_id=stream_id,
            objects=[],
            confidence=0.0,
            processing_time=time.time() - start_time,
        )

    # ------------------------------------------------------------------
    # Models
    # ------------------------------------------------------------------

    async def list_models(self) -> List[ModelInfo]:
        health = await self.health_check()
        loaded = health.get("model_loaded", False)
        device = health.get("device", "cpu")

        return [
            ModelInfo(
                name="yolov8-fire",
                type="detection",
                description="火灾检测模型 - 识别火焰、烟雾",
                loaded=loaded,
                device=device,
            ),
            ModelInfo(
                name="yolov8-intrusion",
                type="detection",
                description="入侵检测模型 - 识别非授权人员",
                loaded=loaded,
                device=device,
            ),
            ModelInfo(
                name="yolov8-defect",
                type="detection",
                description="缺陷检测模型 - 识别设备缺陷",
                loaded=loaded,
                device=device,
            ),
            ModelInfo(
                name="yolov8-general",
                type="detection",
                description="通用检测模型 - COCO 80类",
                loaded=loaded,
                device=device,
            ),
        ]

    # ------------------------------------------------------------------
    # Inspection
    # ------------------------------------------------------------------

    async def run_inspection(
        self, stream_id: str, inspection_type: str, sensitivity: float
    ) -> InspectionResponse:
        return InspectionResponse(
            stream_id=stream_id,
            inspection_type=inspection_type,
            status="normal",
            findings=[],
            score=95.0,
            timestamp=datetime.utcnow(),
        )


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_service: Optional[YOLOProxyService] = None


def get_yolo_service() -> YOLOProxyService:
    global _service
    if _service is None:
        url = os.getenv("YOLO_SERVICE_URL", "http://localhost:8097")
        _service = YOLOProxyService(url)
    return _service
