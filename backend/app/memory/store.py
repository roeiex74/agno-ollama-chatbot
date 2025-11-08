"""Memory storage implementations for conversation history.

This module provides both SQLite and in-memory implementations
for storing conversation history by conversation_id.
"""

import sqlite3
from abc import ABC, abstractmethod
from pathlib import Path
from threading import Lock
from typing import Dict, List


class MemoryStore(ABC):
    """Abstract base class for memory storage."""

    @abstractmethod
    def load(self, conversation_id: str) -> List[Dict[str, str]]:
        """Load conversation history for a given conversation_id.

        Args:
            conversation_id: Unique conversation identifier

        Returns:
            List of message dicts with 'role' and 'content' keys
        """
        pass

    @abstractmethod
    def append(self, conversation_id: str, role: str, content: str) -> None:
        """Append a message to conversation history.

        Args:
            conversation_id: Unique conversation identifier
            role: Message role (e.g., 'user', 'assistant')
            content: Message content
        """
        pass

    @abstractmethod
    def truncate(self, conversation_id: str, max_history: int) -> None:
        """Truncate conversation history to max_history messages.

        Args:
            conversation_id: Unique conversation identifier
            max_history: Maximum number of messages to keep
        """
        pass


class SQLiteStore(MemoryStore):
    """SQLite-based memory storage implementation."""

    def __init__(self, db_path: str):
        """Initialize SQLite store.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = Path(db_path)
        self._lock = Lock()
        self._init_db()

    def _init_db(self) -> None:
        """Initialize database schema."""
        # Ensure parent directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            try:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS conversation_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        conversation_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_conversation_id
                    ON conversation_history(conversation_id)
                """)
                conn.commit()
            finally:
                conn.close()

    def load(self, conversation_id: str) -> List[Dict[str, str]]:
        """Load conversation history from SQLite."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            try:
                cursor = conn.execute(
                    """
                    SELECT role, content FROM conversation_history
                    WHERE conversation_id = ?
                    ORDER BY id ASC
                    """,
                    (conversation_id,),
                )
                return [{"role": row[0], "content": row[1]} for row in cursor.fetchall()]
            finally:
                conn.close()

    def append(self, conversation_id: str, role: str, content: str) -> None:
        """Append message to SQLite database."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            try:
                conn.execute(
                    """
                    INSERT INTO conversation_history (conversation_id, role, content)
                    VALUES (?, ?, ?)
                    """,
                    (conversation_id, role, content),
                )
                conn.commit()
            finally:
                conn.close()

    def truncate(self, conversation_id: str, max_history: int) -> None:
        """Truncate conversation history to max_history messages."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            try:
                # Get total count
                cursor = conn.execute(
                    """
                    SELECT COUNT(*) FROM conversation_history
                    WHERE conversation_id = ?
                    """,
                    (conversation_id,),
                )
                count = cursor.fetchone()[0]

                if count > max_history:
                    # Delete oldest messages
                    to_delete = count - max_history
                    conn.execute(
                        """
                        DELETE FROM conversation_history
                        WHERE id IN (
                            SELECT id FROM conversation_history
                            WHERE conversation_id = ?
                            ORDER BY id ASC
                            LIMIT ?
                        )
                        """,
                        (conversation_id, to_delete),
                    )
                    conn.commit()
            finally:
                conn.close()


class InMemoryStore(MemoryStore):
    """In-memory storage implementation for testing."""

    def __init__(self):
        """Initialize in-memory store."""
        self._storage: Dict[str, List[Dict[str, str]]] = {}
        self._lock = Lock()

    def load(self, conversation_id: str) -> List[Dict[str, str]]:
        """Load conversation history from memory."""
        with self._lock:
            return self._storage.get(conversation_id, []).copy()

    def append(self, conversation_id: str, role: str, content: str) -> None:
        """Append message to in-memory storage."""
        with self._lock:
            if conversation_id not in self._storage:
                self._storage[conversation_id] = []
            self._storage[conversation_id].append({"role": role, "content": content})

    def truncate(self, conversation_id: str, max_history: int) -> None:
        """Truncate conversation history to max_history messages."""
        with self._lock:
            if conversation_id in self._storage:
                messages = self._storage[conversation_id]
                if len(messages) > max_history:
                    self._storage[conversation_id] = messages[-max_history:]
