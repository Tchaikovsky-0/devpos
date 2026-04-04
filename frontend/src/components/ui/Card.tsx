import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'glass' | 'accent' | 'interactive';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  animated?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'surface-panel',
  glass: 'border border-border bg-bg-base/78 backdrop-blur-xl',
  accent: 'surface-panel border-accent/25 bg-accent/5',
  interactive: 'surface-panel cursor-pointer hover:border-border-emphasis hover:bg-bg-tertiary',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      animated = false,
      className,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      'rounded-2xl transition-all duration-normal',
      variantStyles[variant],
      padding !== 'none' && paddingStyles[padding],
      (hover || variant === 'interactive') && 'hover:shadow-panel',
      className,
    );

    if (animated) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={classes}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  bordered = false,
  className,
  ...props
}) => (
  <div
    className={cn(
      'mb-4 flex items-start justify-between gap-4',
      bordered && 'border-b border-border pb-4',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'sm' | 'md' | 'lg';
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  as: Component = 'h3',
  size = 'md',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
  };

  return (
    <Component className={cn(sizeStyles[size], 'text-text-primary', className)} {...props}>
      {children}
    </Component>
  );
};

CardTitle.displayName = 'CardTitle';

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('text-text-secondary', className)} {...props}>
    {children}
  </div>
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  bordered = false,
  className,
  ...props
}) => (
  <div
    className={cn(
      'mt-4 flex items-center justify-end gap-2 pt-4',
      bordered && 'border-t border-border',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';

export default Card;
