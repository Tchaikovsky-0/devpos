// =============================================================================
// ShortcutHint - 快捷键提示组件
// =============================================================================
// 在按钮、菜单项旁显示键盘快捷键标签。
// 自适应 Mac (⌘) / Windows (Ctrl) 符号。
// =============================================================================

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ── Types ──

export interface ShortcutHintProps {
  /** 快捷键标签，如 "⌘K" 或 "Ctrl+K" */
  shortcut: string;
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md';
  /** 变体 */
  variant?: 'default' | 'muted' | 'accent';
  /** 类名 */
  className?: string;
}

// ── Platform detection ──

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '');
}

function normalizeShortcut(shortcut: string): string {
  // If already has ⌘ symbol, keep as-is (Mac style)
  if (shortcut.includes('⌘') || shortcut.includes('⇧') || shortcut.includes('⌥')) {
    return shortcut;
  }

  // If it's in "Ctrl+Shift+K" format, convert to platform-specific
  if (shortcut.includes('+')) {
    const parts = shortcut.split('+').map((p) => p.trim().toLowerCase());
    const hasCtrl = parts.includes('ctrl');
    const hasShift = parts.includes('shift');
    const hasAlt = parts.includes('alt');

    const key = parts.filter((p) => !['ctrl', 'shift', 'alt', 'cmd', 'meta'].includes(p))[0];
    if (!key) return shortcut;

    const formatted: string[] = [];
    if (isMac()) {
      if (hasCtrl || hasCtrl) formatted.push('⌘');
      if (hasShift) formatted.push('⇧');
      if (hasAlt) formatted.push('⌥');
    } else {
      if (hasCtrl) formatted.push('Ctrl');
      if (hasShift) formatted.push('⇧');
      if (hasAlt) formatted.push('Alt');
    }
    formatted.push(key.toUpperCase());
    return formatted.join('');
  }

  return shortcut;
}

// ── Size Config ──

const SIZE_CONFIG = {
  xs: 'px-1 py-px text-[9px] leading-none gap-0.5',
  sm: 'px-1.5 py-0.5 text-[10px] leading-none gap-0.5',
  md: 'px-2 py-0.5 text-[11px] leading-none gap-1',
} as const;

// ── Variant Config ──

const VARIANT_CONFIG = {
  default: 'bg-bg-void text-text-tertiary border border-border-secondary',
  muted: 'bg-transparent text-text-tertiary',
  accent: 'bg-accent-muted text-accent border border-accent-border',
} as const;

// ── Component ──

export const ShortcutHint: React.FC<ShortcutHintProps> = memo(({
  shortcut,
  size = 'sm',
  variant = 'default',
  className,
}) => {
  const displayShortcut = useMemo(() => normalizeShortcut(shortcut), [shortcut]);

  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded font-mono font-medium whitespace-nowrap select-none',
        SIZE_CONFIG[size],
        VARIANT_CONFIG[variant],
        className,
      )}
      aria-hidden="true"
    >
      {displayShortcut}
    </kbd>
  );
});

ShortcutHint.displayName = 'ShortcutHint';

export default ShortcutHint;
