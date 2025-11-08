"""Tests for non-streaming chat endpoint."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_chat_endpoint_success():
    """Test POST /chat with valid request."""
    # Mock the agent's chat method
    with patch("app.main.chatbot_agent") as mock_agent:
        mock_agent.chat = AsyncMock(
            return_value={
                "conversation_id": "test-123",
                "reply": "Hello! How can I help you?",
                "usage": {"model": "llama3.2:3b", "messages": 2},
            }
        )

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/chat", json={"message": "Hello", "conversation_id": "test-123"}
            )

        assert response.status_code == 200

        data = response.json()
        assert data["conversation_id"] == "test-123"
        assert "reply" in data
        assert "usage" in data
        assert data["usage"]["model"] == "llama3.2:3b"

        # Verify chat was called with correct parameters
        mock_agent.chat.assert_called_once()
        call_kwargs = mock_agent.chat.call_args.kwargs
        assert call_kwargs["message"] == "Hello"
        assert call_kwargs["conversation_id"] == "test-123"
        assert call_kwargs["stream"] is False


@pytest.mark.asyncio
async def test_chat_without_conversation_id():
    """Test POST /chat generates conversation_id if not provided."""
    with patch("app.main.chatbot_agent") as mock_agent:
        mock_agent.chat = AsyncMock(
            return_value={
                "conversation_id": "generated-uuid",
                "reply": "Hello!",
                "usage": {"model": "llama3.2:3b", "messages": 1},
            }
        )

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post("/chat", json={"message": "Hello"})

        assert response.status_code == 200

        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"] is not None


@pytest.mark.asyncio
async def test_chat_invalid_request():
    """Test POST /chat with missing message field."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/chat", json={})

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_chat_agent_error():
    """Test POST /chat handles agent errors gracefully."""
    with patch("app.main.chatbot_agent") as mock_agent:
        mock_agent.chat = AsyncMock(side_effect=Exception("Ollama connection failed"))

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post("/chat", json={"message": "Hello"})

        assert response.status_code == 500
        assert "error" in response.json()["detail"].lower()
