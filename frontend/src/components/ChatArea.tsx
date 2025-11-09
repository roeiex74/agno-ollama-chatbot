import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/data/conversations";

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatArea({ messages, isLoading = false }: ChatAreaProps) {
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
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full gap-3 px-4 py-6">
            <div className="flex max-w-[80%] flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Assistant
              </span>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
