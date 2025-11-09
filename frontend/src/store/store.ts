import { configureStore } from "@reduxjs/toolkit";
import { chatApi } from "./api/chatApi";
import conversationsReducer from "./slices/conversationsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    [chatApi.reducerPath]: chatApi.reducer,
    conversations: conversationsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          "payload.timestamp",
          "payload.createdAt",
          "payload.updatedAt",
          "payload.message.timestamp",
          "payload.messages",
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "conversations.conversations",
          "conversations.conversations.messages",
        ],
      },
    }).concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
