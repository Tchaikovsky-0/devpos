// =============================================================================
// ShortcutPalette - 全局命令面板 (⌘P)
// =============================================================================
// VS Code / Raycast 风格的命令面板，支持：
// - 快速搜索命令/导航
// - 键盘上下导航 + 回车执行
// - 分类分组显示
// - Escape 关闭
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  Search,
  ArrowRight,
  Keyboard,
  Volume2,
  VolumeX,
  Maximize,
  Radar,
  FolderKanban,
  Camera,
  Siren,
  ClipboardList,
  ServerCog,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShortcutHint } from '@/components/ui/ShortcutHint';

// ── Types ──

export interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ElementType;
  category: string;
  keywords?: string[];
  onSelect: () => void;
}

type NavCommand = Omit<PaletteCommand, 'onSelect'>;

export interface ShortcutPaletteProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 告警静音状态 */
  isAlertMuted?: boolean;
  /** 切换告警静音 */
  onToggleAlertMute?: () => void;
  /** AI 面板打开状态 */
  isAIOpen?: boolean;
  /** 切换 AI 面板 */
  onToggleAI?: () => void;
  /** 额外命令 */
  extraCommands?: PaletteCommand[];
}

// ── Component ──

export const ShortcutPalette: React.FC<ShortcutPaletteProps> = ({
  isOpen,
  onClose,
  isAlertMuted = false,
  onToggleAlertMute,
  isAIOpen = false,
  onToggleAI,
  extraCommands = [],
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Build command list ──
  const commands = useMemo(() => {
    const navCommands: NavCommand[] = [
      { id: 'goto-center', label: '跳转到监控大屏', shortcut: '⌘2', icon: Radar, category: '导航', keywords: ['监控', '大屏', '视频', '直播'] },
      { id: 'goto-media', label: '跳转到媒体库', shortcut: '⌘3', icon: FolderKanban, category: '导航', keywords: ['媒体', '资料', '文件', '文档'] },
      { id: 'goto-gallery', label: '跳转到航拍图库', icon: Camera, category: '导航', keywords: ['图库', '航拍', '图片', '照片'] },
      { id: 'goto-alerts', label: '跳转到告警处置', shortcut: '⌘1', icon: Siren, category: '导航', keywords: ['告警', '警报', '异常', '报警'] },
      { id: 'goto-tasks', label: '跳转到任务协同', shortcut: '⌘4', icon: ClipboardList, category: '导航', keywords: ['任务', '协同', '工单', '待办'] },
      { id: 'goto-assets', label: '跳转到资产设备', icon: ServerCog, category: '导航', keywords: ['资产', '设备', '传感器', '资产'] },
      { id: 'goto-openclaw', label: '打开 AI 助手', icon: Bot, category: '导航', keywords: ['AI', '智能', '助手', '机器人', 'OpenClaw'] },
      { id: 'goto-system', label: '跳转到系统管理', icon: ShieldCheck, category: '导航', keywords: ['系统', '管理', '设置', '配置'] },
    ];

    const actionCommands: PaletteCommand[] = [
      {
        id: 'toggle-ai',
        label: isAIOpen ? '关闭 AI 协同面板' : '打开 AI 协同面板',
        shortcut: '⌘K',
        icon: Bot,
        category: '操作',
        keywords: ['AI', '协同', '对话', '助手'],
        onSelect: onToggleAI ?? (() => {}),
      },
      {
        id: 'toggle-mute',
        label: isAlertMuted ? '取消告警静音' : '切换告警静音',
        shortcut: '⌘⇧M',
        icon: isAlertMuted ? VolumeX : Volume2,
        category: '操作',
        keywords: ['静音', '声音', '告警', '提醒'],
        onSelect: onToggleAlertMute ?? (() => {}),
      },
      {
        id: 'toggle-fullscreen',
        label: '切换全屏模式',
        shortcut: '⌘⇧F',
        icon: Maximize,
        category: '操作',
        keywords: ['全屏', '全屏模式', '放大'],
        onSelect: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        },
      },
    ];

    // Attach navigate handlers to nav commands
    const navWithPath = navCommands.map((cmd) => {
      const pathMap: Record<string, string> = {
        'goto-center': '/center',
        'goto-media': '/media',
        'goto-gallery': '/gallery',
        'goto-alerts': '/alerts',
        'goto-tasks': '/tasks',
        'goto-assets': '/assets',
        'goto-openclaw': '/openclaw',
        'goto-system': '/system',
      };
      return {
        ...cmd,
        onSelect: () => navigate(pathMap[cmd.id]),
      };
    });

    return [...navWithPath, ...actionCommands, ...extraCommands];
  }, [navigate, isAIOpen, isAlertMuted, onToggleAI, onToggleAlertMute, extraCommands]);

  // ── Filter commands ──
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery)) ?? false;
      return matchLabel || matchCategory || matchKeywords;
    });
  }, [commands, query]);

  // ── Group filtered commands ──
  const groupedCommands = useMemo(() => {
    const groups: Record<string, PaletteCommand[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return Object.entries(groups);
  }, [filteredCommands]);

  // ── Reset on open/close ──
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after animation
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // ── Clamp selected index when filtered results change ──
  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(filteredCommands.length - 1, 0)));
  }, [filteredCommands.length]);

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].onSelect();
            onClose();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose],
  );

  // ── Scroll selected into view ──
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-palette-backdrop" />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-[560px] rounded-xl border border-border',
          'bg-bg-secondary shadow-soft',
          'animate-palette-panel overflow-hidden',
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border-secondary px-4 py-3">
          <Search className="h-4 w-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索命令或输入快捷操作..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <ShortcutHint shortcut="ESC" size="xs" />
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          className="max-h-[340px] overflow-y-auto py-2"
          role="listbox"
        >
          {groupedCommands.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <Search className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">未找到匹配的命令</p>
            </div>
          )}

          {groupedCommands.map(([category, items], groupIdx) => (
            <div key={category}>
              {/* Category header */}
              {groupIdx > 0 && (
                <div className="my-1.5 mx-3 h-px bg-border-secondary" />
              )}
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                {category}
              </div>

              {/* Items */}
              {items.map((cmd) => {
                const flatIndex = filteredCommands.indexOf(cmd);
                const isSelected = flatIndex === selectedIndex;
                const Icon = cmd.icon ?? Command;

                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => {
                      cmd.onSelect();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 mx-1 rounded-lg text-left transition-colors duration-100',
                      isSelected
                        ? 'bg-accent-muted text-text-primary'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-accent' : 'text-text-tertiary',
                      )}
                    />
                    <span className="flex-1 text-sm truncate">{cmd.label}</span>
                    {cmd.shortcut && (
                      <ShortcutHint
                        shortcut={cmd.shortcut}
                        size="xs"
                        variant={isSelected ? 'accent' : 'default'}
                      />
                    )}
                    {isSelected && (
                      <ArrowRight className="h-3.5 w-3.5 text-accent shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-secondary px-4 py-2.5 text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
              <span>执行</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
              <span>关闭</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-text-tertiary">
            <Keyboard className="h-3 w-3" />
            <span>快捷键面板</span>
          </div>
        </div>
      </div>
    </div>
  );
};

ShortcutPalette.displayName = 'ShortcutPalette';

export default ShortcutPalette;
