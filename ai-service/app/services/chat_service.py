"""
Chat Service
Provides AI chat capabilities via OpenAI-compatible API or OpenClaw
"""

import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from ..models.schemas import ChatMessage, ChatRequest, ChatResponse


class ChatService:
    """AI Chat service - proxies to OpenAI-compatible API or OpenClaw"""

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "gpt-3.5-turbo",
    ):
        self.api_base_url = (api_base_url or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")).rstrip("/")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            self._client = httpx.AsyncClient(
                base_url=self.api_base_url,
                headers=headers,
                timeout=60.0,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # Chat Completion
    # ------------------------------------------------------------------

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send chat completion request to the LLM backend.

        If no API key is configured, returns a rule-based response.
        """
        messages_payload = []
        for m in request.messages:
            messages_payload.append({"role": m.role, "content": m.content})

        # Add system prompt if not present
        has_system = any(m["role"] == "system" for m in messages_payload)
        if not has_system:
            system_msg = {
                "role": "system",
                "content": (
                    "你是巡检宝AI助手，一个专业的工业智能监控分析助手。"
                    "你可以帮助用户分析监控数据、生成巡检报告、解答设备和安全问题。"
                    "回答时请使用中文，保持专业和准确。"
                ),
            }
            messages_payload.insert(0, system_msg)

        # Add stream context if provided
        if request.context:
            ctx_msg = {
                "role": "system",
                "content": f"当前监控上下文信息：{request.context}",
            }
            messages_payload.append(ctx_msg)

        # Try external API first
        if self.api_key:
            return await self._call_external_api(messages_payload, request.model)

        # Fallback: rule-based responses for common queries
        return self._rule_based_response(request)

    async def _call_external_api(
        self, messages: List[dict], model: Optional[str] = None
    ) -> ChatResponse:
        """Call external OpenAI-compatible API"""
        client = await self._get_client()
        try:
            resp = await client.post(
                "/chat/completions",
                json={
                    "model": model or self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2000,
                },
            )
            resp.raise_for_status()
            data = resp.json()

            choice = data["choices"][0]["message"]
            return ChatResponse(
                message=ChatMessage(role=choice["role"], content=choice["content"]),
                model=data.get("model", self.model),
                usage=data.get("usage"),
            )
        except httpx.ConnectError:
            return ChatResponse(
                message=ChatMessage(
                    role="assistant",
                    content="抱歉，AI服务暂时不可用，请稍后再试。",
                ),
                model=self.model,
            )
        except Exception as e:
            return ChatResponse(
                message=ChatMessage(
                    role="assistant",
                    content=f"AI服务请求失败：{str(e)}",
                ),
                model=self.model,
            )

    def _rule_based_response(self, request: ChatRequest) -> ChatResponse:
        """Fallback rule-based response when no API key configured"""
        last_message = request.messages[-1].content if request.messages else ""
        last_lower = last_message.lower()

        # Pattern matching for common queries
        if any(kw in last_lower for kw in ["火", "fire", "flame"]):
            content = (
                "## 火灾检测分析\n\n"
                "当前系统状态：\n"
                "- YOLO火灾检测模型已就绪\n"
                "- 实时监控覆盖所有关键区域\n"
                "- 告警阈值：置信度 > 0.6\n\n"
                "**建议操作**：\n"
                "1. 检查火灾易发区域监控覆盖\n"
                "2. 确认告警通知链路畅通\n"
                "3. 定期测试火灾检测灵敏度"
            )
        elif any(kw in last_lower for kw in ["入侵", "intrusion", "人员"]):
            content = (
                "## 入侵检测分析\n\n"
                "当前系统状态：\n"
                "- 入侵检测模型运行正常\n"
                "- 电子围栏区域已配置\n"
                "- 夜间增强模式已启用\n\n"
                "**建议操作**：\n"
                "1. 检查围栏区域配置是否完整\n"
                "2. 确认夜间红外补光设备工作正常\n"
                "3. 核实告警推送联系人信息"
            )
        elif any(kw in last_lower for kw in ["报告", "report", "报表"]):
            content = (
                "## 报告生成助手\n\n"
                "我可以帮您生成以下类型的报告：\n"
                "1. **日常巡检报告** - 每日巡检汇总\n"
                "2. **周报/月报** - 趋势分析和统计\n"
                "3. **事件报告** - 单次事件的详细分析\n"
                "4. **设备状态报告** - 设备健康状态\n\n"
                "请告诉我您需要哪种类型的报告，以及报告的时间范围。"
            )
        elif any(kw in last_lower for kw in ["设备", "device", "equipment"]):
            content = (
                "## 设备状态分析\n\n"
                "当前设备概况：\n"
                "- 在线设备：正常监控中\n"
                "- 离线设备：需要排查网络或电源\n"
                "- 告警设备：请及时处理\n\n"
                "**建议操作**：\n"
                "1. 优先处理告警状态设备\n"
                "2. 排查离线设备的网络连接\n"
                "3. 制定设备定期巡检计划"
            )
        else:
            content = (
                f"您好！我是巡检宝AI助手。\n\n"
                f"我可以帮您：\n"
                f"- 分析监控画面中的异常情况\n"
                f"- 生成巡检报告\n"
                f"- 解答设备和安全管理问题\n"
                f"- 提供告警分析和处理建议\n\n"
                f"请告诉我您需要什么帮助？"
            )

        return ChatResponse(
            message=ChatMessage(role="assistant", content=content),
            model="rule-based",
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    global _service
    if _service is None:
        _service = ChatService()
    return _service
