import { ChatLayout } from "./components/ChatLayout";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  selectAllConversations,
  selectCurrentConversationId,
  setCurrentConversation,
  addConversation,
} from "./store/slices/conversationsSlice";
import { selectIsLoading, selectIsStreaming } from "./store/slices/uiSlice";
import { useStreamingChat } from "./hooks/useStreamingChat";
import { createNewConversation } from "./data/conversations";

function App() {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectAllConversations);
  const currentConversationId = useAppSelector(selectCurrentConversationId);
  const isLoading = useAppSelector(selectIsLoading);
  const isStreaming = useAppSelector(selectIsStreaming);

  const { sendStreamingMessage } = useStreamingChat();

  const handleSelectConversation = (conversationId: string) => {
    dispatch(setCurrentConversation(conversationId));
  };

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    dispatch(addConversation(newConversation));
  };

  const handleSendMessage = (messageContent: string) => {
    let conversationId = currentConversationId;

    // If no conversation is selected, create a new one
    if (!conversationId) {
      const newConversation = createNewConversation();
      dispatch(addConversation(newConversation));
      conversationId = newConversation.id;
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
      isLoading={isLoading || isStreaming}
    />
  );
}

export default App;
