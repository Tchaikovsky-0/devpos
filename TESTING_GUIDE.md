# 巡检宝 - 测试框架文档

> **版本**: v1.0.0
> **更新日期**: 2026-04-07
> **测试覆盖**: 单元测试、集成测试、E2E测试

---

## 📋 目录

1. [测试策略](#测试策略)
2. [测试金字塔](#测试金字塔)
3. [后端测试](#后端测试)
4. [前端测试](#前端测试)
5. [E2E测试](#e2e测试)
6. [测试配置](#测试配置)
7. [覆盖率报告](#覆盖率报告)
8. [CI/CD集成](#cicd集成)
9. [运行测试](#运行测试)
10. [最佳实践](#最佳实践)

---

## 测试策略

### 核心原则

```yaml
测试目标:
  1. 验证功能正确性 - 确保代码按预期工作
  2. 防止回归 - 捕获代码变更引入的问题
  3. 文档化行为 - 测试即文档
  4. 支持重构 - 测试让重构更安全

测试优先级:
  1. 核心业务逻辑 - 90%+ 覆盖率
  2. 边界条件 - 完整覆盖
  3. 错误处理 - 确保健壮性
  4. 性能测试 - 确保响应时间
```

### 测试类型

| 类型 | 数量占比 | 运行时间 | 隔离性 | 依赖 |
|------|---------|---------|--------|------|
| 单元测试 | 60-70% | <10ms | 完全隔离 | Mock |
| 集成测试 | 20-30% | 10-100ms | 部分隔离 | 数据库/Redis |
| E2E测试 | 5-10% | 100ms-10s | 无隔离 | 真实环境 |

---

## 测试金字塔

```
                    ┌─────────┐
                    │   E2E   │  少量、端到端
                    │  Tests  │  验证完整流程
                    └─────────┘
                  ┌───────────┐
                  │Integration│  中等数量
                  │  Tests   │  验证模块协作
                  └───────────┘
                ┌─────────────┐
                │   Unit     │  大量、快速
                │  Tests     │  测试最小单元
                └─────────────┘
```

---

## 后端测试

### 目录结构

```bash
backend/
├── internal/
│   ├── service/
│   │   ├── auth_test.go          # 认证服务测试
│   │   ├── task_test.go          # 任务服务测试 ✓ 新增
│   │   ├── report_test.go        # 报告服务测试 ✓ 新增
│   │   └── ...
│   ├── handler/
│   │   ├── auth_test.go          # 认证处理器测试
│   │   ├── media_test.go         # 媒体处理器测试 ✓ 新增
│   │   └── ...
│   └── pkg/
│       ├── config/
│       │   └── env_test.go       # 配置测试
│       └── response/
│           └── errors_test.go     # 错误处理测试
├── tests/
│   ├── integration/
│   │   └── api_test.go           # API集成测试
│   └── benchmark/
│       └── api_benchmark_test.go # 性能基准测试
└── coverage/                      # 覆盖率报告
```

### 测试命令

```bash
# 进入后端目录
cd backend

# 运行所有测试
go test ./...

# 运行单元测试
go test -v ./internal/service/... ./internal/handler/...

# 运行集成测试
go test -v ./tests/...

# 运行测试并显示覆盖率
go test -v -coverprofile=coverage.out ./...

# 生成HTML覆盖率报告
go tool cover -html=coverage.out -o coverage.html

# 运行带Race检测的测试
go test -v -race ./...

# 运行特定测试
go test -v -run TestAuthService_Authenticate

# 查看测试输出
go test -v ./... 2>&1 | tee test-output.log
```

### 测试示例

#### Service层测试

```go
func TestTaskService_Create(t *testing.T) {
    db := setupTaskTestDB(t)
    service := NewTaskService(db)
    tenantID := "tenant_test"

    // 测试用例
    tests := []struct {
        name        string
        req         CreateTaskRequest
        wantErr     bool
        checkFields func(t *testing.T, task *model.Task)
    }{
        {
            name: "create routine task with all fields",
            req: CreateTaskRequest{
                Title:       "Test Task",
                Description: "Test Description",
                Type:        "routine",
                Priority:    "P1",
            },
            wantErr: false,
            checkFields: func(t *testing.T, task *model.Task) {
                if task.Title != "Test Task" {
                    t.Errorf("expected title 'Test Task', got '%s'", task.Title)
                }
            },
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            task, err := service.Create(tenantID, tt.req)
            if (err != nil) != tt.wantErr {
                t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
                return
            }
            if !tt.wantErr && tt.checkFields != nil {
                tt.checkFields(t, task)
            }
        })
    }
}
```

#### Handler层测试

```go
func TestMediaHandler_ParseUintHelper(t *testing.T) {
    tests := []struct {
        name        string
        input       string
        expectError bool
        expectedVal uint
    }{
        {
            name:        "valid uint",
            input:       "123",
            expectError: false,
            expectedVal: 123,
        },
        {
            name:        "invalid string",
            input:       "abc",
            expectError: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := service.ParseUint(tt.input)
            // 断言逻辑...
        })
    }
}
```

---

## 前端测试

### 目录结构

```bash
frontend/
├── tests/
│   ├── unit/
│   │   ├── authSlice.test.ts      # Redux slice测试
│   │   ├── alertSlice.test.ts
│   │   ├── streamSlice.test.ts
│   │   ├── apiHooks.test.tsx
│   │   ├── hooks.test.ts
│   │   ├── components.test.tsx
│   │   └── utils.test.ts
│   ├── integration/
│   │   ├── LoginPage.integration.test.tsx  # 登录页面集成测试 ✓ 新增
│   │   ├── AlertTable.integration.test.tsx
│   │   └── Dashboard.integration.test.tsx
│   ├── e2e/
│   │   ├── app.spec.ts            # 完整E2E测试
│   │   └── TaskWorkflow.spec.ts    # 工作流E2E测试 ✓ 新增
│   ├── utils/
│   │   └── test-helpers.ts        # 测试工具函数 ✓ 新增
│   └── setup.ts                   # 测试配置
├── playwright.config.ts            # Playwright配置
├── vitest.config.ts               # Vitest配置
└── coverage/                       # 覆盖率报告
```

### 测试命令

```bash
# 进入前端目录
cd frontend

# 运行所有测试
pnpm test

# 运行测试并退出（CI模式）
pnpm test:run

# 运行特定测试文件
pnpm test:run tests/unit/authSlice.test.ts

# 运行特定测试套件
pnpm test:run --grep "Login"

# 监听模式（开发时）
pnpm test

# 生成覆盖率报告
pnpm test:run --coverage

# 生成多种格式的覆盖率报告
pnpm test:run --coverage --coverage.reporter=text --coverage.reporter=json --coverage.reporter=html

# 运行E2E测试
pnpm exec playwright test

# 运行特定E2E测试
pnpm exec playwright test tests/e2e/app.spec.ts

# 生成覆盖率报告
bash test-coverage.sh
```

### 测试示例

#### React组件测试

```typescript
// tests/unit/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByText('Loading')).toBeDisabled();
  });
});
```

#### Redux Slice测试

```typescript
// tests/unit/authSlice.test.ts
import { describe, it, expect } from 'vitest';
import authReducer, {
  loginSuccess,
  loginFailure,
  logout,
} from '@/store/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  it('should handle loginSuccess', () => {
    const user = { id: 1, username: 'test' };
    const token = 'test-token';

    const nextState = authReducer(initialState, loginSuccess({ user, token }));

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(user);
    expect(nextState.token).toBe(token);
  });

  it('should handle loginFailure', () => {
    const error = 'Invalid credentials';
    const nextState = authReducer(initialState, loginFailure(error));

    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.error).toBe(error);
  });

  it('should handle logout', () => {
    const stateWithUser = {
      ...initialState,
      user: { id: 1, username: 'test' },
      token: 'test-token',
      isAuthenticated: true,
    };

    const nextState = authReducer(stateWithUser, logout());

    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.isAuthenticated).toBe(false);
  });
});
```

#### 集成测试

```typescript
// tests/integration/LoginPage.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/routes/Login';

const mockLogin = vi.fn();
vi.mock('@/api/v1/auth', () => ({
  login: (...args: any[]) => mockLogin(...args),
}));

describe('LoginPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: 1, username: 'admin', role: 'admin' },
      token: 'test-token-123',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholder(/username|用户名/i);
    const passwordInput = screen.getByPlaceholder(/password|密码/i);
    const loginButton = screen.getByRole('button', { name: /login|登录/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123');
    });
  });
});
```

---

## E2E测试

### Playwright配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // 并行执行
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 浏览器配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Web服务器配置
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### E2E测试示例

```typescript
// tests/e2e/TaskWorkflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('complete login and logout cycle', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder(/username|用户名/i).fill('admin');
    await page.getByPlaceholder(/password|密码/i).fill('admin123');
    await page.getByRole('button', { name: /login|登录/i }).click();

    // Wait for dashboard
    await page.waitForURL(/\/center|\/dashboard/i);

    // Verify logged in
    await expect(page.locator('body')).toContainText(/dashboard|welcome/i);

    // Logout
    await page.getByRole('button', { name: /logout|退出|登出/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Stream Management', () => {
  test.use({ storageState: 'tests/e2e/auth-state.json' });

  test('create stream with RTSP URL', async ({ page }) => {
    await page.goto('/monitor');

    // Click add button
    const addButton = page.getByRole('button', { name: /\+|add|新增/i });
    await addButton.click();

    // Wait for modal
    const modal = page.locator('[role="dialog"], [class*="modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill form
    await page.getByLabel(/name|名称/i).fill('Test RTSP Stream');
    await page.getByLabel(/type|类型/i).selectOption('rtsp');
    await page.getByLabel(/url|地址/i).fill('rtsp://test.example.com/live/stream1');

    // Submit
    await page.getByRole('button', { name: /submit|save|提交|保存/i }).click();

    // Verify success
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/success|成功/i')).toBeVisible({ timeout: 5000 });
  });
});
```

---

## 测试配置

### Vitest配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 80,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

### 测试环境变量

```bash
# .env.test
VITE_API_BASE_URL=http://localhost:8094/api/v1
VITE_WS_URL=ws://localhost:8094
```

---

## 覆盖率报告

### 生成覆盖率报告

```bash
# 后端
cd backend
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# 前端
cd frontend
pnpm test:run --coverage --coverage.reporter=text --coverage.reporter=json --coverage.reporter=html
```

### 覆盖率阈值

```yaml
覆盖率目标:
  后端:
    - 语句覆盖: 60%+
    - 分支覆盖: 50%+
    - 函数覆盖: 70%+
  
  前端:
    - 行覆盖: 70%+
    - 函数覆盖: 80%+
    - 分支覆盖: 70%+
    - 语句覆盖: 70%+
```

### 覆盖率检查脚本

```bash
# backend/test-coverage.sh
#!/bin/bash
go test -v -race -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# 检查阈值
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
REQUIRED=60

if (( $(echo "$COVERAGE < $REQUIRED" | bc -l) )); then
  echo "❌ Coverage below threshold"
  exit 1
fi
echo "✅ Coverage: $COVERAGE%"
```

---

## CI/CD集成

### GitHub Actions工作流

```yaml
# .github/workflows/ci-testing.yml
name: Comprehensive Testing CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - run: go test -v -race -coverprofile=coverage.out ./...
      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage/

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:run --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage/

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
      - run: pnpm exec playwright test
```

### 本地CI检查

```bash
# scripts/run-all-tests.sh
#!/bin/bash

echo "Running all tests..."
cd backend && go test -v ./... && cd ..
cd frontend && pnpm test:run && cd ..
pnpm exec playwright test
```

---

## 运行测试

### 快速开始

```bash
# 运行所有测试
./scripts/run-all-tests.sh

# 只运行后端测试
./scripts/run-all-tests.sh --backend-only

# 只运行前端测试
./scripts/run-all-tests.sh --frontend-only

# 包括E2E测试
./scripts/run-all-tests.sh --e2e

# 生成覆盖率报告
./scripts/run-all-tests.sh --coverage
```

### 单个模块测试

```bash
# 后端
cd backend
go test -v ./internal/service/auth_test.go

# 前端
cd frontend
pnpm test:run tests/unit/authSlice.test.ts

# E2E
cd frontend
pnpm exec playwright test tests/e2e/app.spec.ts --project=chromium
```

### 测试开发模式

```bash
# 后端：监听文件变化自动运行测试
goweight watch go test ./...

# 前端：监听文件变化自动运行测试
pnpm test

# E2E：监听文件变化自动运行测试
pnpm exec playwright test --watch
```

---

## 最佳实践

### 1. 好的测试特征

```yaml
好的测试应该:
  ✅ 快速: 运行时间 < 100ms
  ✅ 独立: 不依赖其他测试
  ✅ 可重复: 每次运行结果一致
  ✅ 清晰: 测试名称说明测试内容
  ✅ 专注: 每个测试只验证一件事
```

### 2. 命名规范

```typescript
// 测试文件命名
authSlice.test.ts
LoginPage.integration.test.tsx
stream.e2e.spec.ts

// 测试套件命名
describe('AuthSlice', () => {
  describe('login', () => {
    it('should login successfully with valid credentials')
    it('should fail with invalid credentials')
  })
})

// 测试用例命名
test('should return true when input is valid', ...)
test('should throw error when database is unavailable', ...)
```

### 3. AAA模式

```typescript
// Arrange: 准备测试数据
const mockUser = { id: 1, username: 'test' };
const mockStore = createMockStore();

// Act: 执行被测操作
const result = await loginUser(mockStore, mockUser);

// Assert: 验证结果
expect(result).toEqual(mockUser);
expect(mockStore.auth.isAuthenticated).toBe(true);
```

### 4. Mock使用

```typescript
// Mock API调用
vi.mock('@/api/v1/auth', () => ({
  login: vi.fn().mockResolvedValue({ user: mockUser, token: 'test' }),
  logout: vi.fn(),
}));

// Mock WebSocket
vi.mock('@/lib/websocket', () => ({
  createWebSocket: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

// Mock数据库
const setupTestDB = (t) => {
  const db = createInMemoryDB();
  db.seed(mockData);
  return db;
};
```

### 5. 测试隔离

```go
// 后端：每个测试使用独立的数据库实例
func setupTestDB(t *testing.T) *gorm.DB {
  db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
  // 每个测试都是独立的内存数据库
  return db
}
```

```typescript
// 前端：每个测试后清理状态
beforeEach(() => {
  vi.clearAllMocks();
  store = createMockStore();
});

afterEach(() => {
  cleanup();
});
```

### 6. 避免的测试反模式

```yaml
❌ 不要测试:
  - 内部实现细节
  - 私有方法
  - 无关细节
  - 没有断言的测试

❌ 测试的反模式:
  - 测试实现而非行为
  - 测试没有断言
  - 测试过于复杂
  - 测试重复
  - 测试脆弱（容易因为无关更改而失败）
```

---

## 📊 测试报告模板

```markdown
# 🧪 测试报告

## 测试概览
- 测试日期: 2026-04-07
- 测试环境: CI/CD
- 测试类型: 单元 + 集成 + E2E

## 执行统计
- 测试用例总数: 150个
- 通过: 145个 ✓
- 失败: 5个 ✗
- 跳过: 0个

## 覆盖率
| 模块 | 行覆盖 | 分支覆盖 | 函数覆盖 |
|------|--------|----------|----------|
| 后端 | 72% | 65% | 85% |
| 前端 | 78% | 70% | 82% |

## 失败的测试
### 1. test_user_login_failure
- 原因: Mock API返回错误
- 建议: 检查API错误处理逻辑

### 2. test_stream_create_validation
- 原因: 缺少URL格式验证
- 建议: 添加URL格式验证

## 质量评估
- 测试设计: ⭐⭐⭐⭐☆ (良好)
- 覆盖率: ⭐⭐⭐⭐☆ (良好)
- 维护性: ⭐⭐⭐⭐⭐ (优秀)

## 改进建议
1. 提升分支覆盖率到75%
2. 添加更多边界条件测试
3. 增强E2E测试覆盖

## 结论
✅ 测试套件通过，质量合格，可以合并代码
```

---

## 📚 关联文档

- [后端测试代码](./backend/internal/service/)
- [前端测试代码](./frontend/tests/)
- [E2E测试代码](./frontend/tests/e2e/)
- [CI/CD配置](./.github/workflows/)
- [覆盖率脚本](./scripts/)

---

**最后更新**: 2026-04-07
**版本**: v1.0.0
**维护者**: 巡检宝开发团队
