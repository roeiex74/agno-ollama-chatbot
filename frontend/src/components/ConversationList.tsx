import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/data/conversations";
import {
  groupConversationsByDate,
  getNonEmptyGroups,
  GROUP_LABELS,
} from "@/utils/dateGrouping";
import { useState } from "react";
import { useDeleteConversationMutation } from "@/store/api/conversationsApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [deleteConversation] = useDeleteConversationMutation();

  // Group conversations by date
  const groupedConversations = groupConversationsByDate(conversations);
  const nonEmptyGroups = getNonEmptyGroups(groupedConversations);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete).unwrap();
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* New Chat Button - ChatGPT Style */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          className={cn(
            "w-full justify-start gap-3 h-11",
            "bg-transparent hover:bg-accent",
            "border border-border/40",
            "text-sm font-medium",
            "transition-all duration-200",
            "cursor-pointer"
          )}
          variant="outline"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Conversations List with Time-Based Grouping */}
      <ScrollArea className="flex-1 px-2">
        {conversations.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            <MessageSquarePlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">No conversations yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {nonEmptyGroups.map(([groupKey, groupConversations]) => (
              <div key={groupKey} className="space-y-1">
                {/* Section Header */}
                <div className="px-3 py-1.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {GROUP_LABELS[groupKey]}
                  </h3>
                </div>

                {/* Conversations in this group */}
                <div className="space-y-0.5">
                  {groupConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="relative group"
                      onMouseEnter={() => setHoveredId(conversation.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <button
                        onClick={() => onSelectConversation(conversation.id)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2.5 text-left",
                          "transition-all duration-200 cursor-pointer",
                          "flex items-center justify-between gap-2",
                          currentConversationId === conversation.id
                            ? "bg-accent/70 text-accent-foreground"
                            : "hover:bg-accent/40 text-foreground"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {conversation.title}
                          </p>
                        </div>

                        {/* Delete button - always rendered but invisible when not hovering */}
                        <button
                          onClick={(e) => handleDeleteClick(e, conversation.id)}
                          className={cn(
                            "p-1.5 rounded-md",
                            "transition-opacity duration-200",
                            "hover:bg-destructive/10 hover:text-destructive",
                            "cursor-pointer",
                            hoveredId === conversation.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete{" "}
              <span className="font-semibold">
                {conversationToDelete
                  ? conversations.find((c) => c.id === conversationToDelete)
                      ?.title
                  : ""}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
