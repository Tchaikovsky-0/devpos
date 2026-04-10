"""
Chat Service
Provides AI chat capabilities via OpenAI-compatible API or OpenClaw.
Includes session management, streaming, and context-aware responses.
"""

import asyncio
import json
import os
import time
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx

from ..models.schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    SessionDetail,
    SessionSummary,
)

# ---------------------------------------------------------------------------
# Session storage (in-memory)
# ---------------------------------------------------------------------------

_SESSION_STORE: Dict[str, Dict[str, Any]] = {}

SYSTEM_PROMPT = (
    "你是巡检宝AI助手，一个专业的工业智能监控分析助手。\n"
    "你的主要职责包括：\n"
    "1. 分析监控画面中的异常情况（火灾、入侵、设备缺陷等）\n"
    "2. 生成巡检报告（日报、周报、月报、事件报告）\n"
    "3. 诊断设备故障并给出处理建议\n"
    "4. 分析告警根因并提供应急措施\n"
    "5. 解答工业安全和设备管理问题\n\n"
    "回答时请使用中文，保持专业和准确。"
    "如果用户的问题涉及当前上下文（如正在查看的页面、设备、告警），请结合上下文给出更有针对性的回答。"
)

CONTEXT_TEMPLATES: Dict[str, str] = {
    "alerts": "用户当前正在查看告警管理页面。{extra}",
    "dashboard": "用户当前正在数据大屏页面。{extra}",
    "video": "用户当前正在查看视频监控画面。{extra}",
    "media": "用户当前正在媒体库页面。{extra}",
    "device": "用户当前正在查看设备详情。{extra}",
}


class ChatService:
    """AI Chat service with session management and streaming"""

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openclaw_url: Optional[str] = None,
        openclaw_token: Optional[str] = None,
    ):
        self.api_base_url = (
            api_base_url
            or os.getenv("OPENAI_BASE_URL", os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1"))
        ).rstrip("/")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model or os.getenv("OPENAI_MODEL", "qwen-plus")

        # OpenClaw config
        self.openclaw_url = (
            openclaw_url or os.getenv("OPENCLAW_URL", "http://localhost:8096")
        ).rstrip("/")
        self.openclaw_token = openclaw_token or os.getenv("OPENCLAW_TOKEN", "")
        self.openclaw_available: Optional[bool] = None

        self._client: Optional[httpx.AsyncClient] = None
        self._claw_client: Optional[httpx.AsyncClient] = None

    # ------------------------------------------------------------------
    # HTTP clients
    # ------------------------------------------------------------------

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers: Dict[str, str] = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            self._client = httpx.AsyncClient(
                base_url=self.api_base_url,
                headers=headers,
                timeout=60.0,
            )
        return self._client

    async def _get_claw_client(self) -> httpx.AsyncClient:
        if self._claw_client is None or self._claw_client.is_closed:
            headers: Dict[str, str] = {}
            if self.openclaw_token:
                headers["Authorization"] = f"Bearer {self.openclaw_token}"
            self._claw_client = httpx.AsyncClient(
                base_url=self.openclaw_url,
                headers=headers,
                timeout=60.0,
            )
        return self._claw_client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        if self._claw_client and not self._claw_client.is_closed:
            await self._claw_client.aclose()

    # ------------------------------------------------------------------
    # OpenClaw health
    # ------------------------------------------------------------------

    async def _check_openclaw(self) -> bool:
        """Check if OpenClaw service is reachable."""
        if self.openclaw_available is not None:
            return self.openclaw_available
        try:
            client = await self._get_claw_client()
            resp = await client.get("/health", timeout=3.0)
            self.openclaw_available = resp.status_code == 200
        except Exception:
            self.openclaw_available = False
        return self.openclaw_available

    # ------------------------------------------------------------------
    # Session helpers
    # ------------------------------------------------------------------

    def _get_or_create_session(self, session_id: Optional[str]) -> str:
        if session_id and session_id in _SESSION_STORE:
            return session_id
        new_id = session_id or f"sess_{uuid.uuid4().hex[:12]}"
        _SESSION_STORE[new_id] = {
            "id": new_id,
            "title": "",
            "messages": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        return new_id

    def _add_message(self, session_id: str, role: str, content: str) -> None:
        session = _SESSION_STORE.get(session_id)
        if not session:
            return
        session["messages"].append({"role": role, "content": content})
        session["updated_at"] = datetime.utcnow().isoformat()
        # Auto-title from first user message
        if not session["title"] and role == "user":
            session["title"] = content[:50] + ("..." if len(content) > 50 else "")

    def _build_context_message(self, context: Optional[Dict[str, Any]]) -> Optional[str]:
        if not context:
            return None
        page = context.get("page", "")
        extra_parts: List[str] = []
        if context.get("entity_type") and context.get("entity_id"):
            extra_parts.append(f"当前正在查看的{context['entity_type']}ID为{context['entity_id']}。")
        if context.get("alert_id"):
            extra_parts.append(f"关联告警ID: {context['alert_id']}。")
        extra = " ".join(extra_parts)
        template = CONTEXT_TEMPLATES.get(page, "")
        if template:
            return template.format(extra=extra)
        if extra:
            return f"当前上下文信息：{extra}"
        return None

    # ------------------------------------------------------------------
    # Main chat
    # ------------------------------------------------------------------

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Send chat completion request with session tracking."""
        sid = self._get_or_create_session(request.session_id)

        # Build messages payload
        messages_payload: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add context
        ctx_msg = self._build_context_message(request.context)
        if ctx_msg:
            messages_payload.append({"role": "system", "content": ctx_msg})

        # Add session history (last 20 messages)
        session = _SESSION_STORE.get(sid)
        if session:
            for m in session["messages"][-20:]:
                messages_payload.append({"role": m["role"], "content": m["content"]})

        # Add current user messages
        for m in request.messages:
            messages_payload.append({"role": m.role, "content": m.content})
            if m.role == "user":
                self._add_message(sid, "user", m.content)

        # Try OpenClaw -> External API -> Rule-based fallback
        response = await self._try_openclaw_chat(messages_payload)
        if response is None and self.api_key:
            response = await self._call_external_api(messages_payload, request.model)
        if response is None:
            response = self._rule_based_response(request)

        # Store assistant reply in session
        self._add_message(sid, "assistant", response.message.content)
        response.session_id = sid
        response.suggestions = self._generate_suggestions(request)

        return response

    async def chat_stream(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """SSE streaming chat response."""
        sid = self._get_or_create_session(request.session_id)

        # Build messages
        messages_payload: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        ctx_msg = self._build_context_message(request.context)
        if ctx_msg:
            messages_payload.append({"role": "system", "content": ctx_msg})
        session = _SESSION_STORE.get(sid)
        if session:
            for m in session["messages"][-20:]:
                messages_payload.append({"role": m["role"], "content": m["content"]})
        for m in request.messages:
            messages_payload.append({"role": m.role, "content": m.content})
            if m.role == "user":
                self._add_message(sid, "user", m.content)

        # Send session_id first
        yield json.dumps({"type": "session", "session_id": sid})

        # Try streaming from OpenClaw or external API
        streamed = False
        full_content = ""

        # Try OpenClaw stream
        if await self._check_openclaw():
            try:
                client = await self._get_claw_client()
                async with client.stream(
                    "POST",
                    "/v1/chat/completions",
                    json={"messages": messages_payload, "stream": True},
                    timeout=60.0,
                ) as resp:
                    if resp.status_code == 200:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(data)
                                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        full_content += content
                                        yield json.dumps({"type": "content", "content": content})
                                except json.JSONDecodeError:
                                    pass
                        streamed = True
            except Exception:
                pass

        # Fallback: simulate streaming from rule-based response
        if not streamed:
            response = self._rule_based_response(request)
            full_content = response.message.content
            # Stream char-by-char in chunks for effect
            chunk_size = 8
            for i in range(0, len(full_content), chunk_size):
                chunk = full_content[i : i + chunk_size]
                yield json.dumps({"type": "content", "content": chunk})
                await asyncio.sleep(0.03)

        # Store assistant reply
        self._add_message(sid, "assistant", full_content)
        suggestions = self._generate_suggestions(request)
        yield json.dumps({"type": "done", "suggestions": suggestions})

    # ------------------------------------------------------------------
    # OpenClaw integration
    # ------------------------------------------------------------------

    async def _try_openclaw_chat(
        self, messages: List[Dict[str, str]]
    ) -> Optional[ChatResponse]:
        if not await self._check_openclaw():
            return None
        try:
            client = await self._get_claw_client()
            resp = await client.post(
                "/v1/chat/completions",
                json={"messages": messages, "model": "openclaw"},
            )
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]["message"]
            return ChatResponse(
                message=ChatMessage(role=choice["role"], content=choice["content"]),
                model=data.get("model", "openclaw"),
                usage=data.get("usage"),
            )
        except Exception:
            self.openclaw_available = False
            return None

    # ------------------------------------------------------------------
    # External API
    # ------------------------------------------------------------------

    async def _call_external_api(
        self, messages: List[Dict[str, str]], model: Optional[str] = None
    ) -> Optional[ChatResponse]:
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
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Rule-based fallback
    # ------------------------------------------------------------------

    def _rule_based_response(self, request: ChatRequest) -> ChatResponse:
        last_message = request.messages[-1].content if request.messages else ""
        last_lower = last_message.lower()

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
        elif any(kw in last_lower for kw in ["设备", "device", "equipment", "故障", "诊断"]):
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
        elif any(kw in last_lower for kw in ["告警", "alert", "警报"]):
            content = (
                "## 告警分析助手\n\n"
                "我可以帮您：\n"
                "1. **分析告警根因** - 找出告警的根本原因\n"
                "2. **告警趋势** - 分析告警数量变化趋势\n"
                "3. **处理建议** - 根据告警类型提供处理建议\n"
                "4. **告警统计** - 汇总告警分布和处理情况\n\n"
                "请告诉我您需要分析哪个告警，或者需要什么类型的统计。"
            )
        elif any(kw in last_lower for kw in ["/analyze", "/分析"]):
            content = (
                "## 智能分析模式\n\n"
                "已切换到分析模式。请提供需要分析的数据或告警ID，我将为您进行深度分析。\n\n"
                "支持的分析类型：\n"
                "- 告警根因分析\n"
                "- 设备故障诊断\n"
                "- 环境数据趋势\n"
                "- 视频异常检测"
            )
        elif any(kw in last_lower for kw in ["/report", "/报告"]):
            content = (
                "## 报告生成模式\n\n"
                "请指定报告参数：\n"
                "- **类型**: 日报 / 周报 / 月报 / 事件报告\n"
                "- **时间范围**: 默认为今天\n"
                "- **包含内容**: 检测结果、告警统计、传感器数据\n\n"
                "例如: \"生成本周的巡检周报\""
            )
        elif any(kw in last_lower for kw in ["/diagnose", "/诊断"]):
            content = (
                "## 设备诊断模式\n\n"
                "请提供设备ID或名称，我将进行诊断分析。\n\n"
                "诊断包含：\n"
                "- 设备当前状态检查\n"
                "- 历史故障记录\n"
                "- 潜在风险评估\n"
                "- 维护建议"
            )
        else:
            content = (
                "您好！我是巡检宝AI助手。\n\n"
                "我可以帮您：\n"
                "- 🔥 分析监控画面中的异常情况\n"
                "- 📋 生成巡检报告\n"
                "- ⚙️ 诊断设备故障\n"
                "- 🔔 分析告警并提供处理建议\n\n"
                "**快捷命令**：\n"
                "- `/analyze` — 智能分析模式\n"
                "- `/report` — 生成报告\n"
                "- `/diagnose` — 设备诊断\n\n"
                "请告诉我您需要什么帮助？"
            )

        return ChatResponse(
            message=ChatMessage(role="assistant", content=content),
            model="rule-based",
        )

    # ------------------------------------------------------------------
    # Suggestions
    # ------------------------------------------------------------------

    def _generate_suggestions(self, request: ChatRequest) -> List[str]:
        ctx = request.context or {}
        page = ctx.get("page", "")
        if page == "alerts":
            return ["分析这个告警的根因", "查看告警趋势", "生成告警统计报告"]
        if page == "dashboard":
            return ["分析当前监控状况", "生成今日巡检报告", "查看设备状态汇总"]
        if page == "video":
            return ["分析当前画面", "检测异常物体", "查看历史检测记录"]
        return ["查看今日告警汇总", "生成巡检报告", "诊断设备状态"]

    # ------------------------------------------------------------------
    # Session management
    # ------------------------------------------------------------------

    async def get_sessions(self) -> List[SessionSummary]:
        result: List[SessionSummary] = []
        for sid, session in _SESSION_STORE.items():
            msgs = session["messages"]
            last_msg = msgs[-1]["content"] if msgs else ""
            result.append(
                SessionSummary(
                    id=sid,
                    title=session.get("title", "新对话"),
                    last_message=last_msg[:100],
                    message_count=len(msgs),
                    created_at=session["created_at"],
                    updated_at=session["updated_at"],
                )
            )
        result.sort(key=lambda s: s.updated_at, reverse=True)
        return result

    async def get_session(self, session_id: str) -> Optional[SessionDetail]:
        session = _SESSION_STORE.get(session_id)
        if not session:
            return None
        msgs = [
            ChatMessage(role=m["role"], content=m["content"])
            for m in session["messages"]
        ]
        return SessionDetail(
            id=session_id,
            title=session.get("title", "新对话"),
            messages=msgs,
            message_count=len(msgs),
            created_at=session["created_at"],
            updated_at=session["updated_at"],
        )

    async def delete_session(self, session_id: str) -> bool:
        if session_id in _SESSION_STORE:
            del _SESSION_STORE[session_id]
            return True
        return False


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    global _service
    if _service is None:
        _service = ChatService()
    return _service
