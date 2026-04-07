import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  OctagonX,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  /** @deprecated Use `type` instead. Kept for backward compat */
  variant?: 'default' | 'destructive';
  type?: ToastType;
  title?: string;
  /** Alias kept for backward compat — same as `message` */
  description?: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
}

interface Toast extends ToastProps {
  id: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [] as Toast[],
      toast,
      dismiss: () => undefined,
      clearAll: () => undefined,
    };
  }
  return context;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((timer) => clearTimeout(timer));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  const pushToast = useCallback(
    (props: ToastProps) => {
      const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToast: Toast = { ...props, id };
      setToasts((prev) => [...prev, newToast].slice(-MAX_TOASTS));

      const duration = props.duration ?? DEFAULT_DURATION;
      const timer = setTimeout(() => dismiss(id), duration);
      timeoutsRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    setToastFunction(pushToast);
    return () => {
      setToastFunction(null);
      timeouts.forEach((timer) => clearTimeout(timer));
      timeouts.clear();
    };
  }, [pushToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast: pushToast, dismiss, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} timeoutsRef={timeoutsRef} />
    </ToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Container (fixed top-right)
// ---------------------------------------------------------------------------

interface ToastContainerProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
  timeoutsRef: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, dismiss, timeoutsRef }) => {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            onClose={() => dismiss(t.id)}
            timeoutsRef={timeoutsRef}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/** Resolve the effective ToastType from props (backward compat with variant) */
function resolveType(item: Toast): ToastType {
  if (item.type) return item.type;
  if (item.variant === 'destructive') return 'error';
  return 'info';
}

const TYPE_CONFIG: Record<
  ToastType,
  {
    icon: React.ReactNode;
    accent: string;
    border: string;
    chip: string;
    bar: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    accent: 'text-green-400',
    border: 'border-green-500/25',
    chip: 'bg-green-500/12',
    bar: 'bg-green-500',
  },
  error: {
    icon: <OctagonX className="h-4 w-4" />,
    accent: 'text-red-400',
    border: 'border-red-500/25',
    chip: 'bg-red-500/12',
    bar: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    accent: 'text-yellow-400',
    border: 'border-yellow-500/25',
    chip: 'bg-yellow-500/12',
    bar: 'bg-yellow-500',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    accent: 'text-blue-400',
    border: 'border-blue-500/25',
    chip: 'bg-blue-500/12',
    bar: 'bg-blue-500',
  },
};

interface ToastCardProps {
  toast: Toast;
  onClose: () => void;
  timeoutsRef: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast: item, onClose, timeoutsRef }) => {
  const type = resolveType(item);
  const config = TYPE_CONFIG[type];
  const body = item.message || item.description;

  // Pause / resume timer on hover
  const remainingRef = useRef(item.duration ?? DEFAULT_DURATION);
  const startTimeRef = useRef(Date.now());

  const handleMouseEnter = useCallback(() => {
    const timer = timeoutsRef.current.get(item.id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(item.id);
    }
    remainingRef.current -= Date.now() - startTimeRef.current;
  }, [item.id, timeoutsRef]);

  const handleMouseLeave = useCallback(() => {
    const remaining = Math.max(remainingRef.current, 500);
    const timer = setTimeout(onClose, remaining);
    timeoutsRef.current.set(item.id, timer);
    startTimeRef.current = Date.now();
    remainingRef.current = remaining;
  }, [item.id, onClose, timeoutsRef]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-lg border bg-bg-secondary shadow-lg',
        config.border,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left color bar */}
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-lg', config.bar)} />

      <div className="flex items-start gap-3 py-3 pl-4 pr-3">
        <div
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            config.chip,
            config.accent,
          )}
        >
          {config.icon}
        </div>

        <div className="min-w-0 flex-1">
          {item.title && (
            <div className="text-sm font-semibold text-text-primary">{item.title}</div>
          )}
          {body && (
            <div className="mt-0.5 text-sm leading-relaxed text-text-secondary">{body}</div>
          )}
          {item.action && (
            <button
              type="button"
              onClick={item.action.onClick}
              className={cn(
                'mt-2 text-xs font-medium underline underline-offset-2 transition-colors',
                config.accent,
                'hover:brightness-125',
              )}
            >
              {item.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="关闭提示"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Standalone toast() function (works outside React tree)
// ---------------------------------------------------------------------------

let toastFn: ((props: ToastProps) => void) | null = null;

export const setToastFunction = (fn: ((props: ToastProps) => void) | null): void => {
  toastFn = fn;
};

export const toast = (props: ToastProps): void => {
  if (toastFn) {
    toastFn(props);
  } else {
    console.warn('Toast provider not mounted', props);
  }
};

// ---------------------------------------------------------------------------
// Convenience re-exports kept for backward compat with index.ts barrel
// ---------------------------------------------------------------------------

export const Toast = ToastCard;
export const ToastViewport = ToastContainer;
export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm font-semibold text-text-primary">{children}</div>
);
export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm text-text-secondary">{children}</div>
);
export const ToastClose: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="p-1 text-text-tertiary hover:text-text-primary" aria-label="关闭">
    <X className="h-4 w-4" />
  </button>
);
export const ToastAction: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="text-xs font-medium text-accent underline">
    {label}
  </button>
);
