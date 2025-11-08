"""Tests for streaming chat endpoint."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


async def mock_stream_generator():
    """Mock async generator for streaming responses."""
    yield {"delta": "Hello"}
    yield {"delta": " "}
    yield {"delta": "there!"}
    yield {
        "done": True,
        "conversation_id": "test-stream-123",
        "usage": {"model": "llama3.2:3b", "messages": 2},
    }


@pytest.mark.asyncio
async def test_chat_stream_endpoint():
    """Test POST /chat/stream with SSE streaming."""
    with patch("app.main.chatbot_agent") as mock_agent:
        mock_agent.chat = AsyncMock(return_value=mock_stream_generator())

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/chat/stream", json={"message": "Hello", "conversation_id": "test-123"}
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
        assert response.headers["cache-control"] == "no-cache"

        # Verify chat was called with stream=True
        mock_agent.chat.assert_called_once()
        call_kwargs = mock_agent.chat.call_args.kwargs
        assert call_kwargs["stream"] is True


@pytest.mark.asyncio
async def test_chat_stream_data_events():
    """Test SSE stream emits data: events with correct format."""
    with patch("app.main.chatbot_agent") as mock_agent:
        mock_agent.chat = AsyncMock(return_value=mock_stream_generator())

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            async with client.stream(
                "POST", "/chat/stream", json={"message": "Hello"}
            ) as response:
                events = []
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        events.append(line)

                # Should have multiple data: events
                assert len(events) >= 2  # At least delta chunks + final done event

                # Last event should have done: true
                import json

                last_event_data = json.loads(events[-1].replace("data: ", ""))
                assert last_event_data.get("done") is True
                assert "conversation_id" in last_event_data
                assert "usage" in last_event_data


@pytest.mark.asyncio
async def test_chat_stream_invalid_request():
    """Test POST /chat/stream with invalid request."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/chat/stream", json={})

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_chat_stream_error_handling():
    """Test streaming endpoint handles errors gracefully."""

    async def error_generator():
        """Generator that raises an error."""
        yield {"delta": "Starting..."}
        raise Exception("Stream error")

    with patch("app.main.chatbot_agent") as mock_agent:
        mock_agent.chat = AsyncMock(return_value=error_generator())

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            async with client.stream(
                "POST", "/chat/stream", json={"message": "Hello"}
            ) as response:
                events = []
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        events.append(line)

                # Should receive at least one event (error event)
                assert len(events) > 0
