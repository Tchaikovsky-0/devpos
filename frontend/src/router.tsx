import React, { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from './components/ui/toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Layout } from './components/Layout';

const Center = lazy(() => import('./routes/Center'));
const Media = lazy(() => import('./routes/Media'));
const AlertsWorkspace = lazy(() => import('./routes/AlertsWorkspace'));
const TasksWorkspace = lazy(() => import('./routes/TasksWorkspace'));
const AssetsWorkspace = lazy(() => import('./routes/AssetsWorkspace'));
const OpenClawWorkspace = lazy(() => import('./routes/OpenClawWorkspace'));
const SystemWorkspace = lazy(() => import('./routes/SystemWorkspace'));
const Login = lazy(() => import('./routes/Login'));

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
    element: <Layout />,
    children: [
      {
        path: '',
        element: <LazyComponent><Center /></LazyComponent>,
      },
      {
        path: 'center',
        element: <LazyComponent><Center /></LazyComponent>,
      },
      {
        path: 'monitor',
        element: <LazyComponent><Center /></LazyComponent>,
      },
      {
        path: 'dashboard',
        element: <LazyComponent><Center /></LazyComponent>,
      },
      {
        path: 'media',
        element: <LazyComponent><Media /></LazyComponent>,
      },
      {
        path: 'media-library',
        element: <LazyComponent><Media /></LazyComponent>,
      },
      {
        path: 'gallery',
        element: <LazyComponent><Media /></LazyComponent>,
      },
      {
        path: 'reports',
        element: <LazyComponent><Media /></LazyComponent>,
      },
      {
        path: 'alerts',
        element: <LazyComponent><AlertsWorkspace /></LazyComponent>,
      },
      {
        path: 'tasks',
        element: <LazyComponent><TasksWorkspace /></LazyComponent>,
      },
      {
        path: 'assets',
        element: <LazyComponent><AssetsWorkspace /></LazyComponent>,
      },
      {
        path: 'sensors',
        element: <LazyComponent><AssetsWorkspace /></LazyComponent>,
      },
      {
        path: 'openclaw',
        element: <LazyComponent><OpenClawWorkspace /></LazyComponent>,
      },
      {
        path: 'ai',
        element: <LazyComponent><OpenClawWorkspace /></LazyComponent>,
      },
      {
        path: 'command',
        element: <LazyComponent><OpenClawWorkspace /></LazyComponent>,
      },
      {
        path: 'system',
        element: <LazyComponent><SystemWorkspace /></LazyComponent>,
      },
      {
        path: 'settings',
        element: <LazyComponent><SystemWorkspace /></LazyComponent>,
      },
      {
        path: 'admin',
        element: <LazyComponent><SystemWorkspace /></LazyComponent>,
      },
      {
        path: '*',
        element: <Navigate to="/center" replace />,
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
