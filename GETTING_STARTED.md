# Getting Started with Agno + Ollama Chatbot

This guide will walk you through setting up and running the chatbot from scratch.

## 🚀 Quick Start (5 minutes)

### Step 1: Prerequisites

You only need **Python 3.10+**. Everything else will be set up automatically!

```bash
# Check Python version
python3 --version  # Should be 3.10 or higher
```

### Step 2: Setup

```bash
# Navigate to the backend directory
cd backend

# Run automated setup
make setup
```

This creates the virtual environment, installs dependencies, and configures your `.env` file.

### Step 3: Start the Server

```bash
# Smart start (handles everything)
make start
```

**What happens automatically:**
1. Checks if Ollama is installed (tells you how to install if missing)
2. Starts Ollama service if not running
3. Downloads the model if you don't have it yet (e.g., `llama3.2:3b`)
4. Tests the model to ensure it works
5. Starts the FastAPI server

**Expected output:**
```
========================================
  Agno + Ollama Chatbot Startup
========================================

[1/6] Checking Ollama installation...
✓ Ollama is installed: ollama version 0.x.x

[2/6] Checking Ollama service...
✓ Ollama service is running

[3/6] Loading configuration...
✓ Loaded configuration from .env
ℹ Target model: llama3.2:3b

[4/6] Checking model availability...
✓ Model 'llama3.2:3b' is already available

[5/6] Verifying model functionality...
ℹ Testing model with a simple query...
✓ Model is working correctly

[6/6] Starting FastAPI server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server is ready!
  • Health check: http://localhost:8000/healthz
  • Chat API:     http://localhost:8000/chat
  • Streaming:    http://localhost:8000/chat/stream
  • API Docs:     http://localhost:8000/docs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Test It!

Open a new terminal and try:

```bash
# Health check
curl http://localhost:8000/healthz

# Send a message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello! What can you do?"}'

# Try streaming
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Tell me a joke"}' \
  --no-buffer
```

Visit the interactive API docs: **http://localhost:8000/docs**

---

## 📋 What If Ollama Isn't Installed?

If you see: `✗ Ollama is not installed!`

**Install Ollama:**

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from: https://ollama.com
```

Then run `make start` again.

---

## ⚙️ Configuration

All settings are in `backend/.env` (created during setup):

```bash
# Model selection
OLLAMA_MODEL=llama3.2:3b  # Change to any Ollama model

# Memory settings
MEMORY_BACKEND=sqlite     # or 'inmemory' for testing
MAX_HISTORY=20            # Max messages to remember

# Server
HOST=0.0.0.0
PORT=8000
```

**Available models:** https://ollama.com/library

Popular choices:
- `llama3.2:1b` - Fastest, minimal resources
- `llama3.2:3b` - Default, good balance
- `llama3.3:70b` - Best quality, needs GPU

---

## 🔍 Useful Commands

```bash
# Check Ollama status
make check-ollama

# Run tests
make test

# Clean generated files
make clean

# Quick dev start (skip Ollama checks)
make dev
```

---

## 🎯 Development Workflow

### First Time Setup
```bash
cd backend
make setup      # One-time setup
make start      # Start server
```

### Daily Development
```bash
cd backend
make dev        # Quick start (assumes Ollama is ready)
```

### Before Committing
```bash
make test       # Run tests
make lint       # Check code style
make format     # Auto-format code
```

---

## 🐛 Troubleshooting

### Ollama Issues

**Problem:** Model download is slow
```bash
# Try a smaller model
# Edit .env and change:
OLLAMA_MODEL=llama3.2:1b
```

**Problem:** "Ollama service is not running"
```bash
# Start Ollama manually
ollama serve

# In another terminal
make start
```

**Problem:** "Model test failed"
```bash
# Test model directly
ollama run llama3.2:3b "Hello"

# If it fails, try pulling again
ollama pull llama3.2:3b
```

### Python/Dependency Issues

**Problem:** "Python 3.10 or higher is required"
```bash
# Check your Python version
python3 --version

# Install Python 3.10+ from python.org
```

**Problem:** "Virtual environment not found"
```bash
# Re-run setup
make setup
```

**Problem:** "Module not found" errors
```bash
# Reinstall dependencies
./venv/bin/pip install -r requirements.txt
```

### Server Issues

**Problem:** Port 8000 already in use
```bash
# Edit .env and change port
PORT=8001

# Or stop the other process
lsof -ti:8000 | xargs kill -9
```

**Problem:** Can't connect to server
```bash
# Check if server is running
curl http://localhost:8000/healthz

# Check logs for errors
# Server logs appear in the terminal where you ran 'make start'
```

---

## 📚 Next Steps

1. **Explore the API**: Visit http://localhost:8000/docs for interactive docs
2. **Customize the Agent**: Edit `backend/app/agents/chatbot_agent.py`
3. **Add Tools**: Check Agno docs for adding web search, calculators, etc.
4. **Build a Frontend**: See `frontend/` folder (coming in Phase 2)

---

## 💡 Tips

- **Faster responses**: Use smaller models (`llama3.2:1b`)
- **Better quality**: Use larger models (`llama3.3:70b`) with GPU
- **Persistence**: Default SQLite works great for single-user setups
- **Multi-user**: Switch to PostgreSQL (see README.md)
- **Debugging**: Check `backend/app/main.py` for logging

---

## 🆘 Still Having Issues?

1. Run diagnostics:
   ```bash
   make check-ollama
   ```

2. Check logs in the terminal where you ran `make start`

3. Try the manual approach:
   ```bash
   # Terminal 1
   ollama serve

   # Terminal 2
   cd backend
   ./venv/bin/uvicorn app.main:app --reload
   ```

4. Create an issue: https://github.com/your-repo/issues

---

**Happy Chatting! 🤖**
