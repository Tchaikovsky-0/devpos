# 代码模板库

> 本目录包含巡检宝项目的标准化代码模板，供 Agent 开发时参考使用。

## 目录结构

```
templates/
├── README.md                      # 本文件
├── go/
│   ├── handler.template.go       # Handler 层模板
│   ├── service.template.go       # Service 层模板
│   ├── repository.template.go    # Repository 层模板
│   └── model.template.go         # Model 层模板
├── typescript/
│   ├── component.template.tsx    # React 组件模板
│   ├── api.template.ts           # API 模块模板
│   └── hook.template.ts          # React Hook 模板
└── python/
    ├── router.template.py        # FastAPI 路由模板
    └── service.template.py       # Python Service 模板
```

## 使用方法

### 自动替换变量

在生成代码时，请将以下变量替换为实际值：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{Entity}` | 实体名称（PascalCase） | `User`, `VideoStream` |
| `{entity}` | 实体名称（camelCase） | `user`, `videoStream` |
| `{entities}` | 实体复数（snake_case） | `users`, `video_streams` |
| `{Module}` | 模块名称（PascalCase） | `Detection`, `Analysis` |
| `{module}` | 模块名称（snake_case） | `detection`, `analysis` |
| `{Resource}` | 资源名称（PascalCase） | `Stream`, `Alert` |
| `{resource}` | 资源名称（camelCase） | `stream`, `alert` |
| `{ComponentName}` | 组件名称（PascalCase） | `StreamCard`, `AlertList` |

### 生成步骤

1. 选择对应的模板
2. 替换模板变量
3. 适配项目实际需求
4. 运行代码检查
5. 提交代码审查

### 代码检查命令

```bash
# Go 代码检查
cd server && golangci-lint run ./...

# TypeScript 代码检查
cd app && pnpm lint

# Python 代码检查
cd ai-service && black . && mypy .
```

---

**最后更新**: 2026年4月
