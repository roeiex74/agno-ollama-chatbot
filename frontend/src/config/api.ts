// API Configuration

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  ENDPOINTS: {
    CHAT: "/chat",
    CHAT_STREAM: "/chat/stream",
    HEALTH: "/healthz",
  },
  TIMEOUT: 30000, // 30 seconds
} as const;
