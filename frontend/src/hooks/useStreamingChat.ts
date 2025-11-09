import { useCallback, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  addMessage,
  updateLastAssistantMessage,
} from "@/store/slices/conversationsSlice";
import { setStreaming, setError } from "@/store/slices/uiSlice";
import { API_CONFIG } from "@/config/api";
import type { Message, StreamChunk } from "@/types/api";

export function useStreamingChat() {
  const dispatch = useAppDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);
  const accumulatedContentRef = useRef<string>("");

  const sendStreamingMessage = useCallback(
    async (message: string, conversationId: string) => {
      // Add user message immediately
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      dispatch(addMessage({ conversationId, message: userMessage }));

      // Create placeholder assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      dispatch(addMessage({ conversationId, message: assistantMessage }));

      // Reset accumulated content
      accumulatedContentRef.current = "";

      // Set streaming state
      dispatch(setStreaming(true));
      dispatch(setError(null));

      try {
        // Close any existing EventSource
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Create URL with query parameters
        const url = new URL(
          API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CHAT_STREAM
        );
        url.searchParams.append("message", message);
        url.searchParams.append("conversation_id", conversationId);

        // Create EventSource for SSE
        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const chunk: StreamChunk = JSON.parse(event.data);

            if ("done" in chunk && chunk.done) {
              // Stream complete
              dispatch(
                updateLastAssistantMessage({
                  conversationId,
                  content: chunk.response,
                })
              );
              dispatch(setStreaming(false));
              eventSource.close();
              eventSourceRef.current = null;
            } else if ("delta" in chunk) {
              // Accumulate delta
              accumulatedContentRef.current += chunk.delta;
              dispatch(
                updateLastAssistantMessage({
                  conversationId,
                  content: accumulatedContentRef.current,
                })
              );
            }
          } catch (error) {
            console.error("Error parsing stream chunk:", error);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          dispatch(setError("Streaming error occurred"));
          dispatch(setStreaming(false));
          eventSource.close();
          eventSourceRef.current = null;
        };
      } catch (error) {
        console.error("Error setting up stream:", error);
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to start streaming"
          )
        );
        dispatch(setStreaming(false));
      }
    },
    [dispatch]
  );

  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      dispatch(setStreaming(false));
    }
  }, [dispatch]);

  return { sendStreamingMessage, cancelStream };
}
