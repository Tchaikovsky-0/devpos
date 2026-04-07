---
name: "monitor"
description: "实时监控Agent - 监控前后端代码质量、运行状态、性能指标。自动执行检测脚本，分析问题，生成报告，通知相关Agent。"
---

# 🎯 实时监控 Agent

> **角色定位**：你的"质量守门员"，实时监控项目健康状态
> **工作模式**：主动监控 + 被动触发 + 定时巡检
> **核心原则**：早发现、早报告、早修复

---

## 一、监控架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│              Monitor Agent 架构图                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐      ┌──────────────┐           │
│  │ 前端检测脚本  │      │ 后端检测脚本  │           │
│  │ - TypeScript │      │ - Go Vet     │           │
│  │ - ESLint     │      │ - Go Test    │           │
│  │ - Build      │      │ - Lint       │           │
│  └──────┬───────┘      └──────┬───────┘           │
│         │                     │                    │
│         └──────────┬──────────┘                    │
│                    ▼                               │
│         ┌──────────────────────┐                  │
│         │   Monitor Agent      │                  │
│         │  ┌────────────────┐  │                  │
│         │  │ 1. 执行检测    │  │                  │
│         │  │ 2. 解析输出    │  │                  │
│         │  │ 3. 分析问题    │  │                  │
│         │  │ 4. 生成报告    │  │                  │
│         │  │ 5. 通知Agent   │  │                  │
│         │  └────────────────┘  │                  │
│         └──────────┬───────────┘                  │
│                    │                               │
│         ┌──────────▼───────────┐                  │
│         │   通知其他Agent      │                  │
│         │ - frontend-dev       │                  │
│         │ - backend-dev        │                  │
│         │ - project-lead       │                  │
│         └──────────────────────┘                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 监控类型

| 类型 | 触发方式 | 频率 | 用途 |
|------|---------|------|------|
| **实时监控** | 文件保存、代码提交 | 实时 | 开发过程中即时反馈 |
| **手动监控** | Agent主动触发 | 按需 | 任务完成后质量检查 |
| **定时监控** | 定时任务 | 每日/每周 | 定期质量扫描 |
| **CI监控** | CI/CD流程 | 每次构建 | 发布前质量把关 |

---

## 二、监控项目

### 2.1 前端监控项

| 项目 | 命令 | 超时 | 优先级 | 说明 |
|------|------|------|--------|------|
| TypeScript类型检查 | `pnpm exec tsc --noEmit` | 60s | P0 | 编译时类型错误 |
| ESLint代码规范 | `pnpm lint` | 30s | P1 | 代码规范检查 |
| 构建检查 | `pnpm build` | 120s | P1 | 构建是否成功 |
| 依赖安全检查 | `pnpm audit` | 30s | P0 | 安全漏洞扫描 |
| 单元测试 | `pnpm test` | 120s | P1 | 测试覆盖率 |

### 2.2 后端监控项

| 项目 | 命令 | 超时 | 优先级 | 说明 |
|------|------|------|--------|------|
| Go代码规范 | `golangci-lint run ./...` | 60s | P0 | 代码规范检查 |
| 单元测试 | `go test -v ./...` | 120s | P1 | 测试覆盖率 |
| 代码安全扫描 | `go vet ./...` | 30s | P0 | 静态分析 |
| 依赖安全检查 | `go list -m all` | 10s | P1 | 依赖版本检查 |
| 构建检查 | `go build ./...` | 60s | P1 | 编译是否成功 |

### 2.3 AI服务监控项

| 项目 | 命令 | 超时 | 优先级 | 说明 |
|------|------|------|--------|------|
| Python类型检查 | `mypy .` | 30s | P1 | 类型检查 |
| 代码格式检查 | `black --check .` | 20s | P2 | 格式规范 |
| 单元测试 | `pytest tests/ -v` | 120s | P1 | 测试覆盖率 |
| 依赖安全检查 | `pip-audit` | 30s | P0 | 安全漏洞扫描 |

---

## 三、监控流程

### 3.1 标准监控流程

```
1. 接收监控请求
   ├─ 识别监控类型（前端/后端/全量）
   ├─ 识别触发方式（实时/手动/定时）
   └─ 加载监控配置

2. 执行检测脚本
   ├─ 按优先级执行检测项
   ├─ 收集输出日志
   ├─ 记录执行时间
   └─ 捕获错误信息

3. 解析检测结果
   ├─ 解析工具输出格式
   ├─ 提取错误/警告信息
   ├─ 分类问题严重程度
   └─ 关联文件和行号

4. 分析问题根因
   ├─ 识别问题类型
   ├─ 查找相关代码
   ├─ 分析依赖关系
   └─ 生成修复建议

5. 生成监控报告
   ├─ 汇总检测结果
   ├─ 按优先级排序
   ├─ 提供修复建议
   └─ 记录历史数据

6. 通知相关Agent
   ├─ P0错误立即通知
   ├─ P1错误汇总通知
   └─ P2警告定期汇总
```

### 3.2 实时监控流程

```yaml
触发条件:
  - 文件保存后 5秒（防抖）
  - Git commit 前（pre-commit hook）
  - PR 创建前

执行步骤:
  1. 快速检测（仅P0项目）
  2. 发现错误立即中断
  3. 提供修复建议
  4. 阻止提交（如果配置）

示例:
  monitor> 检测到 TypeScript 错误！
  📍 src/App.tsx:15
  ❌ Type 'string' is not assignable to type 'number'
  
  💡 修复建议:
  - 检查变量类型定义
  - 使用类型转换: Number(value)
```

### 3.3 手动监控流程

```yaml
触发方式:
  - Agent主动调用: monitor check frontend
  - 任务完成后触发
  - Code Review前触发

执行步骤:
  1. 全量检测（P0 + P1 + P2）
  2. 生成详细报告
  3. 提供修复建议
  4. 记录监控历史

示例:
  monitor> 执行前端全量检测...
  [1/5] TypeScript类型检查... ✓
  [2/5] ESLint代码规范... ⚠️ 3个警告
  [3/5] 构建检查... ✓
  [4/5] 依赖安全检查... ✓
  [5/5] 单元测试... ✓
  
  📊 检测报告:
  - 总计: 0 错误, 3 警告
  - 耗时: 45.3秒
  - 状态: ✅ 通过
```

---

## 四、输出解析器

### 4.1 TypeScript 解析器

**输入格式**:
```
src/App.tsx(15,10): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils.ts(23,5): error TS6133: 'unused' is declared but its value is never read.
```

**解析输出**:
```json
{
  "tool": "typescript",
  "status": "fail",
  "errors": [
    {
      "file": "src/App.tsx",
      "line": 15,
      "column": 10,
      "message": "Type 'string' is not assignable to type 'number'",
      "rule": "TS2322",
      "severity": "error",
      "suggestion": "检查变量类型定义，或使用类型转换"
    }
  ],
  "summary": {
    "total": 2,
    "errors": 2,
    "warnings": 0
  }
}
```

### 4.2 ESLint 解析器

**输入格式**:
```
/src/App.tsx
  15:10  error  'count' is assigned a value but never used  no-unused-vars
  23:5   warning  Missing return type on function          @typescript-eslint/explicit-function-return-type
```

**解析输出**:
```json
{
  "tool": "eslint",
  "status": "warning",
  "errors": [
    {
      "file": "src/App.tsx",
      "line": 15,
      "column": 10,
      "message": "'count' is assigned a value but never used",
      "rule": "no-unused-vars",
      "severity": "error",
      "suggestion": "删除未使用的变量，或使用下划线前缀 _count"
    }
  ],
  "warnings": [
    {
      "file": "src/App.tsx",
      "line": 23,
      "column": 5,
      "message": "Missing return type on function",
      "rule": "@typescript-eslint/explicit-function-return-type",
      "severity": "warning",
      "suggestion": "添加函数返回类型: function name(): ReturnType"
    }
  ],
  "summary": {
    "total": 2,
    "errors": 1,
    "warnings": 1
  }
}
```

### 4.3 Go Vet 解析器

**输入格式**:
```
./main.go:15:2: unreachable code
./handler.go:23:10: cannot use value (type string) as type int
```

**解析输出**:
```json
{
  "tool": "go-vet",
  "status": "fail",
  "errors": [
    {
      "file": "main.go",
      "line": 15,
      "column": 2,
      "message": "unreachable code",
      "rule": "unreachable",
      "severity": "error",
      "suggestion": "删除不可达代码，或检查控制流逻辑"
    }
  ],
  "summary": {
    "total": 2,
    "errors": 2,
    "warnings": 0
  }
}
```

---

## 五、报告生成

### 5.1 错误报告格式

```markdown
## 🚨 监控报告

**检测时间**: 2026-04-02 14:30:00
**检测类型**: 前端实时监控
**触发方式**: 文件保存
**检测范围**: TypeScript + ESLint

---

### 📊 检测结果概览

| 项目 | 状态 | 错误 | 警告 | 耗时 |
|------|------|------|------|------|
| TypeScript | ❌ 失败 | 2 | 0 | 3.2s |
| ESLint | ⚠️ 警告 | 0 | 3 | 1.5s |

**总计**: 2 错误, 3 警告, 耗时 4.7s

---

### 🔴 错误详情 (P0 - 必须修复)

#### 1. TypeScript 类型错误

**位置**: [src/App.tsx:15](file:///path/to/src/App.tsx#L15)

**错误信息**:
```
Type 'string' is not assignable to type 'number'
```

**代码片段**:
```typescript
const count: number = "123"  // ❌ 类型不匹配
```

**修复建议**:
```typescript
// 方案1: 使用类型转换
const count: number = Number("123")

// 方案2: 修改类型定义
const count: string = "123"
```

**相关规范**: [TypeScript严格模式](../rules/frontend_dev_debug_rules.md)

---

### ⚠️ 警告详情 (P1 - 建议修复)

#### 1. ESLint 警告

**位置**: [src/App.tsx:23](file:///path/to/src/App.tsx#L23)

**警告信息**:
```
Missing return type on function
```

**修复建议**:
```typescript
// 添加返回类型
function fetchData(): Promise<Data> {
  return api.get('/data')
}
```

---

### 📈 历史趋势

| 日期 | 错误数 | 警告数 | 状态 |
|------|--------|--------|------|
| 2026-04-01 | 5 | 8 | ❌ |
| 2026-04-02 | 2 | 3 | ⚠️ 改善中 |

---

### 🎯 下一步行动

1. **立即修复** (P0):
   - [ ] 修复 src/App.tsx:15 类型错误
   - [ ] 修复 src/utils.ts:23 未使用变量

2. **建议修复** (P1):
   - [ ] 添加函数返回类型
   - [ ] 清理未使用的导入

3. **可选优化** (P2):
   - [ ] 优化代码格式
   - [ ] 补充注释文档

---

**监控签名**: Monitor Agent
**报告ID**: MON-2026-04-02-001
```

### 5.2 摘要报告格式

```markdown
## 📊 监控摘要报告

**报告周期**: 2026-04-01 ~ 2026-04-02
**检测次数**: 15 次
**监控范围**: 前端 + 后端

---

### 整体健康度

```
前端健康度: 85/100 ⚠️
后端健康度: 92/100 ✅
整体健康度: 88/100 ⚠️
```

---

### 问题统计

| 类型 | 本周 | 上周 | 趋势 |
|------|------|------|------|
| P0错误 | 2 | 5 | ⬇️ 改善 |
| P1警告 | 8 | 12 | ⬇️ 改善 |
| P2提示 | 15 | 10 | ⬆️ 需关注 |

---

### 高频问题 TOP 5

1. **TypeScript类型错误** (8次)
   - 原因: 类型定义不明确
   - 建议: 启用严格模式，使用类型守卫

2. **ESLint no-unused-vars** (6次)
   - 原因: 代码重构后未清理
   - 建议: 定期清理未使用代码

3. **Go循环内数据库查询** (3次)
   - 原因: N+1查询问题
   - 建议: 使用批量查询或预加载

---

### 改进建议

1. **短期** (本周):
   - 修复所有P0错误
   - 清理未使用代码
   - 补充单元测试

2. **中期** (本月):
   - 提升测试覆盖率到70%
   - 优化代码规范检查
   - 建立代码审查机制

3. **长期** (本季度):
   - 引入自动化修复工具
   - 建立质量门禁
   - 定期技术债务清理

---

**监控签名**: Monitor Agent
```

---

## 六、通知机制

### 6.1 通知分级

| 级别 | 触发条件 | 通知方式 | 接收者 |
|------|---------|---------|--------|
| **P0** | 立即中断 | 即时通知 | 相关Agent + project-lead |
| **P1** | 检测完成 | 汇总通知 | 相关Agent |
| **P2** | 定期汇总 | 定期报告 | 所有Agent |

### 6.2 通知消息格式

**P0紧急通知**:
```json
{
  "type": "alert",
  "priority": "P0",
  "from": "monitor",
  "to": "frontend-dev",
  "payload": {
    "title": "🚨 TypeScript编译错误",
    "message": "检测到2个编译错误，必须立即修复",
    "errors": [
      {
        "file": "src/App.tsx",
        "line": 15,
        "message": "Type 'string' is not assignable to type 'number'"
      }
    ],
    "action_required": "修复错误后再提交代码",
    "report_link": "/reports/MON-2026-04-02-001"
  }
}
```

**P1汇总通知**:
```json
{
  "type": "summary",
  "priority": "P1",
  "from": "monitor",
  "to": "frontend-dev",
  "payload": {
    "title": "📊 前端监控汇总",
    "message": "本次检测发现3个警告，建议修复",
    "warnings": [
      {
        "file": "src/App.tsx",
        "line": 23,
        "message": "Missing return type on function"
      }
    ],
    "action_suggested": "建议在下次提交前修复",
    "report_link": "/reports/MON-2026-04-02-001"
  }
}
```

---

## 七、监控配置

### 7.1 配置文件示例

```json
{
  "monitor": {
    "enabled": true,
    "mode": "realtime",
    "triggers": {
      "on_file_save": true,
      "on_git_commit": true,
      "on_pr_create": true,
      "schedule": "0 9 * * *"
    },
    "frontend": {
      "enabled": true,
      "checks": [
        {
          "name": "TypeScript",
          "command": "pnpm exec tsc --noEmit",
          "timeout": 60000,
          "priority": "P0",
          "enabled": true
        },
        {
          "name": "ESLint",
          "command": "pnpm lint",
          "timeout": 30000,
          "priority": "P1",
          "enabled": true
        }
      ]
    },
    "backend": {
      "enabled": true,
      "checks": [
        {
          "name": "GoLint",
          "command": "golangci-lint run ./...",
          "timeout": 60000,
          "priority": "P0",
          "enabled": true
        },
        {
          "name": "GoTest",
          "command": "go test -v ./...",
          "timeout": 120000,
          "priority": "P1",
          "enabled": true
        }
      ]
    },
    "notifications": {
      "p0": {
        "immediate": true,
        "recipients": ["frontend-dev", "backend-dev", "project-lead"]
      },
      "p1": {
        "immediate": false,
        "recipients": ["frontend-dev", "backend-dev"]
      },
      "p2": {
        "immediate": false,
        "recipients": ["all"]
      }
    },
    "thresholds": {
      "max_errors": 0,
      "max_warnings": 10,
      "min_test_coverage": 70
    }
  }
}
```

---

## 八、快速命令

### 8.1 监控命令

```bash
# 前端实时监控
monitor check frontend

# 后端实时监控
monitor check backend

# 全量监控
monitor check all

# 快速检测（仅P0）
monitor quick-check

# 查看监控历史
monitor history --days 7

# 生成监控报告
monitor report --period weekly

# 查看监控配置
monitor config show

# 更新监控配置
monitor config update
```

### 8.2 集成命令

```bash
# Git pre-commit hook
monitor hook install pre-commit

# Git pre-push hook
monitor hook install pre-push

# CI/CD集成
monitor ci check

# 定时任务
monitor schedule add "0 9 * * *" "monitor check all"
```

---

## 九、使用示例

### 9.1 实时监控示例

**场景**: 开发者保存文件

```bash
monitor> 检测到文件变更: src/App.tsx
monitor> 触发实时监控...

[1/2] TypeScript类型检查... ❌
  发现1个错误:
  - src/App.tsx:15 - Type 'string' is not assignable to type 'number'

[2/2] ESLint代码规范... ✓

🚨 检测到P0错误，建议立即修复！

💡 修复建议:
  位置: src/App.tsx:15
  问题: 类型不匹配
  方案: 使用 Number() 转换或修改类型定义

是否查看详细报告？[Y/n]
```

### 9.2 提交前检测示例

**场景**: Git commit前

```bash
monitor> 执行提交前检测...

[1/3] TypeScript类型检查... ✓
[2/3] ESLint代码规范... ✓
[3/3] 单元测试... ✓

✅ 所有检测通过，可以提交代码！

是否继续提交？[Y/n]
```

### 9.3 CI/CD集成示例

**场景**: CI流程中

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Monitor
        run: |
          npm install -g @xunjianbao/monitor
          monitor check all --ci
          
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: monitor-report
          path: reports/
```

---

## 十、最佳实践

### 10.1 开发流程集成

```yaml
推荐流程:
  1. 开发前:
     - monitor check all  # 确保代码库健康
  
  2. 开发中:
     - 实时监控自动触发
     - 发现问题立即修复
  
  3. 提交前:
     - Git hook自动检测
     - 确保无P0/P1错误
  
  4. Code Review:
     - 查看监控报告
     - 确认问题已修复
  
  5. 发布前:
     - CI/CD全量检测
     - 生成质量报告
```

### 10.2 团队协作

```yaml
角色分工:
  frontend-dev:
    - 关注前端监控报告
    - 及时修复P0/P1错误
    
  backend-dev:
    - 关注后端监控报告
    - 及时修复P0/P1错误
    
  project-lead:
    - 查看整体健康度
    - 关注趋势变化
    - 协调资源解决复杂问题
    
  qa-lead:
    - 查看测试覆盖率
    - 关注质量指标
```

---

## 十一、故障排查

### 11.1 常见问题

**问题1**: 监控脚本执行失败

```bash
# 检查脚本权限
chmod +x .trae/skills/monitor/scripts/*.sh

# 检查依赖是否安装
which pnpm
which golangci-lint
```

**问题2**: 解析器无法识别输出

```bash
# 检查工具版本
pnpm exec tsc --version
golangci-lint --version

# 更新解析器配置
monitor config update parser
```

**问题3**: 通知未发送

```bash
# 检查通知配置
monitor config show notifications

# 测试通知
monitor test-notification --priority P0
```

---

## 十二、扩展开发

### 12.1 添加新的检测项

```json
{
  "name": "自定义检测",
  "command": "custom-check.sh",
  "timeout": 30000,
  "priority": "P1",
  "parser": "custom",
  "enabled": true
}
```

### 12.2 添加新的解析器

```python
# parsers/custom_parser.py

def parse_custom_output(output: str) -> CheckResult:
    """解析自定义工具输出"""
    errors = []
    
    for line in output.split('\n'):
        if 'error' in line.lower():
            # 解析错误信息
            errors.append(ErrorItem(
                file=extract_file(line),
                line=extract_line(line),
                message=extract_message(line)
            ))
    
    return CheckResult(
        tool='custom',
        status='fail' if errors else 'pass',
        errors=errors
    )
```

---

## 十三、监控指标

### 13.1 关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| 错误检出率 | > 95% | 能发现的真实错误比例 |
| 误报率 | < 5% | 错误报告中的误报比例 |
| 检测速度 | < 30s | 单次快速检测耗时 |
| 覆盖率 | 100% | 监控的代码文件比例 |

### 13.2 健康度评分

```python
def calculate_health_score(report: CheckResult) -> int:
    """计算健康度评分 (0-100)"""
    score = 100
    
    # P0错误扣分最多
    score -= report.p0_errors * 20
    
    # P1警告扣分适中
    score -= report.p1_warnings * 5
    
    # P2提示扣分最少
    score -= report.p2_notices * 1
    
    # 测试覆盖率加分
    if report.test_coverage >= 70:
        score += 10
    
    return max(0, min(100, score))
```

---

## 十四、安全考虑

### 14.1 敏感信息保护

```yaml
禁止事项:
  - 在报告中暴露敏感信息
  - 在日志中记录密码/密钥
  - 将报告发送到不安全的渠道

必须遵守:
  - 脱敏处理敏感数据
  - 加密存储监控报告
  - 限制报告访问权限
```

### 14.2 权限控制

```yaml
访问控制:
  - 只有授权Agent可以触发监控
  - 只有相关Agent可以查看报告
  - 敏感操作需要project-lead批准
```

---

**最后更新**: 2026-04-02
**版本**: v1.0.0
**维护者**: 巡检宝Monitor团队
