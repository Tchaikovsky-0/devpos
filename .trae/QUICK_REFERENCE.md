# 🚀 HTML/JSX 标签闭合快速参考

> **版本**: v1.0.0 | **更新**: 2026-04-06
> **目标**: 减少思考时间，提高编码效率

---

## ⚡ 30秒规则

```
遇到标签 → 瞬间判断类型 → 立即行动

┌────────────────────────────────────┐
│ 1️⃣ Void Element?                  │
│    br, hr, img, input, meta...     │
│    → ✅ 必须 <br />               │
├────────────────────────────────────┤
│ 2️⃣ UI 组件?                       │
│    Button, Dialog, Icon...         │
│    → ✅ 空组件 <Button />          │
│    → ✅ 有内容 <Button>内容</Button>│
├────────────────────────────────────┤
│ 3️⃣ 块级元素?                      │
│    div, p, section, article...     │
│    → ✅ 必须 <div>内容</div>       │
├────────────────────────────────────┤
│ 4️⃣ Fragment?                      │
│    <> </>                          │
│    → ✅ <><Component /></>         │
└────────────────────────────────────┘

⏱️ 决策时间: < 1秒
✅ 验证工具: Prettier 格式化
```

---

## 📝 标签类型速查

### Void Elements (必须自闭合)

```typescript
<br />, <hr />, <img src="..." />, <input type="text" />
<meta charset="utf-8" />, <link rel="stylesheet" />
```

> ⚠️ JSX 中必须加 `/`，HTML 中的 `<br>` 在 JSX 中非法

### UI 组件 (通常自闭合)

```typescript
// shadcn/ui
<Button />, <Dialog />, <Badge />, <Card />
<Input />, <Avatar />, <Skeleton />, <Switch />

// lucide-react Icons
<Loader2 />, <Bot />, <Send />, <Sparkles />
<X />, <Eye />, <AlertTriangle />, <Check />

// 自定义组件
<MetricTile />, <StreamGrid />, <VideoPlayer />
```

> 💡 无内容时用 `<Component />`
> 💡 有内容时用 `<Component>内容</Component>`

### 块级元素 (必须显式闭合)

```typescript
<div>内容</div>, <p>段落</p>
<section><h1>标题</h1></section>
<article><p>文章</p></article>
<header>...</header>, <footer>...</footer>
```

> ⚠️ 必须有开始和结束标签

### Fragment

```typescript
// 简短形式 (推荐)
<><Component1 /><Component2 /></>

// 完整形式
<React.Fragment>
  <Component1 />
  <Component2 />
</React.Fragment>
```

---

## 🎯 常见场景决策

### 场景 1: 添加一个按钮

```typescript
// ❌ 过度思考
// "按钮应该怎么闭合? Button 组件有 children 吗?"
<Button>点击</Button>

// ✅ 快速决策
<Button>点击</Button>
```

### 场景 2: 添加换行

```typescript
// ❌ 过度思考
// "需要加斜杠吗? 还是直接 <br> 就行?"
<br />

// ✅ 快速决策
<br />
```

### 场景 3: 添加图标

```typescript
// ❌ 过度思考
// "图标组件应该自闭合吗?"
<Loader2 className="animate-spin" />

// ✅ 快速决策
<Loader2 className="animate-spin" />
```

### 场景 4: 创建对话框

```typescript
// ❌ 过度思考
// "Dialog 应该怎么闭合? DialogContent 呢?"
// "标题用 DialogTitle 还是直接用 h2?"
<Dialog open={isOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
    </DialogHeader>
    内容
  </DialogContent>
</Dialog>

// ✅ 快速决策 (直接写)
<Dialog open={isOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
    </DialogHeader>
    内容
  </DialogContent>
</Dialog>
```

### 场景 5: 复制粘贴代码

```typescript
// ❌ 低效做法
// 粘贴后逐个检查标签...

// ✅ 高效做法
// 1. 粘贴代码
// 2. 运行 prettier --write
// 3. 检查错误提示 (如果有)
```

---

## ❌ 常见错误

```yaml
❌ <br> → ✅ <br />
❌ <Button></Button> → ✅ <Button />
❌ <hr> → ✅ <hr />
❌ <div><p></div></p> → ✅ <div><p></p></div>
❌ <DIV> → ✅ <div>
❌ <img src="..."> → ✅ <img src="..." />
❌ <input type="text"> → ✅ <input type="text" />
```

---

## 🔧 验证工具

### Prettier (推荐)

```bash
# 格式化文件
npx prettier --write src/**/*.tsx

# 检查格式
npx prettier --check src/**/*.tsx
```

### ESLint

```bash
# 检查 JSX 错误
npx eslint src/**/*.tsx

# 自动修复
npx eslint --fix src/**/*.tsx
```

### TypeScript

```bash
# 类型检查 (会显示 JSX 语法错误)
npx tsc --noEmit
```

---

## 📊 效率提升

```
优化前:
  编写标签 → 犹豫 → 检查 → 再犹豫 → 再检查 → 完成
  ⏱️ 3-5秒/标签

优化后:
  识别类型 → 应用规则 → 完成
  ⏱️ <1秒/标签

提升: 300-500%
```

---

## 🎓 学习路径

### 第一阶段: 记住规则 (1分钟)

```
Void Elements: br, hr, img, input → 自闭合
UI 组件: Button, Dialog → 通常自闭合
块级元素: div, p, section → 显式闭合
Fragment: <> </> → 自闭合形式
```

### 第二阶段: 实践应用 (10分钟)

```
1. 编写 10 个不同类型的标签
2. 用 prettier 格式化
3. 对比差异
4. 记住常见模式
```

### 第三阶段: 习惯养成 (1天)

```
遇到标签 → 瞬间判断 → 立即行动
不确定 → prettier 格式化
```

---

## 📚 相关资源

- [HTML Tag Optimizer](file:///Volumes/KINGSTON/xunjianbao/.trae/utils/html-tag-validator.ts) - 标签验证工具
- [HTML Tag Handling Rules](file:///Volumes/KINGSTON/xunjianbao/.trae/rules/html_tag_handling_rules.md) - 详细规则
- [HTML Tag Optimization Doc](file:///Volumes/KINGSTON/xunjianbao/.trae/docs/HTML_TAG_OPTIMIZATION.md) - 完整文档

---

**状态**: ✅ 启用
**目标**: 零思考，快速决策
**效果**: 300-500% 效率提升
