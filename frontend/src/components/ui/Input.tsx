import React, { forwardRef, useId } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'filled' | 'outline' | 'glass';
type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: InputVariant;
  size?: InputSize;
  error?: string;
  label?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix'> {
  variant?: InputVariant;
  error?: string;
  label?: string;
  hint?: string;
}

const variantStyles: Record<InputVariant, string> = {
  default: 'bg-bg-primary border border-border',
  filled: 'border border-transparent bg-bg-secondary hover:bg-bg-tertiary',
  outline: 'border border-border bg-transparent hover:border-border-strong',
  glass: 'border border-border bg-bg-primary/80 backdrop-blur-xl',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const labelClassName = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary';

const helperClassName = 'text-xs leading-5 text-text-tertiary';

const errorClassName =
  'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]';

const successClassName =
  'border-success focus:border-success';

const controlClassName =
  'w-full rounded-md text-text-primary outline-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-text-tertiary disabled:opacity-50 disabled:cursor-not-allowed hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error,
      label,
      hint,
      prefix,
      suffix,
      className,
      ...props
    },
    ref,
  ) => {
    const hasError = Boolean(error);
    const inputId = useId();
    const helperId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {label && (
          <label htmlFor={inputId} className={labelClassName}>
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {prefix}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={errorId || helperId}
            className={cn(
              controlClassName,
              variantStyles[variant],
              sizeStyles[size],
              prefix && 'pl-11',
              suffix && 'pr-11',
              hasError && errorClassName,
              !hasError && props['aria-describedby']?.includes('success') && successClassName,
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <div id={errorId} className="flex items-center gap-1 text-xs text-error">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <div id={helperId} className={helperClassName}>
            {hint}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface SearchInputProps extends Omit<InputProps, 'prefix'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && onSearch) {
        onSearch((event.target as HTMLInputElement).value);
      }

      onKeyDown?.(event);
    };

    return (
      <Input
        ref={ref}
        prefix={<Search className="h-4 w-4" />}
        type="search"
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  },
);

SearchInput.displayName = 'SearchInput';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      variant = 'default',
      error,
      label,
      hint,
      className,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const textareaId = useId();
    const helperId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {label && (
          <label htmlFor={textareaId} className={labelClassName}>
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={errorId || helperId}
          className={cn(
            controlClassName,
            'min-h-[120px] resize-y px-4 py-3 text-sm leading-6',
            variantStyles[variant],
            hasError && errorClassName,
          )}
          {...props}
        />
        {error && (
          <div id={errorId} className="flex items-center gap-1 text-xs text-error">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <div id={helperId} className={helperClassName}>
            {hint}
          </div>
        )}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

export default Input;
