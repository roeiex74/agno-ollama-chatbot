import { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import { ChatLayout } from "./components/ChatLayout";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  selectAllConversations,
  selectCurrentConversationId,
  setCurrentConversation,
  addConversation,
  setConversations,
  addMessage,
} from "./store/slices/conversationsSlice";
import { selectIsStreaming } from "./store/slices/uiSlice";
import { useStreamingChat } from "./hooks/useStreamingChat";
import { createNewConversation } from "./data/conversations";
import { useGetConversationsQuery, useLazyGetConversationQuery } from "./store/api/conversationsApi";

function ChatView() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectAllConversations);
  const currentConversationId = useAppSelector(selectCurrentConversationId);
  const isStreaming = useAppSelector(selectIsStreaming);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // Fetch conversations from backend on mount
  const { data: conversationSummaries } = useGetConversationsQuery();

  // Use lazy query to manually trigger conversation fetching
  const [fetchConversation] = useLazyGetConversationQuery();

  // Load conversations into Redux when they arrive from the backend
  useEffect(() => {
    if (conversationSummaries && conversationSummaries.length > 0) {
      // Convert backend format to frontend format (use timestamps instead of Date objects)
      const loadedConversations = conversationSummaries.map((summary) => ({
        id: summary.conversation_id,
        title: summary.title || "New Chat",
        messages: [], // Messages will be loaded on demand when conversation is selected
        createdAt: summary.created_at ? new Date(summary.created_at).getTime() : Date.now(),
        updatedAt: summary.updated_at ? new Date(summary.updated_at).getTime() : Date.now(),
      }));
      dispatch(setConversations(loadedConversations));
    }
  }, [conversationSummaries, dispatch]);

  // Fetch conversation when currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      // Check if this conversation already has messages (newly created)
      const conversation = conversations.find(c => c.id === currentConversationId);

      // Only fetch from backend if conversation has no messages
      // (This prevents clearing messages for newly created conversations)
      if (conversation && conversation.messages.length === 0) {
        setIsLoadingConversation(true);
        // Fetch fresh data from server
        fetchConversation(currentConversationId)
          .unwrap()
          .then((detail) => {
            // Convert backend messages to frontend format (use timestamps)
            const messages = detail.messages.map((msg, index) => ({
              id: `${currentConversationId}-${index}-${Date.now()}`,
              role: msg.role,
              content: msg.content,
              timestamp: Date.now(), // Use number timestamp instead of Date object
            }));

            // Update the conversation with loaded messages
            messages.forEach((message) => {
              dispatch(addMessage({ conversationId: currentConversationId, message }));
            });

            setIsLoadingConversation(false);
          })
          .catch(() => {
            // Conversation doesn't exist on backend yet (newly created)
            setIsLoadingConversation(false);
          });
      } else {
        setIsLoadingConversation(false);
      }
    } else {
      setIsLoadingConversation(false);
    }
  }, [currentConversationId, dispatch, fetchConversation, conversations]); // Added conversations back as dependency

  const { sendStreamingMessage, cancelStream } = useStreamingChat();

  // Sync URL param with Redux state
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      dispatch(setCurrentConversation(conversationId));
    } else if (!conversationId && currentConversationId !== null) {
      // If we're at home (no conversationId in URL) and there's a current conversation, clear it
      dispatch(setCurrentConversation(null));
    }
  }, [conversationId, currentConversationId, dispatch]);

  const handleSelectConversation = (conversationId: string) => {
    dispatch(setCurrentConversation(conversationId));
    navigate(`/chat/${conversationId}`);
  };

  const handleNewConversation = () => {
    // Clear current conversation
    dispatch(setCurrentConversation(null));
    // Navigate to home - use key to force remount if already at home
    navigate("/", { replace: true });
  };

  const handleSendMessage = (messageContent: string) => {
    let conversationId = currentConversationId;

    // If no conversation is selected, create a new one
    if (!conversationId) {
      const newConversation = {
        ...createNewConversation(),
        createdAt: Date.now(), // Use timestamp instead of Date
        updatedAt: Date.now(),
      };
      dispatch(addConversation(newConversation));
      conversationId = newConversation.id;
      // Navigate to the new conversation URL
      navigate(`/chat/${conversationId}`);
    }

    // Send message via streaming
    sendStreamingMessage(messageContent, conversationId);
  };

  return (
    <ChatLayout
      conversations={conversations}
      currentConversationId={currentConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onSendMessage={handleSendMessage}
      onCancelStream={cancelStream}
      isStreaming={isStreaming}
      isLoadingConversation={isLoadingConversation}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatView />} />
      <Route path="/chat/:conversationId" element={<ChatView />} />
    </Routes>
  );
}

export default App;
