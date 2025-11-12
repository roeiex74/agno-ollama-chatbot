import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/data/conversations";

interface ChatAreaProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function ChatArea({ messages, isStreaming = false }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-6">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold">Start a conversation</h2>
        <p className="max-w-md text-muted-foreground">
          Send a message to begin chatting. You can ask questions, get help with
          code, or just have a conversation.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full">
      <div className="mx-auto max-w-3xl">
        {messages.map((message, index) => {
          // Check if this is the last assistant message and we're streaming
          const isLastMessage = index === messages.length - 1;
          const isAssistantMessage = message.role === "assistant";
          const isStreamingThisMessage =
            isStreaming && isLastMessage && isAssistantMessage;

          return (
            <ChatMessage
              key={message.id}
              messageId={message.id}
              role={message.role}
              content={message.content}
              timestamp={new Date(message.timestamp)}
              isStreaming={isStreamingThisMessage}
            />
          );
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
