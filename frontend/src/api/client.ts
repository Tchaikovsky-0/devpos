// =============================================================================
// API Client - HTTP 客户端封装
// =============================================================================

const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8094';
const API_BASE_URL = (rawBase.startsWith('http') ? rawBase : '') + '/api/v1';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------
export interface ApiErrorBody {
  code: number;
  message: string;
  details?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Request config
// ---------------------------------------------------------------------------
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  /** When true the response is returned as a Blob (for file downloads) */
  responseType?: 'json' | 'blob' | 'text';
}

// ---------------------------------------------------------------------------
// ApiClient class
// ---------------------------------------------------------------------------
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // -------------------------------------------------------------------------
  // Core request
  // -------------------------------------------------------------------------
  private async request<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const { params, responseType = 'json', ...restConfig } = config;

    // Build full URL
    let fullUrl = `${this.baseUrl}${url}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    // Default headers — skip Content-Type for FormData (browser sets boundary)
    const isFormData = restConfig.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...((restConfig.headers as Record<string, string>) || {}),
    };

    // Attach auth token
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Execute request
    let response: Response;
    try {
      response = await fetch(fullUrl, {
        ...restConfig,
        headers,
      });
    } catch (networkError) {
      throw new ApiError(0, {
        code: 0,
        message: (networkError instanceof Error) ? networkError.message : '网络连接失败，请检查网络后重试',
      });
    }

    // ------ Auto-refresh token ------
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
      localStorage.setItem('token', newToken);
    }

    // ------ Handle error responses ------
    if (!response.ok) {
      // 401 → clear auth & redirect to login
      if (response.status === 401) {
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // Try to parse error body
      let errorBody: ApiErrorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {
          code: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw new ApiError(response.status, errorBody);
    }

    // ------ Handle successful responses ------
    if (responseType === 'blob') {
      return response.blob() as Promise<T>;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------------
  async get<T>(url: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return this.request<T>(url, { method: 'GET', params });
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(url, {
      method: 'POST',
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    });
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async del<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  /** Alias kept for backward-compatibility */
  async delete<T>(url: string): Promise<T> {
    return this.del<T>(url);
  }

  /** Download a file as Blob */
  async getBlob(url: string, params?: Record<string, string | number | undefined | null>): Promise<Blob> {
    return this.request<Blob>(url, { method: 'GET', params, responseType: 'blob' });
  }

  /** Upload with FormData (multipart) */
  async upload<T>(url: string, formData: FormData): Promise<T> {
    return this.post<T>(url, formData);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
