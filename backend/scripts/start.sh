#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Agno + Ollama Chatbot Startup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print status messages
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

# Step 1: Check if Ollama is installed
echo -e "${BLUE}[1/6]${NC} Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    print_error "Ollama is not installed!"
    echo ""
    echo "Please install Ollama:"
    echo "  macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh"
    echo "  Or visit: https://ollama.com"
    echo ""
    exit 1
fi
print_status "Ollama is installed: $(ollama --version 2>&1 | head -1)"

# Step 2: Check if Ollama service is running
echo -e "\n${BLUE}[2/6]${NC} Checking Ollama service..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    print_warning "Ollama service is not running. Starting it..."

    # Try to start Ollama
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: Try to open the Ollama app
        print_info "Attempting to launch Ollama.app..."

        if [ -d "/Applications/Ollama.app" ]; then
            open -a Ollama
            print_info "Launched Ollama app from /Applications"
        elif [ -d "$HOME/Applications/Ollama.app" ]; then
            open -a Ollama
            print_info "Launched Ollama app from ~/Applications"
        else
            print_info "Ollama.app not found, trying 'ollama serve'..."
            nohup ollama serve > /tmp/ollama.log 2>&1 &
        fi
    else
        # Linux: Start as background service
        nohup ollama serve > /tmp/ollama.log 2>&1 &
    fi

    # Wait for Ollama to start (max 60 seconds)
    print_info "Waiting for Ollama to start..."
    for i in {1..60}; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            print_status "Ollama service is now running"
            break
        fi
        sleep 1
        if [ $i -eq 60 ]; then
            print_error "Ollama failed to start after 60 seconds"
            echo ""
            echo "Please start Ollama manually:"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                echo "  Option 1: Open Spotlight (Cmd+Space), type 'Ollama', press Enter"
                echo "  Option 2: Run in terminal: ollama serve"
            else
                echo "  Run: ollama serve"
            fi
            echo ""
            echo "Then run 'make start' again"
            exit 1
        fi
    done
else
    print_status "Ollama service is running"
fi

# Step 3: Load environment variables
echo -e "\n${BLUE}[3/6]${NC} Loading configuration..."
cd "$BACKEND_DIR"

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    print_status "Loaded configuration from .env"
else
    print_warning ".env file not found, using defaults"
    export OLLAMA_MODEL="llama3.2:3b"
fi

MODEL_NAME="${OLLAMA_MODEL:-llama3.2:3b}"
print_info "Target model: $MODEL_NAME"

# Step 4: Check if model exists, download if not
echo -e "\n${BLUE}[4/6]${NC} Checking model availability..."
if ollama list | grep -q "^${MODEL_NAME}"; then
    print_status "Model '$MODEL_NAME' is already available"
else
    print_warning "Model '$MODEL_NAME' not found. Downloading..."
    echo ""
    print_info "This may take a few minutes depending on model size..."

    if ollama pull "$MODEL_NAME"; then
        echo ""
        print_status "Successfully downloaded model '$MODEL_NAME'"
    else
        echo ""
        print_error "Failed to download model '$MODEL_NAME'"
        echo ""
        echo "Available models at: https://ollama.com/library"
        echo "Try a smaller model like: llama3.2:1b"
        exit 1
    fi
fi

# Step 5: Verify model works
echo -e "\n${BLUE}[5/6]${NC} Verifying model functionality..."
print_info "Testing model with a simple query..."

TEST_RESPONSE=$(ollama run "$MODEL_NAME" "Say 'OK' if you can read this" 2>&1 | head -1)
if [ $? -eq 0 ]; then
    print_status "Model is working correctly"
    print_info "Response: $TEST_RESPONSE"
else
    print_error "Model test failed"
    echo "Response: $TEST_RESPONSE"
    exit 1
fi

# Step 6: Start the FastAPI server
echo -e "\n${BLUE}[6/6]${NC} Starting FastAPI server..."
print_info "Server will start at http://localhost:8000"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found at ./venv"
    echo "Please run: python -m venv venv && ./venv/bin/pip install -r requirements.txt"
    exit 1
fi

# Check if dependencies are installed
if ! ./venv/bin/python -c "import fastapi" 2>/dev/null; then
    print_warning "Dependencies not installed. Installing now..."
    ./venv/bin/pip install -r requirements.txt
fi

print_status "Starting server with uvicorn..."
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Server is ready!${NC}"
echo -e "  • Health check: ${BLUE}http://localhost:8000/healthz${NC}"
echo -e "  • Chat API:     ${BLUE}http://localhost:8000/chat${NC}"
echo -e "  • Streaming:    ${BLUE}http://localhost:8000/chat/stream${NC}"
echo -e "  • API Docs:     ${BLUE}http://localhost:8000/docs${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run the server
exec ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
