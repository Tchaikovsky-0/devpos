# 🎯 督察快速参考卡

> **巡检宝项目督察 - 核心规则速查**
> 完整规范请查看：[SKILL.md](./SKILL.md)

---

## 🚨 违规分级速查

| 级别 | 名称 | 数量 | 处理方式 | 阻塞 |
|------|------|------|---------|------|
| 🚨 P0 | 永久禁止 | 5条 | 立即中断 | ✅ 阻塞 |
| ⚠️ P1 | 高优先级 | 5条 | 要求修正 | ❌ 不阻塞 |
| 📝 P2 | 中优先级 | 4条 | 建议修正 | ❌ 不阻塞 |
| 🔒 SEC | 安全漏洞 | 4条 | 立即中断 | ✅ 阻塞 |

---

## 🚨 P0紧急违规（绝对红线）

### P0-001: 硬编码敏感信息
```typescript
// ❌ 违规
const password = 'admin123';

// ✅ 正确
const password = process.env.DB_PASSWORD;
```

### P0-002: 未验证就断言
```markdown
// ❌ 违规
这个文件肯定在src目录下

// ✅ 正确
根据项目结构推测，文件可能在src目录下 [推测] ⚠️需要验证
```

### P0-003: 循环内查数据库
```go
// ❌ 违规
for _, id := range ids {
    db.Find(&user, id)
}

// ✅ 正确
db.Find(&users, "id IN ?", ids)
```

### P0-004: 未备份改数据
```sql
-- ❌ 违规
DELETE FROM users WHERE id = 1;

-- ✅ 正确
BEGIN TRANSACTION;
SELECT * FROM users WHERE id = 1; -- 先备份
DELETE FROM users WHERE id = 1;
```

### P0-005: 凭空捏造路径
```markdown
// ❌ 违规
修改 src/components/Button.tsx

// ✅ 正确
先使用 Glob/Read 工具验证文件存在
Glob: src/**/*Button*.tsx
```

---

## ⚠️ P1警告规则（必须修正）

### P1-001: 禁止any类型
```typescript
// ❌ 违规
const data: any = response.data;

// ✅ 正确
const data: ApiResponse<User[]> = response.data;
```

### P1-002: 禁止SELECT *
```sql
-- ❌ 违规
SELECT * FROM users

-- ✅ 正确
SELECT id, name, email FROM users
```

### P1-003: 必须处理error
```go
// ❌ 违规
if err != nil {}
if err != nil { }

// ✅ 正确
if err != nil {
    log.Error("操作失败", zap.Error(err))
    return nil, err
}
```

### P1-004: 必须释放资源
```go
// ❌ 违规
file, _ := os.Open(filename)

// ✅ 正确
file, err := os.Open(filename)
if err != nil {
    return err
}
defer file.Close()
```

### P1-005: 必须显式返回类型
```typescript
// ❌ 违规
function getData() { return data; }

// ✅ 正确
function getData(): Promise<User[]> { return data; }
```

---

## 📝 P2提示规则（建议优化）

| 规则 | 说明 | 快速修正 |
|------|------|---------|
| P2-001 | 跳过代码审查 | 发起PR进行审查 |
| P2-002 | 缺少日志记录 | 添加log.Info/Error |
| P2-003 | 任务状态未更新 | 使用TodoWrite标记完成 |
| P2-004 | 上下文过长 | 生成摘要精简信息 |

---

## 🔒 安全漏洞（立即中断）

### SEC-001: SQL注入
```typescript
// ❌ 违规 - 字符串拼接SQL
query = "SELECT * FROM users WHERE name = '" + username + "'";

// ✅ 正确 - 参数化查询
query = "SELECT * FROM users WHERE name = ?";
db.query(query, [username]);
```

### SEC-002: XSS风险
```typescript
// ❌ 违规
element.innerHTML = userInput;

// ✅ 正确
element.textContent = userInput;
```

### SEC-003: 敏感信息泄露
```typescript
// ❌ 违规
console.log('password:', user.password);

// ✅ 正确
console.log('password:', '***');
```

---

## 📊 上下文长度阈值

| 级别 | 长度 | 状态 | 操作 |
|------|------|------|------|
| L1 | < 20KB | ✅ 健康 | 继续工作 |
| L2 | 20-50KB | ⚠️ 关注 | 注意精简 |
| L3 | 50-100KB | 🚨 预警 | 必须摘要 |
| L4 | 100-200KB | 🚨 危险 | 立即摘要 |
| L5 | > 200KB | 🚨 失控 | 停止，摘要 |

---

## 🎯 快速检查命令

```bash
# 快速检查（<5秒）
inspector quick

# 标准检查（15-30秒）
inspector check <file>

# 深度检查（1-5分钟）
inspector deep <directory>

# 上下文状态
inspector context

# 违规历史
inspector violations --days 7

# 生成报告
inspector report --period weekly
```

---

## ✅ 违规修正检查清单

### P0违规修正
- [ ] 立即停止当前操作
- [ ] 识别违规代码位置
- [ ] 应用正确方案
- [ ] 验证修正结果
- [ ] 获得确认后继续

### P1违规修正
- [ ] 记录所有P1违规
- [ ] 应用修正方案
- [ ] 确保类型安全
- [ ] 验证编译通过
- [ ] 继续工作

### P2违规修正
- [ ] 记录所有P2提示
- [ ] 根据需要选择性修正
- [ ] 提升代码质量
- [ ] 非强制，可后续处理

---

## 📋 常用检测正则

```regex
# 敏感信息
(?i)(password|secret|api_key)\s*[=:]\s*['"][^'"]+['"]

# any类型
:\s*any\b

# SELECT *
(?i)SELECT\s+\*

# error未处理
err\s*!=\s*nil\s*\{\s*\}

# SQL注入
SELECT.*\+
INSERT.*\+
```

---

## 🚀 最佳实践

### 编码时
- ✅ 使用有意义的变量名
- ✅ 添加适当的类型标注
- ✅ 记录关键操作的日志
- ✅ 使用const而非let（常量）
- ✅ 函数要有明确的返回类型

### 代码审查时
- ✅ 检查是否有P0违规
- ✅ 确保error被正确处理
- ✅ 验证资源是否正确释放
- ✅ 检查敏感信息是否脱敏

### 任务完成时
- ✅ 更新任务状态为completed
- ✅ 生成上下文摘要（如需要）
- ✅ 确认所有P0/P1已修正
- ✅ 发起代码审查PR

---

## 🚫 永久禁止清单

```
绝对禁止：
- ❌ 硬编码密码/密钥/Token
- ❌ 未验证就断言文件存在
- ❌ 循环内查询数据库
- ❌ 未备份就修改生产数据
- ❌ 使用any类型
- ❌ SELECT *
- ❌ 不处理的error
- ❌ 不释放的资源
- ❌ SQL字符串拼接
- ❌ 硬编码敏感信息
```

---

## 📞 遇到问题？

### 规则冲突
使用豁免注释：
```typescript
// inspector-ignore: P1-001
// 原因: 第三方API返回动态类型
// 豁免期限: 2026-04-15
```

### 误报申诉
使用误报申诉模板（见templates.md）

### 需要帮助
参考完整规范：SKILL.md

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**维护者**: Inspector Agent 🤖
