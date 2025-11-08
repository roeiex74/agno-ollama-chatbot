# 🎯 Quick Test - See It Working!

Want to verify everything works by actually chatting? Here's how:

---

## 🚀 **Step 1: Start the Server** (Terminal 1)

```bash
cd backend
make start
```

**Wait for this message:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server is ready!
  • Health check: http://localhost:8000/healthz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Keep this terminal running!**

---

## 💬 **Step 2: Chat Interactively** (Terminal 2)

Open a **NEW terminal** and run:

```bash
cd backend
make chat
```

**Now you can chat!**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Interactive Chatbot Demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Connected to chatbot!

Type your messages and press Enter to chat.
Type 'quit', 'exit', or 'bye' to stop.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You: Hello!
Bot: Hi! How can I help you today?

You: What is 2+2?
Bot: 2+2 equals 4.

You: What was my first question?
Bot: Your first question was "Hello!"

You: quit
Goodbye!
```

---

## ⚡ **Quick Automated Test** (Alternative)

If you just want to verify it works without chatting:

```bash
cd backend
make quick-test
```

This will:
- ✅ Check server is running
- ✅ Send a test message
- ✅ Verify memory works
- ✅ Show you the responses

**Example output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Quick End-to-End Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Checking server status...
✓ Server is running

[2/3] Testing chatbot...
  Sending: 'What is 2+2?'
✓ Chatbot responded:
  2 + 2 equals 4.

[3/3] Testing conversation memory...
  Sending: 'What was my question?'
✓ Memory works! Response:
  You asked "What is 2+2?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All tests passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your chatbot is working! 🎉
```

---

## 🌐 **Web Interface** (Easiest!)

Just open your browser and go to:

**http://localhost:8000/docs**

You'll see an interactive API documentation page where you can:
1. Click on `POST /chat`
2. Click **"Try it out"**
3. Type your message in the JSON
4. Click **"Execute"**
5. See the bot's response!

**Example:**
```json
{
  "message": "Tell me a joke"
}
```

---

## 📋 **All Testing Commands**

```bash
# Start the server (keep running)
make start

# Interactive chat (fun!)
make chat

# Quick automated test
make quick-test

# Full automated test (starts server, tests, stops server)
make test-all

# Unit tests only
make test
```

---

## 🎬 **Complete Test Flow**

**Terminal 1:**
```bash
cd /Users/asifamar/Desktop/Master/llm\ with\ agents/agno_chatbot/backend
make start
```

**Terminal 2 (after server starts):**
```bash
cd /Users/asifamar/Desktop/Master/llm\ with\ agents/agno_chatbot/backend
make chat
```

Then just type and chat! 💬

---

## 🐛 **If Something Doesn't Work**

**Server not starting?**
```bash
# Check if Ollama is running
curl http://localhost:11434

# Should see: "Ollama is running"

# If not, start Ollama:
./scripts/start-ollama.sh
```

**Can't connect to server?**
```bash
# Check if server is running
curl http://localhost:8000/healthz

# Should see: {"status":"ok",...}
```

**Chat demo won't start?**
```bash
# Make sure server is running first!
make start
# Wait for "Server is ready!" message
# Then in another terminal:
make chat
```

---

## ✅ **Success Indicators**

You know everything works when:

1. ✅ `make start` shows "Server is ready!"
2. ✅ `make chat` connects and you can type messages
3. ✅ Bot responds to your questions
4. ✅ Bot remembers previous messages in the conversation
5. ✅ You can visit http://localhost:8000/docs and see the API

---

**Ready to test? Just run:**

```bash
# Terminal 1
cd backend && make start

# Terminal 2 (after server starts)
cd backend && make chat
```

Then start chatting! 🚀
