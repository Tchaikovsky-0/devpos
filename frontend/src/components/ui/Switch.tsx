import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md';
}

const sizeStyles = {
  sm: {
    track: 'h-6 w-10',
    knob: 'h-4 w-4',
    on: 'translate-x-[18px]',
    off: 'translate-x-[3px]',
  },
  md: {
    track: 'h-7 w-12',
    knob: 'h-5 w-5',
    on: 'translate-x-[23px]',
    off: 'translate-x-[3px]',
  },
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      size = 'md',
      className,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const styles = sizeStyles[size];

    return (
      <button
        {...props}
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !disabled) {
            onCheckedChange?.(!checked);
          }
        }}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full border transition-all duration-normal',
          'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          styles.track,
          checked
            ? 'border-accent/30 bg-accent/20 text-accent'
            : 'border-border bg-bg-surface text-text-tertiary hover:border-border-emphasis',
          className,
        )}
      >
        <span
          className={cn(
            'absolute rounded-full bg-white shadow-panel transition-transform duration-normal',
            styles.knob,
            checked ? styles.on : styles.off,
          )}
        />
      </button>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
