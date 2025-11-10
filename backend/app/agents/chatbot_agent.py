"""Chatbot agent using Agno with Ollama backend and PostgreSQL storage.

This agent integrates:
- Agno for agent orchestration with native PostgreSQL storage
- Ollama for local LLM inference
- Automatic conversation history management via Agno's db layer
"""

import uuid
from typing import AsyncIterator, Dict, Optional

from agno.agent import Agent
from agno.db.postgres import PostgresDb
from agno.models.ollama import Ollama

from app.config import settings


class ChatbotAgent:
    """Agno-powered chatbot with streaming and PostgreSQL memory support."""

    def __init__(self, db: PostgresDb):
        """Initialize chatbot agent.

        Args:
            db: PostgresDb instance for conversation storage
        """
        self.db = db

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

        if stream:
            return self._chat_stream(conversation_id, message)
        else:
            return await self._chat_complete(conversation_id, message)

    async def _chat_complete(self, conversation_id: str, message: str) -> Dict:
        """Handle non-streaming chat completion."""
        # Create agent with PostgreSQL storage
        # Agno automatically loads history when session_id is provided
        agent = Agent(
            model=self.model,
            db=self.db,
            session_id=conversation_id,
            add_history_to_context=True,
            num_history_runs=settings.max_history,
            markdown=False,
            description="You are a helpful AI assistant powered by Agno and Ollama.",
        )

        # Run agent - Agno handles history loading and saving automatically
        response = await agent.arun(input=message)

        # Extract reply
        reply = response.content if hasattr(response, "content") else str(response)

        return {
            "conversation_id": conversation_id,
            "reply": reply,
            "usage": {
                "model": settings.ollama_model,
            },
        }

    async def _chat_stream(
        self, conversation_id: str, message: str
    ) -> AsyncIterator[Dict]:
        """Handle streaming chat completion."""
        # Create agent with PostgreSQL storage
        agent = Agent(
            model=self.model,
            db=self.db,
            session_id=conversation_id,
            add_history_to_context=True,
            num_history_runs=settings.max_history,
            markdown=False,
            description="You are a helpful AI assistant powered by Agno and Ollama.",
        )

        # Stream response - Agno automatically saves to DB after completion
        full_reply = ""
        async for chunk in agent.arun(input=message, stream=True):
            delta = chunk.content if hasattr(chunk, "content") else str(chunk)
            full_reply += delta

            # Yield delta chunk
            yield {"delta": delta}

        # Yield final chunk with metadata
        yield {
            "done": True,
            "conversation_id": conversation_id,
            "response": full_reply,
            "usage": {
                "model": settings.ollama_model,
            },
        }

    async def cleanup(self):
        """Cleanup resources."""
        pass  # No resources to cleanup - PostgresDb handles connections
