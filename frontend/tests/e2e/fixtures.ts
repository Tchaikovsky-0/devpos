import { test as base, expect as baseExpect } from '@playwright/test';

/**
 * Playwright 自定义 test fixture
 *
 * 提供预配置的测试工具，减少样板代码
 */
export type AppFixture = {
  authenticatedPage: Awaited<ReturnType<typeof base['pages']['create']>>;
};

/**
 * 扩展 test fixture，提供已认证的页面
 */
export const test = base.extend<AppFixture>({
  authenticatedPage: async ({ page }, use) => {
    // 加载保存的认证状态
    try {
      await page.context().storageState({ path: 'tests/e2e/auth-state.json' });
    } catch {
      // 认证文件不存在时，尝试手动登录
      await page.goto('/');
      const usernameInput = page.getByPlaceholder(/username|用户名/i);
      const passwordInput = page.getByPlaceholder(/password|密码/i);
      const loginButton = page.getByRole('button', { name: /login|登录/i });

      if (await usernameInput.isVisible()) {
        await usernameInput.fill('admin');
        await passwordInput.fill('admin123');
        await loginButton.click();
        await page.waitForURL(/\/center|\/dashboard/i, { timeout: 10_000 });
      }
    }
    await use(page);
  },
});

export const expect = baseExpect;
