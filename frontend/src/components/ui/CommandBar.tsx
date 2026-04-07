import React, { useState, useEffect, useCallback, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  /** 唯一标识 */
  id: string;
  /** 显示标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 分类 */
  category?: string;
  /** 快捷键 */
  shortcut?: string;
  /** 点击回调 */
  onSelect?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface CommandBarProps {
  /** 命令列表 */
  items: CommandItem[];
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 空状态文本 */
  emptyText?: string;
  /** 最近使用存储键 */
  recentKey?: string;
  /** 最大最近使用数量 */
  maxRecent?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * CommandBar - 全局命令面板组件
 * 
 * 特性:
 * - ⌘+K 唤出
 * - 模糊搜索
 * - 最近使用记录
 * - 分类展示
 * - 键盘导航
 * 
 * @example
 * ```tsx
 * const items = [
 *   { id: '1', title: '监控大屏', category: '导航', onSelect: () => navigate('/dashboard') },
 *   { id: '2', title: '告警管理', category: '导航', onSelect: () => navigate('/alerts') },
 * ];
 * 
 * <CommandBar
 *   items={items}
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
const CommandBar = forwardRef<HTMLDivElement, CommandBarProps>(
  (
    {
      items,
      isOpen,
      onClose,
      placeholder = '搜索命令...',
      emptyText = '未找到相关命令',
      recentKey = 'command-bar-recent',
      maxRecent = 5,
      className,
    },
    ref
  ) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentIds, setRecentIds] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // 加载最近使用
    useEffect(() => {
      try {
        const stored = localStorage.getItem(recentKey);
        if (stored) {
          setRecentIds(JSON.parse(stored));
        }
      } catch {
        // 忽略 localStorage 错误
      }
    }, [recentKey]);

    // 保存最近使用
    const saveRecent = useCallback((id: string) => {
      setRecentIds((prev) => {
        const newRecent = [id, ...prev.filter((item) => item !== id)].slice(0, maxRecent);
        try {
          localStorage.setItem(recentKey, JSON.stringify(newRecent));
        } catch {
          // 忽略 localStorage 错误
        }
        return newRecent;
      });
    }, [recentKey, maxRecent]);

    // 过滤和分组项目
    const filteredItems = query.trim()
      ? items.filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()) ||
            item.category?.toLowerCase().includes(query.toLowerCase())
        )
      : items;

    // 分组
    const groupedItems = filteredItems.reduce((acc, item) => {
      const category = item.category || '其他';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, CommandItem[]>);

    // 最近使用项目
    const recentItems = recentIds
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as CommandItem[];

    // 扁平化列表用于键盘导航
    const flatItems = Object.values(groupedItems).flat();

    // 重置选中索引
    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    // 聚焦输入框
    useEffect(() => {
      if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, [isOpen]);

    // 键盘导航
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % flatItems.length);
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
            break;
          case 'Enter':
            e.preventDefault();
            const selected = flatItems[selectedIndex];
            if (selected && !selected.disabled) {
              handleSelect(selected);
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatItems, selectedIndex, onClose]);

    // 选择项目
    const handleSelect = (item: CommandItem) => {
      saveRecent(item.id);
      item.onSelect?.();
      onClose();
      setQuery('');
    };

    // 渲染项目
    const renderItem = (item: CommandItem, index: number) => {
      const isSelected = flatItems[selectedIndex]?.id === item.id;
      
      return (
        <motion.button
          key={item.id}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 rounded-lg',
            isSelected
              ? 'bg-[rgba(59,130,246,0.15)] text-[#f8fafc]'
              : 'text-[#94a3b8] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#f8fafc]',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !item.disabled && handleSelect(item)}
          onMouseEnter={() => setSelectedIndex(index)}
          disabled={item.disabled}
          layout
        >
          {item.icon && (
            <span className="flex-shrink-0 w-5 h-5 text-[#64748b]">{item.icon}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{item.title}</div>
            {item.description && (
              <div className="text-xs text-[#64748b] truncate">{item.description}</div>
            )}
          </div>
          {item.shortcut && (
            <kbd className="flex-shrink-0 px-2 py-0.5 text-xs text-[#64748b] bg-[rgba(255,255,255,0.06)] rounded">
              {item.shortcut}
            </kbd>
          )}
          {isSelected && <ArrowRight className="w-4 h-4 text-[#3b82f6]" />}
        </motion.button>
      );
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            {/* 面板 */}
            <motion.div
              ref={ref}
              className={cn(
                'fixed left-1/2 top-[20%] -translate-x-1/2 z-[801] w-full max-w-2xl',
                className
              )}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="overflow-hidden bg-[#0f172a]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl">
                {/* 搜索框 */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <Search className="w-5 h-5 text-[#64748b]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-[#f8fafc] placeholder-[#64748b] outline-none text-base"
                  />
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs text-[#64748b] bg-[rgba(255,255,255,0.06)] rounded">
                      <Command className="w-3 h-3 inline" />
                    </kbd>
                    <kbd className="px-2 py-1 text-xs text-[#64748b] bg-[rgba(255,255,255,0.06)] rounded">
                      K
                    </kbd>
                    <button
                      onClick={onClose}
                      className="p-1 text-[#64748b] hover:text-[#f8fafc] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 内容区 */}
                <div className="max-h-[60vh] overflow-y-auto py-2">
                  {/* 最近使用 */}
                  {!query && recentItems.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-2 text-xs font-medium text-[#64748b] flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        最近使用
                      </div>
                      <div className="px-2">
                        {recentItems.map((item, index) => renderItem(item, index))}
                      </div>
                    </div>
                  )}

                  {/* 分类列表 */}
                  {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category} className="mb-2">
                      <div className="px-4 py-2 text-xs font-medium text-[#64748b]">
                        {category}
                      </div>
                      <div className="px-2">
                        {categoryItems.map((item) =>
                          renderItem(item, flatItems.findIndex((i) => i.id === item.id))
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 空状态 */}
                  {flatItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-[#64748b]">
                      <Search className="w-8 h-8 mb-3 opacity-50" />
                      <p className="text-sm">{emptyText}</p>
                    </div>
                  )}
                </div>

                {/* 底部提示 */}
                <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b] border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.06)] rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.06)] rounded">↓</kbd>
                      导航
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.06)] rounded">↵</kbd>
                      选择
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.06)] rounded">Esc</kbd>
                    关闭
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

CommandBar.displayName = 'CommandBar';

export default CommandBar;
