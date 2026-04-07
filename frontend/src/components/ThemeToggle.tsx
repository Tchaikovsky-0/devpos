import { useEffect, useState } from 'react';
import { MoonStar, SunMedium, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Theme = 'deep' | 'dark' | 'balanced' | 'light';

const VALID_THEMES: readonly Theme[] = ['deep', 'dark', 'balanced', 'light'] as const;

const STORAGE_KEY = 'xunjianbao-theme';

const THEME_CYCLE: readonly Theme[] = ['deep', 'balanced', 'light'];

const THEME_LABELS: Record<Theme, string> = {
  deep: '深境模式',
  dark: '深境模式',
  balanced: '均衡模式',
  light: '清境模式',
};

const detectPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'deep';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme && VALID_THEMES.includes(storedTheme as Theme)) {
    return storedTheme as Theme;
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'deep';
};

const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
};

const getNextTheme = (current: Theme): Theme => {
  const normalized = current === 'dark' ? 'deep' : current;
  const idx = THEME_CYCLE.indexOf(normalized);
  return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
};

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => detectPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const displayTheme = theme === 'dark' ? 'deep' : theme;

  return (
    <button
      type="button"
      onClick={() => setTheme((cur) => getNextTheme(cur))}
      className={cn(
        'surface-panel-muted relative inline-flex h-10 items-center gap-1 rounded-full px-1',
        'text-text-secondary transition-all duration-normal hover:text-text-primary',
      )}
      title={`当前: ${THEME_LABELS[theme]} — 点击切换`}
      aria-label={`当前主题: ${THEME_LABELS[theme]}, 点击切换到${THEME_LABELS[getNextTheme(theme)]}`}
    >
      <span
        className={cn(
          'absolute inset-y-1 w-[calc(33.33%-0.17rem)] rounded-full bg-accent/12 transition-transform duration-normal',
          displayTheme === 'deep' && 'translate-x-0',
          displayTheme === 'balanced' && 'translate-x-[calc(100%+0.25rem)]',
          displayTheme === 'light' && 'translate-x-[calc(200%+0.5rem)]',
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-normal',
          displayTheme === 'deep' ? 'text-accent' : 'text-text-tertiary',
        )}
        title="深境模式"
      >
        <MoonStar className="h-4 w-4" />
      </span>
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-normal',
          displayTheme === 'balanced' ? 'text-accent' : 'text-text-tertiary',
        )}
        title="均衡模式"
      >
        <Monitor className="h-4 w-4" />
      </span>
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-normal',
          displayTheme === 'light' ? 'text-accent' : 'text-text-tertiary',
        )}
        title="清境模式"
      >
        <SunMedium className="h-4 w-4" />
      </span>
    </button>
  );
}

export default ThemeToggle;
