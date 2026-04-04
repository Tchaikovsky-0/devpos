import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Info,
  OctagonX,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [] as Toast[],
      toast,
      dismiss: () => undefined,
    };
  }
  return context;
};

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

  const pushToast = useCallback((props: ToastProps) => {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newToast: Toast = { ...props, id };
    setToasts((prev) => [...prev, newToast]);

    const timer = setTimeout(() => {
      dismiss(id);
    }, props.duration ?? 4200);
    timeoutsRef.current.set(id, timer);
  }, [dismiss]);

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
    <ToastContext.Provider value={{ toasts, toast: pushToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, dismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[120] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast: item, onClose }) => {
  const variant = item.variant ?? 'default';
  const variantConfig = {
    default: {
      icon: <Info className="h-4 w-4" />,
      accent: 'text-accent',
      border: 'border-accent/25',
      chip: 'bg-accent/12',
    },
    destructive: {
      icon: <OctagonX className="h-4 w-4" />,
      accent: 'text-error',
      border: 'border-error/25',
      chip: 'bg-error/12',
    },
  } as const;

  const config = variantConfig[variant];

  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn(
        'surface-float animate-enter overflow-hidden rounded-[22px] border p-4',
        config.border,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex h-8 w-8 items-center justify-center rounded-full', config.chip, config.accent)}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          {item.title && <div className="text-sm font-semibold text-text-primary">{item.title}</div>}
          {item.description && (
            <div className="mt-1 text-sm leading-6 text-text-secondary">{item.description}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-primary"
          aria-label="关闭提示"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

let toastFn: ((props: ToastProps) => void) | null = null;

export const setToastFunction = (fn: ((props: ToastProps) => void) | null) => {
  toastFn = fn;
};

export const toast = (props: ToastProps) => {
  if (toastFn) {
    toastFn(props);
  } else {
    console.warn('Toast provider not mounted', props);
  }
};
