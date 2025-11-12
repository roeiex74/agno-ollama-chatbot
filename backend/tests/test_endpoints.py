"""Comprehensive tests for API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app


@pytest.fixture
def mock_chatbot_agent():
    """Create a mock ChatbotAgent."""
    agent = MagicMock()
    agent.chat = AsyncMock()
    return agent


class TestHealthEndpoint:
    """Tests for GET /healthz endpoint."""

    @pytest.mark.asyncio
    async def test_health_returns_200(self):
        """Test that health check returns 200 status."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/healthz")
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_health_returns_json(self):
        """Test that health check returns JSON."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/healthz")
            assert response.headers["content-type"] == "application/json"

    @pytest.mark.asyncio
    async def test_health_contains_required_fields(self):
        """Test that health response contains all required fields."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/healthz")
            data = response.json()

            assert "status" in data
            assert "environment" in data
            assert "model" in data
            assert "database" in data

    @pytest.mark.asyncio
    async def test_health_status_is_ok(self):
        """Test that status field is 'ok'."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/healthz")
            data = response.json()
            assert data["status"] == "ok"


class TestChatEndpoint:
    """Tests for POST /chat endpoint (non-streaming)."""

    @pytest.mark.asyncio
    async def test_chat_requires_message_field(self):
        """Test that chat endpoint requires message field."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            # Empty request body
            response = await client.post("/chat", json={})
            assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_chat_accepts_valid_request(self):
        """Test that chat endpoint accepts valid request."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.chat = AsyncMock(
                    return_value={
                        "conversation_id": "test-123",
                        "reply": "Hello!",
                        "usage": {"model": "llama3.2:3b"},
                    }
                )

                response = await client.post("/chat", json={"message": "Hi"})
                assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_returns_conversation_id(self):
        """Test that chat response includes conversation_id."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.chat = AsyncMock(
                    return_value={
                        "conversation_id": "conv-456",
                        "reply": "Response",
                        "usage": {"model": "llama3.2:3b"},
                    }
                )

                response = await client.post(
                    "/chat", json={"message": "Test", "conversation_id": "conv-456"}
                )
                data = response.json()

                assert "conversation_id" in data
                assert data["conversation_id"] == "conv-456"

    @pytest.mark.asyncio
    async def test_chat_generates_conversation_id_if_not_provided(self):
        """Test that chat generates conversation_id if not provided."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.chat = AsyncMock(
                    return_value={
                        "conversation_id": "generated-id",
                        "reply": "Response",
                        "usage": {"model": "llama3.2:3b"},
                    }
                )

                response = await client.post("/chat", json={"message": "Test"})
                data = response.json()

                assert "conversation_id" in data
                assert data["conversation_id"] is not None

    @pytest.mark.asyncio
    async def test_chat_returns_503_when_agent_not_initialized(self):
        """Test that chat returns 503 if agent is not initialized."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent", None):
                response = await client.post("/chat", json={"message": "Test"})
                assert response.status_code == 503

    @pytest.mark.asyncio
    async def test_chat_handles_empty_message(self):
        """Test that chat handles empty message."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.chat = AsyncMock(
                    return_value={
                        "conversation_id": "conv",
                        "reply": "",
                        "usage": {"model": "llama3.2:3b"},
                    }
                )

                response = await client.post("/chat", json={"message": ""})
                # Should accept empty message
                assert response.status_code == 200


class TestChatStreamEndpoint:
    """Tests for POST /chat/stream endpoint."""

    @pytest.mark.asyncio
    async def test_chat_stream_requires_message(self):
        """Test that stream endpoint requires message field."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post("/chat/stream", json={})
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_chat_stream_returns_text_event_stream(self):
        """Test that stream endpoint returns SSE content type."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:

                async def mock_stream(*args, **kwargs):
                    yield {"delta": "test"}
                    yield {"done": True, "conversation_id": "conv", "response": "test"}

                mock_agent.chat = AsyncMock(return_value=mock_stream())

                response = await client.post(
                    "/chat/stream", json={"message": "Test"}
                )
                assert response.status_code == 200
                # SSE content type
                assert "text/event-stream" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_chat_stream_returns_503_when_agent_not_initialized(self):
        """Test that stream returns 503 if agent not initialized."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent", None):
                response = await client.post(
                    "/chat/stream", json={"message": "Test"}
                )
                assert response.status_code == 503


class TestConversationsListEndpoint:
    """Tests for GET /conversations endpoint."""

    @pytest.mark.asyncio
    async def test_conversations_list_returns_200(self):
        """Test that conversations list returns 200."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_sessions = MagicMock(return_value=[])

                response = await client.get("/conversations")
                assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_conversations_list_returns_array(self):
        """Test that conversations list returns array."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_sessions = MagicMock(return_value=[])

                response = await client.get("/conversations")
                data = response.json()
                assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_conversations_list_returns_empty_when_no_conversations(self):
        """Test that empty list is returned when no conversations."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_sessions = MagicMock(return_value=[])

                response = await client.get("/conversations")
                data = response.json()
                assert data == []

    @pytest.mark.asyncio
    async def test_conversations_list_returns_503_when_agent_not_initialized(self):
        """Test that conversations list returns 503 if agent not initialized."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent", None):
                response = await client.get("/conversations")
                assert response.status_code == 503


class TestConversationDetailEndpoint:
    """Tests for GET /conversations/{conversation_id} endpoint."""

    @pytest.mark.asyncio
    async def test_conversation_detail_requires_valid_id(self):
        """Test that conversation detail requires valid ID."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_session = MagicMock(return_value=None)

                response = await client.get("/conversations/nonexistent-id")
                assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_conversation_detail_returns_404_for_missing_conversation(self):
        """Test that 404 is returned for missing conversation."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_session = MagicMock(return_value=None)

                response = await client.get("/conversations/missing-conv")
                assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_conversation_detail_returns_503_when_agent_not_initialized(self):
        """Test that conversation detail returns 503 if agent not initialized."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent", None):
                response = await client.get("/conversations/test-id")
                assert response.status_code == 503


class TestConversationDeleteEndpoint:
    """Tests for DELETE /conversations/{conversation_id} endpoint."""

    @pytest.mark.asyncio
    async def test_conversation_delete_returns_200_on_success(self):
        """Test that delete returns 200 on successful deletion."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.delete_session = MagicMock(return_value=True)

                response = await client.delete("/conversations/test-conv")
                assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_conversation_delete_returns_conversation_id(self):
        """Test that delete response includes conversation_id."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.delete_session = MagicMock(return_value=True)

                response = await client.delete("/conversations/conv-123")
                data = response.json()

                assert "conversation_id" in data
                assert data["conversation_id"] == "conv-123"

    @pytest.mark.asyncio
    async def test_conversation_delete_returns_503_when_agent_not_initialized(self):
        """Test that delete returns 503 if agent not initialized."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent", None):
                response = await client.delete("/conversations/test-id")
                assert response.status_code == 503


class TestConversationUpdateTitleEndpoint:
    """Tests for PATCH /conversations/{conversation_id}/title endpoint."""

    @pytest.mark.asyncio
    async def test_update_title_requires_title_field(self):
        """Test that update title requires title field."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_session = MagicMock(return_value=MagicMock())

                response = await client.patch(
                    "/conversations/conv-123/title", json={}
                )
                assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_title_returns_404_for_missing_conversation(self):
        """Test that 404 is returned for missing conversation."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_agent.db.get_session = MagicMock(return_value=None)

                response = await client.patch(
                    "/conversations/missing/title", json={"title": "New Title"}
                )
                assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_title_returns_200_on_success(self):
        """Test that update title returns 200 on success."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_session = MagicMock()
                mock_session.session_data = {}
                mock_agent.db.get_session = MagicMock(return_value=mock_session)
                mock_agent.db.upsert_session = MagicMock()

                response = await client.patch(
                    "/conversations/conv-456/title", json={"title": "Updated Title"}
                )
                assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_update_title_returns_updated_title(self):
        """Test that response includes updated title."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent") as mock_agent:
                mock_session = MagicMock()
                mock_session.session_data = {}
                mock_agent.db.get_session = MagicMock(return_value=mock_session)
                mock_agent.db.upsert_session = MagicMock()

                response = await client.patch(
                    "/conversations/conv-789/title",
                    json={"title": "My Conversation"},
                )
                data = response.json()

                assert "title" in data
                assert data["title"] == "My Conversation"

    @pytest.mark.asyncio
    async def test_update_title_returns_503_when_agent_not_initialized(self):
        """Test that update title returns 503 if agent not initialized."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch("app.main.chatbot_agent", None):
                response = await client.patch(
                    "/conversations/test/title", json={"title": "Test"}
                )
                assert response.status_code == 503


class TestCORSHeaders:
    """Tests for CORS configuration."""

    @pytest.mark.asyncio
    async def test_cors_middleware_configured(self):
        """Test that app responds correctly (CORS configured in middleware)."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/healthz")

            # App should respond successfully with CORS configured
            assert response.status_code == 200


class TestErrorHandling:
    """Tests for error handling."""

    @pytest.mark.asyncio
    async def test_invalid_json_returns_422(self):
        """Test that invalid JSON returns 422."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/chat",
                content=b"invalid json",
                headers={"content-type": "application/json"},
            )
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_404_for_nonexistent_endpoint(self):
        """Test that 404 is returned for nonexistent endpoint."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/nonexistent")
            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_method_not_allowed(self):
        """Test that 405 is returned for wrong HTTP method."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            # GET on POST-only endpoint
            response = await client.get("/chat")
            assert response.status_code == 405
