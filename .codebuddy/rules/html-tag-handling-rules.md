---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:45:39.684Z
provider: 
---

# AI Agent HTML/JSX 标签处理优化规则

> **目的**: 减少agent在处理前端HTML/JSX标签时的过度思考，提高开发效率
> **版本**: v1.0.0
> **创建日期**: 2026-04-06

---

## 一、快速决策指南

### 1.1 遇到标签时的快速判断流程

```
任务: 编写/修改 JSX 标签
    ↓
问自己: 这个标签属于哪一类？
    ↓
┌─────────────────────────────────────────┐
│ 类型判断 (瞬间完成)                       │
├─────────────────────────────────────────┤
│                                         │
│ Void Element?                           │
│ ├─ 是 (br, hr, img, input...)          │
│ └─ ✅ 必须自闭合: <br />                │
│                                         │
│ UI 组件?                                │
│ ├─ 是 (Button, Dialog, Icon...)         │
│ └─ ✅ 通常自闭合: <Button />            │
│    (有子元素时: <Button>内容</Button>)   │
│                                         │
│ 块级元素?                               │
│ ├─ 是 (div, p, section...)              │
│ └─ ✅ 必须显式闭合: <div>内容</div>       │
│                                         │
│ Fragment?                               │
│ ├─ 是 (<> </>)                          │
│ └─ ✅ 自闭合形式: <>内容</>              │
│                                         │
│ 未知标签?                               │
│ ├─ 大写开头 (Button, MyComponent)      │
│ └─ ✅ 视为组件，自闭合                   │
│                                         │
└─────────────────────────────────────────┘
    ↓
立即行动: 使用正确的闭合方式
```

### 1.2 JSX 标签闭合规则速查表

```yaml
✅ 必须自闭合 (Void Elements):
   <br />, <hr />, <img src="..." />, <input type="text" />
   ❌ 错误: <br> (HTML合法但JSX必须 <br />)

✅ 通常自闭合 (React 组件):
   <Button />, <Dialog />, <Loader2 />
   ✅ 推荐: 空组件用 <Component />
   ⚠️ 例外: 有子元素时 <Button>内容</Button>

✅ 必须显式闭合 (块级元素):
   <div>...</div>, <p>...</p>, <section>...</section>
   ❌ 错误: <div> 缺少 </div>

✅ Fragment 使用:
   简短: <><Component /></>
   完整: <React.Fragment>...</React.Fragment>
```

### 1.3 巡检宝项目常用组件参考

```typescript
// UI 组件 (自闭合)
<Button />, <Input />, <Dialog />, <Badge />
<Loader2 />, <Bot />, <Send />, <Sparkles />

// 复合组件 (需要显式闭合)
<MetricTile>
  <MetricTile.Title>标题</MetricTile.Title>
  <MetricTile.Value>数值</MetricTile.Value>
</MetricTile>

<Dialog open={isOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
    </DialogHeader>
    内容...
  </DialogContent>
</Dialog>

// 块级元素 (显式闭合)
<div className="container">
  <section>
    <article>
      <p>文本内容</p>
    </article>
  </section>
</div>
```

---

## 二、快速决策规则

### 2.1 零思考原则

```yaml
遇到这些情况 → 立即行动，不要犹豫:

✅ 写新组件:
   const MyComponent = () => {
     return <Button>点击</Button>;  // 立即写成这样
   };
   ❌ 不要想: "Button应该怎么闭合?"

✅ 写 void element:
   <br />  // 立即写，自闭合
   ❌ 不要想: "要不要加 / 呢?"

✅ 写嵌套:
   <div>
     <Button>
       <Icon />
       文本
     </Button>
   </div>
   ❌ 不要反复检查: "嵌套顺序对吗?"
      → 如果不确定，用 prettier 格式化即可

✅ 写 fragment:
   <> <Component1 /> <Component2 /> </>
   ❌ 不要想: "用 <> 还是 <Fragment>?"

✅ 复制粘贴:
   粘贴后立即格式化 (prettier)
   ❌ 不要逐个检查标签
```

### 2.2 需要的唯一思考

```yaml
只在以下情况才需要思考:

🔍 复杂嵌套结构:
   - 三层以上的组件嵌套
   - 条件渲染中的标签
   - 循环中的标签

🔍 组件组合模式:
   - 复合组件 (如 MetricTile)
   - 插槽模式 (如 children)
   - HOC 包装

🔍 特殊情况:
   - 动态标签名: <{tagName} />
   - 组件未定义时
   - 第三方库组件
```

### 2.3 决策树

```
遇到标签 X
    ↓
X 是 void element?
├─ 是 → <br /> ✅ 立即完成
└─ 否 ↓
X 是 UI 组件?
├─ 是 → 有 children?
│   ├─ 是 → <Component>children</Component> ✅
│   └─ 否 → <Component /> ✅
└─ 否 ↓
X 是块级元素?
├─ 是 → <tag>...</tag> ✅
└─ 否 ↓
X 是 Fragment?
├─ 是 → <>...</> ✅
└─ 否 ↓
X 大写开头?
├─ 是 → 视为组件，通常 <Component /> ✅
└─ 否 → 视为未知，按块级元素处理 <tag>...</tag> ✅

总时间: < 1秒
```

---

## 三、常见错误预防

### 3.1 Top 5 JSX 标签错误

```yaml
❌ 错误 #1: void element 不自闭合
   <br> → ❌
   <br /> → ✅
   原因: JSX 要求所有标签必须明确闭合

❌ 错误 #2: 空组件不用自闭合
   <Button></Button> → ⚠️ 不推荐
   <Button /> → ✅ 推荐
   原因: 空组件应该简洁

❌ 错误 #3: 块级元素嵌套错误
   <div><span>text</div></span> → ❌
   <div><span>text</span></div> → ✅
   原因: 后开的标签要先关 (LIFO)

❌ 错误 #4: 大小写混淆
   <DIV> → ❌ (HTML)
   <div> → ✅ (JSX)
   原因: JSX 中标签必须小写

❌ 错误 #5: 自闭合块级元素
   <div /> → ⚠️ 不推荐
   <div>...</div> → ✅ 推荐
   原因: 语义上块级元素应该有内容
```

### 3.2 快速修复指南

```typescript
// 错误: <br>
const Fix1 = () => <br />;  // ✅

// 错误: <Button></Button>
const Fix2 = () => <Button />;  // ✅

// 错误: <DIV><P>text</P></DIV>
const Fix3 = () => <div><p>text</p></div>;  // ✅

// 错误: <Mycomponent />
const Fix4 = () => <MyComponent />;  // ✅ 组件名大写

// 错误: <img src="...">
const Fix5 = () => <img src="..." />;  // ✅
```

---

## 四、效率提升技巧

### 4.1 格式化工具优先

```yaml
✅ 最佳实践:
  1. 写代码时不要纠结格式
  2. 写完后用 Prettier 一键格式化
  3. 让工具处理细节

❌ 低效做法:
  - 写一个标签就检查一次闭合
  - 写完后再逐个检查标签
  - 反复犹豫嵌套顺序
```

### 4.2 使用片段模板

```typescript
// 常用片段模板
const templates = {
  // Void element
  br: '<br />',
  
  // 简单组件
  button: '<Button>按钮</Button>',
  icon: '<Loader2 className="animate-spin" />',
  
  // 复杂组件
  dialog: `
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>标题</DialogTitle>
        </DialogHeader>
        内容
      </DialogContent>
    </Dialog>
  `,
  
  // 块级元素
  section: `
    <section>
      <h2>标题</h2>
      <p>内容</p>
    </section>
  `,
};
```

### 4.3 智能感知

```
IDE/Editor 应该提供:
✅ 自动闭合标签
✅ 标签匹配高亮
✅ 格式化预览
✅ 错误提示

这些工具 → agent不需要自己检查
```

---

## 五、测试验证清单

### 5.1 自检清单

```yaml
编写 JSX 代码后，快速检查:

□ Void elements 是否自闭合: <br />, <hr />, <img />
□ 空组件是否简洁: <Button /> (而非 <Button></Button>)
□ 嵌套是否正确: <div><span>...</span></div>
□ 大小写是否正确: <div> 而非 <DIV>
□ Fragment 是否正确: <>...</> 或 <Fragment>...</Fragment>

如果都正确 → ✅ 完成
如果不确定 → 运行 prettier 格式化
```

### 5.2 常见场景验证

```typescript
// 场景 1: 添加一个按钮
// ❌ 过度思考: "按钮应该怎么闭合?"
// ✅ 正确做法: <Button>按钮</Button>

// 场景 2: 添加换行
// ❌ 过度思考: "需要加斜杠吗?"
// ✅ 正确做法: <br />

// 场景 3: 复制粘贴代码
// ❌ 过度思考: "这个标签对吗?"
// ✅ 正确做法: 格式化后检查

// 场景 4: 组件嵌套
// ❌ 过度思考: "嵌套顺序对吗?"
// ✅ 正确做法: 写完格式化，或相信 prettier
```

---

## 六、实战示例

### 6.1 对比：优化前 vs 优化后

```typescript
// ❌ 优化前 (过度思考)
function MyComponent() {
  const handleClick = () => {
    // ...
  };
  
  // "按钮应该怎么闭合?"
  return (
    // "这个div要闭合吗?"
    <div>
      // "button是不是应该自闭合?"
      <button onClick={handleClick}>
        // "按钮文本要不要包个span?"
        点击
      </button>
      // "button闭合了，现在div要闭合"
    </div>
  );
}

// ✅ 优化后 (快速决策)
function MyComponent() {
  const handleClick = () => {
    // ...
  };
  
  return (
    <div>
      <Button onClick={handleClick}>
        点击
      </Button>
    </div>
  );
}
```

### 6.2 实际开发流程

```typescript
// 用户: "添加一个显示加载状态的按钮"
const request = "添加一个显示加载状态的按钮";

// ❌ Agent 过度思考:
// "好的，我需要创建一个按钮组件...
//  按钮应该是这样的: <button>Loading...</button>
//  等等，Button 组件怎么闭合?
//  让我检查一下 Button 的定义...
//  哦，Button 是一个自闭合组件...
//  不对，它可以有 children...
//  那应该用哪个形式?"

// ✅ Agent 快速决策:
// "好的，添加一个带 loading 状态的 Button"
<Button loading={isLoading}>
  提交
</Button>

// 理由: 
// 1. Button 是 UI 组件
// 2. 有 children
// 3. 所以用显式闭合形式
// 决策时间: < 1秒
```

---

## 七、快速参考卡片

### 7.1 一分钟速查

```
📋 JSX 标签闭合规则:

1. Void Elements → 必须自闭合
   br, hr, img, input, meta, link...
   
2. UI 组件 → 通常自闭合
   Button, Dialog, Icon...
   
3. 块级元素 → 必须显式闭合
   div, p, section, article...
   
4. Fragment → 自闭合形式
   <>...</> 或 <Fragment>...</Fragment>

⚡ 决策时间: < 1秒
🎯 验证方式: prettier 格式化
```

### 7.2 常见错误备忘

```
❌ <br> → ✅ <br />
❌ <Button></Button> → ✅ <Button />
❌ <div><p></div></p> → ✅ <div><p></p></div>
❌ <DIV> → ✅ <div>
❌ <img src="..."> → ✅ <img src="..." />
```

---

**规则状态**: 启用
**效果预期**: 
- 决策时间: 从 3-5秒 → <1秒
- 错误率: 减少 80%
- 上下文切换: 减少 60%