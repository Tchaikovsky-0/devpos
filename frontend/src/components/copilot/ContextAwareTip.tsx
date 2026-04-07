// =============================================================================
// ContextAwareTip - 上下文感知提示组件
// 根据当前页面自动显示相关提示
// =============================================================================

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CopilotContext, CopilotSuggestion } from '@/types/copilot';

interface ContextAwareTipProps {
  context: CopilotContext;
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
  autoHideDelay?: number;
}

const tipAnimation = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

// 根据上下文类型获取提示
const getContextualSuggestions = (context: CopilotContext): CopilotSuggestion[] => {
  const suggestions: CopilotSuggestion[] = [];
  const type = context.type;

  if (type === 'video') {
    suggestions.push(
      { id: 'v1', text: '这段视频中检测到了异常活动，建议查看详细告警记录', context: 'video', priority: 1 },
      { id: 'v2', text: '当前画面画质良好，AI检测正在正常运行', context: 'video', priority: 2 },
    );
  } else if (type === 'alert') {
    suggestions.push(
      { id: 'a1', text: '您有新的告警待处理，点击查看详情', context: 'alert', priority: 1 },
      { id: 'a2', text: '告警已根据级别自动分类，P0级告警需要立即处理', context: 'alert', priority: 2 },
    );
  } else if (type === 'media') {
    suggestions.push(
      { id: 'm1', text: '媒体文件已按时间自动归档，方便快速检索', context: 'media', priority: 1 },
      { id: 'm2', text: '选中的图片可以用于生成巡检报告', context: 'media', priority: 2 },
    );
  } else if (type === 'dashboard') {
    suggestions.push(
      { id: 'd1', text: '今日告警数量较昨日下降15%，整体运行平稳', context: 'dashboard', priority: 1 },
      { id: 'd2', text: '视频流在线率100%，所有设备正常工作', context: 'dashboard', priority: 2 },
    );
  }

  return suggestions;
};

export const ContextAwareTip: React.FC<ContextAwareTipProps> = memo(
  ({ context, onSuggestionClick, className, autoHideDelay = 10000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [currentSuggestion, setCurrentSuggestion] = useState<CopilotSuggestion | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    // 根据上下文选择合适的提示
    useEffect(() => {
      const suggestions = getContextualSuggestions(context);

      if (suggestions.length > 0) {
        // 按优先级排序
        suggestions.sort((a, b) => a.priority - b.priority);
        setCurrentSuggestion(suggestions[0]);
        setIsVisible(true);
      } else {
        setCurrentSuggestion(null);
      }
    }, [context]);

    // 自动隐藏
    useEffect(() => {
      if (!isVisible || hasInteracted || !currentSuggestion) return;

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }, [isVisible, hasInteracted, currentSuggestion, autoHideDelay]);

    const handleDismiss = () => {
      setIsVisible(false);
      setHasInteracted(true);
    };

    const handleClick = () => {
      if (currentSuggestion) {
        onSuggestionClick?.(currentSuggestion.text);
        setHasInteracted(true);
        setIsVisible(false);
      }
    };

    if (!currentSuggestion) return null;

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={tipAnimation.initial}
            animate={tipAnimation.animate}
            exit={tipAnimation.exit}
            transition={tipAnimation.transition}
            className={cn(
              'relative flex items-start gap-3 p-4 rounded-2xl',
              'bg-gradient-to-r from-accent/10 via-accent/5 to-transparent',
              'border border-accent/20 backdrop-blur-sm',
              'shadow-lg shadow-accent/5',
              className,
            )}
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                OpenClaw 助手
              </p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                {currentSuggestion.text}
              </p>

              {/* Action Button */}
              <button
                onClick={handleClick}
                className="flex items-center gap-1 mt-3 text-xs font-medium text-accent hover:text-accent-soft transition-colors group"
              >
                了解更多
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Decorative gradient line */}
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-accent/50 via-accent/20 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

ContextAwareTip.displayName = 'ContextAwareTip';

// 上下文提示条 - 简化版，用于嵌入页面顶部
interface ContextTipBarProps {
  context: CopilotContext;
  onOpenCopilot?: () => void;
  className?: string;
}

export const ContextTipBar: React.FC<ContextTipBarProps> = memo(
  ({ context, onOpenCopilot, className }) => {
    const getContextLabel = (type: string): string => {
      const labels: Record<string, string> = {
        video: '🎥 视频分析模式',
        alert: '🔔 告警处理模式',
        media: '📁 媒体库模式',
        dashboard: '📊 数据概览模式',
      };
      return labels[type] || '💬 AI助手';
    };

    const getContextHint = (type: string): string => {
      const hints: Record<string, string> = {
        video: '我可以帮你分析这段视频的内容',
        alert: '我可以帮你处理告警和生成报告',
        media: '我可以帮你搜索和筛选媒体文件',
        dashboard: '我可以帮你解读数据趋势',
      };
      return hints[type] || '有什么可以帮你的吗？';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'bg-surface-raised/80 border-b border-border/50 backdrop-blur-sm',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-text-primary">
            {getContextLabel(context.type)}
          </span>
          <span className="text-sm text-text-tertiary">
            {getContextHint(context.type)}
          </span>
        </div>

        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          打开助手
        </button>
      </motion.div>
    );
  },
);

ContextTipBar.displayName = 'ContextTipBar';

export default ContextAwareTip;
