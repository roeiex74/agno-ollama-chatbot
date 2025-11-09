# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready chatbot backend using **Agno** (agent framework) + **Ollama** (local LLM inference). It provides both streaming and non-streaming chat endpoints with persistent conversation memory.

**Key Technologies:**
- **Agno**: Agent orchestration framework with native streaming support
- **Ollama**: Local LLM runtime (no API keys required)
- **FastAPI**: Web framework for endpoints
- **SQLite**: Default conversation persistence (with in-memory fallback)

## Essential Commands

All commands should be run from the `backend/` directory.

### Setup & Starting

```bash
# One-time setup (creates venv, installs deps, creates .env)
make setup

# Start server (handles Ollama check, model download, server startup)
make start

# Quick dev start (assumes Ollama/model ready)
make dev

# Check Ollama status and model availability
make check-ollama
```

### Testing

```bash
# Run all tests (uses in-memory storage, no Ollama required)
make test

# Run with coverage report
make test-coverage

# Fully automated end-to-end test (downloads model, starts server, runs all tests)
make test-all
```

### Other Commands

```bash
# Interactive chat demo (requires running server)
make chat

# Clean generated files
make clean

# Format code (requires black)
make format

# Lint code (requires ruff)
make lint
```

### UI

```bash
# Launch Streamlit chat UI (checks server, installs deps, launches UI)
cd backend/scripts
./launch_ui.sh
```

## Architecture

### Request Flow

1. **Client Request** → FastAPI endpoint (`/chat` or `/chat/stream`)
2. **Load History** → MemoryStore loads conversation by `conversation_id`
3. **Agent Execution** → ChatbotAgent runs Agno agent with Ollama model
4. **Stream/Complete** → Response returned (streaming SSE or complete JSON)
5. **Save Response** → Assistant message saved to MemoryStore

### Core Components

**`app/main.py`** - FastAPI application with 3 endpoints:
- `GET /healthz` - Health check with config info
- `POST /chat` - Non-streaming chat (complete response)
- `POST /chat/stream` - SSE streaming chat (token-by-token)

**`app/agents/chatbot_agent.py`** - ChatbotAgent orchestrates:
- Conversation history management
- Agno agent initialization with Ollama model
- Streaming vs non-streaming execution
- Response storage in memory

**`app/memory/store.py`** - Two MemoryStore implementations:
- `SQLiteStore` - Persistent storage (production default)
- `InMemoryStore` - Ephemeral storage (testing only)
- Both implement: `load()`, `append()`, `truncate()`

**`app/config.py`** - Environment-based configuration using Pydantic Settings:
- Loads from `.env` file
- Type-safe settings with validation
- Resolves paths and provides utility properties

### Memory Management

- Each conversation identified by `conversation_id` (UUID auto-generated if omitted)
- History stored as `[{"role": "user|assistant", "content": "..."}]`
- Automatic truncation to `MAX_HISTORY` (default: 20 messages)
- Agent sees full history for context continuity

### Streaming Architecture

- Agno provides native streaming: `agent.arun(stream=True)`
- Returns async iterator of chunks
- FastAPI's `StreamingResponse` converts to Server-Sent Events (SSE)
- Format: `data: {"delta": "token"}\n\n` for chunks, `data: {"done": true, ...}\n\n` for completion

## Configuration

All settings via `.env` file (created by `make setup`):

| Variable | Default | Description |
|----------|---------|-------------|
| `ENV` | `local` | Environment (`local` or `prod`) |
| `OLLAMA_MODEL` | `llama3.2:3b` | Ollama model to use |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `MEMORY_BACKEND` | `sqlite` | Storage type (`sqlite` or `inmemory`) |
| `MEMORY_PATH` | `./data/memory.sqlite` | SQLite database path |
| `MAX_HISTORY` | `20` | Max messages per conversation |
| `HOST` | `0.0.0.0` | Server bind host |
| `PORT` | `8000` | Server bind port |

## Development Notes

### Adding New Endpoints

1. Add route function to `app/main.py`
2. Define Pydantic request/response models
3. Access global `chatbot_agent` instance
4. Add corresponding tests in `tests/`

### Switching Models

Edit `.env`:
```bash
OLLAMA_MODEL=llama3.3:70b
```

Pull model:
```bash
ollama pull llama3.3:70b
```

Available models: https://ollama.com/library

### Testing Strategy

- Tests use `MEMORY_BACKEND=inmemory` (set in Makefile)
- No Ollama required (agent responses mocked in tests)
- Run individual test files: `pytest tests/test_memory.py -v`
- FastAPI TestClient used for endpoint testing

### Important Implementation Details

1. **Agent Initialization**: Done in FastAPI lifespan context manager (startup/shutdown)
2. **Thread Safety**: MemoryStore uses locks for concurrent access
3. **Error Handling**: HTTPException with appropriate status codes (503 for uninitialized, 500 for errors)
4. **CORS**: Wide-open in local, restricted in prod (edit `app/main.py`)
5. **Message Format**: Agno agent receives last user message only; history managed separately

### Common Pitfalls

- **Don't** assume `chatbot_agent` exists outside lifespan context
- **Don't** modify message history directly; use MemoryStore methods
- **Don't** forget to await async operations in ChatbotAgent
- **Do** use `stream=True` parameter to enable streaming mode
- **Do** check `.env` exists before running (created by setup scripts)

### Production Considerations

- SQLite works for single-instance deployments
- For multi-instance/horizontal scaling: implement PostgreSQL-backed MemoryStore
- Enable CORS restrictions in `app/main.py` for production
- Rate limiting not implemented (add middleware if needed)
- No authentication layer (integrate as needed)

## File Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, endpoints, lifespan
│   ├── config.py            # Pydantic settings from .env
│   ├── agents/
│   │   └── chatbot_agent.py # Agno agent orchestration
│   ├── memory/
│   │   └── store.py         # SQLite + InMemory stores
│   └── services/
│       └── ollama_client.py # (Unused - Agno has built-in Ollama)
├── tests/
│   ├── test_health.py       # Health endpoint tests
│   ├── test_chat_nonstream.py
│   ├── test_chat_stream.py
│   └── test_memory.py
├── scripts/
│   ├── start.sh             # Smart startup (Ollama check + model + server)
│   ├── launch_ui.sh         # Streamlit UI launcher
│   └── chat.sh              # Interactive CLI demo
├── requirements.txt
├── pyproject.toml
├── Makefile                 # All dev commands
└── .env                     # Config (created by setup)
```
