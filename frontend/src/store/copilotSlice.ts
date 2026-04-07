// =============================================================================
// Copilot Redux Slice - State management for AI Copilot
// =============================================================================

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CopilotMessage } from '@/types/copilot';
import {
  copilotAPI,
  chatStreamFetch,
  type CopilotChatRequest,
  type CopilotSession,
} from '@/api/v1/copilot';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface CopilotContext {
  page?: string;
  entity_id?: number;
  entity_type?: string;
}

interface CopilotState {
  messages: CopilotMessage[];
  currentSessionId: string | null;
  sessions: CopilotSession[];
  isLoading: boolean;
  isStreaming: boolean;
  isOpen: boolean;
  context: CopilotContext | null;
  sessionsLoaded: boolean;
}

const initialState: CopilotState = {
  messages: [],
  currentSessionId: null,
  sessions: [],
  isLoading: false,
  isStreaming: false,
  isOpen: false,
  context: null,
  sessionsLoaded: false,
};

// ---------------------------------------------------------------------------
// Async Thunks
// ---------------------------------------------------------------------------

export const fetchSessions = createAsyncThunk(
  'copilot/fetchSessions',
  async () => {
    const resp = await copilotAPI.listSessions();
    return resp.data?.sessions ?? [];
  },
);

export const deleteSession = createAsyncThunk(
  'copilot/deleteSession',
  async (sessionId: string) => {
    await copilotAPI.deleteSession(sessionId);
    return sessionId;
  },
);

export const sendMessage = createAsyncThunk(
  'copilot/sendMessage',
  async (
    payload: { message: string; useStream?: boolean },
    { getState, dispatch },
  ) => {
    const state = (getState() as { copilot: CopilotState }).copilot;

    const request: CopilotChatRequest = {
      message: payload.message,
      session_id: state.currentSessionId ?? undefined,
      context: state.context ?? undefined,
    };

    if (payload.useStream !== false) {
      // Streaming mode
      dispatch(copilotSlice.actions._setStreaming(true));

      const streamMsgId = `msg-${Date.now()}-stream`;
      dispatch(
        copilotSlice.actions._addMessage({
          id: streamMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isLoading: true,
        }),
      );

      return new Promise<{ sessionId: string; suggestions: string[] }>(
        (resolve, reject) => {
          chatStreamFetch(request, {
            onSessionId: (sid) => {
              dispatch(copilotSlice.actions._setSessionId(sid));
            },
            onContent: (chunk) => {
              dispatch(
                copilotSlice.actions._appendStreamContent({
                  id: streamMsgId,
                  content: chunk,
                }),
              );
            },
            onDone: (suggestions) => {
              dispatch(
                copilotSlice.actions._finalizeStreamMessage(streamMsgId),
              );
              dispatch(copilotSlice.actions._setStreaming(false));
              resolve({
                sessionId: state.currentSessionId ?? '',
                suggestions,
              });
            },
            onError: (err) => {
              dispatch(
                copilotSlice.actions._setStreamError({
                  id: streamMsgId,
                  error: err.message,
                }),
              );
              dispatch(copilotSlice.actions._setStreaming(false));
              reject(err);
            },
          });
        },
      );
    } else {
      // Non-streaming mode
      const resp = await copilotAPI.chat(request);
      const data = resp.data;
      return {
        message: data.message,
        sessionId: data.session_id,
        suggestions: data.suggestions ?? [],
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

// Internal message type with string timestamp for Redux serialization
interface SerializableMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestions?: string[];
  isLoading?: boolean;
}

const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    toggleCopilot(state) {
      state.isOpen = !state.isOpen;
    },
    openCopilot(state) {
      state.isOpen = true;
    },
    closeCopilot(state) {
      state.isOpen = false;
    },
    setContext(state, action: PayloadAction<CopilotContext | null>) {
      state.context = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
      state.currentSessionId = null;
    },
    addUserMessage(state, action: PayloadAction<string>) {
      const msg: CopilotMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: action.payload,
        timestamp: new Date(),
      };
      state.messages.push(msg);
    },

    // Internal actions for streaming
    _setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    _setSessionId(state, action: PayloadAction<string>) {
      state.currentSessionId = action.payload;
    },
    _addMessage(state, action: PayloadAction<SerializableMessage>) {
      const m = action.payload;
      state.messages.push({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        isLoading: m.isLoading,
      });
    },
    _appendStreamContent(
      state,
      action: PayloadAction<{ id: string; content: string }>,
    ) {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content += action.payload.content;
        msg.isLoading = false;
      }
    },
    _finalizeStreamMessage(state, action: PayloadAction<string>) {
      const msg = state.messages.find((m) => m.id === action.payload);
      if (msg) {
        msg.isLoading = false;
      }
    },
    _setStreamError(
      state,
      action: PayloadAction<{ id: string; error: string }>,
    ) {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content = `抱歉，发生了错误：${action.payload.error}`;
        msg.isLoading = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as {
          message?: string;
          sessionId?: string;
          suggestions?: string[];
        };
        if (payload.sessionId) {
          state.currentSessionId = payload.sessionId;
        }
        // For non-streaming, add the assistant message
        if (payload.message) {
          state.messages.push({
            id: `msg-${Date.now()}-reply`,
            role: 'assistant',
            content: payload.message,
            timestamp: new Date(),
            suggestions: payload.suggestions,
          });
        }
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isLoading = false;
      })
      // fetchSessions
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
        state.sessionsLoaded = true;
      })
      // deleteSession
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(
          (s) => s.id !== action.payload,
        );
        if (state.currentSessionId === action.payload) {
          state.currentSessionId = null;
          state.messages = [];
        }
      });
  },
});

export const {
  toggleCopilot,
  openCopilot,
  closeCopilot,
  setContext,
  clearMessages,
  addUserMessage,
} = copilotSlice.actions;

export default copilotSlice.reducer;
