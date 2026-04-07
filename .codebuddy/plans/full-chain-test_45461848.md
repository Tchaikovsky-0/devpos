---
name: full-chain-test
overview: 巡检宝全链路测试计划：执行完整的测试套件（后端单元/集成、前端单元/集成、E2E），评估覆盖率和测试质量，并生成详细评估报告。
todos:
  - id: run-backend-tests
    content: 执行后端全量测试 go vet + 单元测试 + 集成测试，使用 [skill:test-strategy] 评估后端测试质量
    status: completed
  - id: run-frontend-tests
    content: 执行前端全量测试 pnpm test:run --coverage，评估前端测试质量
    status: completed
  - id: run-e2e-tests
    content: 检查前后端服务状态并执行 E2E 测试，使用 [subagent:code-explorer] 定位失败用例
    status: completed
    dependencies:
      - run-backend-tests
      - run-frontend-tests
  - id: generate-report
    content: 汇总全链路测试结果，生成 TEST_REPORT.md 评估报告
    status: completed
    dependencies:
      - run-backend-tests
      - run-frontend-tests
      - run-e2e-tests
---

## 产品概述

执行巡检宝项目全链路测试，覆盖后端(Go)、前端(React/TypeScript)、端到端(Playwright)三个层级，并生成评估报告。

## 核心功能

- 后端：go vet 静态分析 + 单元测试(14文件，service/handler/pkg层) + 集成测试(SQLite内存库，完整API流程) + 覆盖率报告
- 前端：Vitest 单元测试(16文件，组件/Store/Hooks/工具) + 登录集成测试(React Redux完整流程)
- E2E：Playwright 4个spec文件(认证/仪表板/视频流/告警/媒体库/AI/响应式/导航/错误处理/性能)
- 测试脚本：`scripts/run-all-tests.sh --coverage --e2e` 一次执行全部测试
- 评估报告：汇总各级测试结果、覆盖率数据、失败分析、改进建议

## 技术栈

- 后端测试：Go 1.23 + testing + httptest + SQLite内存数据库 + GORM + `-race` 竞态检测
- 前端测试：Vitest 1.2 + jsdom + @testing-library/react + React Redux
- E2E测试：Playwright (Chromium/Firefox/WebKit/Mobile)
- 覆盖率：Go `go tool cover` + Vitest `--coverage`
- 测试运行：Bash脚本 `scripts/run-all-tests.sh`

## 实现方案

### 执行策略

采用分阶段执行，按依赖关系和风险递进：

1. **Phase 1 - 后端测试**（无外部依赖）

- `go vet ./...` 静态分析
- `go test -v -race ./internal/service/... ./internal/handler/... ./pkg/...` 单元测试(14个_test.go)
- `go test -v -race ./tests/integration/...` 集成测试(api_test.go，SQLite内存库)
- 覆盖率合并输出

2. **Phase 2 - 前端测试**（无外部依赖）

- `pnpm test:run --coverage` 单元+集成测试(18个test文件)
- jsdom环境，globals: true，setupFiles: tests/setup.ts

3. **Phase 3 - E2E测试**（依赖前后端服务运行）

- 前置条件检查：Go后端(8094) + React前端(5173) 必须运行
- Playwright global-setup 生成 auth-state.json
- 4个spec文件并行执行(chromium only)

4. **Phase 4 - 评估报告**

- 汇总所有测试结果（通过/失败/跳过）
- 覆盖率数据汇总
- 失败用例根因分析
- 改进建议

### 关键发现

- 后端集成测试使用 SQLite 内存数据库，不需要 MySQL 运行即可执行
- E2E 测试的 `app.spec.ts` 和 `TaskWorkflow.spec.ts` 依赖 auth-state.json，需先 global-setup
- 后端单元测试覆盖 7 个 service + 3 个 handler + 1 个 middleware + 2 个 pkg
- 前端 Vite 配置的 test 块内嵌在 vite.config.ts 中，没有独立的 vitest.config.ts
- E2E 默认 RUN_E2E=false，需显式传 `--e2e`

## 目录结构

```
项目根目录/
├── scripts/
│   └── run-all-tests.sh          # [MODIFY] 增强输出格式，添加评估摘要段
├── backend/
│   ├── internal/service/*_test.go   # [执行] 7个service单元测试
│   ├── internal/handler/*_test.go   # [执行] 3个handler单元测试
│   ├── internal/middleware/*_test.go # [执行] 1个middleware测试
│   ├── pkg/*_test.go                # [执行] 2个pkg测试
│   └── tests/integration/api_test.go # [执行] API集成测试
├── frontend/
│   ├── tests/unit/*.test.ts(x)     # [执行] 16个单元测试
│   ├── tests/integration/*.test.tsx # [执行] 1个集成测试
│   ├── tests/e2e/*.spec.ts         # [执行] 4个E2E spec
│   └── vite.config.ts              # [参考] 测试配置
└── TEST_REPORT.md                   # [NEW] 全链路测试评估报告
```

## 实现备注

- 后端测试中的 `._*_test.go` 文件是 macOS 资源叉文件，Go 编译器会忽略它们，无需处理
- 前端 `AlertTable.integration.test.tsx` 放在 tests/unit/ 目录下但命名含 integration，pnpm test:run 会一并执行
- E2E 测试如果前后端服务未运行，会优雅降级并报告跳过

## Agent Extensions

### Skill

- **test-strategy**
- Purpose: 测试策略专家技能，提供测试金字塔、覆盖率评估、质量保障方法论
- Expected outcome: 获得专业的测试评估框架和改进建议

### SubAgent

- **code-explorer**
- Purpose: 深度探索测试文件，定位失败根因
- Expected outcome: 快速定位测试失败的代码位置和原因