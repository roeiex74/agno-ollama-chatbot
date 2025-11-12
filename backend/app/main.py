"""FastAPI application for Agno + Ollama chatbot.

This module provides:
- GET /healthz - Health check endpoint
- POST /chat - Non-streaming chat endpoint
- POST /chat/stream - Server-sent events (SSE) streaming chat endpoint
- GET /conversations - List all conversations
- GET /conversations/{conversation_id} - Get conversation by ID
- DELETE /conversations/{conversation_id} - Delete conversation
- PATCH /conversations/{conversation_id}/title - Update conversation title
"""

import json
from contextlib import asynccontextmanager
from typing import AsyncIterator, List, Optional

from agno.db.base import SessionType
from agno.db.postgres import PostgresDb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.chatbot_agent import ChatbotAgent
from app.config import settings


# Global agent instances
chatbot_agent: Optional[ChatbotAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    global chatbot_agent

    # Startup: Initialize PostgreSQL database and agents
    db = PostgresDb(db_url=settings.postgres_url)

    chatbot_agent = ChatbotAgent(db=db)

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
    database: str = Field(..., description="Database type")


class ConversationSummary(BaseModel):
    """Conversation summary for list endpoint."""

    conversation_id: str = Field(..., description="Conversation ID")
    title: Optional[str] = Field(None, description="Conversation title")
    message_count: int = Field(..., description="Number of messages")
    created_at: Optional[str] = Field(None, description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")


class ConversationDetail(BaseModel):
    """Detailed conversation with full history."""

    conversation_id: str = Field(..., description="Conversation ID")
    title: Optional[str] = Field(None, description="Conversation title")
    messages: List[dict] = Field(..., description="Conversation messages")
    created_at: Optional[str] = Field(None, description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")


class UpdateTitleRequest(BaseModel):
    """Request to update conversation title."""

    title: str = Field(..., description="New conversation title")


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
        database="postgresql",
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


@app.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations() -> List[ConversationSummary]:
    """List all conversations.

    Returns:
        List of conversation summaries with metadata

    Raises:
        HTTPException: If agent is not initialized or error occurs
    """
    if chatbot_agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        # Get all agent sessions from database
        sessions = chatbot_agent.db.get_sessions(session_type=SessionType.AGENT)

        # Convert to conversation summaries
        summaries = []
        for session in sessions:
            # Get chat history from session
            chat_history = session.get_chat_history()

            # Count only user and assistant messages (exclude system)
            message_count = 0
            if chat_history:
                for msg in chat_history:
                    role = None
                    if hasattr(msg, 'role'):
                        role = msg.role
                    elif isinstance(msg, dict):
                        role = msg.get("role")

                    if role in ["user", "assistant"]:
                        message_count += 1

            # Get title from session_data if available, or use first user message
            title = "New Chat"
            if session.session_data and isinstance(session.session_data, dict):
                title = session.session_data.get("name", title)

            # If no custom title, use first user message
            if title == "New Chat" and chat_history and len(chat_history) > 0:
                for msg in chat_history:
                    msg_role = None
                    msg_content = None
                    if hasattr(msg, 'role'):
                        msg_role = msg.role
                        msg_content = getattr(msg, 'content', "")
                    elif isinstance(msg, dict):
                        msg_role = msg.get("role")
                        msg_content = msg.get("content", "")

                    if msg_role == "user" and msg_content:
                        title = msg_content[:50] + ("..." if len(msg_content) > 50 else "")
                        break

            # Convert timestamps (epoch integers) to ISO format strings
            created_at_str = None
            if session.created_at:
                from datetime import datetime
                created_at_str = datetime.fromtimestamp(session.created_at).isoformat()

            updated_at_str = None
            if session.updated_at:
                from datetime import datetime
                updated_at_str = datetime.fromtimestamp(session.updated_at).isoformat()

            summaries.append(
                ConversationSummary(
                    conversation_id=session.session_id,
                    title=title,
                    message_count=message_count,
                    created_at=created_at_str,
                    updated_at=updated_at_str,
                )
            )

        # Sort by updated_at in descending order (newest first)
        summaries.sort(
            key=lambda x: x.updated_at if x.updated_at else "",
            reverse=True
        )

        return summaries
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error listing conversations: {str(e)}"
        )


@app.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str) -> ConversationDetail:
    """Get conversation by ID with full message history.

    Args:
        conversation_id: Conversation ID to retrieve

    Returns:
        Detailed conversation with all messages

    Raises:
        HTTPException: If agent is not initialized, conversation not found, or error occurs
    """
    if chatbot_agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        # Read session from database
        session = chatbot_agent.db.get_session(
            session_id=conversation_id,
            session_type=SessionType.AGENT
        )

        if session is None:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get chat history from session
        chat_history = session.get_chat_history()

        # Convert Message objects to dictionaries and filter out system messages
        messages = []
        if chat_history:
            for msg in chat_history:
                msg_dict = None
                if hasattr(msg, 'to_dict'):
                    msg_dict = msg.to_dict()
                elif hasattr(msg, 'role') and hasattr(msg, 'content'):
                    # Convert Message object to dict manually
                    msg_dict = {
                        "role": msg.role,
                        "content": msg.content
                    }
                elif isinstance(msg, dict):
                    msg_dict = msg

                # Only include user and assistant messages, skip system messages
                if msg_dict and msg_dict.get("role") in ["user", "assistant"]:
                    messages.append(msg_dict)

        # Get title from session_data or use first message
        title = "New Chat"
        if session.session_data and isinstance(session.session_data, dict):
            title = session.session_data.get("name", title)

        if title == "New Chat" and messages and len(messages) > 0:
            first_message = messages[0]
            if isinstance(first_message, dict) and first_message.get("role") == "user":
                content = first_message.get("content", "")
                title = content[:50] + ("..." if len(content) > 50 else "")

        # Convert timestamps (epoch integers) to ISO format strings
        from datetime import datetime
        created_at_str = None
        if session.created_at:
            created_at_str = datetime.fromtimestamp(session.created_at).isoformat()

        updated_at_str = None
        if session.updated_at:
            updated_at_str = datetime.fromtimestamp(session.updated_at).isoformat()

        return ConversationDetail(
            conversation_id=session.session_id,
            title=title,
            messages=messages,
            created_at=created_at_str,
            updated_at=updated_at_str,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving conversation: {str(e)}"
        )


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str) -> dict:
    """Delete conversation by ID.

    Args:
        conversation_id: Conversation ID to delete

    Returns:
        Success confirmation

    Raises:
        HTTPException: If agent is not initialized or error occurs
    """
    if chatbot_agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        # Delete session from database
        chatbot_agent.db.delete_session(conversation_id)

        return {"status": "success", "conversation_id": conversation_id}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting conversation: {str(e)}"
        )


@app.patch("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str, request: UpdateTitleRequest
) -> dict:
    """Update conversation title.

    Args:
        conversation_id: Conversation ID to update
        request: New title

    Returns:
        Success confirmation with updated title

    Raises:
        HTTPException: If agent is not initialized, conversation not found, or error occurs
    """
    if chatbot_agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        # Get the session
        session = chatbot_agent.db.get_session(
            session_id=conversation_id,
            session_type=SessionType.AGENT
        )

        if session is None:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Update session_data with the new name
        if session.session_data is None:
            session.session_data = {}

        session.session_data["name"] = request.title

        # Upsert the session back to the database
        chatbot_agent.db.upsert_session(session)

        return {
            "status": "success",
            "conversation_id": conversation_id,
            "title": request.title,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating conversation title: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=not settings.is_prod,
    )
