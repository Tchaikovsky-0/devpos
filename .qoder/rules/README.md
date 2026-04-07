# 巡检宝 - 前端综合规范

> **合并版本**: frontend_dev_debug + frontend_performance + frontend_stability
> **版本**: v2.0.0
> **更新日期**: 2026-04-04

---

本文件整合了以下三个规范：
1. `frontend_dev_debug_rules.md` - 开发调试
2. `frontend_performance_rules.md` - 性能优化
3. `frontend_stability_rules.md` - 稳定性保障

---

## 第一部分：开发调试规范

### 1.1 缓存问题快速解决

#### 问题现象
- 刷新页面看不到代码修改
- 修改样式但不生效
- 修改组件但页面没变化
- 控制台报错但代码已修复

#### 一键解决方案

```bash
# 使用清理脚本（推荐）
cd frontend
./clear-cache.sh --restart

# 手动清理
rm -rf .vite node_modules/.cache dist
pnpm dev
```

### 1.2 浏览器缓存清理

| 操作系统 | 快捷键 | 说明 |
|---------|--------|------|
| Mac | `Cmd + Shift + R` | 强制刷新 |
| Windows | `Ctrl + Shift + R` | 强制刷新 |

### 1.3 Vite 开发服务器问题

#### 热更新失效
```bash
# 重启开发服务器
pnpm dev

# 清理缓存
rm -rf .vite
```

#### 端口被占用
```bash
lsof -i :5173
kill -9 <PID>
```

### 1.4 样式问题调试

```yaml
检查清单:
  1. 类名是否正确
  2. 样式优先级是否正确
  3. CSS Modules 是否正确使用
  4. Tailwind 配置是否正确
```

### 1.5 React 组件问题

#### 状态不可变性
```typescript
// ❌ 错误
state.items.push(newItem);

// ✅ 正确
setState([...state.items, newItem]);
```

#### Hooks 依赖
```typescript
// ✅ 正确添加依赖
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 1.6 常见错误速查表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| Module not found | 依赖未安装 | pnpm install |
| Type error | TS类型错误 | 检查类型定义 |
| Cannot read property of undefined | 空值访问 | 添加空值检查 |
| Maximum call stack exceeded | 无限递归 | 检查递归终止条件 |

---

## 第二部分：性能优化规范

### 2.1 组件优化

```typescript
// ✅ React.memo 避免不必要渲染
const StreamCard = React.memo<StreamCardProps>(
  ({ stream, onClick }) => <div onClick={onClick}>{stream.name}</div>,
  (prev, next) => prev.stream.id === next.stream.id
);

// ✅ useMemo 缓存计算
const filteredStreams = useMemo(() => {
  return streams.filter(s => s.status === 'active');
}, [streams]);

// ✅ useCallback 缓存函数
const handleClick = useCallback((id: string) => {
  navigate(`/streams/${id}`);
}, [navigate]);
```

### 2.2 虚拟列表

```typescript
import { FixedSizeList as List } from 'react-window';

const StreamList: React.FC<{ streams: Stream[] }> = ({ streams }) => {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}><StreamCard stream={streams[index]} /></div>
  );

  return <List height={600} itemCount={streams.length} itemSize={80} width="100%">
    {Row}
  </List>;
};
```

### 2.3 代码分割

```typescript
// ✅ 路由级别代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));

// ✅ 组件级别代码分割
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

---

## 第三部分：稳定性保障规范

### 3.1 防御性编程

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
```

### 3.2 快速失败原则

```typescript
// ✅ 立即验证参数
function processStream(id: string) {
  if (!id) {
    throw new Error('Stream ID is required');
  }
  // 继续处理
}

// ✅ 使用类型守卫
function isStream(data: unknown): data is Stream {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

### 3.3 错误处理

```typescript
// ✅ 使用 ErrorBoundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <div>出错了</div>;
    }
    return this.props.children;
  }
}
```

### 3.4 TypeScript 严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 第四部分：开发流程最佳实践

### 4.1 日常开发流程

```yaml
1. 启动: pnpm dev
2. 开发: 保存自动热更新
3. 问题: 硬刷新 → 清理缓存 → 重启
4. 提交: lint → type-check → test
```

### 4.2 调试技巧

```typescript
// ✅ 打印对象（避免引用问题）
console.log(JSON.parse(JSON.stringify(obj)));

// ✅ 打印表格
console.table(array);

// ✅ 计时
console.time('timer');
// ... 代码
console.timeEnd('timer');
```

### 4.3 推荐开发环境

```yaml
Node.js: >= 18.0.0 (推荐 20.x)
包管理器: pnpm
IDE: VS Code
必装插件:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - Tailwind CSS IntelliSense
```

---

## 第五部分：禁止事项

```yaml
❌ 禁止直接修改 node_modules 中的文件
❌ 禁止提交 .vite、dist、node_modules/.cache
❌ 禁止在开发环境禁用 ESLint
❌ 禁止忽略 TypeScript 类型错误
❌ 禁止在控制台打印敏感信息
❌ 禁止在生产代码中使用 debugger
❌ 禁止提交 console.log（除非必要）
❌ 禁止使用 any 类型
❌ 禁止硬编码敏感信息
```

---

## 第六部分：快速命令参考

### 缓存清理
```bash
./clear-cache.sh --restart
rm -rf .vite node_modules/.cache dist
```

### 开发命令
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm lint         # 代码检查
pnpm type-check   # 类型检查
pnpm test         # 运行测试
```

### 依赖管理
```bash
pnpm install              # 安装依赖
pnpm add package-name    # 添加依赖
rm -rf node_modules && pnpm install  # 清理重装
```

---

## 📚 关联规范

- [CORE_RULES.md](CORE_RULES.md) - 核心规则
- [performance_optimization_rules.md](performance_optimization_rules.md) - 性能优化
- [project_rules.md](project_rules.md) - 项目规则

---

**最后更新**: 2026-04-04
**版本**: v2.0.0
**合并来源**: 
- frontend_dev_debug_rules.md
- frontend_performance_rules.md
- frontend_stability_rules.md
