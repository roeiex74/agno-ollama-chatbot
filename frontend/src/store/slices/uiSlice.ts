import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface UiState {
  sidebarOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  isLoading: false,
  isStreaming: false,
  error: null,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setStreaming,
  setError,
  clearError,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectIsLoading = (state: RootState) => state.ui.isLoading;
export const selectIsStreaming = (state: RootState) => state.ui.isStreaming;
export const selectError = (state: RootState) => state.ui.error;

export default uiSlice.reducer;
