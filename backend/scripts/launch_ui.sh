#!/bin/bash

#############################################
# Agno Chatbot - Launch Streamlit UI
#############################################
# 
# Launches the Streamlit chat UI
# Requires backend server to be running
#
#############################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$BACKEND_DIR/venv"

# Configuration
DEFAULT_PORT=8501
DEFAULT_HOST="localhost"
API_PORT=8000

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo "=========================================="
echo "  Agno Chatbot - Streamlit UI Launcher"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    log_error "Virtual environment not found at $VENV_DIR"
    log_info "Please run setup.sh first:"
    echo "  cd $BACKEND_DIR/scripts"
    echo "  ./setup.sh"
    echo ""
    exit 1
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Check if backend server is running
log_info "Checking backend server..."
if ! curl -s "http://localhost:$API_PORT/healthz" > /dev/null 2>&1; then
    log_error "Backend server is not running at http://localhost:$API_PORT"
    echo ""
    log_info "Please start the backend server first:"
    echo "  cd $BACKEND_DIR/scripts"
    echo "  ./setup.sh"
    echo ""
    exit 1
fi

log_success "Backend server is online"

# Check if streamlit is installed
if ! python3 -c "import streamlit" 2>/dev/null; then
    log_info "Streamlit not found. Installing..."
    pip install streamlit>=1.28.0
fi

# Launch Streamlit
log_info "Launching Streamlit UI..."
echo ""
log_info "UI will be available at: http://localhost:$DEFAULT_PORT"
log_info "Press Ctrl+C to stop the UI server"
echo ""

cd "$BACKEND_DIR"
streamlit run chat_ui.py \
    --server.port=$DEFAULT_PORT \
    --server.address=$DEFAULT_HOST \
    --browser.serverAddress=$DEFAULT_HOST \
    --server.headless=false

