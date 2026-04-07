import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',

  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',

  // 超时配置
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // 并行执行（每个 spec 文件独立进程）
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告配置
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 全局配置
  use: {
    // 基础 URL（前端开发服务器）
    baseURL: 'http://localhost:5173',

    // 收集失败测试的 trace
    trace: 'on-first-retry',

    // 截图策略
    screenshot: 'only-on-failure',

    // 失败时录制视频（CI 环境）
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // 导航超时
    navigationTimeout: 10_000,

    // 操作超时
    actionTimeout: 5_000,
  },

  // 按项目配置浏览器
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
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // 开发服务器配置（可选，CI 中使用独立启动）
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
