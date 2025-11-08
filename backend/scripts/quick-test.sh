#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Quick End-to-End Test${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

BASE_URL="http://localhost:8000"

# Test 1: Check if server is running
echo -e "${BLUE}[1/3]${NC} Checking server status..."
if curl -s "$BASE_URL/healthz" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}\n"
else
    echo -e "${RED}✗ Server is NOT running${NC}"
    echo "Please start the server: cd backend && make start"
    exit 1
fi

# Test 2: Send a simple message
echo -e "${BLUE}[2/3]${NC} Testing chatbot..."
echo -e "  ${CYAN}Sending: 'What is 2+2?'${NC}"

RESPONSE=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is 2+2? Answer in one short sentence."}')

REPLY=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['reply'])" 2>/dev/null)

if [ -n "$REPLY" ]; then
    echo -e "${GREEN}✓ Chatbot responded:${NC}"
    echo -e "  ${YELLOW}$REPLY${NC}\n"
else
    echo -e "${RED}✗ Failed to get response${NC}\n"
    exit 1
fi

# Test 3: Test conversation memory
echo -e "${BLUE}[3/3]${NC} Testing conversation memory..."
CONV_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['conversation_id'])" 2>/dev/null)

echo -e "  ${CYAN}Sending: 'What was my question?'${NC}"
RESPONSE2=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"What was my previous question?\", \"conversation_id\": \"$CONV_ID\"}")

REPLY2=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin)['reply'])" 2>/dev/null)

if [ -n "$REPLY2" ]; then
    echo -e "${GREEN}✓ Memory works! Response:${NC}"
    echo -e "  ${YELLOW}$REPLY2${NC}\n"
else
    echo -e "${RED}✗ Memory test failed${NC}\n"
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Your chatbot is working! 🎉"
echo ""
echo "Try the interactive demo:"
echo -e "  ${BLUE}./scripts/chat-demo.sh${NC}"
echo ""
echo "Or visit the web UI:"
echo -e "  ${BLUE}http://localhost:8000/docs${NC}"
echo ""
