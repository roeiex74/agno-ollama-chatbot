# Agno + Ollama Chatbot

A production-ready, minimal chatbot backend using **Agno** for agentic workflows and **Ollama** for local LLM inference. Features include streaming responses via Server-Sent Events (SSE), persistent conversation memory, and optional MCP (Model Context Protocol) tool integration.

## Features

- **Agno Agent Framework**: Orchestrates LLM interactions with built-in streaming support
- **Ollama Local LLM**: Runs models locally (no API keys required)
- **Streaming & Non-Streaming**: Both `/chat` (complete response) and `/chat/stream` (SSE) endpoints
- **Conversation Memory**: SQLite-based persistence with configurable history limits
- **Production-Ready**: Environment-based config, proper error handling, comprehensive tests
- **Type-Safe**: Full type hints with Pydantic models

## Quick Start

### 🚀 **ONE COMMAND - FULLY AUTOMATED**

No manual steps! Everything runs automatically:

```bash
cd backend
make test-all
```

This will:

- ✅ Check/install/start Ollama
- ✅ Download model if needed
- ✅ Start server
- ✅ Run all tests
- ✅ Show results
- ✅ Cleanup automatically

**That's it!** See [RUN_ME.md](RUN_ME.md) for details.

---

### Prerequisites

- **Python 3.10+**
- **Ollama** (will be installed/configured automatically)

### Installation & Setup

If you want to set up manually:

```bash
# Navigate to backend directory
cd backend

# Run complete setup (one-time)
make setup
```

This will:

- ✅ Check Python version
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Create `.env` configuration file
- ✅ Initialize database directory

### Running the Server

**Recommended: Automated Start** (handles everything)

```bash
make start
```

This smart startup script will:

1. ✅ Check if Ollama is installed (provides instructions if not)
2. ✅ Start Ollama service if not running
3. ✅ Check if model exists (e.g., `llama3.2:3b`)
4. ✅ Download model if missing (with progress indicator)
5. ✅ Test model functionality
6. ✅ Start FastAPI server at `http://localhost:8000`

**Quick Dev Start** (assumes Ollama is ready)

```bash
make dev
```

**Manual Start** (if you prefer)

```bash
# Make sure Ollama is running
ollama serve

# In another terminal
./venv/bin/uvicorn app.main:app --reload
```

### Checking Status

```bash
# Check Ollama and model status
make check-ollama
```

The server will start at `http://localhost:8000`

### 🎨 Chat UI (Streamlit)

Launch the modern, interactive chat interface:

```bash
cd backend/scripts
./launch_ui.sh
```

This will:

1. ✅ Check if backend server is running
2. ✅ Install Streamlit if needed
3. ✅ Launch the UI at `http://localhost:8501`

**Features:**

- 💬 Beautiful gradient design with smooth animations
- 📊 Real-time metrics (response time, message count)
- 🔄 Conversation management (new conversation, clear chat)
- ⚡ Live server status indicator
- 💾 Session persistence

See [UI_GUIDE.md](UI_GUIDE.md) for detailed documentation.

### Testing

```bash
# Run all tests
make test

# With coverage report
make test-coverage
```

## API Usage

### Health Check

```bash
curl http://localhost:8000/healthz
```

**Response:**

```json
{
  "status": "ok",
  "environment": "local",
  "model": "llama3.2:3b",
  "memory_backend": "sqlite"
}
```

### Non-Streaming Chat

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of France?",
    "conversation_id": "my-conversation-123"
  }'
```

**Response:**

```json
{
  "conversation_id": "my-conversation-123",
  "reply": "The capital of France is Paris.",
  "usage": {
    "model": "llama3.2:3b",
    "messages": 2
  }
}
```

**Notes:**

- `conversation_id` is optional (auto-generated if omitted)
- Conversation history is automatically maintained per `conversation_id`

### Streaming Chat (SSE)

```bash
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "Tell me a short story"
  }' \
  --no-buffer
```

**Response (Server-Sent Events):**

```
data: {"delta": "Once"}

data: {"delta": " upon"}

data: {"delta": " a"}

data: {"delta": " time..."}

data: {"done": true, "conversation_id": "uuid-here", "usage": {...}}
```

**Notes:**

- Each `data:` line contains a JSON chunk
- Final chunk has `"done": true` with metadata
- Use EventSource in JavaScript or SSE clients

## Configuration

All configuration is via environment variables (`.env` file):

| Variable          | Default                  | Description                    |
| ----------------- | ------------------------ | ------------------------------ |
| `ENV`             | `local`                  | Environment: `local` or `prod` |
| `OLLAMA_MODEL`    | `llama3.2:3b`            | Ollama model to use            |
| `OLLAMA_HOST`     | `http://localhost:11434` | Ollama server URL              |
| `MODEL_TIMEOUT_S` | `60`                     | Request timeout (seconds)      |
| `MEMORY_BACKEND`  | `sqlite`                 | Memory: `sqlite` or `inmemory` |
| `MEMORY_PATH`     | `./data/memory.sqlite`   | SQLite database path           |
| `MAX_HISTORY`     | `20`                     | Max messages per conversation  |

### Switching Models

Edit `.env`:

```bash
OLLAMA_MODEL=llama3.3:70b
```

Then pull the model:

```bash
ollama pull llama3.3:70b
```

### Using In-Memory Storage (Testing)

Edit `.env`:

```bash
MEMORY_BACKEND=inmemory
```

**Note:** In-memory storage loses data on restart.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app + endpoints
│   ├── config.py            # Environment configuration
│   ├── agents/
│   │   ├── __init__.py
│   │   └── chatbot_agent.py # Agno agent with streaming
│   ├── services/
│   │   ├── __init__.py
│   │   └── ollama_client.py # Ollama wrapper (unused in favor of Agno's Ollama model)
│   └── memory/
│       ├── __init__.py
│       └── store.py         # SQLite + InMemory stores
├── tests/
│   ├── test_health.py       # Health endpoint tests
│   ├── test_chat_nonstream.py
│   ├── test_chat_stream.py
│   └── test_memory.py
├── requirements.txt
├── pyproject.toml
├── .env.example
└── Makefile
```

## How It Works

### Conversation Memory

- Each conversation is identified by a `conversation_id`
- History is stored in SQLite (or in-memory for tests)
- Conversation history is automatically truncated to `MAX_HISTORY` messages
- Agent sees full history context for continuity

### Streaming

- Agno's native streaming support via `agent.arun(stream=True)`
- FastAPI's `StreamingResponse` converts async iterator to SSE format
- Each token/chunk is sent as `data: {"delta": "..."}` event
- Final event includes metadata: `{"done": true, "conversation_id": "...", "usage": {...}}`

## Production Considerations

### SQLite in Production

- **Local/Small-Scale**: SQLite is fine for single-instance deployments
- **Multi-Instance**: Consider PostgreSQL or another shared database
- **Migration**: Implement Agno's `PostgresDb` or custom storage layer

### Scaling

- **Horizontal**: Use shared database (PostgreSQL) + load balancer
- **Vertical**: Increase Ollama resources (GPU memory for larger models)
- **Caching**: Add Redis for frequently accessed conversations

### Security

- Enable CORS restrictions in production (edit `app/main.py`)
- Use HTTPS/TLS for all endpoints
- Sanitize user inputs (Agno handles prompt injection to some extent)
- Rate limit endpoints to prevent abuse

## Development

### Running Tests

```bash
# All tests
make test

# Specific test file
pytest tests/test_memory.py -v

# With coverage
make test-coverage
```

### Code Quality

```bash
# Format code
make format  # requires black

# Lint code
make lint    # requires ruff
```

### Adding New Endpoints

1. Add route to `app/main.py`
2. Create request/response Pydantic models
3. Add tests in `tests/`
4. Update this README

## Troubleshooting

### Setup Issues

**"Ollama is not installed"**

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or visit: https://ollama.com
```

**"Model download failed"**

- Check internet connection
- Try a smaller model: edit `.env` and set `OLLAMA_MODEL=llama3.2:1b`
- Verify Ollama service is running: `ollama serve`

### Runtime Issues

**"Agent not initialized" error**

- Run `make check-ollama` to diagnose
- Restart with: `make start` (will fix most issues)
- Check logs for database initialization errors

**Streaming not working**

- Use `curl --no-buffer` or SSE-compatible client
- Check `Accept: text/event-stream` header
- Verify nginx/proxy buffering is disabled

**Tests failing**

- Tests use in-memory storage automatically
- No Ollama required (mocked in tests)
- Run: `make test`

## Next Steps (Phase 2)

- [ ] Frontend UI with streaming chat interface
- [ ] User authentication and multi-user support
- [ ] Tool integration (web search, calculator, etc.)
- [ ] Conversation management endpoints (list, delete, export)
- [ ] Multi-agent workflows with Agno Teams
- [ ] Observability (metrics, tracing, logging)

## License

MIT (or your preferred license)

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

Built with [Agno](https://agno.com) and [Ollama](https://ollama.com)
