# 督察提醒模板库

> 提供标准化的提醒格式模板

---

## 🚨 紧急警告模板（P0违规）

```markdown
## 🚨 【紧急违规检测】

**违规类型**: {rule_id} - {violation_name}
**严重级别**: P0 - 永久性禁止规则
**位置**: {file_path}:{line_number}

### ❌ 问题描述
{clear_explanation_of_issue}

### 违规代码
```{language}
{violating_code_snippet}
```

### ⚠️ 为什么违规
{reason_why_this_is_a_violation}

### ⛔ 必须立即修正
{immediate_fix_required}

### ✅ 正确示范
```{language}
{correct_code_example}
```

### 📖 相关规范
- [禁止规则索引](.trae/rules/{rules_file}.md#{anchor})
- 规范位置: P0-{number} - {rule_name}

---
⚠️ [推测] 此检测基于代码模式匹配，建议人工复核确认。

**操作要求**: 必须修正后才能继续当前操作
```

### 使用示例

```markdown
## 🚨 【紧急违规检测】

**违规类型**: P0-001 - 硬编码敏感信息
**严重级别**: P0 - 永久性禁止规则
**位置**: src/config.ts:15

### ❌ 问题描述
在代码中硬编码了数据库密码，这是严重的安全漏洞。

### 违规代码
```typescript
const dbPassword = 'admin123'; // 硬编码密码！
```

### ⚠️ 为什么违规
硬编码密码会直接暴露在代码中，可能被：
1. 提交到版本控制系统
2. 被他人查看代码时发现
3. 在CI/CD日志中泄露

### ⛔ 必须立即修正
使用环境变量替代硬编码值

### ✅ 正确示范
```typescript
const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  throw new Error('DB_PASSWORD environment variable is required');
}
```

### 📖 相关规范
- [禁止规则索引](.trae/rules/security_rules.md#P0-001)
- 规范位置: P0-001 - 禁止硬编码敏感信息

---
⚠️ 此检测基于代码模式匹配，建议人工复核确认。

**操作要求**: 必须修正后才能继续当前操作
```

---

## ⚠️ 警告模板（P1违规）

```markdown
## ⚠️ 【违规警告】

**规则ID**: {rule_id}
**严重级别**: P1 - 高优先级
**位置**: {file_path}:{line_number}

### ⚠️ 问题
{issue_description}

### 💡 建议修正
{suggested_fix}

### ✅ 参考
```{language}
{reference_code}
```

### 📚 相关规范
- [代码质量规则](../agent_development_rules.md#{anchor})
- 规范位置: P1-{number} - {rule_name}

---
**建议**: 请在完成当前任务后修正此问题
```

### 使用示例

```markdown
## ⚠️ 【违规警告】

**规则ID**: P1-001
**严重级别**: P1 - 高优先级
**位置**: src/services/user_service.ts:23

### ⚠️ 问题
使用了 `any` 类型，这会失去TypeScript的类型安全优势

### 💡 建议修正
使用具体的类型定义或 `unknown` 类型

### ✅ 参考
```typescript
// ❌ 不推荐
const data: any = response.data;

// ✅ 推荐
interface UserResponse {
  users: User[];
  total: number;
}
const data: UserResponse = response.data;

// ✅ 或者使用 unknown
const data: unknown = response.data;
```

### 📚 相关规范
- [代码质量规则](../agent_development_rules.md#P1-001)
- 规范位置: P1-001 - 禁止使用 any 类型

---
**建议**: 请在完成当前任务后修正此问题
```

---

## 📝 提示模板（P2规范）

```markdown
## 📝 【规范提示】

**建议**: {suggestion}
**原因**: {reason}

### 💡 可选优化
{optional_improvement}

### 📚 参考
{reference}

---
**优先级**: 低 - 建议优化，非强制要求
```

### 使用示例

```markdown
## 📝 【规范提示】

**建议**: 考虑添加关键操作的日志记录
**原因**: 日志对于问题排查和系统监控非常重要

### 💡 可选优化
```go
func CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error) {
    log.Info("Creating user", zap.String("name", req.Name))
    
    user, err := s.repo.Create(ctx, req)
    if err != nil {
        log.Error("Failed to create user", zap.Error(err), zap.String("name", req.Name))
        return nil, err
    }
    
    log.Info("User created successfully", zap.Uint64("id", user.ID))
    return user, nil
}
```

### 📚 参考
- 日志规范: [.trae/rules/agent_development_rules.md#六、日志规范](../agent_development_rules.md#六、日志规范)

---
**优先级**: 低 - 建议优化，非强制要求
```

---

## 📊 统计报告模板

```markdown
## 📊 督察统计报告

**检查时间**: {timestamp}
**检查范围**: {scope}
**Agent**: {agent_name}

---

### 📈 违规统计概览

| 级别 | 数量 | 状态 |
|------|------|------|
| 🚨 P0 紧急 | {count} | {status} |
| ⚠️ P1 警告 | {count} | {status} |
| 📝 P2 提示 | {count} | {status} |

**总体状态**: {status_emoji} {status_text}

---

### 🚨 P0违规详情

{如果存在P0违规}

### ⚠️ P1违规详情

{如果存在P1违规}

### 📝 P2提示详情

{如果存在P2提示}

---

### 📊 趋势分析

**本周违规趋势**: {trend}

**主要违规类型**:
1. {type1} - {count1}次
2. {type2} - {count2}次
3. {type3} - {count3}次

---

### 🎯 改进建议

1. {suggestion1}
2. {suggestion2}
3. {suggestion3}

---

### 📅 后续计划

- [ ] 修正所有P0违规
- [ ] 修正所有P1违规
- [ ] 考虑采纳P2提示
- [ ] 下次检查: {next_check_date}

---

**督察签名**: Inspector Agent 🤖
**生成时间**: {timestamp}
```

### 使用示例

```markdown
## 📊 督察统计报告

**检查时间**: 2026-04-02 14:30:00
**检查范围**: src/services/user_service.ts
**Agent**: backend-dev

---

### 📈 违规统计概览

| 级别 | 数量 | 状态 |
|------|------|------|
| 🚨 P0 紧急 | 0 | ✅ 已全部修正 |
| ⚠️ P1 警告 | 2 | 🔄 待修正 |
| 📝 P2 提示 | 3 | ⏳ 建议采纳 |

**总体状态**: ✅ 良好 - 可以继续开发

---

### ⚠️ P1违规详情

1. **P1-001**: 第23行使用了 `any` 类型
   - 建议: 定义明确的类型接口

2. **P1-002**: 第45行使用了 `SELECT *`
   - 建议: 明确列出需要的字段

### 📝 P2提示详情

1. 第67行 `createUser` 函数缺少日志记录
2. 第89行可以考虑使用常量替代魔法数字
3. 缺少函数级别的注释文档

---

### 🎯 改进建议

1. 优先修正2个P1违规，确保代码类型安全
2. 建议为关键函数添加日志，提升可调试性
3. 考虑添加JSDoc注释，提高代码可读性

---

### 📅 后续计划

- [ ] 修正所有P0违规
- [x] 修正所有P1违规
- [ ] 考虑采纳P2提示
- [ ] 下次检查: 2026-04-02 16:00:00

---

**督察签名**: Inspector Agent 🤖
**生成时间**: 2026-04-02 14:30:05
```

---

## 🔄 上下文管理提醒模板

```markdown
## 🎯 上下文长度提醒

**当前级别**: {L1/L2/L3/L4/L5}
**预估长度**: {estimated_length}

### 📊 长度趋势
{可视化图表或描述}

### ⚠️ {状态提示}

{基于不同级别的提醒内容}

### 💡 建议操作

1. {建议1}
2. {建议2}
3. {建议3}

---
**优先级**: {high/medium/low}
```

### 使用示例

**L2级别提醒**：
```markdown
## 🎯 上下文长度提醒

**当前级别**: L2 - 关注区
**预估长度**: ~35KB

### ⚠️ 状态提示
上下文长度已进入L2级别，需要开始关注精简问题

### 💡 建议操作

1. 精简不必要的重复信息
2. 聚焦当前任务核心
3. 考虑在关键节点生成摘要

---
**优先级**: 中 - 建议开始注意
```

**L3级别强制提醒**：
```markdown
## 🚨 【必须】上下文长度达到L3级别

**当前级别**: L3 - 预警区
**预估长度**: ~72KB

### ⚠️ 状态提示
上下文长度已达到L3级别，必须生成摘要！

### 💡 必须执行的操作

1. **立即生成摘要**
   - 总结已完成的工作
   - 列出待解决的问题
   - 明确下一步计划

2. **清理非必要信息**
   - 移除临时文件引用
   - 精简长代码块
   - 移除重复说明

3. **重置上下文**
   - 开始新的对话阶段
   - 基于摘要继续工作

---
**优先级**: 高 - 必须立即执行
```

---

## ✅ 违规修正确认模板

```markdown
## ✅ 违规修正确认

**违规ID**: {violation_id}
**规则**: {rule_id} - {rule_name}
**位置**: {file_path}:{line_number}

### 📝 修正内容
{描述如何修正了违规}

### 🔍 修正后代码
```{language}
{corrected_code}
```

### ✅ 验证结果
- [x] P0检查: 通过
- [x] 代码规范: 符合
- [x] 类型安全: 保障

**状态**: ✅ 已修正，可以继续

---
**修正时间**: {timestamp}
**Agent**: {agent_name}
```

---

## 🚫 误报申诉模板

```markdown
## 🚫 误报申诉

**违规ID**: {violation_id}
**规则**: {rule_id}
**申诉理由**: {reason}

### 📝 申诉详情
{详细说明为什么认为这是误报}

### 💡 佐证信息
- 文件: {file_path}
- 代码片段: {code_snippet}
- 上下文: {context}

### ✅ 建议操作
{建议如何改进规则或接受申诉}

---
**申诉时间**: {timestamp}
**Agent**: {agent_name}
```

---

## 📝豁免申请模板

```markdown
## 📝 豁免申请

**规则**: {rule_id}
**场景**: {scenario_description}

### 📝 申请理由
{详细说明为什么需要豁免}

### 💡 替代方案
{如果有替代方案，说明}

### ⏰ 豁免期限
{date}

### 📋 豁免条件
- [ ] 添加注释说明原因
- [ ] 设置豁免期限
- [ ] 记录豁免原因

---
**申请时间**: {timestamp}
**Agent**: {agent_name}
```

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
