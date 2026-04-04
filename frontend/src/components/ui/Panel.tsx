import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PanelProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  variant?: 'default' | 'glass' | 'accent';
  onClose?: () => void;
}

const variantStyles = {
  default: 'surface-panel',
  glass: 'border border-border bg-bg-base/78 backdrop-blur-xl',
  accent: 'surface-panel border-accent/25 bg-accent/5',
};

export const Panel: React.FC<PanelProps> = ({
  children,
  title,
  subtitle,
  actions,
  collapsible = false,
  defaultExpanded = true,
  className,
  headerClassName,
  bodyClassName,
  variant = 'default',
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <section className={cn('overflow-hidden rounded-[22px]', variantStyles[variant], className)}>
      {(title || actions || onClose || collapsible) && (
        <div
          className={cn(
            'flex items-start justify-between gap-4 border-b border-border px-5 py-4',
            collapsible && 'cursor-pointer',
            headerClassName,
          )}
          onClick={collapsible ? () => setIsExpanded((expanded) => !expanded) : undefined}
        >
          <div className="flex items-start gap-3">
            {collapsible && (
              <button
                type="button"
                className="mt-0.5 rounded-md p-1 text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-primary"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsExpanded((expanded) => !expanded);
                }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-tertiary">{title}</h3>}
              {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            {onClose && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {(!collapsible || isExpanded) && <div className={cn('p-5', bodyClassName)}>{children}</div>}
    </section>
  );
};

export default Panel;
