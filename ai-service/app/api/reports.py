"""
Report Generation API Routes
"""

from fastapi import APIRouter

from ..models.schemas import ReportGenerateRequest, ReportGenerateResponse
from ..services.report_service import get_report_service

router = APIRouter()


@router.post("/api/v1/reports/generate", response_model=ReportGenerateResponse)
async def generate_report(request: ReportGenerateRequest):
    """Generate AI-powered inspection report"""
    service = get_report_service()
    return await service.generate_report(request)
