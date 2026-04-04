"""
Analysis API Routes
"""

from fastapi import APIRouter

from ..models.schemas import AnalysisRequest, AnalysisResponse
from ..services.analysis_service import get_analysis_service

router = APIRouter()


@router.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    """AI-powered analysis"""
    service = get_analysis_service()
    return await service.analyze(request)
