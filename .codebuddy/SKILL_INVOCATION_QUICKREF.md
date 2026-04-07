# 🎯 自动技能调用快速参考

> 贴在显眼位置，随时提醒自己！

---

## 🚀 核心原则

```
看到专业任务 → 立即调用技能 → 不询问、不犹豫
```

---

## 📋 技能触发速查表

### 🎨 设计类 (P0 - 最高优先级)

| 当用户说 | 自动调用 |
|---------|---------|
| "设计个 logo" | `use_skill: canvas-design` |
| "做个海报" | `use_skill: canvas-design` |
| "品牌设计" | `use_skill: brand` + `canvas-design` |
| "配色方案" | `use_skill: canvas-design` |
| "图标设计" | `use_skill: canvas-design` |

### 📊 数据类 (P1)

| 当用户说 | 自动调用 |
|---------|---------|
| "分析数据" | `use_skill: data-analysis-workflows` |
| "生成图表" | `use_skill: data-analysis-workflows` |
| "处理 Excel" | `use_skill: Excel 文件处理` |
| "数据报表" | `use_skill: data-analysis-workflows` |

### 📄 文档类 (P1)

| 当用户说 | 自动调用 |
|---------|---------|
| "生成 PDF" | `use_skill: PDF 文档生成` |
| "Word 文档" | `use_skill: Word 文档生成` |
| "做 PPT" | `use_skill: PPT 演示文稿` |
| "写报告" | 询问格式 → 调用对应技能 |

### 💻 开发类 (P2)

| 当用户说 | 自动调用 |
|---------|---------|
| "写代码" | `use_skill: Code` |
| "Docker" | `use_skill: Docker` |
| "Git 操作" | `use_skill: Git` |
| "重构代码" | `use_skill: Code` |

### 🔍 其他专业类

| 当用户说 | 自动调用 |
|---------|---------|
| "UI 优化" | `use_skill: Impeccable` |
| "AI 生图" | `use_skill: AI绘图` |
| "调研分析" | `use_skill: Auto Researcher` |

---

## ❌ 禁止做的事

| 不要做 | 为什么 |
|-------|--------|
| ❌ "您需要使用技能吗？" | 直接调用，不要问 |
| ❌ 用通用方法做专业事 | 质量差，浪费时间 |
| ❌ "我简单做一下" | 专业任务必须专业做 |
| ❌ 跳过技能步骤 | 必须完整遵循技能指导 |

---

## ✅ 正确做法

```
用户: "帮我设计个 logo"

✅ 正确:
1. 识别: 视觉设计 → 调用 canvas-design
2. 识别: 品牌相关 → 调用 brand
3. 按技能指导执行完整流程
4. 输出专业级 Logo

❌ 错误:
- 直接画个简单 SVG
- 问"您需要使用设计技能吗？"
- 用文字描述而不生成实际设计
```

---

## 🎓 记忆口诀

```
设计任务 canvas-design，
品牌策略 brand 先行，
数据分析 workflows，
文档 PDF Word PPT，
代码开发用 Code，
Docker Git 别忘记，
看到专业就调技能，
不问不做直接行！
```

---

## 📁 配置文件位置

```
.codebuddy/
├── rules/
│   └── auto-skill-invocation.md      # 完整规则文档
├── config/
│   └── auto-skill-config.json        # 技能配置
├── agents/
│   └── skill-aware-agent.md          # Agent 配置
└── SKILL_INVOCATION_QUICKREF.md      # 本快速参考
```

---

**记住**: 技能是提升质量的关键，自动调用是效率的保障！🚀
