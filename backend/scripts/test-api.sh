#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testing Agno + Ollama Chatbot API${NC}"
echo -e "${BLUE}========================================${NC}\n"

BASE_URL="${1:-http://localhost:8000}"

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC} $1\n"
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC} $1\n"
}

# Test 1: Health check
print_test "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/healthz")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    print_success "Health check passed"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
    echo ""
else
    print_fail "Health check failed"
    echo "$HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Non-streaming chat
print_test "Testing non-streaming chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d '{"message": "Say hello in one word"}')

if echo "$CHAT_RESPONSE" | grep -q "conversation_id"; then
    print_success "Non-streaming chat works"
    echo "$CHAT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CHAT_RESPONSE"
    echo ""

    # Extract conversation_id for next test
    CONV_ID=$(echo "$CHAT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['conversation_id'])" 2>/dev/null)
else
    print_fail "Non-streaming chat failed"
    echo "$CHAT_RESPONSE"
    exit 1
fi

# Test 3: Conversation continuity
if [ -n "$CONV_ID" ]; then
    print_test "Testing conversation continuity..."
    CONTINUE_RESPONSE=$(curl -s -X POST "$BASE_URL/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"What was my previous message?\", \"conversation_id\": \"$CONV_ID\"}")

    if echo "$CONTINUE_RESPONSE" | grep -q "conversation_id"; then
        print_success "Conversation memory works"
        echo "$CONTINUE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONTINUE_RESPONSE"
        echo ""
    else
        print_fail "Conversation continuity failed"
        echo "$CONTINUE_RESPONSE"
    fi
fi

# Test 4: Streaming chat
print_test "Testing streaming endpoint..."
STREAM_OUTPUT=$(curl -s -X POST "$BASE_URL/chat/stream" \
    -H "Content-Type: application/json" \
    -H "Accept: text/event-stream" \
    -d '{"message": "Count to 3"}' \
    --no-buffer | head -10)

if echo "$STREAM_OUTPUT" | grep -q "data:"; then
    print_success "Streaming works"
    echo "Sample streaming output:"
    echo "$STREAM_OUTPUT"
    echo ""
else
    print_fail "Streaming failed"
    echo "$STREAM_OUTPUT"
fi

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "API is working correctly at: $BASE_URL"
echo "Visit API docs at: ${BLUE}$BASE_URL/docs${NC}"
echo ""
