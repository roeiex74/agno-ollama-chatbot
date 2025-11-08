# 🚀 ONE COMMAND TO TEST EVERYTHING

No manual steps needed. Everything is fully automated!

## ⚡ Quick Start (Single Command)

```bash
cd backend
make test-all
```

That's it! ✅

---

## 📊 What Happens Automatically

When you run `make test-all`, the script will:

1. ✅ **Check Ollama** - Verifies installation
2. ✅ **Start Ollama** - Launches service if not running
3. ✅ **Download Model** - Gets llama3.2:3b if missing (first time only)
4. ✅ **Test Model** - Verifies it works
5. ✅ **Start Server** - Launches FastAPI in background
6. ✅ **Wait for Ready** - Ensures server is up
7. ✅ **Run API Tests** - Tests all endpoints
8. ✅ **Run Unit Tests** - Runs pytest suite
9. ✅ **Show Results** - Displays summary
10. ✅ **Cleanup** - Stops server automatically

**Zero manual intervention required!**

---

## 📺 Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FULLY AUTOMATED END-TO-END TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ STEP 1: Checking Ollama Installation ━━━
✓ Ollama is installed

━━━ STEP 2: Starting Ollama Service ━━━
✓ Ollama service started

━━━ STEP 3: Checking Model Availability ━━━
ℹ Target model: llama3.2:3b
✓ Model 'llama3.2:3b' is available

━━━ STEP 4: Testing Model ━━━
ℹ Running quick model test...
✓ Model is working: OK

━━━ STEP 5: Starting FastAPI Server ━━━
ℹ Launching server in background...
ℹ Server started with PID: 12345
ℹ Waiting for server to be ready...
✓ Server is ready!

━━━ STEP 6: Running API Tests ━━━

[TEST 1] Health endpoint...
✓ Health check PASSED

[TEST 2] Non-streaming chat...
✓ Chat endpoint PASSED

[TEST 3] Conversation memory...
✓ Memory PASSED

[TEST 4] Streaming chat...
✓ Streaming PASSED

━━━ STEP 7: Running Unit Tests ━━━
ℹ Executing pytest...
test_health.py::test_health_check PASSED
test_chat_nonstream.py::test_chat_endpoint_success PASSED
test_chat_stream.py::test_chat_stream_endpoint PASSED
test_memory.py::test_inmemory_store_load_empty PASSED
...
✓ Unit tests PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ALL TESTS PASSED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Success Summary:
  ✓ Ollama service running
  ✓ Model loaded and tested
  ✓ FastAPI server running
  ✓ All API endpoints working
  ✓ Unit tests passing
```

---

## ⏱️ How Long Does It Take?

- **First run:** 10-15 minutes (downloads ~2GB model)
- **Subsequent runs:** 1-2 minutes

---

## 🔧 Prerequisites

Only **Python 3.10+** is required. Everything else is handled automatically!

If Ollama is not installed, the script will tell you:
```
✗ Ollama is not installed!

Please install Ollama:
  macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh
```

Install it, then run `make test-all` again.

---

## 🎯 Other Useful Commands

```bash
# One-time setup (if not done yet)
make setup

# Just start the server (manual mode)
make start

# Run only unit tests (fast)
make test

# Check Ollama status
make check-ollama
```

---

## 🐛 If Something Fails

The script will show exactly what failed and where to find logs:

```
Logs available at:
  - Server logs: /tmp/fastapi.log
  - Ollama logs: /tmp/ollama.log
  - Pytest logs: /tmp/pytest.log
```

Common fixes:

**Port already in use:**
```bash
# Kill any process on port 8000
lsof -ti:8000 | xargs kill -9

# Run again
make test-all
```

**Ollama issues:**
```bash
# Check Ollama status
ollama list

# Restart Ollama
pkill ollama
ollama serve &

# Run again
make test-all
```

---

## ✅ Success Checklist

After running `make test-all`, you should see:

- [x] ✓ Ollama service running
- [x] ✓ Model loaded and tested
- [x] ✓ FastAPI server running
- [x] ✓ All API endpoints working
- [x] ✓ Unit tests passing

---

## 🎬 Ready?

Just run:

```bash
cd backend
make test-all
```

Sit back and watch it work! ☕

---

## 🚀 For Development

If you want the server to **keep running** after tests:

```bash
# Start server (stays running)
make start

# In another terminal, run tests
make test-api
```

---

**That's it! Everything is automated.** 🎉
