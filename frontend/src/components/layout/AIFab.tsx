/**
 * AIFab - 智能操作浮动按钮
 * 
 * 替代 ContextActionStrip，在每个页面右下角提供一个轻量级入口
 * 点击后展开操作菜单，调用 OpenClaw 面板
 * 
 * 设计原则：
 * - 不占用页面垂直空间（浮动在右下角）
 * - 不遮挡主要操作区域
 * - 展开菜单后清晰展示可用操作
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Sparkles, X, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AIFabAction {
  label: string;
  onClick: () => void;
  description?: string;
  tone?: 'default' | 'accent' | 'warning';
}

export interface AIFabProps {
  /** 操作列表 */
  actions: AIFabAction[];
  /** 自定义类名 */
  className?: string;
}

export function AIFab({ actions, className }: AIFabProps) {
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  // Esc 关闭
  useEffect(() => {
    if (!expanded) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [expanded]);

  const handleAction = useCallback(
    (action: AIFabAction) => {
      setExpanded(false);
      action.onClick();
    },
    [],
  );

  return (
    <div ref={menuRef} className={cn('fixed bottom-10 right-6 z-30', className)}>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mb-3 w-56 rounded-xl border border-border bg-bg-secondary/95 backdrop-blur-xl shadow-lg"
          >
            {/* 菜单标题 */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </div>
              <span className="text-xs font-semibold text-text-primary">智能操作</span>
            </div>

            {/* 操作列表 */}
            <div className="px-1.5 pb-1.5">
              {actions.map((action, index) => (
                <button
                  key={`${action.label}-${index}`}
                  type="button"
                  onClick={() => handleAction(action)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg-elevated"
                >
                  <p
                    className={cn(
                      'text-sm font-medium',
                      action.tone === 'accent'
                        ? 'text-accent'
                        : action.tone === 'warning'
                          ? 'text-warning'
                          : 'text-text-primary',
                    )}
                  >
                    {action.label}
                  </p>
                  {action.description && (
                    <p className="mt-0.5 text-[11px] text-text-tertiary">{action.description}</p>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB 按钮 */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          expanded
            ? 'bg-bg-hover text-text-primary hover:bg-bg-hover'
            : 'bg-gradient-to-br from-accent-soft to-accent text-white hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
        )}
        aria-label={expanded ? '关闭智能操作菜单' : '打开智能操作菜单'}
        aria-expanded={expanded}
      >
        {expanded ? (
          <X className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </button>

      {/* 收起指示器（展开时） */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-1 left-1/2 -translate-x-1/2"
          >
            <ChevronUp className="h-3 w-3 text-text-tertiary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIFab;
