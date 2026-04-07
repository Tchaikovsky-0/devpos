import React, { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from './components/ui/toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { MainLayout } from './components/layout/MainLayout';

// 新设计系统页面
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const AlertInbox = lazy(() => import('./pages/AlertInbox'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));

// 保留原有页面
const Login = lazy(() => import('./routes/Login'));

// 路由元数据，供面包屑和导航使用
export const ROUTE_META: Record<string, { title: string; icon?: string }> = {
  '/dashboard': { title: '监控大屏' },
  '/alerts': { title: '告警处置' },
  '/media': { title: '媒体库' },
  '/system': { title: '系统设置' },
};

// 页面加载组件
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" color="primary" />
      <span className="text-text-secondary text-sm">加载中...</span>
    </div>
  </div>
);

// 懒加载组件包装器
const LazyComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyComponent><Login /></LazyComponent>,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyComponent><CommandCenter /></LazyComponent>,
      },
      {
        path: 'videos',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'center',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'monitor',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'alerts',
        element: <LazyComponent><AlertInbox /></LazyComponent>,
      },
      {
        path: 'media',
        element: <LazyComponent><MediaLibrary /></LazyComponent>,
      },
      {
        path: 'media-library',
        element: <Navigate to="/media" replace />,
      },
      {
        path: 'system',
        element: <LazyComponent><SystemSettings /></LazyComponent>,
      },
      {
        path: 'settings',
        element: <Navigate to="/system" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export function AppRouter() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
