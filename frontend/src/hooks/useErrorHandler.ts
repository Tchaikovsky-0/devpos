import { useCallback, useState } from 'react';

// AxiosError type definition (axios not installed)
interface AxiosError<T = unknown> {
  response?: { data: T; status: number };
  request?: unknown;
  message: string;
}

// ErrorCode 错误码定义
export enum ErrorCode {
  // 通用错误
  Success = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  PayloadTooLarge = 413,
  TooManyRequests = 429,
  InternalServerError = 500,
  ServiceUnavailable = 503,

  // 业务错误
  BusinessError = 2000,

  // 认证错误
  AuthError = 3001,
  TokenInvalid = 3002,
  TokenExpired = 3003,
  InsufficientPermission = 3004,

  // 验证错误
  ValidationError = 5001,
  InvalidFormat = 5002,
  MissingField = 5003,

  // 文件错误
  FileTooLarge = 6001,
  InvalidFileType = 6002,
}

// ErrorCategory 错误分类
export type ErrorCategory = 'validation' | 'auth' | 'resource' | 'business' | 'external' | 'internal';

// APIError API错误结构
export interface APIError {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
  detail?: string;
  field?: string;
  help_url?: string;
  trace_id?: string;
}

// ErrorInfo 错误信息
export interface ErrorInfo {
  code: ErrorCode;
  category: ErrorCategory;
  title: string;
  message: string;
  detail?: string;
  showable: boolean;
  retryable: boolean;
}

// useErrorHandler Hook
export function useErrorHandler() {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  // 根据错误码获取友好的错误标题
  const getErrorTitle = useCallback((code: ErrorCode, category: ErrorCategory): string => {
    if (category === 'validation') {
      return '输入验证失败';
    }
    if (category === 'auth') {
      if (code === ErrorCode.Unauthorized) return '登录已过期';
      if (code === ErrorCode.Forbidden) return '权限不足';
      return '认证失败';
    }
    if (category === 'resource') {
      if (code === ErrorCode.NotFound) return '内容不存在';
      if (code === ErrorCode.PayloadTooLarge) return '文件过大';
      return '资源错误';
    }
    if (category === 'business') {
      return '业务操作失败';
    }
    if (category === 'external') {
      return '服务暂时不可用';
    }
    if (category === 'internal') {
      return '服务器错误';
    }
    return '操作失败';
  }, []);

  // 判断是否可重试
  const isRetryable = useCallback((code: ErrorCode): boolean => {
    // 网络错误、超时、服务不可用等情况可重试
    const retryableCodes = [
      ErrorCode.InternalServerError,
      ErrorCode.ServiceUnavailable,
      ErrorCode.TooManyRequests,
    ];
    return retryableCodes.includes(code);
  }, []);

  // 判断是否应该显示给用户
  const isShowable = useCallback((_category: ErrorCategory): boolean => {
    void _category;
    // 所有错误都可以显示
    return true;
  }, []);

  // 解析错误响应
  const parseError = useCallback((err: unknown): ErrorInfo => {
    // 默认为未知错误
    const defaultError: ErrorInfo = {
      code: ErrorCode.InternalServerError,
      category: 'internal',
      title: '操作失败',
      message: '发生了未知错误，请稍后重试',
      showable: true,
      retryable: true,
    };

    // Axios错误处理
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as AxiosError<APIError>;
      const response = axiosError.response;

      if (response) {
        const data = response.data;

        // API错误响应
        if (data && typeof data === 'object' && 'code' in data) {
          return {
            code: data.code,
            category: data.category || 'internal',
            title: getErrorTitle(data.code, data.category || 'internal'),
            message: data.message || '操作失败',
            detail: data.detail,
            showable: isShowable(data.category || 'internal'),
            retryable: isRetryable(data.code),
          };
        }

        // HTTP状态码错误
        return {
          code: response.status,
          category: response.status >= 500 ? 'internal' : 'business',
          title: getErrorTitle(response.status, response.status >= 500 ? 'internal' : 'business'),
          message: getHTTPErrorMessage(response.status),
          showable: true,
          retryable: isRetryable(response.status),
        };
      }

      // 网络错误
      if (axiosError.request) {
        return {
          code: ErrorCode.ServiceUnavailable,
          category: 'external',
          title: '网络错误',
          message: '无法连接到服务器，请检查网络连接',
          showable: true,
          retryable: true,
        };
      }
    }

    // Error对象
    if (err instanceof Error) {
      return {
        ...defaultError,
        message: err.message,
      };
    }

    return defaultError;
  }, [getErrorTitle, isShowable, isRetryable]);

  // 显示错误
  const showError = useCallback((err: unknown) => {
    const errorInfo = parseError(err);
    setError(errorInfo);
    setIsErrorVisible(true);

    // 开发环境打印详细错误
    if (import.meta.env.DEV) {
      console.error('🔴 Error:', errorInfo);
    }
  }, [parseError]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
    setIsErrorVisible(false);
  }, []);

  // 处理重试
  const retry = useCallback((callback?: () => void) => {
    clearError();
    if (callback) {
      callback();
    }
  }, [clearError]);

  return {
    error,
    isErrorVisible,
    showError,
    clearError,
    retry,
    parseError,
  };
}

// 获取HTTP错误的友好消息
function getHTTPErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: '请求参数有误，请检查输入',
    401: '登录已过期，请重新登录',
    403: '没有权限执行此操作',
    404: '请求的内容不存在',
    408: '请求超时，请重试',
    413: '上传的文件过大',
    415: '不支持的文件类型',
    429: '操作过于频繁，请稍后重试',
    500: '服务器发生错误，请稍后重试',
    502: '网关错误，服务暂时不可用',
    503: '服务暂时不可用，请稍后重试',
    504: '网关超时，请稍后重试',
  };

  return messages[status] || '操作失败，请稍后重试';
}

// 便捷的错误处理 Hook
export function useHandleAPIError() {
  const errorHandler = useErrorHandler();

  return useCallback((err: unknown, showNotification?: (message: string, type: 'error' | 'warning') => void) => {
    // 解析错误
    const errorInfo = errorHandler.parseError(err);

    // 如果有通知函数，显示通知
    if (showNotification) {
      showNotification(errorInfo.message, 'error');
    }

    // 开发环境打印详细错误
    if (import.meta.env.DEV) {
      console.error('🔴 API Error:', errorInfo);
      console.error('🔴 Original Error:', err);
    }
  }, [errorHandler]);
}
