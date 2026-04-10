import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, WifiOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useOpenClawContext } from '@/store/contexts/OpenClawContext';
import {
  useCheckOpenClawHealthQuery,
  useSendChatMessageMutation,
  type ChatAction,
} from '@/store/api/openclawApi';

// =============================================================================
// Types
// =============================================================================

export interface OpenClawMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: Array<{ label: string; action: string }>;
}

interface OpenClawPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** 外部注入的快捷建议（空消息态显示） */
  suggestions?: string[];
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function mapChatActions(
  actions?: ChatAction[],
): Array<{ label: string; action: string }> | undefined {
  if (!actions || actions.length === 0) return undefined;
  return actions.map((a) => ({
    label: a.label,
    action: typeof a.payload === 'string' ? a.payload : a.label,
  }));
}

// =============================================================================
// Component
// =============================================================================

export const OpenClawPanel: React.FC<OpenClawPanelProps> = memo(
  ({
    isOpen,
    onClose,
    suggestions = [],
    title = 'AI 助手',
    subtitle = '让画面、告警、资料和任务在同一条链路里完成理解与执行',
    placeholder = '输入任务、问题或指令',
    className,
  }) => {
    // ── 本地消息列表 ──
    const [messages, setMessages] = useState<OpenClawMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [conversationId, setConversationId] = useState<string | undefined>();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── OpenClaw 上下文 ──
    const { currentModule, currentObject } = useOpenClawContext();

    // ── RTK Query ──
    const { error: healthError, isLoading: healthLoading } = useCheckOpenClawHealthQuery(
      undefined,
      { pollingInterval: 30_000 },
    );
    const [sendChatMessage, { isLoading: isSending }] = useSendChatMessageMutation();

    const isServiceUnavailable = !!healthError;
    const isThinking = isSending;

    // ── 自动滚动 ──
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── 自动聚焦 ──
    useEffect(() => {
      if (isOpen) {
        window.setTimeout(() => inputRef.current?.focus(), 120);
      }
    }, [isOpen]);

    // ── 快捷键 ──
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent): void => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          if (isOpen) {
            onClose();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // ── 发送消息 ──
    const handleSendMessage = useCallback(
      async (text: string) => {
        if (!text.trim() || isSending) return;

        // 立即追加用户消息
        const userMsg: OpenClawMessage = {
          id: `${Date.now()}-user`,
          role: 'user',
          content: text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);

        try {
          const result = await sendChatMessage({
            message: text,
            conversationId,
            context: {
              module: currentModule,
              objectType: currentObject?.type ?? undefined,
              objectId: currentObject?.id ?? undefined,
            },
          }).unwrap();

          const data = result.data;
          if (data) {
            const assistantMsg: OpenClawMessage = {
              id: data.id || `${Date.now()}-assistant`,
              role: 'assistant',
              content: data.content,
              timestamp: new Date(),
              suggestions: data.suggestions,
              actions: mapChatActions(data.actions),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            // 若后端返回了 conversationId，保存用于后续轮次
            const raw = result as unknown as Record<string, unknown>;
            if (raw.conversationId) {
              setConversationId(raw.conversationId as string);
            }
          }
        } catch {
          // 网络 / 服务不可用时追加一条错误提示
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-error`,
              role: 'assistant',
              content: 'AI 服务暂时无法响应，请稍后重试。',
              timestamp: new Date(),
            },
          ]);
        }
      },
      [isSending, sendChatMessage, conversationId, currentModule, currentObject],
    );

    const handleSubmit = useCallback(
      (event: React.FormEvent) => {
        event.preventDefault();
        if (inputValue.trim() && !isThinking) {
          void handleSendMessage(inputValue.trim());
          setInputValue('');
        }
      },
      [inputValue, isThinking, handleSendMessage],
    );

    const handleSuggestionClick = useCallback(
      (suggestion: string) => {
        if (!isThinking) {
          void handleSendMessage(suggestion);
        }
      },
      [isThinking, handleSendMessage],
    );

    const handleActionClick = useCallback(
      (action: string) => {
        void handleSendMessage(action);
      },
      [handleSendMessage],
    );

    if (!isOpen) return null;

    // ── 服务不可用降级 ──
    if (isServiceUnavailable && !healthLoading) {
      return (
        <div
          className={cn(
            'surface-panel fixed inset-y-4 right-4 z-50 flex w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[30px] animate-enter',
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-surface text-text-tertiary shadow-panel">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary">{title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <WifiOff className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">AI 服务连接中…</p>
              <p className="mt-1 text-xs text-text-tertiary">
                OpenClaw 服务暂不可用，请稍后重试
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ── 正常渲染 ──
    return (
      <div
        className={cn(
          'surface-panel fixed inset-y-4 right-4 z-50 flex w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[30px] animate-enter',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-panel">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <p className="text-xs text-text-secondary">{subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {messages.length === 0 && (
            <div className="rounded-[24px] border border-border bg-bg-surface p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-text-primary">现在可以直接交给它一个任务</p>
              <p className="mt-2 text-sm text-text-secondary">它会先理解当前上下文，再串联画面、资料、告警和执行动作。</p>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-[22px] px-4 py-3',
                    message.role === 'user'
                      ? 'bg-accent text-white shadow-panel'
                      : 'border border-border bg-bg-surface text-text-primary',
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  <p
                    className={cn(
                      'mt-2 text-xs',
                      message.role === 'user' ? 'text-white/70' : 'text-text-tertiary',
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="rounded-full bg-bg-light px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => handleActionClick(action.action)}
                          className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="rounded-[22px] border border-border bg-bg-surface px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span>正在整理上下文与建议…</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && suggestions.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">快捷入口</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-2 rounded-[20px] border border-border bg-bg-surface px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={placeholder}
              disabled={isThinking}
              className="h-10 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isThinking}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-text-tertiary">
            使用 <kbd className="rounded-md bg-bg-light px-1.5 py-0.5 text-text-secondary">Cmd+K</kbd> 打开或关闭
          </p>
        </form>
      </div>
    );
  },
);

OpenClawPanel.displayName = 'OpenClawPanel';

export default OpenClawPanel;
