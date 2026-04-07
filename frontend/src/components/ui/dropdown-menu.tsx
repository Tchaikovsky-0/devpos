import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  forwardRef,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu');
  }
  return context;
};

const assignRef = <T,>(ref: React.ForwardedRef<T>, value: T) => {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    (ref as React.MutableRefObject<T>).current = value;
  }
};

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ children, className = '', onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(false);
      }
    };

    return (
      <button
        type="button"
        ref={ref}
        className={cn(
          'relative flex w-full select-none items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150',
          'hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:bg-bg-tertiary',
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      if (open) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, className = '', asChild = false, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdownMenu();

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: React.MouseEventHandler<HTMLButtonElement>;
      }>;

      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          child.props.onClick?.(event);
          if (!event.defaultPrevented) {
            setOpen(!open);
          }
        },
        ref: (node: HTMLButtonElement | null) => {
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          assignRef(ref, node);
        },
      });
    }

    return (
      <button
        type="button"
        ref={(node) => {
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          assignRef(ref, node);
        }}
        className={cn(className)}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ children, className = '', align = 'end', ...props }, ref) => {
    const { open, triggerRef, contentRef } = useDropdownMenu();
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (!open) return undefined;

      const updatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const contentWidth = contentRef.current?.offsetWidth ?? 208;
        const viewportPadding = 12;
        let left = rect.right - contentWidth;

        if (align === 'start') {
          left = rect.left;
        } else if (align === 'center') {
          left = rect.left + rect.width / 2 - contentWidth / 2;
        }

        setPosition({
          top: rect.bottom + 8,
          left: Math.min(
            Math.max(left, viewportPadding),
            window.innerWidth - contentWidth - viewportPadding,
          ),
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }, [align, contentRef, open, triggerRef]);

    if (!open) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          assignRef(ref, node);
        }}
        className={cn(
          'fixed z-[95] min-w-[12rem] overflow-hidden rounded-lg bg-bg-secondary border border-border-subtle shadow-lg p-1.5 animate-in zoom-in-95 duration-150',
          className,
        )}
        style={{ top: position.top, left: position.left }}
        {...props}
      >
        {children}
      </div>,
      document.body,
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-border', className)}
        {...props}
      />
    );
  }
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};

export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
};
