// =============================================================================
// Copilot API - AI Chat, Sessions, Analysis
// =============================================================================

import { apiClient } from '../client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CopilotChatRequest {
  message: string;
  session_id?: string;
  context?: {
    page?: string;
    entity_id?: number;
    entity_type?: string;
  };
}

export interface CopilotChatResponse {
  code: number;
  data: {
    message: string;
    session_id: string;
    suggestions?: string[];
    source?: string;
  };
}

export interface CopilotSession {
  id: string;
  title: string;
  last_message: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface CopilotSessionDetail {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeRequest {
  type: string;
  data: Record<string, unknown>;
}

export interface AnalyzeResponse {
  code: number;
  data: {
    result: Record<string, unknown>;
    confidence: number;
    recommendations: string[];
    severity: string;
  };
}

export interface GenerateReportRequest {
  type: string;
  period?: string;
}

export interface GenerateReportResponse {
  code: number;
  data: {
    content: string;
    format: string;
  };
}

// ---------------------------------------------------------------------------
// SSE Stream helper
// ---------------------------------------------------------------------------

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8094') + '/api/v1';

/**
 * Initiates an SSE streaming chat request via fetch + ReadableStream.
 * Returns an object with an `onChunk` callback and an `abort` method.
 */
export function chatStreamFetch(
  data: CopilotChatRequest,
  callbacks: {
    onSessionId?: (sessionId: string) => void;
    onContent?: (chunk: string) => void;
    onDone?: (suggestions: string[]) => void;
    onError?: (error: Error) => void;
  },
): { abort: () => void } {
  const controller = new AbortController();
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr) as {
              type: string;
              content?: string;
              session_id?: string;
              suggestions?: string[];
            };

            switch (parsed.type) {
              case 'session':
                callbacks.onSessionId?.(parsed.session_id ?? '');
                break;
              case 'content':
                callbacks.onContent?.(parsed.content ?? '');
                break;
              case 'done':
                callbacks.onDone?.(parsed.suggestions ?? []);
                break;
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      // If we exit the loop without a 'done' event, still call onDone
      callbacks.onDone?.([]);
    })
    .catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    });

  return { abort: () => controller.abort() };
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

export const copilotAPI = {
  /** Send a chat message (non-streaming) */
  chat: (data: CopilotChatRequest): Promise<CopilotChatResponse> =>
    apiClient.post('/ai/chat', data),

  /** List all chat sessions */
  listSessions: (): Promise<{ code: number; data: { sessions: CopilotSession[] } }> =>
    apiClient.get('/ai/sessions'),

  /** Get a single session detail */
  getSession: (id: string): Promise<{ code: number; data: CopilotSessionDetail }> =>
    apiClient.get(`/ai/sessions/${id}`),

  /** Delete a session */
  deleteSession: (id: string): Promise<{ code: number; data: { message: string } }> =>
    apiClient.delete(`/ai/sessions/${id}`),

  /** AI analysis */
  analyze: (data: AnalyzeRequest): Promise<AnalyzeResponse> =>
    apiClient.post('/ai/analyze', data),

  /** Generate report */
  generateReport: (data: GenerateReportRequest): Promise<GenerateReportResponse> =>
    apiClient.post('/ai/generate-report', data),
};
