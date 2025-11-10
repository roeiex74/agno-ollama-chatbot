import { useState } from "react";
import { Menu, PanelLeft, PanelLeftOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/data/conversations";

interface ChatLayoutProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onSendMessage: (message: string) => void;
  onCancelStream?: () => void;
  isStreaming?: boolean;
}

export function ChatLayout({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onSendMessage,
  onCancelStream,
  isStreaming = false,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );

  const currentMessages = currentConversation?.messages || [];

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId);
    setMobileSheetOpen(false); // Close mobile sheet when selecting conversation
  };

  const handleNewConversation = () => {
    onNewConversation();
    setMobileSheetOpen(false); // Close mobile sheet when creating new conversation
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-card transition-all duration-300 md:block",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && (
          <div className="h-full">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onNewConversation={onNewConversation}
            />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3">
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex cursor-pointer hover:bg-accent transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>

          {/* Mobile sidebar toggle */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden cursor-pointer hover:bg-accent transition-colors">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <ConversationList
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
            </SheetContent>
          </Sheet>

          {/* Current conversation title */}
          <h1 className="flex-1 truncate text-lg font-semibold">
            {currentConversation?.title || "ChatGPT"}
          </h1>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatArea messages={currentMessages} isStreaming={isStreaming} />
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={onSendMessage}
          onCancelStream={onCancelStream}
          isStreaming={isStreaming}
          placeholder="Message..."
        />
      </main>
    </div>
  );
}
