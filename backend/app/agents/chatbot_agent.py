"""Chatbot agent using Agno with Ollama backend.

This agent integrates:
- Agno for agent orchestration
- Ollama for local LLM inference
- Memory management for conversation history
"""

import uuid
from typing import AsyncIterator, Dict, List, Optional

from agno.agent import Agent
from agno.models.ollama import Ollama

from app.config import settings
from app.memory.store import MemoryStore


class ChatbotAgent:
    """Agno-powered chatbot with streaming and memory support."""

    def __init__(self, memory_store: MemoryStore):
        """Initialize chatbot agent.

        Args:
            memory_store: Memory store for conversation history
        """
        self.memory_store = memory_store

        # Initialize Agno model
        self.model = Ollama(
            id=settings.ollama_model,
            host=settings.ollama_host,
        )

    async def chat(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        stream: bool = False,
    ) -> Dict | AsyncIterator[Dict]:
        """Process a chat message with optional streaming.

        Args:
            message: User message
            conversation_id: Optional conversation ID (generated if not provided)
            stream: Whether to stream the response

        Returns:
            Response dict with conversation_id, reply, and usage info
            Or async iterator of response chunks if streaming
        """
        # Generate conversation ID if not provided
        if conversation_id is None:
            conversation_id = str(uuid.uuid4())

        # Load conversation history
        history = self.memory_store.load(conversation_id)

        # Append user message to history
        self.memory_store.append(conversation_id, "user", message)

        # Truncate if needed
        self.memory_store.truncate(conversation_id, settings.max_history)

        # Build messages for agent
        messages = history + [{"role": "user", "content": message}]

        if stream:
            return self._chat_stream(conversation_id, messages)
        else:
            return await self._chat_complete(conversation_id, messages)

    async def _chat_complete(
        self, conversation_id: str, messages: List[Dict[str, str]]
    ) -> Dict:
        """Handle non-streaming chat completion."""
        agent = Agent(
            model=self.model,
            markdown=False,
            description="You are a helpful AI assistant powered by Agno and Ollama.",
        )

        # Get response from agent
        # Convert our message format to Agno's expected format
        user_message = messages[-1]["content"]

        # Run agent
        response = await agent.arun(input=user_message)

        # Extract reply
        reply = response.content if hasattr(response, "content") else str(response)

        # Store assistant response
        self.memory_store.append(conversation_id, "assistant", reply)

        return {
            "conversation_id": conversation_id,
            "reply": reply,
            "usage": {
                "model": settings.ollama_model,
                "messages": len(messages) + 1,
            },
        }

    async def _chat_stream(
        self, conversation_id: str, messages: List[Dict[str, str]]
    ) -> AsyncIterator[Dict]:
        """Handle streaming chat completion."""
        agent = Agent(
            model=self.model,
            markdown=False,
            description="You are a helpful AI assistant powered by Agno and Ollama.",
        )

        # Get user message
        user_message = messages[-1]["content"]

        # Stream response
        full_reply = ""
        async for chunk in agent.arun(input=user_message, stream=True):
            delta = chunk.content if hasattr(chunk, "content") else str(chunk)
            full_reply += delta

            # Yield delta chunk
            yield {"delta": delta}

        # Store complete assistant response
        self.memory_store.append(conversation_id, "assistant", full_reply)

        # Yield final chunk with metadata
        yield {
            "done": True,
            "conversation_id": conversation_id,
            "usage": {
                "model": settings.ollama_model,
                "messages": len(messages) + 1,
            },
        }

    async def cleanup(self):
        """Cleanup resources."""
        pass  # No resources to cleanup currently
