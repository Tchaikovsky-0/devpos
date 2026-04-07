// =============================================================================
// Feature Flag Configuration - Mock/真实模式开关
// =============================================================================

/**
 * Feature Flag Hook
 * Reads VITE_USE_MOCK from environment variable.
 * Supports runtime override via X-Use-Mock response header from backend.
 *
 * Level 1: 环境变量 (全局默认)
 *   VITE_USE_MOCK=true  → 默认使用 Mock 数据
 *   VITE_USE_MOCK=false → 默认使用真实 API
 *
 * Level 2: 后端响应头 (运行时覆盖)
 *   后端在 X-Mock-Mode 响应头中返回当前模式
 *   前端读取并同步到 localStorage
 *
 * Level 3: UI 切换
 *   用户可在设置页面切换模式
 *   切换后写入 localStorage 并刷新
 */

const STORAGE_KEY = 'xunjianbao_mock_mode';

// Get initial value from env or localStorage
function getInitialMockMode(): boolean {
  // localStorage override (user preference)
  if (localStorage.getItem(STORAGE_KEY) !== null) {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }
  // Environment variable default
  return import.meta.env.VITE_USE_MOCK !== 'false';
}

import { useState, useEffect } from 'react';

export interface FeatureFlags {
  useMock: boolean;
  setMockMode: (value: boolean) => void;
  isLoaded: boolean;
}

/**
 * React hook for accessing feature flags.
 * Syncs with backend X-Mock-Mode header on API responses.
 */
export function useFeatureFlags(): FeatureFlags {
  const [useMock, setUseMock] = useState<boolean>(getInitialMockMode);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    // Listen for backend X-Mock-Mode header updates
    // The backend middleware sets this header on protected routes
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      const mockModeHeader = response.headers.get('X-Mock-Mode');
      if (mockModeHeader !== null) {
        const backendMockMode = mockModeHeader === 'true';
        // Sync localStorage with backend mode
        localStorage.setItem(STORAGE_KEY, String(backendMockMode));
        setUseMock(backendMockMode);
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const setMockMode = (value: boolean) => {
    setUseMock(value);
    localStorage.setItem(STORAGE_KEY, String(value));
    // Reload to reinitialize API clients
    window.location.reload();
  };

  return { useMock, setMockMode, isLoaded };
}

/**
 * Non-hook accessor for current mock mode.
 * Use inside components: useFeatureFlags().useMock
 * Use outside components: FEATURE_USE_MOCK
 */
export const FEATURE_USE_MOCK = getInitialMockMode();
