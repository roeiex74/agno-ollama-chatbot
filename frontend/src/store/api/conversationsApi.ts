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
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useDeleteConversationMutation,
  useUpdateConversationTitleMutation,
} = conversationsApi;
