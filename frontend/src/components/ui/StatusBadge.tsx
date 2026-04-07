import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg-tertiary text-text-secondary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        accent: 'bg-accent/10 text-accent',
      },
      muted: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'success',
        muted: true,
        className: 'bg-success/10 text-success',
      },
      {
        variant: 'warning',
        muted: true,
        className: 'bg-warning/10 text-warning',
      },
      {
        variant: 'error',
        muted: true,
        className: 'bg-error/10 text-error',
      },
      {
        variant: 'info',
        muted: true,
        className: 'bg-info/10 text-info',
      },
      {
        variant: 'accent',
        muted: true,
        className: 'bg-accent/10 text-accent',
      },
      {
        variant: 'default',
        muted: true,
        className: 'bg-bg-tertiary text-text-secondary',
      },
    ],
    defaultVariants: {
      variant: 'default',
      muted: false,
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, muted, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(statusBadgeVariants({ variant, muted }), className)}
      {...props}
    />
  )
);

StatusBadge.displayName = 'StatusBadge';

export { statusBadgeVariants };
