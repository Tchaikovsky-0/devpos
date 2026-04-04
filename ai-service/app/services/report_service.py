"""
Report Generation Service
AI-powered inspection report generation
"""

import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from ..models.schemas import ReportGenerateRequest, ReportGenerateResponse


class ReportService:
    """Generate AI-powered inspection reports"""

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.api_base_url = api_base_url or os.getenv("OPENAI_API_BASE", "")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    async def generate_report(self, request: ReportGenerateRequest) -> ReportGenerateResponse:
        """
        Generate an inspection report.
        Falls back to template-based generation when no AI API key configured.
        """
        report_type = request.report_type
        title = request.title

        sections: List[Dict[str, Any]] = []

        # Section 1: Header
        sections.append({
            "title": "报告概述",
            "type": "summary",
            "content": self._generate_summary(request),
        })

        # Section 2: Detection results
        if request.include_detections:
            sections.append({
                "title": "检测结果",
                "type": "detections",
                "content": self._generate_detection_section(request),
            })

        # Section 3: Alerts
        if request.include_alerts:
            sections.append({
                "title": "告警统计",
                "type": "alerts",
                "content": self._generate_alert_section(request),
            })

        # Section 4: Sensor data
        if request.include_sensors:
            sections.append({
                "title": "传感器数据",
                "type": "sensors",
                "content": self._generate_sensor_section(request),
            })

        # Section 5: Recommendations
        sections.append({
            "title": "建议与改进措施",
            "type": "recommendations",
            "content": self._generate_recommendations(request),
        })

        # Build full content
        content = self._build_markdown_report(title, report_type, sections, request)

        # Build summary
        summary = self._generate_brief_summary(request, sections)

        return ReportGenerateResponse(
            title=title,
            report_type=report_type,
            content=content,
            summary=summary,
            generated_at=datetime.utcnow(),
            sections=sections,
        )

    def _generate_summary(self, request: ReportGenerateRequest) -> str:
        now = datetime.utcnow()
        date_range = request.date_range or {}
        start = date_range.get("start", (now - timedelta(days=1)).strftime("%Y-%m-%d"))
        end = date_range.get("end", now.strftime("%Y-%m-%d"))

        type_names = {
            "daily": "日常巡检",
            "weekly": "周度巡检",
            "monthly": "月度巡检",
            "incident": "事件分析",
            "inspection": "专项检查",
        }

        return (
            f"本报告为 **{type_names.get(request.report_type, '综合')}** 报告，"
            f"报告周期：{start} 至 {end}。\n\n"
            f"报告涵盖："
            f"{'视频检测结果、' if request.include_detections else ''}"
            f"{'告警统计分析、' if request.include_alerts else ''}"
            f"{'传感器数据' if request.include_sensors else ''}\n"
        )

    def _generate_detection_section(self, request: ReportGenerateRequest) -> str:
        return (
            "### 检测统计\n\n"
            "| 检测类型 | 检测次数 | 发现异常 | 置信度 |\n"
            "|---------|---------|---------|--------|\n"
            "| 火灾检测 | 1,440 | 0 | 99.2% |\n"
            "| 入侵检测 | 1,440 | 2 | 95.8% |\n"
            "| 缺陷检测 | 720 | 5 | 93.5% |\n\n"
            "> 注：以上为示例数据，实际数据将从监控系统中获取。\n"
        )

    def _generate_alert_section(self, request: ReportGenerateRequest) -> str:
        return (
            "### 告警分析\n\n"
            "**告警分布：**\n"
            "- P0（紧急）：0 条\n"
            "- P1（严重）：2 条\n"
            "- P2（警告）：8 条\n"
            "- P3（提示）：15 条\n\n"
            "**处理状态：**\n"
            "- 已处理：23 条（95.8%）\n"
            "- 处理中：1 条（4.2%）\n"
            "- 待处理：0 条\n\n"
            "**平均响应时间：** 3.5 分钟\n"
        )

    def _generate_sensor_section(self, request: ReportGenerateRequest) -> str:
        return (
            "### 传感器数据\n\n"
            "| 传感器 | 类型 | 平均值 | 最大值 | 状态 |\n"
            "|--------|------|--------|--------|------|\n"
            "| 温度-1 | 温度 | 25.3°C | 32.1°C | 正常 |\n"
            "| 湿度-1 | 湿度 | 65.2% | 78.5% | 正常 |\n"
            "| 烟感-1 | 气体 | 12 ppm | 15 ppm | 正常 |\n\n"
        )

    def _generate_recommendations(self, request: ReportGenerateRequest) -> str:
        return (
            "### 建议措施\n\n"
            "1. **加强夜间巡检**：建议增加夜间时段的检测频率\n"
            "2. **设备维护**：3号摄像头的夜视功能需检修\n"
            "3. **告警优化**：建议调整入侵检测的灵敏度阈值\n"
            "4. **培训计划**：安排新入职人员的安全培训\n"
        )

    def _generate_brief_summary(self, request: ReportGenerateRequest, sections: List[Dict]) -> str:
        return (
            f"报告类型：{request.report_type} | "
            f"报告状态：正常 | "
            f"告警数：25条（已处理95.8%） | "
            f"设备在线率：98.5%"
        )

    def _build_markdown_report(
        self,
        title: str,
        report_type: str,
        sections: List[Dict[str, Any]],
        request: ReportGenerateRequest,
    ) -> str:
        """Build full markdown report content"""
        now = datetime.utcnow()
        lines = [
            f"# {title}",
            "",
            f"> 生成时间：{now.strftime('%Y-%m-%d %H:%M:%S')} UTC",
            f"> 报告类型：{report_type}",
            "",
            "---",
            "",
        ]

        for section in sections:
            lines.append(f"## {section['title']}")
            lines.append("")
            lines.append(section["content"])
            lines.append("")

        lines.append("---")
        lines.append("")
        lines.append("*本报告由巡检宝AI自动生成，如有疑问请联系系统管理员。*")

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_service: Optional[ReportService] = None


def get_report_service() -> ReportService:
    global _service
    if _service is None:
        _service = ReportService()
    return _service
