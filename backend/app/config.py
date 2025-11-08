"""Configuration management using pydantic-settings."""

from enum import Enum
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Environment types."""

    LOCAL = "local"
    PROD = "prod"


class MemoryBackend(str, Enum):
    """Memory backend types."""

    SQLITE = "sqlite"
    INMEMORY = "inmemory"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    env: Environment = Field(default=Environment.LOCAL, description="Environment type")

    # Ollama configuration
    ollama_model: str = Field(
        default="llama3.2:3b", description="Ollama model to use"
    )
    ollama_host: str = Field(
        default="http://localhost:11434", description="Ollama server host"
    )
    model_timeout_s: int = Field(
        default=60, description="Model request timeout in seconds"
    )

    # Memory configuration
    memory_backend: MemoryBackend = Field(
        default=MemoryBackend.SQLITE, description="Memory backend type"
    )
    memory_path: str = Field(
        default="./data/memory.sqlite", description="SQLite database path"
    )
    max_history: int = Field(
        default=20, description="Maximum conversation history to maintain"
    )

    # Server configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")

    @property
    def is_prod(self) -> bool:
        """Check if running in production."""
        return self.env == Environment.PROD

    @property
    def memory_path_resolved(self) -> Path:
        """Get resolved memory path."""
        return Path(self.memory_path).resolve()


# Global settings instance
settings = Settings()
