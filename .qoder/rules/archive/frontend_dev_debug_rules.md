# 前端开发调试规则

> **解决前端开发中的常见问题：缓存、热更新失效、样式不生效等**
> 版本: v1.0.0
> 创建日期: 2026-04-02

---

## 一、缓存问题快速解决

### 1.1 问题现象

```yaml
常见症状:
  - 刷新页面看不到代码修改
  - 修改样式但不生效
  - 修改组件但页面没变化
  - 控制台报错但代码已修复
  - API 返回旧数据
```

### 1.2 一键解决方案

#### 方案一：使用清理脚本（推荐）

```bash
# 进入前端目录
cd frontend

# 仅清理缓存
./clear-cache.sh

# 清理缓存并重启开发服务器
./clear-cache.sh --restart
```

#### 方案二：手动清理

```bash
# 清理 Vite 缓存
rm -rf .vite

# 清理 node_modules 缓存
rm -rf node_modules/.cache

# 清理构建产物
rm -rf dist

# 重启开发服务器
pnpm dev
```

#### 方案三：npm 脚本（推荐）

```bash
# 清理缓存
pnpm run clear-cache

# 清理并重启
pnpm run dev:fresh
```

---

## 二、浏览器缓存清理

### 2.1 硬刷新（最常用）

| 操作系统 | 快捷键 | 说明 |
|---------|--------|------|
| Mac | `Cmd + Shift + R` | 强制刷新，忽略缓存 |
| Windows/Linux | `Ctrl + Shift + R` | 强制刷新，忽略缓存 |
| Mac | `Cmd + Option + R` | 清除缓存并刷新 |

### 2.2 Service Worker 清理

```yaml
步骤:
  1. 打开开发者工具 (F12)
  2. 进入 Application 标签
  3. 左侧找到 Service Workers
  4. 点击 Unregister 注销所有 Service Worker
  5. 刷新页面
```

### 2.3 完整清理浏览器缓存

```yaml
步骤:
  1. 开发者工具 → Application → Clear storage
  2. 勾选所有选项:
     - Unregister service workers
     - Local and session storage
     - IndexedDB
     - Web SQL
     - Cookies
     - Cache storage
  3. 点击 Clear site data
  4. 刷新页面
```

---

## 三、Vite 开发服务器问题

### 3.1 热更新失效

#### 现象
```yaml
- 修改文件后页面不自动刷新
- 控制台没有 HMR 日志
- 需要手动刷新才能看到修改
```

#### 解决方案

```bash
# 1. 重启开发服务器
# 按 Ctrl+C 停止，然后重新运行
pnpm dev

# 2. 清理 Vite 缓存
rm -rf .vite
pnpm dev

# 3. 检查文件监听限制（Linux）
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 3.2 端口被占用

```bash
# 查找占用端口的进程
lsof -i :5173

# 杀死进程
kill -9 <PID>

# 或使用不同的端口
pnpm dev --port 5174
```

### 3.3 依赖预构建问题

```yaml
现象:
  - 启动时卡在 "Pre-bundling dependencies"
  - 报错 "Failed to resolve dependency"
  - 依赖更新后不生效

解决方案:
  1. 清理缓存: rm -rf .vite
  2. 重新安装: rm -rf node_modules && pnpm install
  3. 强制预构建: pnpm dev --force
```

---

## 四、样式问题调试

### 4.1 CSS 不生效

#### 检查清单

```yaml
1. 检查类名是否正确
   - 使用开发者工具检查元素
   - 查看 Computed 标签

2. 检查样式优先级
   - 是否被其他样式覆盖
   - 使用 !important 测试（仅调试用）

3. 检查 CSS Modules
   - 确认是否使用了 CSS Modules
   - 类名会被编译，检查实际类名

4. 检查 Tailwind CSS
   - 确认类名拼写正确
   - 检查 tailwind.config.js 配置
   - 清理缓存: rm -rf node_modules/.cache
```

### 4.2 Less/Sass 编译错误

```bash
# 清理预编译缓存
rm -rf node_modules/.cache

# 检查语法错误
pnpm lint

# 重新安装依赖
pnpm install
```

---

## 五、React 组件问题

### 5.1 组件不更新

#### 可能原因

```yaml
1. 状态不可变性问题
   - 直接修改 state
   - 数组/对象引用未改变

2. React.memo 过度优化
   - props 引用未改变
   - 浅比较导致不更新

3. key 属性问题
   - 列表项缺少 key
   - key 不唯一或不稳定
```

#### 解决方案

```typescript
// ❌ 错误：直接修改 state
state.items.push(newItem);
setState(state);

// ✅ 正确：创建新引用
setState({
  ...state,
  items: [...state.items, newItem]
});

// ❌ 错误：key 使用索引
{items.map((item, index) => <Item key={index} />)}

// ✅ 正确：key 使用唯一 ID
{items.map(item => <Item key={item.id} />)}
```

### 5.2 Hooks 依赖问题

```typescript
// ❌ 错误：缺少依赖
useEffect(() => {
  fetchData(userId);
}, []); // userId 变化时不会重新执行

// ✅ 正确：添加依赖
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ 正确：使用 useCallback
const fetchUserData = useCallback(() => {
  fetchData(userId);
}, [userId]);

useEffect(() => {
  fetchUserData();
}, [fetchUserData]);
```

---

## 六、网络请求问题

### 6.1 API 请求失败

#### 检查步骤

```yaml
1. 检查网络面板
   - 开发者工具 → Network 标签
   - 查看请求状态码
   - 查看请求/响应内容

2. 检查代理配置
   - vite.config.ts 中的 proxy 配置
   - 后端服务是否启动
   - 端口是否正确

3. 检查 CORS
   - 后端是否配置 CORS
   - 是否允许当前源

4. 检查认证
   - Token 是否过期
   - 请求头是否正确
```

### 6.2 代理配置问题

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8094',
        changeOrigin: true,
        // 如果后端 API 路径不带 /api 前缀
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

---

## 七、开发环境配置

### 7.1 推荐的开发环境

```yaml
Node.js: 
  - 版本: >= 18.0.0
  - 推荐: 20.x LTS

包管理器:
  - 推荐: pnpm (更快、更省空间)
  - 备选: npm / yarn

IDE:
  - 推荐: VS Code
  - 必装插件:
    - ESLint
    - Prettier
    - TypeScript Vue Plugin (Volar)
    - Tailwind CSS IntelliSense
```

### 7.2 VS Code 配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 八、常见错误速查表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Module not found` | 依赖未安装 | `pnpm install` |
| `Type error` | TypeScript 类型错误 | 检查类型定义 |
| `Unexpected token` | 语法错误 | 检查代码语法 |
| `Cannot read property of undefined` | 空值访问 | 添加空值检查 |
| `Maximum call stack size exceeded` | 无限递归 | 检查递归终止条件 |
| `Failed to compile` | 编译错误 | 查看详细错误信息 |
| `HMR connection failed` | 热更新失败 | 重启开发服务器 |
| `Out of memory` | 内存不足 | 增加 Node 内存限制 |

---

## 九、调试技巧

### 9.1 React Developer Tools

```yaml
安装:
  - Chrome: React Developer Tools 扩展
  - Firefox: React Developer Tools 扩展

功能:
  - 查看组件树
  - 检查 props 和 state
  - 追踪组件渲染性能
  - 高亮组件更新
```

### 9.2 控制台调试

```typescript
// 1. 打印对象（避免引用问题）
console.log(JSON.parse(JSON.stringify(obj)));

// 2. 打印表格
console.table(array);

// 3. 分组打印
console.group('Group Name');
console.log('item 1');
console.log('item 2');
console.groupEnd();

// 4. 计时
console.time('timer');
// ... 代码
console.timeEnd('timer');

// 5. 堆栈追踪
console.trace();
```

### 9.3 断点调试

```yaml
1. 代码断点
   - 在代码中写 debugger;
   - 浏览器会自动暂停

2. 浏览器断点
   - Sources 标签 → 点击行号
   - 右键可设置条件断点

3. XHR 断点
   - Sources 标签 → XHR/fetch Breakpoints
   - 添加 URL 模式
   - 请求时自动暂停
```

---

## 十、性能优化调试

### 10.1 React 渲染性能

```typescript
// 1. 使用 React.memo 避免不必要的渲染
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// 2. 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 3. 使用 useCallback 缓存回调
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 10.2 网络性能

```yaml
1. 使用 React Query / SWR 缓存请求
2. 实现虚拟滚动（react-window / react-virtuoso）
3. 图片懒加载
4. 代码分割（React.lazy + Suspense）
```

---

## 十一、开发流程最佳实践

### 11.1 日常开发流程

```yaml
1. 启动开发服务器
   cd frontend
   pnpm dev

2. 开发代码
   - 保存后自动热更新
   - 浏览器自动刷新

3. 遇到问题时
   - 先尝试硬刷新 (Cmd+Shift+R)
   - 再尝试清理缓存 (./clear-cache.sh)
   - 最后重启开发服务器

4. 提交代码前
   - 运行 lint: pnpm lint
   - 运行类型检查: pnpm type-check
   - 运行测试: pnpm test
```

### 11.2 问题排查流程

```yaml
1. 确认问题
   - 清晰描述问题现象
   - 记录错误信息
   - 截图或录屏

2. 复现问题
   - 找到最小复现步骤
   - 确认是否每次都出现

3. 定位原因
   - 使用开发者工具
   - 查看控制台错误
   - 检查网络请求

4. 解决问题
   - 查阅文档
   - 搜索错误信息
   - 询问团队成员

5. 验证修复
   - 确认问题已解决
   - 测试相关功能
   - 更新文档
```

---

## 十二、快速命令参考

### 12.1 缓存清理

```bash
# 清理所有缓存并重启
./clear-cache.sh --restart

# 仅清理 Vite 缓存
rm -rf .vite

# 完整清理（包括 node_modules）
rm -rf .vite node_modules/.cache dist
pnpm dev
```

### 12.2 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 代码检查
pnpm lint

# 格式化代码
pnpm prettier
```

### 12.3 依赖管理

```bash
# 安装依赖
pnpm install

# 更新依赖
pnpm update

# 添加新依赖
pnpm add package-name

# 添加开发依赖
pnpm add -D package-name

# 清理并重装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 十三、禁止事项

```yaml
❌ 禁止直接修改 node_modules 中的文件
❌ 禁止提交 .vite、dist、node_modules/.cache
❌ 禁止在开发环境禁用 ESLint
❌ 禁止忽略 TypeScript 类型错误
❌ 禁止在控制台打印敏感信息
❌ 禁止在生产代码中使用 debugger
❌ 禁止提交 console.log（除非必要）
```

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
