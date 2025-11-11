import type { Conversation, Message } from "@/types/api";

// Re-export types for backwards compatibility
export type { Conversation, Message };

/**
 * Creates a new conversation object with a generated ID
 */
export function createNewConversation(): Omit<Conversation, "createdAt" | "updatedAt"> {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
  };
}
