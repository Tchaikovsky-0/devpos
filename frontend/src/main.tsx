import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store'
import { AppRouter } from './router'
import { OpenClawProvider } from './store/contexts/OpenClawContext'
import { SplashScreen } from './components/SplashScreen'
import './index.css'

if (typeof document !== 'undefined') {
  const validThemes = ['deep', 'dark', 'balanced', 'light'] as const
  const storedTheme = window.localStorage.getItem('xunjianbao-theme')
  const theme =
    storedTheme && validThemes.includes(storedTheme as (typeof validThemes)[number])
      ? storedTheme
      : window.matchMedia?.('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'deep'
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

/**
 * 应用根组件
 * 管理启动屏和应用加载流程
 */
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('正在启动巡检宝...')

  // 模拟加载进度，独立于API请求
  useEffect(() => {
    const stages = [
      { progress: 15, text: '正在加载主题...', delay: 200 },
      { progress: 30, text: '正在验证身份...', delay: 400 },
      { progress: 55, text: '正在加载系统配置...', delay: 600 },
      { progress: 75, text: '正在同步监控数据...', delay: 800 },
      { progress: 90, text: '正在初始化视频流...', delay: 1000 },
      { progress: 100, text: '加载完成', delay: 1200 },
    ]

    const timers: NodeJS.Timeout[] = []

    stages.forEach(({ progress: p, text, delay }) => {
      const timer = setTimeout(() => {
        setProgress(p)
        setStatusText(text)
      }, delay)
      timers.push(timer)
    })

    // 所有阶段完成后隐藏启动屏
    const completeTimer = setTimeout(() => {
      setIsLoading(false)
    }, 1800)

    timers.push(completeTimer)

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <>
      <SplashScreen
        isLoading={isLoading}
        progress={progress}
        statusText={statusText}
      />
      <AppRouter />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <OpenClawProvider>
          <App />
        </OpenClawProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
