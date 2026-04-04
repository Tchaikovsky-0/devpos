import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store'
import { AppRouter } from './router'
import './index.css'

if (typeof document !== 'undefined') {
  const storedTheme = window.localStorage.getItem('xunjianbao-theme')
  const theme =
    storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : window.matchMedia?.('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
}

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 分钟缓存
      staleTime: 5 * 60 * 1000,
      // 10 分钟垃圾回收
      gcTime: 10 * 60 * 1000,
      // 失败重试 1 次
      retry: 1,
      // 窗口聚焦不重新获取
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
