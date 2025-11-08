#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Fix Model Issues${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Check current model
CURRENT_MODEL=$(grep "OLLAMA_MODEL=" .env 2>/dev/null | cut -d'=' -f2)

if [ -z "$CURRENT_MODEL" ]; then
    echo -e "${RED}✗ .env file not found or OLLAMA_MODEL not set${NC}\n"
    exit 1
fi

echo -e "${BLUE}Current model:${NC} $CURRENT_MODEL\n"

# Check if model is crashing
echo -e "${YELLOW}Common issue:${NC} The 3b model can crash on limited resources.\n"
echo "Recommended fix: Switch to the smaller 1b model"
echo ""
echo "Available models:"
echo "  • llama3.2:1b  (Fastest, most stable, ~1GB RAM)"
echo "  • llama3.2:3b  (Balanced, ~3GB RAM)"
echo "  • llama3.3:70b (Best quality, needs GPU, ~40GB RAM)"
echo ""

read -p "Switch to llama3.2:1b? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/OLLAMA_MODEL=.*/OLLAMA_MODEL=llama3.2:1b/' .env
    else
        sed -i 's/OLLAMA_MODEL=.*/OLLAMA_MODEL=llama3.2:1b/' .env
    fi

    echo -e "${GREEN}✓ Updated .env to use llama3.2:1b${NC}\n"

    # Download the model
    echo -e "${BLUE}Downloading llama3.2:1b...${NC}\n"
    if ollama pull llama3.2:1b; then
        echo -e "\n${GREEN}✓ Model downloaded successfully!${NC}\n"
        echo "Next steps:"
        echo "  1. Stop the current server (Ctrl+C in the server terminal)"
        echo "  2. Restart: make start"
        echo "  3. Try chatting: make chat"
    else
        echo -e "\n${RED}✗ Failed to download model${NC}"
        echo "Please check your internet connection and try again"
    fi
else
    echo -e "${YELLOW}No changes made${NC}"
fi
