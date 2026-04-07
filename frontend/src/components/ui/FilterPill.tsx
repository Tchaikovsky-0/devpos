import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FilterPillProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
}

export function FilterPill({
  children,
  active = false,
  onClick,
  className,
  icon,
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2',
        'text-xs font-semibold transition-all duration-200 ease-default',
        'select-none cursor-pointer',
        active
          ? 'bg-accent/12 text-accent border border-accent/30 shadow-soft'
          : 'bg-bg-tertiary/60 text-text-secondary border border-border-subtle hover:border-border hover:text-text-primary hover:bg-bg-tertiary hover:shadow-soft active:scale-95',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

interface FilterPillGroupProps {
  children: ReactNode;
  className?: string;
}

export function FilterPillGroup({ children, className }: FilterPillGroupProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}
