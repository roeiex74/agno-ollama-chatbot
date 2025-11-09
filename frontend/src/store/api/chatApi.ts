import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "@/config/api";
import type {
  ChatRequest,
  ChatResponse,
  HealthResponse,
} from "@/types/api";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  }),
  tagTypes: ["Conversation"],
  endpoints: (builder) => ({
    // Health check endpoint
    getHealth: builder.query<HealthResponse, void>({
      query: () => API_CONFIG.ENDPOINTS.HEALTH,
    }),

    // Non-streaming chat endpoint
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.CHAT,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversation"],
    }),

    // Note: Streaming endpoint will be handled separately
    // via custom hook due to SSE requirements
  }),
});

export const { useGetHealthQuery, useSendMessageMutation } = chatApi;
