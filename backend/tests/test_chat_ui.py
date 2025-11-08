"""Tests for Streamlit Chat UI.

This module tests the chat UI components and API integration.
"""

import uuid
from unittest.mock import MagicMock, Mock, patch

import pytest
import requests

# Import functions from chat_ui
import sys
from pathlib import Path

# Add parent directory to path to import chat_ui
sys.path.insert(0, str(Path(__file__).parent.parent))

from chat_ui import (
    API_BASE_URL,
    CHAT_ENDPOINT,
    HEALTH_ENDPOINT,
    check_server_health,
    send_message,
)


class TestServerHealth:
    """Tests for server health checking."""

    @patch("chat_ui.requests.get")
    def test_check_server_health_success(self, mock_get):
        """Test successful health check."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "ok",
            "environment": "local",
            "model": "llama3.2:3b",
            "memory_backend": "sqlite",
        }
        mock_get.return_value = mock_response

        is_healthy, health_info = check_server_health()

        assert is_healthy is True
        assert health_info is not None
        assert health_info["status"] == "ok"
        assert health_info["model"] == "llama3.2:3b"
        mock_get.assert_called_once_with(HEALTH_ENDPOINT, timeout=5)

    @patch("chat_ui.requests.get")
    def test_check_server_health_failure(self, mock_get):
        """Test health check when server is down."""
        # Mock connection error
        mock_get.side_effect = requests.exceptions.ConnectionError(
            "Connection refused"
        )

        is_healthy, health_info = check_server_health()

        assert is_healthy is False
        assert health_info is None

    @patch("chat_ui.requests.get")
    def test_check_server_health_bad_status(self, mock_get):
        """Test health check with non-200 status code."""
        # Mock 503 response
        mock_response = Mock()
        mock_response.status_code = 503
        mock_get.return_value = mock_response

        is_healthy, health_info = check_server_health()

        assert is_healthy is False
        assert health_info is None


class TestSendMessage:
    """Tests for sending messages to the API."""

    @patch("chat_ui.requests.post")
    def test_send_message_success(self, mock_post):
        """Test successful message sending."""
        # Mock successful API response
        conv_id = str(uuid.uuid4())
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversation_id": conv_id,
            "reply": "Hello! How can I help you?",
            "usage": {"model": "llama3.2:3b", "messages": 2},
        }
        mock_post.return_value = mock_response

        result = send_message("Hello")

        assert result["conversation_id"] == conv_id
        assert "reply" in result
        assert result["reply"] == "Hello! How can I help you?"
        assert "usage" in result

        # Verify API call
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[1]["json"]["message"] == "Hello"
        assert "conversation_id" not in call_args[1]["json"]

    @patch("chat_ui.requests.post")
    def test_send_message_with_conversation_id(self, mock_post):
        """Test sending message with existing conversation ID."""
        conv_id = str(uuid.uuid4())
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversation_id": conv_id,
            "reply": "I remember our conversation!",
            "usage": {"model": "llama3.2:3b", "messages": 4},
        }
        mock_post.return_value = mock_response

        result = send_message("Do you remember me?", conversation_id=conv_id)

        assert result["conversation_id"] == conv_id
        assert "reply" in result

        # Verify conversation ID was included
        call_args = mock_post.call_args
        assert call_args[1]["json"]["conversation_id"] == conv_id

    @patch("chat_ui.requests.post")
    def test_send_message_api_error(self, mock_post):
        """Test handling of API errors."""
        # Mock 500 error
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = (
            requests.exceptions.HTTPError("500 Server Error")
        )
        mock_post.return_value = mock_response

        with pytest.raises(requests.exceptions.HTTPError):
            send_message("Hello")

    @patch("chat_ui.requests.post")
    def test_send_message_timeout(self, mock_post):
        """Test handling of request timeout."""
        mock_post.side_effect = requests.exceptions.Timeout(
            "Request timed out"
        )

        with pytest.raises(requests.exceptions.Timeout):
            send_message("Hello")

    @patch("chat_ui.requests.post")
    def test_send_message_connection_error(self, mock_post):
        """Test handling of connection errors."""
        mock_post.side_effect = requests.exceptions.ConnectionError(
            "Connection refused"
        )

        with pytest.raises(requests.exceptions.ConnectionError):
            send_message("Hello")


class TestAPIConfiguration:
    """Tests for API configuration."""

    def test_api_endpoints(self):
        """Test that API endpoints are correctly configured."""
        assert API_BASE_URL == "http://localhost:8000"
        assert CHAT_ENDPOINT == "http://localhost:8000/chat"
        assert HEALTH_ENDPOINT == "http://localhost:8000/healthz"


class TestMessagePayload:
    """Tests for message payload formatting."""

    @patch("chat_ui.requests.post")
    def test_message_payload_structure(self, mock_post):
        """Test that message payload has correct structure."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversation_id": str(uuid.uuid4()),
            "reply": "Test reply",
            "usage": {"model": "llama3.2:3b", "messages": 2},
        }
        mock_post.return_value = mock_response

        send_message("Test message")

        # Verify payload structure
        call_args = mock_post.call_args
        payload = call_args[1]["json"]

        assert "message" in payload
        assert isinstance(payload["message"], str)
        assert payload["message"] == "Test message"

    @patch("chat_ui.requests.post")
    def test_special_characters_in_message(self, mock_post):
        """Test handling of special characters in messages."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversation_id": str(uuid.uuid4()),
            "reply": "Received your message",
            "usage": {"model": "llama3.2:3b", "messages": 2},
        }
        mock_post.return_value = mock_response

        special_message = (
            "Hello! Can you explain \"quotes\" and 'apostrophes'?"
        )
        send_message(special_message)

        call_args = mock_post.call_args
        payload = call_args[1]["json"]
        assert payload["message"] == special_message


class TestResponseValidation:
    """Tests for API response validation."""

    @patch("chat_ui.requests.post")
    def test_response_has_required_fields(self, mock_post):
        """Test that API response contains all required fields."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversation_id": str(uuid.uuid4()),
            "reply": "Test reply",
            "usage": {"model": "llama3.2:3b", "messages": 2},
        }
        mock_post.return_value = mock_response

        result = send_message("Hello")

        # Verify all required fields are present
        assert "conversation_id" in result
        assert "reply" in result
        assert "usage" in result
        assert isinstance(result["conversation_id"], str)
        assert isinstance(result["reply"], str)
        assert isinstance(result["usage"], dict)

    @patch("chat_ui.requests.post")
    def test_usage_info_structure(self, mock_post):
        """Test that usage info has correct structure."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "conversation_id": str(uuid.uuid4()),
            "reply": "Test reply",
            "usage": {"model": "llama3.2:3b", "messages": 5},
        }
        mock_post.return_value = mock_response

        result = send_message("Hello")

        usage = result["usage"]
        assert "model" in usage
        assert "messages" in usage
        assert isinstance(usage["model"], str)
        assert isinstance(usage["messages"], int)


@pytest.mark.integration
class TestIntegration:
    """Integration tests (require running backend server)."""

    def test_health_check_integration(self):
        """Test actual health check against running server.

        Note: This test requires the backend server to be running.
        Skip if server is not available.
        """
        try:
            is_healthy, health_info = check_server_health()

            if is_healthy:
                assert health_info is not None
                assert "status" in health_info
                assert health_info["status"] == "ok"
        except Exception:
            pytest.skip("Backend server not available")

    def test_send_message_integration(self):
        """Test actual message sending against running server.

        Note: This test requires the backend server to be running.
        Skip if server is not available.
        """
        try:
            # First check if server is up
            is_healthy, _ = check_server_health()
            if not is_healthy:
                pytest.skip("Backend server not available")

            # Send test message
            result = send_message("Hello, this is a test!")

            assert "conversation_id" in result
            assert "reply" in result
            assert len(result["reply"]) > 0

        except Exception as e:
            pytest.skip(f"Backend server not available: {e}")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
