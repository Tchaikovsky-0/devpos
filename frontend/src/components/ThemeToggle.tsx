import { useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'xunjianbao-theme';

const detectPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => detectPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
      className={cn(
        'surface-panel-muted relative inline-flex h-10 items-center gap-1 rounded-full px-1',
        'text-text-secondary transition-all duration-normal hover:text-text-primary',
      )}
      title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      <span
        className={cn(
          'absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-accent/12 transition-transform duration-normal',
          theme === 'dark' ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-normal',
          theme === 'dark' ? 'text-accent' : 'text-text-tertiary',
        )}
      >
        <MoonStar className="h-4 w-4" />
      </span>
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-normal',
          theme === 'light' ? 'text-accent' : 'text-text-tertiary',
        )}
      >
        <SunMedium className="h-4 w-4" />
      </span>
    </button>
  );
}

export default ThemeToggle;
