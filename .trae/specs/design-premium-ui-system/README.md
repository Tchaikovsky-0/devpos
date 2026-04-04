# 巡检宝高端UI设计系统

> 专业、简约、高效的深色主题UI组件库
> 
> 参考设计：Apple Pro + Linear + Vercel

---

## 🎨 设计特点

### 深色主题优先
- 深邃的深蓝灰色调，营造专业监控中心氛围
- 层次分明的背景色系统
- 精心调校的文字对比度

### 玻璃拟态效果
- 半透明层叠效果
- backdrop-blur 模糊背景
- 精致的边框处理

### 精致动效
- 流畅的入场动画
- 微弹性交互反馈
- 优雅的状态过渡

---

## 🚀 快速开始

### 安装依赖

```bash
# 确保已安装 framer-motion
pnpm add framer-motion

# 确保已安装 lucide-react (图标库)
pnpm add lucide-react
```

### 导入样式

在 `main.tsx` 或 `App.tsx` 中导入设计系统样式：

```tsx
// 导入设计系统样式
import "@/styles/design-system.css";
```

### 使用组件

```tsx
import { ButtonPremium, CardPremium, InputPremium } from "@/components/ui/premium";

function MyComponent() {
  return (
    <CardPremium>
      <h2>欢迎使用巡检宝</h2>
      <InputPremium placeholder="请输入内容" />
      <ButtonPremium>提交</ButtonPremium>
    </CardPremium>
  );
}
```

---

## 📦 组件列表

### ButtonPremium - 按钮组件

```tsx
// 变体
<ButtonPremium>主要按钮</ButtonPremium>
<ButtonPremium variant="secondary">次要按钮</ButtonPremium>
<ButtonPremium variant="ghost">幽灵按钮</ButtonPremium>
<ButtonPremium variant="danger">危险按钮</ButtonPremium>
<ButtonPremium variant="success">成功按钮</ButtonPremium>
<ButtonPremium variant="glass">玻璃按钮</ButtonPremium>

// 尺寸
<ButtonPremium size="xs">超小</ButtonPremium>
<ButtonPremium size="sm">小</ButtonPremium>
<ButtonPremium>默认</ButtonPremium>
<ButtonPremium size="lg">大</ButtonPremium>
<ButtonPremium size="xl">超大</ButtonPremium>

// 状态
<ButtonPremium loading>加载中</ButtonPremium>
<ButtonPremium disabled>禁用</ButtonPremium>
<ButtonPremium glow>发光效果</ButtonPremium>

// 图标
<ButtonPremium leftIcon={<Plus className="w-4 h-4" />}>添加</ButtonPremium>
<ButtonPremium rightIcon={<ChevronRight className="w-4 h-4" />}>下一步</ButtonPremium>
```

### CardPremium - 卡片组件

```tsx
// 变体
<CardPremium variant="default">默认卡片</CardPremium>
<CardPremium variant="elevated">带阴影卡片</CardPremium>
<CardPremium variant="glass">玻璃卡片</CardPremium>
<CardPremium variant="interactive">可交互卡片</CardPremium>

// 数据卡片
<DataCard
  label="总用户数"
  value="12,345"
  trend={{ value: 12.5, positive: true }}
  icon={<Users className="w-5 h-5" />}
/>

// 统计卡片
<StatCard
  title="系统状态"
  value="正常"
  subtitle="所有服务运行正常"
  status="success"
/>

// 信息卡片
<InfoCard
  title="系统通知"
  description="新版本已发布"
  icon={<AlertCircle className="w-5 h-5" />}
  action={<ButtonPremium size="sm">查看</ButtonPremium>}
/>

// 带动画的卡片
<AnimatedCard delay={0.2}>
  <p>延迟 0.2s 入场</p>
</AnimatedCard>
```

### InputPremium - 输入框组件

```tsx
// 变体
<InputPremium placeholder="默认输入框" />
<InputPremium variant="filled" placeholder="填充输入框" />
<InputPremium variant="outlined" placeholder="边框输入框" />
<InputPremium variant="glass" placeholder="玻璃输入框" />

// 尺寸
<InputPremium size="sm" placeholder="小尺寸" />
<InputPremium placeholder="默认尺寸" />
<InputPremium size="lg" placeholder="大尺寸" />

// 状态
<InputPremium label="用户名" placeholder="请输入用户名" />
<InputPremium label="密码" type="password" />
<InputPremium label="邮箱" error errorMessage="格式不正确" />
<InputPremium label="搜索" leftIcon={<Search className="w-4 h-4" />} />

// 搜索输入框
<SearchInput placeholder="搜索..." onSearch={(value) => console.log(value)} />

// 文本域
<TextareaPremium
  label="描述"
  placeholder="请输入描述内容..."
  helperText="支持多行文本"
/>
```

### SidebarPremium - 侧边栏组件

```tsx
const navItems = [
  { id: "home", label: "首页", icon: <Home className="w-5 h-5" />, active: true },
  { id: "settings", label: "设置", icon: <Settings className="w-5 h-5" /> },
];

<SidebarPremium
  items={navItems}
  header={
    <SidebarHeader
      logo={<Logo />}
      title="巡检宝"
      subtitle="设计系统"
    />
  }
  footer={
    <SidebarFooter
      user={{
        name: "管理员",
        email: "admin@xunjianbao.com",
        avatar: <Avatar />,
      }}
    />
  }
/>
```

---

## 🎨 色彩系统

### 背景色
| 变量 | 值 | 用途 |
|------|-----|------|
| `bg-darkest` | `#0d1117` | 最深背景，页面底色 |
| `bg-dark` | `#161b22` | 深色背景，卡片底色 |
| `bg-default` | `#21262d` | 默认背景，输入框底色 |
| `bg-light` | `#30363d` | 浅色背景，悬浮状态 |

### 强调色
| 变量 | 值 | 用途 |
|------|-----|------|
| `accent` | `#4F7FD8` | 主强调色，按钮、链接 |
| `accent-light` | `#6B8FF8` | 浅色强调，悬浮状态 |

### 文字色
| 变量 | 值 | 用途 |
|------|-----|------|
| `text-primary` | `#f0f6fc` | 主要文字 |
| `text-secondary` | `#8b949e` | 次要文字 |
| `text-muted` | `#6e7681` | 辅助文字 |

### 功能色
| 变量 | 值 | 用途 |
|------|-----|------|
| `success` | `#238636` | 成功状态 |
| `warning` | `#d29922` | 警告状态 |
| `error` | `#da3633` | 错误状态 |
| `info` | `#58a6ff` | 信息状态 |

---

## ✨ 动画系统

### CSS 动画类
```css
/* 淡入 */
.animate-fade-in
.animate-fade-in-up
.animate-fade-in-down

/* 滑入 */
.animate-slide-in-left
.animate-slide-in-right

/* 缩放 */
.animate-scale-in

/* 脉冲 */
.animate-pulse
.animate-pulse-glow

/* 骨架屏 */
.animate-shimmer
```

### Framer Motion 动画
```tsx
// 淡入上滑
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
  内容
</motion.div>

// 错开动画
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map((item, i) => (
    <motion.div key={i} variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

---

## 🎯 最佳实践

### 1. 使用语义化颜色
```tsx
// ✅ 正确
<ButtonPremium variant="danger">删除</ButtonPremium>

// ❌ 错误
<ButtonPremium className="bg-red-500">删除</ButtonPremium>
```

### 2. 保持一致的间距
```tsx
// ✅ 正确
<div className="space-y-4">
  <CardPremium>卡片1</CardPremium>
  <CardPremium>卡片2</CardPremium>
</div>

// ❌ 错误
<div>
  <CardPremium className="mb-3">卡片1</CardPremium>
  <CardPremium className="mb-5">卡片2</CardPremium>
</div>
```

### 3. 使用动画增强体验
```tsx
// ✅ 正确
<AnimatedCard delay={0.1}>
  <p>内容</p>
</AnimatedCard>

// 列表错开动画
{items.map((item, i) => (
  <AnimatedCard key={item.id} delay={i * 0.1}>
    {item.content}
  </AnimatedCard>
))}
```

### 4. 响应式设计
```tsx
// ✅ 正确
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map(card => <CardPremium key={card.id}>{card.content}</CardPremium>)}
</div>
```

---

## 📁 文件结构

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── premium/
│   │       │   └── index.ts          # 组件导出
│   │       ├── button-premium.tsx    # 按钮组件
│   │       ├── card-premium.tsx      # 卡片组件
│   │       ├── input-premium.tsx     # 输入框组件
│   │       └── sidebar-premium.tsx   # 侧边栏组件
│   ├── styles/
│   │   ├── design-system.css         # 设计系统样式
│   │   └── animations.css            # 动画样式
│   └── pages/
│       └── design-system-showcase.tsx # 展示页面
├── tailwind.config.js                # Tailwind 配置
└── package.json
```

---

## 🔧 自定义配置

### 修改主题色
编辑 `tailwind.config.js`：

```js
colors: {
  accent: {
    DEFAULT: '#你的主色',
    light: '#你的浅色',
  },
}
```

### 添加自定义动画
编辑 `src/styles/design-system.css`：

```css
@keyframes myAnimation {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-my-animation {
  animation: myAnimation 0.3s ease-out;
}
```

---

## 📚 相关资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

---

## 📝 更新日志

### v2.0.0 (2026-04-03)
- ✨ 全新深色主题设计系统
- ✨ 新增玻璃拟态效果
- ✨ 新增精致动效系统
- ✨ 新增 ButtonPremium 组件
- ✨ 新增 CardPremium 组件
- ✨ 新增 InputPremium 组件
- ✨ 新增 SidebarPremium 组件
- ✨ 新增设计系统展示页面

---

**维护者**: 巡检宝前端团队
**设计参考**: Apple Pro + Linear + Vercel
