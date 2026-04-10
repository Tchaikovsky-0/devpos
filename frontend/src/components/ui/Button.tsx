import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-semibold tracking-[-0.01em] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md hover:translate-y-[-1px] hover:shadow-lg hover:from-blue-300 hover:to-blue-600 active:translate-y-0 active:shadow-md',
        primary:
          'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md hover:translate-y-[-1px] hover:shadow-lg hover:from-blue-300 hover:to-blue-600 active:translate-y-0 active:shadow-md',
        destructive:
          'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:translate-y-[-1px] hover:shadow-lg hover:from-red-400 hover:to-red-600 active:translate-y-0 active:shadow-md',
        outline:
          'border border-border bg-bg-elevated text-text-primary hover:border-border-strong hover:bg-bg-tertiary hover:translate-y-[-1px] active:translate-y-0',
        secondary:
          'bg-bg-elevated text-text-primary border border-border hover:bg-bg-tertiary hover:border-border-strong hover:translate-y-[-1px] active:translate-y-0',
        ghost:
          'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        link:
          'rounded-none px-0 text-accent hover:text-accent-light underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 rounded-md',
        sm: 'h-8 px-4 rounded-sm text-xs',
        lg: 'h-11 px-6 text-sm rounded-md',
        icon: 'h-9 w-9 rounded-md',
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
