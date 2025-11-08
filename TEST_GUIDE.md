# Testing Guide

This guide will help you test if everything works correctly.

## 🚀 Quick Test (Automated)

### Step 1: Setup (One-time)

```bash
cd backend
make setup
```

**Expected output:**
```
✓ Python 3.x.x is installed
✓ Created virtual environment
✓ All dependencies installed
✓ Created .env file
✓ Setup completed successfully!
```

### Step 2: Start the Server

**Option A: In the same terminal (blocking)**

```bash
make start
```

**Option B: In the background**

```bash
# Terminal 1 - Start the server
make start

# Keep this terminal running
```

**Expected output:**
```
[1/6] Checking Ollama installation...
✓ Ollama is installed

[2/6] Checking Ollama service...
ℹ Waiting for Ollama to start...
✓ Ollama service is now running

[3/6] Loading configuration...
✓ Loaded configuration from .env
ℹ Target model: llama3.2:3b

[4/6] Checking model availability...
⚠ Model 'llama3.2:3b' not found. Downloading...
[... downloads model ...]
✓ Successfully downloaded model 'llama3.2:3b'

[5/6] Verifying model functionality...
✓ Model is working correctly

[6/6] Starting FastAPI server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server is ready!
  • Health check: http://localhost:8000/healthz
  • Chat API:     http://localhost:8000/chat
  • Streaming:    http://localhost:8000/chat/stream
  • API Docs:     http://localhost:8000/docs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Test the API

**Open a NEW terminal** and run:

```bash
cd backend
./scripts/test-api.sh
```

**Expected output:**
```
========================================
  Testing Agno + Ollama Chatbot API
========================================

[TEST] Testing health endpoint...
✓ PASS Health check passed
{
    "status": "ok",
    "environment": "local",
    "model": "llama3.2:3b",
    "memory_backend": "sqlite"
}

[TEST] Testing non-streaming chat endpoint...
✓ PASS Non-streaming chat works
{
    "conversation_id": "abc-123-xyz",
    "reply": "Hello!",
    "usage": {
        "model": "llama3.2:3b",
        "messages": 2
    }
}

[TEST] Testing conversation continuity...
✓ PASS Conversation memory works

[TEST] Testing streaming endpoint...
✓ PASS Streaming works

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All tests passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Manual Testing (Step by Step)

If you prefer to test manually, follow these steps:

### 1. Check Setup

```bash
cd backend

# Verify Python version
python3 --version  # Should be 3.10+

# Verify virtual environment
ls venv/  # Should exist

# Verify dependencies
./venv/bin/pip list | grep -E "agno|ollama|fastapi"
```

### 2. Check Ollama

```bash
# Check if Ollama is installed
ollama --version

# Check Ollama status
make check-ollama
```

**Expected:**
```
✓ Ollama is installed
✓ Ollama service is running
✓ Model llama3.2:3b is available
```

### 3. Start Server Manually

```bash
# Terminal 1: Start Ollama (if not running)
ollama serve

# Terminal 2: Start the server
cd backend
make dev
```

### 4. Test Health Endpoint

```bash
curl http://localhost:8000/healthz
```

**Expected:**
```json
{
  "status": "ok",
  "environment": "local",
  "model": "llama3.2:3b",
  "memory_backend": "sqlite"
}
```

### 5. Test Chat (Non-Streaming)

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 2+2?"
  }'
```

**Expected:**
```json
{
  "conversation_id": "some-uuid-here",
  "reply": "2+2 equals 4.",
  "usage": {
    "model": "llama3.2:3b",
    "messages": 2
  }
}
```

### 6. Test Chat (Streaming)

```bash
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "Count from 1 to 5"
  }' \
  --no-buffer
```

**Expected:**
```
data: {"delta":"1"}

data: {"delta":","}

data: {"delta":" "}

data: {"delta":"2"}

data: {"delta":","}

...

data: {"done":true,"conversation_id":"uuid","usage":{...}}
```

### 7. Test Conversation Memory

```bash
# First message
CONV_ID=$(curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My name is Alice"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['conversation_id'])")

# Follow-up message (should remember context)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What is my name?\", \"conversation_id\": \"$CONV_ID\"}"
```

**Expected:** The agent should respond with "Alice" or "Your name is Alice"

### 8. Visit Interactive Docs

Open in browser: **http://localhost:8000/docs**

Try the endpoints interactively through Swagger UI!

---

## 🧪 Run Automated Tests

```bash
cd backend

# Run all unit tests
make test

# Run with coverage
make test-coverage
```

**Expected:**
```
test_health.py::test_health_check PASSED
test_health.py::test_health_check_structure PASSED
test_chat_nonstream.py::test_chat_endpoint_success PASSED
test_chat_nonstream.py::test_chat_without_conversation_id PASSED
test_chat_stream.py::test_chat_stream_endpoint PASSED
test_memory.py::test_inmemory_store_load_empty PASSED
test_memory.py::test_sqlite_store_init PASSED
...

=========== X passed in X.XXs ===========
```

---

## ✅ Success Checklist

After testing, you should have:

- [x] ✅ Setup completed successfully
- [x] ✅ Ollama installed and running
- [x] ✅ Model downloaded (e.g., llama3.2:3b)
- [x] ✅ Server started on http://localhost:8000
- [x] ✅ Health check returns 200 OK
- [x] ✅ Chat endpoint responds with valid JSON
- [x] ✅ Streaming endpoint sends SSE events
- [x] ✅ Conversation memory persists across messages
- [x] ✅ All unit tests pass

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process if needed
lsof -ti:8000 | xargs kill -9

# Try again
make start
```

### Ollama issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# In another terminal, pull model
ollama pull llama3.2:3b

# Test model directly
ollama run llama3.2:3b "Hello"
```

### Model download is slow

```bash
# Use a smaller model
# Edit .env:
OLLAMA_MODEL=llama3.2:1b

# Restart server
make start
```

### Tests failing

```bash
# Clean everything and start fresh
make clean

# Re-install dependencies
./venv/bin/pip install -r requirements.txt

# Run tests
make test
```

---

## 📊 Performance Test

Test with multiple concurrent requests:

```bash
# Simple load test (requires 'ab' - Apache Bench)
ab -n 100 -c 10 http://localhost:8000/healthz

# Or use curl in a loop
for i in {1..10}; do
  curl -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello"}' &
done
wait
```

---

## 🎯 Next Steps

Once all tests pass:

1. **Explore the API**: Visit http://localhost:8000/docs
2. **Try different models**: Edit `.env` and change `OLLAMA_MODEL`
3. **Test streaming UI**: Build a simple HTML page with EventSource
4. **Monitor performance**: Check Ollama CPU/memory usage
5. **Scale up**: Try larger models with GPU acceleration

---

## 📝 Test Results Template

Use this to report issues:

```
Environment:
- OS: macOS / Linux / Windows
- Python: 3.x.x
- Ollama: 0.x.x
- Model: llama3.2:3b

Test Results:
- [x] Setup: PASS/FAIL
- [x] Ollama check: PASS/FAIL
- [x] Server start: PASS/FAIL
- [x] Health endpoint: PASS/FAIL
- [x] Chat endpoint: PASS/FAIL
- [x] Streaming: PASS/FAIL
- [x] Memory: PASS/FAIL
- [x] Unit tests: X/Y passed

Error Messages:
[paste any errors here]
```

---

**Happy Testing! 🚀**
