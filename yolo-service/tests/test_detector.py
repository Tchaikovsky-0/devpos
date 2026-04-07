"""
YOLO Service - Detector Tests
"""

import pytest
import numpy as np
import cv2

from app.models import YOLOConfig
from app.detector import YOLODetector


@pytest.fixture
def config():
    """Test configuration"""
    return YOLOConfig(
        model_path="models/yolov8n.pt",
        confidence_threshold=0.5,
        device="cpu"
    )


@pytest.fixture
def detector(config):
    """Create detector instance"""
    try:
        return YOLODetector(config)
    except FileNotFoundError:
        pytest.skip("YOLO model not found")


@pytest.fixture
def sample_frame():
    """Create a sample test frame"""
    # Create a simple test image
    frame = np.zeros((640, 640, 3), dtype=np.uint8)
    # Draw a simple shape
    cv2.rectangle(frame, (100, 100), (300, 300), (255, 255, 255), -1)
    return frame


def test_detector_init(detector):
    """Test detector initialization"""
    assert detector is not None
    assert detector.model is not None


def test_detect_empty_frame(detector, sample_frame):
    """Test detection on empty-ish frame"""
    detections = detector.detect(sample_frame)
    # Empty frame might not have any detections, which is fine
    assert isinstance(detections, list)


def test_detect_returns_valid_format(detector, sample_frame):
    """Test that detection returns valid format"""
    detections = detector.detect(sample_frame)

    for det in detections:
        assert hasattr(det, 'class_name')
        assert hasattr(det, 'confidence')
        assert hasattr(det, 'bbox')

        # Check confidence range
        assert 0 <= det.confidence <= 1

        # Check bbox coordinates
        assert 0 <= det.bbox.x1 <= 1
        assert 0 <= det.bbox.y1 <= 1
        assert 0 <= det.bbox.x2 <= 1
        assert 0 <= det.bbox.y2 <= 1


def test_get_annotated_frame(detector, sample_frame):
    """Test frame annotation"""
    detections = detector.detect(sample_frame)
    annotated = detector.get_annotated_frame(sample_frame, detections)

    # Should return an image with same shape
    assert annotated.shape == sample_frame.shape


def test_detect_from_bytes(detector):
    """Test detection from image bytes"""
    # Create a simple test image
    frame = np.zeros((640, 640, 3), dtype=np.uint8)
    cv2.rectangle(frame, (100, 100), (300, 300), (255, 255, 255), -1)

    # Encode to bytes
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()

    detections = detector.detect_from_bytes(image_bytes)
    assert isinstance(detections, list)
