# Agno + Ollama Full-Stack Chatbot 🤖

> **⚡ AI-Powered Development Notice**: This entire project was developed using **Claude Code** (Anthropic's AI coding assistant). All code, architecture decisions, implementation details, and documentation were generated through AI-assisted development, demonstrating the power and capabilities of modern LLM-based development tools in creating production-ready applications.

A production-ready, full-stack chatbot application powered by **Agno** (agent framework) and **Ollama** (local LLM inference) with a modern React frontend. Features real-time streaming responses, persistent conversation history via PostgreSQL (Neon), and a beautiful ChatGPT-inspired interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.115+-green.svg)
![React](https://img.shields.io/badge/react-19+-blue.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [AI Development](#-ai-development-journey)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- 💬 **Real-time Streaming Chat**: Server-Sent Events (SSE) for token-by-token streaming responses
- 🔄 **Conversation Management**: Full CRUD operations (create, read, update, delete) for chat conversations
- 💾 **Persistent Storage**: PostgreSQL database integration via Neon for reliable conversation history
- 🎯 **Session Management**: Automatic session creation and restoration using Agno's session API
- 🚀 **Local LLM**: Privacy-first approach using Ollama for local inference (no API keys required)
- 🎨 **Auto-Title Generation**: Conversations automatically titled from first user message

### User Experience
- 🎭 **Modern UI**: ChatGPT-inspired interface with dark mode support and smooth animations
- ⚡ **Optimistic Updates**: Instant UI feedback with background synchronization
- 📱 **Responsive Design**: Mobile-first design that works seamlessly on all screen sizes
- 🔍 **Conversation History**: Browse and restore previous conversations with one click
- 📝 **Smart Message Filtering**: System messages filtered from display for cleaner conversations
- ⏱️ **Relative Timestamps**: Human-readable time displays (e.g., "5 min ago", "2 hr ago")
- 🎬 **Loading States**: Visual feedback during all async operations
- 🛑 **Stream Cancellation**: Stop button to cancel ongoing streaming responses
- 📄 **Markdown Rendering**: Full GitHub Flavored Markdown support with syntax highlighting
- 🎨 **Memoized Rendering**: Performance-optimized markdown with block-level memoization for smooth streaming
- 📋 **Copy Functionality**: One-click copy button for assistant messages

### Technical Features
- 🏗️ **Type-Safe**: Full TypeScript implementation on frontend with strict type checking
- 🔐 **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- 🎛️ **State Management**: Redux Toolkit with RTK Query for efficient data fetching and caching
- 🔄 **Hot Reload**: Fast development with Vite HMR and Uvicorn auto-reload
- 📊 **Real-time Refetching**: Conversations refetch from server on every selection for data consistency
- 🎭 **Serializable State**: All Redux state uses serializable data types (number timestamps)
- 🔌 **API Integration**: Clean separation of API layer using RTK Query
- 🎨 **Component Library**: Built with shadcn/ui for consistent, accessible components

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite)                        │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Components  │  │ Redux Store  │  │  RTK Query   │              │
│  │  (shadcn/ui) │◄─┤   (State)    │◄─┤   (API)      │              │
│  │              │  │              │  │              │              │
│  │ - ChatLayout │  │ - Conversa-  │  │ - chatApi    │              │
│  │ - ChatArea   │  │   tions      │  │ - conversa-  │              │
│  │ - ChatInput  │  │ - UI State   │  │   tionsApi   │              │
│  │ - Message    │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────┬───────┘              │
└────────────────────────────────────────────────┼────────────────────┘
                                                 │
                                      HTTP/SSE   │
                                      ┌──────────▼────────┐
                                      │   CORS Enabled    │
                                      │   API Gateway     │
                                      └──────────┬────────┘
                                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI + Uvicorn)                      │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Endpoints  │─►│ ChatbotAgent │─►│ Ollama Model │              │
│  │  (REST+SSE)  │  │    (Agno)    │  │   (Local)    │              │
│  │              │  │              │  │              │              │
│  │ /healthz     │  │ - Session    │  │ - llama3.2   │              │
│  │ /chat        │  │   mgmt       │  │ - gpt-oss    │              │
│  │ /chat/stream │  │ - History    │  │ - Custom     │              │
│  │ /conversations│ │   loading    │  │   models     │              │
│  └──────────────┘  └──────┬───────┘  └──────────────┘              │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                     Agno PostgresDb
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Neon - Serverless)                 │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  agno_sessions Table                          │   │
│  │                                                               │   │
│  │  • session_id (VARCHAR, PK) - Unique conversation ID         │   │
│  │  • session_type (VARCHAR) - "agent" for our use case         │   │
│  │  • session_data (JSONB) - Metadata including custom title    │   │
│  │  • agent_data (JSONB) - Agent configuration                  │   │
│  │  • runs (JSONB ARRAY) - Chat history & execution runs        │   │
│  │  • created_at (TIMESTAMP) - Session creation time            │   │
│  │  • updated_at (TIMESTAMP) - Last modification time           │   │
│  │  • user_id (VARCHAR) - Optional user identification          │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagrams

#### 1. Chat Message Flow (Streaming)
```
User Types Message
        │
        ▼
┌───────────────────┐
│  Frontend Action  │
│  (sendMessage)    │
└────────┬──────────┘
         │
         │ 1. Add user message to Redux (optimistic)
         │ 2. Add empty assistant message placeholder
         │
         ▼
┌──────────────────────┐
│  POST /chat/stream   │
│  {                   │
│    message: "...",   │
│    conversation_id   │
│  }                   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Backend Agent       │
│  1. Load history     │
│  2. Create agent     │
│  3. Stream tokens    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Ollama Model        │
│  Generate response   │
│  token by token      │
└──────────┬───────────┘
           │
           │ SSE Stream
           ▼
┌──────────────────────┐
│  data: {"delta":"Hi"}│
│  data: {"delta":" "}│
│  data: {"delta":"!"}│
│  data: {"done":true} │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Frontend Updates    │
│  1. Append each delta│
│  2. Update Redux     │
│  3. Re-render UI     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  On Stream Complete: │
│  - Save title (if 1st)│
│  - Mark streaming off │
│  - Enable input      │
└──────────────────────┘
```

#### 2. Conversation Loading Flow
```
App Loads
    │
    ▼
┌──────────────────────┐
│ GET /conversations   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ PostgresDb.get_sessions()    │
│ (SessionType.AGENT filter)   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Process Sessions:            │
│ - Extract titles from        │
│   session_data["name"] or    │
│   first user message         │
│ - Count non-system messages  │
│ - Convert timestamps         │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Return Summary Array         │
│ [{                           │
│   conversation_id,           │
│   title,                     │
│   message_count,             │
│   created_at,                │
│   updated_at                 │
│ }]                           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Frontend Redux Update        │
│ setConversations()           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Display in Sidebar           │
│ with relative timestamps     │
└──────────────────────────────┘

User Clicks Conversation
           │
           ▼
┌──────────────────────────────┐
│ 1. Clear current messages    │
│ 2. Show loading state        │
│ 3. GET /conversations/{id}   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Load Full Conversation:      │
│ - Get session from DB        │
│ - Extract chat_history       │
│ - Filter system messages     │
│ - Convert to frontend format │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Add messages to Redux        │
│ (forEach addMessage)         │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Display messages in ChatArea │
│ Hide loading state           │
└──────────────────────────────┘
```

#### 3. Title Auto-Save Flow
```
First Message Sent
        │
        ▼
┌──────────────────────────────┐
│ Stream Completes             │
│ (done: true event)           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Check: Is title "New Chat"?  │
└──────────┬───────────────────┘
           │ YES
           ▼
┌──────────────────────────────┐
│ Generate title:              │
│ message.slice(0,50) + "..."  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ PATCH /conversations/{id}/   │
│        title                 │
│ { title: "..." }             │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Backend:                     │
│ session.session_data["name"] │
│   = title                    │
│ db.upsert_session(session)   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Frontend:                    │
│ updateConversationTitle()    │
│ Redux state updated          │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Sidebar shows new title      │
│ Persists across page refresh │
└──────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[FastAPI](https://fastapi.tiangolo.com/)** | 0.115+ | Modern, fast web framework with automatic API docs |
| **[Agno](https://agno.com/)** | Latest | AI agent orchestration with native PostgreSQL support |
| **[Ollama](https://ollama.com/)** | Latest | Local LLM inference engine (privacy-first) |
| **[PostgreSQL](https://www.postgresql.org/)** | 16+ | Robust relational database |
| **[Neon](https://neon.tech/)** | - | Serverless PostgreSQL platform |
| **[psycopg](https://www.psycopg.org/)** | 3.x | PostgreSQL adapter for Python (async support) |
| **[Pydantic](https://pydantic.dev/)** | 2.x | Data validation using Python type annotations |
| **[Uvicorn](https://www.uvicorn.org/)** | Latest | Lightning-fast ASGI server |

### Frontend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[React](https://react.dev/)** | 19+ | Component-based UI library |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.6+ | Type-safe JavaScript |
| **[Vite](https://vitejs.dev/)** | 7.x | Next generation frontend tooling |
| **[Redux Toolkit](https://redux-toolkit.js.org/)** | 2.x | Official Redux toolset (simplified) |
| **[RTK Query](https://redux-toolkit.js.org/rtk-query/overview)** | - | Powerful data fetching & caching |
| **[shadcn/ui](https://ui.shadcn.com/)** | Latest | Re-usable components (Radix UI based) |
| **[Tailwind CSS](https://tailwindcss.com/)** | 4.x | Utility-first CSS framework |
| **[Lucide React](https://lucide.dev/)** | Latest | Beautiful & consistent icon library |
| **[React Router](https://reactrouter.com/)** | 7.x | Declarative routing for React |
| **[React Markdown](https://github.com/remarkjs/react-markdown)** | 10.x | Markdown rendering with React components |
| **[Marked](https://marked.js.org/)** | 17.x | Fast markdown parser for block-level parsing |
| **[rehype-highlight](https://github.com/rehypejs/rehype-highlight)** | 7.x | Syntax highlighting for code blocks |
| **[remark-gfm](https://github.com/remarkjs/remark-gfm)** | 4.x | GitHub Flavored Markdown support |

### DevOps & Development Tools
| Tool | Purpose |
|------|---------|
| **Git / GitHub** | Version control & collaboration |
| **npm** | Frontend package management |
| **pip / venv** | Python package & environment management |
| **ESLint** | JavaScript/TypeScript linting |
| **Ruff** | Fast Python linter |
| **pytest** | Python testing framework |

## 📋 Prerequisites

### Required Software

1. **Python 3.11 or higher**
   ```bash
   # Verify installation
   python --version  # Should show 3.11.x or higher

   # Or use python3 on some systems
   python3 --version
   ```

2. **Node.js 20+ and npm**
   ```bash
   # Verify installation
   node --version  # Should show v20.x.x or higher
   npm --version   # Should show 10.x.x or higher
   ```

   Download from: https://nodejs.org/

3. **Ollama** (Local LLM Runtime)
   ```bash
   # macOS (using Homebrew)
   brew install ollama

   # Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows - Download from https://ollama.com/download
   ```

   Verify installation:
   ```bash
   ollama --version
   ```

4. **PostgreSQL Database** (Neon Account)
   - Sign up at [Neon](https://neon.tech/) (free tier available)
   - Create a new project
   - Copy your connection string (looks like: `postgresql://user:pass@host/db`)

### Optional but Recommended
- **Git** - For version control
- **Docker** - For containerized deployment (future)
- **Make** - Build automation (backend includes Makefile)
- **VS Code** - Recommended IDE with extensions:
  - Python
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/roeiex74/agno-ollama-chatbot.git
cd agno-ollama-chatbot
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Activate (choose based on your OS)
# macOS/Linux:
source venv/bin/activate

# Windows PowerShell:
venv\Scripts\Activate.ps1

# Windows CMD:
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Backend Environment

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env

# Environment (local|prod)
ENV=local

# Ollama configuration
# Recommended models: llama3.2:1b (fast), llama3.2:3b (balanced), llama3.3:70b (best)
OLLAMA_MODEL=llama3.2:3b
OLLAMA_HOST=http://localhost:11434
MODEL_TIMEOUT_S=60

# Database configuration (REPLACE WITH YOUR NEON CONNECTION STRING)
POSTGRES_URL=postgresql+psycopg://user:password@host.region.aws.neon.tech/db?sslmode=require
MAX_HISTORY=20

# Server configuration
HOST=0.0.0.0
PORT=8000
```

**Important**: Replace the `POSTGRES_URL` with your actual Neon connection string!

### 4. Start Ollama and Download Model

```bash
# Start Ollama service (in a separate terminal)
ollama serve

# Pull the model (in another terminal)
ollama pull llama3.2:3b

# Verify model is downloaded
ollama list
# You should see llama3.2:3b in the list
```

### 5. Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
cd backend
source venv/bin/activate  # If not already activated

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Alternative: use make command (if Make is installed)
make dev
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Verify backend is working**:
```bash
curl http://localhost:8000/healthz
```

Expected response:
```json
{
  "status": "ok",
  "environment": "local",
  "model": "llama3.2:3b",
  "database": "postgresql"
}
```

### 6. Frontend Setup

Open a **new terminal** (keep backend running):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

You should see:
```
VITE v6.0.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### 7. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the chat interface! 🎉

### 8. Test the Application

1. Click **"New Chat"** button
2. Type a message (e.g., "Hello! How are you?")
3. Press Enter or click the send button
4. Watch the streaming response appear token-by-token
5. Refresh the page - your conversation should persist
6. Check the sidebar - your conversation should appear with the auto-generated title

## 📁 Project Structure

```
agno-ollama-chatbot/
│
├── backend/                         # FastAPI Backend Application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app, endpoints, lifespan management
│   │   ├── config.py                # Environment-based configuration (Pydantic)
│   │   │
│   │   └── agents/
│   │       ├── __init__.py
│   │       └── chatbot_agent.py     # Agno agent with PostgreSQL integration
│   │
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Environment variables (not in git)
│   ├── .env.example                 # Example environment file
│   ├── Makefile                     # Build automation scripts
│   └── pyproject.toml               # Python project metadata
│
├── frontend/                        # React + Vite Frontend
│   ├── src/
│   │   ├── components/              # React Components
│   │   │   ├── ChatArea.tsx         # Message display with scrolling
│   │   │   ├── ChatInput.tsx        # Message input with auto-resize
│   │   │   ├── ChatLayout.tsx       # Main layout (sidebar + chat)
│   │   │   ├── ChatMessage.tsx      # Individual message component
│   │   │   ├── ConversationList.tsx # Sidebar conversation list
│   │   │   ├── memoized-markdown.tsx # Performance-optimized markdown renderer
│   │   │   │
│   │   │   └── ui/                  # shadcn/ui components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── textarea.tsx
│   │   │       └── tooltip.tsx
│   │   │
│   │   ├── hooks/                   # Custom React Hooks
│   │   │   ├── useStreamingChat.ts  # SSE streaming logic
│   │   │   └── use-mobile.ts
│   │   │
│   │   ├── store/                   # Redux Store
│   │   │   ├── api/                 # RTK Query API Definitions
│   │   │   │   └── conversationsApi.ts # Conversation CRUD & streaming
│   │   │   │
│   │   │   ├── slices/              # Redux Slices
│   │   │   │   ├── conversationsSlice.ts # Conversation state
│   │   │   │   └── uiSlice.ts       # UI state (loading, errors)
│   │   │   │
│   │   │   ├── hooks.ts             # Typed Redux hooks
│   │   │   └── store.ts             # Store configuration
│   │   │
│   │   ├── types/
│   │   │   └── api.ts               # TypeScript type definitions
│   │   │
│   │   ├── config/
│   │   │   └── api.ts               # API configuration (base URL)
│   │   │
│   │   ├── data/
│   │   │   └── conversations.ts     # Data models & helpers
│   │   │
│   │   ├── lib/
│   │   │   └── utils.ts             # Utility functions (cn)
│   │   │
│   │   ├── App.tsx                  # Main app component & routing
│   │   ├── main.tsx                 # App entry point
│   │   └── index.css                # Global styles (Tailwind)
│   │
│   ├── public/
│   │   └── vite.svg                 # Favicon
│   │
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # npm dependencies & scripts
│   ├── package-lock.json            # Locked dependency versions
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tsconfig.app.json            # App-specific TS config
│   ├── tsconfig.node.json           # Node-specific TS config
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── components.json              # shadcn/ui configuration
│   └── eslint.config.js             # ESLint configuration
│
├── docs/                            # Additional Documentation
│   ├── ARCHITECTURE.md              # Detailed architecture guide
│   ├── API_DOCUMENTATION.md         # Complete API reference
│   ├── DEPLOYMENT.md                # Deployment guide
│   ├── DEVELOPMENT.md               # Development best practices
│   ├── TROUBLESHOOTING.md           # Common issues & solutions
│   └── AI_DEVELOPMENT.md            # AI development journey
│
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
├── CHANGELOG.md                     # Version history
├── CONTRIBUTING.md                  # Contribution guidelines
├── LICENSE                          # MIT License
├── CLAUDE.md                        # Claude Code guidance
└── package.json                     # Root package.json (workspaces)
```

### Key Files Explained

#### Backend
- **`app/main.py`**: FastAPI application with all HTTP endpoints and SSE streaming
- **`app/config.py`**: Pydantic-based configuration loading from environment variables
- **`app/agents/chatbot_agent.py`**: Agno agent wrapper with streaming and session management

#### Frontend
- **`src/App.tsx`**: Main application component with routing and top-level state
- **`src/hooks/useStreamingChat.ts`**: Custom hook handling SSE streaming and message updates
- **`src/store/api/conversationsApi.ts`**: RTK Query API for conversation CRUD operations and streaming helper
- **`src/components/ChatLayout.tsx`**: Main layout orchestrating sidebar and chat area
- **`src/components/memoized-markdown.tsx`**: Performance-optimized markdown renderer with block-level memoization

## ⚙️ Configuration

### Backend Configuration (.env)

All backend configuration is managed through environment variables:

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `ENV` | `local` | Environment type | `local`, `prod` |
| `OLLAMA_MODEL` | `llama3.2:3b` | Ollama model identifier | `llama3.2:1b`, `llama3.3:70b`, `gpt-oss:20b` |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL | `http://localhost:11434` |
| `MODEL_TIMEOUT_S` | `60` | Model request timeout (seconds) | `60`, `120` |
| `POSTGRES_URL` | *Required* | PostgreSQL connection string | `postgresql+psycopg://user:pass@host/db` |
| `MAX_HISTORY` | `20` | Max messages per conversation | `10`, `50`, `100` |
| `HOST` | `0.0.0.0` | Server bind host | `0.0.0.0`, `127.0.0.1` |
| `PORT` | `8000` | Server bind port | `8000`, `3000` |

**Switching Models:**

Edit `.env`:
```bash
OLLAMA_MODEL=llama3.3:70b
```

Download the model:
```bash
ollama pull llama3.3:70b
```

Restart the backend server.

### Frontend Configuration

Frontend uses environment variables prefixed with `VITE_`:

Create `frontend/.env.local`:
```bash
# Optional: Override API URL (defaults to http://localhost:8000)
VITE_API_URL=https://your-api-domain.com
```

Configuration is accessed in `frontend/src/config/api.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  ENDPOINTS: {
    CHAT: "/chat",
    CHAT_STREAM: "/chat/stream",
    HEALTH: "/healthz",
  },
};
```

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication
Currently no authentication required (add in production).

---

### `GET /healthz`

Health check endpoint to verify server status.

**Response:**
```json
{
  "status": "ok",
  "environment": "local",
  "model": "llama3.2:3b",
  "database": "postgresql"
}
```

**Status Codes:**
- `200 OK`: Server is healthy

---

### `POST /chat`

Send a chat message and receive a complete (non-streaming) response.

**Request Body:**
```json
{
  "message": "What is the capital of France?",
  "conversation_id": "conv-123"  // Optional, auto-generated if omitted
}
```

**Response:**
```json
{
  "conversation_id": "conv-123",
  "reply": "The capital of France is Paris.",
  "usage": {
    "model": "llama3.2:3b"
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `503 Service Unavailable`: Agent not initialized
- `500 Internal Server Error`: Processing error

---

### `POST /chat/stream`

Send a chat message and receive a streaming (token-by-token) response via SSE.

**Request Body:**
```json
{
  "message": "Tell me a story",
  "conversation_id": "conv-456"  // Optional
}
```

**Response (Server-Sent Events):**

```
data: {"delta": "Once"}

data: {"delta": " upon"}

data: {"delta": " a"}

data: {"delta": " time"}

data: {"delta": "..."}

data: {"done": true, "conversation_id": "conv-456", "response": "Once upon a time...", "usage": {"model": "llama3.2:3b"}}
```

**Event Format:**
- Each line starts with `data: `
- Each data payload is a JSON object
- Delta events: `{"delta": "token"}`
- Final event: `{"done": true, "conversation_id": "...", "response": "...", "usage": {...}}`

**Headers:**
- `Content-Type: application/json`
- `Accept: text/event-stream`

**Status Codes:**
- `200 OK`: Stream started
- `503 Service Unavailable`: Agent not initialized

---

### `GET /conversations`

List all conversations with summary information.

**Response:**
```json
[
  {
    "conversation_id": "conv-123",
    "title": "What is the capital of France?",
    "message_count": 4,
    "created_at": "2025-11-10T15:47:46",
    "updated_at": "2025-11-10T15:50:18"
  },
  {
    "conversation_id": "conv-456",
    "title": "Tell me a story",
    "message_count": 2,
    "created_at": "2025-11-10T16:00:00",
    "updated_at": "2025-11-10T16:01:30"
  }
]
```

**Notes:**
- System messages are excluded from `message_count`
- Timestamps are in ISO 8601 format
- Ordered by `updated_at` (most recent first)

**Status Codes:**
- `200 OK`: Success
- `503 Service Unavailable`: Agent not initialized
- `500 Internal Server Error`: Database error

---

### `GET /conversations/{conversation_id}`

Get a specific conversation with full message history.

**URL Parameters:**
- `conversation_id` (string): The conversation ID

**Response:**
```json
{
  "conversation_id": "conv-123",
  "title": "What is the capital of France?",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    },
    {
      "role": "assistant",
      "content": "The capital of France is Paris."
    },
    {
      "role": "user",
      "content": "What about Spain?"
    },
    {
      "role": "assistant",
      "content": "The capital of Spain is Madrid."
    }
  ],
  "created_at": "2025-11-10T15:47:46",
  "updated_at": "2025-11-10T15:50:18"
}
```

**Notes:**
- System messages are filtered out from `messages` array
- Only `user` and `assistant` messages are returned

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Conversation doesn't exist
- `503 Service Unavailable`: Agent not initialized
- `500 Internal Server Error`: Database error

---

### `DELETE /conversations/{conversation_id}`

Delete a conversation permanently.

**URL Parameters:**
- `conversation_id` (string): The conversation ID to delete

**Response:**
```json
{
  "status": "success",
  "conversation_id": "conv-123"
}
```

**Status Codes:**
- `200 OK`: Successfully deleted
- `503 Service Unavailable`: Agent not initialized
- `500 Internal Server Error`: Deletion failed

---

### `PATCH /conversations/{conversation_id}/title`

Update the title of a conversation.

**URL Parameters:**
- `conversation_id` (string): The conversation ID

**Request Body:**
```json
{
  "title": "My Important Conversation"
}
```

**Response:**
```json
{
  "status": "success",
  "conversation_id": "conv-123",
  "title": "My Important Conversation"
}
```

**Status Codes:**
- `200 OK`: Successfully updated
- `404 Not Found`: Conversation doesn't exist
- `503 Service Unavailable`: Agent not initialized
- `500 Internal Server Error`: Update failed

---

For complete API documentation with examples, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 💻 Development

### Backend Development

```bash
# Activate virtual environment
cd backend
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Run with auto-reload (development mode)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use Make (if available)
make dev

# Format code (requires black)
pip install black
black app/

# Lint code (requires ruff)
pip install ruff
ruff check app/

# Type checking (optional)
pip install mypy
mypy app/
```

### Frontend Development

```bash
cd frontend

# Start dev server with HMR (Hot Module Replacement)
npm run dev

# Type checking
npm run type-check

# Lint JavaScript/TypeScript
npm run lint

# Format code (if configured)
npm run format

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Adding New Features

#### Backend: Add a New Endpoint

1. **Define Pydantic Models** in `app/main.py`:
   ```python
   class MyRequest(BaseModel):
       field: str

   class MyResponse(BaseModel):
       result: str
   ```

2. **Add Endpoint**:
   ```python
   @app.post("/my-endpoint", response_model=MyResponse)
   async def my_endpoint(request: MyRequest) -> MyResponse:
       # Your logic here
       return MyResponse(result="...")
   ```

3. **Add Tests** in `tests/`:
   ```python
   def test_my_endpoint():
       response = client.post("/my-endpoint", json={"field": "value"})
       assert response.status_code == 200
   ```

#### Frontend: Add a New Component

1. **Create Component** in `src/components/`:
   ```typescript
   export function MyComponent({ prop }: { prop: string }) {
     return <div>{prop}</div>;
   }
   ```

2. **Add to Parent Component**:
   ```typescript
   import { MyComponent } from "./components/MyComponent";

   <MyComponent prop="value" />
   ```

3. **Style with Tailwind**:
   ```typescript
   <div className="flex items-center gap-2 p-4 bg-gray-100">
     ...
   </div>
   ```

#### Adding Redux State

1. **Update Slice** in `src/store/slices/`:
   ```typescript
   reducers: {
     myAction: (state, action: PayloadAction<string>) => {
       state.myField = action.payload;
     }
   }
   ```

2. **Export Action**:
   ```typescript
   export const { myAction } = mySlice.actions;
   ```

3. **Use in Component**:
   ```typescript
   import { useAppDispatch } from "@/store/hooks";
   import { myAction } from "@/store/slices/mySlice";

   const dispatch = useAppDispatch();
   dispatch(myAction("value"));
   ```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for comprehensive development guide.

## 🚢 Deployment

### Production Checklist

- [ ] Set `ENV=prod` in backend `.env`
- [ ] Use strong PostgreSQL password
- [ ] Enable CORS restrictions in `app/main.py`
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Deploy Ollama on GPU-enabled server
- [ ] Build frontend with `npm run build`
- [ ] Set `VITE_API_URL` to production API URL

### Backend Deployment Options

**Option 1: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Option 2: Render**
1. Connect GitHub repository
2. Select "Web Service"
3. Set build command: `pip install -r backend/requirements.txt`
4. Set start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

**Option 3: Fly.io**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### Frontend Deployment Options

**Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

**Option 2: Netlify**
```bash
# Build
cd frontend
npm run build

# Drag dist/ folder to Netlify Dashboard
# Or use Netlify CLI
netlify deploy --prod
```

**Option 3: Cloudflare Pages**
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/dist`

### Database: Neon PostgreSQL

Already configured for production use:
- Serverless architecture
- Auto-scaling
- Automatic backups
- Free tier available

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_chat_stream.py -v

# Run with coverage
pytest --cov=app --cov-report=html

# Or use Make
make test
make test-coverage
```

### Frontend Tests

```bash
cd frontend

# Run tests (if configured)
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Manual Testing

**Test Streaming:**
```bash
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Count to 5"}' \
  --no-buffer
```

**Test Conversation Persistence:**
```bash
# Send message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi", "conversation_id": "test-123"}'

# List conversations
curl http://localhost:8000/conversations

# Get specific conversation
curl http://localhost:8000/conversations/test-123
```

## 🐛 Troubleshooting

### Common Backend Issues

**Issue: Ollama connection failed**
```
Error: Could not connect to Ollama at http://localhost:11434
```
**Solution:**
```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

---

**Issue: Database connection error**
```
Error: password authentication failed for user
```
**Solution:**
- Check `POSTGRES_URL` in `.env` is correct
- Verify password and hostname
- Ensure `?sslmode=require` is in connection string
- Test connection string with `psql`:
  ```bash
  psql "postgresql://user:pass@host/db?sslmode=require"
  ```

---

**Issue: Model not found**
```
Error: model 'llama3.2:3b' not found
```
**Solution:**
```bash
# Download the model
ollama pull llama3.2:3b

# Verify it's downloaded
ollama list
```

---

**Issue: Port already in use**
```
ERROR: [Errno 48] Address already in use
```
**Solution:**
```bash
# Find process using port 8000
lsof -ti:8000

# Kill the process
kill -9 $(lsof -ti:8000)

# Or change port in .env
PORT=8001
```

### Common Frontend Issues

**Issue: Can't connect to backend**
```
Failed to fetch from http://localhost:8000
```
**Solution:**
- Verify backend is running: `curl http://localhost:8000/healthz`
- Check CORS is enabled in `app/main.py`
- Clear browser cache
- Check `VITE_API_URL` in frontend config

---

**Issue: Type errors after changes**
```
Type 'X' is not assignable to type 'Y'
```
**Solution:**
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

---

**Issue: Blank page after build**
```
Page shows nothing in production
```
**Solution:**
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check base path in `vite.config.ts`
- Ensure all assets are loading

### Performance Issues

**Slow responses:**
- Use a smaller model: `llama3.2:1b`
- Increase `MODEL_TIMEOUT_S`
- Check Ollama GPU usage: `nvidia-smi` (if NVIDIA GPU)

**High memory usage:**
- Reduce `MAX_HISTORY`
- Use smaller model
- Monitor with: `htop` or `Activity Monitor`

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for comprehensive troubleshooting guide.

## 🤖 AI Development Journey

### How This Project Was Built

This entire project was developed using **Claude Code**, Anthropic's AI coding assistant. Every line of code, architectural decision, and documentation was created through iterative collaboration between the developer and Claude.

**Development Process:**

1. **Initial Setup**: Backend structure with Agno and Ollama integration
2. **Database Migration**: Transitioned from SQLite to PostgreSQL (Neon)
3. **Frontend Development**: Built modern React interface with TypeScript
4. **State Management**: Implemented Redux Toolkit with RTK Query
5. **Feature Addition**: Conversation management, streaming, persistence
6. **Debugging**: Fixed serialization issues, infinite loops, type errors
7. **Documentation**: Comprehensive documentation at every step

**Key AI Contributions:**

- ✅ **Code Generation**: 100% of backend and frontend code
- ✅ **Architecture Design**: System design and component structure
- ✅ **Debugging**: Identified and fixed bugs with root cause analysis
- ✅ **Best Practices**: Applied modern development patterns
- ✅ **Documentation**: Created comprehensive docs and comments
- ✅ **Testing**: Designed test strategies and validation

**Technologies Chosen by AI:**

- FastAPI for backend (async, type-safe, auto-docs)
- Agno for agent framework (native PostgreSQL support)
- React + TypeScript for frontend (type safety)
- Redux Toolkit for state management (modern Redux)
- Tailwind CSS for styling (utility-first)
- shadcn/ui for components (accessible, customizable)

This project demonstrates that with proper AI assistance, complex full-stack applications can be built efficiently while maintaining high code quality and best practices.

See [docs/AI_DEVELOPMENT.md](docs/AI_DEVELOPMENT.md) for detailed AI development journey.

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation.

### How to Contribute

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/agno-ollama-chatbot.git
   cd agno-ollama-chatbot
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Write clear, commented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

5. **Test your changes**
   ```bash
   # Backend
   cd backend
   pytest

   # Frontend
   cd frontend
   npm run type-check
   npm run lint
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Describe your changes
   - Link related issues

### Development Guidelines

- **Code Style**: Follow existing patterns and conventions
- **Commits**: Write clear, descriptive commit messages
- **Documentation**: Update README and docs for significant changes
- **Tests**: Add tests for new features
- **TypeScript**: Maintain type safety in frontend
- **Python**: Use type hints and Pydantic models

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Agno Ollama Chatbot Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

### Technologies & Frameworks
- **[Agno](https://agno.com/)** - Excellent agent framework with first-class PostgreSQL support
- **[Ollama](https://ollama.com/)** - Making local LLM inference accessible to everyone
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern, fast web framework for Python
- **[React](https://react.dev/)** - Powerful UI library
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL platform
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - Modern Redux made simple

### Development Tools
- **[Claude Code](https://claude.ai/code)** - AI coding assistant that developed this entire project
- **[Anthropic](https://www.anthropic.com/)** - For creating Claude and advancing AI safety

### Community
- Open source community for inspiration and tools
- GitHub for hosting and collaboration
- All contributors who will improve this project

## 📚 Additional Documentation

Explore comprehensive documentation:

- **[Architecture Guide](docs/ARCHITECTURE.md)** - Detailed system architecture and design decisions
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Development Guide](docs/DEVELOPMENT.md)** - Development best practices and guidelines
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment strategies
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Solutions to common problems
- **[AI Development Journey](docs/AI_DEVELOPMENT.md)** - How AI built this project
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute

## 📞 Support & Community

### Getting Help

- 🐛 **[Report a Bug](https://github.com/roeiex74/agno-ollama-chatbot/issues/new?template=bug_report.md)**
- 💡 **[Request a Feature](https://github.com/roeiex74/agno-ollama-chatbot/issues/new?template=feature_request.md)**
- 💬 **[Discussions](https://github.com/roeiex74/agno-ollama-chatbot/discussions)** - Ask questions, share ideas
- 📖 **[Wiki](https://github.com/roeiex74/agno-ollama-chatbot/wiki)** - Additional guides and tutorials

### Stay Updated

- ⭐ **Star this repository** to show support
- 👀 **Watch** for updates and releases
- 🔔 **Subscribe** to release notifications

## 🎯 Roadmap

### Phase 1: Core Features ✅ (Complete)
- [x] FastAPI backend with Agno integration
- [x] PostgreSQL database (Neon)
- [x] Streaming chat with SSE
- [x] React 19 frontend with TypeScript
- [x] Conversation management (CRUD)
- [x] Redux Toolkit state management
- [x] Auto-title generation
- [x] Responsive UI design
- [x] Markdown rendering with syntax highlighting
- [x] Performance-optimized memoized rendering
- [x] Copy button for assistant messages

### Phase 2: Enhancements 🚧 (Upcoming)
- [ ] User authentication & multi-user support
- [ ] Conversation sharing
- [ ] Export conversations (JSON, Markdown, PDF)
- [ ] Search across conversations
- [ ] Conversation folders/tags
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Voice input support

### Phase 3: Advanced Features 🔮 (Future)
- [ ] Multi-agent workflows (Agno Teams)
- [ ] Tool integration (web search, calculator, etc.)
- [ ] File upload and analysis
- [ ] Code execution in sandbox
- [ ] Custom system prompts
- [ ] Model switching in UI
- [ ] Conversation branching
- [ ] Analytics dashboard

### Phase 4: Scale & Performance 🚀 (Future)
- [ ] Redis caching
- [ ] WebSocket support
- [ ] Horizontal scaling
- [ ] Rate limiting
- [ ] Monitoring & observability
- [ ] Load balancing
- [ ] CDN integration

---

<div align="center">

**Built with ❤️ using Claude Code**

[🏠 Home](https://github.com/roeiex74/agno-ollama-chatbot) • [📖 Docs](docs/) • [🐛 Issues](https://github.com/roeiex74/agno-ollama-chatbot/issues) • [💬 Discussions](https://github.com/roeiex74/agno-ollama-chatbot/discussions)

**Star ⭐ this repository if you find it helpful!**

</div>
