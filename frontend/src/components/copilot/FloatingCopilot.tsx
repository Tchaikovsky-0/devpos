import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageSquare,
  Trash2,
  Plus,
} from 'lucide-react';
import type { CopilotContext, CopilotMessage } from '@/types/copilot';
import type { RootState, AppDispatch } from '@/store';
import {
  toggleCopilot,
  openCopilot,
  closeCopilot,
  setContext,
  clearMessages,
  addUserMessage,
  sendMessage,
  fetchSessions,
  deleteSession,
} from '@/store/copilotSlice';
import type { CopilotSession } from '@/api/v1/copilot';

// ---------------------------------------------------------------------------
// FloatingCopilot Component
// ---------------------------------------------------------------------------

export const FloatingCopilot: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    messages,
    isOpen,
    isLoading,
    isStreaming,
    sessions,
    sessionsLoaded,
    context,
  } = useSelector((state: RootState) => state.copilot);

  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(toggleCopilot());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  // Auto-set context based on current route
  useEffect(() => {
    const path = location.pathname;
    let page = '';
    if (path.includes('/alerts')) page = 'alerts';
    else if (path.includes('/dashboard') || path === '/') page = 'dashboard';
    else if (path.includes('/video') || path.includes('/stream')) page = 'video';
    else if (path.includes('/media')) page = 'media';

    if (page) {
      dispatch(setContext({ page }));
    }
  }, [location.pathname, dispatch]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load sessions when panel opens
  useEffect(() => {
    if (isOpen && !sessionsLoaded) {
      dispatch(fetchSessions());
    }
  }, [isOpen, sessionsLoaded, dispatch]);

  // Handle send
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || isStreaming) return;

    dispatch(addUserMessage(trimmed));
    setInputValue('');
    dispatch(sendMessage({ message: trimmed, useStream: true }));
  }, [inputValue, isLoading, isStreaming, dispatch]);

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons
  const handleQuickAction = (text: string): void => {
    dispatch(addUserMessage(text));
    dispatch(sendMessage({ message: text, useStream: true }));
  };

  // New conversation
  const handleNewConversation = (): void => {
    dispatch(clearMessages());
    setShowSessions(false);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    dispatch(deleteSession(sessionId));
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className={cn(
              'fixed right-6 bottom-6 z-[700]',
              'w-14 h-14 rounded-full',
              'bg-gradient-to-br from-blue-500 to-indigo-600',
              'flex items-center justify-center',
              'shadow-lg shadow-glow/30',
              'hover:shadow-xl hover:shadow-glow/40',
              'transition-shadow duration-300',
            )}
            onClick={() => dispatch(openCopilot())}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bot className="w-6 h-6 text-text-primary" />
            <span className="absolute inset-0 rounded-full bg-accent-muted animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              'fixed right-6 bottom-6 z-[700]',
              'flex flex-col',
              isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]',
              'bg-surface/95 backdrop-blur-xl',
              'border border-border-strong rounded-2xl',
              'shadow-2xl shadow-black/50',
              'overflow-hidden',
            )}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">OpenClaw AI</h3>
                  <p className="text-xs text-text-tertiary">
                    {isStreaming ? '回复中...' : '智能助手'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
                  onClick={() => setShowSessions(!showSessions)}
                  title="会话历史"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
                  onClick={handleNewConversation}
                  title="新对话"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minimize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
                  onClick={() => dispatch(closeCopilot())}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Sessions sidebar overlay */}
                {showSessions && (
                  <SessionsSidebar
                    sessions={sessions}
                    onClose={() => setShowSessions(false)}
                    onDelete={handleDeleteSession}
                  />
                )}

                {/* Context-Aware Tip */}
                {context?.page && <ContextTip page={context.page} />}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <WelcomeMessage onQuickAction={handleQuickAction} />
                  ) : (
                    messages.map((message) => (
                      <ChatMessageBubble key={message.id} message={message} />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="输入消息... (Ctrl+K 快捷键)"
                        rows={1}
                        className={cn(
                          'w-full px-3 py-2 rounded-xl text-sm',
                          'bg-bg-hover text-text-secondary placeholder:text-text-disabled',
                          'border border-border',
                          'focus:outline-none focus:border-accent',
                          'resize-none',
                          'transition-colors duration-150',
                        )}
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                      />
                    </div>
                    <button
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        'bg-accent text-text-primary',
                        'hover:bg-accent-strong',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'transition-colors duration-150',
                      )}
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isLoading || isStreaming}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ContextTip: React.FC<{ page: string }> = ({ page }) => {
  const tips: Record<string, string> = {
    alerts: '你正在查看告警页面，可以问我关于告警分析的问题',
    dashboard: '你正在监控大屏，我可以帮你分析当前监控状况',
    video: '你正在查看视频监控，需要我帮你分析画面吗？',
    media: '你正在媒体库，我可以帮你总结异常情况',
  };
  const tip = tips[page];
  if (!tip) return null;

  return (
    <div className="px-4 py-2 bg-accent-muted border-b border-accent">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
        <p className="text-xs text-accent">{tip}</p>
      </div>
    </div>
  );
};

interface WelcomeMessageProps {
  onQuickAction: (text: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onQuickAction }) => (
  <div className="text-center py-8">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
      <Bot className="w-6 h-6 text-text-primary" />
    </div>
    <h4 className="text-sm font-medium text-text-secondary mb-1">
      OpenClaw AI 助手
    </h4>
    <p className="text-xs text-text-tertiary max-w-[200px] mx-auto">
      我可以帮你分析监控数据、生成报告、回答关于设备状态的问题
    </p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {[
        { label: '生成今日报告', cmd: '/report 生成今日巡检报告' },
        { label: '分析异常趋势', cmd: '/analyze 分析最近告警趋势' },
        { label: '查看设备状态', cmd: '查看当前设备运行状态' },
      ].map((item) => (
        <button
          key={item.label}
          className="px-3 py-1.5 rounded-lg text-xs bg-bg-hover text-text-secondary hover:bg-bg-muted transition-colors"
          onClick={() => onQuickAction(item.cmd)}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

const ChatMessageBubble: React.FC<{ message: CopilotMessage }> = ({
  message,
}) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          isUser
            ? 'bg-bg-muted'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600',
        )}
      >
        {isUser ? (
          <span className="text-xs text-text-tertiary">我</span>
        ) : (
          <Bot className="w-4 h-4 text-text-primary" />
        )}
      </div>

      <div className={cn('max-w-[75%]', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block px-3 py-2 rounded-xl text-sm whitespace-pre-wrap',
            isUser
              ? 'bg-accent text-text-primary'
              : 'bg-bg-hover text-text-secondary border border-border',
          )}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          ) : (
            message.content
          )}
        </div>
        <p className="text-[10px] text-text-tertiary mt-1">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
};

interface SessionsSidebarProps {
  sessions: CopilotSession[];
  onClose: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const SessionsSidebar: React.FC<SessionsSidebarProps> = ({
  sessions,
  onClose,
  onDelete,
}) => (
  <div className="absolute inset-0 top-[52px] bg-surface/98 backdrop-blur-sm z-10 flex flex-col">
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <span className="text-sm font-medium text-text-secondary">会话历史</span>
      <button
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        onClick={onClose}
      >
        关闭
      </button>
    </div>
    <div className="flex-1 overflow-y-auto">
      {sessions.length === 0 ? (
        <p className="text-center text-xs text-text-tertiary py-8">
          暂无会话记录
        </p>
      ) : (
        sessions.map((sess) => (
          <div
            key={sess.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover border-b border-border cursor-pointer transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary truncate">
                {sess.title || '新对话'}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {sess.last_message}
              </p>
            </div>
            <button
              className="ml-2 p-1 text-text-tertiary hover:text-red-400 transition-colors shrink-0"
              onClick={(e) => onDelete(sess.id, e)}
              title="删除会话"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Legacy hook (kept for backwards compatibility)
// ---------------------------------------------------------------------------

export const useFloatingCopilot = () => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((s: RootState) => s.copilot);

  return {
    isOpen: state.isOpen,
    toggle: () => dispatch(toggleCopilot()),
    open: () => dispatch(openCopilot()),
    close: () => dispatch(closeCopilot()),
    messages: state.messages,
    sendMessage: (content: string) => {
      dispatch(addUserMessage(content));
      dispatch(sendMessage({ message: content, useStream: true }));
    },
    context: state.context,
    setCurrentContext: (ctx: CopilotContext | { type: 'none'; data: null }) => {
      if (ctx.type === 'none') {
        dispatch(setContext(null));
      } else {
        dispatch(
          setContext({
            page: ctx.type,
          }),
        );
      }
    },
  };
};

export default FloatingCopilot;
