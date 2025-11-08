"""Ollama client wrapper for LLM interactions.

This module provides a simple wrapper around the Ollama Python client
with support for both streaming and non-streaming generation.
"""

from typing import AsyncIterator, Dict, List, Optional

import ollama
from ollama import AsyncClient


class OllamaClient:
    """Wrapper for Ollama client with streaming support."""

    def __init__(
        self,
        model: str,
        host: str = "http://localhost:11434",
        timeout: int = 60,
    ):
        """Initialize Ollama client.

        Args:
            model: Model name (e.g., 'llama3.2:3b')
            host: Ollama server host
            timeout: Request timeout in seconds
        """
        self.model = model
        self.host = host
        self.timeout = timeout
        self._client = AsyncClient(host=host, timeout=timeout)

    async def generate(
        self,
        messages: List[Dict[str, str]],
        stream: bool = False,
        **kwargs,
    ) -> str | AsyncIterator[str]:
        """Generate a response from Ollama.

        Args:
            messages: List of message dicts with 'role' and 'content'
            stream: Whether to stream the response
            **kwargs: Additional options for Ollama

        Returns:
            Full response text (if stream=False) or async iterator of text chunks
        """
        if stream:
            return self._generate_stream(messages, **kwargs)
        else:
            return await self._generate_complete(messages, **kwargs)

    async def _generate_complete(
        self,
        messages: List[Dict[str, str]],
        **kwargs,
    ) -> str:
        """Generate complete response (non-streaming)."""
        response = await self._client.chat(
            model=self.model,
            messages=messages,
            stream=False,
            **kwargs,
        )
        return response["message"]["content"]

    async def _generate_stream(
        self,
        messages: List[Dict[str, str]],
        **kwargs,
    ) -> AsyncIterator[str]:
        """Generate streaming response."""
        async for chunk in await self._client.chat(
            model=self.model,
            messages=messages,
            stream=True,
            **kwargs,
        ):
            if "message" in chunk and "content" in chunk["message"]:
                content = chunk["message"]["content"]
                if content:
                    yield content

    async def check_model_available(self) -> bool:
        """Check if the configured model is available.

        Returns:
            True if model is available, False otherwise
        """
        try:
            models = await self._client.list()
            model_names = [m["name"] for m in models.get("models", [])]
            return self.model in model_names
        except Exception:
            return False
