"""
Analysis Service
Provides AI-powered analysis of detection data, alerts, and sensor readings
"""

import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from ..models.schemas import AnalysisRequest, AnalysisResponse


class AnalysisService:
    """AI Analysis service for inspection data"""

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.api_base_url = (api_base_url or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")).rstrip("/")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    async def analyze(self, request: AnalysisRequest) -> AnalysisResponse:
        """
        Analyze data based on type.
        Falls back to rule-based analysis when no AI API key configured.
        """
        analysis_type = request.type
        data = request.data

        # Route to type-specific analysis
        handlers = {
            "fire": self._analyze_fire,
            "intrusion": self._analyze_intrusion,
            "defect": self._analyze_defect,
            "equipment": self._analyze_equipment,
            "environment": self._analyze_environment,
            "alert": self._analyze_alert,
        }

        handler = handlers.get(analysis_type, self._analyze_generic)
        return await handler(data, request.stream_id, request.tenant_id)

    async def _analyze_fire(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Fire detection analysis"""
        detections = data.get("detections", [])
        fire_objects = [d for d in detections if d.get("class", "").lower() in ("fire", "flame", "smoke")]

        if fire_objects:
            max_conf = max(d.get("confidence", 0) for d in fire_objects)
            severity = "critical" if max_conf > 0.8 else "warning"
            recommendations = [
                "立即通知现场安全负责人",
                "启动消防应急预案",
                "疏散危险区域人员",
                "启动自动灭火系统（如已安装）",
            ]
            return AnalysisResponse(
                type="fire",
                result={
                    "fire_detected": True,
                    "max_confidence": max_conf,
                    "object_count": len(fire_objects),
                    "stream_id": stream_id,
                },
                confidence=max_conf,
                recommendations=recommendations,
                severity=severity,
            )

        return AnalysisResponse(
            type="fire",
            result={"fire_detected": False, "status": "normal"},
            confidence=0.95,
            recommendations=["持续监控中，暂无异常"],
            severity="info",
        )

    async def _analyze_intrusion(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Intrusion detection analysis"""
        detections = data.get("detections", [])
        person_objects = [d for d in detections if d.get("class", "").lower() in ("person",)]

        if person_objects:
            max_conf = max(d.get("confidence", 0) for d in person_objects)
            severity = "warning" if max_conf > 0.7 else "info"
            return AnalysisResponse(
                type="intrusion",
                result={
                    "intrusion_detected": True,
                    "person_count": len(person_objects),
                    "max_confidence": max_conf,
                    "stream_id": stream_id,
                },
                confidence=max_conf,
                recommendations=[
                    "确认人员身份和授权状态",
                    "检查电子围栏配置",
                    "记录入侵事件",
                ],
                severity=severity,
            )

        return AnalysisResponse(
            type="intrusion",
            result={"intrusion_detected": False, "status": "normal"},
            confidence=0.95,
            severity="info",
        )

    async def _analyze_defect(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Defect detection analysis"""
        detections = data.get("detections", [])

        if detections:
            max_conf = max(d.get("confidence", 0) for d in detections)
            return AnalysisResponse(
                type="defect",
                result={
                    "defect_detected": True,
                    "defect_count": len(detections),
                    "max_confidence": max_conf,
                    "types": list(set(d.get("class", "unknown") for d in detections)),
                },
                confidence=max_conf,
                recommendations=[
                    "标记缺陷位置",
                    "评估缺陷严重程度",
                    "安排维修计划",
                    "更新设备维护记录",
                ],
                severity="warning",
            )

        return AnalysisResponse(
            type="defect",
            result={"defect_detected": False, "status": "normal"},
            confidence=0.95,
            severity="info",
        )

    async def _analyze_equipment(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Equipment status analysis"""
        status = data.get("status", "unknown")
        metrics = data.get("metrics", {})

        severity = "info"
        recommendations = []
        if status == "offline":
            severity = "warning"
            recommendations = ["检查设备网络连接", "确认设备供电状态", "尝试远程重启"]
        elif status == "error":
            severity = "critical"
            recommendations = ["立即排查设备故障", "联系设备供应商", "启用备用设备"]
        else:
            recommendations = ["设备运行正常", "按计划进行日常维护"]

        return AnalysisResponse(
            type="equipment",
            result={"status": status, "metrics": metrics},
            confidence=0.9,
            recommendations=recommendations,
            severity=severity,
        )

    async def _analyze_environment(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Environmental monitoring analysis"""
        temperature = data.get("temperature")
        humidity = data.get("humidity")
        gas_level = data.get("gas_level")

        alerts = []
        severity = "info"

        if temperature and temperature > 40:
            alerts.append(f"温度过高: {temperature}°C")
            severity = "warning"
        if humidity and humidity > 80:
            alerts.append(f"湿度过高: {humidity}%")
            severity = "warning" if severity == "info" else severity
        if gas_level and gas_level > 100:
            alerts.append(f"气体浓度超标: {gas_level}ppm")
            severity = "critical"

        return AnalysisResponse(
            type="environment",
            result={
                "alerts": alerts,
                "temperature": temperature,
                "humidity": humidity,
                "gas_level": gas_level,
            },
            confidence=0.9,
            recommendations=alerts if alerts else ["环境参数正常"],
            severity=severity,
        )

    async def _analyze_alert(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Alert analysis"""
        level = data.get("level", "info")
        alert_type = data.get("type", "unknown")
        description = data.get("description", "")

        severity_map = {"P0": "critical", "P1": "critical", "P2": "warning", "P3": "info"}
        severity = severity_map.get(level, "info")

        recommendations = {
            "fire": ["立即启动消防预案", "疏散人员", "通知消防部门"],
            "intrusion": ["确认入侵人员身份", "启动安全封锁", "通知安保团队"],
            "equipment_failure": ["排查故障原因", "启用备用设备", "通知维修团队"],
        }

        return AnalysisResponse(
            type="alert",
            result={
                "level": level,
                "alert_type": alert_type,
                "description": description,
                "needs_immediate_action": severity in ("critical", "warning"),
            },
            confidence=0.85,
            recommendations=recommendations.get(alert_type, ["记录告警", "安排排查"]),
            severity=severity,
        )

    async def _analyze_generic(self, data: Dict, stream_id: Optional[str], tenant_id: Optional[str]) -> AnalysisResponse:
        """Generic analysis fallback"""
        return AnalysisResponse(
            type="generic",
            result={"data": data, "status": "analyzed"},
            confidence=0.5,
            recommendations=["数据分析完成，建议人工复核"],
            severity="info",
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_service: Optional[AnalysisService] = None


def get_analysis_service() -> AnalysisService:
    global _service
    if _service is None:
        _service = AnalysisService()
    return _service
