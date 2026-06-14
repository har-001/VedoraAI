"""
VedoraAI — AI Coach API
Chat endpoint powered by Google Gemini.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ai.coach.engine import coach_engine

router = APIRouter(prefix="/coach", tags=["AI Coach"])


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    history: list[ChatMessage] = Field(default=[], description="Conversation history")


@router.post("/chat")
async def chat_with_coach(request: ChatRequest):
    """
    Chat with VedoraAI's AI Coach.
    Send a message and get an intelligent response about markets and investing.
    """
    # Convert history to dict format for the engine
    history_dicts = [
        {"role": msg.role, "content": msg.content}
        for msg in request.history
    ]

    result = await coach_engine.chat(
        message=request.message,
        history=history_dicts,
    )

    return {
        "response": result["response"],
        "source": result.get("source", "unknown"),
        "model": result.get("model", "unknown"),
    }
