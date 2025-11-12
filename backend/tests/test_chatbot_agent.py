"""Comprehensive tests for ChatbotAgent class."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.agents.chatbot_agent import ChatbotAgent


@pytest.fixture
def mock_db():
    """Create a mock PostgresDb instance."""
    db = MagicMock()
    db.get_session = MagicMock(return_value=None)
    db.upsert_session = MagicMock()
    return db


@pytest.fixture
def mock_model():
    """Create a mock Ollama model."""
    model = MagicMock()
    return model


@pytest.fixture
def chatbot_agent(mock_db):
    """Create a ChatbotAgent instance with mocked dependencies."""
    with patch("app.agents.chatbot_agent.Ollama") as mock_ollama:
        mock_ollama.return_value = MagicMock()
        agent = ChatbotAgent(db=mock_db)
        return agent


class TestChatbotAgentInitialization:
    """Tests for ChatbotAgent initialization."""

    def test_init_stores_db_reference(self, mock_db):
        """Test that agent stores database reference."""
        with patch("app.agents.chatbot_agent.Ollama"):
            agent = ChatbotAgent(db=mock_db)
            assert agent.db == mock_db

    def test_init_creates_ollama_model(self, mock_db):
        """Test that agent creates Ollama model with correct config."""
        with patch("app.agents.chatbot_agent.Ollama") as mock_ollama, patch(
            "app.agents.chatbot_agent.settings"
        ) as mock_settings:
            mock_settings.ollama_model = "llama3.2:3b"
            mock_settings.ollama_host = "http://localhost:11434"

            agent = ChatbotAgent(db=mock_db)

            mock_ollama.assert_called_once_with(
                id="llama3.2:3b",
                host="http://localhost:11434",
            )
            assert agent.model is not None


class TestChatNonStreaming:
    """Tests for non-streaming chat completion."""

    @pytest.mark.asyncio
    async def test_chat_generates_conversation_id_if_not_provided(
        self, chatbot_agent, mock_db
    ):
        """Test that chat generates UUID if conversation_id is None."""
        with patch.object(
            chatbot_agent, "_chat_complete", new_callable=AsyncMock
        ) as mock_complete:
            mock_complete.return_value = {
                "conversation_id": "test-123",
                "reply": "Hello!",
            }

            result = await chatbot_agent.chat(
                message="Hi", conversation_id=None, stream=False
            )

            # Verify _chat_complete was called with a conversation_id
            assert mock_complete.called
            call_args = mock_complete.call_args
            assert call_args[0][0] is not None  # conversation_id should be generated

    @pytest.mark.asyncio
    async def test_chat_uses_provided_conversation_id(self, chatbot_agent):
        """Test that chat uses provided conversation_id."""
        with patch.object(
            chatbot_agent, "_chat_complete", new_callable=AsyncMock
        ) as mock_complete:
            mock_complete.return_value = {
                "conversation_id": "my-conv-123",
                "reply": "Response",
            }

            result = await chatbot_agent.chat(
                message="Test", conversation_id="my-conv-123", stream=False
            )

            # Verify conversation_id was passed through
            mock_complete.assert_called_once_with("my-conv-123", "Test")
            assert result["conversation_id"] == "my-conv-123"

    @pytest.mark.asyncio
    async def test_chat_complete_creates_agent_with_correct_params(
        self, chatbot_agent, mock_db
    ):
        """Test that _chat_complete creates Agent with correct parameters."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class, patch(
            "app.agents.chatbot_agent.settings"
        ) as mock_settings:
            mock_settings.max_history = 20
            mock_agent = MagicMock()
            mock_agent.arun = AsyncMock(return_value=MagicMock(content="Response"))
            mock_agent_class.return_value = mock_agent

            result = await chatbot_agent._chat_complete("conv-123", "Test message")

            # Verify Agent was created with correct params
            mock_agent_class.assert_called_once()
            call_kwargs = mock_agent_class.call_args[1]
            assert call_kwargs["db"] == mock_db
            assert call_kwargs["session_id"] == "conv-123"
            assert call_kwargs["add_history_to_context"] is True
            assert call_kwargs["num_history_runs"] == 20
            assert call_kwargs["markdown"] is False

    @pytest.mark.asyncio
    async def test_chat_complete_returns_correct_structure(self, chatbot_agent):
        """Test that _chat_complete returns expected response structure."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class, patch(
            "app.agents.chatbot_agent.settings"
        ) as mock_settings:
            mock_settings.ollama_model = "llama3.2:3b"
            mock_agent = MagicMock()
            mock_agent.arun = AsyncMock(return_value=MagicMock(content="Test reply"))
            mock_agent_class.return_value = mock_agent

            result = await chatbot_agent._chat_complete("conv-456", "Hello")

            assert "conversation_id" in result
            assert result["conversation_id"] == "conv-456"
            assert "reply" in result
            assert result["reply"] == "Test reply"
            assert "usage" in result
            assert result["usage"]["model"] == "llama3.2:3b"

    @pytest.mark.asyncio
    async def test_chat_complete_handles_response_without_content_attr(
        self, chatbot_agent
    ):
        """Test that agent handles response that doesn't have content attribute."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class:
            mock_agent = MagicMock()
            # Return an object without content attribute
            mock_agent.arun = AsyncMock(return_value="Plain string response")
            mock_agent_class.return_value = mock_agent

            result = await chatbot_agent._chat_complete("conv-789", "Test")

            assert result["reply"] == "Plain string response"


class TestChatStreaming:
    """Tests for streaming chat completion."""

    @pytest.mark.asyncio
    async def test_chat_routes_to_stream_method(self, chatbot_agent):
        """Test that chat with stream=True routes to _chat_stream."""
        with patch.object(chatbot_agent, "_chat_stream") as mock_stream:
            mock_stream.return_value = iter([{"delta": "test"}])

            result = await chatbot_agent.chat(
                message="Hi", conversation_id="conv-123", stream=True
            )

            mock_stream.assert_called_once_with("conv-123", "Hi")

    @pytest.mark.asyncio
    async def test_chat_stream_yields_delta_chunks(self, chatbot_agent, mock_db):
        """Test that _chat_stream yields delta chunks during streaming."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class:
            mock_agent = MagicMock()

            # Mock streaming responses
            async def mock_stream(*args, **kwargs):
                chunks = [
                    MagicMock(content="Hello"),
                    MagicMock(content=" "),
                    MagicMock(content="world"),
                ]
                for chunk in chunks:
                    yield chunk

            mock_agent.arun = mock_stream
            mock_agent_class.return_value = mock_agent

            # Collect all chunks
            chunks = []
            async for chunk in chatbot_agent._chat_stream("conv-123", "Test"):
                chunks.append(chunk)

            # Should have 3 delta chunks + 1 done chunk
            assert len(chunks) == 4
            assert chunks[0] == {"delta": "Hello"}
            assert chunks[1] == {"delta": " "}
            assert chunks[2] == {"delta": "world"}
            assert chunks[3]["done"] is True
            assert chunks[3]["conversation_id"] == "conv-123"
            assert chunks[3]["response"] == "Hello world"

    @pytest.mark.asyncio
    async def test_chat_stream_final_chunk_has_metadata(self, chatbot_agent):
        """Test that final chunk contains done flag, conversation_id, and usage."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class, patch(
            "app.agents.chatbot_agent.settings"
        ) as mock_settings:
            mock_settings.ollama_model = "llama3.2:3b"
            mock_agent = MagicMock()

            async def mock_stream(*args, **kwargs):
                yield MagicMock(content="Test")

            mock_agent.arun = mock_stream
            mock_agent_class.return_value = mock_agent

            chunks = []
            async for chunk in chatbot_agent._chat_stream("conv-456", "Hi"):
                chunks.append(chunk)

            final_chunk = chunks[-1]
            assert final_chunk["done"] is True
            assert final_chunk["conversation_id"] == "conv-456"
            assert final_chunk["response"] == "Test"
            assert final_chunk["usage"]["model"] == "llama3.2:3b"

    @pytest.mark.asyncio
    async def test_chat_stream_accumulates_full_reply(self, chatbot_agent):
        """Test that stream accumulates full reply correctly."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class:
            mock_agent = MagicMock()

            async def mock_stream(*args, **kwargs):
                for word in ["The", " quick", " brown", " fox"]:
                    yield MagicMock(content=word)

            mock_agent.arun = mock_stream
            mock_agent_class.return_value = mock_agent

            chunks = []
            async for chunk in chatbot_agent._chat_stream("conv-789", "Test"):
                chunks.append(chunk)

            # Final chunk should have complete response
            assert chunks[-1]["response"] == "The quick brown fox"

    @pytest.mark.asyncio
    async def test_chat_stream_handles_chunk_without_content(self, chatbot_agent):
        """Test that stream handles chunks without content attribute."""
        with patch("app.agents.chatbot_agent.Agent") as mock_agent_class:
            mock_agent = MagicMock()

            async def mock_stream(*args, **kwargs):
                yield "plain string"

            mock_agent.arun = mock_stream
            mock_agent_class.return_value = mock_agent

            chunks = []
            async for chunk in chatbot_agent._chat_stream("conv-999", "Test"):
                chunks.append(chunk)

            # Should handle string content
            assert chunks[0]["delta"] == "plain string"


class TestCleanup:
    """Tests for cleanup method."""

    @pytest.mark.asyncio
    async def test_cleanup_does_not_raise(self, chatbot_agent):
        """Test that cleanup method executes without errors."""
        # Should not raise any exceptions
        await chatbot_agent.cleanup()

    @pytest.mark.asyncio
    async def test_cleanup_is_idempotent(self, chatbot_agent):
        """Test that cleanup can be called multiple times safely."""
        await chatbot_agent.cleanup()
        await chatbot_agent.cleanup()
        # Should not raise any exceptions


class TestEdgeCases:
    """Tests for edge cases and error conditions."""

    @pytest.mark.asyncio
    async def test_chat_with_empty_message(self, chatbot_agent):
        """Test chat with empty message."""
        with patch.object(
            chatbot_agent, "_chat_complete", new_callable=AsyncMock
        ) as mock_complete:
            mock_complete.return_value = {"conversation_id": "conv", "reply": ""}

            result = await chatbot_agent.chat(message="", stream=False)

            # Should still process empty message
            mock_complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_chat_with_very_long_message(self, chatbot_agent):
        """Test chat with very long message (>10000 chars)."""
        long_message = "a" * 15000

        with patch.object(
            chatbot_agent, "_chat_complete", new_callable=AsyncMock
        ) as mock_complete:
            mock_complete.return_value = {
                "conversation_id": "conv",
                "reply": "Response",
            }

            result = await chatbot_agent.chat(message=long_message, stream=False)

            # Should handle long messages
            call_args = mock_complete.call_args
            assert len(call_args[0][1]) == 15000

    @pytest.mark.asyncio
    async def test_chat_with_special_characters(self, chatbot_agent):
        """Test chat with special characters and unicode."""
        special_message = "Hello 👋 🌍 <script>alert('test')</script> 你好"

        with patch.object(
            chatbot_agent, "_chat_complete", new_callable=AsyncMock
        ) as mock_complete:
            mock_complete.return_value = {"conversation_id": "conv", "reply": "OK"}

            result = await chatbot_agent.chat(message=special_message, stream=False)

            # Should handle special characters
            mock_complete.assert_called_once()
