# 命令格式规范

> **目标**: 提供可直接复制执行的零注释命令，最大化开发效率
> **版本**: v1.0.0
> **创建日期**: 2026-04-06

---

## 一、核心规则

### 1.1 命令格式标准

```yaml
✅ 正确格式:
  - 无注释
  - 无说明文字
  - 可直接复制执行
  - 每行一个完整命令

❌ 错误格式:
  - 包含 # 注释
  - 包含中文说明
  - 需要用户判断哪些执行
  - 包含多余空行
```

### 1.2 正确示例

```bash
# ✅ 正确
cd /Volumes/KINGSTON/xunjianbao/.trae
pnpm install
pnpm test:run

# ❌ 错误
cd .trae  # 进入测试目录
pnpm install  # 安装依赖
pnpm test:run  # 运行测试
```

### 1.3 复合命令

```bash
# ✅ 正确 - 使用 && 连接
cd /Volumes/KINGSTON/xunjianbao/.trae && pnpm install && pnpm test:run

# ✅ 正确 - 独立多行
cd /Volumes/KINGSTON/xunjianbao/.trae
pnpm install
pnpm test:run
```

---

## 二、命令分类标准

### 2.1 顺序执行的命令

```bash
# 使用换行分隔，每行独立可执行
cd /Volumes/KINGSTON/xunjianbao/.trae
pnpm install
pnpm test:run
```

### 2.2 选择性执行的命令

```bash
# 如果需要选择，提供多个完整命令
cd /Volumes/KINGSTON/xunjianbao/.trae && pnpm test:run

# 或者
cd /Volumes/KINGSTON/xunjianbao/.trae
npx vitest run
```

---

## 三、常见场景命令

### 3.1 测试运行

```bash
cd /Volumes/KINGSTON/xunjianbao/.trae
pnpm install
pnpm test:run
```

### 3.2 前端开发

```bash
cd /Volumes/KINGSTON/xunjianbao/frontend
pnpm dev
```

### 3.3 后端开发

```bash
cd /Volumes/KINGSTON/xunjianbao/server
go run cmd/server/main.go
```

### 3.4 Python AI服务

```bash
cd /Volumes/KINGSTON/xunjianbao/ai-service
uvicorn app.main:app --reload
```

---

## 四、禁止事项

```yaml
❌ 禁止在命令中包含:
  - # 注释
  - 中文说明
  - 括号内的解释
  - 多余的描述文字
  
❌ 禁止格式:
  - "执行这个命令：" 前缀
  - "命令如下：" 前缀
  - 带编号的步骤说明
  
✅ 正确做法:
  - 直接提供可执行命令
  - 每行一个完整命令
  - 使用 && 连接复合命令
```

---

## 五、例外情况

```yaml
⚠️ 例外场景:
  1. 多步骤选择 - 提供清晰的独立命令
  2. 环境变量 - 在命令中说明但不注释
  3. 长命令 - 可以适当分行但保持可执行
```

---

## 六、快速参考

```
命令格式规则:
  ✅ 无注释
  ✅ 无说明
  ✅ 可直接复制执行
  ✅ 每行一个完整命令

格式示例:
  cd /path/to/project
  pnpm install
  pnpm test:run
```

---

**最后更新**: 2026-04-06
**状态**: 启用
