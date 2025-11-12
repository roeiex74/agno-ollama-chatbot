# Architecture Document
## Agno + Ollama Full-Stack Chatbot

**Version:** 1.0
**Date:** January 2025
**Status:** Production

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [C4 Model Architecture Views](#2-c4-model-architecture-views)
   - [Level 1: System Context](#21-level-1-system-context-diagram)
   - [Level 2: Container](#22-level-2-container-diagram)
   - [Level 3: Component](#23-level-3-component-diagram)
   - [Level 4: Code](#24-level-4-code-diagram)
3. [Deployment Architecture](#3-deployment-architecture)
4. [Data Architecture](#4-data-architecture)
5. [API Specifications](#5-api-specifications)
6. [External Integrations](#6-external-integrations)
7. [Architectural Decision Records (ADRs)](#7-architectural-decision-records-adrs)
8. [Quality Attributes](#8-quality-attributes)
9. [Security Architecture](#9-security-architecture)
10. [Technology Stack Details](#10-technology-stack-details)

---

## 1. Introduction

### 1.1 Purpose

This document describes the technical architecture of the Agno + Ollama Full-Stack Chatbot system. It provides multiple views of the system at different abstraction levels using the C4 Model (Context, Container, Component, Code), along with deployment diagrams, API specifications, and architectural decisions.

### 1.2 Scope

The architecture covers:
- System boundaries and external interactions
- Internal component structure and responsibilities
- Data flow and storage patterns
- API contracts and communication protocols
- Deployment topology and infrastructure
- Key architectural decisions and their rationale

### 1.3 Audience

- **Development Team**: For implementation guidance and onboarding
- **Technical Architects**: For design review and evolution planning
- **Operations Team**: For deployment and monitoring setup
- **Security Team**: For security assessment and compliance review
- **Stakeholders**: For technical understanding and decision-making

---

## 2. C4 Model Architecture Views

### 2.1 Level 1: System Context Diagram

The System Context diagram shows the chatbot system as a black box, surrounded by its users and external systems.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         System Context                                   │
│                                                                           │
│                                                                           │
│                          ┌──────────────┐                                │
│                          │              │                                │
│                          │  End User    │                                │
│                          │              │                                │
│                          └──────┬───────┘                                │
│                                 │                                         │
│                                 │ Interacts via                          │
│                                 │ Web Browser                            │
│                                 │ (HTTPS)                                │
│                                 ▼                                         │
│              ┌──────────────────────────────────────┐                    │
│              │                                      │                    │
│              │   Agno + Ollama Chatbot System      │                    │
│              │                                      │                    │
│              │  • Real-time AI chat interface       │                    │
│              │  • Conversation persistence          │                    │
│              │  • Local LLM inference              │                    │
│              │                                      │                    │
│              └───────┬──────────────────┬──────────┘                    │
│                      │                  │                                │
│                      │ Uses             │ Stores data in                │
│                      │ (HTTP)           │ (PostgreSQL protocol)         │
│                      │                  │                                │
│                      ▼                  ▼                                │
│          ┌──────────────────┐  ┌──────────────────┐                    │
│          │                  │  │                  │                    │
│          │  Ollama Service  │  │  Neon PostgreSQL │                    │
│          │                  │  │   (External)     │                    │
│          │  • Model hosting │  │                  │                    │
│          │  • LLM inference │  │  • Serverless DB │                    │
│          │  • Local runtime │  │  • Managed cloud │                    │
│          │                  │  │                  │                    │
│          └──────────────────┘  └──────────────────┘                    │
│           (Local/On-prem)        (Cloud Service)                        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Interactions:**

1. **End User ↔ Chatbot System**: Users interact through web browser (HTTPS/HTTP)
2. **Chatbot System → Ollama Service**: Backend requests LLM inference (HTTP REST)
3. **Chatbot System → Neon PostgreSQL**: Backend stores/retrieves conversation data (PostgreSQL wire protocol over TLS)

**External Dependencies:**

- **Ollama Service**: Local LLM runtime (self-hosted, localhost:11434)
- **Neon PostgreSQL**: Cloud-hosted serverless PostgreSQL database (managed service)

---

### 2.2 Level 2: Container Diagram

The Container diagram shows the high-level technology choices and how containers communicate.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              Container Architecture                                │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────┐    │
│   │                        End User's Browser                                │    │
│   │                                                                           │    │
│   │  ┌──────────────────────────────────────────────────────────────────┐  │    │
│   │  │                   React Frontend (SPA)                            │  │    │
│   │  │                                                                    │  │    │
│   │  │  Technology:                                                      │  │    │
│   │  │  • React 19 + TypeScript                                          │  │    │
│   │  │  • Vite 7.x (build tool)                                          │  │    │
│   │  │  • Redux Toolkit (state management)                               │  │    │
│   │  │  • RTK Query (data fetching)                                      │  │    │
│   │  │  • Tailwind CSS + shadcn/ui                                       │  │    │
│   │  │                                                                    │  │    │
│   │  │  Responsibilities:                                                 │  │    │
│   │  │  • User interface rendering                                       │  │    │
│   │  │  • Client-side state management                                   │  │    │
│   │  │  • SSE stream consumption                                         │  │    │
│   │  │  • Optimistic UI updates                                          │  │    │
│   │  │  • Markdown rendering with syntax highlighting                    │  │    │
│   │  │                                                                    │  │    │
│   │  └──────────────────────────┬───────────────────────────────────────┘  │    │
│   │                              │                                            │    │
│   └──────────────────────────────┼────────────────────────────────────────────┘    │
│                                  │                                                  │
│                                  │ HTTP/HTTPS                                      │
│                                  │ • REST API (JSON)                               │
│                                  │ • Server-Sent Events (SSE)                      │
│                                  │                                                  │
│                                  ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐      │
│   │                    FastAPI Backend (API Server)                         │      │
│   │                                                                          │      │
│   │  Technology:                                                            │      │
│   │  • FastAPI 0.115+ (Python 3.11+)                                        │      │
│   │  • Uvicorn (ASGI server)                                                │      │
│   │  • Pydantic 2.x (validation)                                            │      │
│   │  • Agno (agent framework)                                               │      │
│   │                                                                          │      │
│   │  Responsibilities:                                                       │      │
│   │  • RESTful API endpoints                                                │      │
│   │  • SSE streaming orchestration                                          │      │
│   │  • Request validation                                                   │      │
│   │  • Agent lifecycle management                                           │      │
│   │  • Database session handling                                            │      │
│   │  • CORS policy enforcement                                              │      │
│   │                                                                          │      │
│   │  Key Endpoints:                                                         │      │
│   │  • GET /healthz                                                         │      │
│   │  • POST /chat (non-streaming)                                           │      │
│   │  • POST /chat/stream (SSE streaming)                                    │      │
│   │  • GET /conversations                                                   │      │
│   │  • GET /conversations/{id}                                              │      │
│   │  • DELETE /conversations/{id}                                           │      │
│   │  • PATCH /conversations/{id}/title                                      │      │
│   │                                                                          │      │
│   └─────────────┬────────────────────────────────────┬─────────────────────┘      │
│                 │                                     │                             │
│                 │ HTTP                                │ PostgreSQL                 │
│                 │ (REST API)                          │ Wire Protocol              │
│                 │                                     │ (TLS encrypted)            │
│                 ▼                                     ▼                             │
│   ┌──────────────────────────┐       ┌──────────────────────────────────┐        │
│   │   Ollama LLM Service     │       │    PostgreSQL Database           │        │
│   │                          │       │    (Neon - Serverless)           │        │
│   │  Technology:             │       │                                  │        │
│   │  • Ollama runtime        │       │  Technology:                     │        │
│   │  • llama3.2, llama3.3    │       │  • PostgreSQL 16+                │        │
│   │  • Local inference       │       │  • Neon serverless platform      │        │
│   │                          │       │  • Connection pooling            │        │
│   │  Responsibilities:       │       │  • Automatic scaling             │        │
│   │  • Model loading         │       │                                  │        │
│   │  • Token generation      │       │  Responsibilities:               │        │
│   │  • Context management    │       │  • Conversation persistence      │        │
│   │  • Streaming responses   │       │  • Session management (Agno)     │        │
│   │                          │       │  • ACID transactions             │        │
│   │  Port: 11434             │       │  • Data integrity enforcement    │        │
│   │                          │       │                                  │        │
│   └──────────────────────────┘       │  Schema:                         │        │
│                                       │  • agno_sessions table           │        │
│                                       │  • JSONB columns for flexibility │        │
│                                       │                                  │        │
│                                       └──────────────────────────────────┘        │
│                                                                                     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Container Responsibilities:**

1. **React Frontend (SPA)**
   - Served as static assets
   - Runs entirely in user's browser
   - Manages UI state and rendering
   - Handles SSE stream parsing

2. **FastAPI Backend (API Server)**
   - Stateless HTTP service
   - Orchestrates agent interactions
   - Manages database connections via Agno
   - Provides CORS for cross-origin requests

3. **Ollama LLM Service**
   - Stateful model service
   - Manages loaded models in memory
   - Provides HTTP inference API
   - Supports streaming responses

4. **PostgreSQL Database**
   - Managed cloud database (Neon)
   - Stores conversation sessions
   - JSONB for flexible schema
   - Automatic backups and scaling

---

### 2.3 Level 3: Component Diagram

The Component diagram zooms into each container to show internal components and their interactions.

#### 2.3.1 React Frontend Components

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        React Frontend (SPA)                               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Presentation Layer                            │    │
│  │                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │    │
│  │  │ ChatLayout   │  │ ChatArea     │  │ ConversationList   │   │    │
│  │  │              │  │              │  │                    │   │    │
│  │  │ • Sidebar    │  │ • Message    │  │ • Sidebar items   │   │    │
│  │  │ • Main area  │  │   rendering  │  │ • New chat button │   │    │
│  │  │ • Responsive │  │ • Auto-scroll│  │ • Delete modal    │   │    │
│  │  │              │  │ • Loading    │  │                    │   │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘   │    │
│  │                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │    │
│  │  │ ChatInput    │  │ ChatMessage  │  │ MemoizedMarkdown   │   │    │
│  │  │              │  │              │  │                    │   │    │
│  │  │ • Text input │  │ • User msg   │  │ • GFM support     │   │    │
│  │  │ • Auto-resize│  │ • Assistant  │  │ • Syntax highlight│   │    │
│  │  │ • Send button│  │ • Copy button│  │ • Block memoize   │   │    │
│  │  │              │  │ • Timestamp  │  │                    │   │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘   │    │
│  └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                         │
│  ┌─────────────────────────────▼───────────────────────────────────┐    │
│  │                    Custom Hooks Layer                            │    │
│  │                                                                   │    │
│  │  ┌──────────────────────┐  ┌─────────────────────────────┐     │    │
│  │  │ useStreamingChat     │  │ use-mobile                  │     │    │
│  │  │                      │  │                             │     │    │
│  │  │ • sendMessage()      │  │ • Responsive breakpoints    │     │    │
│  │  │ • cancelStream()     │  │                             │     │    │
│  │  │ • SSE parsing        │  │                             │     │    │
│  │  │ • AbortController    │  │                             │     │    │
│  │  └──────────────────────┘  └─────────────────────────────┘     │    │
│  └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                         │
│  ┌─────────────────────────────▼───────────────────────────────────┐    │
│  │                    State Management (Redux)                      │    │
│  │                                                                   │    │
│  │  ┌────────────────────────────────────────────────────────┐     │    │
│  │  │              Redux Store (store.ts)                     │     │    │
│  │  │                                                          │     │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │     │    │
│  │  │  │ Conversations│  │  UI Slice    │  │ RTK Query    │ │     │    │
│  │  │  │    Slice     │  │              │  │   Cache      │ │     │    │
│  │  │  │              │  │ • Streaming  │  │              │ │     │    │
│  │  │  │ • Messages   │  │ • Loading    │  │ • API state  │ │     │    │
│  │  │  │ • Current ID │  │ • Errors     │  │ • Invalidate │ │     │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘ │     │    │
│  │  └────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                         │
│  ┌─────────────────────────────▼───────────────────────────────────┐    │
│  │                    API Layer (RTK Query)                         │    │
│  │                                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │           conversationsApi.ts                             │   │    │
│  │  │                                                            │   │    │
│  │  │  • useGetConversationsQuery()                            │   │    │
│  │  │  • useGetConversationQuery()                             │   │    │
│  │  │  • useDeleteConversationMutation()                       │   │    │
│  │  │  • useUpdateConversationTitleMutation()                  │   │    │
│  │  │  • createStreamingChatRequest() - Helper                 │   │    │
│  │  │                                                            │   │    │
│  │  │  Configuration:                                           │   │    │
│  │  │  • Base URL from config/api.ts                           │   │    │
│  │  │  • Tag-based cache invalidation                          │   │    │
│  │  │  • Automatic refetch control                             │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └───────────────────────────────────────────────────────────────────    │
│                                 │                                         │
│                                 │ HTTP/SSE                                │
│                                 ▼                                         │
│                        Backend REST API                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Responsibilities:**

**Presentation Layer:**
- `ChatLayout`: Main layout orchestrator, manages sidebar and chat area
- `ChatArea`: Displays message list with auto-scrolling
- `ConversationList`: Sidebar with conversation summaries
- `ChatInput`: Message input with auto-resize textarea
- `ChatMessage`: Individual message component with role-based styling
- `MemoizedMarkdown`: Performance-optimized markdown renderer

**Custom Hooks:**
- `useStreamingChat`: Manages SSE streaming, AbortController, and message accumulation
- `use-mobile`: Detects mobile viewport for responsive behavior

**State Management:**
- `conversationsSlice`: Manages conversation list and messages
- `uiSlice`: Manages UI state (loading, streaming, errors)
- RTK Query Cache: Automatic caching and invalidation for API requests

**API Layer:**
- `conversationsApi`: Centralized API definitions with RTK Query
- `createStreamingChatRequest`: Helper for SSE fetch outside RTK Query

#### 2.3.2 FastAPI Backend Components

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend (API Server)                         │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    API Layer (main.py)                           │    │
│  │                                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │              FastAPI Application                          │  │    │
│  │  │                                                            │  │    │
│  │  │  Middleware:                                              │  │    │
│  │  │  • CORSMiddleware (configurable origins)                 │  │    │
│  │  │                                                            │  │    │
│  │  │  Endpoints:                                               │  │    │
│  │  │  ┌────────────────────────────────────────────────┐     │  │    │
│  │  │  │ GET  /healthz                                  │     │  │    │
│  │  │  │ POST /chat                                     │     │  │    │
│  │  │  │ POST /chat/stream                              │     │  │    │
│  │  │  │ GET  /conversations                            │     │  │    │
│  │  │  │ GET  /conversations/{id}                       │     │  │    │
│  │  │  │ DELETE /conversations/{id}                     │     │  │    │
│  │  │  │ PATCH /conversations/{id}/title                │     │  │    │
│  │  │  └────────────────────────────────────────────────┘     │  │    │
│  │  │                                                            │  │    │
│  │  │  Pydantic Models:                                         │  │    │
│  │  │  • ChatRequest                                            │  │    │
│  │  │  • ChatResponse                                           │  │    │
│  │  │  • HealthResponse                                         │  │    │
│  │  │  • ConversationSummary                                    │  │    │
│  │  │  • ConversationDetail                                     │  │    │
│  │  │  • UpdateTitleRequest                                     │  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                         │
│  ┌─────────────────────────────▼───────────────────────────────────┐    │
│  │                Configuration Layer (config.py)                   │    │
│  │                                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │           Settings (Pydantic BaseSettings)                │  │    │
│  │  │                                                            │  │    │
│  │  │  • env: Environment (LOCAL, PROD, TEST)                  │  │    │
│  │  │  • ollama_model: str                                     │  │    │
│  │  │  • ollama_host: str                                      │  │    │
│  │  │  • model_timeout_s: int                                  │  │    │
│  │  │  • database_url: str                                     │  │    │
│  │  │  • max_history: int                                      │  │    │
│  │  │  • host: str                                             │  │    │
│  │  │  • port: int                                             │  │    │
│  │  │                                                            │  │    │
│  │  │  Loaded from: .env file                                  │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                         │
│  ┌─────────────────────────────▼───────────────────────────────────┐    │
│  │               Agent Layer (agents/chatbot_agent.py)              │    │
│  │                                                                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │                 ChatbotAgent                              │  │    │
│  │  │                                                            │  │    │
│  │  │  Dependencies:                                            │  │    │
│  │  │  • PostgresDb instance (injected)                        │  │    │
│  │  │  • Ollama model (initialized from config)                │  │    │
│  │  │                                                            │  │    │
│  │  │  Methods:                                                 │  │    │
│  │  │  ┌────────────────────────────────────────────────┐     │  │    │
│  │  │  │ chat(message, conversation_id, stream)         │     │  │    │
│  │  │  │   → Orchestrates agent interaction             │     │  │    │
│  │  │  │                                                 │     │  │    │
│  │  │  │ _chat_complete(conversation_id, message)       │     │  │    │
│  │  │  │   → Non-streaming response handler             │     │  │    │
│  │  │  │   → Creates Agno Agent                         │     │  │    │
│  │  │  │   → Runs agent.arun()                          │     │  │    │
│  │  │  │   → Returns complete response                  │     │  │    │
│  │  │  │                                                 │     │  │    │
│  │  │  │ _chat_stream(conversation_id, message)         │     │  │    │
│  │  │  │   → Streaming response handler                 │     │  │    │
│  │  │  │   → Creates Agno Agent                         │     │  │    │
│  │  │  │   → Yields deltas from agent.arun(stream=True) │     │  │    │
│  │  │  │   → Auto-persists to DB after completion       │     │  │    │
│  │  │  └────────────────────────────────────────────────┘     │  │    │
│  │  │                                                            │  │    │
│  │  │  Agent Configuration:                                     │  │    │
│  │  │  • session_id: conversation_id                           │  │    │
│  │  │  • add_history_to_context: true                          │  │    │
│  │  │  • num_history_runs: max_history (from config)           │  │    │
│  │  │  • markdown: false (plain text output)                   │  │    │
│  │  │  • description: System prompt                            │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                         │
│                                 │ Uses Agno Framework                     │
│                                 ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │              Agno Framework (External Library)                 │      │
│  │                                                                 │      │
│  │  ┌──────────────────────────────────────────────────────┐     │      │
│  │  │  Agent (agno.agent.Agent)                            │     │      │
│  │  │  • Manages conversation context                      │     │      │
│  │  │  • Loads history from PostgresDb                     │     │      │
│  │  │  • Calls Ollama model                                │     │      │
│  │  │  • Auto-saves sessions after completion              │     │      │
│  │  └──────────────────────────────────────────────────────┘     │      │
│  │                                                                 │      │
│  │  ┌──────────────────────────────────────────────────────┐     │      │
│  │  │  Ollama (agno.models.ollama.Ollama)                  │     │      │
│  │  │  • HTTP client for Ollama API                        │     │      │
│  │  │  • Handles streaming and non-streaming              │     │      │
│  │  │  • Token generation                                  │     │      │
│  │  └──────────────────────────────────────────────────────┘     │      │
│  │                                                                 │      │
│  │  ┌──────────────────────────────────────────────────────┐     │      │
│  │  │  PostgresDb (agno.db.postgres.PostgresDb)            │     │      │
│  │  │  • Connection management                             │     │      │
│  │  │  • Session CRUD operations                           │     │      │
│  │  │  • get_sessions(session_type)                        │     │      │
│  │  │  • get_session(session_id, session_type)             │     │      │
│  │  │  • upsert_session(session)                           │     │      │
│  │  │  • delete_session(session_id)                        │     │      │
│  │  └──────────────────────────────────────────────────────┘     │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                 │                                         │
│                                 ▼                                         │
│                        Ollama Service & PostgreSQL                       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Responsibilities:**

**API Layer (main.py):**
- Request validation using Pydantic models
- CORS middleware configuration
- Endpoint routing and error handling
- SSE event generation for streaming
- Lifespan management (startup/shutdown)

**Configuration Layer (config.py):**
- Environment variable loading
- Type-safe configuration with Pydantic
- Environment detection (local/prod/test)
- Configuration validation

**Agent Layer (chatbot_agent.py):**
- Agno agent lifecycle management
- Conversation history loading
- Streaming orchestration
- Database interaction abstraction

**Agno Framework:**
- Agent: Context management and history loading
- Ollama: Model communication wrapper
- PostgresDb: Database abstraction layer

---

### 2.4 Level 4: Code Diagram

The Code diagram shows key classes, interfaces, and their relationships.

#### 2.4.1 Backend Code Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                       Backend Code Structure                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                        main.py                                │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │  FastAPI app: FastAPI                                 │   │ │
│  │  │    ├─ middleware: CORSMiddleware                      │   │ │
│  │  │    ├─ lifespan: lifespan(app)                         │   │ │
│  │  │    │    ├─ Startup: Initialize PostgresDb             │   │ │
│  │  │    │    ├─ Startup: Create ChatbotAgent               │   │ │
│  │  │    │    └─ Shutdown: Cleanup resources                │   │ │
│  │  │    └─ routes:                                          │   │ │
│  │  │         ├─ @app.get("/healthz")                       │   │ │
│  │  │         ├─ @app.post("/chat")                         │   │ │
│  │  │         ├─ @app.post("/chat/stream")                  │   │ │
│  │  │         ├─ @app.get("/conversations")                 │   │ │
│  │  │         ├─ @app.get("/conversations/{id}")            │   │ │
│  │  │         ├─ @app.delete("/conversations/{id}")         │   │ │
│  │  │         └─ @app.patch("/conversations/{id}/title")    │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │  Pydantic Models:                                             │ │
│  │  ┌─────────────────────────────────────────────────┐         │ │
│  │  │  class ChatRequest(BaseModel):                  │         │ │
│  │  │    message: str                                 │         │ │
│  │  │    conversation_id: Optional[str]               │         │ │
│  │  │                                                  │         │ │
│  │  │  class ChatResponse(BaseModel):                 │         │ │
│  │  │    conversation_id: str                         │         │ │
│  │  │    reply: str                                   │         │ │
│  │  │    usage: dict                                  │         │ │
│  │  │                                                  │         │ │
│  │  │  class ConversationSummary(BaseModel):          │         │ │
│  │  │    conversation_id: str                         │         │ │
│  │  │    title: Optional[str]                         │         │ │
│  │  │    message_count: int                           │         │ │
│  │  │    created_at: Optional[str]                    │         │ │
│  │  │    updated_at: Optional[str]                    │         │ │
│  │  └─────────────────────────────────────────────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       config.py                               │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────┐         │ │
│  │  │  class Environment(str, Enum):                  │         │ │
│  │  │    LOCAL = "local"                              │         │ │
│  │  │    PROD = "prod"                                │         │ │
│  │  │    TEST = "test"                                │         │ │
│  │  │                                                  │         │ │
│  │  │  class Settings(BaseSettings):                  │         │ │
│  │  │    env: Environment                             │         │ │
│  │  │    ollama_model: str                            │         │ │
│  │  │    ollama_host: str                             │         │ │
│  │  │    model_timeout_s: int                         │         │ │
│  │  │    database_url: str                            │         │ │
│  │  │    max_history: int                             │         │ │
│  │  │    host: str                                    │         │ │
│  │  │    port: int                                    │         │ │
│  │  │                                                  │         │ │
│  │  │    @property                                    │         │ │
│  │  │    def is_prod(self) -> bool                    │         │ │
│  │  │                                                  │         │ │
│  │  │  settings: Settings = Settings()               │         │ │
│  │  └─────────────────────────────────────────────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                 agents/chatbot_agent.py                       │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────┐         │ │
│  │  │  class ChatbotAgent:                            │         │ │
│  │  │                                                  │         │ │
│  │  │    db: PostgresDb                               │         │ │
│  │  │    model: Ollama                                │         │ │
│  │  │                                                  │         │ │
│  │  │    def __init__(self, db: PostgresDb):          │         │ │
│  │  │      self.db = db                               │         │ │
│  │  │      self.model = Ollama(...)                   │         │ │
│  │  │                                                  │         │ │
│  │  │    async def chat(                              │         │ │
│  │  │      message: str,                              │         │ │
│  │  │      conversation_id: Optional[str],            │         │ │
│  │  │      stream: bool                               │         │ │
│  │  │    ) -> Dict | AsyncIterator[Dict]:             │         │ │
│  │  │      # Routes to _chat_complete or _chat_stream│         │ │
│  │  │                                                  │         │ │
│  │  │    async def _chat_complete(                    │         │ │
│  │  │      conversation_id: str,                      │         │ │
│  │  │      message: str                               │         │ │
│  │  │    ) -> Dict:                                   │         │ │
│  │  │      agent = Agent(...)                         │         │ │
│  │  │      response = await agent.arun(message)       │         │ │
│  │  │      return {...}                               │         │ │
│  │  │                                                  │         │ │
│  │  │    async def _chat_stream(                      │         │ │
│  │  │      conversation_id: str,                      │         │ │
│  │  │      message: str                               │         │ │
│  │  │    ) -> AsyncIterator[Dict]:                    │         │ │
│  │  │      agent = Agent(...)                         │         │ │
│  │  │      async for chunk in agent.arun(stream=True):│         │ │
│  │  │        yield {"delta": chunk.content}           │         │ │
│  │  │      yield {"done": True, ...}                  │         │ │
│  │  └─────────────────────────────────────────────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Frontend Code Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                      Frontend Code Structure                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  store/store.ts                               │ │
│  │                                                                │ │
│  │  export const store = configureStore({                       │ │
│  │    reducer: {                                                 │ │
│  │      [conversationsApi.reducerPath]: conversationsApi.reducer│ │
│  │      conversations: conversationsReducer                      │ │
│  │      ui: uiReducer                                            │ │
│  │    },                                                          │ │
│  │    middleware: [conversationsApi.middleware]                 │ │
│  │  })                                                            │ │
│  │                                                                │ │
│  │  export type RootState = ReturnType<typeof store.getState>   │ │
│  │  export type AppDispatch = typeof store.dispatch             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │          store/slices/conversationsSlice.ts                   │ │
│  │                                                                │ │
│  │  interface ConversationsState {                               │ │
│  │    conversations: Conversation[]                              │ │
│  │    currentConversationId: string | null                       │ │
│  │  }                                                             │ │
│  │                                                                │ │
│  │  export const conversationsSlice = createSlice({              │ │
│  │    name: "conversations",                                     │ │
│  │    initialState,                                              │ │
│  │    reducers: {                                                │ │
│  │      setCurrentConversation(state, action)                    │ │
│  │      setConversations(state, action)                          │ │
│  │      addConversation(state, action)                           │ │
│  │      addMessage(state, action)                                │ │
│  │      updateLastAssistantMessage(state, action)                │ │
│  │      updateConversationTitle(state, action)                   │ │
│  │      loadMessages(state, action)                              │ │
│  │      clearCurrentConversationMessages(state, action)          │ │
│  │    }                                                           │ │
│  │  })                                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │            store/api/conversationsApi.ts                      │ │
│  │                                                                │ │
│  │  export const conversationsApi = createApi({                 │ │
│  │    reducerPath: "conversationsApi",                           │ │
│  │    baseQuery: fetchBaseQuery({baseUrl: API_CONFIG.BASE_URL}) │ │
│  │    tagTypes: ["Conversations", "Conversation"],               │ │
│  │    endpoints: (builder) => ({                                 │ │
│  │      getConversations: builder.query<...>({...})              │ │
│  │      getConversation: builder.query<...>({...})               │ │
│  │      deleteConversation: builder.mutation<...>({...})         │ │
│  │      updateConversationTitle: builder.mutation<...>({...})    │ │
│  │    })                                                          │ │
│  │  })                                                            │ │
│  │                                                                │ │
│  │  export function createStreamingChatRequest(                  │ │
│  │    message: string,                                           │ │
│  │    conversationId: string,                                    │ │
│  │    signal?: AbortSignal                                       │ │
│  │  ): Promise<Response>                                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           hooks/useStreamingChat.ts                           │ │
│  │                                                                │ │
│  │  export function useStreamingChat() {                         │ │
│  │    const dispatch = useAppDispatch()                          │ │
│  │    const abortControllerRef = useRef<AbortController>()       │ │
│  │    const accumulatedContentRef = useRef<string>("")           │ │
│  │                                                                │ │
│  │    const sendStreamingMessage = useCallback(async (           │ │
│  │      message: string,                                         │ │
│  │      conversationId: string                                   │ │
│  │    ) => {                                                      │ │
│  │      // Add user message optimistically                       │ │
│  │      dispatch(addMessage({...}))                              │ │
│  │                                                                │ │
│  │      // Add empty assistant message                           │ │
│  │      dispatch(addMessage({...}))                              │ │
│  │                                                                │ │
│  │      // Create fetch request with AbortController             │ │
│  │      const response = await createStreamingChatRequest(...)   │ │
│  │                                                                │ │
│  │      // Read SSE stream                                       │ │
│  │      const reader = response.body.getReader()                 │ │
│  │      while (true) {                                           │ │
│  │        const {done, value} = await reader.read()              │ │
│  │        // Parse SSE format                                    │ │
│  │        // Accumulate deltas                                   │ │
│  │        // Update Redux state                                  │ │
│  │      }                                                         │ │
│  │    }, [...])                                                   │ │
│  │                                                                │ │
│  │    const cancelStream = useCallback(() => {                   │ │
│  │      abortControllerRef.current?.abort()                      │ │
│  │    }, [...])                                                   │ │
│  │                                                                │ │
│  │    return { sendStreamingMessage, cancelStream }              │ │
│  │  }                                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │             components/ChatLayout.tsx                         │ │
│  │                                                                │ │
│  │  export function ChatLayout() {                               │ │
│  │    // Redux state                                             │ │
│  │    const conversations = useAppSelector(selectAllConversations)│ │
│  │    const currentId = useAppSelector(selectCurrentConversationId)│ │
│  │    const dispatch = useAppDispatch()                          │ │
│  │                                                                │ │
│  │    // API hooks                                               │ │
│  │    const {data: conversationList} = useGetConversationsQuery()│ │
│  │                                                                │ │
│  │    return (                                                    │ │
│  │      <div className="flex h-screen">                          │ │
│  │        <ConversationList conversations={...} />               │ │
│  │        <ChatArea conversationId={currentId} />                │ │
│  │      </div>                                                    │ │
│  │    )                                                           │ │
│  │  }                                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

**Key Interfaces & Types:**

```typescript
// types/api.ts
interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number  // epoch milliseconds
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface StreamChunk {
  delta?: string
  done?: boolean
  conversation_id?: string
  response?: string
  usage?: Record<string, any>
}
```

---

## 3. Deployment Architecture

### 3.1 Development Environment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Development Environment                           │
│                                                                       │
│  Developer Workstation (localhost)                                  │
│                                                                       │
│  ┌───────────────────────┐      ┌────────────────────────────┐     │
│  │   Frontend Dev Server │      │   Backend Dev Server       │     │
│  │                       │      │                            │     │
│  │  Vite 7.x             │      │  Uvicorn (with --reload)   │     │
│  │  Port: 5173           │◄─────┤  Port: 8000                │     │
│  │  HMR enabled          │ HTTP │  Auto-reload enabled       │     │
│  │                       │      │                            │     │
│  └───────────────────────┘      └──────────┬─────────────────┘     │
│                                             │                        │
│                                             │ HTTP                   │
│                                             ▼                        │
│                             ┌────────────────────────────┐          │
│                             │   Ollama Service           │          │
│                             │   Port: 11434              │          │
│                             │   Model: llama3.2:3b       │          │
│                             └────────────────────────────┘          │
│                                                                       │
│                                             │ PostgreSQL Protocol    │
│                                             ▼                        │
│                             ┌────────────────────────────┐          │
│                             │   Neon PostgreSQL          │          │
│                             │   (Cloud - Dev Project)    │          │
│                             │   SSL/TLS encrypted        │          │
│                             └────────────────────────────┘          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Development Characteristics:
• Frontend: Hot Module Replacement (HMR) for instant updates
• Backend: Auto-reload on file changes
• Ollama: Local model serving
• Database: Neon free tier (development project)
• CORS: Permissive (allow all origins)
• Debugging: Full source maps, verbose logging
```

### 3.2 Production Environment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Production Architecture                            │
│                                                                           │
│                                                                           │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    CDN / Static Hosting                       │     │
│   │                    (Vercel / Netlify / Cloudflare)            │     │
│   │                                                                │     │
│   │   ┌────────────────────────────────────────────────────┐     │     │
│   │   │     React Frontend (Static Assets)                 │     │     │
│   │   │                                                     │     │     │
│   │   │  • index.html                                      │     │     │
│   │   │  • JavaScript bundles (tree-shaken, minified)      │     │     │
│   │   │  • CSS (optimized)                                 │     │     │
│   │   │  • Source maps (optional)                          │     │     │
│   │   │                                                     │     │     │
│   │   │  Served via:                                       │     │     │
│   │   │  • HTTPS only                                      │     │     │
│   │   │  • HTTP/2 or HTTP/3                                │     │     │
│   │   │  • Gzip/Brotli compression                         │     │     │
│   │   │  • Cache-Control headers                           │     │     │
│   │   │  • Edge caching globally                           │     │     │
│   │   └────────────────────────────────────────────────────┘     │     │
│   └──────────────────────────┬──────────────────────────────────────     │
│                              │ HTTPS                                     │
│                              ▼                                           │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                 Application Server Layer                      │     │
│   │                 (Railway / Render / Fly.io / VM)              │     │
│   │                                                                │     │
│   │   ┌────────────────────────────────────────────────────┐     │     │
│   │   │        Reverse Proxy (nginx / Caddy)               │     │     │
│   │   │                                                     │     │     │
│   │   │  • SSL/TLS termination                             │     │     │
│   │   │  • Request routing                                 │     │     │
│   │   │  • Rate limiting                                   │     │     │
│   │   │  • Connection pooling                              │     │     │
│   │   │  • Static asset caching                            │     │     │
│   │   └─────────────────────┬──────────────────────────────┘     │     │
│   │                          │                                    │     │
│   │   ┌──────────────────────▼──────────────────────────────┐   │     │
│   │   │        FastAPI Backend (Uvicorn Workers)            │   │     │
│   │   │                                                      │   │     │
│   │   │  Process Manager: systemd / supervisord             │   │     │
│   │   │  Workers: 4-8 (based on CPU cores)                  │   │     │
│   │   │  Port: 8000 (internal)                              │   │     │
│   │   │                                                      │   │     │
│   │   │  Environment:                                        │   │     │
│   │   │  • ENV=prod                                         │   │     │
│   │   │  • Restricted CORS origins                          │   │     │
│   │   │  • Production database URL                          │   │     │
│   │   │  • Error logging to monitoring service              │   │     │
│   │   └──────────────────────┬──────────────────────────────┘   │     │
│   │                          │                                    │     │
│   └──────────────────────────┼──────────────────────────────────┘     │
│                              │                                          │
│                              │ HTTP (internal)                          │
│                              ▼                                          │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │               LLM Inference Layer                             │    │
│   │               (GPU-enabled server / Same host)                │    │
│   │                                                                │    │
│   │   ┌────────────────────────────────────────────────────┐     │    │
│   │   │             Ollama Service                          │     │    │
│   │   │                                                     │     │    │
│   │   │  • Port: 11434 (internal)                          │     │    │
│   │   │  • GPU acceleration (CUDA / Metal)                 │     │    │
│   │   │  • Model: llama3.3:70b (or configured)             │     │    │
│   │   │  • Process isolation                                │     │    │
│   │   │  • Resource limits (memory/CPU)                    │     │    │
│   │   └────────────────────────────────────────────────────┘     │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                          │
│                              │ PostgreSQL Protocol (TLS)                │
│                              ▼                                          │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                Database Layer (Cloud)                         │    │
│   │                                                                │    │
│   │   ┌────────────────────────────────────────────────────┐     │    │
│   │   │          Neon PostgreSQL (Production)               │     │    │
│   │   │                                                     │     │    │
│   │   │  • Serverless PostgreSQL                           │     │    │
│   │   │  • Connection pooling (built-in)                   │     │    │
│   │   │  • Automatic backups                                │     │    │
│   │   │  • Point-in-time recovery                          │     │    │
│   │   │  • SSL/TLS enforced                                │     │    │
│   │   │  • Autoscaling storage                             │     │    │
│   │   │  • Multi-region replication (optional)             │     │    │
│   │   └────────────────────────────────────────────────────┘     │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │              Monitoring & Observability                       │    │
│   │                                                                │    │
│   │  • Application Logs (stdout/stderr → log aggregation)        │    │
│   │  • Metrics (Prometheus / Datadog / New Relic)                │    │
│   │  • Error Tracking (Sentry)                                   │    │
│   │  • Uptime Monitoring (UptimeRobot / Pingdom)                 │    │
│   │  • Performance APM (Application Performance Monitoring)       │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Production Characteristics:
• HTTPS enforced everywhere
• Rate limiting on API endpoints
• Restrictive CORS (specific origins only)
• Database connection pooling
• Horizontal scaling (multiple backend workers)
• Health checks and auto-recovery
• Automated backups
• Logging and monitoring
• Secret management (environment variables)
```

### 3.3 Infrastructure Requirements

#### 3.3.1 Minimum Requirements (Small Deployment)

**Frontend Hosting:**
- CDN/Static Hosting: Any modern provider (Vercel, Netlify, Cloudflare Pages)
- Cost: $0-20/month (often free tier sufficient)

**Backend Server:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Network: 100Mbps
- OS: Ubuntu 22.04 LTS or similar
- Cost: ~$10-50/month (Railway Hobby, Render Starter)

**Ollama Server (can be same as backend for small models):**
- CPU: 4 cores (or GPU: NVIDIA GTX 1060+ / Apple M-series)
- RAM: 16GB (for models up to 7B parameters)
- Storage: 50GB SSD
- For llama3.2:1b or :3b - can run on CPU only

**Database:**
- Neon PostgreSQL Free Tier:
  - 0.5GB storage
  - 3GB data transfer/month
  - Suitable for 1000s of conversations
- Cost: $0/month (free tier), scales to $20+/month

#### 3.3.2 Recommended Requirements (Production Deployment)

**Backend Server:**
- CPU: 4-8 cores
- RAM: 8-16GB
- Storage: 50GB SSD
- Load balancer: Optional (for multi-instance)

**Ollama Server (dedicated for performance):**
- GPU: NVIDIA RTX 3090 / A100 / Apple M2 Max+
- RAM: 32-64GB
- Storage: 100GB SSD
- CUDA 11.8+ or Metal support

**Database:**
- Neon PostgreSQL Pro:
  - 10GB+ storage
  - Autoscaling
  - Automated backups
  - Higher compute limits
- Cost: ~$20-100/month depending on usage

### 3.4 Deployment Process

#### 3.4.1 Backend Deployment

```bash
# 1. Build process (optional - Python doesn't require build)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Environment configuration
cp .env.example .env
# Edit .env with production values
# - ENV=prod
# - DATABASE_URL=<production-postgres-url>
# - OLLAMA_HOST=<ollama-service-url>

# ⚠️ MIGRATION NOTE: If upgrading from a previous version that used
# POSTGRES_URL, update your .env file to use DATABASE_URL instead.
# This change was made in commit 6be8484 for consistency with industry standards.

# 3. Start service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or with systemd
sudo systemctl start agno-chatbot-backend
```

#### 3.4.2 Frontend Deployment

```bash
# 1. Build process
cd frontend
npm install
npm run build

# Output: dist/ directory with optimized static assets

# 2. Deploy to hosting
# Vercel
vercel deploy --prod

# Netlify
netlify deploy --prod --dir=dist

# Cloudflare Pages
wrangler pages deploy dist
```

#### 3.4.3 Ollama Setup

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull model
ollama pull llama3.2:3b

# 3. Start service
ollama serve

# Or with systemd
sudo systemctl enable ollama
sudo systemctl start ollama
```

---

## 4. Data Architecture

### 4.1 Database Schema

#### 4.1.1 Primary Table: `agno_sessions`

Managed by Agno framework, this table stores all conversation sessions.

```sql
CREATE TABLE agno_sessions (
    -- Primary Key
    session_id VARCHAR(255) PRIMARY KEY,

    -- Session Type (always "agent" for our chatbot)
    session_type VARCHAR(50) NOT NULL,

    -- Metadata (JSONB for flexibility)
    session_data JSONB,
    -- Example: {"name": "Conversation title", "custom_field": "value"}

    -- Agent Configuration
    agent_data JSONB,
    -- Example: {"model": "llama3.2:3b", "description": "..."}

    -- Conversation History & Execution Runs
    runs JSONB[],
    -- Array of JSONB objects containing:
    -- - chat_history: Array of messages [{role, content}, ...]
    -- - execution metadata
    -- - timestamps

    -- Timestamps (epoch integers)
    created_at BIGINT,
    updated_at BIGINT,

    -- Optional User Identification (for future multi-user support)
    user_id VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_session_type ON agno_sessions(session_type);
CREATE INDEX idx_updated_at ON agno_sessions(updated_at DESC);
CREATE INDEX idx_user_id ON agno_sessions(user_id);
```

#### 4.1.2 Data Structure Examples

**session_data:**
```json
{
  "name": "What is the capital of France?",
  "created_by": "user-123",
  "tags": ["geography", "capitals"]
}
```

**agent_data:**
```json
{
  "model_id": "llama3.2:3b",
  "description": "You are a helpful AI assistant powered by Agno and Ollama.",
  "add_history_to_context": true,
  "num_history_runs": 20
}
```

**runs (single run example):**
```json
{
  "run_id": "run-abc123",
  "chat_history": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    },
    {
      "role": "assistant",
      "content": "The capital of France is Paris."
    }
  ],
  "execution_time": 1.234,
  "tokens_used": 45,
  "created_at": 1704067200
}
```

### 4.2 Data Flow

#### 4.2.1 Message Creation Flow

```
User sends message
        │
        ▼
Frontend: Add user message to Redux (optimistic)
        │
        ▼
Frontend: Add empty assistant message placeholder
        │
        ▼
Frontend: POST /chat/stream with message + conversation_id
        │
        ▼
Backend: Load session from PostgreSQL via Agno
        │   (if session exists, load chat_history)
        │
        ▼
Backend: Create Agno Agent with loaded history
        │
        ▼
Backend: Agent sends message + history to Ollama
        │
        ▼
Ollama: Generates response (streaming)
        │
        ▼
Backend: Streams tokens via SSE
        │
        ▼
Frontend: Updates assistant message content incrementally
        │
        ▼
Backend: After stream completes, Agno auto-saves session
        │   - Updates runs array with new message pair
        │   - Updates updated_at timestamp
        │
        ▼
PostgreSQL: Session persisted with new messages
```

#### 4.2.2 Conversation Loading Flow

```
User selects conversation from sidebar
        │
        ▼
Frontend: Dispatch action to clear current messages
        │
        ▼
Frontend: GET /conversations/{conversation_id}
        │
        ▼
Backend: Query PostgreSQL via Agno
        │   db.get_session(session_id, session_type=AGENT)
        │
        ▼
Backend: Extract chat_history from runs array
        │   - Filter out system messages
        │   - Map to frontend format
        │
        ▼
Backend: Return ConversationDetail response
        │   {conversation_id, title, messages[], timestamps}
        │
        ▼
Frontend: Dispatch loadMessages action
        │   - Updates Redux state
        │   - Preserves original timestamps
        │
        ▼
Frontend: ChatArea renders messages
```

### 4.3 Data Retention & Cleanup

**Current Implementation:**
- No automatic cleanup (all conversations persist indefinitely)
- Manual deletion via DELETE /conversations/{id}

**Future Considerations:**
```sql
-- Archive old conversations
UPDATE agno_sessions
SET session_data = jsonb_set(
    session_data,
    '{archived}',
    'true'
)
WHERE updated_at < extract(epoch from now() - interval '90 days');

-- Delete archived conversations older than 1 year
DELETE FROM agno_sessions
WHERE session_data->>'archived' = 'true'
AND updated_at < extract(epoch from now() - interval '365 days');
```

---

## 5. API Specifications

### 5.1 REST API Contract

#### 5.1.1 Base Configuration

**Base URL:**
- Development: `http://localhost:8000`
- Production: `https://api.yourdomain.com`

**Content Type:**
- Request: `application/json`
- Response: `application/json` (REST), `text/event-stream` (SSE)

**Authentication:**
- Current: None (single-user deployment)
- Future: JWT Bearer tokens

#### 5.1.2 Endpoints

##### GET /healthz

Health check endpoint for monitoring.

**Request:**
```http
GET /healthz HTTP/1.1
Host: api.yourdomain.com
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "environment": "prod",
  "model": "llama3.2:3b",
  "database": "postgresql"
}
```

**Response Schema:**
```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "down"
  environment: "local" | "prod" | "test"
  model: string
  database: string
}
```

---

##### POST /chat

Non-streaming chat endpoint.

**Request:**
```http
POST /chat HTTP/1.1
Host: api.yourdomain.com
Content-Type: application/json

{
  "message": "What is the capital of France?",
  "conversation_id": "conv-abc123"  // Optional
}
```

**Request Schema:**
```typescript
interface ChatRequest {
  message: string
  conversation_id?: string  // Auto-generated if omitted
}
```

**Response: 200 OK**
```json
{
  "conversation_id": "conv-abc123",
  "reply": "The capital of France is Paris.",
  "usage": {
    "model": "llama3.2:3b"
  }
}
```

**Response Schema:**
```typescript
interface ChatResponse {
  conversation_id: string
  reply: string
  usage: {
    model: string
    [key: string]: any
  }
}
```

**Error Responses:**
- `503 Service Unavailable`: Agent not initialized
- `500 Internal Server Error`: Processing error

---

##### POST /chat/stream

Streaming chat endpoint with Server-Sent Events (SSE).

**Request:**
```http
POST /chat/stream HTTP/1.1
Host: api.yourdomain.com
Content-Type: application/json
Accept: text/event-stream

{
  "message": "Tell me a story",
  "conversation_id": "conv-xyz789"
}
```

**Response: 200 OK (SSE Stream)**
```
data: {"delta": "Once"}

data: {"delta": " upon"}

data: {"delta": " a"}

data: {"delta": " time"}

data: {"delta": "..."}

data: {"done": true, "conversation_id": "conv-xyz789", "response": "Once upon a time...", "usage": {"model": "llama3.2:3b"}}
```

**SSE Event Format:**
```
data: <JSON_PAYLOAD>\n\n
```

**Delta Event Schema:**
```typescript
interface DeltaEvent {
  delta: string
}
```

**Completion Event Schema:**
```typescript
interface CompletionEvent {
  done: true
  conversation_id: string
  response: string  // Full accumulated response
  usage: {
    model: string
    [key: string]: any
  }
}
```

**Error Event Schema:**
```typescript
interface ErrorEvent {
  error: string
  done: true
}
```

---

##### GET /conversations

List all conversations with summary information.

**Request:**
```http
GET /conversations HTTP/1.1
Host: api.yourdomain.com
```

**Response: 200 OK**
```json
[
  {
    "conversation_id": "conv-abc123",
    "title": "What is the capital of France?",
    "message_count": 4,
    "created_at": "2025-01-10T15:47:46Z",
    "updated_at": "2025-01-10T15:50:18Z"
  },
  {
    "conversation_id": "conv-xyz789",
    "title": "Tell me a story",
    "message_count": 2,
    "created_at": "2025-01-10T16:00:00Z",
    "updated_at": "2025-01-10T16:01:30Z"
  }
]
```

**Response Schema:**
```typescript
interface ConversationSummary {
  conversation_id: string
  title: string | null
  message_count: number  // Excludes system messages
  created_at: string | null  // ISO 8601 format
  updated_at: string | null  // ISO 8601 format
}

type ConversationsResponse = ConversationSummary[]
```

**Notes:**
- Ordered by `updated_at` descending (most recent first)
- System messages excluded from `message_count`

---

##### GET /conversations/{conversation_id}

Get specific conversation with full message history.

**Request:**
```http
GET /conversations/conv-abc123 HTTP/1.1
Host: api.yourdomain.com
```

**Response: 200 OK**
```json
{
  "conversation_id": "conv-abc123",
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
  "created_at": "2025-01-10T15:47:46Z",
  "updated_at": "2025-01-10T15:50:18Z"
}
```

**Response Schema:**
```typescript
interface ConversationDetail {
  conversation_id: string
  title: string | null
  messages: Array<{
    role: "user" | "assistant"  // system messages filtered out
    content: string
  }>
  created_at: string | null  // ISO 8601
  updated_at: string | null  // ISO 8601
}
```

**Error Responses:**
- `404 Not Found`: Conversation doesn't exist

---

##### DELETE /conversations/{conversation_id}

Delete a conversation permanently.

**Request:**
```http
DELETE /conversations/conv-abc123 HTTP/1.1
Host: api.yourdomain.com
```

**Response: 200 OK**
```json
{
  "status": "success",
  "conversation_id": "conv-abc123"
}
```

**Response Schema:**
```typescript
interface DeleteResponse {
  status: "success"
  conversation_id: string
}
```

**Error Responses:**
- `500 Internal Server Error`: Deletion failed

---

##### PATCH /conversations/{conversation_id}/title

Update conversation title.

**Request:**
```http
PATCH /conversations/conv-abc123/title HTTP/1.1
Host: api.yourdomain.com
Content-Type: application/json

{
  "title": "French Geography Questions"
}
```

**Request Schema:**
```typescript
interface UpdateTitleRequest {
  title: string
}
```

**Response: 200 OK**
```json
{
  "status": "success",
  "conversation_id": "conv-abc123",
  "title": "French Geography Questions"
}
```

**Response Schema:**
```typescript
interface UpdateTitleResponse {
  status: "success"
  conversation_id: string
  title: string
}
```

**Error Responses:**
- `404 Not Found`: Conversation doesn't exist
- `500 Internal Server Error`: Update failed

### 5.2 SSE Protocol Details

**Server-Sent Events (SSE) Format:**
```
event: <event_type>\n   (optional, defaults to "message")
data: <payload>\n
\n
```

**Our Implementation:**
- Event type: Always "message" (default, not specified)
- Data: JSON string
- Line ending: `\n\n` after each event

**Client-Side Consumption (Fetch API):**
```typescript
const response = await fetch('/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, conversation_id }),
  signal: abortController.signal
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value, { stream: true })
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)  // Remove "data: " prefix
      const parsed = JSON.parse(data)

      if ('delta' in parsed) {
        // Accumulate delta
      } else if ('done' in parsed && parsed.done) {
        // Stream complete
      }
    }
  }
}
```

---

## 6. External Integrations

### 6.1 Ollama Service Integration

**Protocol:** HTTP REST API
**Documentation:** https://github.com/ollama/ollama/blob/main/docs/api.md

**Connection Details:**
- **URL:** Configured via `OLLAMA_HOST` environment variable
- **Default:** `http://localhost:11434`
- **Timeout:** Configured via `MODEL_TIMEOUT_S` (default 60s)

**Agno Integration:**
Agno provides a wrapper around Ollama's API:

```python
from agno.models.ollama import Ollama

model = Ollama(
    id="llama3.2:3b",  # Model identifier
    host="http://localhost:11434",
)

# Non-streaming
response = await model.generate(prompt, messages)

# Streaming
async for chunk in model.generate_stream(prompt, messages):
    yield chunk
```

**Key Endpoints Used (by Agno):**
- `POST /api/generate` - Text generation
- `POST /api/chat` - Chat completion
- `GET /api/version` - Health check

**Error Handling:**
- Connection refused → `503 Service Unavailable`
- Timeout → `504 Gateway Timeout`
- Model not found → `404 Not Found`

### 6.2 Neon PostgreSQL Integration

**Protocol:** PostgreSQL Wire Protocol (over TLS)
**Driver:** psycopg 3.x (async support)

**Connection Details:**
- **URL Format:** `postgresql+psycopg://user:password@host/database?sslmode=require`
- **Configured via:** `DATABASE_URL` environment variable
- **SSL Mode:** Required (`sslmode=require`)

**Agno Integration:**
```python
from agno.db.postgres import PostgresDb

db = PostgresDb(db_url=settings.database_url)

# CRUD Operations
session = db.get_session(session_id, session_type)
db.upsert_session(session)
db.delete_session(session_id)
sessions = db.get_sessions(session_type)
```

**Connection Pooling:**
- Managed by Neon (serverless pooling)
- No explicit pool configuration needed in application
- Automatic connection scaling

**Backup & Recovery:**
- Automated daily backups (Neon managed)
- Point-in-time recovery available
- No manual backup required

### 6.3 Third-Party Services (Optional)

#### 6.3.1 Monitoring & Logging

**Sentry (Error Tracking):**
```python
# Integration (if enabled)
import sentry_sdk

sentry_sdk.init(
    dsn="<your-sentry-dsn>",
    environment=settings.env.value,
    traces_sample_rate=0.1,
)
```

**Prometheus (Metrics):**
```python
# Metrics endpoint (if added)
from prometheus_client import Counter, Histogram

chat_requests = Counter('chat_requests_total', 'Total chat requests')
response_time = Histogram('chat_response_seconds', 'Response time')
```

#### 6.3.2 CDN for Frontend

**Vercel / Netlify / Cloudflare:**
- Automatic HTTPS
- Global edge caching
- Instant cache invalidation
- Analytics included

---

## 7. Architectural Decision Records (ADRs)

### ADR-001: Use Agno Framework for Agent Orchestration

**Date:** January 2025
**Status:** Accepted
**Context:**

We needed an agent framework to manage LLM interactions, conversation history, and persistence. Options considered:
1. LangChain
2. LlamaIndex
3. Agno
4. Custom implementation

**Decision:**

We chose **Agno** for the following reasons:

**Pros:**
- Native PostgreSQL support with built-in session management
- Minimal boilerplate for agent creation
- Automatic history loading and persistence
- Streaming support out-of-the-box
- Ollama integration included
- Simple API surface area

**Cons:**
- Smaller community compared to LangChain
- Less extensive documentation
- Fewer pre-built tools/chains

**Alternatives Considered:**

**LangChain:**
- Pros: Largest community, extensive documentation, many integrations
- Cons: Complex API, heavy dependencies, opinionated architecture
- Rejected: Too much overhead for our simple use case

**LlamaIndex:**
- Pros: Excellent for RAG (Retrieval-Augmented Generation)
- Cons: Overkill for conversational chat without document retrieval
- Rejected: Not focused on our primary use case

**Custom Implementation:**
- Pros: Full control, minimal dependencies
- Cons: Significant development time, reinventing the wheel
- Rejected: Not cost-effective

**Consequences:**

- **Positive:** Rapid development with minimal code
- **Positive:** Built-in session persistence reduces complexity
- **Negative:** Locked into Agno's patterns and limitations
- **Mitigation:** Agno's simple API allows for easy migration if needed

---

### ADR-002: PostgreSQL over SQLite for Production

**Date:** January 2025
**Status:** Accepted
**Context:**

Initial prototypes used SQLite for simplicity. For production, we needed to evaluate database options:
1. SQLite (file-based)
2. PostgreSQL (client-server)
3. MongoDB (document store)
4. MySQL/MariaDB

**Decision:**

We chose **PostgreSQL (via Neon serverless)** for the following reasons:

**Pros:**
- **JSONB support:** Perfect for Agno's flexible session schema
- **ACID transactions:** Data integrity guarantees
- **Concurrent access:** Multiple backend instances supported
- **Proven reliability:** Battle-tested in production environments
- **Neon serverless:** No infrastructure management, auto-scaling
- **Connection pooling:** Built into Neon platform

**Cons:**
- External dependency (network latency)
- Cost (though free tier is generous)
- Slightly more complex setup than SQLite

**Alternatives Considered:**

**SQLite:**
- Pros: Zero configuration, no network calls, file-based simplicity
- Cons: No concurrent writes, single-server limitation, no cloud-native scaling
- Rejected: Not suitable for multi-instance deployments

**MongoDB:**
- Pros: Native JSON storage, flexible schema
- Cons: Different query paradigm, Agno has better PostgreSQL support
- Rejected: PostgreSQL JSONB provides same flexibility with SQL benefits

**MySQL/MariaDB:**
- Pros: Widely supported, mature ecosystem
- Cons: JSON support less mature than PostgreSQL, no significant advantages
- Rejected: PostgreSQL is superior for our use case

**Consequences:**

- **Positive:** Scalable architecture supporting multiple backend instances
- **Positive:** JSONB eliminates schema migration headaches
- **Positive:** Neon serverless reduces operational burden
- **Negative:** Additional cost (though minimal on free tier)
- **Negative:** Network latency (mitigated by Neon's global presence)

---

### ADR-003: Server-Sent Events (SSE) for Streaming

**Date:** January 2025
**Status:** Accepted
**Context:**

We needed real-time token-by-token streaming for responses. Options:
1. WebSockets
2. Server-Sent Events (SSE)
3. HTTP polling
4. gRPC streaming

**Decision:**

We chose **Server-Sent Events (SSE)** for the following reasons:

**Pros:**
- **Unidirectional:** Server→Client only (matches our use case)
- **HTTP-based:** Works over standard HTTP/HTTPS, firewall-friendly
- **Simpler than WebSockets:** No handshake, no protocol upgrade
- **Browser native support:** EventSource API built-in
- **Automatic reconnection:** Browser handles connection drops
- **Works with fetch API:** No need for EventSource, better control with AbortController

**Cons:**
- Server→Client only (but we don't need bidirectional)
- HTTP/1.1 has connection limit (6 per domain) - mitigated by HTTP/2

**Alternatives Considered:**

**WebSockets:**
- Pros: Bidirectional, real-time, efficient binary protocol
- Cons: Overkill for unidirectional streaming, more complex setup
- Rejected: Unnecessary complexity for our use case

**HTTP Polling:**
- Pros: Universal compatibility, simple implementation
- Cons: Inefficient (constant polling), high latency, poor user experience
- Rejected: Unacceptable UX for real-time chat

**gRPC Streaming:**
- Pros: Efficient binary protocol, bidirectional support
- Cons: Requires HTTP/2, browser support immature, adds complexity
- Rejected: Not worth the complexity for HTTP-based application

**Consequences:**

- **Positive:** Simple, robust streaming with native browser support
- **Positive:** Firewall-friendly (standard HTTP)
- **Positive:** Automatic reconnection handled by browser
- **Negative:** HTTP/1.1 connection limits (mitigated by HTTP/2 in production)
- **Implementation:** Using Fetch API with manual SSE parsing for better control (AbortController, error handling)

---

### ADR-004: Redux Toolkit for Frontend State Management

**Date:** January 2025
**Status:** Accepted
**Context:**

The frontend needed robust state management for conversations, messages, and UI state. Options:
1. React Context API
2. Redux Toolkit
3. Zustand
4. MobX
5. Recoil

**Decision:**

We chose **Redux Toolkit (with RTK Query)** for the following reasons:

**Pros:**
- **Official Redux toolset:** Modern, simplified Redux patterns
- **RTK Query:** Built-in data fetching, caching, and invalidation
- **Predictable state:** Unidirectional data flow, easy debugging
- **DevTools:** Excellent time-travel debugging
- **Optimistic updates:** Built-in support for UI responsiveness
- **TypeScript support:** First-class type safety
- **Middleware ecosystem:** Extensive plugins available

**Cons:**
- Learning curve (though Redux Toolkit greatly simplifies)
- Boilerplate (though significantly reduced vs. classic Redux)
- Overkill for very small apps (not applicable to our chat interface)

**Alternatives Considered:**

**React Context API:**
- Pros: Built into React, zero dependencies, simple for small apps
- Cons: No built-in caching, performance issues with frequent updates, no DevTools
- Rejected: Insufficient for complex chat application with streaming

**Zustand:**
- Pros: Minimal boilerplate, simple API, good performance
- Cons: No built-in data fetching solution, smaller ecosystem
- Rejected: Would need additional library for API management

**MobX:**
- Pros: Simple, reactive, minimal boilerplate
- Cons: Magic (implicit updates), harder debugging, smaller community
- Rejected: Preference for explicit state updates

**Recoil:**
- Pros: Modern, atom-based, good performance
- Cons: Experimental (at evaluation time), Facebook-specific, smaller ecosystem
- Rejected: Not mature enough for production

**Consequences:**

- **Positive:** Centralized state with predictable updates
- **Positive:** RTK Query eliminates need for separate API layer (axios, etc.)
- **Positive:** Automatic cache invalidation for conversations
- **Positive:** Excellent debugging experience
- **Negative:** Initial boilerplate for slices and API definitions
- **Mitigation:** Redux Toolkit significantly reduces boilerplate vs. classic Redux

---

### ADR-005: React 19 with TypeScript

**Date:** January 2025
**Status:** Accepted
**Context:**

We needed to select a UI framework and language. Options:
1. React with JavaScript
2. React with TypeScript
3. Vue 3 with TypeScript
4. Svelte with TypeScript
5. Solid.js

**Decision:**

We chose **React 19 with TypeScript** for the following reasons:

**React 19 Pros:**
- **Largest ecosystem:** Most libraries, components, and community support
- **Mature and stable:** Production-proven in countless applications
- **Concurrent rendering:** Improved performance with automatic batching
- **Server Components:** Future-proofing for potential SSR
- **Excellent DevTools:** React Developer Tools for debugging
- **Hiring pool:** Easiest to find React developers

**TypeScript Pros:**
- **Type safety:** Catch errors at compile time, not runtime
- **IDE support:** Excellent autocomplete, refactoring, and IntelliSense
- **Self-documenting:** Types serve as inline documentation
- **Refactoring confidence:** Large-scale changes with confidence
- **Redux Toolkit integration:** First-class TypeScript support

**Cons:**
- Learning curve (both React and TypeScript)
- Compilation step (TypeScript)
- Verbose type definitions (mitigated by inference)

**Alternatives Considered:**

**Vue 3:**
- Pros: Simpler learning curve, great documentation, composition API
- Cons: Smaller ecosystem than React, less mature TypeScript support
- Rejected: React's ecosystem advantage outweighs Vue's simplicity

**Svelte:**
- Pros: Excellent performance, minimal boilerplate, compile-time optimization
- Cons: Smaller ecosystem, fewer UI libraries, limited TypeScript support
- Rejected: Too bleeding-edge for production, smaller talent pool

**Solid.js:**
- Pros: Best-in-class performance, React-like API, fine-grained reactivity
- Cons: Very small ecosystem, new framework, uncertain longevity
- Rejected: Too new, risky for production

**JavaScript (instead of TypeScript):**
- Pros: No compilation, faster prototyping, simpler
- Cons: No compile-time type checking, refactoring errors, poor IDE support
- Rejected: Type safety critical for maintainability

**Consequences:**

- **Positive:** Type-safe codebase reduces runtime errors
- **Positive:** Massive ecosystem of React libraries and components
- **Positive:** Excellent developer experience with IDE support
- **Negative:** Steeper learning curve for TypeScript beginners
- **Mitigation:** TypeScript's benefits outweigh initial learning investment

---

### ADR-006: Tailwind CSS + shadcn/ui for Styling

**Date:** January 2025
**Status:** Accepted
**Context:**

We needed a styling solution for the UI. Options:
1. Traditional CSS/SCSS
2. CSS-in-JS (styled-components, Emotion)
3. Tailwind CSS
4. UI libraries (Material-UI, Chakra UI, Ant Design)
5. Tailwind CSS + shadcn/ui

**Decision:**

We chose **Tailwind CSS + shadcn/ui** for the following reasons:

**Tailwind CSS Pros:**
- **Utility-first:** Rapid prototyping without context switching
- **Consistent design:** Predefined spacing, colors, sizing
- **No naming conflicts:** No need for BEM or CSS modules
- **Purge unused CSS:** Tiny production bundles
- **Responsive design:** Mobile-first breakpoints built-in
- **Dark mode:** First-class support

**shadcn/ui Pros:**
- **Accessible:** Built on Radix UI primitives (WAI-ARIA compliant)
- **Customizable:** Copy components into codebase, full control
- **Headless architecture:** Style however you want
- **TypeScript native:** Full type safety
- **No bundle bloat:** Only include components you use

**Cons:**
- Verbose className strings (mitigated by editor plugins)
- Learning Tailwind class names (mitigated by IntelliSense)
- Initial setup complexity (mitigated by CLI)

**Alternatives Considered:**

**Traditional CSS/SCSS:**
- Pros: Full control, familiar to all developers
- Cons: Naming conflicts, manual responsive design, larger bundles
- Rejected: Slower development, harder maintenance

**CSS-in-JS (styled-components, Emotion):**
- Pros: Scoped styles, dynamic styling with props
- Cons: Runtime performance cost, larger bundles, flash of unstyled content
- Rejected: Performance concerns, Tailwind is faster

**Material-UI / Chakra UI:**
- Pros: Pre-built components, consistent design system
- Cons: Opinionated design, harder customization, larger bundles
- Rejected: Too opinionated, harder to match custom designs

**shadcn/ui Advantages over traditional UI libraries:**
- Copy-paste components (no npm dependency bloat)
- Full source code control (easy customization)
- No "eject" needed (components in your codebase)
- Tailwind-based styling (consistent with app styling)

**Consequences:**

- **Positive:** Rapid UI development with Tailwind utilities
- **Positive:** Accessible components out-of-the-box (shadcn/ui)
- **Positive:** Full customization control (components in codebase)
- **Positive:** Small production bundles (tree-shaking + Tailwind purge)
- **Negative:** Verbose className strings (mitigated by editor plugins)
- **Tooling:** Tailwind CSS IntelliSense plugin essential for productivity

---

### ADR-007: Vite for Frontend Build Tool

**Date:** January 2025
**Status:** Accepted
**Context:**

We needed a build tool for the React frontend. Options:
1. Create React App (CRA)
2. Webpack (custom configuration)
3. Vite
4. Parcel
5. esbuild

**Decision:**

We chose **Vite 7.x** for the following reasons:

**Pros:**
- **Lightning-fast HMR:** Instant hot module replacement during development
- **Native ESM:** No bundling during development (instant start)
- **Optimized production builds:** Rollup-based bundling
- **Out-of-the-box TypeScript support:** Zero config
- **Plugin ecosystem:** Rich plugins for React, Tailwind, etc.
- **Modern defaults:** ESM, HTTP/2, code splitting
- **Officially recommended:** React docs recommend Vite for SPA

**Cons:**
- Relatively new (less mature than Webpack)
- Different dev vs. prod builds (ESM vs. bundled)

**Alternatives Considered:**

**Create React App (CRA):**
- Pros: Zero config, React official, familiar to many
- Cons: Slow development server, heavy dependencies, ejecting issues
- Rejected: Slow HMR, declining maintenance, deprecated

**Webpack:**
- Pros: Most mature, extensive plugin ecosystem, full control
- Cons: Complex configuration, slow development server, heavy
- Rejected: Too complex for our needs, slower than Vite

**Parcel:**
- Pros: Zero config, fast, simple
- Cons: Less control, smaller ecosystem than Vite/Webpack
- Rejected: Vite has better React support and larger community

**esbuild:**
- Pros: Fastest build tool, Go-based performance
- Cons: Limited plugin ecosystem, low-level (needs wrapper)
- Rejected: Too low-level, Vite uses esbuild internally

**Consequences:**

- **Positive:** Sub-second development server start
- **Positive:** Instant HMR updates during development
- **Positive:** Optimized production builds with code splitting
- **Positive:** Simple configuration (vite.config.ts)
- **Negative:** Different behavior in dev vs. prod (ESM vs. bundled)
- **Mitigation:** Thorough testing of production builds

---

### ADR-008: Memoized Markdown Rendering for Performance

**Date:** January 2025
**Status:** Accepted
**Context:**

Streaming chat causes frequent re-renders as tokens arrive. Markdown parsing is expensive. Options:
1. Parse entire message on every render
2. Memoize entire message component
3. Block-level memoization with incremental parsing

**Decision:**

We chose **block-level memoization with incremental parsing** for the following reasons:

**Architecture:**
```typescript
// memoized-markdown.tsx
import { marked } from 'marked'
import { useMemo } from 'react'

// Block-level memoization
const MemoizedMarkdownBlock = memo(({ block }) => {
  return <div dangerouslySetInnerHTML={{ __html: marked.parse(block) }} />
})

// Split content into blocks, memoize each
export function MemoizedMarkdown({ content }) {
  const blocks = useMemo(() => content.split('\n\n'), [content])

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock key={index} block={block} />
  ))
}
```

**Pros:**
- **Incremental rendering:** Only re-render new/changed blocks
- **Smooth streaming:** No jank during token accumulation
- **Memory efficient:** Reuse parsed blocks across renders
- **Good performance:** 60 FPS maintained during streaming

**Cons:**
- More complex than naive approach
- Requires careful key management
- Splitting logic needs to be robust

**Alternatives Considered:**

**Naive approach (parse everything on every render):**
- Pros: Simple implementation
- Cons: Jank during streaming, poor performance with long messages
- Rejected: Unacceptable UX during streaming

**Memoize entire message:**
- Pros: Simple memoization
- Cons: No benefit during streaming (content always changes)
- Rejected: Doesn't solve streaming performance issue

**Consequences:**

- **Positive:** Smooth 60 FPS streaming experience
- **Positive:** Memory efficient for long conversations
- **Positive:** Scales well with message length
- **Negative:** More complex implementation
- **Mitigation:** Thorough testing of edge cases (code blocks, lists, etc.)

---

## 8. Quality Attributes

### 8.1 Performance

**Requirements:**
- First token latency: < 2 seconds
- Conversation list load: < 1 second
- Message history load: < 1.5 seconds
- UI frame rate during streaming: 60 FPS
- Database query time (p95): < 500ms

**Strategies:**
- **Frontend:**
  - Memoized markdown rendering
  - Virtual scrolling for long conversations (future)
  - Code splitting and lazy loading
  - Vite production optimizations (tree-shaking, minification)

- **Backend:**
  - Async/await for non-blocking I/O
  - Database connection pooling (via Neon)
  - Efficient JSONB queries
  - Streaming responses (no waiting for complete generation)

- **Infrastructure:**
  - CDN for static assets (frontend)
  - HTTP/2 for multiplexing
  - Compression (gzip/brotli)
  - Database indexes on key columns

### 8.2 Scalability

**Horizontal Scaling:**
- **Frontend:** Infinitely scalable (static CDN)
- **Backend:** Stateless API (scale horizontally with load balancer)
- **Database:** Neon auto-scales (serverless)
- **Ollama:** GPU-bound (vertical scaling or model optimization)

**Bottlenecks:**
- Ollama inference (GPU-limited)
- Database connections (mitigated by Neon pooling)

**Scaling Strategies:**
- **Backend:** Add more Uvicorn workers or instances
- **Ollama:** Dedicated GPU server or multiple Ollama instances with load balancing
- **Database:** Neon automatic scaling + read replicas (future)

### 8.3 Reliability

**Strategies:**
- **Error handling:**
  - Try-catch blocks in all async operations
  - User-friendly error messages
  - Automatic retry for transient failures

- **Data integrity:**
  - PostgreSQL ACID transactions
  - Session atomicity (all or nothing)
  - Automated backups (Neon)

- **Fault tolerance:**
  - Graceful degradation (offline mode future enhancement)
  - Automatic reconnection for SSE streams
  - Health checks for dependencies

**Recovery:**
- Database backups (point-in-time recovery via Neon)
- Idempotent API operations (safe retries)
- Client-side retry logic for failed requests

### 8.4 Maintainability

**Code Quality:**
- **TypeScript:** Frontend type safety
- **Python type hints:** Backend type checking
- **Linting:** ESLint (frontend), Ruff (backend)
- **Formatting:** Prettier (frontend), Black (backend - optional)

**Documentation:**
- Inline code comments
- README with quick start
- Architecture document (this document)
- API documentation

**Testing:**
- Unit tests (pytest for backend)
- Component tests (vitest for frontend)
- Integration tests (API endpoints)

**Modularity:**
- Clear separation of concerns
- Redux slices for state domains
- FastAPI routers for endpoint grouping
- Agno agent abstraction

### 8.5 Security

**Current Implementation:**
- **Data encryption in transit:** HTTPS (production), PostgreSQL TLS
- **Input validation:** Pydantic models (backend)
- **SQL injection prevention:** ORM (Agno + psycopg)
- **CORS:** Configurable origins (restrictive in production)

**Future Enhancements:**
- **Authentication:** JWT tokens
- **Authorization:** Role-based access control (RBAC)
- **Rate limiting:** Per-IP or per-user limits
- **Content Security Policy (CSP):** Frontend headers
- **Secret management:** Environment variables (never commit)

**Threat Model:**
- **XSS:** Mitigated by React's automatic escaping
- **CSRF:** Not applicable (no session cookies currently)
- **SQL Injection:** Mitigated by ORM (parameterized queries)
- **DDoS:** Mitigated by rate limiting (future)

---

## 9. Security Architecture

### 9.1 Current Security Posture

#### 9.1.1 Data Protection

**Data at Rest:**
- **Database:** Encrypted by Neon (AES-256)
- **Conversation history:** Stored in PostgreSQL JSONB (encrypted at rest)
- **No sensitive data caching:** Frontend state cleared on refresh

**Data in Transit:**
- **Frontend ↔ Backend:** HTTPS (production), HTTP (development)
- **Backend ↔ Database:** PostgreSQL TLS (enforced by `sslmode=require`)
- **Backend ↔ Ollama:** HTTP (localhost - no network exposure)

#### 9.1.2 Input Validation

**Backend:**
```python
# Pydantic automatic validation
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[str] = Field(None, regex=r'^[a-zA-Z0-9\-]+$')
```

**Frontend:**
```typescript
// TypeScript type checking
interface Message {
  id: string
  role: "user" | "assistant"  // Literal types prevent invalid roles
  content: string
  timestamp: number
}
```

#### 9.1.3 Authentication & Authorization

**Current:**
- No authentication (single-user deployment assumption)
- No authorization checks

**Future Implementation (Phase 2):**
```python
# JWT authentication middleware
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Protected endpoint
@app.get("/conversations")
async def list_conversations(user_id: str = Depends(get_current_user)):
    return db.get_sessions(user_id=user_id)
```

### 9.2 Security Best Practices

#### 9.2.1 Environment Variables

**Never commit secrets:**
```bash
# .gitignore
.env
.env.local
.env.production
```

**Use environment variables:**
```python
# config.py
class Settings(BaseSettings):
    database_url: str  # Loaded from env, never hardcoded
    secret_key: str = Field(default_factory=lambda: secrets.token_hex(32))
```

#### 9.2.2 CORS Configuration

**Development (permissive):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # All origins allowed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production (restrictive):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)
```

#### 9.2.3 Rate Limiting (Future)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def chat(request: ChatRequest):
    ...
```

### 9.3 Security Checklist for Production

- [ ] **HTTPS enforced** everywhere (no HTTP)
- [ ] **Database TLS** enabled (`sslmode=require`)
- [ ] **CORS origins** restricted to known domains
- [ ] **Environment variables** properly configured (no secrets in code)
- [ ] **Rate limiting** implemented on API endpoints
- [ ] **Authentication** enabled (if multi-user)
- [ ] **Authorization** checks on protected resources
- [ ] **Content Security Policy (CSP)** headers configured
- [ ] **Dependency scanning** (npm audit, pip-audit)
- [ ] **Secrets management** (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] **Logging** excludes sensitive data (PII, tokens)
- [ ] **Error messages** don't leak implementation details

---

## 10. Technology Stack Details

### 10.1 Backend Stack

| Technology | Version | Purpose | License |
|------------|---------|---------|---------|
| **Python** | 3.11+ | Programming language | PSF |
| **FastAPI** | 0.115+ | Web framework | MIT |
| **Uvicorn** | 0.32+ | ASGI server | BSD-3 |
| **Pydantic** | 2.9+ | Data validation | MIT |
| **pydantic-settings** | 2.6+ | Configuration management | MIT |
| **Agno** | 2.2.10+ | Agent framework | Apache 2.0 |
| **psycopg** | 3.2+ | PostgreSQL driver | LGPL-3.0 |
| **Ollama** | 0.4+ | LLM runtime | MIT |

**Dependency Management:**
```bash
# requirements.txt
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.9.0
pydantic-settings>=2.6.0
agno>=2.2.10
ollama>=0.4.0
psycopg[binary]>=3.2.0
python-dotenv>=1.0.0
```

### 10.2 Frontend Stack

| Technology | Version | Purpose | License |
|------------|---------|---------|---------|
| **React** | 19.1+ | UI library | MIT |
| **TypeScript** | ~5.9.3 | Type safety | Apache 2.0 |
| **Vite** | 7.x | Build tool | MIT |
| **Redux Toolkit** | 2.x | State management | MIT |
| **RTK Query** | 2.x (with Redux Toolkit) | Data fetching | MIT |
| **Tailwind CSS** | 4.x | Styling | MIT |
| **shadcn/ui** | Latest (Radix UI-based) | Component library | MIT |
| **React Router** | 7.x | Routing | MIT |
| **React Markdown** | 10.x | Markdown rendering | MIT |
| **Lucide React** | Latest | Icons | ISC |
| **Framer Motion** | 12.x | Animations | MIT |
| **Radix UI** | Latest | Headless UI primitives | MIT |

**Dependency Management:**

> **Note:** For the complete and up-to-date list of dependencies, see `frontend/package.json`.

**Key Dependencies:**
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "@reduxjs/toolkit": "^2.10.1",
    "react-redux": "^9.2.0",
    "react-router-dom": "^7.9.5",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.1.17",
    "@tailwindcss/typography": "^0.5.19",
    "react-markdown": "^10.1.0",
    "rehype-highlight": "^7.0.2",
    "remark-gfm": "^4.0.1",
    "lucide-react": "^0.553.0",
    "framer-motion": "^12.23.24",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "~5.9.3",
    "vite": "^7.1.7",
    "eslint": "^9.36.0",
    "vitest": "^2.1.8",
    "@vitest/coverage-v8": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3"
  }
}
```

### 10.3 Infrastructure Stack

| Component | Technology | Purpose | Provider |
|-----------|------------|---------|----------|
| **Frontend Hosting** | Vercel / Netlify / Cloudflare | Static asset serving | Cloud |
| **Backend Hosting** | Railway / Render / Fly.io | API server | Cloud |
| **Database** | Neon PostgreSQL | Data persistence | Neon Tech |
| **LLM Runtime** | Ollama | Model inference | Self-hosted |
| **CDN** | Cloudflare / Vercel Edge | Asset delivery | Cloud |
| **DNS** | Cloudflare | Domain management | Cloud |
| **Monitoring** | (Future) Sentry, Prometheus | Observability | Cloud/Self-hosted |

### 10.4 Development Tools

| Tool | Purpose | License |
|------|---------|---------|
| **Git** | Version control | GPLv2 |
| **npm** | Frontend package manager | Artistic-2.0 |
| **pip** | Python package manager | MIT |
| **ESLint** | JavaScript linting | MIT |
| **Prettier** | Code formatting | MIT |
| **Ruff** | Python linting | MIT |
| **pytest** | Python testing | MIT |
| **vitest** | Frontend testing | MIT |
| **VS Code** | IDE | MIT |

---

## Appendix A: Diagram Conventions

### UML Notation Used

- **Box with rounded corners:** System/Container
- **Solid arrow →:** Data flow / dependency
- **Dashed arrow - ->:** Optional / future dependency
- **Double-headed arrow ↔:** Bidirectional communication

### C4 Model Levels

1. **System Context:** Big picture, external actors and systems
2. **Container:** High-level technology choices (apps, databases, services)
3. **Component:** Internal structure of containers (modules, classes)
4. **Code:** Implementation details (classes, methods, functions)

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Agno** | AI agent orchestration framework with native PostgreSQL support |
| **Agent** | Agno's abstraction for an AI assistant with conversation management |
| **SSE** | Server-Sent Events - HTTP protocol for server-to-client streaming |
| **RTK Query** | Redux Toolkit's data fetching and caching library |
| **Ollama** | Local LLM inference runtime supporting various open-source models |
| **Neon** | Serverless PostgreSQL platform with automatic scaling and backups |
| **Conversation** | Persistent chat session with message history |
| **Session** | Agno's database representation of a conversation (stored in agno_sessions table) |
| **Streaming** | Token-by-token response delivery for immediate user feedback |
| **JSONB** | PostgreSQL's binary JSON data type (efficient storage and indexing) |
| **C4 Model** | Context, Container, Component, Code - hierarchical architecture documentation model |
| **ADR** | Architectural Decision Record - documentation of key design decisions |

---


*This Architecture Document provides a comprehensive technical view of the Agno + Ollama Full-Stack Chatbot system using the C4 Model, ADRs, and detailed API specifications. It serves as the authoritative reference for system design, implementation, and evolution.*
