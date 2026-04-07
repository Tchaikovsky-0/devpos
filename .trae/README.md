# HTML/JSX 标签验证工具测试

> 这个目录包含 HTML/JSX 标签处理优化的工具和测试

## 测试文件

- `tests/html-tag-validator.test.ts` - 标签验证工具的完整测试用例

## 运行测试

### 使用 Vitest (推荐)

```bash
# 进入 .trae 目录
cd .trae

# 安装依赖
pnpm install

# 运行测试 (监视模式)
pnpm test

# 运行测试 (单次)
pnpm test:run
```

### 使用 Jest (备选)

```bash
# 全局安装 jest (如果需要)
npm install -g jest

# 运行测试
jest tests/html-tag-validator.test.ts
```

## 测试覆盖

```
✅ Void elements: 8个测试
✅ UI 组件: 10个测试
✅ 块级元素: 7个测试
✅ Fragment: 4个测试
✅ 嵌套验证: 8个测试
✅ 巡检宝特定场景: 6个测试
✅ 性能测试: 2个测试
✅ 边界情况: 5个测试

总计: 50+ 测试用例
```

## 工具函数

```typescript
import {
  getTagType,        // 获取标签类型
  shouldSelfClose,   // 判断是否自闭合
  validateTagClosing, // 验证标签闭合
  checkNesting,      // 检查嵌套结构
  getQuickHint       // 获取快速提示
} from '../utils/html-tag-validator';
```

## 快速参考

查看 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) 获取标签闭合规则速查。
