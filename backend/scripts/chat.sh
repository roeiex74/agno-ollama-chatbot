#!/bin/bash

#############################################
# Agno Chatbot Backend - Interactive Chat
#############################################
# 
# Simple interactive chat CLI for testing
# the Agno chatbot agent with:
# - Non-streaming request/response
# - Metrics collection per message
# - Session persistence
# - Error handling
#
#############################################

# set -e  # Exit on error (but we'll handle errors gracefully)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
METRICS_DIR="$BACKEND_DIR/metrics"

# Session state
SESSION_ID=$(date +%Y%m%d_%H%M%S)
METRICS_FILE="$METRICS_DIR/chat_session_${SESSION_ID}.json"
CONVERSATION_ID=""
MESSAGE_COUNT=0
SESSION_START=$(date +%s)
TOTAL_RESPONSE_TIME=0
ERROR_COUNT=0

# Server configuration
DEFAULT_PORT=8000
DEFAULT_HOST="localhost"

#############################################
# Utility Functions
#############################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

print_separator() {
    echo -e "${CYAN}──────────────────────────────────────────${NC}"
}

print_user_prompt() {
    echo -ne "${GREEN}You:${NC} "
}

print_assistant_label() {
    echo -e "${MAGENTA}Assistant:${NC}"
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

#############################################
# Metrics Functions
#############################################

init_metrics() {
    mkdir -p "$METRICS_DIR"
    
    cat > "$METRICS_FILE" <<EOF
{
  "session_id": "$SESSION_ID",
  "session_start": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "conversation_id": null,
  "messages": [],
  "session_summary": {
    "total_messages": 0,
    "total_errors": 0,
    "average_response_time_ms": 0,
    "total_duration_seconds": 0
  }
}
EOF
}

add_message_metric() {
    local user_msg=$1
    local assistant_reply=$2
    local response_time_ms=$3
    local msg_status=$4
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Escape JSON strings
    user_msg=$(echo "$user_msg" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))" | sed 's/^"//;s/"$//')
    assistant_reply=$(echo "$assistant_reply" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))" | sed 's/^"//;s/"$//')
    
    python3 -c "
import json
import sys

try:
    with open('$METRICS_FILE', 'r') as f:
        data = json.load(f)
    
    message_entry = {
        'timestamp': '$timestamp',
        'user_message': '''$user_msg''',
        'assistant_reply': '''$assistant_reply''',
        'response_time_ms': $response_time_ms,
        'character_count': len('''$assistant_reply'''),
        'status': '$msg_status'
    }
    
    data['messages'].append(message_entry)
    
    if data['conversation_id'] is None and '$CONVERSATION_ID' != '':
        data['conversation_id'] = '$CONVERSATION_ID'
    
    with open('$METRICS_FILE', 'w') as f:
        json.dump(data, f, indent=2)
except Exception as e:
    print(f'Error updating metrics: {e}', file=sys.stderr)
" 2>/dev/null || true
}

finalize_metrics() {
    local total_duration=$1
    local avg_response_time=0
    
    if [ $MESSAGE_COUNT -gt 0 ]; then
        avg_response_time=$((TOTAL_RESPONSE_TIME / MESSAGE_COUNT))
    fi
    
    python3 -c "
import json

try:
    with open('$METRICS_FILE', 'r') as f:
        data = json.load(f)
    
    data['session_summary'] = {
        'total_messages': $MESSAGE_COUNT,
        'total_errors': $ERROR_COUNT,
        'average_response_time_ms': $avg_response_time,
        'total_duration_seconds': $total_duration
    }
    data['session_end'] = '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'
    
    with open('$METRICS_FILE', 'w') as f:
        json.dump(data, f, indent=2)
except Exception as e:
    print(f'Error finalizing metrics: {e}', file=sys.stderr)
" 2>/dev/null || true
}

#############################################
# Server Check Functions
#############################################

check_server() {
    # Load configuration
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        PORT="${PORT:-$DEFAULT_PORT}"
        HOST="${HOST:-$DEFAULT_HOST}"
    else
        PORT="$DEFAULT_PORT"
        HOST="$DEFAULT_HOST"
    fi
    
    log_info "Checking server at http://${HOST}:${PORT}..."
    
    # Check if server is running
    if ! curl -s "http://${HOST}:${PORT}/healthz" > /dev/null 2>&1; then
        log_error "Server is not running at http://${HOST}:${PORT}"
        echo ""
        log_info "Please start the server first:"
        echo "  cd $BACKEND_DIR"
        echo "  ./scripts/setup.sh"
        echo ""
        return 1
    fi
    
    # Get server health info
    HEALTH_INFO=$(curl -s "http://${HOST}:${PORT}/healthz")
    MODEL=$(echo "$HEALTH_INFO" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('model', 'unknown'))" 2>/dev/null || echo "unknown")
    
    log_success "Server is running"
    log_info "Model: $MODEL"
}

#############################################
# Chat Functions
#############################################

send_message() {
    local message=$1
    
    # Prepare JSON payload using a file to avoid shell escaping issues
    local payload_file=$(mktemp)
    python3 << EOF > "$payload_file"
import json
payload = {'message': $(printf '%s' "$message" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")}
if '$CONVERSATION_ID':
    payload['conversation_id'] = '$CONVERSATION_ID'
print(json.dumps(payload))
EOF
    
    local payload=$(cat "$payload_file")
    rm -f "$payload_file"
    
    # Measure response time
    local start_ms=$(($(date +%s%N)/1000000))
    
    # Send request (save to temp file for reliable parsing)
    local temp_response=$(mktemp)
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$temp_response" -X POST "http://${HOST}:${PORT}/chat" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    local end_ms=$(($(date +%s%N)/1000000))
    local response_time=$((end_ms - start_ms))
    
    RESPONSE_BODY=$(cat "$temp_response")
    rm -f "$temp_response"
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Parse response
        REPLY=$(printf '%s' "$RESPONSE_BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    reply = data.get('reply', '')
    if reply:
        print(reply)
    else:
        print('No reply in response')
except Exception as e:
    print(f'Error parsing response: {e}')
    print('Response body:', file=sys.stderr)
    print(sys.stdin.read(), file=sys.stderr)
")
        
        # Extract conversation ID if this is the first message
        if [ -z "$CONVERSATION_ID" ]; then
            CONVERSATION_ID=$(printf '%s' "$RESPONSE_BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    conv_id = data.get('conversation_id', '')
    if conv_id:
        print(conv_id)
except:
    pass
")
        fi
        
        # Update metrics
        MESSAGE_COUNT=$((MESSAGE_COUNT + 1))
        TOTAL_RESPONSE_TIME=$((TOTAL_RESPONSE_TIME + response_time))
        
        # Save to metrics file
        add_message_metric "$message" "$REPLY" "$response_time" "success"
        
        # Display response
        print_assistant_label
        echo "$REPLY"
        echo ""
        
        # Display metrics
        echo -e "${CYAN}[Response time: ${response_time}ms | Message #${MESSAGE_COUNT} | Model: ${MODEL}]${NC}"
        
        return 0
    else
        # Handle error
        ERROR_COUNT=$((ERROR_COUNT + 1))
        log_error "Request failed with HTTP $HTTP_CODE"
        
        ERROR_MSG=$(printf '%s' "$RESPONSE_BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('detail', 'Unknown error'))
except:
    print(sys.stdin.read() if sys.stdin.read() else 'Unknown error')
" 2>/dev/null || echo "$RESPONSE_BODY")
        
        echo -e "${RED}Error: $ERROR_MSG${NC}"
        
        # Save error to metrics
        add_message_metric "$message" "" "$response_time" "error"
        
        return 1
    fi
}

#############################################
# Interactive Chat Loop
#############################################

chat_loop() {
    echo ""
    print_separator
    echo -e "${CYAN}  Interactive Chat Session Started${NC}"
    print_separator
    echo ""
    log_info "Commands: /quit (exit) | /new (new conversation) | /metrics (show stats)"
    echo ""
    
    while true; do
        print_user_prompt
        read -r user_input
        
        # Handle empty input
        if [ -z "$user_input" ]; then
            continue
        fi
        
        # Handle commands
        case "$user_input" in
            /quit|/exit|/q)
                echo ""
                log_info "Ending chat session..."
                break
                ;;
            /new)
                CONVERSATION_ID=""
                MESSAGE_COUNT=0
                log_success "Started new conversation"
                echo ""
                continue
                ;;
            /metrics)
                show_session_metrics
                echo ""
                continue
                ;;
            /help)
                echo ""
                log_info "Available commands:"
                echo "  /quit     - Exit the chat"
                echo "  /new      - Start a new conversation"
                echo "  /metrics  - Show session statistics"
                echo "  /help     - Show this help"
                echo ""
                continue
                ;;
            /*)
                log_warning "Unknown command: $user_input"
                echo "  Type /help for available commands"
                echo ""
                continue
                ;;
        esac
        
        # Send message to agent
        echo ""
        echo -ne "${CYAN}Processing...${NC}"
        
        # Use a background process trick to show spinner
        (sleep 0.1) &  # Dummy process for spinner
        # Actually send the message synchronously
        send_message "$user_input"
        
        echo ""
    done
}

#############################################
# Session Metrics Display
#############################################

show_session_metrics() {
    local session_duration=$(($(date +%s) - SESSION_START))
    local avg_response_time=0
    
    if [ $MESSAGE_COUNT -gt 0 ]; then
        avg_response_time=$((TOTAL_RESPONSE_TIME / MESSAGE_COUNT))
    fi
    
    echo ""
    print_separator
    echo -e "${CYAN}  Session Statistics${NC}"
    print_separator
    echo -e "  Total Messages:      ${GREEN}$MESSAGE_COUNT${NC}"
    echo -e "  Average Response:    ${GREEN}${avg_response_time}ms${NC}"
    echo -e "  Session Duration:    ${GREEN}${session_duration}s${NC}"
    echo -e "  Errors:              ${RED}$ERROR_COUNT${NC}"
    if [ -n "$CONVERSATION_ID" ]; then
        echo -e "  Conversation ID:     ${BLUE}$CONVERSATION_ID${NC}"
    fi
    print_separator
}

#############################################
# Main Function
#############################################

main() {
    echo ""
    echo "=========================================="
    echo "  Agno Chatbot - Interactive Chat"
    echo "=========================================="
    echo ""
    
    # Initialize metrics
    init_metrics
    
    # Check server
    if ! check_server; then
        echo ""
        log_error "Cannot start chat session without a running server"
        return 1
    fi
    
    echo ""
    
    # Start chat loop
    chat_loop
    
    # Show final statistics
    show_session_metrics
    
    # Finalize metrics
    local total_duration=$(($(date +%s) - SESSION_START))
    finalize_metrics $total_duration
    
    echo ""
    log_success "Chat session ended"
    log_info "Metrics saved to: $METRICS_FILE"
    echo ""
}

# Trap Ctrl+C to gracefully exit
trap 'echo ""; log_info "Interrupted by user"; show_session_metrics; finalize_metrics $(($(date +%s) - SESSION_START)); echo ""; exit 0' INT

# Run main function
main

