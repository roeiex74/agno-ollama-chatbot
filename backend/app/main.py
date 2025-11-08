"""FastAPI application for Agno + Ollama chatbot.

This module provides:
- GET /healthz - Health check endpoint
- POST /chat - Non-streaming chat endpoint
- POST /chat/stream - Server-sent events (SSE) streaming chat endpoint
"""

import json
from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.chatbot_agent import ChatbotAgent
from app.config import settings
from app.memory.store import InMemoryStore, SQLiteStore


# Global agent instance
chatbot_agent: Optional[ChatbotAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    global chatbot_agent

    # Startup: Initialize memory store and agent
    if settings.memory_backend.value == "sqlite":
        memory_store = SQLiteStore(db_path=str(settings.memory_path_resolved))
    else:
        memory_store = InMemoryStore()

    chatbot_agent = ChatbotAgent(memory_store=memory_store)

    yield

    # Shutdown: Cleanup resources
    if chatbot_agent:
        await chatbot_agent.cleanup()


# FastAPI app
app = FastAPI(
    title="Agno + Ollama Chatbot",
    description="Production-ready chatbot with streaming and memory",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware with sane defaults
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not settings.is_prod else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class ChatRequest(BaseModel):
    """Chat request body."""

    message: str = Field(..., description="User message")
    conversation_id: Optional[str] = Field(
        None, description="Optional conversation ID (generated if not provided)"
    )


class ChatResponse(BaseModel):
    """Non-streaming chat response."""

    conversation_id: str = Field(..., description="Conversation ID")
    reply: str = Field(..., description="Assistant reply")
    usage: dict = Field(..., description="Usage statistics")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    environment: str = Field(..., description="Environment (local/prod)")
    model: str = Field(..., description="Configured Ollama model")
    memory_backend: str = Field(..., description="Memory backend type")


# Endpoints
@app.get("/healthz", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint.

    Returns:
        Service status and configuration info
    """
    return HealthResponse(
        status="ok",
        environment=settings.env.value,
        model=settings.ollama_model,
        memory_backend=settings.memory_backend.value,
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Non-streaming chat endpoint.

    Args:
        request: Chat request with message and optional conversation_id

    Returns:
        Complete chat response with conversation_id and reply

    Raises:
        HTTPException: If agent is not initialized or error occurs
    """
    if chatbot_agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        response = await chatbot_agent.chat(
            message=request.message,
            conversation_id=request.conversation_id,
            stream=False,
        )
        return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    """Server-sent events (SSE) streaming chat endpoint.

    Args:
        request: Chat request with message and optional conversation_id

    Returns:
        StreamingResponse with SSE events

    Raises:
        HTTPException: If agent is not initialized or error occurs
    """
    if chatbot_agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    async def event_generator() -> AsyncIterator[str]:
        """Generate SSE events from agent stream."""
        try:
            response_stream = await chatbot_agent.chat(
                message=request.message,
                conversation_id=request.conversation_id,
                stream=True,
            )

            async for chunk in response_stream:
                # Format as SSE event
                data = json.dumps(chunk)
                yield f"data: {data}\n\n"

        except Exception as e:
            # Send error as SSE event
            error_data = json.dumps({"error": str(e), "done": True})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )




if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=not settings.is_prod,
    )
