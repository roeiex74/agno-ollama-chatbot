"""Title generation agent using Agno with Ollama backend.

This agent generates concise conversation titles from user messages.
"""

import asyncio
from typing import Optional

from agno.agent import Agent
from agno.models.ollama import Ollama

from app.config import settings


class TitleAgent:
    """Agno-powered title generator for conversations."""

    def __init__(self):
        """Initialize title generation agent."""
        # Initialize Agno model (reuse chat model configuration)
        self.model = Ollama(
            id=settings.ollama_model,
            host=settings.ollama_host,
        )

    async def generate_title(self, message: str) -> str:
        """Generate a concise title from a user message.

        Args:
            message: The user's first message in the conversation

        Returns:
            Generated title (approximately 20 characters)
            Falls back to truncated message if generation fails
        """
        # Fallback: truncate message to 20 characters
        fallback_title = message[:20].strip()
        if len(message) > 20:
            fallback_title += "..."

        try:
            # Create agent with specific system prompt for title generation
            agent = Agent(
                model=self.model,
                markdown=False,
                description=(
                    "You are a title generator. Given a user message, generate a concise, "
                    "descriptive title of approximately 20 characters. "
                    "Return ONLY the title text, nothing else. "
                    "Do not use quotes or punctuation at the end unless necessary."
                ),
            )

            # Run with timeout
            response = await asyncio.wait_for(
                agent.arun(input=f"Generate a title for: {message}"),
                timeout=settings.title_timeout_s,
            )

            # Extract title from response
            title = response.content if hasattr(response, "content") else str(response)
            title = title.strip().strip('"').strip("'")  # Remove quotes if present

            # Validate title length and content
            if title and len(title) > 0:
                # If title is too long, truncate it
                if len(title) > 50:
                    title = title[:47] + "..."
                return title
            else:
                # Empty title, use fallback
                return fallback_title

        except asyncio.TimeoutError:
            # Timeout occurred, use fallback
            print(f"Title generation timed out after {settings.title_timeout_s}s, using fallback")
            return fallback_title
        except Exception as e:
            # Any other error, use fallback
            print(f"Title generation error: {e}, using fallback")
            return fallback_title

    async def cleanup(self):
        """Cleanup resources."""
        pass  # No resources to cleanup
