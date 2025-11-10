import { MessageSquarePlus } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/data/conversations";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2 cursor-pointer hover:bg-accent transition-colors"
          variant="outline"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No conversations yet.
              <br />
              Start a new chat!
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  currentConversationId === conversation.id &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {conversation.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
