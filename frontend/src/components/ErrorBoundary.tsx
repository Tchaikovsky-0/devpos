/**
 * 错误边界组件 (ErrorBoundary.tsx)
 * 
 * 捕获 React 组件渲染错误，防止整个应用崩溃
 * 提供友好的错误页面和恢复选项
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // 调用外部错误处理回调
    this.props.onError?.(error, errorInfo);
    
    // 生产环境可以在这里上报错误到监控服务
    if (import.meta.env.PROD) {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoBack = () => {
    window.history.back();
    this.handleReset();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认错误页面
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        onReset={this.handleReset}
        onGoBack={this.handleGoBack}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

// 默认错误页面
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  onGoBack: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ error, onReset, onGoBack, onGoHome }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--canvas))] p-4">
      <div className="w-full max-w-md">
        {/* 错误图标 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--error))] to-[rgb(var(--warning))] rounded-full blur-xl opacity-20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--surface))] border border-[rgb(var(--error)/0.3)]">
              <AlertTriangle className="h-10 w-10 text-[rgb(var(--error))]" />
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
            出错了
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
            抱歉，应用遇到了一些问题。请尝试刷新页面或返回上一页。
          </p>
          
          {/* 错误详情（开发环境显示） */}
          {import.meta.env.DEV && error && (
            <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--error)/0.1)] border border-[rgb(var(--error)/0.2)] text-left">
              <p className="text-xs font-mono text-[rgb(var(--error))] break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-[10px] text-[rgb(var(--text-tertiary))] overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent-strong))] text-white font-medium transition-all hover:shadow-lg hover:shadow-[rgb(var(--accent)/0.3)] active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onGoBack}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] font-medium transition-all hover:bg-[rgb(var(--surface-raised))] active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            
            <button
              onClick={onGoHome}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] font-medium transition-all hover:bg-[rgb(var(--surface-raised))] active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              首页
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="mt-6 text-center text-xs text-[rgb(var(--text-tertiary))]">
          如果问题持续存在，请联系技术支持
        </p>
      </div>
    </div>
  );
}

// 异步错误边界包装器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
