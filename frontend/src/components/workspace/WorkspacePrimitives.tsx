import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type WorkspaceTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const toneClassMap: Record<WorkspaceTone, string> = {
  neutral: 'bg-bg-surface text-text-secondary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
};

interface WorkspacePanelProps {
  children: ReactNode;
  className?: string;
}

export function WorkspacePanel({ children, className }: WorkspacePanelProps) {
  return (
    <section
      className={cn(
        'rounded-[28px] border border-border bg-bg-secondary p-4 md:p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  extra?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  extra,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.16em] text-text-tertiary">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-text-primary">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p> : null}
      </div>
      {extra ? <div className="shrink-0">{extra}</div> : null}
    </div>
  );
}

interface StatusPillProps {
  children: ReactNode;
  tone?: WorkspaceTone;
  className?: string;
}

export function StatusPill({ children, tone = 'neutral', className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        toneClassMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface MetricTileProps {
  label: string;
  value: string | number;
  helper?: string;
  className?: string;
}

export function MetricTile({ label, value, helper, className }: MetricTileProps) {
  return (
    <div className={cn('rounded-[22px] border border-border bg-bg-primary/65 px-4 py-3', className)}>
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">{value}</p>
      {helper ? <p className="mt-1 text-xs text-text-secondary">{helper}</p> : null}
    </div>
  );
}
