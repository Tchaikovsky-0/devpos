import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface OpenClawMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: { label: string; action: string }[];
}

interface OpenClawPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: OpenClawMessage[];
  onSendMessage: (message: string) => void;
  suggestions?: string[];
  isThinking?: boolean;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
}

export const OpenClawPanel: React.FC<OpenClawPanelProps> = memo(
  ({
    isOpen,
    onClose,
    messages,
    onSendMessage,
    suggestions = [],
    isThinking = false,
    title = '智能协同',
    subtitle = '让画面、告警、资料和任务在同一条链路里完成理解与执行',
    placeholder = '输入任务、问题或指令',
    className,
  }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
      if (isOpen) {
        window.setTimeout(() => inputRef.current?.focus(), 120);
      }
    }, [isOpen]);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
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

    const handleSubmit = useCallback(
      (event: React.FormEvent) => {
        event.preventDefault();

        if (inputValue.trim() && !isThinking) {
          onSendMessage(inputValue.trim());
          setInputValue('');
        }
      },
      [inputValue, isThinking, onSendMessage],
    );

    const handleSuggestionClick = useCallback(
      (suggestion: string) => {
        if (!isThinking) {
          onSendMessage(suggestion);
        }
      },
      [isThinking, onSendMessage],
    );

    const handleActionClick = useCallback(
      (action: string) => {
        onSendMessage(action);
      },
      [onSendMessage],
    );

    if (!isOpen) return null;

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
