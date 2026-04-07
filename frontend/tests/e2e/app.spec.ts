import { test, expect } from '@playwright/test';

test.describe('Xunjianbao E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
      await expect(page).toHaveTitle(/巡检宝|xunjianbao/i);
      
      // Check login form elements
      const usernameInput = page.getByPlaceholder(/username|用户名/i);
      const passwordInput = page.getByPlaceholder(/password|密码/i);
      const loginButton = page.getByRole('button', { name: /login|登录/i });
      
      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      // Fill login form
      await page.getByPlaceholder(/username|用户名/i).fill('admin');
      await page.getByPlaceholder(/password|密码/i).fill('admin123');
      
      // Click login
      await page.getByRole('button', { name: /login|登录/i }).click();
      
      // Wait for navigation and check we're on dashboard
      await page.waitForURL(/\/center|\/dashboard/i);
      await expect(page.locator('body')).toContainText(/dashboard|监控中心|welcome/i);
    });

    test('should show error with invalid credentials', async ({ page }) => {
      // Fill with wrong credentials
      await page.getByPlaceholder(/username|用户名/i).fill('wronguser');
      await page.getByPlaceholder(/password|密码/i).fill('wrongpassword');
      await page.getByRole('button', { name: /login|登录/i }).click();
      
      // Check for error message
      await expect(page.locator('text=/invalid|error|错误/i')).toBeVisible();
    });
  });

  test.describe('Dashboard', () => {
    test.use({
      storageState: 'tests/e2e/auth-state.json',
    });

    test('should display dashboard with statistics', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check dashboard elements
      await expect(page.locator('text=/statistics|统计/i')).toBeVisible();
      
      // Check for charts or data cards
      const cards = page.locator('[class*="card"]');
      await expect(cards.first()).toBeVisible();
    });

    test('should display recent alerts', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Look for alerts section
      const alertsSection = page.locator('text=/alerts|告警/i');
      await expect(alertsSection).toBeVisible();
    });
  });

  test.describe('Stream Management', () => {
    test.use({
      storageState: 'tests/e2e/auth-state.json',
    });

    test('should navigate to streams page', async ({ page }) => {
      await page.goto('/monitor');
      
      // Check streams page loaded
      await expect(page.locator('text=/streams|视频流|monitor/i')).toBeVisible();
    });

    test('should create a new stream', async ({ page }) => {
      await page.goto('/monitor');
      
      // Click add stream button
      await page.getByRole('button', { name: /add|create|新增|创建/i }).click();
      
      // Fill stream form
      await page.getByLabel(/name|名称/i).fill('E2E Test Stream');
      await page.getByLabel(/type|类型/i).selectOption('rtsp');
      await page.getByLabel(/url/i).fill('rtsp://test.example.com/stream');
      
      // Submit form
      await page.getByRole('button', { name: /submit|save|提交|保存/i }).click();
      
      // Wait for success message
      await expect(page.locator('text=/success|成功/i')).toBeVisible();
      
      // Verify stream appears in list
      await expect(page.locator('text=E2E Test Stream')).toBeVisible();
    });

    test('should view stream details', async ({ page }) => {
      await page.goto('/monitor');
      
      // Click on a stream
      await page.locator('[class*="stream-item"]').first().click();
      
      // Check details page
      await expect(page.locator('text=/details|详情/i')).toBeVisible();
    });
  });

  test.describe('Alerts', () => {
    test.use({
      storageState: 'tests/e2e/auth-state.json',
    });

    test('should navigate to alerts page', async ({ page }) => {
      await page.goto('/alerts');
      
      // Check alerts page loaded
      await expect(page.locator('text=/alerts|告警/i')).toBeVisible();
    });

    test('should filter alerts by level', async ({ page }) => {
      await page.goto('/alerts');
      
      // Select filter
      await page.getByLabel(/level|级别/i).selectOption('CRIT');
      
      // Check filtered results
      await page.waitForTimeout(500);
      const alerts = page.locator('[class*="alert-item"]');
      const count = await alerts.count();
      
      for (let i = 0; i < count; i++) {
        await expect(alerts.nth(i)).toContainText(/CRIT|critical/i);
      }
    });

    test('should acknowledge an alert', async ({ page }) => {
      await page.goto('/alerts');
      
      // Click on first alert
      await page.locator('[class*="alert-item"]').first().click();
      
      // Click acknowledge button
      await page.getByRole('button', { name: /acknowledge|确认/i }).click();
      
      // Check for success
      await expect(page.locator('text=/success|成功/i')).toBeVisible();
    });
  });

  test.describe('Media Library', () => {
    test.use({
      storageState: 'tests/e2e/auth-state.json',
    });

    test('should navigate to media library', async ({ page }) => {
      await page.goto('/media');
      
      // Check media library loaded
      await expect(page.locator('text=/media|媒体库/i')).toBeVisible();
    });

    test('should upload a file', async ({ page }) => {
      await page.goto('/media');
      
      // Click upload button
      await page.getByRole('button', { name: /upload|上传/i }).click();
      
      // Set file input
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image content'),
      });
      
      // Check for success
      await expect(page.locator('text=/success|成功|uploaded/i')).toBeVisible();
    });
  });

  test.describe('AI Features', () => {
    test.use({
      storageState: 'tests/e2e/auth-state.json',
    });

    test('should navigate to AI chat', async ({ page }) => {
      await page.goto('/ai');
      
      // Check AI chat loaded
      await expect(page.locator('text=/ai|chat|对话/i')).toBeVisible();
    });

    test('should send a message to AI', async ({ page }) => {
      await page.goto('/ai');
      
      // Type message
      await page.getByPlaceholder(/type.*message|输入.*消息/i).fill('Hello AI');
      
      // Send message
      await page.getByRole('button', { name: /send|发送/i }).click();
      
      // Check message appears in chat
      await expect(page.locator('text=Hello AI')).toBeVisible();
      
      // Wait for AI response
      await page.waitForTimeout(2000);
      await expect(page.locator('[class*="ai-response"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should work on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should work on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test.use({
      storageState: 'tests/e2e/auth-state.json',
    });

    test('should navigate using sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate to different pages using sidebar
      const navItems = [
        { name: /dashboard|仪表板/i, url: /dashboard/i },
        { name: /monitor|监控/i, url: /monitor/i },
        { name: /alerts|告警/i, url: /alerts/i },
        { name: /media|媒体/i, url: /media/i },
      ];

      for (const item of navItems) {
        await page.getByRole('link', { name: item.name }).click();
        await page.waitForURL(item.url);
        await expect(page).toHaveURL(item.url);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Check for 404 page or redirect to login
      const is404 = await page.locator('text=/404|not found/i').isVisible();
      const isLogin = await page.locator('text=/login|登录/i').isVisible();
      
      expect(is404 || isLogin).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort('failed'));
      
      await page.goto('/');
      
      // App should still render (even if with error message)
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
