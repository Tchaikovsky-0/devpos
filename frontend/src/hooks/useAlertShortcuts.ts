import { useEffect, useCallback } from 'react';

/**
 * useAlertShortcuts - 告警管理键盘快捷键 Hook
 * 参考 Linear/Superhuman 的高效键盘操作
 */

export interface AlertShortcutsConfig {
  /** 下一个告警 */
  onNext: () => void;
  /** 上一个告警 */
  onPrev: () => void;
  /** 确认处理 */
  onAcknowledge: () => void;
  /** 忽略告警 */
  onIgnore: () => void;
  /** 标记为已解决 */
  onResolve: () => void;
  /** 快速过滤 */
  onFilter: () => void;
  /** 显示快捷键帮助 */
  onShowHelp: () => void;
  /** 刷新列表 */
  onRefresh: () => void;
  /** 全选 */
  onSelectAll: () => void;
  /** 搜索 */
  onSearch: () => void;
}

export const useAlertShortcuts = (config: Partial<AlertShortcutsConfig>, enabled: boolean = true) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 如果在输入框中，不触发快捷键
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // 如果有修饰键，不触发（除了特定的组合键）
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'j':
        e.preventDefault();
        config.onNext?.();
        break;
      case 'k':
        e.preventDefault();
        config.onPrev?.();
        break;
      case 'e':
        e.preventDefault();
        config.onAcknowledge?.();
        break;
      case 's':
        e.preventDefault();
        config.onIgnore?.();
        break;
      case 'r':
        e.preventDefault();
        config.onResolve?.();
        break;
      case 'f':
        e.preventDefault();
        config.onFilter?.();
        break;
      case '?':
        e.preventDefault();
        config.onShowHelp?.();
        break;
      case ' ': // Space to refresh
        e.preventDefault();
        config.onRefresh?.();
        break;
      case 'a':
        if (e.shiftKey) {
          e.preventDefault();
          config.onSelectAll?.();
        }
        break;
      case '/':
        e.preventDefault();
        config.onSearch?.();
        break;
    }
  }, [config]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

/**
 * 快捷键帮助内容
 */
export const alertShortcutsHelp = [
  { key: 'J', description: '下一个告警' },
  { key: 'K', description: '上一个告警' },
  { key: 'E', description: '确认处理' },
  { key: 'S', description: '忽略告警' },
  { key: 'R', description: '标记为已解决' },
  { key: 'F', description: '快速过滤' },
  { key: '/', description: '搜索' },
  { key: '?', description: '显示快捷键帮助' },
  { key: 'Space', description: '刷新列表' },
];

/**
 * useKeyboardNavigation - 通用键盘导航 Hook
 */
export interface KeyboardNavigationConfig {
  itemCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onConfirm?: () => void;
  loop?: boolean;
}

export const useKeyboardNavigation = ({
  itemCount,
  selectedIndex,
  onSelect,
  onConfirm,
  loop = true,
}: KeyboardNavigationConfig) => {
  const handleNext = useCallback(() => {
    if (selectedIndex < itemCount - 1) {
      onSelect(selectedIndex + 1);
    } else if (loop) {
      onSelect(0);
    }
  }, [selectedIndex, itemCount, onSelect, loop]);

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) {
      onSelect(selectedIndex - 1);
    } else if (loop) {
      onSelect(itemCount - 1);
    }
  }, [selectedIndex, itemCount, onSelect, loop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        handleNext();
        break;
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        handlePrev();
        break;
      case 'Enter':
        e.preventDefault();
        onConfirm?.();
        break;
    }
  }, [handleNext, handlePrev, onConfirm]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleNext, handlePrev };
};

export default useAlertShortcuts;
