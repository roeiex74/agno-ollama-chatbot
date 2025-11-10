import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  updateLastAssistantMessage,
  updateConversationTitle,
  selectAllConversations,
} from "@/store/slices/conversationsSlice";
import { setStreaming, setError } from "@/store/slices/uiSlice";
import { API_CONFIG } from "@/config/api";
import type { Message, StreamChunk } from "@/types/api";
import { useUpdateConversationTitleMutation } from "@/store/api/conversationsApi";

export function useStreamingChat() {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectAllConversations);
  const [updateTitle] = useUpdateConversationTitleMutation();
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedContentRef = useRef<string>("");

  const sendStreamingMessage = useCallback(
    async (message: string, conversationId: string) => {
      // Add user message immediately
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: Date.now(), // Use number timestamp instead of Date object
      };

      dispatch(addMessage({ conversationId, message: userMessage }));

      // Create placeholder assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: "",
        timestamp: Date.now(), // Use number timestamp instead of Date object
      };

      dispatch(addMessage({ conversationId, message: assistantMessage }));

      // Reset accumulated content
      accumulatedContentRef.current = "";

      // Set streaming state
      dispatch(setStreaming(true));
      dispatch(setError(null));

      try {
        // Cancel any existing stream
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new AbortController
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Make POST request with fetch
        const response = await fetch(
          API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CHAT_STREAM,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message,
              conversation_id: conversationId,
            }),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            dispatch(setStreaming(false));
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });

          // Split by lines (SSE format)
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6); // Remove "data: " prefix

              try {
                const parsed: StreamChunk = JSON.parse(data);

                if ("done" in parsed && parsed.done) {
                  // Stream complete
                  if (parsed.response) {
                    dispatch(
                      updateLastAssistantMessage({
                        conversationId,
                        content: parsed.response,
                      })
                    );
                  }

                  // Check if this is the first message and update title
                  const conversation = conversations.find((c) => c.id === conversationId);
                  if (conversation && conversation.title === "New Chat") {
                    // Generate title from first user message
                    const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");

                    // Update title in backend
                    updateTitle({ conversationId, title })
                      .unwrap()
                      .then(() => {
                        // Update title in Redux
                        dispatch(updateConversationTitle({ conversationId, title }));
                      })
                      .catch((error) => {
                        console.error("Failed to update conversation title:", error);
                      });
                  }

                  dispatch(setStreaming(false));
                  abortControllerRef.current = null;
                } else if ("delta" in parsed) {
                  // Accumulate delta
                  accumulatedContentRef.current += parsed.delta;
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
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Stream cancelled by user");
        } else {
          console.error("Error setting up stream:", error);
          dispatch(
            setError(
              error instanceof Error ? error.message : "Failed to start streaming"
            )
          );
        }
        dispatch(setStreaming(false));
      }
    },
    [dispatch, conversations, updateTitle]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      dispatch(setStreaming(false));
    }
  }, [dispatch]);

  return { sendStreamingMessage, cancelStream };
}
