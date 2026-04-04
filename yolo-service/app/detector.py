"""
YOLO Service - Detector Module
"""

import cv2
import numpy as np
from datetime import datetime
from typing import List, Optional, Tuple
from ultralytics import YOLO

from .models import Detection, BBox, YOLOConfig


class YOLODetector:
    """YOLO object detector"""

    def __init__(self, config: YOLOConfig):
        self.config = config
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load YOLO model"""
        try:
            self.model = YOLO(self.config.model_path)
            if self.config.device != "cpu":
                self.model.to(self.config.device)
            print(f"[YOLO] Model loaded: {self.config.model_path}")
            print(f"[YOLO] Device: {self.config.device}")
        except Exception as e:
            print(f"[YOLO] Failed to load model: {e}")
            raise

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """
        Detect objects in a frame

        Args:
            frame: BGR image (numpy array)

        Returns:
            List of Detection objects
        """
        if self.model is None:
            return []

        try:
            # Run inference
            results = self.model(
                frame,
                conf=self.config.confidence_threshold,
                iou=self.config.iou_threshold,
                max_det=self.config.max_det,
                classes=self.config.classes,
                verbose=False
            )

            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    # Get box coordinates (xyxy format)
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])

                    # Normalize to 0-1
                    h, w = frame.shape[:2]
                    x1_norm = float(x1 / w)
                    y1_norm = float(y1 / h)
                    x2_norm = float(x2 / w)
                    y2_norm = float(y2 / h)

                    # Get class name
                    class_name = self.model.names.get(cls, f"class_{cls}")

                    detections.append(Detection(
                        class_name=class_name,
                        confidence=conf,
                        bbox=BBox(
                            x1=x1_norm,
                            y1=y1_norm,
                            x2=x2_norm,
                            y2=y2_norm
                        )
                    ))

            return detections

        except Exception as e:
            print(f"[YOLO] Detection error: {e}")
            return []

    def detect_from_bytes(self, image_bytes: bytes) -> List[Detection]:
        """
        Detect objects from image bytes

        Args:
            image_bytes: JPEG/PNG image bytes

        Returns:
            List of Detection objects
        """
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return []

        return self.detect(frame)

    def get_annotated_frame(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        """
        Draw detection boxes on frame

        Args:
            frame: BGR image
            detections: List of detections

        Returns:
            Annotated frame
        """
        annotated = frame.copy()
        h, w = frame.shape[:2]

        # Color map for different classes
        colors = {
            'person': (255, 0, 0),      # Blue
            'vehicle': (0, 255, 0),      # Green
            'fire': (0, 0, 255),         # Red
            'blue_algae': (255, 255, 0), # Cyan
            'intrusion': (255, 0, 255),  # Magenta
            'default': (0, 255, 255)     # Yellow
        }

        for det in detections:
            color = colors.get(det.class_name, colors['default'])

            # Scale bbox to pixel coordinates
            x1 = int(det.bbox.x1 * w)
            y1 = int(det.bbox.y1 * h)
            x2 = int(det.bbox.x2 * w)
            y2 = int(det.bbox.y2 * h)

            # Draw rectangle
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Draw label
            label = f"{det.class_name} {det.confidence:.2f}"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated, (x1, y1 - label_size[1] - 4), (x1 + label_size[0], y1), color, -1)
            cv2.putText(annotated, label, (x1, y1 - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return annotated


# Global detector instance
_detector: Optional[YOLODetector] = None


def init_detector(config: YOLOConfig) -> YOLODetector:
    """Initialize global detector"""
    global _detector
    _detector = YOLODetector(config)
    return _detector


def get_detector() -> Optional[YOLODetector]:
    """Get global detector instance"""
    return _detector
