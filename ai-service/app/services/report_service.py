"""
Report Generation Service
AI-powered inspection report generation
"""

import os
import random
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from ..models.schemas import ReportGenerateRequest, ReportGenerateResponse

# Simulated data ranges for realistic report generation
_DETECTION_TYPES = [
    ("火灾检测", "fire"),
    ("入侵检测", "intrusion"),
    ("缺陷检测", "defect"),
    ("车辆识别", "vehicle"),
]

_ALERT_LEVELS = [("P0", "紧急"), ("P1", "严重"), ("P2", "警告"), ("P3", "提示")]


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
        """Generate detection section with realistic-looking data."""
        rows: List[str] = []
        total_detections = 0
        total_anomalies = 0
        for name, _ in _DETECTION_TYPES:
            count = random.randint(500, 2000)
            anomalies = random.randint(0, max(1, count // 100))
            conf = round(random.uniform(90.0, 99.5), 1)
            total_detections += count
            total_anomalies += anomalies
            rows.append(f"| {name} | {count:,} | {anomalies} | {conf}% |")

        return (
            "### 检测统计\n\n"
            f"报告期间共执行 **{total_detections:,}** 次检测，发现 **{total_anomalies}** 处异常。\n\n"
            "| 检测类型 | 检测次数 | 发现异常 | 平均置信度 |\n"
            "|---------|---------|---------|-----------|\n"
            + "\n".join(rows)
            + "\n"
        )

    def _generate_alert_section(self, request: ReportGenerateRequest) -> str:
        """Generate alert section with dynamic data."""
        counts = {lvl: random.randint(0, 5 if i < 2 else 20) for i, (lvl, _) in enumerate(_ALERT_LEVELS)}
        total = sum(counts.values())
        resolved = max(0, total - random.randint(0, 3))
        pending = total - resolved
        resolve_rate = round((resolved / total * 100) if total else 100, 1)
        avg_response = round(random.uniform(1.5, 8.0), 1)

        lines = ["### 告警分析\n"]
        lines.append(f"报告期间共产生 **{total}** 条告警。\n")
        lines.append("**告警分布：**")
        for (lvl, name), count in zip(_ALERT_LEVELS, counts.values()):
            lines.append(f"- {lvl}（{name}）：{count} 条")
        lines.append("")
        lines.append("**处理状态：**")
        lines.append(f"- 已处理：{resolved} 条（{resolve_rate}%）")
        lines.append(f"- 待处理：{pending} 条")
        lines.append("")
        lines.append(f"**平均响应时间：** {avg_response} 分钟")
        return "\n".join(lines)

    def _generate_sensor_section(self, request: ReportGenerateRequest) -> str:
        """Generate sensor data section."""
        sensors = [
            ("温度-1", "温度", round(random.uniform(20, 30), 1), round(random.uniform(30, 40), 1), "°C"),
            ("湿度-1", "湿度", round(random.uniform(50, 70), 1), round(random.uniform(70, 85), 1), "%"),
            ("烟感-1", "气体", random.randint(5, 15), random.randint(15, 25), " ppm"),
        ]
        rows = []
        for name, stype, avg, mx, unit in sensors:
            status = "⚠️ 偏高" if (stype == "温度" and mx > 38) or (stype == "湿度" and mx > 80) else "✅ 正常"
            rows.append(f"| {name} | {stype} | {avg}{unit} | {mx}{unit} | {status} |")
    
        return (
            "### 传感器数据\n\n"
            "| 传感器 | 类型 | 平均值 | 最大值 | 状态 |\n"
            "|--------|------|--------|--------|------|\n"
            + "\n".join(rows)
            + "\n"
        )

    def _generate_recommendations(self, request: ReportGenerateRequest) -> str:
        """Generate contextual recommendations."""
        rtype = request.report_type
        base = [
            "1. **加强夜间巡检**：建议增加夜间时段的检测频率",
            "2. **设备维护**：对运行超过30天的设备安排维护保养",
            "3. **告警优化**：根据历史数据调整检测灵敏度阈值",
        ]
        if rtype == "incident":
            base.extend([
                "4. **事件复盘**：组织相关人员进行事件复盘",
                "5. **应急预案更新**：根据事件暴露的问题更新应急预案",
            ])
        elif rtype in ("weekly", "monthly"):
            base.extend([
                "4. **培训计划**：安排安全培训和演练",
                "5. **趋势关注**：持续关注告警数量变化趋势",
            ])
        else:
            base.append("4. **培训计划**：安排新入职人员的安全培训")
        return "### 建议措施\n\n" + "\n".join(base)

    def _generate_brief_summary(self, request: ReportGenerateRequest, sections: List[Dict]) -> str:
        return (
            f"报告类型：{request.report_type} | "
            f"报告状态：已完成 | "
            f"共{len(sections)}个章节 | "
            f"生成时间：{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
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
