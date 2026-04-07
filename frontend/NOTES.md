# 开发阶段说明

## 当前状态：开发模式（无登录验证）

为了方便开发，所有页面现在都是可以直接访问的，不需要登录验证。

## 如何启动

```bash
cd frontend
pnpm dev
```

然后访问 http://localhost:5173 即可直接进入主页面。

## 页面列表

- **/** - 监控大屏（首页）
- **/alerts** - 告警中心
- **/monitor** - 视频监控
- **/gallery** - 媒体库
- **/reports** - 报告中心
- **/ai** - AI助手
- **/command** - 命令中心
- **/sensors** - 传感器管理
- **/tasks** - 任务管理
- **/admin** - 管理后台

## 恢复登录验证

当开发完成后，需要恢复登录验证时：

1. 打开 `src/router.tsx`
2. 取消注释 `ProtectedRoute` 相关代码
3. 恢复 `Login` 导入
4. 恢复 `/login` 路由

详细步骤：

```typescript
// 1. 恢复导入
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { Login } from './routes/Login';

// 2. 取消注释 ProtectedRoute
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 3. 添加 /login 路由
{
  path: '/login',
  element: <Login />,
}

// 4. 恢复受保护的路由包裹
element: (
  <ProtectedRoute>
    <Layout />
  </ProtectedRoute>
),
```

## 注意事项

⚠️ 在生产环境中必须恢复登录验证！
⚠️ 当前状态仅适用于开发测试！
