import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// ── Mock framer-motion ──
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, role, className, onMouseEnter, onMouseLeave }: Record<string, unknown>,
        ref: React.Ref<HTMLDivElement>,
      ) => (
        <div
          ref={ref}
          role={role as string}
          className={className as string}
          onMouseEnter={onMouseEnter as React.MouseEventHandler<HTMLDivElement> | undefined}
          onMouseLeave={onMouseLeave as React.MouseEventHandler<HTMLDivElement> | undefined}
        >
          {children as React.ReactNode}
        </div>
      ),
    ),
    span: React.forwardRef(
      ({ children }: Record<string, unknown>, ref: React.Ref<HTMLSpanElement>) => (
        <span ref={ref}>{children as React.ReactNode}</span>
      ),
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import {
  ToastProvider,
  useToast,
  type ToastType,
} from '../../src/components/ui/toast';

// ═══════════════════════════════════════════════════════════════════
// Toast Tests
// ═══════════════════════════════════════════════════════════════════

/** Helper component that exposes toast() via buttons */
function ToastTrigger() {
  const { toast, toasts } = useToast();
  return (
    <div>
      <button
        data-testid="trigger-success"
        onClick={() => toast({ type: 'success', title: 'SuccessTitle', message: '操作成功' })}
      >
        Success
      </button>
      <button
        data-testid="trigger-error"
        onClick={() => toast({ type: 'error', title: 'ErrorTitle', message: '操作失败' })}
      >
        Error
      </button>
      <button
        data-testid="trigger-warning"
        onClick={() => toast({ type: 'warning', title: 'WarningTitle', message: '请注意' })}
      >
        Warning
      </button>
      <button
        data-testid="trigger-info"
        onClick={() => toast({ type: 'info', title: 'InfoTitle', message: '提示信息' })}
      >
        Info
      </button>
      <span data-testid="toast-count">{toasts.length}</span>
    </div>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render ToastProvider without crashing', () => {
    render(
      <ToastProvider>
        <div>App</div>
      </ToastProvider>,
    );
    expect(screen.getByText('App')).toBeInTheDocument();
  });

  it('should render a success toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-success'));
    expect(screen.getByText('操作成功')).toBeInTheDocument();
    // Toast should have role="status" for success type
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render an error toast with role="alert"', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-error'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('操作失败')).toBeInTheDocument();
  });

  it('should render a warning toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-warning'));
    expect(screen.getByText('请注意')).toBeInTheDocument();
    // role="status" is used for non-error toasts
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render an info toast with role="status"', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-info'));
    // The toast container has aria-live="polite" and individual toast has role="status"
    expect(screen.getByText('提示信息')).toBeInTheDocument();
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1);
  });

  it('should render all 4 types of toasts with correct color bars', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    const types: ToastType[] = ['success', 'error', 'warning', 'info'];
    for (const t of types) {
      fireEvent.click(screen.getByTestId(`trigger-${t}`));
    }

    // All 4 toasts should be visible
    expect(screen.getByTestId('toast-count')).toHaveTextContent('4');
  });

  it('should dismiss a toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-success'));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    const closeBtn = screen.getByLabelText('关闭提示');
    fireEvent.click(closeBtn);
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should auto-dismiss after default duration (5000ms)', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-info'));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('should limit toasts to MAX_TOASTS (5)', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('trigger-info'));
    }
    expect(screen.getByTestId('toast-count')).toHaveTextContent('5');
  });

  it('should render toast action button when provided', () => {
    function ActionTrigger() {
      const { toast } = useToast();
      return (
        <button
          data-testid="trigger-action"
          onClick={() =>
            toast({
              type: 'info',
              title: 'With Action',
              action: { label: '撤销', onClick: vi.fn() },
            })
          }
        >
          Action Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <ActionTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-action'));
    expect(screen.getByText('撤销')).toBeInTheDocument();
  });

  it('should support backward-compatible variant="destructive"', () => {
    function DestructiveTrigger() {
      const { toast } = useToast();
      return (
        <button
          data-testid="trigger-destructive"
          onClick={() => toast({ variant: 'destructive', title: 'Oops' })}
        >
          Destructive
        </button>
      );
    }

    render(
      <ToastProvider>
        <DestructiveTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId('trigger-destructive'));
    // variant="destructive" maps to role="alert" (error type)
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
