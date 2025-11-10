import { configureStore } from "@reduxjs/toolkit";
import { chatApi } from "./api/chatApi";
import { conversationsApi } from "./api/conversationsApi";
import conversationsReducer from "./slices/conversationsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    [chatApi.reducerPath]: chatApi.reducer,
    [conversationsApi.reducerPath]: conversationsApi.reducer,
    conversations: conversationsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore RTK Query action paths
        ignoredActions: [
          // Ignore all RTK Query actions
          'conversationsApi/executeQuery/fulfilled',
          'conversationsApi/executeQuery/pending',
          'conversationsApi/executeQuery/rejected',
          'chatApi/executeQuery/fulfilled',
          'chatApi/executeQuery/pending',
          'chatApi/executeQuery/rejected',
        ],
        ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta'],
        ignoredPaths: [
          'conversationsApi',
          'chatApi',
        ],
      },
    }).concat(chatApi.middleware, conversationsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
