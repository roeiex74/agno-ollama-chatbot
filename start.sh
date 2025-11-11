#!/bin/bash

#############################################
# Agno Ollama Chatbot - Full Stack Launcher
#############################################
#
# This script handles complete setup and launch:
# - Backend: venv creation, dependencies, Ollama setup
# - Frontend: npm dependencies installation
# - Runs both backend and frontend concurrently
#
# USAGE:
#   ./start.sh
#
# REQUIREMENTS:
#   - Python 3.10+
#   - Node.js 20+
#   - Ollama
#   - PostgreSQL database (Neon: https://neon.tech/)
#
# CONFIGURATION:
#   - Edit backend/.env to set POSTGRES_URL
#   - See QUICK_START.md for detailed instructions
#
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory (project root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOGS_DIR="$PROJECT_ROOT/logs"

# Process IDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""
OLLAMA_PID=""

# Default configuration
DEFAULT_BACKEND_PORT=8000
DEFAULT_FRONTEND_PORT=5173

#############################################
# Utility Functions
#############################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
    echo ""
}

# Cleanup function for exit
cleanup() {
    echo ""
    log_info "Shutting down services..."

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log_info "Stopping frontend (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
        wait "$FRONTEND_PID" 2>/dev/null || true
    fi

    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        log_info "Stopping backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi

    if [ -n "$OLLAMA_PID" ] && kill -0 "$OLLAMA_PID" 2>/dev/null; then
        log_info "Stopping Ollama service (PID: $OLLAMA_PID)..."
        kill "$OLLAMA_PID" 2>/dev/null || true
        wait "$OLLAMA_PID" 2>/dev/null || true
    fi

    echo ""
    log_success "All services stopped gracefully"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

#############################################
# Dependency Checks
#############################################

check_system_dependencies() {
    log_section "Checking System Dependencies"

    local issues=0

    # Check Python 3.10+
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | awk '{print $2}')
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

        if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 10 ]; then
            log_success "Python $PYTHON_VERSION found"
        else
            log_error "Python 3.10+ required, found $PYTHON_VERSION"
            issues=$((issues + 1))
        fi
    else
        log_error "Python 3 not found"
        issues=$((issues + 1))
    fi

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js $NODE_VERSION found"
    else
        log_error "Node.js not found"
        log_info "Install from: https://nodejs.org/"
        issues=$((issues + 1))
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION found"
    else
        log_error "npm not found"
        issues=$((issues + 1))
    fi

    # Check Ollama
    if command -v ollama &> /dev/null; then
        OLLAMA_VERSION=$(ollama --version 2>&1 | head -n1 || echo "unknown")
        log_success "Ollama found: $OLLAMA_VERSION"
    else
        log_error "Ollama not found"
        log_info "Install from: https://ollama.ai/download"
        issues=$((issues + 1))
    fi

    if [ $issues -gt 0 ]; then
        log_error "Dependency check failed with $issues issues"
        exit 1
    fi

    log_success "All system dependencies satisfied"
}

#############################################
# Backend Setup
#############################################

setup_backend() {
    log_section "Setting Up Backend"

    cd "$BACKEND_DIR"

    # Create logs directory
    mkdir -p "$LOGS_DIR"

    # Create virtual environment if needed
    if [ ! -d "venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv venv
        log_success "Virtual environment created"
    else
        log_success "Virtual environment already exists"
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --quiet --upgrade pip

    # Install dependencies
    log_info "Installing Python dependencies..."
    if pip install --quiet -r requirements.txt; then
        log_success "Python dependencies installed"
    else
        log_error "Failed to install Python dependencies"
        exit 1
    fi

    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        log_info "Creating backend .env file..."

        # Check if .env.example exists and use it, otherwise create default
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Backend .env file created from .env.example"
            log_warning "IMPORTANT: Edit backend/.env and add your POSTGRES_URL connection string!"
            log_info "Get a free PostgreSQL database at: https://neon.tech/"
        else
            cat > .env <<EOF
# Environment
ENV=local

# Ollama Configuration
OLLAMA_MODEL=llama3.2:1b
OLLAMA_HOST=http://localhost:11434
MODEL_TIMEOUT_S=60

# Database Configuration (REQUIRED - Replace with your Neon connection string)
POSTGRES_URL=postgresql+psycopg://user:password@host.region.aws.neon.tech/db?sslmode=require
MAX_HISTORY=20

# Server Configuration
HOST=0.0.0.0
PORT=$DEFAULT_BACKEND_PORT
EOF
            log_success "Backend .env file created"
            log_warning "IMPORTANT: Edit backend/.env and add your POSTGRES_URL connection string!"
            log_info "Get a free PostgreSQL database at: https://neon.tech/"
        fi
    else
        log_success "Backend .env file already exists"

        # Check if POSTGRES_URL is configured
        if grep -q "POSTGRES_URL=postgresql" .env; then
            log_info "PostgreSQL configuration found"
        else
            log_warning "Make sure to configure POSTGRES_URL in backend/.env"
        fi
    fi

    # Create data directory
    mkdir -p data

    log_success "Backend setup complete"
}

#############################################
# Frontend Setup
#############################################

setup_frontend() {
    log_section "Setting Up Frontend"

    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm dependencies..."
        if npm install --legacy-peer-deps; then
            log_success "npm dependencies installed"
        else
            log_error "Failed to install npm dependencies"
            exit 1
        fi
    else
        log_info "Checking for updated dependencies..."
        if npm install --legacy-peer-deps; then
            log_success "npm dependencies up to date"
        else
            log_warning "Some dependencies may need attention"
        fi
    fi

    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        log_info "Creating frontend .env file..."
        cat > .env <<EOF
VITE_API_BASE_URL=http://localhost:$DEFAULT_BACKEND_PORT
EOF
        log_success "Frontend .env file created"
    else
        log_success "Frontend .env file already exists"
    fi

    log_success "Frontend setup complete"
}

#############################################
# Ollama Setup
#############################################

setup_ollama() {
    log_section "Setting Up Ollama"

    # Load backend config
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        MODEL="${OLLAMA_MODEL:-llama3.2:1b}"
    else
        MODEL="llama3.2:1b"
    fi

    # Check if Ollama is already running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        log_success "Ollama service already running"
    else
        log_info "Starting Ollama service..."
        ollama serve > "$LOGS_DIR/ollama.log" 2>&1 &
        OLLAMA_PID=$!

        # Wait for Ollama to be ready
        local max_attempts=30
        local attempt=0

        while [ $attempt -lt $max_attempts ]; do
            if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
                log_success "Ollama service started (PID: $OLLAMA_PID)"
                break
            fi
            sleep 1
            attempt=$((attempt + 1))
        done

        if [ $attempt -eq $max_attempts ]; then
            log_error "Ollama service failed to start"
            exit 1
        fi
    fi

    # Check if model is available
    log_info "Checking model: $MODEL"

    if ollama list | grep -q "$MODEL"; then
        log_success "Model $MODEL already available"
    else
        log_info "Pulling model $MODEL (this may take several minutes)..."
        if ollama pull "$MODEL"; then
            log_success "Model $MODEL downloaded successfully"
        else
            log_error "Failed to pull model $MODEL"
            exit 1
        fi
    fi
}

#############################################
# Start Services
#############################################

start_backend() {
    log_section "Starting Backend Server"

    cd "$BACKEND_DIR"
    source venv/bin/activate

    # Load configuration
    if [ -f ".env" ]; then
        source .env
        BACKEND_PORT="${PORT:-$DEFAULT_BACKEND_PORT}"
    else
        BACKEND_PORT="$DEFAULT_BACKEND_PORT"
    fi

    log_info "Starting backend on port $BACKEND_PORT..."
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > "$LOGS_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!

    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$BACKEND_PORT/healthz" > /dev/null 2>&1; then
            log_success "Backend ready (PID: $BACKEND_PID)"
            break
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend failed to start. Check logs at: $LOGS_DIR/backend.log"
        exit 1
    fi

    # Health check
    HEALTH_RESPONSE=$(curl -s "http://localhost:$BACKEND_PORT/healthz")
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
}

start_frontend() {
    log_section "Starting Frontend Development Server"

    cd "$FRONTEND_DIR"

    log_info "Starting frontend on port $DEFAULT_FRONTEND_PORT..."
    npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$DEFAULT_FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend ready (PID: $FRONTEND_PID)"
            break
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_warning "Frontend may still be starting. Check logs at: $LOGS_DIR/frontend.log"
    fi
}

#############################################
# Main Flow
#############################################

main() {
    clear

    echo ""
    echo -e "${CYAN}=========================================="
    echo "  Agno Ollama Chatbot"
    echo "  Full Stack Launcher"
    echo -e "==========================================${NC}"
    echo ""

    # Setup phase
    check_system_dependencies
    setup_backend
    setup_frontend
    setup_ollama

    # Launch phase
    start_backend
    start_frontend

    # Summary
    log_section "Services Running"

    log_success "Backend:  http://localhost:${BACKEND_PORT:-$DEFAULT_BACKEND_PORT}"
    log_success "Frontend: http://localhost:$DEFAULT_FRONTEND_PORT"
    echo ""
    log_info "Process IDs:"
    echo "  - Backend:  $BACKEND_PID"
    echo "  - Frontend: $FRONTEND_PID"
    [ -n "$OLLAMA_PID" ] && echo "  - Ollama:   $OLLAMA_PID"
    echo ""
    log_info "Logs directory: $LOGS_DIR"
    echo ""
    log_info "Press Ctrl+C to stop all services"
    echo ""

    # Keep script running and tail logs
    log_info "Tailing backend logs (Ctrl+C to stop)..."
    echo ""

    # Wait indefinitely (cleanup will happen on exit)
    wait
}

# Run main function
main
