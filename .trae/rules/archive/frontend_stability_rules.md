# 前端稳定性规则 - 确保开发工作稳定可靠

> **强制执行 | 高优先级**
> **关联 Skill**: [frontend-stability](../skills/frontend-stability/SKILL.md)
> 版本: v1.0.0
> 创建日期: 2026-04-02

---

## 📌 规范概述

本规范旨在确保巡检宝前端项目的**稳定性**，减少运行时错误，提供高效的错误调试流程。

**核心目标**：
- ✅ 极少出现运行时错误
- ✅ 快速定位和修复错误
- ✅ 防御性编程习惯
- ✅ 完善的错误处理机制

---

## 🎯 核心原则

### 1. 防御性编程

```yaml
核心思想:
  → 永远不要相信外部数据
  → 永远不要相信用户输入
  → 永远不要相信API返回
  → 总是假设最坏的情况

实践方法:
  ✅ 可选链: user?.profile?.name
  ✅ 空值合并: value ?? defaultValue
  ✅ 类型守卫: isStream(data)
  ✅ 错误边界: ErrorBoundary组件
  ✅ 默认值: const [data, setData] = useState([])
```

### 2. 快速失败原则

```yaml
核心思想:
  → 错误越早发现越好
  → 错误越早修复成本越低

实践方法:
  ✅ TypeScript严格模式
  ✅ ESLint严格规则
  ✅ 单元测试覆盖
  ✅ 类型检查
  ✅ 运行时验证
```

### 3. 优雅降级原则

```yaml
核心思想:
  → 即使出错也要保持用户体验
  → 不要让一个错误导致整个应用崩溃

实践方法:
  ✅ 错误边界捕获错误
  ✅ 降级UI显示
  ✅ 重试机制
  ✅ 缓存数据
  ✅ 离线模式
```

---

## 📋 错误分类与处理

### 1. TypeError

**常见场景**：
```typescript
// ❌ 错误示范
const name = user.profile.name  // Cannot read properties of undefined
const count = streams.length    // Cannot read properties of null
const result = data.map(...)    // map is not a function
```

**预防措施**：
```typescript
// ✅ 正确示范
const name = user?.profile?.name ?? 'Unknown'
const count = streams?.length ?? 0
const result = Array.isArray(data) ? data.map(...) : []
```

**处理优先级**: P0 - 立即修复

---

### 2. ReferenceError

**常见场景**：
```typescript
// ❌ 错误示范
console.log(undefinedVar)  // undefinedVar is not defined
```

**预防措施**：
```typescript
// ✅ 正确示范
// 1. 确保变量已定义
let undefinedVar = ''

// 2. 使用TypeScript检查
// TypeScript会在编译时发现未定义的变量
```

**处理优先级**: P0 - 立即修复

---

### 3. SyntaxError

**常见场景**：
```typescript
// ❌ 错误示范
const obj = { name: 'test' }  // 缺少逗号
const arr = [1, 2, 3         // 缺少括号
```

**预防措施**：
```typescript
// ✅ 正确示范
// 1. 使用ESLint自动检查
// 2. 使用Prettier自动格式化
// 3. 配置编辑器实时检查
```

**处理优先级**: P0 - 立即修复

---

### 4. Network Error

**常见场景**：
```typescript
// ❌ 错误示范
const response = await fetch('/api/data')  // 无错误处理
const data = response.json()               // 可能失败
```

**预防措施**：
```typescript
// ✅ 正确示范
try {
  const response = await fetch('/api/data')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
  return data
} catch (error) {
  console.error('API request failed:', error)
  // 降级处理
  return cachedData || []
}
```

**处理优先级**: P1 - 检查API/网络

---

### 5. React Hydration Error

**常见场景**：
```tsx
// ❌ 错误示范
<div>{Date.now()}</div>  // 服务端和客户端时间不同
<div>{Math.random()}</div>
```

**预防措施**：
```tsx
// ✅ 正确示范
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <Skeleton />
}

return <div>{Date.now()}</div>
```

**处理优先级**: P1 - 影响用户体验

---

## 🛡️ 稳定性保障措施

### R1: TypeScript严格模式

**规则描述**: 必须启用TypeScript严格模式

**配置要求**：
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**检查清单**：
- [ ] strict: true
- [ ] noImplicitAny: true
- [ ] strictNullChecks: true
- [ ] 无TypeScript编译错误

---

### R2: ESLint严格规则

**规则描述**: 必须配置ESLint严格规则

**配置要求**：
```yaml
必须启用的规则:
  - @typescript-eslint/no-explicit-any: error
  - @typescript-eslint/explicit-function-return-type: warn
  - @typescript-eslint/no-unused-vars: error
  - react-hooks/exhaustive-deps: error
  - react-hooks/rules-of-hooks: error
  - no-console: warn (生产环境)
  - no-debugger: error

推荐启用的规则:
  - @typescript-eslint/prefer-nullish-coalescing: warn
  - @typescript-eslint/prefer-optional-chain: warn
  - @typescript-eslint/strict-boolean-expressions: warn
```

**检查清单**：
- [ ] ESLint配置完整
- [ ] 无ESLint错误
- [ ] 警告已评估
- [ ] pre-commit hook配置

---

### R3: 错误边界处理

**规则描述**: 关键组件必须包裹错误边界

**实现要求**：
```tsx
// ✅ 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 上报错误
    logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// 使用示例
<ErrorBoundary fallback={<StreamCardError />}>
  <StreamCard stream={stream} />
</ErrorBoundary>
```

**必须使用错误边界的场景**：
- ✅ 整个应用根组件
- ✅ 页面级组件
- ✅ 列表项组件
- ✅ 第三方组件
- ✅ 复杂业务组件

---

### R4: 异步操作规范

**规则描述**: 所有异步操作必须正确处理错误

**实现要求**：
```typescript
// ✅ Promise错误处理
const fetchData = async () => {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch failed:', error)
    // 降级处理
    return null
  } finally {
    setLoading(false)
  }
}

// ✅ React Query错误处理
const { data, error, isLoading } = useQuery({
  queryKey: ['streams'],
  queryFn: fetchStreams,
  retry: 3,
  onError: (err) => {
    console.error('Query failed:', err)
    toast.error('加载数据失败')
  }
})
```

**禁止事项**：
```yaml
❌ 绝对禁止:
  - 无try-catch的async函数
  - 未处理的Promise rejection
  - 无错误处理的fetch请求
  - 无loading状态的异步操作
```

---

### R5: 空值安全处理

**规则描述**: 所有可能为空的值必须安全处理

**实现要求**：
```typescript
// ✅ 可选链操作符
const name = user?.profile?.name

// ✅ 空值合并操作符
const count = streams?.length ?? 0

// ✅ 数组安全操作
const firstItem = array?.[0]
const mappedItems = Array.isArray(array) ? array.map(...) : []

// ✅ 对象安全操作
const value = obj?.key ?? defaultValue

// ✅ 函数安全调用
const result = func?.() ?? defaultValue
```

**检查清单**：
- [ ] 所有对象属性访问使用可选链
- [ ] 所有可能为null/undefined的值有默认值
- [ ] 数组操作前检查是否为数组
- [ ] 函数调用前检查是否存在

---

### R6: 类型安全

**规则描述**: 必须使用类型守卫确保类型安全

**实现要求**：
```typescript
// ✅ 类型守卫函数
const isStream = (obj: unknown): obj is Stream => {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'name' in obj
}

// 使用类型守卫
const processData = (data: unknown) => {
  if (isStream(data)) {
    // 类型安全，data是Stream类型
    console.log(data.name)
  } else {
    console.error('Invalid data')
  }
}

// ✅ 类型断言（谨慎使用）
const stream = data as Stream  // 仅在确定类型时使用
```

**禁止事项**：
```yaml
❌ 绝对禁止:
  - 使用 any 类型
  - 滥用类型断言
  - 不检查类型直接使用
  - 忽略TypeScript错误
```

---

## 🚨 错误调试流程

### Step 1: 错误信息收集

**用户提供**：
```yaml
必须提供:
  - Console错误信息（完整复制）
  - 错误发生场景
  - 操作步骤

可选提供:
  - 截图/录屏
  - 网络请求信息
  - 相关代码片段
```

**示例**：
```
用户: 前端报错了，console错误如下：

Error: Cannot read properties of undefined (reading 'map')
    at StreamList (StreamList.tsx:25:15)
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)

场景: 打开视频流列表页面时出现
操作: 点击左侧菜单"视频管理"
```

---

### Step 2: 错误分析

**Agent分析流程**：
```yaml
1. 错误类型识别
   - TypeError: 类型错误
   - ReferenceError: 引用错误
   - SyntaxError: 语法错误
   - NetworkError: 网络错误

2. 错误位置定位
   - 文件名: StreamList.tsx
   - 行号: 25
   - 列号: 15
   - 函数: StreamList

3. 错误原因分析
   - streams未定义
   - streams为null
   - streams不是数组

4. 影响范围评估
   - 影响功能: 视频流列表
   - 影响用户: 所有用户
   - 严重程度: P0
```

---

### Step 3: 代码定位

**Agent操作**：
```yaml
1. 读取错误文件
   - 打开 StreamList.tsx
   - 定位到第25行

2. 分析上下文
   - 查看streams定义
   - 查看数据来源
   - 查看props传递

3. 查找相关代码
   - 父组件传值
   - API调用
   - 状态管理
```

---

### Step 4: 修复方案

**修复原则**：
```yaml
✅ 最小化改动
   - 只修改必要的代码
   - 不重构无关代码

✅ 保持向后兼容
   - 不破坏现有功能
   - 考虑边界情况

✅ 添加错误处理
   - 空值检查
   - 类型检查
   - 默认值

✅ 补充测试
   - 单元测试
   - 边界测试

✅ 更新文档
   - 代码注释
   - API文档
```

**修复示例**：
```tsx
// ❌ 原始代码（有bug）
const StreamList = ({ streams }: { streams: Stream[] }) => {
  return (
    <div>
      {streams.map(s => <StreamCard key={s.id} stream={s} />)}
    </div>
  )
}

// ✅ 修复后代码
const StreamList = ({ streams }: { streams?: Stream[] }) => {
  // 空值检查
  if (!streams || streams.length === 0) {
    return <EmptyState message="暂无视频流" />
  }
  
  return (
    <div>
      {streams.map(s => (
        <ErrorBoundary key={s.id} fallback={<StreamCardError />}>
          <StreamCard stream={s} />
        </ErrorBoundary>
      ))}
    </div>
  )
}
```

---

### Step 5: 验证修复

**验证清单**：
- [ ] 错误已修复
- [ ] 无新的错误
- [ ] 功能正常
- [ ] 边界情况处理
- [ ] 单元测试通过
- [ ] 无性能问题

---

## 📊 监控与告警

### 开发环境监控

**必须监控**：
```yaml
Console监控:
  - 错误数量
  - 错误类型
  - 错误频率

Network监控:
  - 请求失败率
  - 响应时间
  - 状态码分布

Performance监控:
  - 组件渲染时间
  - 内存使用
  - CPU占用
```

**监控工具**：
```yaml
Chrome DevTools:
  - Console面板: 错误日志
  - Network面板: 网络请求
  - Performance面板: 性能分析
  - Memory面板: 内存分析

React DevTools:
  - Profiler: 组件性能
  - Components: 组件树
```

---

### 生产环境监控

**必须上报**：
```yaml
JavaScript错误:
  - 错误消息
  - 错误堆栈
  - 用户信息
  - 设备信息
  - 发生时间

Promise错误:
  - unhandledrejection
  - 错误原因

资源加载错误:
  - JS文件
  - CSS文件
  - 图片
  - 字体

API错误:
  - HTTP状态码
  - 错误响应
  - 请求参数
```

**上报工具**：
```yaml
推荐工具:
  - Sentry: 错误追踪
  - LogRocket: 用户回放
  - BugSnag: 错误监控
  - 自定义上报: 灵活定制
```

---

## ✅ 开发前检查清单

### 环境检查
- [ ] Node.js版本符合要求
- [ ] pnpm版本符合要求
- [ ] 依赖安装完整
- [ ] 环境变量配置正确

### 代码检查
- [ ] TypeScript无编译错误
- [ ] ESLint无错误
- [ ] 无console.log（生产环境）
- [ ] 无debugger语句
- [ ] 无TODO注释

### 构建检查
- [ ] pnpm build成功
- [ ] 无构建警告（或已评估）
- [ ] Bundle大小合理
- [ ] 资源加载正常

### 运行检查
- [ ] pnpm dev启动成功
- [ ] 页面正常渲染
- [ ] 无Console错误
- [ ] API请求正常
- [ ] 路由跳转正常

---

## ⚠️ 禁止事项

```yaml
🚫 绝对禁止:
  - 使用 any 类型
  - 无错误处理的异步操作
  - 直接访问可能为null的对象属性
  - 无空值检查的数组操作
  - 忽略TypeScript错误
  - 忽略ESLint错误
  - 提交有Console错误的代码
  - 无错误边界的复杂组件
  - 未捕获的Promise rejection
  - 硬编码的敏感信息
```

---

## 🔗 相关文档

- [前端稳定性 Skill](../skills/frontend-stability/SKILL.md)
- [前端性能规范](./frontend_performance_rules.md)
- [测试规范](./testing_rules.md)
- [Code Review规范](./code_review_rules.md)
- [全局开发规则](./global_dev_rules.md)

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**维护者**: 巡检宝前端团队

---

> **提醒**: 稳定性是前端开发的基石。记住：**防御性编程 + 快速失败 + 优雅降级 = 稳定可靠的前端应用** 🛡️
