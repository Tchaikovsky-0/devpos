---
name: "frontend-stability"
description: "前端稳定性保障专家 - 确保前端稳定性，提供系统化调试。当发生前端错误、用户报告控制台错误，或前端开发工作前后时调用此技能。"
---

# Frontend Stability Skill

> **目标**: 确保前端开发工作稳定，极少出现报错，并提供高效的错误调试流程

---

## 🎯 核心功能

### 1. 前端稳定性保障
- 代码质量检查
- 依赖版本管理
- 构建配置优化
- 运行时错误预防

### 2. 错误诊断与修复
- Console错误分析
- 错误堆栈追踪
- 根因定位
- 快速修复方案

### 3. 最佳实践指导
- 错误边界处理
- 异步操作规范
- 状态管理优化
- 性能监控

---

## 📋 使用场景

### 场景1: 开发前检查
```
用户: "我要开始前端开发，帮我检查一下环境"
触发: frontend-stability skill
动作: 
  1. 检查依赖完整性
  2. 验证构建配置
  3. 检查TypeScript错误
  4. 运行lint检查
```

### 场景2: Console错误调试
```
用户: "前端报错了，console错误如下：
      Error: Cannot read properties of undefined (reading 'map')
          at StreamList.tsx:25:15"
触发: frontend-stability skill
动作:
  1. 分析错误类型
  2. 定位错误位置
  3. 查找相关代码
  4. 提供修复方案
```

### 场景3: 构建失败
```
用户: "pnpm build 失败了"
触发: frontend-stability skill
动作:
  1. 分析构建日志
  2. 定位失败原因
  3. 检查依赖冲突
  4. 提供解决方案
```

---

## 🔧 错误处理流程

### Step 1: 错误收集
```yaml
用户提供:
  - Console错误信息（完整复制）
  - 错误发生场景
  - 操作步骤（可选）
  
Agent分析:
  - 错误类型识别
  - 错误位置定位
  - 影响范围评估
```

### Step 2: 错误分类

| 错误类型 | 优先级 | 处理方式 |
|---------|--------|---------|
| TypeError | P0 | 立即修复 |
| ReferenceError | P0 | 立即修复 |
| SyntaxError | P0 | 立即修复 |
| Network Error | P1 | 检查API/网络 |
| Warning | P2 | 评估后处理 |
| Deprecation | P3 | 计划升级 |

### Step 3: 根因分析
```yaml
分析维度:
  1. 代码层面
     - 变量未定义
     - 类型不匹配
     - 空值引用
     - 异步处理不当
  
  2. 依赖层面
     - 版本冲突
     - 缺失依赖
     - 兼容性问题
  
  3. 配置层面
     - 构建配置错误
     - 环境变量缺失
     - 路径配置错误
  
  4. 运行时层面
     - 内存泄漏
     - 事件监听未清理
     - 定时器未清除
```

### Step 4: 修复方案
```yaml
修复原则:
  ✅ 最小化改动
  ✅ 保持向后兼容
  ✅ 添加错误处理
  ✅ 补充单元测试
  ✅ 更新文档

修复步骤:
  1. 定位问题代码
  2. 分析修复方案
  3. 实施修复
  4. 验证修复效果
  5. 补充测试用例
```

---

## 🛡️ 稳定性保障措施

### 1. 代码质量检查

**TypeScript严格模式**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**ESLint配置**
```yaml
必须启用的规则:
  - @typescript-eslint/no-explicit-any: error
  - @typescript-eslint/explicit-function-return-type: warn
  - react-hooks/exhaustive-deps: error
  - no-console: warn (生产环境)
```

### 2. 错误边界处理

**React错误边界**
```tsx
// ✅ 正确示范
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// 使用
<ErrorBoundary>
  <StreamList />
</ErrorBoundary>
```

### 3. 异步操作规范

**Promise处理**
```typescript
// ✅ 正确示范
const fetchStreams = async () => {
  try {
    const response = await api.getStreams()
    setStreams(response.data)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch streams:', error.message)
      setError(error.message)
    }
  } finally {
    setLoading(false)
  }
}

// ❌ 错误示范
const fetchStreams = async () => {
  const response = await api.getStreams() // 无错误处理
  setStreams(response.data)
}
```

**异步状态管理**
```typescript
// ✅ 使用React Query
const { data, error, isLoading } = useQuery({
  queryKey: ['streams'],
  queryFn: fetchStreams,
  retry: 3,
  onError: (err) => {
    console.error('Query failed:', err)
  }
})
```

### 4. 空值安全处理

**可选链和空值合并**
```typescript
// ✅ 正确示范
const streamName = stream?.name ?? 'Unknown'
const streamCount = streams?.length ?? 0

// 安全的数组操作
const firstStream = streams?.[0]
const streamIds = streams?.map(s => s.id) ?? []

// ❌ 错误示范
const streamName = stream.name // 可能报错
const streamCount = streams.length // 可能报错
```

### 5. 类型安全

**类型守卫**
```typescript
// ✅ 类型守卫
const isStream = (obj: unknown): obj is Stream => {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'name' in obj
}

const processData = (data: unknown) => {
  if (isStream(data)) {
    console.log(data.name) // 类型安全
  } else {
    console.error('Invalid stream data')
  }
}
```

---

## 🚨 常见错误模式

### 1. Cannot read properties of undefined

**原因**: 访问未定义对象的属性

**解决方案**:
```typescript
// ❌ 错误
const name = user.profile.name

// ✅ 正确
const name = user?.profile?.name ?? 'Default Name'
```

### 2. Cannot read properties of null

**原因**: 访问null对象的属性

**解决方案**:
```typescript
// ❌ 错误
const element = document.getElementById('root')
element.innerHTML = '...' // element可能为null

// ✅ 正确
const element = document.getElementById('root')
if (element) {
  element.innerHTML = '...'
}
```

### 3. map is not a function

**原因**: 对非数组调用map方法

**解决方案**:
```typescript
// ❌ 错误
{streams.map(s => <StreamCard key={s.id} stream={s} />)}

// ✅ 正确
{Array.isArray(streams) && streams.map(s => 
  <StreamCard key={s.id} stream={s} />
)}
```

### 4. Network Error

**原因**: API请求失败

**解决方案**:
```typescript
// ✅ 完整的错误处理
const fetchData = async () => {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error: Check your connection')
    } else {
      console.error('API error:', error)
    }
    throw error
  }
}
```

### 5. Hydration Error

**原因**: 服务端和客户端渲染不一致

**解决方案**:
```tsx
// ❌ 错误
<div>{Date.now()}</div> // 服务端和客户端时间不同

// ✅ 正确
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <div>Loading...</div>
}

return <div>{Date.now()}</div>
```

---

## 📊 监控与告警

### 开发环境监控
```yaml
必须监控:
  - Console错误数量
  - Network请求失败率
  - 组件渲染错误
  - 内存使用情况

监控工具:
  - React DevTools Profiler
  - Chrome DevTools
  - React Error Boundary
```

### 生产环境监控
```yaml
必须上报:
  - JavaScript错误
  - Promise未捕获错误
  - 资源加载失败
  - API请求失败

上报工具:
  - Sentry
  - LogRocket
  - 自定义上报
```

---

## ✅ 开发前检查清单

### 环境检查
- [ ] Node.js版本正确
- [ ] pnpm版本正确
- [ ] 依赖安装完整
- [ ] 环境变量配置正确

### 代码检查
- [ ] TypeScript无错误
- [ ] ESLint无错误
- [ ] 无console.log (生产)
- [ ] 无debugger语句

### 构建检查
- [ ] 构建成功
- [ ] 无警告（或已评估）
- [ ] Bundle大小合理
- [ ] 资源加载正常

### 运行检查
- [ ] 页面正常渲染
- [ ] 无Console错误
- [ ] API请求正常
- [ ] 路由跳转正常

---

## 🎓 最佳实践

### 1. 防御性编程
```typescript
// ✅ 总是假设数据可能不存在
const getStreamName = (stream: Stream | undefined | null): string => {
  return stream?.name?.trim() ?? 'Unknown Stream'
}
```

### 2. 错误日志规范
```typescript
// ✅ 结构化日志
console.error('Failed to load streams', {
  error: error.message,
  stack: error.stack,
  context: { userId, tenantId },
  timestamp: new Date().toISOString()
})
```

### 3. 渐进式降级
```tsx
// ✅ 优雅降级
const StreamList = ({ streams }: { streams?: Stream[] }) => {
  if (!streams || streams.length === 0) {
    return <EmptyState message="No streams available" />
  }
  
  return (
    <div>
      {streams.map(stream => (
        <ErrorBoundary key={stream.id} fallback={<StreamCardError />}>
          <StreamCard stream={stream} />
        </ErrorBoundary>
      ))}
    </div>
  )
}
```

---

## 🔗 相关资源

- [前端稳定性规则](../../rules/frontend_stability_rules.md)
- [前端性能规范](../../rules/frontend_performance_rules.md)
- [测试规范](../../rules/testing_rules.md)
- [Code Review规范](../../rules/code_review_rules.md)

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**维护者**: 巡检宝前端团队
