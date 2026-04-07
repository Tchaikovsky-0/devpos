---
description: 
alwaysApply: true
enabled: true
updatedAt: 2026-04-06T20:45:55.851Z
provider: 
---

# 性能优化与清洁开发规范

> **强制执行 | 高优先级**
> **关联 Skill**: [performance-optimization](../skills/performance-optimization/SKILL.md)
> 版本: v1.0.0
> 创建日期: 2026-04-02

---

## 📌 规范概述

本规范旨在确保巡检宝项目的**性能优化**和**清洁开发**。核心目标是让代码始终保持高性能、高可维护性、高可读性。

---

## 🎯 核心原则

### 1. 性能优化原则

```yaml
优化优先级:
  1️⃣ 正确性 > 清洁性 > 性能
     → 先让代码正确，再让代码干净，最后才优化性能
  
  2️⃣ 测量 > 优化
     → 不要瞎猜性能问题，先测量再优化
  
  3️⃣ 小步 > 大步
     → 每次只改一点，确保不破坏功能
  
  4️⃣ 预防 > 治疗
     → 写干净代码，避免性能问题
```

### 2. 清洁开发原则

```yaml
SOLID原则:
  S: 单一职责 - 一个函数只做一件事
  O: 开闭原则 - 对扩展开放，对修改封闭
  L: 里氏替换 - 子类可以替换父类
  I: 接口隔离 - 多个小接口优于一个大接口
  D: 依赖倒置 - 依赖抽象，不依赖具体

DRY原则:
  → Don't Repeat Yourself
  → 重复代码必须抽取

KISS原则:
  → Keep It Simple, Stupid
  → 简单直接，不要过度设计

YAGNI原则:
  → You Aren't Gonna Need It
  → 不要写你"觉得"以后会用到的代码
```

---

## 📋 性能优化规则

### R1: 性能测量规则

**规则描述**：在优化性能之前，必须先测量性能。

**测量标准**：

```yaml
必须测量的情况:
  - API响应时间 > 1秒
  - 页面加载时间 > 3秒
  - 内存占用 > 80%
  - CPU占用 > 90% 持续 > 10秒
  
测量内容:
  ✅ 响应时间分布 (P50, P90, P99)
  ✅ 吞吐量 (QPS/TPS)
  ✅ 资源占用 (CPU, 内存, 磁盘, 网络)
  ✅ 错误率
  ✅ 可用性
```

**测量工具**：

```yaml
前端性能:
  - Chrome DevTools Performance
  - Lighthouse
  - Web Vitals (LCP, FID, CLS)
  
后端性能:
  - Go: pprof, trace, benchmem
  - Python: cProfile, line_profiler, memory_profiler
  - 数据库: EXPLAIN, slow query log, performance_schema
  
系统性能:
  - top/htop: CPU和内存
  - vmstat: 系统整体
  - iostat: 磁盘I/O
  - netstat/ss: 网络连接
```

---

### R2: 前端性能规则

**规则描述**：前端性能必须满足Web Vitals标准。

**性能指标**：

```yaml
Web Vitals 标准:
  LCP (最大内容绘制): < 2.5秒 ✅
  FID (首次输入延迟): < 100毫秒 ✅
  CLS (累积布局偏移): < 0.1 ✅
  
页面加载标准:
  首屏渲染: < 1.5秒
  完全加载: < 3秒
  可交互: < 2秒
```

**优化规则**：

```yaml
资源优化:
  ✅ 图片: WebP格式，懒加载，CDN加速
  ✅ CSS/JS: 压缩，合并，CDN
  ✅ 字体: font-display: swap
  ✅ 预加载: preload, prefetch
  
代码分割:
  ✅ 按路由分割
  ✅ 按功能分割
  ✅ 懒加载非首屏组件
  ✅ tree shaking
```

---

### R3: 后端性能规则

**规则描述**：后端API响应时间必须满足SLA标准。

**性能指标**：

```yaml
API响应时间标准:
  P50: < 100毫秒
  P90: < 500毫秒
  P99: < 1秒
  
QPS标准:
  核心接口: > 1000 QPS
  普通接口: > 500 QPS
  批量接口: > 100 QPS
```

**优化规则**：

```yaml
API优化:
  ✅ 批量API: 减少请求数
  ✅ 分页API: 大数据分页
  ✅ 缓存API: Redis/Memory
  ✅ 压缩响应: gzip/brotli

算法优化:
  ✅ 选择合适数据结构
  ✅ 减少循环嵌套
  ✅ 空间换时间
  ✅ 缓存计算结果
  
并发处理:
  ✅ 异步处理: 消息队列
  ✅ 并行处理: goroutine/thread
  ✅ 连接池: 数据库/Redis
  ✅ 限流熔断: 保护系统
```

---

### R4: 数据库性能规则

**规则描述**：数据库查询必须优化，避免性能问题。

**查询规则**：

```yaml
✅ 必须遵守:
  - 添加适当索引
  - 避免 SELECT *
  - 减少 JOIN
  - 使用分页查询
  - 避免循环内查询
  - 批量操作优于逐条操作

❌ 禁止:
  - SELECT * (必须指定字段)
  - LIKE '%xxx%' (全表扫描)
  - OR 条件 (索引失效)
  - 嵌套子查询过深 (>3层)
  - 不带 WHERE 的 UPDATE/DELETE
```

**索引规则**：

```yaml
✅ 创建索引的场景:
  - WHERE 条件字段
  - ORDER BY 字段
  - JOIN 关联字段
  - 频繁查询的字段
  
❌ 不要创建索引:
  - 重复度高的字段 (如性别)
  - 很少查询的字段
  - 更新频繁的字段
  - TEXT/BLOB 大字段
```

---

## 🧹 清洁开发规则

### R5: 代码命名规则

**规则描述**：代码命名必须清晰、有意义。

**命名规范**：

```yaml
变量命名:
  ✅ 描述性强
     const userLoginCount = 100
     const isLoading = false
     
  ❌ 模糊或缩写
     const u = 100
     const cnt = 0

函数命名:
  ✅ 动词开头，描述动作
     function validateUserInput() {}
     function fetchUserData() {}
     
  ❌ 模糊名称
     function process() {}
     function handle() {}

类命名:
  ✅ 名词，描述概念
     class UserService {}
     class OrderProcessor {}
     
  ❌ 无意义的名称
     class Manager {}
     class Handler {}
```

---

### R6: 函数设计规则

**规则描述**：函数必须短小、单一职责。

**函数规范**：

```yaml
函数长度:
  ✅ 理想: < 20行
  ✅ 可接受: < 50行
  ⚠️ 警告: 50-100行 (需要审查)
  🔴 禁止: > 100行

函数参数:
  ✅ 理想: 0-2个参数
  ✅ 可接受: 3个参数
  ⚠️ 警告: 4个参数 (需要重构)
  🔴 禁止: > 4个参数 (必须重构)

函数职责:
  ✅ 单一职责
     function validateEmail(email) {
       const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
       return regex.test(email)
     }
     
  ❌ 多重职责
     function processUser(data) {
       // 验证、存储、发送邮件、记录日志...
     }
```

---

### R7: 注释规则

**规则描述**：注释要恰到好处，只写必要的注释。

**注释规范**：

```yaml
✅ 需要的注释:
  # 业务逻辑解释 (为什么这么做)
  # 复杂算法说明 (算法思路)
  # 注意事项提醒 (坑在哪里)
  # TODO: 标记未完成的工作

❌ 不需要的注释:
  # 明显的代码 (自解释)
  # 过时的注释 (代码改了，注释没改)
  # 重复代码的注释
  # 注释掉的代码 (直接删掉)
```

---

### R8: 代码审查规则

**规则描述**：代码必须经过审查才能提交。

**审查标准**：

```yaml
必须检查:
  ✅ 功能正确性
     - 代码是否实现了需求
     - 边界条件是否处理
     - 错误处理是否完善
  
  ✅ 代码质量
     - 是否遵循命名规范
     - 函数是否短小
     - 是否遵循SOLID原则
  
  ✅ 性能影响
     - 是否有明显性能问题
     - 是否有安全漏洞
     - 是否有重复代码
  
  ✅ 测试覆盖
     - 是否有单元测试
     - 测试是否覆盖边界
     - 测试是否可维护
```

---

## 🏗️ 目录架构规则

### R9: 目录结构规则

**规则描述**：目录结构必须清晰、规范。

**分层规范**：

```yaml
前端目录结构:
  src/
  ├── components/     # 通用组件
  │   ├── ui/         # UI基础组件
  │   └── business/   # 业务组件
  ├── pages/          # 页面组件
  ├── hooks/          # 自定义Hooks
  ├── utils/          # 工具函数
  ├── services/       # API服务
  ├── stores/         # 状态管理
  ├── types/          # 类型定义
  └── assets/         # 静态资源
  
后端目录结构:
  internal/
  ├── cmd/            # 入口文件
  ├── api/            # API层
  ├── service/        # 业务逻辑层
  ├── repository/     # 数据访问层
  ├── model/          # 数据模型
  ├── middleware/     # 中间件
  └── pkg/            # 内部工具包
```

**命名规范**：

```yaml
目录命名:
  ✅ 小写+连字符
     src/components/user-profile/
     internal/api/handlers/
     
  ❌ 驼峰或下划线
     src/components/UserProfile/
     internal/api_handlers/

文件命名:
  ✅ 前端: PascalCase
     UserProfile.tsx
     useAuth.ts
     
  ✅ 后端: snake_case 或 PascalCase
     user_handler.go
     UserHandler.go
```

---

### R10: 模块化规则

**规则描述**：代码必须模块化，高内聚低耦合。

**模块划分**：

```yaml
模块划分原则:
  ✅ 按业务功能划分
     - 用户模块、订单模块、支付模块
     
  ✅ 按技术职责划分
     - API层、Service层、Repository层
     
  ✅ 按复用程度划分
     - 通用模块、业务模块

模块内聚性:
  ✅ 高内聚
     - 模块内元素紧密相关
     - 对外提供少量接口
     - 单一职责
     
  ❌ 低内聚
     - utils 目录太大
     - common 目录混乱
     - 职责不明确
```

---

## ⚠️ 禁止规则

### R11: 性能禁止规则

```yaml
🚫 绝对禁止:
  - 在循环内进行数据库查询
  - 使用 SELECT * 查询
  - 不加索引的 WHERE 条件
  - 不做分页的大数据查询
  - 不缓存的重复计算
  - 不限流的高并发接口
  - 不优化的N+1查询问题
```

### R12: 代码禁止规则

```yaml
🚫 绝对禁止:
  - 硬编码的敏感信息 (密码、密钥)
  - 不处理的 error
  - 不释放的资源 (内存、连接)
  - 无限递归 (无基线条件)
  - SQL/命令注入漏洞
  - 不验证的用户输入
  - 过期的依赖包
  - TODO注释的未完成代码
  
⚠️ 强烈不推荐:
  - any 类型 (TypeScript)
  - 裸字符串魔法数字
  - 深层嵌套的回调
  - 过长的函数
  - 重复的代码块
```

---

## 🚀 清洁度评估标准

### 清洁代码七宗罪

```yaml
1. 重复 (Duplication)
   → 代码复制粘贴，重复逻辑
  
2. 冗长 (Bloaters)
   → 函数太长，类太大
  
3. 绕口 (Obvious Behavior)
   → 代码行为不符合预期
  
4. 耦合 (Coupling)
   → 模块间依赖混乱
  
5. 重复特性 (Combinatorial)
   → 相似但不重复的代码
  
6. 条件复杂 (Logic)
   → 复杂的条件判断
  
7. 命名糟糕 (Names)
   → 变量、函数、类命名混乱
```

### 代码气味检测清单

```yaml
气味1: 重复代码
症状: 相同代码出现3次以上
处理: 提取为函数、常量或基类

气味2: 过长函数 (>50行)
处理: 按功能拆分，提取辅助函数

气味3: 过大类 (>300行)
处理: 按职责拆分，提取子类

气味4: 霰弹式修改
症状: 修改一个功能需要改多个文件
处理: 重构模块边界，提取内聚模块

气味5: 特性依恋
症状: 函数使用多个类的数据
处理: 移动函数到数据所在类
```

### 命名详细规范

```yaml
变量命名:
  ✅ 好的命名:
     const userLoginCount = 100
     const isLoading = false
     const hasPermission = true
     
  ❌ 坏的命名:
     const u = 100          // 缩写
     const data = {}         // 太笼统
     const tmp = {}          // 无意义

类命名:
  ✅ 好的命名:
     class UserService {}
     class OrderProcessor {}
     
  ❌ 坏的命名:
     class Manager {}         // 太笼统
     class Handler {}         // 太笼统
```

---

## 🚀 实施检查清单

### 开发前
- [ ] 理解性能要求
- [ ] 评估技术方案
- [ ] 设计架构
- [ ] 制定优化计划

### 开发中
- [ ] 遵循清洁代码规范
- [ ] 编写单元测试
- [ ] 进行自审查
- [ ] 记录性能关键点

### 开发后
- [ ] 性能测试
- [ ] 代码审查
- [ ] 优化调整
- [ ] 文档更新

---

## 🔗 相关文档

- [清洁代码规范](./clean_code_standards.md)
- [性能优化 Skill](../skills/performance-optimization/SKILL.md)
- [代码审查规则](./code_review_rules.md)
- [数据库规则](./database_rules.md)
- [前端性能规则](./frontend_performance_rules.md)
- [测试规则](./testing_rules.md)

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**维护者**: 巡检宝Agent团队

---

> **提醒**：清洁的代码不一定快，但快的代码一定清洁。记住：**先正确，再干净，最后才快！** ⚡