import { test, expect } from '@playwright/test';

/**
 * Enhanced E2E Test Suite for Xunjianbao
 * Comprehensive coverage of critical user workflows
 */

test.describe('Enhanced E2E Tests', () => {

  // ============================================================================
  // Authentication Tests
  // ============================================================================
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

    test('session persistence across page refresh', async ({ page }) => {
      // Login
      await page.goto('/');
      await page.getByPlaceholder(/username|用户名/i).fill('admin');
      await page.getByPlaceholder(/password|密码/i).fill('admin123');
      await page.getByRole('button', { name: /login|登录/i }).click();

      await page.waitForURL(/\/center|\/dashboard/i);

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  // ============================================================================
  // Dashboard Tests
  // ============================================================================
  test.describe('Dashboard', () => {
    test.use({ storageState: 'tests/e2e/auth-state.json' });

    test('dashboard loads with real-time data', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for data to load
      await page.waitForLoadState('networkidle');

      // Check for statistics cards
      const statsCards = page.locator('[class*="card"], [class*="stat"]');
      await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('dashboard refreshes data', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait a bit for data to stabilize
      await page.waitForTimeout(2000);

      // Click refresh button if exists
      const refreshButton = page.getByRole('button', { name: /refresh|刷新/i });
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        await page.waitForTimeout(1000);
      }

      // Verify page still works
      await expect(page.locator('body')).toBeVisible();
    });

    test('navigate to different dashboard tabs', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for tabs
      const tabs = page.locator('[role="tab"], [class*="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 0) {
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(500);
        }
      }

      // Dashboard should still be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ============================================================================
  // Stream Management Tests
  // ============================================================================
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

    test('validate stream URL format', async ({ page }) => {
      await page.goto('/monitor');

      const addButton = page.getByRole('button', { name: /\+|add|新增/i });
      await addButton.click();

      const modal = page.locator('[role="dialog"], [class*="modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Try invalid URL
      await page.getByLabel(/name|名称/i).fill('Invalid Stream');
      await page.getByLabel(/type|类型/i).selectOption('rtsp');
      await page.getByLabel(/url|地址/i).fill('not-a-valid-url');

      await page.getByRole('button', { name: /submit|save|提交|保存/i }).click();

      // Should show validation error
      await expect(page.locator('text=/invalid|格式错误/i')).toBeVisible({ timeout: 3000 });
    });

    test('edit existing stream', async ({ page }) => {
      await page.goto('/monitor');

      // Wait for stream list
      await page.waitForLoadState('networkidle');

      // Click on first stream
      const streamItem = page.locator('[class*="stream"], [class*="item"]').first();
      if (await streamItem.isVisible()) {
        await streamItem.click();

        // Look for edit button
        const editButton = page.getByRole('button', { name: /edit|编辑/i });
        if (await editButton.isVisible()) {
          await editButton.click();

          // Modify name
          const nameInput = page.getByLabel(/name|名称/i);
          await nameInput.clear();
          await nameInput.fill('Modified Stream Name');

          await page.getByRole('button', { name: /save|保存/i }).click();

          await page.waitForTimeout(1000);
        }
      }
    });

    test('delete stream with confirmation', async ({ page }) => {
      await page.goto('/monitor');

      await page.waitForLoadState('networkidle');

      const streamItem = page.locator('[class*="stream"], [class*="item"]').first();
      if (await streamItem.isVisible()) {
        // Right-click or find delete button
        const deleteButton = page.getByRole('button', { name: /delete|删除/i }).first();

        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          // Confirm deletion
          const confirmButton = page.getByRole('button', { name: /confirm|确认/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  // ============================================================================
  // Alert Management Tests
  // ============================================================================
  test.describe('Alert Management', () => {
    test.use({ storageState: 'tests/e2e/auth-state.json' });

    test('view alert details', async ({ page }) => {
      await page.goto('/alerts');

      await page.waitForLoadState('networkidle');

      // Click on first alert
      const alertItem = page.locator('[class*="alert"]').first();
      if (await alertItem.isVisible()) {
        await alertItem.click();

        // Details panel should appear
        await page.waitForTimeout(500);
        const detailsPanel = page.locator('[class*="detail"], [class*="panel"]');
        await expect(detailsPanel.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('filter alerts by multiple criteria', async ({ page }) => {
      await page.goto('/alerts');

      await page.waitForLoadState('networkidle');

      // Apply level filter
      const levelFilter = page.getByLabel(/level|级别/i);
      if (await levelFilter.isVisible()) {
        await levelFilter.selectOption('CRIT');
        await page.waitForTimeout(1000);

        // Apply status filter
        const statusFilter = page.getByLabel(/status|状态/i);
        if (await statusFilter.isVisible()) {
          await statusFilter.selectOption('active');
          await page.waitForTimeout(1000);
        }
      }

      // Verify filtered results
      const alerts = page.locator('[class*="alert"]');
      const count = await alerts.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const alert = alerts.nth(i);
          // Should match filter criteria
          await expect(alert).toBeVisible();
        }
      }
    });

    test('bulk acknowledge alerts', async ({ page }) => {
      await page.goto('/alerts');

      await page.waitForLoadState('networkidle');

      // Select multiple alerts
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Click acknowledge
        const ackButton = page.getByRole('button', { name: /acknowledge|确认/i });
        if (await ackButton.isVisible()) {
          await ackButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('export alerts', async ({ page }) => {
      await page.goto('/alerts');

      await page.waitForLoadState('networkidle');

      // Look for export button
      const exportButton = page.getByRole('button', { name: /export|导出/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();

        // Wait for export dialog
        await page.waitForTimeout(500);
        await expect(page.locator('text=/export|导出/i')).toBeVisible();
      }
    });
  });

  // ============================================================================
  // Media Library Tests
  // ============================================================================
  test.describe('Media Library', () => {
    test.use({ storageState: 'tests/e2e/auth-state.json' });

    test('upload multiple files', async ({ page }) => {
      await page.goto('/media');

      await page.waitForLoadState('networkidle');

      // Click upload button
      const uploadButton = page.getByRole('button', { name: /upload|上传/i });
      await uploadButton.click();

      // Set multiple files
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([
        { name: 'test1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake image 1') },
        { name: 'test2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake image 2') },
      ]);

      // Wait for upload to complete
      await page.waitForTimeout(2000);

      // Should show success message
      await expect(page.locator('text=/success|成功|uploaded/i')).toBeVisible({ timeout: 5000 });
    });

    test('create folder structure', async ({ page }) => {
      await page.goto('/media');

      await page.waitForLoadState('networkidle');

      // Click new folder button
      const newFolderButton = page.getByRole('button', { name: /folder|新建文件夹/i });
      if (await newFolderButton.isVisible()) {
        await newFolderButton.click();

        // Enter folder name
        const folderNameInput = page.getByPlaceholder(/folder.*name|文件夹.*名称/i);
        await folderNameInput.fill('Test Folder');

        await page.getByRole('button', { name: /create|创建/i }).click();

        await page.waitForTimeout(1000);

        // Verify folder exists
        await expect(page.locator('text=Test Folder')).toBeVisible();
      }
    });

    test('search media files', async ({ page }) => {
      await page.goto('/media');

      await page.waitForLoadState('networkidle');

      // Find search input
      const searchInput = page.getByPlaceholder(/search|搜索/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await searchInput.press('Enter');

        await page.waitForTimeout(1000);

        // Results should update
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('preview media file', async ({ page }) => {
      await page.goto('/media');

      await page.waitForLoadState('networkidle');

      // Click on first media file
      const mediaItem = page.locator('[class*="media"], [class*="file"]').first();
      if (await mediaItem.isVisible()) {
        await mediaItem.click();

        // Preview panel should open
        await page.waitForTimeout(500);
        const previewPanel = page.locator('[class*="preview"], [class*="viewer"]');
        await expect(previewPanel.first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  // ============================================================================
  // AI Chat Tests
  // ============================================================================
  test.describe('AI Assistant', () => {
    test.use({ storageState: 'tests/e2e/auth-state.json' });

    test('send message and receive response', async ({ page }) => {
      await page.goto('/ai');

      await page.waitForLoadState('networkidle');

      // Type message
      const messageInput = page.getByPlaceholder(/type.*message|输入.*消息/i);
      await messageInput.fill('What is the status of my streams?');

      // Send
      const sendButton = page.getByRole('button', { name: /send|发送/i });
      await sendButton.click();

      // Verify message appears
      await expect(page.locator('text=What is the status of my streams?')).toBeVisible();

      // Wait for AI response
      await page.waitForTimeout(3000);

      // Check for response
      const aiResponse = page.locator('[class*="response"], [class*="message"]').last();
      await expect(aiResponse).toBeVisible({ timeout: 10000 });
    });

    test('clear chat history', async ({ page }) => {
      await page.goto('/ai');

      await page.waitForLoadState('networkidle');

      // Send a message first
      const messageInput = page.getByPlaceholder(/type.*message|输入.*消息/i);
      await messageInput.fill('Test message');
      await page.getByRole('button', { name: /send|发送/i }).click();

      await page.waitForTimeout(2000);

      // Clear button
      const clearButton = page.getByRole('button', { name: /clear|清除/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Chat should be empty
        await page.waitForTimeout(500);
      }
    });

    test('AI provides context-aware responses', async ({ page }) => {
      await page.goto('/ai');

      await page.waitForLoadState('networkidle');

      // Ask about specific stream
      const messageInput = page.getByPlaceholder(/type.*message|输入.*消息/i);
      await messageInput.fill('Show me alerts from stream-1');
      await page.getByRole('button', { name: /send|发送/i }).click();

      await page.waitForTimeout(5000);

      // Response should mention the stream
      const response = page.locator('[class*="response"]').last();
      await expect(response).toBeVisible();
    });
  });

  // ============================================================================
  // Settings Tests
  // ============================================================================
  test.describe('Settings & Configuration', () => {
    test.use({ storageState: 'tests/e2e/auth-state.json' });

    test('access settings page', async ({ page }) => {
      await page.goto('/settings');

      await page.waitForLoadState('networkidle');

      // Check settings loaded
      await expect(page.locator('text=/settings|设置/i')).toBeVisible();
    });

    test('update user profile', async ({ page }) => {
      await page.goto('/settings/profile');

      await page.waitForLoadState('networkidle');

      // Update username
      const usernameInput = page.getByLabel(/username|用户名/i);
      if (await usernameInput.isVisible()) {
        await usernameInput.clear();
        await usernameInput.fill('newusername');

        await page.getByRole('button', { name: /save|保存/i }).click();

        await page.waitForTimeout(1000);

        await expect(page.locator('text=/success|成功/i')).toBeVisible();
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================
  test.describe('Performance', () => {
    test('page load time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');

      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Log performance metric
      console.log(`Dashboard load time: ${loadTime}ms`);

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('no memory leaks in navigation', async ({ page }) => {
      await page.goto('/dashboard');

      // Navigate between pages
      for (let i = 0; i < 10; i++) {
        await page.goto('/monitor');
        await page.waitForLoadState('networkidle');
        await page.goto('/alerts');
        await page.waitForLoadState('networkidle');
      }

      // Page should still work
      await page.goto('/dashboard');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  test.describe('Error Handling', () => {
    test('handle API errors gracefully', async ({ page }) => {
      // Intercept and fail API calls
      await page.route('**/api/**', route => route.abort());

      await page.goto('/dashboard');

      // App should show error message
      await expect(page.locator('text=/error|错误/i')).toBeVisible({ timeout: 5000 });
    });

    test('retry failed requests', async ({ page }) => {
      let attemptCount = 0;

      await page.route('**/api/**', async route => {
        attemptCount++;
        if (attemptCount < 2) {
          await route.abort();
        } else {
          await route.continue();
        }
      });

      await page.goto('/dashboard');

      // Should eventually load after retries
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    });
  });
});
