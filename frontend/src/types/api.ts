// API Request/Response types matching the backend

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
}

export interface StreamDelta {
  delta: string;
}

export interface StreamComplete {
  done: true;
  response: string;
  conversation_id: string;
}

export type StreamChunk = StreamDelta | StreamComplete;

export interface HealthResponse {
  status: string;
  model?: string;
  backend?: string;
}

// Client-side types
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // Unix timestamp in milliseconds
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds
}
