# Streamlit Chat UI Guide

## Overview

A modern, sleek Streamlit-based chat interface for the Agno chatbot backend. Features a beautiful gradient design, real-time metrics, and seamless integration with the FastAPI backend.

## Features

### 🎨 Modern Design

- **Gradient Background**: Beautiful purple gradient (from #667eea to #764ba2)
- **Smooth Animations**: Messages slide in with CSS animations
- **Rounded Corners**: Modern, friendly message bubbles
- **Responsive Layout**: Works on desktop and tablet
- **Custom Scrollbar**: Styled scrollbar matching the theme

### 💬 Chat Features

- **Persistent Conversations**: Messages saved in session state
- **Conversation Memory**: Backend maintains context via conversation IDs
- **Real-time Metrics**: Response time and message count tracking
- **Server Status**: Live health check indicator
- **New Conversation**: Reset context with one click

### 📊 Metrics & Info

- **Session Statistics**: Message count, average response time
- **Model Information**: Current model and backend config
- **Conversation ID**: Unique ID for each conversation
- **Response Times**: Per-message response time display

## Installation

### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install streamlit>=1.28.0
```

Or add to `requirements.txt`:

```
streamlit>=1.28.0
```

### 2. Ensure Backend is Running

The UI requires the FastAPI backend to be running:

```bash
cd backend/scripts
./setup.sh
```

## Usage

### Quick Start

```bash
cd backend/scripts
./launch_ui.sh
```

This will:

1. Check if virtual environment exists
2. Verify backend server is running
3. Install Streamlit if needed
4. Launch the UI on http://localhost:8501

### Manual Launch

```bash
cd backend
source venv/bin/activate
streamlit run chat_ui.py
```

### Configuration

The UI connects to the backend at:

- **API Base URL**: `http://localhost:8000`
- **Health Endpoint**: `http://localhost:8000/healthz`
- **Chat Endpoint**: `http://localhost:8000/chat`

To change these, edit the constants in `chat_ui.py`:

```python
API_BASE_URL = "http://localhost:8000"  # Change if backend uses different port
```

## UI Components

### Header Section

- **Title**: "🤖 Agno Chatbot"
- **Status Indicator**: Green (online) or Red (offline)
- **Server Status**: Shows if backend is reachable

### Sidebar

**Session Info:**

- Model name
- Environment (local/prod)
- Memory backend type

**Metrics:**

- Total messages sent
- Average response time

**Controls:**

- 🔄 New Conversation - Resets conversation context
- 🗑️ Clear Chat - Clears visual history only

**Tips:**

- Usage instructions and helpful hints

### Main Chat Area

**Message Display:**

- User messages: Purple gradient background, right-aligned
- Assistant messages: White background, left-aligned
- Timestamps and metadata shown below each message
- Auto-scroll to latest message

**Input Area:**

- Text input field with placeholder
- Send button
- Press Enter or click Send to submit

### Message Metadata

Each assistant message shows:

- ⚡ Response time in milliseconds
- 🧠 Model used

## File Structure

```
backend/
├── chat_ui.py              # Main Streamlit application
├── scripts/
│   └── launch_ui.sh        # UI launcher script
└── tests/
    └── test_chat_ui.py     # UI tests
```

## Testing

### Run Unit Tests

```bash
cd backend
source venv/bin/activate
pytest tests/test_chat_ui.py -v
```

### Test Coverage

The test file includes:

- Server health checking
- Message sending
- API integration
- Error handling
- Payload validation
- Response structure validation

### Integration Tests

Integration tests require the backend server to be running:

```bash
# Terminal 1: Start backend
cd backend/scripts
./setup.sh

# Terminal 2: Run integration tests
cd backend
pytest tests/test_chat_ui.py -v -m integration
```

## Customization

### Changing Colors

Edit the CSS in `inject_custom_css()`:

```python
# Background gradient
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

# User message gradient
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

# Assistant message background
background: white;
```

### Adjusting Layout

Modify in `main()`:

```python
st.set_page_config(
    page_title="Agno Chatbot",
    page_icon="🤖",
    layout="wide",  # Change to "centered" for narrower layout
    initial_sidebar_state="expanded",  # or "collapsed"
)
```

### Message Styling

Edit `render_message()` function to customize:

- Message bubble styling
- Metadata display format
- Animations
- Spacing

## Troubleshooting

### Backend Server Not Running

**Error**: "⚠️ Backend Server is Offline"

**Solution**:

```bash
cd backend/scripts
./setup.sh
```

### Port Already in Use

**Error**: "Address already in use"

**Solution**: Change port in launch script or run manually:

```bash
streamlit run chat_ui.py --server.port=8502
```

### Streamlit Not Found

**Error**: "ModuleNotFoundError: No module named 'streamlit'"

**Solution**:

```bash
source venv/bin/activate
pip install streamlit>=1.28.0
```

### Connection Refused

**Error**: "Connection refused when calling API"

**Solution**: Check backend is running and port is correct:

```bash
curl http://localhost:8000/healthz
```

### Messages Not Displaying

**Issue**: Messages sent but not showing

**Solution**: Check browser console for errors, refresh page (Ctrl+R)

## API Integration

### Health Check

```python
def check_server_health() -> tuple[bool, Optional[dict]]:
    """Check if backend server is running."""
    response = requests.get(HEALTH_ENDPOINT, timeout=5)
    return True, response.json()
```

### Send Message

```python
def send_message(message: str, conversation_id: Optional[str] = None) -> dict:
    """Send message to chatbot API."""
    payload = {"message": message}
    if conversation_id:
        payload["conversation_id"] = conversation_id

    response = requests.post(CHAT_ENDPOINT, json=payload, timeout=60)
    return response.json()
```

## Session State

Streamlit maintains state across reruns:

```python
st.session_state.messages = []           # Chat history
st.session_state.conversation_id = ...   # Current conversation
st.session_state.message_count = 0       # Total messages
st.session_state.total_response_time = 0 # Sum of response times
```

## Performance Tips

1. **Keep Chat History Reasonable**: Clear old messages periodically
2. **Use New Conversation**: Reset context to improve response times
3. **Monitor Response Times**: Check metrics sidebar for performance
4. **Backend Performance**: Ensure Ollama has sufficient resources

## Deployment

### Local Development

Already configured for local use at `http://localhost:8501`

### Network Access

To allow access from other devices on your network:

```bash
streamlit run chat_ui.py --server.address=0.0.0.0
```

Then access via: `http://<your-ip>:8501`

### Production Deployment

For production, consider:

- Using a reverse proxy (nginx)
- Adding authentication
- Enabling HTTPS
- Rate limiting
- Session persistence (Redis)

## Advanced Features

### Add Streaming Support

Modify `send_message()` to use `/chat/stream` endpoint:

```python
def send_message_stream(message: str, conversation_id: Optional[str] = None):
    """Stream response from API."""
    # Implementation using SSE
    pass
```

### Add File Upload

```python
uploaded_file = st.file_uploader("Upload a file", type=['txt', 'pdf'])
if uploaded_file:
    # Process file
    content = uploaded_file.read()
```

### Add Voice Input

```python
from streamlit_mic_recorder import mic_recorder

audio = mic_recorder()
if audio:
    # Process audio
    text = speech_to_text(audio)
    send_message(text)
```

## Resources

- **Streamlit Docs**: https://docs.streamlit.io
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Agno Docs**: https://docs.agno.com

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review backend logs at `backend/logs/`
3. Check browser developer console
4. Verify backend server status

## Summary

A production-ready, beautiful chat UI that:

- ✅ Connects seamlessly to FastAPI backend
- ✅ Modern, responsive design
- ✅ Real-time metrics and monitoring
- ✅ Comprehensive test coverage
- ✅ Easy to customize and extend
- ✅ One-command launch script

Enjoy chatting with your Agno-powered assistant! 🤖✨
