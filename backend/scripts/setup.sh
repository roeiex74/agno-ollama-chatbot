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
echo -e "${BLUE}  Agno + Ollama Chatbot Setup${NC}"
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

cd "$BACKEND_DIR"

# Step 1: Check Python version
echo -e "${BLUE}[1/5]${NC} Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed!"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
print_status "Python $PYTHON_VERSION is installed"

# Check if Python version is 3.10 or higher
REQUIRED_VERSION="3.10"
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"; then
    print_error "Python 3.10 or higher is required (found $PYTHON_VERSION)"
    exit 1
fi

# Step 2: Create virtual environment
echo -e "\n${BLUE}[2/5]${NC} Setting up virtual environment..."
if [ -d "venv" ]; then
    print_warning "Virtual environment already exists, skipping creation"
else
    python3 -m venv venv
    print_status "Created virtual environment"
fi

# Step 3: Upgrade pip
echo -e "\n${BLUE}[3/5]${NC} Upgrading pip..."
./venv/bin/pip install --upgrade pip --quiet
print_status "Pip upgraded to latest version"

# Step 4: Install dependencies
echo -e "\n${BLUE}[4/5]${NC} Installing dependencies..."
print_info "This may take a few minutes..."
./venv/bin/pip install -r requirements.txt --quiet
print_status "All dependencies installed"

# Step 5: Create .env file if it doesn't exist
echo -e "\n${BLUE}[5/5]${NC} Configuring environment..."
if [ -f ".env" ]; then
    print_warning ".env file already exists, skipping"
else
    cp .env.example .env
    print_status "Created .env file from .env.example"
fi

# Create data directory for SQLite
mkdir -p data
print_status "Created data directory"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit ${BLUE}.env${NC} if you want to customize settings"
echo -e "  2. Make sure Ollama is installed: ${BLUE}ollama --version${NC}"
echo -e "  3. Start the server: ${BLUE}make start${NC} or ${BLUE}./scripts/start.sh${NC}"
echo ""
