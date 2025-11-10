"""Configuration management using pydantic-settings."""

from enum import Enum

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Environment types."""

    LOCAL = "local"
    PROD = "prod"


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

    # Database configuration
    postgres_url: str = Field(
        default="postgresql+psycopg://user:pass@localhost:5432/db",
        description="PostgreSQL connection URL"
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


# Global settings instance
settings = Settings()
