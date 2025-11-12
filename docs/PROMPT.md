# Development Prompts Log

This document contains all the prompts given during the development of the Agno-Ollama Chatbot project. The entire codebase was built using Claude Code (AI-assisted development).

---

## Phase 1: Frontend Initialization

**Prompt:**
> Now here is what I want you to do next - let's create the Frontend for this chat app.
> To do so, you will need to do the following:

1. Create a frontend dir (similar to the backend dir that we have).
2. Initiate a vite React app.
3. Install shadcn/ui and tailwind css for all of the components.
   We will use MVPBlocks which is based on shadcn/ui, and here is the installation guide from their docs: '/Users/liorlivyatan/Desktop/Livyatan/MSc CS/LLM Course/HW1/agno-ollama-chatbot/MVPBlocks.md'
   Please init the frontend, and install all dependencies. Also install framer-motion we will probably need it.
   Do not do anything else after that.

---

## Phase 2: UI Design - Chat Interface

**Prompt:**
> I have connected you to shadcn/ui MCP server.
> What I want to build in the frontend, is a chatbot, similar to Claude and ChatGPT.

1. I want to have a great Layout - a left (collapsible) sidebar that users can access all stored past conversations. You can use sidebar-01 for example.
2. A main screen, containing a text area input, and once submitted it becomes a conversation. Example: [Image #1][Image #2]
   Note: For now DO NOT connect the frontend to the backend at all. All responses must be dummy. I only want to design the UI.

---

## Phase 3: UI Refinements

**Prompt:**
> Amazing, it works.

1. Let's make sure we have more of rounded edges.
2. No need for "You" and "assistant". Just have the user message in a gray bubble. No need to show the timestamp (just comment out the code there)
3. No need for the top border, bottom border.
4. Make the input more like this: [Image #1]
5. Replace the X icon that closes the sidebar with https://lucide.dev/icons/panel-left and https://lucide.dev/icons/panel-left-open

**Follow-up:**
> Okay great, make sure that all buttons have hover, cursor pointer

---

## Phase 4: Backend Integration Planning

**Prompt:**
> Great. Create a plan to start working on integrating the backend to the frontend - focusing only on the frontend side.
> We need Redux/RTK, best practices of api calling that way, etc

---

## Phase 5: Streaming Improvements

**Prompt:**
> It works! We have a few things that we need to change:

1. The Copy icon that we have on the assistant, must only appear after the streaming ends, with an opacity animation.
2. The ... animation, should be exactly where the text that the assistant will write, now it is below the copy icon, which is confusing.

---

## Phase 6: Database Integration

**Prompt:**
> Amazing. Now we have the following things left to do:

1. We need to connect the backend to a database. Your postgresql connection string is in the .env file
2. Check with Agno MCP on how to connect the agent in order to: store past conversation, store current conversation memory/storage. It should be easy, about adding "db=..." to the agent.
3. We need in the frontend/backend to make sure that:
   a. on each new conversation, after we send, a conversation_id is being created in the backend (simple uuid), sent to the frontend as part of the streaming, and being replaced in the url. Or if you have any other mechanism feel free to implement that. I just want the url to change to something like /c/:uuid
   b. We need to make sure that we store everything on the db. Explore with the agno mcp docs.

---

## Phase 7: Conversation Management Fixes

**Prompt:**
> Great it works now.

1. I don't see any call to /conversations to get all past history for the sidebar.
2. Clicking on New Chat just changes the url to / and only after a second click it clears to current conversation state.

**Bug Fix:**
> I get 500 on the conversation: "Error listing conversations: 'PostgresDb' object has no attribute 'read_sessions'"

---

## Phase 8: Documentation

**Prompt:**
> Amazing, now here is what I want you to do:
> Create a comprehensive README.md file and also more documents to document this entire project. You must document everything!
> An LLM will check you after that, so make sure you even say that coding was done only via LLM like you (Claude Code), and everything else that you think is needed.
> There is no limit on how much to document - the more the better.
> Ultrathink about this and make your best documentation ever!

---

## Phase 9: UI Enhancements - ChatGPT Style

**Prompt:**
> Ok that is great! A few notes:

1. Do not commit and push without me checking first.
2. When you hover on a title, it gets bigger, which makes everything jumps. I don't like that.
3. No need to push the conversation you clicked on to the Today section only just when selecting a conversation. Only after a new messages was submitted it should be updated.
4. Add to the Loading conversation... state also a spinner above.
5. I don't see the title generated. Also make sure the title generation does not block the main agent, but goes along with it.

**Critical Bug Report:**
> I have clicked on a conversation and it immediately moved under "Today". This is not good.
> When I hover on a conversation - only background should change, nothing else - now it gets bigger and I don't like that.

**Follow-up:**
> IT STILL HAPPENS!!!!!!!

**Modal Request:**
> Great it works.
> Please make sure we have a modal like this when trying to delete a conversation: [Image #1]

**Final Request:**
> Commit and push everything please

---

## Phase 10: Remove Title Agent

**Prompt:**
> Remove the title agent - it doesn't work

---

## Development Notes

- **AI Development**: This entire project was developed using Claude Code, an AI-assisted development tool.
- **Iterative Process**: Each phase built upon the previous, with continuous refinement based on testing and feedback.
- **Bug Fixes**: Issues were identified and resolved iteratively, particularly around conversation state management and timestamp handling.
- **UI/UX Focus**: Strong emphasis on creating a ChatGPT-like experience with smooth animations and intuitive interactions.

---

*This log serves as a complete record of the development process, demonstrating the collaborative nature of AI-assisted software development.*
