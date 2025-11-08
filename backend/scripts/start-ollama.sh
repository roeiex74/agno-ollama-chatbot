#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Ollama...${NC}\n"

# Check if Ollama is already running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Ollama is already running!"
    exit 0
fi

# Try to start Ollama
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Attempting to launch Ollama on macOS..."

    if [ -d "/Applications/Ollama.app" ]; then
        echo "Found Ollama.app in /Applications"
        open -a Ollama
        echo -e "${GREEN}✓${NC} Launched Ollama app"
    elif [ -d "$HOME/Applications/Ollama.app" ]; then
        echo "Found Ollama.app in ~/Applications"
        open -a Ollama
        echo -e "${GREEN}✓${NC} Launched Ollama app"
    else
        echo "Ollama.app not found, starting with 'ollama serve'..."
        ollama serve &
        echo -e "${GREEN}✓${NC} Started 'ollama serve' in background"
    fi
else
    # Linux
    echo "Starting Ollama on Linux..."
    ollama serve &
    echo -e "${GREEN}✓${NC} Started 'ollama serve' in background"
fi

# Wait for Ollama to be ready
echo -e "\n${BLUE}Waiting for Ollama to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Ollama is ready!"
        echo ""
        echo "You can now:"
        echo "  - Run models: ollama run llama3.2:3b"
        echo "  - List models: ollama list"
        echo "  - Start server: make start"
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${YELLOW}⚠${NC} Ollama did not start within 30 seconds"
echo ""
echo "Please try manually:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  1. Open Spotlight (Cmd+Space)"
    echo "  2. Type 'Ollama' and press Enter"
    echo "  OR run: ollama serve"
else
    echo "  Run: ollama serve"
fi
exit 1
