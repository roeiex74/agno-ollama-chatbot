"""Modern Streamlit Chat UI for Agno Chatbot.

This provides a sleek, production-ready chat interface that connects
to the FastAPI backend server.
"""

import json
import uuid
from datetime import datetime
from typing import Optional

import requests
import streamlit as st

# Configuration
API_BASE_URL = "http://localhost:8000"
CHAT_ENDPOINT = f"{API_BASE_URL}/chat"
HEALTH_ENDPOINT = f"{API_BASE_URL}/healthz"


# Custom CSS for modern, slick design
def inject_custom_css():
    """Inject custom CSS for modern chat interface."""
    st.markdown(
        """
        <style>
        /* Main app styling */
        .stApp {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Chat container */
        .main .block-container {
            padding-top: 2rem;
            padding-bottom: 2rem;
            max-width: 900px;
        }
        
        /* Custom chat messages */
        .user-message {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 20px 20px 5px 20px;
            margin: 0.5rem 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideInRight 0.3s ease-out;
        }
        
        .assistant-message {
            background: white;
            color: #2d3748;
            padding: 1rem 1.5rem;
            border-radius: 20px 20px 20px 5px;
            margin: 0.5rem 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideInLeft 0.3s ease-out;
        }
        
        /* Message metadata */
        .message-meta {
            font-size: 0.75rem;
            color: #718096;
            margin-top: 0.5rem;
            opacity: 0.8;
        }
        
        /* Header styling */
        .chat-header {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .chat-header h1 {
            color: #667eea;
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
        }
        
        .chat-header p {
            color: #718096;
            margin: 0.5rem 0 0 0;
        }
        
        /* Status indicators */
        .status-online {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #48bb78;
            border-radius: 50%;
            margin-right: 0.5rem;
            animation: pulse 2s infinite;
        }
        
        .status-offline {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #f56565;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        
        /* Animations */
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }
        
        /* Input styling */
        .stTextInput > div > div > input {
            border-radius: 25px;
            border: 2px solid #e2e8f0;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
        }
        
        .stTextInput > div > div > input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* Button styling */
        .stButton > button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 0.75rem 2rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .stButton > button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Sidebar styling */
        .css-1d391kg {
            background: white;
        }
        
        /* Metrics cards */
        .metric-card {
            background: white;
            padding: 1rem;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            margin: 0.5rem 0;
        }
        
        /* Main container spacing */
        .main .block-container > div {
            gap: 1rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def check_server_health() -> tuple[bool, Optional[dict]]:
    """Check if the backend server is running and healthy.

    Returns:
        Tuple of (is_healthy, health_info)
    """
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=5)
        if response.status_code == 200:
            return True, response.json()
        return False, None
    except Exception:
        return False, None


def send_message(message: str, conversation_id: Optional[str] = None) -> dict:
    """Send a message to the chatbot API.

    Args:
        message: User message
        conversation_id: Optional conversation ID for context

    Returns:
        API response dict with conversation_id, reply, and usage

    Raises:
        requests.RequestException: If API call fails
    """
    payload = {"message": message}
    if conversation_id:
        payload["conversation_id"] = conversation_id

    response = requests.post(
        CHAT_ENDPOINT,
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def render_message(
    role: str, content: str, timestamp: str, metadata: Optional[dict] = None
):
    """Render a chat message with styling.

    Args:
        role: 'user' or 'assistant'
        content: Message content
        timestamp: Message timestamp
        metadata: Optional metadata (response time, tokens, etc.)
    """
    css_class = "user-message" if role == "user" else "assistant-message"
    label = "You" if role == "user" else "🤖 Assistant"

    meta_html = ""
    if metadata:
        meta_parts = []
        if "response_time" in metadata:
            meta_parts.append(f"⚡ {metadata['response_time']}ms")
        if "model" in metadata:
            meta_parts.append(f"🧠 {metadata['model']}")
        if meta_parts:
            meta_html = (
                f'<div class="message-meta">{" | ".join(meta_parts)}</div>'
            )

    st.markdown(
        f"""
        <div class="{css_class}">
            <strong>{label}</strong><br/>
            {content}
            {meta_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def initialize_session_state():
    """Initialize Streamlit session state variables."""
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "conversation_id" not in st.session_state:
        st.session_state.conversation_id = str(uuid.uuid4())

    if "message_count" not in st.session_state:
        st.session_state.message_count = 0

    if "total_response_time" not in st.session_state:
        st.session_state.total_response_time = 0

    if "processing" not in st.session_state:
        st.session_state.processing = False

    if "input_key" not in st.session_state:
        st.session_state.input_key = 0


def reset_conversation():
    """Reset the conversation state."""
    st.session_state.messages = []
    st.session_state.conversation_id = str(uuid.uuid4())
    st.session_state.message_count = 0
    st.session_state.total_response_time = 0


def main():
    """Main Streamlit app."""
    # Page config
    st.set_page_config(
        page_title="Agno Chatbot",
        page_icon="🤖",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    # Inject custom CSS
    inject_custom_css()

    # Initialize session state
    initialize_session_state()

    # Check server health
    is_healthy, health_info = check_server_health()

    # Header
    status_indicator = (
        '<span class="status-online"></span>'
        if is_healthy
        else '<span class="status-offline"></span>'
    )

    st.markdown(
        f"""
        <div class="chat-header">
            <h1>🤖 Agno Chatbot</h1>
            <p>{status_indicator} Backend: {'Online' if is_healthy else 'Offline'}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Sidebar with info and controls
    with st.sidebar:
        st.markdown("### 📊 Session Info")

        if health_info:
            st.markdown(
                f"""
                <div class="metric-card">
                    <strong>Model:</strong> {health_info.get('model', 'Unknown')}<br/>
                    <strong>Environment:</strong> {health_info.get('environment', 'Unknown')}<br/>
                    <strong>Database:</strong> {health_info.get('database', 'Unknown')}
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown("---")

        # Session metrics
        st.metric("Messages", st.session_state.message_count)

        if st.session_state.message_count > 0:
            avg_time = (
                st.session_state.total_response_time
                / st.session_state.message_count
            )
            st.metric("Avg Response Time", f"{avg_time:.0f}ms")

        st.markdown("---")

        # Conversation ID
        st.markdown("**Conversation ID:**")
        st.code(st.session_state.conversation_id[:8] + "...", language=None)

        st.markdown("---")

        # Controls
        if st.button("🔄 New Conversation", use_container_width=True):
            reset_conversation()
            st.rerun()

        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()

        st.markdown("---")
        st.markdown("### 💡 Tips")
        st.markdown(
            """
            - Type your message and press Enter
            - Start a new conversation to reset context
            - Messages are persistent across page reloads
            """
        )

    # Main chat area
    if not is_healthy:
        st.error(
            """
            ⚠️ **Backend Server is Offline**
            
            Please start the backend server first:
            ```bash
            cd backend/scripts
            ./setup.sh
            ```
            """
        )
        st.stop()

    # Display existing messages
    for msg in st.session_state.messages:
        render_message(
            role=msg["role"],
            content=msg["content"],
            timestamp=msg.get("timestamp", ""),
            metadata=msg.get("metadata"),
        )

    # Chat input
    col1, col2 = st.columns([6, 1])

    with col1:
        user_input = st.text_input(
            "Type your message...",
            key=f"user_input_{st.session_state.input_key}",
            placeholder="Ask me anything...",
            label_visibility="collapsed",
            disabled=st.session_state.processing,
        )

    with col2:
        send_button = st.button(
            "Send",
            use_container_width=True,
            disabled=st.session_state.processing,
        )

    # Handle message submission (only on button click or Enter, and not already processing)
    if send_button and user_input and not st.session_state.processing:
        # Set processing flag
        st.session_state.processing = True

        # Store the message to process
        message_to_send = user_input

        # Add user message
        timestamp = datetime.now().strftime("%H:%M:%S")
        st.session_state.messages.append(
            {
                "role": "user",
                "content": message_to_send,
                "timestamp": timestamp,
            }
        )

        # Show spinner while processing
        with st.spinner("🤔 Thinking..."):
            try:
                import time

                start_time = time.time()

                # Send to API
                response = send_message(
                    message=message_to_send,
                    conversation_id=st.session_state.conversation_id,
                )

                end_time = time.time()
                response_time = int((end_time - start_time) * 1000)

                # Update conversation ID
                st.session_state.conversation_id = response["conversation_id"]

                # Add assistant message
                st.session_state.messages.append(
                    {
                        "role": "assistant",
                        "content": response["reply"],
                        "timestamp": datetime.now().strftime("%H:%M:%S"),
                        "metadata": {
                            "response_time": response_time,
                            "model": response["usage"].get("model", "unknown"),
                        },
                    }
                )

                # Update metrics
                st.session_state.message_count += 1
                st.session_state.total_response_time += response_time

            except requests.exceptions.RequestException as e:
                st.error(f"❌ Error communicating with backend: {str(e)}")
            except Exception as e:
                st.error(f"❌ Unexpected error: {str(e)}")
            finally:
                # Reset processing flag
                st.session_state.processing = False

        # Increment input key to clear the text input
        st.session_state.input_key += 1

        # Rerun to show new messages and clear input
        st.rerun()

    # Footer
    st.markdown("---")
    st.markdown(
        """
        <div style="text-align: center; color: white; opacity: 0.8;">
            Powered by <strong>Agno</strong> + <strong>Ollama</strong> | 
            Built with ❤️ using <strong>Streamlit</strong>
        </div>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
