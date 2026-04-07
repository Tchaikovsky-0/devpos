// =============================================================================
// AIActionExecutor - AI动作执行器组件
// 解析AI返回的动作指令并执行UI操作
// =============================================================================

import React, { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Navigation,
  Highlighter,
  Download,
  BarChart3,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIActionPayload } from '@/types/copilot';

type ActionStatus = 'pending' | 'executing' | 'success' | 'error';

interface ActionExecution {
  id: string;
  payload: AIActionPayload;
  status: ActionStatus;
  message?: string;
  timestamp: Date;
}

interface AIActionExecutorProps {
  className?: string;
  onExecute?: (payload: AIActionPayload) => Promise<boolean>;
}

interface ActionExecutorState {
  actions: ActionExecution[];
  currentAction: ActionExecution | null;
}

const actionIcons: Record<string, React.ElementType> = {
  filter: Filter,
  navigate: Navigation,
  highlight: Highlighter,
  export: Download,
  analyze: BarChart3,
  play: Play,
  pause: Pause,
  skipForward: SkipForward,
  skipBack: SkipBack,
};

const actionLabels: Record<string, string> = {
  filter: '应用筛选',
  navigate: '页面跳转',
  highlight: '高亮显示',
  export: '导出数据',
  analyze: '开始分析',
  play: '播放',
  pause: '暂停',
  skipForward: '快进',
  skipBack: '后退',
};

const statusConfig: Record<ActionStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Loader2, color: 'text-text-tertiary', label: '等待中' },
  executing: { icon: Loader2, color: 'text-accent animate-spin', label: '执行中' },
  success: { icon: CheckCircle2, color: 'text-success', label: '已完成' },
  error: { icon: XCircle, color: 'text-error', label: '执行失败' },
};

// 动作执行器 Hook
export const useAIActionExecutor = () => {
  const [state, setState] = useState<ActionExecutorState>({
    actions: [],
    currentAction: null,
  });

  const executeAction = useCallback(
    async (payload: AIActionPayload, executor?: (p: AIActionPayload) => Promise<boolean>) => {
      const action: ActionExecution = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        payload,
        status: 'executing',
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        actions: [...prev.actions, action],
        currentAction: action,
      }));

      try {
        let success = false;

        if (executor) {
          success = await executor(payload);
        } else {
          // 默认模拟执行
          await new Promise((resolve) => setTimeout(resolve, 1000));
          success = true;
        }

        const updatedAction: ActionExecution = {
          ...action,
          status: success ? 'success' : 'error',
          message: success ? '执行成功' : '执行失败',
        };

        setState((prev) => ({
          ...prev,
          actions: prev.actions.map((a) => (a.id === action.id ? updatedAction : a)),
          currentAction: updatedAction,
        }));

        return success;
      } catch (error) {
        const updatedAction: ActionExecution = {
          ...action,
          status: 'error',
          message: error instanceof Error ? error.message : '未知错误',
        };

        setState((prev) => ({
          ...prev,
          actions: prev.actions.map((a) => (a.id === action.id ? updatedAction : a)),
          currentAction: updatedAction,
        }));

        return false;
      }
    },
    [],
  );

  const clearActions = useCallback(() => {
    setState({ actions: [], currentAction: null });
  }, []);

  const removeAction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== id),
    }));
  }, []);

  return {
    ...state,
    executeAction,
    clearActions,
    removeAction,
  };
};

// 动作执行器UI组件
export const AIActionExecutor: React.FC<AIActionExecutorProps> = memo(
  ({ className, onExecute: _onExecute }) => {
    const { actions, currentAction } = useAIActionExecutor();
    const [isExpanded, setIsExpanded] = useState(false);

    // 只显示最近的5个动作
    const recentActions = actions.slice(-5);

    if (actions.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'fixed bottom-4 left-4 z-40',
          'bg-surface-raised/95 backdrop-blur-md',
          'border border-border/50 rounded-2xl',
          'shadow-lg shadow-black/20',
          'overflow-hidden',
          className,
        )}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-elevated/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {currentAction?.status === 'executing' ? (
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-success" />
            )}
            <span className="text-sm font-medium text-text-primary">
              {currentAction?.status === 'executing'
                ? '正在执行动作...'
                : `已完成 ${actions.filter((a) => a.status === 'success').length} 个动作`}
            </span>
          </div>
          <span className="text-xs text-text-tertiary">
            {isExpanded ? '收起' : '展开'}
          </span>
        </button>

        {/* Action List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="border-t border-border/50"
            >
              <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {recentActions.map((action) => {
                  const Icon = actionIcons[action.payload.type] || BarChart3;
                  const status = statusConfig[action.status];
                  const StatusIcon = status.icon;

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl',
                        'bg-surface-subtle/50',
                        action.status === 'executing' && 'bg-accent/5',
                      )}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center">
                        <Icon className="w-4 h-4 text-text-secondary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {actionLabels[action.payload.type] || action.payload.type}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                          {action.message || status.label}
                        </p>
                      </div>

                      <StatusIcon className={cn('w-4 h-4 flex-shrink-0', status.color)} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

AIActionExecutor.displayName = 'AIActionExecutor';

// 动作预览组件 - 显示AI建议的动作
interface ActionPreviewProps {
  payload: AIActionPayload;
  onExecute?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ActionPreview: React.FC<ActionPreviewProps> = memo(
  ({ payload, onExecute, onDismiss, className }) => {
    const Icon = actionIcons[payload.type] || BarChart3;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'flex items-center gap-3 p-3',
          'bg-accent/10 border border-accent/20 rounded-xl',
          className,
        )}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {actionLabels[payload.type] || payload.type}
          </p>
          <p className="text-xs text-text-tertiary">
            目标: {payload.target}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            忽略
          </button>
          <button
            onClick={onExecute}
            className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent-strong transition-colors"
          >
            执行
          </button>
        </div>
      </motion.div>
    );
  },
);

ActionPreview.displayName = 'ActionPreview';

export default AIActionExecutor;
