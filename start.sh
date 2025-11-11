#!/bin/bash
# set -e

#############################################
# Agno Ollama Chatbot - Full Stack Launcher
#############################################
# REQUIREMENTS: Python 3.10+, Node.js 20+, Ollama, PostgreSQL
# USAGE: ./start.sh

# Colors
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' C='\033[0;36m' NC='\033[0m'

# Paths
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$ROOT/logs"
mkdir -p "$LOGS_DIR"

# PIDs
BACKEND_PID="" FRONTEND_PID="" OLLAMA_PID=""

# Logging
log_info() { echo -e "${B}[INFO]${NC} $1"; }
log_success() { echo -e "${G}✓${NC} $1"; }
log_error() { echo -e "${R}✗${NC} $1"; exit 1; }
log_section() { echo -e "\n${C}$1${NC}\n"; }

# Cleanup on exit
cleanup() {
    echo -e "\n${B}Shutting down...${NC}"
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$OLLAMA_PID" ] && kill "$OLLAMA_PID" 2>/dev/null || true
    log_success "Services stopped"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Check command exists
check_cmd() {
    command -v "$1" &>/dev/null || log_error "$1 not found. Install: $2"
}

# Wait for service
wait_for() {
    local url=$1 max=30 i=0
    while [ $i -lt $max ]; do
        curl -s "$url" >/dev/null 2>&1 && return 0
        sleep 1; i=$((i+1))
    done
    return 1
}

#############################################
# Dependency Check
#############################################
log_section "Checking Dependencies"
check_cmd python3 "https://python.org"
check_cmd node "https://nodejs.org"
check_cmd npm "https://nodejs.org"
check_cmd ollama "https://ollama.ai"

PY_VER=$(python3 --version | awk '{print $2}')
PY_MAJ=$(echo $PY_VER | cut -d. -f1)
PY_MIN=$(echo $PY_VER | cut -d. -f2)
([ "$PY_MAJ" -eq 3 ] && [ "$PY_MIN" -ge 10 ]) || [ "$PY_MAJ" -gt 3 ] || log_error "Python 3.10+ required (found $PY_VER)"
log_success "Python $PY_VER, Node $(node --version), Ollama $(ollama --version 2>&1 | head -1)"

#############################################
# Backend Setup
#############################################
log_section "Setting Up Backend"
cd "$ROOT/backend"

[ -f ".env" ] || log_error ".env not found. Copy: cp backend/.env.example backend/.env"
grep -q "POSTGRES_URL=" .env || log_error "POSTGRES_URL missing in .env"

[ -d "venv" ] || { log_info "Creating venv..."; python3 -m venv venv; }
source venv/bin/activate
log_info "Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
log_success "Backend ready"

#############################################
# Frontend Setup
#############################################
log_section "Setting Up Frontend"
cd "$ROOT/frontend"

[ -f ".env" ] || log_error ".env not found. Copy: cp frontend/.env.example frontend/.env"

log_info "Installing npm packages..."
npm install --silent --legacy-peer-deps 2>/dev/null
log_success "Frontend ready"

#############################################
# Start Ollama
#############################################
log_section "Starting Ollama"
cd "$ROOT/backend"
source .env
MODEL="${OLLAMA_MODEL:-llama3.2:1b}"

if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    log_info "Starting Ollama service..."
    ollama serve >"$LOGS_DIR/ollama.log" 2>&1 &
    OLLAMA_PID=$!
    wait_for "http://localhost:11434/api/tags" || log_error "Ollama failed to start"
fi

ollama list | grep -q "$MODEL" || {
    log_info "Pulling model $MODEL..."
    ollama pull "$MODEL" || log_error "Failed to pull model"
}
log_success "Ollama ready with $MODEL"

#############################################
# Start Backend
#############################################
log_section "Starting Backend"
cd "$ROOT/backend"
source venv/bin/activate
source .env
PORT="${PORT:-8000}"

python3 -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" >"$LOGS_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
wait_for "http://localhost:$PORT/healthz" || log_error "Backend failed (check $LOGS_DIR/backend.log)"
log_success "Backend running on http://localhost:$PORT"

#############################################
# Start Frontend
#############################################
log_section "Starting Frontend"
cd "$ROOT/frontend"
npm run dev >"$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 3
log_success "Frontend running on http://localhost:5173"

#############################################
# Summary
#############################################
log_section "Services Running"
echo -e "${G}Backend:${NC}  http://localhost:$PORT"
echo -e "${G}Frontend:${NC} http://localhost:5173"
echo -e "${B}Logs:${NC}     $LOGS_DIR"
echo -e "\n${Y}Press Ctrl+C to stop all services${NC}\n"

wait
