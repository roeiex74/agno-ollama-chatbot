# Product Requirements Document (PRD)
## Agno + Ollama Full-Stack Chatbot

**Version:** 1.0
**Date:** January 2025
**Status:** Approved for Implementation

---

## 1. Executive Summary

### 1.1 Purpose
Develop a production-ready, full-stack chatbot application that enables users to interact with locally-hosted Large Language Models (LLMs) through a modern web interface with persistent conversation history.

### 1.2 Business Context
The proliferation of cloud-based AI services raises concerns about data privacy, API costs, and dependency on external providers. This solution addresses these challenges by:
- Enabling organizations to run AI chatbots entirely on their infrastructure
- Eliminating recurring API costs through local model inference
- Ensuring data privacy by keeping all conversations on-premises
- Providing a user-friendly alternative to command-line LLM interactions

### 1.3 Strategic Goals
- **Privacy-First**: All data processing occurs locally or in controlled environments
- **Cost-Effective**: Zero-cost LLM inference using open-source models
- **User Experience**: ChatGPT-quality interface with modern UX patterns
- **Scalability**: Architecture designed to support multi-user deployments
- **Extensibility**: Modular design allowing future feature additions

---

## 2. Target Audience & Stakeholders

### 2.1 Primary Users
- **Technical Professionals**: Developers, data scientists, researchers requiring AI assistance
- **Organizations**: Companies seeking private AI chat solutions without cloud dependencies
- **Privacy-Conscious Users**: Individuals concerned about data being sent to third-party APIs
- **Cost-Sensitive Teams**: Organizations looking to avoid per-token pricing models

### 2.2 Stakeholders
- **Development Team**: Responsible for implementation and maintenance
- **End Users**: Individuals interacting with the chatbot
- **Infrastructure Team**: Managing deployment and server resources
- **Security Team**: Ensuring data privacy and compliance requirements

---

## 3. Problem Statement

### 3.1 Current Challenges
1. **Privacy Concerns**: Commercial AI services process sensitive data on external servers
2. **Cost Barriers**: API-based solutions incur per-token costs that scale with usage
3. **Internet Dependency**: Cloud services require constant connectivity
4. **Limited Customization**: Hosted solutions restrict model and behavior customization
5. **Poor UX**: Command-line LLM tools lack intuitive interfaces for non-technical users

### 3.2 Solution Overview
A self-hosted chatbot application combining:
- **Ollama**: Local LLM inference engine for privacy and cost savings
- **Agno Framework**: AI agent orchestration with built-in conversation management
- **PostgreSQL**: Reliable, persistent storage for conversation history
- **Modern Web UI**: React-based interface matching commercial AI chat experiences

---

## 4. Functional Requirements

### 4.1 Core Features

#### 4.1.1 Real-Time Chat Interface
- **FR-1.1**: Users can send text messages to an AI assistant
- **FR-1.2**: System streams responses token-by-token for immediate feedback
- **FR-1.3**: Users can cancel ongoing streaming responses
- **FR-1.4**: Interface displays loading states during processing
- **FR-1.5**: Messages support markdown formatting with syntax-highlighted code blocks

#### 4.1.2 Conversation Management
- **FR-2.1**: System automatically creates new conversations with "New Chat" button
- **FR-2.2**: Users can view list of all previous conversations in sidebar
- **FR-2.3**: Users can switch between conversations with single click
- **FR-2.4**: Users can delete conversations with confirmation modal
- **FR-2.5**: System displays message count and timestamps for each conversation
- **FR-2.6**: System automatically generates conversation titles from first user message

#### 4.1.3 Persistent Storage
- **FR-3.1**: All conversations persist to PostgreSQL database
- **FR-3.2**: System restores conversation history after browser refresh
- **FR-3.3**: Each conversation maintains chronological message ordering
- **FR-3.4**: System stores metadata including creation and update timestamps
- **FR-3.5**: Database maintains referential integrity across sessions

#### 4.1.4 Message Features
- **FR-4.1**: Users can copy assistant messages with single-click button
- **FR-4.2**: System renders markdown with GitHub Flavored Markdown support
- **FR-4.3**: Code blocks display syntax highlighting for multiple languages
- **FR-4.4**: System filters system messages from user display
- **FR-4.5**: Messages display relative timestamps ("5 min ago", "2 hr ago")

### 4.2 Backend API Endpoints

#### 4.2.1 Health Check
- **API-1**: `GET /healthz` - Returns service status, environment, model, and database info

#### 4.2.2 Chat Operations
- **API-2**: `POST /chat` - Non-streaming chat endpoint for complete responses
- **API-3**: `POST /chat/stream` - Server-Sent Events (SSE) streaming endpoint for token-by-token delivery

#### 4.2.3 Conversation CRUD
- **API-4**: `GET /conversations` - List all conversations with summary metadata
- **API-5**: `GET /conversations/{id}` - Retrieve specific conversation with full message history
- **API-6**: `DELETE /conversations/{id}` - Delete conversation permanently
- **API-7**: `PATCH /conversations/{id}/title` - Update conversation title

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-1.1**: Streaming responses begin within 2 seconds of request
- **NFR-1.2**: Conversation list loads within 1 second
- **NFR-1.3**: Message history loads within 1.5 seconds
- **NFR-1.4**: UI remains responsive during streaming (60 FPS target)
- **NFR-1.5**: Database queries complete within 500ms under normal load

### 5.2 Scalability
- **NFR-2.1**: Support minimum 100 concurrent users (with appropriate hardware)
- **NFR-2.2**: Handle conversations up to 1000 messages without degradation
- **NFR-2.3**: Support minimum 10,000 stored conversations
- **NFR-2.4**: Architecture allows horizontal scaling of backend services

### 5.3 Security & Privacy
- **NFR-3.1**: All data processing occurs on local/controlled infrastructure
- **NFR-3.2**: Database connections use TLS encryption (SSL mode)
- **NFR-3.3**: CORS policies configurable for production deployments
- **NFR-3.4**: No telemetry or external API calls without explicit configuration
- **NFR-3.5**: Future authentication system ready (placeholder for multi-user)

### 5.4 Reliability
- **NFR-4.1**: 99.9% uptime during operational hours
- **NFR-4.2**: Graceful error handling with user-friendly messages
- **NFR-4.3**: Automatic reconnection for interrupted streaming
- **NFR-4.4**: Database transactions ensure data consistency

### 5.5 Usability
- **NFR-5.1**: Interface responsive across desktop, tablet, and mobile devices
- **NFR-5.2**: Dark mode UI reduces eye strain for extended use
- **NFR-5.3**: Keyboard shortcuts support common actions
- **NFR-5.4**: Zero-configuration required for end users
- **NFR-5.5**: UI matches familiarity of commercial chat interfaces (ChatGPT-inspired)

### 5.6 Maintainability
- **NFR-6.1**: Codebase uses TypeScript for type safety (frontend)
- **NFR-6.2**: Python backend uses type hints and Pydantic validation
- **NFR-6.3**: Clear separation of concerns (API, business logic, UI)
- **NFR-6.4**: Comprehensive inline code documentation
- **NFR-6.5**: Automated tests cover critical paths

---

## 6. Technical Architecture

### 6.1 Technology Stack

#### Backend
- **Framework**: FastAPI 0.115+ (Python 3.11+)
- **Agent Framework**: Agno (latest) - AI agent orchestration
- **LLM Runtime**: Ollama - Local model inference
- **Database**: PostgreSQL 16+ via Neon (serverless)
- **Database Driver**: psycopg 3.x (async support)
- **ASGI Server**: Uvicorn with auto-reload
- **Validation**: Pydantic 2.x for request/response models

#### Frontend
- **UI Library**: React 19+
- **Language**: TypeScript 5.6+
- **Build Tool**: Vite 7.x
- **State Management**: Redux Toolkit 2.x
- **Data Fetching**: RTK Query
- **Routing**: React Router 7.x
- **Styling**: Tailwind CSS 4.x
- **Components**: shadcn/ui (Radix UI-based)
- **Markdown**: React Markdown 10.x with rehype-highlight
- **Icons**: Lucide React

### 6.2 System Architecture

#### 6.2.1 Three-Tier Architecture
```
Presentation Layer (React Frontend)
    ↕ HTTP/SSE
Application Layer (FastAPI Backend)
    ↕ Agno Framework
Data Layer (PostgreSQL + Ollama)
```

#### 6.2.2 Data Flow
1. User enters message in React UI
2. Redux action dispatched to RTK Query API
3. API sends HTTP POST to `/chat/stream` endpoint
4. FastAPI loads conversation history from PostgreSQL via Agno
5. Agno agent sends message to Ollama with context
6. Ollama generates tokens and streams back to FastAPI
7. FastAPI emits Server-Sent Events (SSE) to frontend
8. React updates UI with each token delta
9. On completion, Agno persists updated conversation to PostgreSQL

### 6.3 Database Schema

#### Table: `agno_sessions`
- `session_id` (VARCHAR, PK) - Unique conversation identifier
- `session_type` (VARCHAR) - Type indicator ("agent")
- `session_data` (JSONB) - Metadata including custom title
- `agent_data` (JSONB) - Agent configuration
- `runs` (JSONB ARRAY) - Chat history and execution runs
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last modification timestamp
- `user_id` (VARCHAR) - Optional user identification (future use)

### 6.4 API Communication

#### Request/Response Format
All API requests/responses use JSON with Pydantic validation

#### Streaming Protocol
- **Protocol**: Server-Sent Events (SSE)
- **Format**: `data: {JSON}\n\n`
- **Delta Events**: `{"delta": "token"}`
- **Completion Event**: `{"done": true, "conversation_id": "...", "response": "...", "usage": {...}}`

---

## 7. User Stories

### 7.1 First-Time User
**As a** new user
**I want to** immediately start chatting without configuration
**So that** I can quickly evaluate the system's capabilities

**Acceptance Criteria:**
- Landing page displays chat interface immediately
- "New Chat" button prominently visible
- Input field accepts text without prerequisites
- First message receives response within 3 seconds

### 7.2 Privacy-Conscious User
**As a** privacy-conscious professional
**I want to** verify all data stays on my infrastructure
**So that** I can confidently discuss sensitive topics

**Acceptance Criteria:**
- No external API calls during normal operation
- Database hosted on controlled infrastructure
- All processing occurs locally (Ollama)
- Network inspector shows no third-party requests

### 7.3 Returning User
**As a** returning user
**I want to** access my previous conversations
**So that** I can continue past discussions or reference prior work

**Acceptance Criteria:**
- Sidebar lists all previous conversations
- Clicking conversation loads full history
- Conversations sorted by most recent activity
- Titles generated from first message for easy identification

### 7.4 Multi-Conversation User
**As a** power user managing multiple projects
**I want to** organize separate conversations by topic
**So that** I can maintain context separation across different tasks

**Acceptance Criteria:**
- Can create unlimited new conversations
- Can switch between conversations without losing state
- Each conversation maintains independent history
- Can delete conversations no longer needed

### 7.5 Technical User
**As a** developer using the chatbot for coding help
**I want to** easily copy code examples from responses
**So that** I can quickly implement suggestions in my projects

**Acceptance Criteria:**
- Code blocks display syntax highlighting
- One-click copy button on assistant messages
- Markdown rendering supports tables, lists, and formatting
- Code language automatically detected and highlighted

---

## 8. Use Cases

### 8.1 Basic Chat Interaction
**Primary Actor:** End User
**Preconditions:** Application running, Ollama service active

**Main Flow:**
1. User opens application in browser
2. System displays chat interface with empty state
3. User clicks "New Chat" button
4. User types message in input field
5. User presses Enter or clicks send button
6. System displays "Thinking..." indicator
7. System streams response token-by-token
8. User reads complete response
9. System enables input for follow-up

**Alternate Flow 3a:** User continues existing conversation
3a. User selects conversation from sidebar
3b. System loads message history
3c. Continue at step 4

**Exception Flow 6a:** Ollama service unavailable
6a. System displays error: "Cannot connect to model service"
6b. System provides troubleshooting guidance
6c. User resolves issue and retries

### 8.2 Conversation Management
**Primary Actor:** End User
**Preconditions:** User has existing conversations

**Main Flow:**
1. User opens application
2. System displays sidebar with conversation list
3. User clicks conversation to view
4. System loads and displays message history
5. User reviews previous messages
6. User hovers over conversation in sidebar
7. User clicks delete icon
8. System shows confirmation modal
9. User confirms deletion
10. System removes conversation and updates sidebar

**Alternate Flow 4a:** Conversation load fails
4a. System displays error message
4b. System offers retry option
4c. User clicks retry
4d. System attempts reload

---

## 9. Key Performance Indicators (KPIs)

### 9.1 User Engagement
- **KPI-1**: Average session duration > 10 minutes
- **KPI-2**: Messages per conversation > 5
- **KPI-3**: Return user rate > 70% within 7 days
- **KPI-4**: New conversations created per user per week > 3

### 9.2 Technical Performance
- **KPI-5**: Mean response latency < 100ms (first token)
- **KPI-6**: 95th percentile page load < 2 seconds
- **KPI-7**: Error rate < 0.1% of requests
- **KPI-8**: Database query time p95 < 500ms

### 9.3 System Reliability
- **KPI-9**: Uptime > 99.9%
- **KPI-10**: Successful stream completion rate > 99%
- **KPI-11**: Data persistence success rate = 100%
- **KPI-12**: Zero data loss incidents

---

## 10. Acceptance Criteria

### 10.1 Functional Acceptance
- ✅ User can send message and receive streaming response
- ✅ Conversations persist across browser sessions
- ✅ User can create, view, and delete conversations
- ✅ System displays conversation titles and metadata
- ✅ Markdown renders correctly with syntax highlighting
- ✅ Copy functionality works for assistant messages
- ✅ Health check endpoint returns valid status
- ✅ All CRUD operations function correctly

### 10.2 Performance Acceptance
- ✅ First token appears within 2 seconds
- ✅ UI remains responsive during streaming
- ✅ Conversation list loads within 1 second
- ✅ No memory leaks during extended use
- ✅ Handles 20+ concurrent conversations without degradation

### 10.3 Usability Acceptance
- ✅ Interface intuitive for users familiar with ChatGPT
- ✅ Mobile responsive design works on phones and tablets
- ✅ Error messages provide actionable guidance
- ✅ Loading states clearly indicate system activity
- ✅ Keyboard navigation supports common workflows

---

## 11. System Dependencies & Assumptions

### 11.1 Dependencies
- **Runtime Dependencies:**
  - Python 3.11+ with pip/venv
  - Node.js 20+ with npm
  - Ollama runtime service
  - PostgreSQL 16+ (via Neon or self-hosted)

- **External Services:**
  - Neon PostgreSQL (or compatible PostgreSQL provider)
  - Ollama model registry for model downloads

- **Libraries & Frameworks:**
  - See Technology Stack (Section 6.1) for complete list

### 11.2 Assumptions
- **Assumption 1**: Users have access to hardware capable of running LLMs (minimum 8GB RAM for small models)
- **Assumption 2**: Users can install and configure Ollama independently
- **Assumption 3**: PostgreSQL database available with SSL connection
- **Assumption 4**: Users operate in modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Assumption 5**: Single-user deployment initially (multi-user in future phase)

### 11.3 Constraints
- **Technical Constraints:**
  - Limited to models supported by Ollama
  - Streaming requires browser SSE support
  - Database size limited by PostgreSQL/Neon tier

- **Operational Constraints:**
  - LLM inference speed depends on hardware capabilities
  - Cannot exceed Ollama's model context window limits
  - Database connection pooling required for high concurrency

---

## 12. Out of Scope

The following features are explicitly excluded from initial implementation:

### 12.1 Phase 1 Exclusions
- ❌ User authentication and multi-user support
- ❌ Conversation sharing between users
- ❌ Export conversations (JSON, PDF, Markdown)
- ❌ Search across conversations
- ❌ Conversation folders or tagging system
- ❌ Light/dark theme toggle (dark mode only)
- ❌ Voice input/output
- ❌ File upload and analysis
- ❌ Multi-agent workflows
- ❌ Tool integration (web search, calculator, etc.)
- ❌ Code execution in sandbox
- ❌ Custom system prompts via UI
- ❌ Model switching in UI
- ❌ Conversation branching/forking
- ❌ Analytics dashboard
- ❌ Rate limiting
- ❌ Monitoring and observability integrations

### 12.2 Future Considerations
These features may be prioritized in subsequent phases based on user feedback and business needs.

---

## 13. Timeline & Milestones

### 13.1 Development Phases

**Phase 1: Foundation (Week 1-2)**
- ✅ Backend structure with FastAPI
- ✅ Agno integration and Ollama connectivity
- ✅ Basic chat endpoint (non-streaming)
- ✅ PostgreSQL database setup

**Phase 2: Streaming & Frontend (Week 3-4)**
- ✅ Server-Sent Events streaming implementation
- ✅ React frontend with TypeScript
- ✅ Redux Toolkit state management
- ✅ Basic UI components

**Phase 3: Conversation Management (Week 5-6)**
- ✅ Conversation CRUD endpoints
- ✅ Sidebar with conversation list
- ✅ Auto-title generation
- ✅ Delete confirmation modal

**Phase 4: Polish & Optimization (Week 7-8)**
- ✅ Markdown rendering with syntax highlighting
- ✅ Copy button functionality
- ✅ Performance optimization (memoized rendering)
- ✅ Error handling and loading states
- ✅ Mobile responsive design

**Phase 5: Documentation & Testing (Week 9-10)**
- ✅ Comprehensive README and API documentation
- ✅ Deployment guides
- ✅ Test coverage for critical paths
- ✅ Troubleshooting guides

### 13.2 Milestone Deliverables

**M1 - Backend API Functional (Week 2)**
- All API endpoints operational
- Database integration complete
- Streaming responses working

**M2 - Basic Frontend MVP (Week 4)**
- Chat interface functional
- Messages display correctly
- Streaming visible in UI

**M3 - Feature Complete (Week 6)**
- All core features implemented
- Conversation management working
- Auto-title generation active

**M4 - Production Ready (Week 8)**
- Performance optimized
- Error handling robust
- Mobile responsive

**M5 - Launch Ready (Week 10)**
- Documentation complete
- Tests passing
- Deployment validated

---

## 14. Deliverables

### 14.1 Software Deliverables
- ✅ FastAPI backend application (`/backend`)
- ✅ React frontend application (`/frontend`)
- ✅ Database schema and migrations (via Agno)
- ✅ Environment configuration templates (`.env.example`)
- ✅ Docker configuration (future enhancement)

### 14.2 Documentation Deliverables
- ✅ README.md - Project overview and quick start guide
- ✅ PRD.md - This Product Requirements Document
- ✅ docs/ARCHITECTURE.md - Detailed architecture guide
- ✅ docs/API_DOCUMENTATION.md - Complete API reference
- ✅ docs/DEVELOPMENT.md - Development best practices
- ✅ docs/DEPLOYMENT.md - Production deployment guide
- ✅ docs/TROUBLESHOOTING.md - Common issues and solutions
- ✅ CONTRIBUTING.md - Contribution guidelines
- ✅ CHANGELOG.md - Version history

### 14.3 Testing Deliverables
- ✅ Backend unit tests (pytest)
- ✅ Frontend component tests (vitest)
- ✅ API integration tests
- ✅ Manual test scenarios documentation

---

## 15. Success Criteria

### 15.1 Launch Criteria
The product is considered ready for launch when:
- ✅ All functional requirements (Section 4) are implemented
- ✅ All acceptance criteria (Section 10) are met
- ✅ Performance meets defined KPIs (Section 9)
- ✅ Documentation is complete and accurate
- ✅ Zero critical bugs in issue tracker
- ✅ Security review completed (basic assessment)
- ✅ Deployment guide validated on clean environment

### 15.2 Post-Launch Success Metrics (30 Days)
- User adoption rate > 50 active users (if deployed internally)
- Average session quality score > 4/5 (user feedback)
- Technical error rate < 0.5%
- Zero security incidents
- Community feedback predominantly positive

---

## 16. Risk Assessment

### 16.1 Technical Risks

**Risk T-1: Ollama Service Unavailability**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Implement health checks, clear error messages, auto-retry logic

**Risk T-2: Database Connection Failures**
- **Probability:** Low
- **Impact:** High
- **Mitigation:** Connection pooling, retry logic, database failover support

**Risk T-3: Model Performance Issues**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Configurable model selection, timeout handling, model size recommendations

**Risk T-4: Browser Compatibility Issues**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:** Target modern browsers, graceful degradation, compatibility testing

### 16.2 Operational Risks

**Risk O-1: Insufficient Hardware Resources**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Clear hardware requirements documentation, model size recommendations

**Risk O-2: Scalability Bottlenecks**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:** Horizontal scaling architecture, database optimization, caching strategy

**Risk O-3: Data Loss from Failed Transactions**
- **Probability:** Low
- **Impact:** High
- **Mitigation:** Database transactions, error handling, data validation

### 16.3 User Adoption Risks

**Risk U-1: Complexity of Setup**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Detailed quick start guide, automated setup scripts, troubleshooting docs

**Risk U-2: Poor User Experience**
- **Probability:** Low
- **Impact:** High
- **Mitigation:** User testing, ChatGPT-inspired familiar interface, iterative refinement

---

## 17. Compliance & Security Considerations

### 17.1 Data Privacy
- **Requirement:** All user data processed and stored on controlled infrastructure
- **Implementation:** No external API calls, local Ollama processing, private PostgreSQL
- **Validation:** Network traffic monitoring, security audit of dependencies

### 17.2 Data Security
- **Requirement:** Encrypted data transmission to/from database
- **Implementation:** PostgreSQL SSL mode required, HTTPS for frontend (production)
- **Validation:** Connection string validation, certificate verification

### 17.3 Future Authentication Requirements
- **Note:** Current implementation lacks authentication (single-user assumption)
- **Future State:** Multi-user support requires authentication layer
- **Recommended:** JWT tokens, role-based access control, session management

---

## 18. Support & Maintenance

### 18.1 Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Documentation**: Comprehensive guides for self-service

### 18.2 Maintenance Windows
- **Backend Updates**: Rolling updates without downtime (future)
- **Database Migrations**: Scheduled during low-usage periods
- **Model Updates**: User-initiated via Ollama CLI

### 18.3 Monitoring Requirements
- **Health Checks**: `/healthz` endpoint for uptime monitoring
- **Log Aggregation**: Application logs for debugging
- **Performance Metrics**: Response times, error rates, resource usage

---

## 19. Glossary

- **Agno**: AI agent orchestration framework with native PostgreSQL support
- **Ollama**: Local LLM inference engine for running open-source models
- **SSE (Server-Sent Events)**: HTTP protocol for server-to-client streaming
- **RTK Query**: Redux Toolkit's data fetching and caching library
- **shadcn/ui**: Component library built on Radix UI primitives
- **Neon**: Serverless PostgreSQL platform with connection pooling
- **Streaming**: Token-by-token response delivery for immediate user feedback
- **Conversation**: Persistent chat session with message history
- **Session**: Agno's database representation of conversation state

---

## 20. Appendices

### Appendix A: Environment Variables

**Backend (.env)**
```bash
ENV=local                          # Environment type
OLLAMA_MODEL=llama3.2:3b          # Model identifier
OLLAMA_HOST=http://localhost:11434 # Ollama service URL
MODEL_TIMEOUT_S=60                # Request timeout
DATABASE_URL=postgresql+psycopg://... # PostgreSQL connection
MAX_HISTORY=20                    # Max conversation history
HOST=0.0.0.0                      # Server bind host
PORT=8000                         # Server bind port
```

**Frontend (.env.local)**
```bash
VITE_API_URL=http://localhost:8000  # Backend API URL
```

### Appendix B: Recommended Models

| Model | Size | Use Case | Hardware |
|-------|------|----------|----------|
| llama3.2:1b | 1GB | Fast responses, basic queries | 8GB RAM |
| llama3.2:3b | 2GB | Balanced performance | 16GB RAM |
| llama3.3:70b | 40GB | Best quality, complex tasks | 64GB RAM + GPU |

### Appendix C: Browser Support Matrix

| Browser | Minimum Version | SSE Support | Notes |
|---------|----------------|-------------|-------|
| Chrome | 90+ | ✅ | Recommended |
| Firefox | 88+ | ✅ | Recommended |
| Safari | 14+ | ✅ | macOS/iOS |
| Edge | 90+ | ✅ | Chromium-based |

---

*This Product Requirements Document serves as the foundational specification for the Agno + Ollama Full-Stack Chatbot project. All implementation decisions should reference and align with these requirements.*
