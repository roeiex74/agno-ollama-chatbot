import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Conversation, Message } from "@/types/api";

interface ConversationsState {
  conversations: Conversation[];
  currentConversationId: string | null;
}

const initialState: ConversationsState = {
  conversations: [],
  currentConversationId: null,
};

export const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    // Set current conversation
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
    },

    // Load conversations from backend
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },

    // Add new conversation
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
      state.currentConversationId = action.payload.id;
    },

    // Add message to conversation
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload.conversationId
      );
      if (conversation) {
        conversation.messages.push(action.payload.message);
        conversation.updatedAt = Date.now();

        // Update title if it's the first user message
        if (
          conversation.messages.length === 1 &&
          action.payload.message.role === "user"
        ) {
          conversation.title =
            action.payload.message.content.slice(0, 50) +
            (action.payload.message.content.length > 50 ? "..." : "");
        }
      }
    },

    // Update last assistant message (for streaming)
    updateLastAssistantMessage: (
      state,
      action: PayloadAction<{ conversationId: string; content: string }>
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload.conversationId
      );
      if (conversation && conversation.messages.length > 0) {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.content = action.payload.content;
        }
      }
    },

    // Update conversation title
    updateConversationTitle: (
      state,
      action: PayloadAction<{ conversationId: string; title: string }>
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload.conversationId
      );
      if (conversation) {
        conversation.title = action.payload.title;
      }
    },

    // Load historical messages without updating updatedAt
    // (used when fetching old conversations from backend)
    loadMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: Message[] }>
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload.conversationId
      );
      if (conversation) {
        conversation.messages = action.payload.messages;
        // Don't update updatedAt - keep the original timestamp
      }
    },

    // Clear messages for a specific conversation
    clearCurrentConversationMessages: (
      state,
      action: PayloadAction<string>
    ) => {
      const conversation = state.conversations.find(
        (c) => c.id === action.payload
      );
      if (conversation) {
        conversation.messages = [];
      }
    },

    // Clear all conversations
    clearConversations: (state) => {
      state.conversations = [];
      state.currentConversationId = null;
    },
  },
});

export const {
  setCurrentConversation,
  setConversations,
  addConversation,
  addMessage,
  updateLastAssistantMessage,
  updateConversationTitle,
  loadMessages,
  clearCurrentConversationMessages,
  clearConversations,
} = conversationsSlice.actions;

// Selectors
export const selectAllConversations = (state: RootState) =>
  state.conversations.conversations;

export const selectCurrentConversationId = (state: RootState) =>
  state.conversations.currentConversationId;

export const selectCurrentConversation = (state: RootState) => {
  const id = state.conversations.currentConversationId;
  return state.conversations.conversations.find((c) => c.id === id) || null;
};

export const selectCurrentMessages = (state: RootState) => {
  const conversation = selectCurrentConversation(state);
  return conversation?.messages || [];
};

export default conversationsSlice.reducer;
