"""Tests for memory storage implementations."""

import tempfile
from pathlib import Path

import pytest

from app.memory.store import InMemoryStore, SQLiteStore


# Tests for InMemoryStore
def test_inmemory_store_load_empty():
    """Test loading from empty in-memory store."""
    store = InMemoryStore()
    messages = store.load("conv-1")
    assert messages == []


def test_inmemory_store_append():
    """Test appending messages to in-memory store."""
    store = InMemoryStore()

    store.append("conv-1", "user", "Hello")
    store.append("conv-1", "assistant", "Hi there!")

    messages = store.load("conv-1")
    assert len(messages) == 2
    assert messages[0] == {"role": "user", "content": "Hello"}
    assert messages[1] == {"role": "assistant", "content": "Hi there!"}


def test_inmemory_store_truncate():
    """Test truncating conversation history."""
    store = InMemoryStore()

    # Add 5 messages
    for i in range(5):
        store.append("conv-1", "user", f"Message {i}")

    # Truncate to 3
    store.truncate("conv-1", 3)

    messages = store.load("conv-1")
    assert len(messages) == 3
    # Should keep the last 3 messages
    assert messages[0]["content"] == "Message 2"
    assert messages[1]["content"] == "Message 3"
    assert messages[2]["content"] == "Message 4"


def test_inmemory_store_multiple_conversations():
    """Test multiple conversations are isolated."""
    store = InMemoryStore()

    store.append("conv-1", "user", "Conv 1 message")
    store.append("conv-2", "user", "Conv 2 message")

    messages_1 = store.load("conv-1")
    messages_2 = store.load("conv-2")

    assert len(messages_1) == 1
    assert len(messages_2) == 1
    assert messages_1[0]["content"] == "Conv 1 message"
    assert messages_2[0]["content"] == "Conv 2 message"


# Tests for SQLiteStore
@pytest.fixture
def temp_db():
    """Create a temporary SQLite database for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.sqlite"
        yield str(db_path)


def test_sqlite_store_init(temp_db):
    """Test SQLite store initialization creates schema."""
    store = SQLiteStore(temp_db)
    assert Path(temp_db).exists()

    # Verify table was created
    messages = store.load("any-id")
    assert messages == []  # Should return empty list for non-existent conversation


def test_sqlite_store_append(temp_db):
    """Test appending messages to SQLite store."""
    store = SQLiteStore(temp_db)

    store.append("conv-1", "user", "Hello SQLite")
    store.append("conv-1", "assistant", "Hi from SQLite!")

    messages = store.load("conv-1")
    assert len(messages) == 2
    assert messages[0] == {"role": "user", "content": "Hello SQLite"}
    assert messages[1] == {"role": "assistant", "content": "Hi from SQLite!"}


def test_sqlite_store_truncate(temp_db):
    """Test truncating conversation history in SQLite."""
    store = SQLiteStore(temp_db)

    # Add 10 messages
    for i in range(10):
        store.append("conv-1", "user", f"Message {i}")

    # Truncate to 5
    store.truncate("conv-1", 5)

    messages = store.load("conv-1")
    assert len(messages) == 5
    # Should keep the last 5 messages
    assert messages[0]["content"] == "Message 5"
    assert messages[-1]["content"] == "Message 9"


def test_sqlite_store_persistence(temp_db):
    """Test SQLite store persists data across instances."""
    # Create first instance and add data
    store1 = SQLiteStore(temp_db)
    store1.append("conv-1", "user", "Persistent message")

    # Create second instance and verify data
    store2 = SQLiteStore(temp_db)
    messages = store2.load("conv-1")

    assert len(messages) == 1
    assert messages[0]["content"] == "Persistent message"


def test_sqlite_store_multiple_conversations(temp_db):
    """Test multiple conversations are isolated in SQLite."""
    store = SQLiteStore(temp_db)

    store.append("conv-1", "user", "Conv 1 SQLite")
    store.append("conv-2", "user", "Conv 2 SQLite")
    store.append("conv-1", "assistant", "Reply 1")

    messages_1 = store.load("conv-1")
    messages_2 = store.load("conv-2")

    assert len(messages_1) == 2
    assert len(messages_2) == 1


def test_sqlite_store_idempotent_init(temp_db):
    """Test initializing SQLite store multiple times is safe."""
    # Create multiple instances - should not raise errors
    store1 = SQLiteStore(temp_db)
    store2 = SQLiteStore(temp_db)
    store3 = SQLiteStore(temp_db)

    # Verify they all work
    store1.append("test", "user", "Message")
    messages = store3.load("test")
    assert len(messages) == 1
