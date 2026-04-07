// =============================================================================
// useKeyboardShortcuts - 全局键盘快捷键系统
// =============================================================================
// 统一管理全局快捷键注册、冲突检测、优先级排序。
// 支持组合键 (Cmd/Ctrl + Shift + Key) 和可配置的快捷键映射。
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──

export interface ShortcutDefinition {
  /** 唯一标识 */
  id: string;
  /** 快捷键显示文本，如 "⌘K" */
  label: string;
  /** 键名 (key.toLowerCase()) */
  key: string;
  /** 是否需要 Meta (Cmd) / Ctrl */
  meta?: boolean;
  /** 是否需要 Shift */
  shift?: boolean;
  /** 是否需要 Alt / Option */
  alt?: boolean;
  /** 优先级，数值越小优先级越高 (默认 100) */
  priority?: number;
  /** 触发回调 */
  onTrigger: () => void;
  /** 是否在输入框中生效 (默认 false) */
  allowInInput?: boolean;
  /** 描述文字 (用于命令面板) */
  description?: string;
  /** 分类 (用于命令面板分组) */
  category?: string;
}

interface ShortcutMatch {
  /** 匹配的键 */
  key: string;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

interface RegisteredShortcut extends ShortcutDefinition {
  priority: number;
}

// ── Default Shortcuts ──

export const DEFAULT_SHORTCUTS: Omit<ShortcutDefinition, 'onTrigger'>[] = [
  {
    id: 'open-ai-panel',
    label: '⌘K',
    key: 'k',
    meta: true,
    priority: 10,
    description: '打开/关闭 AI 协同面板',
    category: '全局',
  },
  {
    id: 'command-palette',
    label: '⌘P',
    key: 'p',
    meta: true,
    priority: 9,
    description: '打开命令面板',
    category: '全局',
  },
  {
    id: 'goto-alerts',
    label: '⌘1',
    key: '1',
    meta: true,
    priority: 20,
    description: '跳转到告警处置',
    category: '导航',
  },
  {
    id: 'goto-center',
    label: '⌘2',
    key: '2',
    meta: true,
    priority: 21,
    description: '跳转到监控大屏',
    category: '导航',
  },
  {
    id: 'goto-media',
    label: '⌘3',
    key: '3',
    meta: true,
    priority: 22,
    description: '跳转到媒体库',
    category: '导航',
  },
  {
    id: 'goto-tasks',
    label: '⌘4',
    key: '4',
    meta: true,
    priority: 23,
    description: '跳转到任务协同',
    category: '导航',
  },
  {
    id: 'mute-alerts',
    label: '⌘⇧M',
    key: 'm',
    meta: true,
    shift: true,
    priority: 15,
    description: '切换告警静音',
    category: '告警',
  },
  {
    id: 'dismiss-notification',
    label: 'Escape',
    key: 'escape',
    priority: 5,
    description: '关闭弹窗/面板',
    category: '全局',
  },
  {
    id: 'toggle-fullscreen',
    label: '⌘⇧F',
    key: 'f',
    meta: true,
    shift: true,
    priority: 30,
    description: '切换全屏模式',
    category: '全局',
  },
];

// ── Utility ──

function normalizeKey(key: string): string {
  return key.toLowerCase();
}

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (target as HTMLElement).isContentEditable
  );
}

function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutMatch): boolean {
  const eventMeta = event.metaKey || event.ctrlKey;
  const eventShift = event.shiftKey;
  const eventAlt = event.altKey;

  return (
    normalizeKey(event.key) === shortcut.key &&
    eventMeta === shortcut.meta &&
    eventShift === shortcut.shift &&
    eventAlt === shortcut.alt
  );
}

function formatShortcut(shortcut: Omit<ShortcutDefinition, 'onTrigger'>): string {
  const parts: string[] = [];
  if (shortcut.meta) parts.push('⌘');
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push('⌥');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('');
}

// ── Hook ──

export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<Map<string, RegisteredShortcut>>(new Map());
  const shortcutsRef = useRef<Map<string, RegisteredShortcut>>(new Map());

  // Keep ref in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  /** Register a shortcut */
  const register = useCallback((shortcut: ShortcutDefinition) => {
    setShortcuts((prev) => {
      const next = new Map(prev);
      const existing = next.get(shortcut.id);

      // Only update if priority is higher or no existing
      if (!existing || (shortcut.priority ?? 100) <= existing.priority) {
        next.set(shortcut.id, { ...shortcut, priority: shortcut.priority ?? 100 });
      }
      return next;
    });
  }, []);

  /** Unregister a shortcut */
  const unregister = useCallback((id: string) => {
    setShortcuts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /** Register multiple shortcuts at once */
  const registerAll = useCallback(
    (defs: ShortcutDefinition[]) => {
      defs.forEach(register);
    },
    [register],
  );

  /** Unregister multiple shortcuts */
  const unregisterAll = useCallback(
    (ids: string[]) => {
      ids.forEach(unregister);
    },
    [unregister],
  );

  // Global keydown listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentShortcuts = shortcutsRef.current;

      if (currentShortcuts.size === 0) return;

      // Find matching shortcuts
      const matches: RegisteredShortcut[] = [];

      currentShortcuts.forEach((shortcut) => {
        const shortcutMatch: ShortcutMatch = {
          key: normalizeKey(shortcut.key),
          meta: shortcut.meta ?? false,
          shift: shortcut.shift ?? false,
          alt: shortcut.alt ?? false,
        };

        if (matchesShortcut(event, shortcutMatch)) {
          matches.push(shortcut);
        }
      });

      if (matches.length === 0) return;

      // Sort by priority
      matches.sort((a, b) => a.priority - b.priority);

      // Check if we're in an input field
      const inInput = isInputElement(event.target);

      // Find first applicable shortcut
      for (const match of matches) {
        if (inInput && !match.allowInInput) continue;

        event.preventDefault();
        event.stopPropagation();
        match.onTrigger();
        return; // Only trigger highest priority match
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  /** Get all registered shortcuts (for command palette) */
  const getAllShortcuts = useCallback((): RegisteredShortcut[] => {
    return Array.from(shortcutsRef.current.values()).sort(
      (a, b) => a.priority - b.priority,
    );
  }, []);

  /** Get shortcuts by category */
  const getShortcutsByCategory = useCallback(
    (category: string): RegisteredShortcut[] => {
      return getAllShortcuts().filter((s) => s.category === category);
    },
    [getAllShortcuts],
  );

  /** Check if a shortcut combination is already registered */
  const isRegistered = useCallback(
    (key: string, meta?: boolean, shift?: boolean, alt?: boolean, excludeId?: string) => {
      const targetKey = normalizeKey(key);
      for (const shortcut of shortcutsRef.current.values()) {
        if (excludeId && shortcut.id === excludeId) continue;
        if (
          normalizeKey(shortcut.key) === targetKey &&
          (shortcut.meta ?? false) === (meta ?? false) &&
          (shortcut.shift ?? false) === (shift ?? false) &&
          (shortcut.alt ?? false) === (alt ?? false)
        ) {
          return true;
        }
      }
      return false;
    },
    [],
  );

  return {
    shortcuts,
    register,
    unregister,
    registerAll,
    unregisterAll,
    getAllShortcuts,
    getShortcutsByCategory,
    isRegistered,
  };
}

export { formatShortcut, isInputElement };
export type { RegisteredShortcut };
export default useKeyboardShortcuts;
