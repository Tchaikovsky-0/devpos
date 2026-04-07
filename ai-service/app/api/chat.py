"""
Chat API Routes
"""

from fastapi import APIRouter

from ..models.schemas import ChatRequest, ChatResponse
from ..services.chat_service import get_chat_service

router = APIRouter()


@router.post("/api/v1/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """AI chat completion"""
    service = get_chat_service()
    return await service.chat(request)
