// =============================================================================
// ChatMessage - Copilot 聊天消息组件
// 支持 Markdown 渲染、代码高亮、建议按钮
// =============================================================================

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Clock, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CopilotMessage, CopilotAction } from '@/types/copilot';

interface ChatMessageProps {
  message: CopilotMessage;
  onSuggestionClick?: (suggestion: string) => void;
  onActionClick?: (action: CopilotAction) => void;
  index?: number;
}

const messageEnter = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

export const ChatMessage: React.FC<ChatMessageProps> = memo(
  ({ message, onSuggestionClick, onActionClick, index = 0 }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    const handleSuggestionClick = useCallback(
      (suggestion: string) => {
        onSuggestionClick?.(suggestion);
      },
      [onSuggestionClick],
    );

    const handleActionClick = useCallback(
      (action: CopilotAction) => {
        onActionClick?.(action);
      },
      [onActionClick],
    );

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    // 简单的 Markdown 解析
    const renderContent = (content: string): React.ReactNode => {
      const lines = content.split('\n');
      const elements: React.ReactNode[] = [];
      let inList = false;
      let listItems: React.ReactNode[] = [];

      lines.forEach((line, i) => {
        // 标题
        if (line.startsWith('**') && line.endsWith('**') && !line.includes(':')) {
          if (inList) {
            elements.push(<ul key={`list-${i}`} className="list-disc pl-4 space-y-1 my-2">{listItems}</ul>);
            listItems = [];
            inList = false;
          }
          elements.push(
            <h4 key={i} className="font-semibold text-text-primary mt-3 mb-2">
              {line.replace(/\*\*/g, '')}
            </h4>,
          );
          return;
        }

        // 列表项
        if (line.match(/^\d+\./)) {
          const match = line.match(/^(\d+)\.\s+(.+)$/);
          if (match) {
            const [, , text] = match;
            const boldMatch = text.match(/\*\*(.+?)\*\*\s*-\s*(.+)/);
            if (boldMatch) {
              listItems.push(
                <li key={i} className="text-text-secondary">
                  <span className="font-medium text-text-primary">{boldMatch[1]}</span>
                  {' - '}{boldMatch[2]}
                </li>,
              );
            } else {
              listItems.push(<li key={i} className="text-text-secondary">{text}</li>);
            }
            inList = true;
            return;
          }
        }

        // 子列表项
        if (line.startsWith('   - ')) {
          listItems.push(
            <li key={i} className="text-text-tertiary text-xs ml-4">
              {line.replace(/^\s+-\s*/, '')}
            </li>,
          );
          return;
        }

        // 结束列表
        if (inList && !line.match(/^\s/) && line.trim() !== '') {
          elements.push(<ul key={`list-${i}`} className="list-disc pl-4 space-y-1 my-2">{listItems}</ul>);
          listItems = [];
          inList = false;
        }

        // 普通段落
        if (line.trim() !== '') {
          const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          elements.push(
            <p
              key={i}
              className="text-sm leading-relaxed text-text-secondary"
              dangerouslySetInnerHTML={{ __html: boldLine }}
            />,
          );
        }
      });

      if (inList) {
        elements.push(<ul key="list-final" className="list-disc pl-4 space-y-1 my-2">{listItems}</ul>);
      }

      return <>{elements}</>;
    };

    if (isSystem) {
      return (
        <motion.div
          initial={messageEnter.initial}
          animate={messageEnter.animate}
          transition={{ ...messageEnter.transition, delay: index * 0.05 }}
          className="flex justify-center my-4"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-raised/50 border border-border/50">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-text-tertiary">{message.content}</span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={messageEnter.initial}
        animate={messageEnter.animate}
        transition={{ ...messageEnter.transition, delay: index * 0.05 }}
        className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
      >
        {/* Avatar */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
            isUser
              ? 'bg-accent/20 text-accent'
              : 'bg-surface-elevated border border-border/50 text-accent',
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className={cn('flex flex-col max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
          <div
            className={cn(
              'px-4 py-3 rounded-2xl',
              isUser
                ? 'bg-accent text-white rounded-br-md'
                : 'bg-surface-raised border border-border/50 rounded-bl-md',
            )}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              renderContent(message.content)
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-1.5 px-1">
            <Clock className="w-3 h-3 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">{formatTime(message.timestamp)}</span>
            {message.metadata?.contextUsed && (
              <span className="text-xs text-accent/70 ml-2">使用了上下文</span>
            )}
          </div>

          {/* Suggestions */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + idx * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-raised border border-border/50 rounded-full hover:border-accent/50 hover:text-accent transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          )}

          {/* Actions */}
          {!isUser && message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.actions.map((action, idx) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + idx * 0.1 }}
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-full hover:bg-accent/20 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
