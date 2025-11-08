#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

BASE_URL="http://localhost:8000"

clear

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     💬 Interactive Chatbot Demo           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}\n"

# Check if server is running
echo -e "${BLUE}Checking connection...${NC}"
if ! curl -s "$BASE_URL/healthz" > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Server is not running!${NC}\n"
    echo "Please start the server first in another terminal:"
    echo -e "  ${YELLOW}cd backend${NC}"
    echo -e "  ${YELLOW}make start${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ Connected to chatbot server!${NC}\n"

echo -e "${BOLD}How to use:${NC}"
echo -e "  • Type your message and press ${YELLOW}Enter${NC}"
echo -e "  • The ${MAGENTA}AI Bot${NC} will respond"
echo -e "  • Type ${YELLOW}'quit'${NC}, ${YELLOW}'exit'${NC}, or ${YELLOW}'bye'${NC} to stop"
echo -e "\n${CYAN}──────────────────────────────────────────${NC}\n"

# Generate a conversation ID
CONV_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "chat-$(date +%s)")

MESSAGE_COUNT=0

while true; do
    # Prompt for user input with clear label
    echo -e -n "${BLUE}${BOLD}You:${NC} "
    read USER_INPUT

    # Check for exit commands
    if [[ "$USER_INPUT" == "quit" ]] || [[ "$USER_INPUT" == "exit" ]] || [[ "$USER_INPUT" == "bye" ]]; then
        echo -e "\n${GREEN}Thanks for chatting! Goodbye! 👋${NC}\n"
        exit 0
    fi

    # Skip empty input
    if [ -z "$USER_INPUT" ]; then
        continue
    fi

    MESSAGE_COUNT=$((MESSAGE_COUNT + 1))

    # Show thinking indicator
    echo -e "${MAGENTA}${BOLD}Bot:${NC} ${CYAN}(thinking...)${NC}\r\c"

    # Send message to chatbot with timeout
    RESPONSE=$(timeout 30s curl -s -X POST "$BASE_URL/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$USER_INPUT\", \"conversation_id\": \"$CONV_ID\"}" 2>&1)

    # Clear the thinking line
    echo -e "\033[2K\r\c"

    # Check if request timed out
    if [ $? -eq 124 ]; then
        echo -e "${MAGENTA}${BOLD}Bot:${NC} ${RED}[Request timed out. The model might be overloaded. Try again.]${NC}\n"
        continue
    fi

    # Extract and display the reply
    REPLY=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('reply', ''))" 2>/dev/null)

    if [ -n "$REPLY" ]; then
        echo -e "${MAGENTA}${BOLD}Bot:${NC} $REPLY\n"
    else
        # Check for specific errors
        if echo "$RESPONSE" | grep -q "500"; then
            echo -e "${MAGENTA}${BOLD}Bot:${NC} ${RED}[Error: Model crashed. Please restart the server with a smaller model.]${NC}"
            echo -e "${YELLOW}Try: Edit .env and set OLLAMA_MODEL=llama3.2:1b, then restart.${NC}\n"
        elif echo "$RESPONSE" | grep -q "conversation_id"; then
            echo -e "${MAGENTA}${BOLD}Bot:${NC} ${RED}[Error: Could not parse response]${NC}"
            echo -e "${YELLOW}Raw response: $RESPONSE${NC}\n"
        else
            echo -e "${MAGENTA}${BOLD}Bot:${NC} ${RED}[Error: No response from server]${NC}"
            echo -e "${YELLOW}Server might be down. Check if 'make start' is running.${NC}\n"
        fi
    fi
done
