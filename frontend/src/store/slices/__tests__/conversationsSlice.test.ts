/**
 * Additional comprehensive tests for conversationsSlice
 * (Extends existing tests)
 */

import { describe, it, expect } from 'vitest';
import conversationsReducer, {
  addMessage,
  addConversation,
  updateLastAssistantMessage,
  clearCurrentConversationMessages,
  clearConversations,
  setConversations,
  updateConversationTitle,
  selectCurrentConversation,
  selectAllConversations,
  selectCurrentConversationId,
} from '../conversationsSlice';

interface ConversationsState {
  conversations: Array<{
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
    createdAt: number;
    updatedAt: number;
  }>;
  currentConversationId: string | null;
}

const initialState: ConversationsState = {
  conversations: [],
  currentConversationId: null,
};

describe('conversationsSlice - Additional Tests', () => {
  describe('Reducers - Edge Cases', () => {
    it('handles addMessage to existing conversation', () => {
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-1',
            title: 'Test',
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'First message',
                timestamp: Date.now(),
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: 'conv-1',
      };

      const newState = conversationsReducer(
        stateWithConv,
        addMessage({
          conversationId: 'conv-1',
          message: {
            id: 'msg-2',
            role: 'user',
            content: 'Second message',
            timestamp: Date.now(),
          },
        })
      );

      expect(newState.conversations[0].messages.length).toBe(2);
      expect(newState.conversations[0].messages[1].content).toBe('Second message');
    });

    it('handles addMessage with very long content', () => {
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-long',
            title: 'Test',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const longContent = 'a'.repeat(50000);
      const newState = conversationsReducer(
        stateWithConv,
        addMessage({
          conversationId: 'conv-long',
          message: {
            id: 'msg-long',
            role: 'user',
            content: longContent,
            timestamp: Date.now(),
          },
        })
      );

      const message = newState.conversations[0].messages[0];
      expect(message.content.length).toBe(50000);
    });

    it('handles addMessage with special characters', () => {
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-special',
            title: 'Test',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const specialContent = '👋 Hello <script>alert("xss")</script> 你好 \n\t';
      const newState = conversationsReducer(
        stateWithConv,
        addMessage({
          conversationId: 'conv-special',
          message: {
            id: 'msg-special',
            role: 'user',
            content: specialContent,
            timestamp: Date.now(),
          },
        })
      );

      expect(newState.conversations[0].messages[0].content).toBe(specialContent);
    });

    it('handles updateLastAssistantMessage with no messages', () => {
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-empty',
            title: 'Empty',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const newState = conversationsReducer(
        stateWithConv,
        updateLastAssistantMessage({
          conversationId: 'conv-empty',
          content: 'New content',
        })
      );

      // Should not crash, messages remain empty
      expect(newState.conversations[0].messages.length).toBe(0);
    });

    it('handles updateLastAssistantMessage with only user messages', () => {
      const stateWithUserMsg: ConversationsState = {
        conversations: [
          {
            id: 'conv-user-only',
            title: 'User Only',
            messages: [
              {
                id: 'msg-user',
                role: 'user',
                content: 'User message',
                timestamp: Date.now(),
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const newState = conversationsReducer(
        stateWithUserMsg,
        updateLastAssistantMessage({
          conversationId: 'conv-user-only',
          content: 'Update',
        })
      );

      // Should not modify user message
      expect(newState.conversations[0].messages[0].role).toBe('user');
      expect(newState.conversations[0].messages[0].content).toBe('User message');
    });

    it('handles clearCurrentConversationMessages for non-existent conversation', () => {
      const newState = conversationsReducer(
        initialState,
        clearCurrentConversationMessages('non-existent-conv')
      );

      // Should not crash
      expect(newState.conversations.length).toBe(0);
    });

    it('handles updateConversationTitle for non-existent conversation', () => {
      const newState = conversationsReducer(
        initialState,
        updateConversationTitle({
          conversationId: 'non-existent',
          title: 'New Title',
        })
      );

      // Should not crash
      expect(newState.conversations.length).toBe(0);
    });

    it('handles clearConversations', () => {
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-1',
            title: 'Test 1',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'conv-2',
            title: 'Test 2',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: 'conv-1',
      };

      const newState = conversationsReducer(stateWithConv, clearConversations());

      expect(newState.conversations.length).toBe(0);
      expect(newState.currentConversationId).toBeNull();
    });

    it('handles updateConversationTitle with empty string', () => {
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-1',
            title: 'Original Title',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const newState = conversationsReducer(
        stateWithConv,
        updateConversationTitle({
          conversationId: 'conv-1',
          title: '',
        })
      );

      // Should update to empty string
      expect(newState.conversations[0].title).toBe('');
    });

    it('handles updateConversationTitle with very long title', () => {
      const longTitle = 'a'.repeat(1000);
      const stateWithConv: ConversationsState = {
        conversations: [
          {
            id: 'conv-1',
            title: 'Short',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const newState = conversationsReducer(
        stateWithConv,
        updateConversationTitle({
          conversationId: 'conv-1',
          title: longTitle,
        })
      );

      expect(newState.conversations[0].title.length).toBe(1000);
    });
  });

  describe('Selectors - Additional Tests', () => {
    it('selectCurrentConversationId returns null when no current conversation', () => {
      const state = {
        conversations: {
          conversations: [
            {
              id: 'conv-1',
              title: 'Test',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          currentConversationId: null,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = selectCurrentConversationId(state as any);
      expect(result).toBeNull();
    });

    it('selectCurrentConversation returns null when no current ID', () => {
      const state = {
        conversations: {
          conversations: [
            {
              id: 'conv-1',
              title: 'Test',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          currentConversationId: null,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = selectCurrentConversation(state as any);
      expect(result).toBeNull();
    });

    it('selectCurrentConversation returns correct conversation', () => {
      const state = {
        conversations: {
          conversations: [
            {
              id: 'conv-1',
              title: 'First',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: 'conv-2',
              title: 'Second',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          currentConversationId: 'conv-2',
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = selectCurrentConversation(state as any);
      expect(result?.id).toBe('conv-2');
      expect(result?.title).toBe('Second');
    });

    it('selectAllConversations returns all conversations', () => {
      const conversations = [
        {
          id: 'conv-1',
          title: 'First',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'conv-2',
          title: 'Second',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'conv-3',
          title: 'Third',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const state = {
        conversations: {
          conversations,
          currentConversationId: null,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = selectAllConversations(state as any);
      expect(result.length).toBe(3);
      expect(result).toEqual(conversations);
    });

    it('selectAllConversations returns empty array when no conversations', () => {
      const state = {
        conversations: {
          conversations: [],
          currentConversationId: null,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = selectAllConversations(state as any);
      expect(result).toEqual([]);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple message additions in sequence', () => {
      let state: ConversationsState = {
        conversations: [
          {
            id: 'conv-multi',
            title: 'Test',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      // Add user message
      state = conversationsReducer(
        state,
        addMessage({
          conversationId: 'conv-multi',
          message: {
            id: 'msg-1',
            role: 'user',
            content: 'First',
            timestamp: Date.now(),
          },
        })
      );

      // Add assistant message
      state = conversationsReducer(
        state,
        addMessage({
          conversationId: 'conv-multi',
          message: {
            id: 'msg-2',
            role: 'assistant',
            content: 'Second',
            timestamp: Date.now(),
          },
        })
      );

      // Add another user message
      state = conversationsReducer(
        state,
        addMessage({
          conversationId: 'conv-multi',
          message: {
            id: 'msg-3',
            role: 'user',
            content: 'Third',
            timestamp: Date.now(),
          },
        })
      );

      expect(state.conversations[0].messages.length).toBe(3);
      expect(state.conversations[0].messages[0].content).toBe('First');
      expect(state.conversations[0].messages[1].content).toBe('Second');
      expect(state.conversations[0].messages[2].content).toBe('Third');
    });

    it('handles conversation creation, title update, and clearConversations', () => {
      let state: ConversationsState = {
        conversations: [
          {
            id: 'conv-lifecycle',
            title: 'Test',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      // Update title
      state = conversationsReducer(
        state,
        updateConversationTitle({
          conversationId: 'conv-lifecycle',
          title: 'Updated Title',
        })
      );

      expect(state.conversations[0].title).toBe('Updated Title');

      // Clear all conversations
      state = conversationsReducer(state, clearConversations());

      expect(state.conversations.length).toBe(0);
    });

    it('handles streaming message updates', () => {
      let state: ConversationsState = {
        conversations: [
          {
            id: 'conv-stream',
            title: 'Test',
            messages: [
              {
                id: 'msg-assistant',
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      // Update with streamed content
      state = conversationsReducer(
        state,
        updateLastAssistantMessage({
          conversationId: 'conv-stream',
          content: 'Hello',
        })
      );

      expect(state.conversations[0].messages[0].content).toBe('Hello');

      // Continue updating
      state = conversationsReducer(
        state,
        updateLastAssistantMessage({
          conversationId: 'conv-stream',
          content: 'Hello world',
        })
      );

      expect(state.conversations[0].messages[0].content).toBe('Hello world');
    });

    it('handles using addConversation', () => {
      let state = initialState;

      // Add first conversation
      state = conversationsReducer(
        state,
        addConversation({
          id: 'conv-1',
          title: 'First conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      // Add second conversation
      state = conversationsReducer(
        state,
        addConversation({
          id: 'conv-2',
          title: 'Second conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      expect(state.conversations.length).toBe(2);
      expect(state.conversations[0].id).toBe('conv-2'); // unshift adds to front
      expect(state.conversations[1].id).toBe('conv-1');
    });
  });

  describe('State Immutability', () => {
    it('does not mutate state on addMessage', () => {
      const originalState: ConversationsState = {
        conversations: [
          {
            id: 'conv-1',
            title: 'Test',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        currentConversationId: null,
      };

      const newState = conversationsReducer(
        originalState,
        addMessage({
          conversationId: 'conv-1',
          message: {
            id: 'msg-1',
            role: 'user',
            content: 'Test',
            timestamp: Date.now(),
          },
        })
      );

      // New state should have message
      expect(newState.conversations[0].messages.length).toBe(1);
      // Original reference should be different
      expect(newState).not.toBe(originalState);
    });

    it('does not mutate state on setConversations', () => {
      const originalState: ConversationsState = {
        conversations: [],
        currentConversationId: null,
      };

      const newConversations = [
        {
          id: 'conv-1',
          title: 'Test',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const newState = conversationsReducer(
        originalState,
        setConversations(newConversations)
      );

      expect(originalState.conversations.length).toBe(0);
      expect(newState.conversations.length).toBe(1);
    });
  });
});
