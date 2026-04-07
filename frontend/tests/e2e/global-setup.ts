import { chromium } from '@playwright/test';

/**
 * 认证状态 setup 脚本
 * 运行: npx playwright test --global-setup=tests/e2e/global-setup.ts
 *
 * 此脚本会:
 * 1. 登录系统获取认证状态
 * 2. 将状态保存到 tests/e2e/auth-state.json
 * 3. 后续测试通过 storageState 加载该文件跳过登录
 */

const AUTH_FILE = 'tests/e2e/auth-state.json';

async function globalSetup() {
  // 使用临时浏览器上下文执行登录
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 导航到登录页
    await page.goto('/');

    // 等待登录表单加载
    await page.waitForSelector('[placeholder*="用户名"], [placeholder*="username"]', {
      timeout: 10_000,
    });

    // 填写登录凭据（开发环境默认账号）
    const usernameInput = page.getByPlaceholder(/username|用户名/i);
    const passwordInput = page.getByPlaceholder(/password|密码/i);
    const loginButton = page.getByRole('button', { name: /login|登录/i });

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await loginButton.click();

    // 等待登录完成（跳转到 dashboard 或 center）
    await page.waitForURL(/\/center|\/dashboard/i, { timeout: 15_000 });

    // 保存认证状态
    await page.context().storageState({ path: AUTH_FILE });

    console.log('✓ 认证状态已保存到:', AUTH_FILE);
  } catch (error) {
    console.warn('⚠ 登录失败，auth-state.json 未生成。需要认证的测试将被跳过。');
    console.warn('  请确保后端服务运行在 http://localhost:8094');
    console.warn('  请确保前端服务运行在 http://localhost:5173');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
