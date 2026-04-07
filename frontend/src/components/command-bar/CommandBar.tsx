import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  Search,
  Command,
  Video,
  AlertTriangle,
  FolderOpen,
  Settings,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/**
 * CommandBar - 全局命令面板
 * ⌘+K 唤出，支持模糊搜索和快速操作
 */

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: string;
  action: () => void;
  keywords?: string[];
}

export interface CommandBarProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 命令列表 */
  commands?: CommandItem[];
  /** 最近使用的命令 */
  recentCommands?: string[];
}

// 默认命令列表
const defaultCommands: CommandItem[] = [
  // 导航命令
  {
    id: 'goto-dashboard',
    title: '打开监控大屏',
    subtitle: '查看实时监控画面',
    icon: <Video className="w-4 h-4" />,
    shortcut: 'G D',
    category: '导航',
    action: () => window.location.href = '/dashboard',
    keywords: ['dashboard', '监控', '大屏', '视频'],
  },
  {
    id: 'goto-alerts',
    title: '查看告警管理',
    subtitle: '处理未读告警',
    icon: <AlertTriangle className="w-4 h-4" />,
    shortcut: 'G A',
    category: '导航',
    action: () => window.location.href = '/alerts',
    keywords: ['alert', '告警', '警告', '异常'],
  },
  {
    id: 'goto-media',
    title: '打开媒体库',
    subtitle: '浏览历史录像和截图',
    icon: <FolderOpen className="w-4 h-4" />,
    shortcut: 'G M',
    category: '导航',
    action: () => window.location.href = '/media',
    keywords: ['media', '媒体', '录像', '截图', '文件'],
  },
  // AI 命令
  {
    id: 'ai-summary',
    title: '生成今日报告',
    subtitle: 'AI 自动分析今日监控情况',
    icon: <Sparkles className="w-4 h-4" />,
    category: 'AI 助手',
    action: () => console.log('生成报告'),
    keywords: ['report', '报告', '总结', 'ai'],
  },
  {
    id: 'ai-analyze',
    title: '分析异常趋势',
    subtitle: '查看近期告警趋势分析',
    icon: <Sparkles className="w-4 h-4" />,
    category: 'AI 助手',
    action: () => console.log('分析趋势'),
    keywords: ['analyze', '分析', '趋势', '统计'],
  },
  // 操作命令
  {
    id: 'export-alerts',
    title: '导出告警记录',
    subtitle: '导出昨日告警数据',
    icon: <FileText className="w-4 h-4" />,
    category: '操作',
    action: () => console.log('导出告警'),
    keywords: ['export', '导出', '下载', '记录'],
  },
  {
    id: 'open-settings',
    title: '打开设置',
    subtitle: '系统配置和个性化',
    icon: <Settings className="w-4 h-4" />,
    shortcut: '⌘,',
    category: '操作',
    action: () => window.location.href = '/settings',
    keywords: ['settings', '设置', '配置', '偏好'],
  },
];

export const CommandBar = forwardRef<HTMLDivElement, CommandBarProps>(
  ({ isOpen, onClose, commands = defaultCommands, recentCommands = [] }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // 使用 useMemo 过滤命令，避免 useEffect 导致的无限循环
    const filteredCommands = React.useMemo(() => {
      if (!searchQuery.trim()) {
        const recent = recentCommands
          .map(id => commands.find(c => c.id === id))
          .filter(Boolean) as CommandItem[];
        return recent.length > 0 ? recent : commands.slice(0, 6);
      }

      const query = searchQuery.toLowerCase();
      return commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.subtitle?.toLowerCase().includes(query) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }, [searchQuery, commands, recentCommands]);

    // 搜索时重置选中索引
    useEffect(() => {
      setSelectedIndex(0);
    }, [filteredCommands.length]);

    // 键盘导航
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // 重置状态
    useEffect(() => {
      if (isOpen) {
        setSearchQuery('');
        setSelectedIndex(0);
      }
    }, [isOpen]);

    // 全局快捷键 ⌘+K
    useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          if (!isOpen) {
            // 打开命令面板
          } else {
            onClose();
          }
        }
      };

      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, onClose]);

    // 按类别分组
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, CommandItem[]>);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[800]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Command Bar */}
            <motion.div
              ref={ref}
              className={cn(
                'fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl z-[801]',
                'bg-surface/95 backdrop-blur-xl',
                'border border-border-strong rounded-xl',
                'shadow-2xl shadow-black/50',
                'overflow-hidden'
              )}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <Search className="w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入命令或搜索..."
                  className={cn(
                    'flex-1 bg-transparent text-text-primary placeholder:text-text-disabled',
                    'text-base outline-none',
                    'font-sans'
                  )}
                  autoFocus
                />
                <kbd className="px-2 py-1 text-xs text-text-primary0 bg-bg-hover rounded border border-border">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-primary0">
                    未找到匹配的命令
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, items]) => (
                    <div key={category} className="mb-2">
                      {/* Category Header */}
                      <div className="px-4 py-1.5 text-xs font-medium text-text-primary0 uppercase tracking-wider">
                        {category}
                      </div>

                      {/* Commands */}
                      {items.map((cmd, _idx) => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={cmd.id}
                            className={cn(
                              'w-full px-4 py-2.5 flex items-center gap-3',
                              'transition-colors duration-150',
                              isSelected
                                ? 'bg-accent-muted text-text-primary'
                                : 'text-text-tertiary hover:bg-bg-hover'
                            )}
                            onClick={() => {
                              cmd.action();
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            {/* Icon */}
                            <span className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              isSelected ? 'bg-accent-muted text-accent' : 'bg-bg-hover text-text-secondary'
                            )}>
                              {cmd.icon || <Command className="w-4 h-4" />}
                            </span>

                            {/* Content */}
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">
                                {cmd.title}
                              </div>
                              {cmd.subtitle && (
                                <div className="text-xs text-text-primary0">
                                  {cmd.subtitle}
                                </div>
                              )}
                            </div>

                            {/* Shortcut */}
                            {cmd.shortcut && (
                              <kbd className="px-2 py-0.5 text-xs text-text-primary0 bg-bg-hover rounded border border-border shrink-0">
                                {cmd.shortcut}
                              </kbd>
                            )}

                            {/* Arrow */}
                            {isSelected && (
                              <ChevronRight className="w-4 h-4 text-accent shrink-0" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-text-primary0">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-bg-hover rounded border border-border">↑↓</kbd>
                    导航
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-bg-hover rounded border border-border">↵</kbd>
                    选择
                  </span>
                </div>
                <span>{filteredCommands.length} 个命令</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

CommandBar.displayName = 'CommandBar';

/**
 * useCommandBar - 命令面板状态管理 Hook
 */
export const useCommandBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
};

export default CommandBar;
