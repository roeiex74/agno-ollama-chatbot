"""Tests for configuration management."""

import os
import pytest
from app.config import Settings, Environment


def test_default_settings():
    """Test that default settings are loaded correctly."""
    settings = Settings()

    # Check environment (can be LOCAL or TEST depending on ENV var)
    assert settings.env in [Environment.LOCAL, Environment.TEST]
    assert settings.ollama_model == "llama3.2:3b"
    assert settings.ollama_host == "http://localhost:11434"
    assert settings.model_timeout_s == 60
    assert settings.max_history == 20
    assert settings.host == "0.0.0.0"
    assert settings.port == 8000


def test_is_prod_property():
    """Test is_prod property returns correct boolean."""
    # Test local environment
    settings_local = Settings(env=Environment.LOCAL)
    assert settings_local.is_prod is False

    # Test production environment
    settings_prod = Settings(env=Environment.PROD)
    assert settings_prod.is_prod is True


def test_custom_ollama_settings():
    """Test custom Ollama configuration."""
    settings = Settings(
        ollama_model="llama3.3:70b",
        ollama_host="http://custom-host:11434",
        model_timeout_s=120,
    )

    assert settings.ollama_model == "llama3.3:70b"
    assert settings.ollama_host == "http://custom-host:11434"
    assert settings.model_timeout_s == 120


def test_custom_server_settings():
    """Test custom server configuration."""
    settings = Settings(host="127.0.0.1", port=9000)

    assert settings.host == "127.0.0.1"
    assert settings.port == 9000


def test_max_history_setting():
    """Test max_history configuration."""
    settings = Settings(max_history=50)
    assert settings.max_history == 50


def test_database_url_setting():
    """Test PostgreSQL URL configuration."""
    custom_url = "postgresql+psycopg://myuser:mypass@db.example.com:5432/mydb"
    settings = Settings(database_url=custom_url)
    assert settings.database_url == custom_url
