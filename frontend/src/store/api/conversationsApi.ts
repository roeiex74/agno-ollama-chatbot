import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";

export interface ConversationSummary {
  conversation_id: string;
  title: string | null;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ConversationDetail {
  conversation_id: string;
  title: string | null;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  created_at: string | null;
  updated_at: string | null;
}

export interface UpdateTitleRequest {
  title: string;
}

export interface GenerateTitleRequest {
  message: string;
}

export interface GenerateTitleResponse {
  title: string;
}

export const conversationsApi = createApi({
  reducerPath: "conversationsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_CONFIG.BASE_URL }),
  tagTypes: ["Conversations", "Conversation"],
  endpoints: (builder) => ({
    // List all conversations
    getConversations: builder.query<ConversationSummary[], void>({
      query: () => "/conversations",
      providesTags: ["Conversations"],
    }),

    // Get single conversation with full history
    getConversation: builder.query<ConversationDetail, string>({
      query: (conversationId) => `/conversations/${conversationId}`,
      providesTags: (_result, _error, conversationId) => [
        { type: "Conversation", id: conversationId },
      ],
    }),

    // Delete conversation
    deleteConversation: builder.mutation<{ status: string; conversation_id: string }, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Conversations"],
    }),

    // Update conversation title
    updateConversationTitle: builder.mutation<
      { status: string; conversation_id: string; title: string },
      { conversationId: string; title: string }
    >({
      query: ({ conversationId, title }) => ({
        url: `/conversations/${conversationId}/title`,
        method: "PATCH",
        body: { title },
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        "Conversations",
        { type: "Conversation", id: conversationId },
      ],
    }),

    // Generate conversation title from message
    generateTitle: builder.mutation<GenerateTitleResponse, GenerateTitleRequest>({
      query: (request) => ({
        url: "/generate-title",
        method: "POST",
        body: request,
      }),
    }),
  }),
});

// Helper function to create streaming chat request
// Note: This is used by useStreamingChat hook, not called directly as a mutation
// because RTK Query doesn't natively support SSE streaming.
// This function is part of the Redux API layer to maintain centralized API configuration.
export const createStreamingChatRequest = (
  message: string,
  conversationId: string,
  signal?: AbortSignal
) => {
  return fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_STREAM}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
    signal,
  });
};

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useDeleteConversationMutation,
  useUpdateConversationTitleMutation,
  useGenerateTitleMutation,
} = conversationsApi;
