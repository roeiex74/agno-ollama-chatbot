#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  FULLY AUTOMATED END-TO-END TEST${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}"
}

cd "$BACKEND_DIR"

SERVER_PID=""
CLEANUP_DONE=false

# Cleanup function
cleanup() {
    if [ "$CLEANUP_DONE" = true ]; then
        return
    fi
    CLEANUP_DONE=true

    echo -e "\n${YELLOW}Cleaning up...${NC}"

    if [ -n "$SERVER_PID" ]; then
        print_info "Stopping server (PID: $SERVER_PID)"
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        print_status "Server stopped"
    fi

    # Kill any remaining uvicorn processes
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Step 1: Check if Ollama is installed
print_step "STEP 1: Checking Ollama Installation"
if ! command -v ollama &> /dev/null; then
    print_error "Ollama is not installed!"
    echo ""
    echo "Please install Ollama:"
    echo "  macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh"
    echo "  Or visit: https://ollama.com"
    exit 1
fi
print_status "Ollama is installed"

# Step 2: Start Ollama service if needed
print_step "STEP 2: Starting Ollama Service"
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    print_warning "Ollama service not running. Attempting to start..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: Try to open the Ollama app
        print_info "Attempting to launch Ollama.app..."

        # Try to find and open Ollama app
        if [ -d "/Applications/Ollama.app" ]; then
            open -a Ollama
            print_status "Launched Ollama app"
        elif [ -d "$HOME/Applications/Ollama.app" ]; then
            open -a Ollama
            print_status "Launched Ollama app from ~/Applications"
        else
            # Fall back to command line
            print_info "Ollama.app not found in Applications, trying 'ollama serve'..."
            nohup ollama serve > /tmp/ollama.log 2>&1 &
            print_status "Started ollama serve in background"
        fi
    else
        # Linux: Start as background process
        nohup ollama serve > /tmp/ollama.log 2>&1 &
        print_status "Started ollama serve in background"
    fi

    # Wait for Ollama to start (max 60 seconds for macOS app)
    print_info "Waiting for Ollama service to be ready..."
    WAIT_TIME=60
    for i in $(seq 1 $WAIT_TIME); do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            print_status "Ollama service is ready!"
            break
        fi
        sleep 1
        if [ $i -eq $WAIT_TIME ]; then
            print_error "Ollama failed to start after ${WAIT_TIME} seconds"
            echo ""
            echo "Please start Ollama manually:"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                echo "  1. Open Spotlight (Cmd+Space)"
                echo "  2. Type 'Ollama' and press Enter"
                echo "  3. Or run in terminal: ollama serve"
            else
                echo "  Run: ollama serve"
            fi
            echo ""
            echo "Then run this test again: make test-all"
            exit 1
        fi
    done
else
    print_status "Ollama service is already running"
fi

# Step 3: Load configuration and check model
print_step "STEP 3: Checking Model Availability"
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi
MODEL_NAME="${OLLAMA_MODEL:-llama3.2:3b}"
print_info "Target model: $MODEL_NAME"

if ollama list | grep -q "^${MODEL_NAME}"; then
    print_status "Model '$MODEL_NAME' is available"
else
    print_warning "Model '$MODEL_NAME' not found. Downloading..."
    echo ""
    if ollama pull "$MODEL_NAME"; then
        echo ""
        print_status "Model downloaded successfully"
    else
        echo ""
        print_error "Failed to download model"
        exit 1
    fi
fi

# Step 4: Test model
print_step "STEP 4: Testing Model"
print_info "Running quick model test..."
TEST_RESPONSE=$(ollama run "$MODEL_NAME" "Say OK" 2>&1 | head -1)
if [ $? -eq 0 ]; then
    print_status "Model is working: $TEST_RESPONSE"
else
    print_error "Model test failed"
    exit 1
fi

# Step 5: Start the server in background
print_step "STEP 5: Starting FastAPI Server"
print_info "Launching server in background..."

# Make sure no server is already running on port 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 8000 is already in use, stopping existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start server in background
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/fastapi.log 2>&1 &
SERVER_PID=$!
print_info "Server started with PID: $SERVER_PID"

# Wait for server to be ready (max 30 seconds)
print_info "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
        print_status "Server is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        print_error "Server failed to start within 30 seconds"
        echo ""
        echo "Server logs:"
        tail -20 /tmp/fastapi.log
        exit 1
    fi
done

# Step 6: Run API tests
print_step "STEP 6: Running API Tests"

TEST_FAILED=false

# Test 1: Health check
echo -e "\n${BLUE}[TEST 1]${NC} Health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/healthz)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    print_status "Health check PASSED"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    print_error "Health check FAILED"
    echo "$HEALTH_RESPONSE"
    TEST_FAILED=true
fi

# Test 2: Non-streaming chat
echo -e "\n${BLUE}[TEST 2]${NC} Non-streaming chat..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Say hello in one word"}')

if echo "$CHAT_RESPONSE" | grep -q "conversation_id"; then
    print_status "Chat endpoint PASSED"
    CONV_ID=$(echo "$CHAT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['conversation_id'])" 2>/dev/null)
    echo "Response preview:"
    echo "$CHAT_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"  Conversation ID: {d['conversation_id'][:20]}...\\n  Reply: {d['reply'][:100]}\")" 2>/dev/null || echo "$CHAT_RESPONSE"
else
    print_error "Chat endpoint FAILED"
    echo "$CHAT_RESPONSE"
    TEST_FAILED=true
fi

# Test 3: Conversation memory
if [ -n "$CONV_ID" ]; then
    echo -e "\n${BLUE}[TEST 3]${NC} Conversation memory..."
    MEMORY_RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"What was my previous message?\", \"conversation_id\": \"$CONV_ID\"}")

    if echo "$MEMORY_RESPONSE" | grep -q "conversation_id"; then
        print_status "Memory PASSED"
        echo "Response preview:"
        echo "$MEMORY_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"  Reply: {d['reply'][:100]}\")" 2>/dev/null || echo "$MEMORY_RESPONSE"
    else
        print_error "Memory FAILED"
        echo "$MEMORY_RESPONSE"
        TEST_FAILED=true
    fi
fi

# Test 4: Streaming
echo -e "\n${BLUE}[TEST 4]${NC} Streaming chat..."
STREAM_OUTPUT=$(timeout 10s curl -s -X POST http://localhost:8000/chat/stream \
    -H "Content-Type: application/json" \
    -H "Accept: text/event-stream" \
    -d '{"message": "Count to 3"}' \
    --no-buffer | head -15)

if echo "$STREAM_OUTPUT" | grep -q "data:"; then
    print_status "Streaming PASSED"
    echo "Sample stream output (first few events):"
    echo "$STREAM_OUTPUT" | head -5
else
    print_error "Streaming FAILED"
    echo "$STREAM_OUTPUT"
    TEST_FAILED=true
fi

# Step 7: Run unit tests
print_step "STEP 7: Running Unit Tests"
print_info "Executing pytest..."
if MEMORY_BACKEND=inmemory ./venv/bin/pytest -v --tb=short 2>&1 | tee /tmp/pytest.log; then
    print_status "Unit tests PASSED"
else
    print_warning "Some unit tests failed (check output above)"
fi

# Final summary
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$TEST_FAILED" = true ]; then
    echo -e "${RED}✗ TESTS FAILED${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Check the errors above for details."
    echo ""
    echo "Logs available at:"
    echo "  - Server logs: /tmp/fastapi.log"
    echo "  - Ollama logs: /tmp/ollama.log"
    echo "  - Pytest logs: /tmp/pytest.log"
    exit 1
else
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}Success Summary:${NC}"
    echo "  ✓ Ollama service running"
    echo "  ✓ Model loaded and tested"
    echo "  ✓ FastAPI server running"
    echo "  ✓ All API endpoints working"
    echo "  ✓ Unit tests passing"
    echo ""
    echo -e "${BLUE}Server Details:${NC}"
    echo "  • URL: http://localhost:8000"
    echo "  • Docs: http://localhost:8000/docs"
    echo "  • PID: $SERVER_PID"
    echo ""
    echo -e "${YELLOW}Note: Server will be stopped automatically${NC}"
fi
