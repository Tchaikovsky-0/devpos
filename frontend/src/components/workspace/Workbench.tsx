import React from 'react';
import { cn } from '@/lib/utils';

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}> = ({ eyebrow, title, description, actions, meta, className }) => (
  <div className={cn('flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between', className)}>
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-text-primary">{title}</h1>
      {description && <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>}
      {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const SectionBlock: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, description, actions, className, bodyClassName, children }) => (
  <section className={cn('rounded-[24px] border border-border bg-bg-secondary', className)}>
    <div className="border-b border-border px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-tertiary">{title}</h2>
          {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
    <div className={cn('p-5', bodyClassName)}>{children}</div>
  </section>
);

export const MetaPill: React.FC<{
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}> = ({ label, value, tone = 'default', className }) => {
  const toneStyles = {
    default: 'bg-bg-surface text-text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-error/10 text-error',
  };

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium', toneStyles[tone], className)}>
      <span className="text-text-tertiary">{label}</span>
      <span>{value}</span>
    </div>
  );
};

export const SegmentedControl: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}> = ({ value, onChange, options, className }) => (
  <div className={cn('inline-flex rounded-full border border-border bg-bg-surface p-1', className)}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={cn(
          'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
          value === option.value
            ? 'bg-accent text-white shadow-panel'
            : 'text-text-secondary hover:text-text-primary',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const EmptyPanel: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, className }) => (
  <div className={cn('flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-bg-surface px-6 text-center', className)}>
    <h3 className="text-lg font-semibold tracking-[-0.03em] text-text-primary">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-text-secondary">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
