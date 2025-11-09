import { useState } from "react";
import { ChatLayout } from "./components/ChatLayout";
import {
  dummyConversations,
  createNewConversation,
  getDummyResponse,
  type Conversation,
  type Message,
} from "./data/conversations";

function App() {
  const [conversations, setConversations] =
    useState<Conversation[]>(dummyConversations);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(dummyConversations[0]?.id || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const handleSendMessage = (messageContent: string) => {
    if (!currentConversationId) {
      // If no conversation is selected, create a new one
      handleNewConversation();
      // Wait for state to update, then send message
      setTimeout(() => handleSendMessage(messageContent), 0);
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    // Add user message to conversation
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, userMessage];

          // Update conversation title if it's the first message
          const updatedTitle =
            conv.messages.length === 0
              ? messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : "")
              : conv.title;

          return {
            ...conv,
            title: updatedTitle,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );

    // Simulate loading and generate dummy response
    setIsLoading(true);
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: getDummyResponse(messageContent),
        timestamp: new Date(),
      };

      // Add assistant message to conversation
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        })
      );

      setIsLoading(false);
    }, 1000); // Simulate 1 second delay
  };

  return (
    <ChatLayout
      conversations={conversations}
      currentConversationId={currentConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );
}

export default App;
