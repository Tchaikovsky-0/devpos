import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'text-sm font-medium transition-all duration-normal',
    'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    'active:translate-y-px',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white shadow-panel hover:bg-accent-hover',
        primary:
          'bg-accent text-white shadow-panel hover:bg-accent-hover',
        destructive:
          'bg-error text-white shadow-panel hover:bg-error/90',
        outline:
          'border border-border bg-transparent text-text-primary hover:border-border-emphasis hover:bg-bg-surface',
        secondary:
          'surface-panel-muted text-text-primary hover:bg-bg-hover',
        ghost:
          'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
        link:
          'rounded-none px-0 text-accent hover:text-accent-hover',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 px-5 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const iconOnly = size === 'icon' && !children;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), iconOnly && 'gap-0')}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon}
        {children}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
