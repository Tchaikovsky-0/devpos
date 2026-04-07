# 监控规则 - 实时监控Agent行为规范

> **强制执行 | 高优先级**
> **关联 Skill**: [monitor](../skills/monitor/SKILL.md)
> 版本: v1.0.0
> 创建日期: 2026-04-02

---

## 📌 规范概述

本规范定义了巡检宝项目实时监控Agent的行为准则，确保监控过程**高效、准确、不打扰**。

**核心目标**：
- ✅ 及时发现问题
- ✅ 准确报告问题
- ✅ 提供有效建议
- ✅ 不影响开发效率

---

## 🎯 核心原则

### 1. 早发现早报告

```yaml
核心理念:
  → 问题越早发现，修复成本越低
  → 不要等到发布前才发现问题

实践方法:
  ✅ 实时监控: 文件保存时检测
  ✅ 提交前检测: Git hook拦截
  ✅ CI检测: 发布前把关
```

### 2. 准确不误报

```yaml
核心理念:
  → 宁可漏报，不可误报
  → 误报会降低信任度

实践方法:
  ✅ 精确解析: 准确识别错误
  ✅ 人工复核: 关键问题二次确认
  ✅ 持续优化: 降低误报率
```

### 3. 建设性反馈

```yaml
核心理念:
  → 不仅指出问题，还要提供解决方案
  → 帮助开发者成长

实践方法:
  ✅ 修复建议: 每个错误都有建议
  ✅ 最佳实践: 提供正确示范
  ✅ 文档链接: 引用相关规范
```

---

## 📋 监控触发规则

### R1: 自动触发规则

#### R1.1 文件保存触发

```yaml
触发条件:
  - 文件保存后 5秒（防抖）
  - 仅监控代码文件（.ts, .tsx, .go, .py）
  - 忽略配置文件和文档

检测项目:
  - 快速检测（仅P0项目）
  - TypeScript类型检查
  - Go Vet

执行要求:
  ✅ 防抖机制: 避免频繁触发
  ✅ 后台执行: 不阻塞编辑器
  ✅ 即时反馈: 发现问题立即通知
```

#### R1.2 Git Commit触发

```yaml
触发条件:
  - Git commit前（pre-commit hook）
  - 所有代码文件

检测项目:
  - 全量检测（P0 + P1）
  - TypeScript类型检查
  - ESLint代码规范
  - Go代码规范
  - 单元测试（可选）

执行要求:
  ✅ 阻断机制: P0错误阻止提交
  ✅ 警告提示: P1警告提示但不阻止
  ✅ 快速反馈: 30秒内完成检测
```

#### R1.3 PR创建触发

```yaml
触发条件:
  - Pull Request创建时
  - 代码变更文件

检测项目:
  - 全量检测（P0 + P1 + P2）
  - 所有监控项
  - 测试覆盖率检查

执行要求:
  ✅ 必须通过: P0/P1错误必须修复
  ✅ 生成报告: 详细的监控报告
  ✅ 通知审查者: 发送报告给Reviewer
```

### R2: 手动触发规则

#### R2.1 Agent主动调用

```yaml
触发方式:
  - monitor check frontend
  - monitor check backend
  - monitor check all

检测项目:
  - 根据命令参数决定
  - 默认全量检测

执行要求:
  ✅ 立即执行: 不等待队列
  ✅ 详细报告: 生成完整报告
  ✅ 历史记录: 保存监控历史
```

#### R2.2 任务完成后触发

```yaml
触发条件:
  - Agent完成开发任务后
  - 代码审查前

检测项目:
  - 相关模块的全量检测
  - 测试覆盖率检查

执行要求:
  ✅ 自动触发: 无需手动调用
  ✅ 质量把关: 确保代码质量
  ✅ 报告存档: 作为交付物的一部分
```

### R3: 定时触发规则

#### R3.1 每日监控

```yaml
触发时间:
  - 每天 09:00
  - 工作日执行

检测项目:
  - 全量检测
  - 依赖安全检查
  - 代码质量趋势

执行要求:
  ✅ 自动执行: 无需人工干预
  ✅ 汇总报告: 发送给project-lead
  ✅ 趋势分析: 对比历史数据
```

#### R3.2 每周监控

```yaml
触发时间:
  - 每周一 09:00

检测项目:
  - 全量检测
  - 测试覆盖率统计
  - 技术债务扫描

执行要求:
  ✅ 周报生成: 详细的周报
  ✅ 团队分享: 发送给所有Agent
  ✅ 改进建议: 提供优化建议
```

---

## 🚨 错误分级规则

### P0 - 阻断性错误

```yaml
定义:
  - 必须立即修复的错误
  - 影响编译或运行的错误
  - 安全漏洞

包含类型:
  - TypeScript编译错误
  - Go编译错误
  - Python语法错误
  - 安全漏洞（高危）
  - 单元测试失败（核心功能）

处理方式:
  ✅ 立即中断: 阻止提交/发布
  ✅ 即时通知: 立即通知相关Agent
  ✅ 强制修复: 必须修复后才能继续

示例:
  ❌ Type 'string' is not assignable to type 'number'
  ❌ undefined: cannot use value (type string) as type int
  ❌ SQL injection vulnerability detected
```

### P1 - 严重错误

```yaml
定义:
  - 需要尽快修复的错误
  - 影响代码质量的问题
  - 潜在的Bug

包含类型:
  - ESLint错误
  - Go Lint错误
  - Python类型错误
  - 安全漏洞（中危）
  - 代码异味

处理方式:
  ✅ 警告提示: 提示但不阻断
  ✅ 汇总通知: 定期汇总通知
  ✅ 建议修复: 提供修复建议

示例:
  ⚠️ 'count' is assigned a value but never used
  ⚠️ Missing return type on function
  ⚠️ Potential nil pointer dereference
```

### P2 - 轻微问题

```yaml
定义:
  - 建议修复的问题
  - 代码风格问题
  - 文档缺失

包含类型:
  - ESLint警告
  - 代码格式问题
  - 注释缺失
  - 文档不完整

处理方式:
  ✅ 记录日志: 记录但不打扰
  ✅ 定期汇总: 每周汇总报告
  ✅ 可选修复: 不强制要求

示例:
  📝 Line exceeds 100 characters
  📝 Missing JSDoc comment
  📝 TODO comment found
```

---

## 📊 检测项目规则

### R4: 前端检测规则

#### R4.1 TypeScript类型检查

```yaml
命令: pnpm exec tsc --noEmit
超时: 60秒
优先级: P0
触发: 每次文件保存

检查内容:
  - 类型错误
  - 类型不匹配
  - 缺失类型定义

错误示例:
  ❌ Type 'string' is not assignable to type 'number'
  ❌ Property 'name' does not exist on type 'User'

修复建议:
  ✅ 使用类型转换: Number(value)
  ✅ 修改类型定义: interface User { name: string }
  ✅ 使用类型守卫: if (typeof value === 'number')
```

#### R4.2 ESLint代码规范

```yaml
命令: pnpm lint
超时: 30秒
优先级: P1
触发: 每次文件保存

检查内容:
  - 代码规范
  - 最佳实践
  - 潜在Bug

错误示例:
  ⚠️ 'count' is assigned a value but never used
  ⚠️ Missing return type on function

修复建议:
  ✅ 删除未使用变量
  ✅ 添加函数返回类型
  ✅ 使用可选链: user?.name
```

#### R4.3 构建检查

```yaml
命令: pnpm build
超时: 120秒
优先级: P1
触发: 提交前、PR创建时

检查内容:
  - 构建是否成功
  - Bundle大小
  - 资源加载

错误示例:
  ❌ Build failed with errors
  ⚠️ Bundle size exceeds 500KB

修复建议:
  ✅ 修复构建错误
  ✅ 代码分割: lazy loading
  ✅ 压缩资源: minify
```

### R5: 后端检测规则

#### R5.1 Go代码规范

```yaml
命令: golangci-lint run ./...
超时: 60秒
优先级: P0
触发: 每次文件保存

检查内容:
  - 代码规范
  - 潜在Bug
  - 性能问题

错误示例:
  ❌ Error return value is not checked
  ⚠️ Cyclomatic complexity is too high

修复建议:
  ✅ 检查错误: if err != nil { return err }
  ✅ 拆分函数: 降低复杂度
```

#### R5.2 Go单元测试

```yaml
命令: go test -v ./...
超时: 120秒
优先级: P1
触发: 提交前、PR创建时

检查内容:
  - 测试是否通过
  - 测试覆盖率

错误示例:
  ❌ Test failed: expected 5, got 3
  ⚠️ Coverage is below 70%

修复建议:
  ✅ 修复失败的测试
  ✅ 补充测试用例
  ✅ 使用mock隔离依赖
```

#### R5.3 Go安全扫描

```yaml
命令: go vet ./...
超时: 30秒
优先级: P0
触发: 每次文件保存

检查内容:
  - 常见错误
  - 安全漏洞

错误示例:
  ❌ unreachable code
  ❌ cannot use value (type string) as type int

修复建议:
  ✅ 删除不可达代码
  ✅ 修复类型错误
```

### R6: AI服务检测规则

#### R6.1 Python类型检查

```yaml
命令: mypy .
超时: 30秒
优先级: P1
触发: 每次文件保存

检查内容:
  - 类型错误
  - 类型不匹配

错误示例:
  ⚠️ Incompatible types in assignment

修复建议:
  ✅ 添加类型注解: def func(x: int) -> str:
  ✅ 使用类型转换: str(value)
```

#### R6.2 Python代码格式

```yaml
命令: black --check .
超时: 20秒
优先级: P2
触发: 提交前

检查内容:
  - 代码格式
  - 风格一致性

错误示例:
  📝 Line length exceeds 88 characters

修复建议:
  ✅ 运行 black . 自动格式化
  ✅ 配置编辑器自动格式化
```

---

## 📈 报告生成规则

### R7: 报告内容规则

#### R7.1 错误报告必须包含

```yaml
必须包含:
  ✅ 错误位置: 文件名 + 行号 + 列号
  ✅ 错误信息: 清晰的错误描述
  ✅ 错误类型: TypeScript/ESLint/Go等
  ✅ 严重程度: P0/P1/P2
  ✅ 修复建议: 具体的修复方案
  ✅ 代码片段: 错误代码上下文
  ✅ 相关规范: 规范文档链接

可选包含:
  - 历史趋势: 与历史数据对比
  - 影响范围: 影响的模块/功能
  - 自动修复: 可自动修复的命令
```

#### R7.2 摘要报告必须包含

```yaml
必须包含:
  ✅ 检测概览: 总错误/警告数
  ✅ 健康度评分: 0-100分
  ✅ 高频问题: TOP 5问题
  ✅ 改进建议: 短期/中期/长期建议
  ✅ 趋势分析: 与上周/上月对比

可选包含:
  - 团队排名: 各模块质量排名
  - 技术债务: 累计的技术债务
  - 优秀实践: 值得推广的做法
```

### R8: 报告格式规则

#### R8.1 Markdown格式

```yaml
标题层级:
  - H1: 报告标题
  - H2: 主要章节
  - H3: 子章节
  - H4: 详细内容

代码块:
  ✅ 指定语言: ```typescript
  ✅ 高亮关键行: 标注错误行
  ✅ 简洁明了: 不超过20行

链接格式:
  ✅ 文件链接: [src/App.tsx:15](file:///path/to/src/App.tsx#L15)
  ✅ 规范链接: [TypeScript规范](../rules/frontend_dev_debug_rules.md)
  ✅ 外部链接: [官方文档](https://www.typescriptlang.org/)
```

#### R8.2 JSON格式

```yaml
数据结构:
  ✅ 统一格式: 遵循CheckResult接口
  ✅ 完整信息: 包含所有必要字段
  ✅ 易于解析: 标准JSON格式

字段要求:
  - tool: 工具名称
  - status: 检测状态
  - errors: 错误列表
  - warnings: 警告列表
  - summary: 摘要信息
  - timestamp: 时间戳
```

---

## 🔔 通知规则

### R9: 通知发送规则

#### R9.1 P0错误通知

```yaml
触发条件:
  - 发现P0错误时立即发送

通知方式:
  - 即时通知: 不延迟
  - 多渠道通知: 控制台 + 日志 + 邮件（可选）

接收者:
  - 相关Agent: frontend-dev / backend-dev
  - 项目负责人: project-lead

通知内容:
  ✅ 错误摘要: 简明扼要
  ✅ 错误位置: 文件 + 行号
  ✅ 修复建议: 快速修复方案
  ✅ 报告链接: 详细报告地址

示例:
  🚨 【紧急】检测到TypeScript编译错误
  📍 src/App.tsx:15
  ❌ Type 'string' is not assignable to type 'number'
  💡 修复建议: 使用 Number() 转换
  📊 详细报告: /reports/MON-2026-04-02-001
```

#### R9.2 P1警告通知

```yaml
触发条件:
  - 检测完成后汇总发送
  - 或达到阈值时发送（如10个警告）

通知方式:
  - 汇总通知: 批量发送
  - 单一渠道: 控制台 + 日志

接收者:
  - 相关Agent: frontend-dev / backend-dev

通知内容:
  ✅ 警告数量: 总数统计
  ✅ 高频问题: TOP 3警告
  ✅ 修复建议: 建议修复方案
  ✅ 报告链接: 详细报告地址

示例:
  ⚠️ 【警告】本次检测发现5个警告
  📊 警告分布:
    - ESLint: 3个
    - TypeScript: 2个
  💡 建议在下次提交前修复
  📊 详细报告: /reports/MON-2026-04-02-001
```

#### R9.3 P2提示通知

```yaml
触发条件:
  - 定期汇总发送（每日/每周）

通知方式:
  - 定期报告: 每日/每周汇总
  - 单一渠道: 日志

接收者:
  - 所有Agent: all

通知内容:
  ✅ 提示数量: 总数统计
  ✅ 改进建议: 优化建议
  ✅ 趋势分析: 与历史对比

示例:
  📝 【提示】本周代码质量报告
  📊 健康度: 85/100
  📈 趋势: 较上周提升5分
  💡 改进建议: 补充单元测试
```

### R10: 通知频率规则

```yaml
P0错误:
  ✅ 立即发送: 不延迟
  ✅ 不限频率: 有错必发

P1警告:
  ✅ 汇总发送: 每次检测完成后
  ✅ 防止骚扰: 同一问题不重复通知

P2提示:
  ✅ 定期发送: 每日汇总
  ✅ 可配置: 用户可调整频率
```

---

## ⚙️ 配置规则

### R11: 配置文件规则

#### R11.1 配置文件位置

```yaml
主配置文件:
  - .trae/skills/monitor/config.json

项目配置文件:
  - .monitor/config.json (可选，优先级更高)

用户配置文件:
  - ~/.xunjianbao/monitor.json (可选，个人偏好)
```

#### R11.2 配置优先级

```yaml
优先级顺序:
  1. 用户配置 (最高)
  2. 项目配置
  3. 主配置 (最低)

合并策略:
  ✅ 深度合并: 递归合并对象
  ✅ 数组覆盖: 数组不合并，直接覆盖
  ✅ 空值忽略: null/undefined不覆盖
```

#### R11.3 配置验证

```yaml
验证规则:
  ✅ 类型检查: 验证配置项类型
  ✅ 范围检查: 验证数值范围
  ✅ 必填检查: 验证必填项
  ✅ 格式检查: 验证格式正确性

错误处理:
  ✅ 配置错误: 使用默认配置
  ✅ 警告提示: 提示配置错误
  ✅ 不影响运行: 配置错误不中断监控
```

---

## 🚫 禁止事项

### R12: 监控禁止规则

```yaml
🚫 绝对禁止:
  - 监控非代码文件（图片、视频等）
  - 在生产环境执行破坏性检测
  - 暴露敏感信息（密码、密钥）
  - 阻断非代码文件的提交
  - 频繁发送重复通知
  - 监控时间超过配置的超时时间

⚠️ 谨慎操作:
  - 修改监控配置（需project-lead批准）
  - 禁用监控项（需记录原因）
  - 调整错误分级（需团队讨论）
```

---

## ✅ 检查清单

### 监控前检查

- [ ] 配置文件正确
- [ ] 检测脚本可执行
- [ ] 依赖工具已安装
- [ ] 超时时间合理
- [ ] 通知渠道正常

### 监控中检查

- [ ] 执行时间在预期内
- [ ] 输出格式正确
- [ ] 错误识别准确
- [ ] 通知发送成功

### 监控后检查

- [ ] 报告生成成功
- [ ] 历史记录保存
- [ ] 问题跟踪到位
- [ ] 改进建议有效

---

## 🔗 相关文档

- [Monitor Skill](../skills/monitor/SKILL.md)
- [前端稳定性规则](./frontend_stability_rules.md)
- [测试规范](./testing_refactoring_rules.md)
- [Code Review规范](./code_review_rules.md)
- [全局开发规则](./global_dev_rules.md)

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**维护者**: 巡检宝Monitor团队

---

> **提醒**: 监控是为了帮助开发者，而不是打扰开发者。记住：**早发现、早报告、早修复 = 高质量代码** 🎯
