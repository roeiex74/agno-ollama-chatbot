import { describe, it, expect } from "vitest";
import conversationsReducer, {
  setCurrentConversation,
  addConversation,
  addMessage,
  updateLastAssistantMessage,
  clearConversations,
} from "../../store/slices/conversationsSlice";
import type { Conversation, Message } from "@/types/api";

describe("conversationsSlice", () => {
  const initialState = {
    conversations: [],
    currentConversationId: null,
  };

  const mockConversation: Conversation = {
    id: "conv-1",
    title: "Test Conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockMessage: Message = {
    id: "msg-1",
    role: "user",
    content: "Hello, how are you?",
    timestamp: Date.now(),
  };

  it("should return initial state", () => {
    expect(conversationsReducer(undefined, { type: "unknown" })).toEqual(
      initialState
    );
  });

  it("should set current conversation", () => {
    const state = conversationsReducer(
      initialState,
      setCurrentConversation("conv-1")
    );
    expect(state.currentConversationId).toBe("conv-1");
  });

  it("should add new conversation", () => {
    const state = conversationsReducer(
      initialState,
      addConversation(mockConversation)
    );
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0]).toEqual(mockConversation);
    expect(state.currentConversationId).toBe("conv-1");
  });

  it("should add message to conversation", () => {
    const stateWithConversation = {
      conversations: [mockConversation],
      currentConversationId: "conv-1",
    };

    const state = conversationsReducer(
      stateWithConversation,
      addMessage({ conversationId: "conv-1", message: mockMessage })
    );

    expect(state.conversations[0].messages).toHaveLength(1);
    expect(state.conversations[0].messages[0]).toEqual(mockMessage);
  });

  it("should update conversation title with first user message", () => {
    const stateWithConversation = {
      conversations: [mockConversation],
      currentConversationId: "conv-1",
    };

    const state = conversationsReducer(
      stateWithConversation,
      addMessage({ conversationId: "conv-1", message: mockMessage })
    );

    expect(state.conversations[0].title).toBe("Hello, how are you?");
  });

  it("should truncate long titles", () => {
    const longMessage: Message = {
      id: "msg-long",
      role: "user",
      content: "This is a very long message that should be truncated to 50 characters maximum",
      timestamp: Date.now(),
    };

    const stateWithConversation = {
      conversations: [mockConversation],
      currentConversationId: "conv-1",
    };

    const state = conversationsReducer(
      stateWithConversation,
      addMessage({ conversationId: "conv-1", message: longMessage })
    );

    expect(state.conversations[0].title).toHaveLength(53); // 50 chars + "..."
    expect(state.conversations[0].title).toContain("...");
  });

  it("should update last assistant message", () => {
    const conversationWithMessages: Conversation = {
      ...mockConversation,
      messages: [
        mockMessage,
        {
          id: "msg-2",
          role: "assistant",
          content: "Initial response",
          timestamp: Date.now(),
        },
      ],
    };

    const stateWithMessages = {
      conversations: [conversationWithMessages],
      currentConversationId: "conv-1",
    };

    const state = conversationsReducer(
      stateWithMessages,
      updateLastAssistantMessage({
        conversationId: "conv-1",
        content: "Updated response",
      })
    );

    const lastMessage =
      state.conversations[0].messages[
        state.conversations[0].messages.length - 1
      ];
    expect(lastMessage.content).toBe("Updated response");
  });

  it("should clear all conversations", () => {
    const stateWithConversations = {
      conversations: [mockConversation],
      currentConversationId: "conv-1",
    };

    const state = conversationsReducer(
      stateWithConversations,
      clearConversations()
    );

    expect(state.conversations).toHaveLength(0);
    expect(state.currentConversationId).toBeNull();
  });

  it("should not add message to non-existent conversation", () => {
    const stateWithConversation = {
      conversations: [mockConversation],
      currentConversationId: "conv-1",
    };

    const state = conversationsReducer(
      stateWithConversation,
      addMessage({ conversationId: "non-existent", message: mockMessage })
    );

    // Original conversation should remain unchanged
    expect(state.conversations[0].messages).toHaveLength(0);
  });
});
