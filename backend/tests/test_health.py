"""Tests for health check endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test GET /healthz returns 200 OK with expected JSON."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/healthz")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data
    assert "model" in data
    assert "memory_backend" in data


@pytest.mark.asyncio
async def test_health_check_structure():
    """Test health check response has correct structure."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/healthz")

    data = response.json()
    required_fields = ["status", "environment", "model", "memory_backend"]

    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
        assert data[field] is not None, f"Field {field} should not be None"
