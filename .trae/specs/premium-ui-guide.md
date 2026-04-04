# 巡检宝高端UI系统使用指南

## 🚀 快速开始

### 启动开发服务器

```bash
cd /Users/fanxing/Downloads/xunjianbao/frontend
pnpm dev
```

服务器启动后，访问以下地址：

- **主开发服务器**: http://localhost:5173
- **备用端口**: http://localhost:3000

## 🎨 高端UI页面

### 1. 高端仪表板 (Premium Dashboard)
- **路由**: `/premium/dashboard`
- **功能**: 
  - 实时统计卡片
  - 视频流预览
  - 实时告警显示
  - 环境参数监测
- **特色**: 玻璃拟态效果、精致动效、实时数据更新

### 2. 高端数据大屏 (Premium Data Screen)
- **路由**: `/premium/datascreen`
- **功能**:
  - 多画面视频监控（1x1, 2x2, 3x3, 4x4布局）
  - 实时统计信息
  - 视频流列表管理
  - 布局切换
- **特色**: 专业级监控界面、流畅动画、高性能

### 3. 高端告警中心 (Premium Alert Center)
- **路由**: `/premium/alerts`
- **功能**:
  - 多级别告警显示（紧急、警告、通知）
  - 实时告警筛选和排序
  - 告警状态管理
  - 快速处理操作
- **特色**: 清晰的信息层次、流畅的状态转换

## 🎯 设计系统组件

### 已实现的高端组件

1. **ButtonPremium** - 高端按钮
   - 6种变体：primary, secondary, ghost, danger, success, glass
   - 多种尺寸：xs, sm, default, lg, xl, icon
   - 支持加载状态、禁用状态

2. **CardPremium** - 高端卡片
   - 4种变体：default, elevated, glass, interactive
   - 专用卡片：DataCard, StatCard, InfoCard
   - 支持动画包装器

3. **InputPremium** - 高端输入框
   - 4种变体：default, filled, outlined, glass
   - 3种尺寸：sm, default, lg
   - 支持搜索组件

4. **SidebarPremium** - 高端侧边栏
   - 可折叠功能
   - 支持子菜单
   - 动画导航项

## 📁 文件结构

```
frontend/src/
├── components/ui/
│   ├── premium/
│   │   └── index.ts              # 组件导出
│   ├── button-premium.tsx         # 按钮组件
│   ├── card-premium.tsx           # 卡片组件
│   ├── input-premium.tsx          # 输入框组件
│   └── sidebar-premium.tsx        # 侧边栏组件
├── routes/
│   ├── PremiumDashboard.tsx       # 高端仪表板
│   ├── PremiumDataScreen.tsx      # 高端数据大屏
│   ├── PremiumAlertCenter.tsx      # 高端告警中心
│   └── design-system-showcase.tsx  # 设计系统展示
├── styles/
│   └── design-system.css          # 设计系统样式
└── router.tsx                      # 路由配置
```

## 🎨 设计特色

### 深色主题
- 主背景: `#0d1117`
- 卡片背景: `#161b22`
- 强调色: `#4F7FD8`

### 玻璃拟态
- 背景: `rgba(255, 255, 255, 0.05)`
- 边框: `rgba(255, 255, 255, 0.1)`
- 模糊: `blur(20px)`

### 精致动效
- 淡入动画: `opacity 0→1, y: 20→0, duration: 0.4s`
- 悬停效果: `scale: 1.02, duration: 0.2s`
- 过渡动画: `all 0.2s ease`

## 🔧 开发指南

### 使用高端组件

```tsx
import {
  ButtonPremium,
  CardPremium,
  CardHeader,
  CardTitle,
  CardContent,
  InputPremium,
  SidebarPremium,
} from '@/components/ui/premium';

// 按钮示例
<ButtonPremium variant="primary" size="lg">
  提交
</ButtonPremium>

// 卡片示例
<CardPremium variant="elevated" className="p-6">
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    内容区域
  </CardContent>
</CardPremium>
```

### 动画容器

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
>
  内容
</motion.div>
```

## 📱 响应式设计

所有高端UI组件都支持响应式设计：
- 移动端: `< 768px`
- 平板: `768px - 1024px`
- 桌面: `> 1024px`

## 🎓 学习资源

- **设计参考**: Apple Pro, Linear, Vercel
- **组件库**: Radix UI, shadcn/ui
- **动画库**: Framer Motion
- **图标库**: Lucide React

## ⚡ 性能优化

- 使用 React.lazy 进行代码分割
- 组件按需加载
- 图片懒加载
- 动画性能优化

## 🐛 常见问题

### Q: 如何访问高端UI页面？
A: 启动开发服务器后，访问 `http://localhost:5173/premium/dashboard`

### Q: 页面加载缓慢？
A: 检查网络连接，确保 node_modules 完整安装

### Q: 样式不生效？
A: 确保在入口文件导入了设计系统样式

## 📞 技术支持

如有问题，请查看：
- 控制台错误信息
- 网络请求状态
- 浏览器开发者工具

---

**版本**: 2.0.0
**更新日期**: 2026年4月3日
**设计理念**: 专业、简洁、高效的高级简约风格
