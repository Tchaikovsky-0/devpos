# 巡检宝Logo整合方案

> **Precision Order · 精密秩序**
> 
> 本文档说明新Logo在项目中的整合方式和使用规范。

---

## 📁 文件位置

### Logo文件目录结构

```
frontend/public/
├── logo/
│   ├── logo-main.png          # 主Logo（透明背景，深色线条）
│   ├── logo-dark.png          # 深色主题版本（深色背景，白色线条）
│   ├── logo-512.png           # 512x512大尺寸
│   ├── favicon-32.png         # 32x32 favicon
│   └── favicon-180.png        # 180x180 Apple touch icon
├── icons/
│   ├── icon-72x72.png         # PWA图标 - 72x72
│   ├── icon-96x96.png         # PWA图标 - 96x96
│   ├── icon-128x128.png       # PWA图标 - 128x128
│   ├── icon-144x144.png       # PWA图标 - 144x144
│   ├── icon-152x152.png       # PWA图标 - 152x152
│   ├── icon-192x192.png       # PWA图标 - 192x192
│   ├── icon-384x384.png       # PWA图标 - 384x384
│   └── icon-512x512.png       # PWA图标 - 512x512
├── manifest.json              # PWA配置（已更新theme_color）
└── ...
```

### 源代码组件

```
frontend/src/
├── components/
│   ├── Logo.tsx               # Logo组件（SVG实现）
│   ├── SplashScreen.tsx       # 启动屏组件
│   └── Layout.tsx             # 布局组件（已更新Logo引用）
├── hooks/
│   └── useAppLoader.ts        # 应用加载状态管理
└── main.tsx                   # 应用入口（已集成启动屏）
```

---

## 🎨 Logo设计规格

### 核心设计

| 参数 | 值 | 说明 |
|------|-----|------|
| 外层弧线半径 | 170px | 上下对称，120度弧线 |
| 内层弧线半径 | 100px | 错位60度，120度弧线 |
| 线宽 | 32px | 粗线条，力量感 |
| 中心点半径 | 40px | 突出存在感 |
| 内外层错位 | 60度 | 创造动感张力 |

### 设计寓意

- **双环对称**：代表监控的全方位覆盖
- **中心点**：AI的感知核心，精准洞察
- **错位设计**：体现主动监控的动态感
- **粗线条**：工业级的力量与可靠性

---

## 🚀 启动屏（SplashScreen）

### 功能特性

1. **主题自适应**
   - 自动适配深境/均衡/清境三档主题
   - 使用CSS变量实现无缝切换

2. **动画序列**
   - **入场动画**（0-1.2s）：Logo缩放进入，路径绘制动画
   - **呼吸动画**（1.2s后）：微妙的缩放呼吸效果
   - **退出动画**（加载完成后）：淡出消失

3. **进度跟踪**
   - 实时显示加载进度
   - 动态状态文本
   - 主题色进度条

### 使用方式

```tsx
import { SplashScreen } from '@/components/SplashScreen'
import { useAppLoader } from '@/hooks/useAppLoader'

function App() {
  const { isLoading, progress, statusText } = useAppLoader()

  return (
    <>
      <SplashScreen
        isLoading={isLoading}
        progress={progress}
        statusText={statusText}
      />
      <YourApp />
    </>
  )
}
```

---

## 🧩 Logo组件

### 基础使用

```tsx
import { Logo } from '@/components/Logo'

// 基础用法
<Logo />

// 指定尺寸
<Logo size="sm" />   // 24x24
<Logo size="md" />   // 32x32（默认）
<Logo size="lg" />   // 48x48
<Logo size="xl" />   // 64x64

// 指定主题
<Logo variant="default" />  // 跟随当前主题
<Logo variant="light" />    // 白色（用于深色背景）
<Logo variant="dark" />     // 深色（用于浅色背景）

// 带动画
<Logo animated />
```

### 带文字版本

```tsx
import { LogoWithText } from '@/components/Logo'

// 文字在右侧
<LogoWithText textPosition="right" showSubtitle />

// 文字在下方
<LogoWithText textPosition="bottom" />
```

---

## 📱 PWA配置

### 已更新配置

1. **manifest.json**
   - `theme_color`: `#0D1117`（与深境主题一致）
   - `icons`: 8个尺寸的图标配置

2. **index.html**
   - favicon: 32x32 和 180x180
   - Apple touch icon: 180x180

---

## 🎬 动画规范

### 时间参数

| 动画类型 | 时长 | 缓动函数 |
|---------|------|---------|
| Logo入场 | 600ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| 路径绘制 | 600ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 呼吸动画 | 2000ms | `easeInOut` |
| 进度条 | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 退出淡出 | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

### 动画阶段

```
0ms        600ms      1200ms     加载完成    加载完成+600ms
 │          │          │          │          │
 ▼          ▼          ▼          ▼          ▼
[入场动画]→[路径绘制]→[呼吸动画]→[保持]→→→[退出动画]
```

---

## 🎯 使用规范

### 1. 最小尺寸

- Logo不小于 **24x24px**
- 保持周围至少 **8px** 留白

### 2. 背景对比

| 背景类型 | Logo变体 | 示例场景 |
|---------|---------|---------|
| 深色背景（#0D1117） | `variant="light"` | 侧边栏、启动屏 |
| 浅色背景（#F5F7FA） | `variant="dark"` | 登录页、打印页面 |
| 混合背景 | `variant="default"` | 主界面 |

### 3. 禁止操作

- ❌ 不要拉伸变形
- ❌ 不要旋转
- ❌ 不要改变颜色（使用variant）
- ❌ 不要添加阴影或特效

---

## 🔧 开发指南

### 添加新Logo尺寸

如需添加新的图标尺寸，编辑 `frontend/public/logo/` 目录：

```bash
# 复制对应尺寸的文件
cp logo-main.png logo-newsize.png

# 或使用设计系统重新生成
python3 design-system/generate_logo.py --size 256
```

### 修改动画参数

编辑 `frontend/src/components/SplashScreen.tsx`：

```tsx
// 修改入场动画时长
transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}

// 修改呼吸动画
animate={{ scale: [1, 1.03, 1] }}
transition={{ duration: 3, repeat: Infinity }}
```

### 添加加载阶段

编辑 `frontend/src/hooks/useAppLoader.ts`：

```ts
const LOADING_STAGES: LoadingStage[] = [
  // ...现有阶段
  { id: 'newStage', label: '正在加载新模块...', weight: 15 },
]
```

---

## ✅ 检查清单

### 整合完成检查

- [x] Logo文件已复制到 `public/logo/`
- [x] PWA图标已生成到 `public/icons/`
- [x] `index.html` 已更新favicon引用
- [x] `manifest.json` 已更新theme_color
- [x] `Layout.tsx` 已使用Logo组件
- [x] `SplashScreen.tsx` 已创建
- [x] `useAppLoader.ts` 已创建
- [x] `main.tsx` 已集成启动屏
- [x] 所有文件无lint错误

### 视觉检查

- [ ] 深境模式下Logo显示正常
- [ ] 均衡模式下Logo显示正常
- [ ] 清境模式下Logo显示正常
- [ ] 启动屏动画流畅
- [ ] 进度条更新正常
- [ ] 侧边栏Logo位置正确

---

## 📝 版本历史

### v2.0 (2026-04-07)
- 新Logo设计整合
- 启动屏组件实现
- 主题自适应支持
- PWA图标配置

---

**精密、秩序、力量、克制。**

*这就是巡检宝。*
