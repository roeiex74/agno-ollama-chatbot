#!/bin/bash

#############################################
# Agno Chatbot Backend - Setup Script
#############################################
# 
# This script performs complete automated setup:
# - Dependency checking
# - Ollama installation and model setup
# - Python virtual environment
# - FastAPI server startup
# - Sanity check validation
# - Comprehensive metrics collection
#
#############################################

# set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
METRICS_DIR="$BACKEND_DIR/metrics"
VENV_DIR="$BACKEND_DIR/venv"
LOGS_DIR="$BACKEND_DIR/logs"

# Metrics tracking
START_TIME=$(date +%s)
METRICS_FILE="$METRICS_DIR/setup_metrics_$(date +%Y%m%d_%H%M%S).json"

# Process IDs for cleanup
OLLAMA_PID=""
SERVER_PID=""

# Default configuration
DEFAULT_MODEL="llama3.2:3b"
DEFAULT_PORT=8000
DEFAULT_HOST="0.0.0.0"

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

# Cleanup function for exit
cleanup() {
    log_info "Cleaning up background processes..."
    
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        log_info "Stopping FastAPI server (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    
    if [ -n "$OLLAMA_PID" ] && kill -0 "$OLLAMA_PID" 2>/dev/null; then
        log_info "Stopping Ollama service (PID: $OLLAMA_PID)..."
        kill "$OLLAMA_PID" 2>/dev/null || true
        wait "$OLLAMA_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Timer function
start_timer() {
    echo $(date +%s)
}

end_timer() {
    local start=$1
    local end=$(date +%s)
    echo $((end - start))
}

#############################################
# Metrics Collection
#############################################

init_metrics() {
    mkdir -p "$METRICS_DIR"
    mkdir -p "$LOGS_DIR"
    
    cat > "$METRICS_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "setup_start": $(date +%s),
  "steps": {}
}
EOF
}

update_metric() {
    local step_name=$1
    local step_status=$2
    local duration=$3
    local details=$4
    
    # Read current metrics
    local temp_file=$(mktemp)
    
    # Use python to update JSON (more reliable than jq which might not be installed)
    python3 -c "
import json
import sys

with open('$METRICS_FILE', 'r') as f:
    data = json.load(f)

data['steps']['$step_name'] = {
    'status': '$step_status',
    'duration_seconds': $duration,
    'details': '$details'
}

with open('$METRICS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null || true
}

finalize_metrics() {
    local total_duration=$1
    local final_status=$2
    
    python3 -c "
import json

with open('$METRICS_FILE', 'r') as f:
    data = json.load(f)

data['setup_end'] = $(date +%s)
data['total_duration_seconds'] = $total_duration
data['overall_status'] = '$final_status'

with open('$METRICS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null || true
    
    log_success "Metrics saved to: $METRICS_FILE"
}

#############################################
# Dependency Checks
#############################################

check_dependencies() {
    log_info "Checking system dependencies..."
    local timer=$(start_timer)
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
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        log_success "pip3 found"
    else
        log_error "pip3 not found"
        issues=$((issues + 1))
    fi
    
    # Check curl
    if command -v curl &> /dev/null; then
        log_success "curl found"
    else
        log_error "curl not found (required for API testing)"
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
    
    local duration=$(end_timer $timer)
    
    if [ $issues -gt 0 ]; then
        update_metric "dependency_check" "failed" $duration "$issues issues found"
        log_error "Dependency check failed with $issues issues"
        exit 1
    fi
    
    update_metric "dependency_check" "success" $duration "all dependencies found"
    log_success "All dependencies satisfied"
}

#############################################
# Ollama Setup
#############################################

setup_ollama() {
    log_info "Setting up Ollama service..."
    local timer=$(start_timer)
    
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
            local duration=$(end_timer $timer)
            update_metric "ollama_setup" "failed" $duration "service did not start"
            log_error "Ollama service failed to start"
            exit 1
        fi
    fi
    
    # Load model from .env or use default
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        MODEL="${OLLAMA_MODEL:-$DEFAULT_MODEL}"
    else
        MODEL="$DEFAULT_MODEL"
    fi
    
    log_info "Checking model: $MODEL"
    
    # Check if model is available
    if ollama list | grep -q "$MODEL"; then
        log_success "Model $MODEL already available"
        local duration=$(end_timer $timer)
        update_metric "ollama_setup" "success" $duration "model already available"
    else
        log_info "Pulling model $MODEL (this may take several minutes)..."
        local model_timer=$(start_timer)
        
        if ollama pull "$MODEL" > "$LOGS_DIR/ollama_pull.log" 2>&1; then
            local model_duration=$(end_timer $model_timer)
            log_success "Model $MODEL downloaded successfully (took ${model_duration}s)"
            local duration=$(end_timer $timer)
            update_metric "ollama_setup" "success" $duration "model pulled in ${model_duration}s"
        else
            local duration=$(end_timer $timer)
            update_metric "ollama_setup" "failed" $duration "model pull failed"
            log_error "Failed to pull model $MODEL"
            exit 1
        fi
    fi
}

#############################################
# Python Environment Setup
#############################################

setup_python_env() {
    log_info "Setting up Python environment..."
    local timer=$(start_timer)
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv "$VENV_DIR"
        log_success "Virtual environment created"
    else
        log_success "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --quiet --upgrade pip
    
    # Install dependencies
    log_info "Installing dependencies from requirements.txt..."
    if pip install --quiet -r requirements.txt; then
        log_success "Dependencies installed"
    else
        local duration=$(end_timer $timer)
        update_metric "python_environment" "failed" $duration "pip install failed"
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    # Verify critical imports
    log_info "Verifying critical imports..."
    python3 -c "
import fastapi
import agno
import ollama
import uvicorn
print('All imports successful')
" 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "All critical imports verified"
        local duration=$(end_timer $timer)
        update_metric "python_environment" "success" $duration "environment ready"
    else
        local duration=$(end_timer $timer)
        update_metric "python_environment" "failed" $duration "import verification failed"
        log_error "Import verification failed"
        exit 1
    fi
}

#############################################
# Configuration Setup
#############################################

setup_configuration() {
    log_info "Setting up configuration..."
    local timer=$(start_timer)
    
    cd "$BACKEND_DIR"
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        log_info "Creating .env file with defaults..."
        cat > .env <<EOF
# Environment
ENV=local

# Ollama Configuration
OLLAMA_MODEL=$DEFAULT_MODEL
OLLAMA_HOST=http://localhost:11434
MODEL_TIMEOUT_S=60

# Memory Configuration
MEMORY_BACKEND=sqlite
MEMORY_PATH=./data/memory.sqlite
MAX_HISTORY=20

# Server Configuration
HOST=$DEFAULT_HOST
PORT=$DEFAULT_PORT
EOF
        log_success ".env file created"
    else
        log_success ".env file already exists"
    fi
    
    # Create data directory
    mkdir -p data
    log_success "Data directory ready"
    
    local duration=$(end_timer $timer)
    update_metric "configuration" "success" $duration "config ready"
}

#############################################
# Server Startup and Validation
#############################################

start_and_validate_server() {
    log_info "Starting FastAPI server..."
    local timer=$(start_timer)
    
    cd "$BACKEND_DIR"
    source "$VENV_DIR/bin/activate"
    
    # Load configuration
    if [ -f ".env" ]; then
        source .env
        PORT="${PORT:-$DEFAULT_PORT}"
    else
        PORT="$DEFAULT_PORT"
    fi
    
    # Start server in background
    log_info "Starting server on port $PORT..."
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" > "$LOGS_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    log_info "Waiting for server to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$PORT/healthz" > /dev/null 2>&1; then
            log_success "Server is ready (PID: $SERVER_PID)"
            break
        fi
        
        sleep 1
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        local duration=$(end_timer $timer)
        update_metric "server_startup" "failed" $duration "server did not start"
        log_error "Server failed to start. Check logs at: $LOGS_DIR/server.log"
        exit 1
    fi
    
    # Health check
    log_info "Performing health check..."
    HEALTH_RESPONSE=$(curl -s "http://localhost:$PORT/healthz")
    
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
        log_success "Health check passed"
        log_info "Server details: $HEALTH_RESPONSE"
    else
        local duration=$(end_timer $timer)
        update_metric "server_startup" "failed" $duration "health check failed"
        log_error "Health check failed"
        exit 1
    fi
    
    local duration=$(end_timer $timer)
    update_metric "server_startup" "success" $duration "server running on port $PORT"
}

#############################################
# Sanity Check
#############################################

run_sanity_check() {
    log_info "Running sanity check..."
    local timer=$(start_timer)
    
    # Load port
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        PORT="${PORT:-$DEFAULT_PORT}"
    else
        PORT="$DEFAULT_PORT"
    fi
    
    # Test message
    log_info "Sending test message to /chat endpoint..."
    local chat_timer=$(start_timer)
    
    # Use temp file for reliable parsing
    local temp_response=$(mktemp)
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$temp_response" -X POST "http://localhost:$PORT/chat" \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello"}')
    
    RESPONSE_BODY=$(cat "$temp_response")
    rm -f "$temp_response"
    
    local chat_duration=$(end_timer $chat_timer)
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Validate response structure
        if echo "$RESPONSE_BODY" | grep -q '"conversation_id"' && echo "$RESPONSE_BODY" | grep -q '"reply"'; then
            log_success "Sanity check passed!"
            log_info "Response time: ${chat_duration}s"
            log_info "Agent response preview: $(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('reply', '')[:100])" 2>/dev/null || echo "N/A")"
            
            local duration=$(end_timer $timer)
            update_metric "sanity_check" "success" $duration "response in ${chat_duration}s"
        else
            local duration=$(end_timer $timer)
            update_metric "sanity_check" "failed" $duration "invalid response structure"
            log_error "Invalid response structure"
            log_error "Response: $RESPONSE_BODY"
            exit 1
        fi
    else
        local duration=$(end_timer $timer)
        update_metric "sanity_check" "failed" $duration "HTTP $HTTP_CODE"
        log_error "Sanity check failed with HTTP $HTTP_CODE"
        log_error "Response: $RESPONSE_BODY"
        exit 1
    fi
}

#############################################
# Main Setup Flow
#############################################

main() {
    echo ""
    echo "=========================================="
    echo "  Agno Chatbot Backend - Setup Script"
    echo "=========================================="
    echo ""
    
    # Initialize metrics
    init_metrics
    
    # Run setup steps
    check_dependencies
    setup_ollama
    setup_python_env
    setup_configuration
    start_and_validate_server
    run_sanity_check
    
    # Finalize metrics
    local total_duration=$(end_timer $START_TIME)
    finalize_metrics $total_duration "success"
    
    echo ""
    echo "=========================================="
    log_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    log_info "Total setup time: ${total_duration}s"
    log_info "Server running on port: ${PORT:-$DEFAULT_PORT}"
    log_info "Logs directory: $LOGS_DIR"
    log_info "Metrics saved: $METRICS_FILE"
    echo ""
    log_info "To interact with the chatbot, run:"
    echo "  cd $BACKEND_DIR/scripts && ./chat.sh"
    echo ""
    log_info "The server will continue running in the background (PID: $SERVER_PID)"
    log_info "To stop it, run: kill $SERVER_PID"
    echo ""
}

# Run main function
main

