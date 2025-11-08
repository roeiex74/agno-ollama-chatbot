# Backend Scripts

This directory contains automated scripts for setting up and interacting with the Agno chatbot backend.

## Scripts Overview

### 1. `setup.sh` - Automated Setup Script

Complete automated setup from a fresh clone to a running server.

**Features:**

- ✅ Dependency checking (Python 3.10+, pip, curl, Ollama)
- ✅ Ollama service initialization and model download
- ✅ Python virtual environment creation
- ✅ Dependency installation from requirements.txt
- ✅ Configuration setup (.env file creation)
- ✅ FastAPI server startup
- ✅ Sanity check validation (sends test message to agent)
- ✅ Comprehensive metrics collection

**Usage:**

```bash
cd backend/scripts
./setup.sh
```

**What it does:**

1. Checks all required dependencies are installed
2. Starts Ollama service (if not running)
3. Downloads the configured model (default: llama3.2:3b)
4. Creates Python virtual environment
5. Installs all Python dependencies
6. Creates .env configuration file
7. Starts the FastAPI server in the background
8. Validates the server and agent are responding correctly
9. Saves detailed metrics to `backend/metrics/setup_metrics_*.json`

**Metrics Collected:**

- Dependency check results
- Ollama setup timing
- Model download duration
- Environment creation time
- Server startup time
- Sanity check response time
- Overall setup duration

**Exit Codes:**

- `0` - Success
- `1` - Failure (check error messages)

### 2. `chat.sh` - Interactive Chat Script

Simple CLI for interactive testing with the chatbot agent.

**Features:**

- ✅ Interactive command-line interface
- ✅ Non-streaming request/response
- ✅ Session persistence (conversation memory)
- ✅ Per-message metrics display
- ✅ Session statistics
- ✅ Error handling and validation

**Usage:**

```bash
# Make sure the server is running first
cd backend/scripts
./chat.sh
```

**Commands:**

- Type your message and press Enter to chat
- `/quit` or `/exit` - End the chat session
- `/new` - Start a new conversation
- `/metrics` - Display session statistics
- `/help` - Show available commands

**What it displays:**

- Assistant responses in real-time
- Response time per message
- Message count
- Model being used
- Conversation ID
- Session statistics on exit

**Metrics Collected:**

- Per-message timestamps
- Response times (milliseconds)
- Character counts
- Success/error status
- Session summary (total messages, average response time, errors)
- Saved to `backend/metrics/chat_session_*.json`

## Configuration

Both scripts use the configuration from `backend/.env` file:

```bash
# Ollama Configuration
OLLAMA_MODEL=llama3.2:3b        # Model to use
OLLAMA_HOST=http://localhost:11434

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Memory Configuration
MEMORY_BACKEND=sqlite
MEMORY_PATH=./data/memory.sqlite
MAX_HISTORY=20
```

The setup script will create this file automatically if it doesn't exist.

## Metrics

All metrics are saved as JSON files in `backend/metrics/`:

- `setup_metrics_YYYYMMDD_HHMMSS.json` - Setup script metrics
- `chat_session_YYYYMMDD_HHMMSS.json` - Chat session metrics

These files contain detailed information about:

- Timing for each operation
- Success/failure status
- Error counts
- Performance statistics

## Troubleshooting

### Setup Script Issues

**"Ollama not found"**

- Install Ollama from: https://ollama.ai/download
- Ensure it's in your PATH

**"Python 3.10+ required"**

- Install Python 3.10 or higher
- Ensure `python3` command points to correct version

**"Server failed to start"**

- Check logs at `backend/logs/server.log`
- Ensure port 8000 is not in use
- Verify virtual environment was created correctly

**"Model pull failed"**

- Check internet connection
- Verify Ollama service is running
- Check available disk space

### Chat Script Issues

**"Server is not running"**

- Run `./setup.sh` first to start the server
- Or manually start: `cd backend && ./venv/bin/uvicorn app.main:app --reload`

**"Request failed with HTTP XXX"**

- Check server logs at `backend/logs/server.log`
- Verify the model is loaded in Ollama
- Ensure server is responding to `/healthz` endpoint

## Examples

### Complete Fresh Setup

```bash
# Clone the repository
git clone <repo-url>
cd agno_chatbot/backend/scripts

# Run setup (one command does everything)
./setup.sh

# Start chatting
./chat.sh
```

### Development Workflow

```bash
# After initial setup, just start the server
cd backend
make dev

# In another terminal, start chatting
cd backend/scripts
./chat.sh
```

### View Metrics

```bash
# Setup metrics
cat backend/metrics/setup_metrics_*.json | python3 -m json.tool

# Chat session metrics
cat backend/metrics/chat_session_*.json | python3 -m json.tool
```

## Requirements

**System Requirements:**

- macOS or Linux
- Python 3.10+
- 4GB+ RAM
- 5GB+ disk space (for models)

**Software Requirements:**

- Python 3.10+
- pip3
- curl
- Ollama

**Python Dependencies:**

- See `backend/requirements.txt`

## Architecture

```
setup.sh → Checks deps → Starts Ollama → Creates venv →
           Installs deps → Configures → Starts server →
           Validates → Saves metrics

chat.sh → Checks server → Interactive loop →
          Send message → Display response →
          Show metrics → Save metrics
```

## Notes

- The setup script starts the server in the background
- The server will continue running after setup completes
- To stop the server: `kill <PID>` (shown in setup output)
- Metrics are never overwritten (timestamped filenames)
- Both scripts support macOS and Linux
- Colored output requires terminal color support
