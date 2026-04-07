"""
YOLO Service - WebSocket Manager
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from .models import DetectionMessage, StreamConfig, StreamStatus
from .detector import get_detector


class ConnectionManager:
    """Manages WebSocket connections for YOLO detections"""

    def __init__(self):
        # Active connections by stream_id
        self.connections: Dict[str, Set[WebSocket]] = {}
        # Stream configurations
        self.streams: Dict[str, StreamConfig] = {}
        # Stream statuses
        self.stream_statuses: Dict[str, StreamStatus] = {}

    async def connect(self, websocket: WebSocket, stream_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()

        if stream_id not in self.connections:
            self.connections[stream_id] = set()
            self.streams[stream_id] = StreamConfig(stream_id=stream_id)

        self.connections[stream_id].add(websocket)

        # Update status
        self.stream_statuses[stream_id] = StreamStatus(
            stream_id=stream_id,
            status="active",
            last_frame=datetime.utcnow()
        )

        print(f"[WS] Client connected to stream {stream_id}, total: {len(self.connections[stream_id])}")

    async def disconnect(self, websocket: WebSocket, stream_id: str):
        """Handle client disconnect"""
        if stream_id in self.connections:
            self.connections[stream_id].discard(websocket)
            if not self.connections[stream_id]:
                del self.connections[stream_id]
                if stream_id in self.streams:
                    del self.streams[stream_id]
                if stream_id in self.stream_statuses:
                    del self.stream_statuses[stream_id]

        print(f"[WS] Client disconnected from stream {stream_id}")

    async def broadcast(self, stream_id: str, message: DetectionMessage):
        """Broadcast detection results to all clients watching a stream"""
        if stream_id not in self.connections:
            return

        # Update status
        if stream_id in self.stream_statuses:
            self.stream_statuses[stream_id].last_frame = datetime.utcnow()

        # Serialize message
        msg_dict = {
            "type": message.type,
            "stream_id": message.stream_id,
            "timestamp": message.timestamp.isoformat(),
            "detections": [
                {
                    "class": d.class_name,
                    "confidence": d.confidence,
                    "bbox": [d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2]
                }
                for d in message.detections
            ]
        }
        msg_json = json.dumps(msg_dict)

        # Send to all connected clients
        disconnected = set()
        for websocket in self.connections[stream_id]:
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_text(msg_json)
                else:
                    disconnected.add(websocket)
            except Exception as e:
                print(f"[WS] Send error: {e}")
                disconnected.add(websocket)

        # Clean up disconnected clients
        for ws in disconnected:
            self.connections[stream_id].discard(ws)

    def get_stream_ids(self) -> list:
        """Get list of active stream IDs"""
        return list(self.connections.keys())

    def get_status(self, stream_id: str) -> Optional[StreamStatus]:
        """Get status of a stream"""
        return self.stream_statuses.get(stream_id)

    def get_all_statuses(self) -> Dict[str, StreamStatus]:
        """Get all stream statuses"""
        return self.stream_statuses


class StreamProcessor:
    """Processes video streams for YOLO detection"""

    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.processors: Dict[str, asyncio.Task] = {}
        self.running = False

    async def start_stream(self, stream_id: str, config: StreamConfig):
        """Start processing a video stream"""
        if stream_id in self.processors:
            print(f"[Processor] Stream {stream_id} already running")
            return

        self.manager.streams[stream_id] = config
        self.processors[stream_id] = asyncio.create_task(self._process_loop(stream_id))
        print(f"[Processor] Started processing stream {stream_id}")

    async def stop_stream(self, stream_id: str):
        """Stop processing a video stream"""
        if stream_id in self.processors:
            self.processors[stream_id].cancel()
            del self.processors[stream_id]
            print(f"[Processor] Stopped processing stream {stream_id}")

    async def _process_loop(self, stream_id: str):
        """Main processing loop for a stream"""
        import cv2

        config = self.manager.streams.get(stream_id)
        if not config or not config.rtsp_url:
            print(f"[Processor] No RTSP URL for stream {stream_id}")
            return

        detector = get_detector()
        if not detector:
            print(f"[Processor] No detector available")
            return

        cap = cv2.VideoCapture(config.rtsp_url)

        if not cap.isOpened():
            print(f"[Processor] Failed to open stream {stream_id}: {config.rtsp_url}")
            self.manager.stream_statuses[stream_id] = StreamStatus(
                stream_id=stream_id,
                status="error",
                error="Failed to open stream"
            )
            return

        self.manager.stream_statuses[stream_id] = StreamStatus(
            stream_id=stream_id,
            status="active",
            last_frame=datetime.utcnow()
        )

        fps_time = time.time()
        frame_count = 0
        fps = 0

        try:
            while self.manager.streams.get(stream_id, StreamConfig(stream_id=stream_id)).enabled:
                ret, frame = cap.read()
                if not ret:
                    # Reconnect on stream end
                    print(f"[Processor] Stream {stream_id} ended, reconnecting...")
                    cap.release()
                    await asyncio.sleep(1)
                    cap = cv2.VideoCapture(config.rtsp_url)
                    if not cap.isOpened():
                        break
                    continue

                # FPS calculation
                frame_count += 1
                if time.time() - fps_time >= 1.0:
                    fps = frame_count
                    frame_count = 0
                    fps_time = time.time()
                    self.manager.stream_statuses[stream_id].fps = fps

                # Run detection
                detections, _ = detector.detect(frame)

                # Broadcast results
                if detections:
                    msg = DetectionMessage(
                        stream_id=stream_id,
                        timestamp=datetime.utcnow(),
                        detections=detections,
                        frame_width=frame.shape[1],
                        frame_height=frame.shape[0]
                    )
                    await self.manager.broadcast(stream_id, msg)

                # Small delay to prevent overwhelming
                await asyncio.sleep(0.01)

        except asyncio.CancelledError:
            print(f"[Processor] Stream {stream_id} cancelled")
        except Exception as e:
            print(f"[Processor] Stream {stream_id} error: {e}")
            self.manager.stream_statuses[stream_id] = StreamStatus(
                stream_id=stream_id,
                status="error",
                error=str(e)
            )
        finally:
            cap.release()

    async def stop_all(self):
        """Stop all stream processors"""
        for stream_id in list(self.processors.keys()):
            await self.stop_stream(stream_id)


# Global instances
manager = ConnectionManager()
processor = StreamProcessor(manager)
