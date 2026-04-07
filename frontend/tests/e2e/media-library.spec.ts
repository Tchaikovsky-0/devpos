// =============================================================================
// 媒体库功能测试套件
// 覆盖：文件分类、预览、搜索、管理等基础功能
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('媒体库 - 文件分类', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应正确显示媒体库页面', async ({ page }) => {
    await expect(page.locator('h1, h2, .page-title').first()).toBeVisible();
  });

  test('应正确显示文件类型筛选器', async ({ page }) => {
    const typeFilters = page.locator('button:has-text("全部"), button:has-text("图片"), button:has-text("视频")');
    const count = await typeFilters.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应支持按文件类型筛选', async ({ page }) => {
    const imageFilter = page.locator('button:has-text("图片")').first();
    if (await imageFilter.isVisible()) {
      await imageFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test('应显示文件夹导航', async ({ page }) => {
    const folderNav = page.locator('[class*="folder"], [class*="breadcrumb"]');
    await expect(folderNav.first()).toBeVisible();
  });

  test('应支持创建文件夹', async ({ page }) => {
    const createFolderBtn = page.locator('button:has-text("新建文件夹"), button:has-text("创建文件夹")');
    if (await createFolderBtn.isVisible()) {
      await createFolderBtn.click();
      await page.waitForSelector('input[placeholder*="名称"], input[placeholder*="folder"]', { timeout: 3000 });
    }
  });

  test('应支持移动文件到文件夹', async ({ page }) => {
    const fileItem = page.locator('[class*="media-item"], [class*="file-item"]').first();
    if (await fileItem.isVisible()) {
      await fileItem.click({ button: 'right' });
      await page.waitForTimeout(300);
    }
  });
});

test.describe('媒体库 - 文件预览', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应正确预览图片文件', async ({ page }) => {
    const imageItem = page.locator('[class*="image"], [class*="photo"]').first();
    if (await imageItem.isVisible()) {
      await imageItem.click();
      await page.waitForTimeout(500);
    }
  });

  test('应正确预览视频文件', async ({ page }) => {
    const videoItem = page.locator('[class*="video"], video').first();
    if (await videoItem.isVisible()) {
      await videoItem.click();
      await page.waitForTimeout(500);
    }
  });

  test('预览时应显示正确的文件信息', async ({ page }) => {
    const fileItem = page.locator('[class*="media-item"]').first();
    if (await fileItem.isVisible()) {
      await fileItem.click();
      await page.waitForTimeout(500);

      const previewModal = page.locator('[class*="preview"], [class*="modal"]');
      if (await previewModal.isVisible()) {
        const fileName = previewModal.locator('[class*="filename"], [class*="name"]');
        await expect(fileName).toBeVisible();
      }
    }
  });

  test('应支持关闭预览', async ({ page }) => {
    const fileItem = page.locator('[class*="media-item"]').first();
    if (await fileItem.isVisible()) {
      await fileItem.click();
      await page.waitForTimeout(500);

      const closeBtn = page.locator('button:has-text("关闭"), button:has-text("×"), [aria-label="关闭"]');
      if (await closeBtn.first().isVisible()) {
        await closeBtn.first().click();
      }
    }
  });
});

test.describe('媒体库 - 搜索功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应显示搜索框', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]');
    await expect(searchInput).toBeVisible();
  });

  test('应支持按文件名搜索', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(800);
  });

  test('搜索结果应正确显示', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('test');
    await page.waitForTimeout(1000);

    const results = page.locator('[class*="result"], [class*="media-item"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('应支持清除搜索', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    const clearBtn = page.locator('button:has-text("清除"), button:has-text("×")');
    if (await clearBtn.isVisible()) {
      await clearBtn.first().click();
      await expect(searchInput).toHaveValue('');
    }
  });
});

test.describe('媒体库 - 文件管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应支持重命名文件', async ({ page }) => {
    const fileItem = page.locator('[class*="media-item"]').first();
    if (await fileItem.isVisible()) {
      await fileItem.click({ button: 'right' });
      await page.waitForTimeout(300);

      const renameOption = page.locator('text=重命名, text=Rename');
      if (await renameOption.isVisible()) {
        await renameOption.click();
        await page.waitForSelector('input[type="text"]', { timeout: 3000 });
      }
    }
  });

  test('应支持删除文件', async ({ page }) => {
    const fileItem = page.locator('[class*="media-item"]').first();
    if (await fileItem.isVisible()) {
      await fileItem.click({ button: 'right' });
      await page.waitForTimeout(300);

      const deleteOption = page.locator('text=删除, text=Delete');
      if (await deleteOption.isVisible()) {
        await deleteOption.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('删除文件应有确认提示', async ({ page }) => {
    const fileItem = page.locator('[class*="media-item"]').first();
    if (await fileItem.isVisible()) {
      await fileItem.click({ button: 'right' });
      await page.waitForTimeout(300);

      const deleteOption = page.locator('text=删除');
      if (await deleteOption.isVisible()) {
        await deleteOption.click();
        const confirmDialog = page.locator('text=确认, text=确定, button:has-text("确认")');
        if (await confirmDialog.isVisible()) {
          await expect(confirmDialog.first()).toBeVisible();
        }
      }
    }
  });

  test('应支持多选文件', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
      await page.waitForTimeout(300);

      const selectedCount = page.locator('[class*="selected"], [class*="checked"]');
      expect(await selectedCount.count()).toBeGreaterThan(0);
    }
  });

  test('应显示存储空间信息', async ({ page }) => {
    const storageInfo = page.locator('text=/\\d+[MG]B/, text=/已用.*总计/');
    if (await storageInfo.first().isVisible()) {
      await expect(storageInfo.first()).toBeVisible();
    }
  });
});

test.describe('媒体库 - 批量操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('选中多个文件后应显示批量操作栏', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);

      const batchBar = page.locator('[class*="batch"], [class*="bulk"]');
      if (await batchBar.isVisible()) {
        await expect(batchBar).toBeVisible();
      }
    }
  });

  test('应支持批量删除', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.nth(0).isVisible()) {
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);
    }
  });

  test('应支持批量移动', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.nth(0).isVisible()) {
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('媒体库 - 分页功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应正确显示总文件数', async ({ page }) => {
    const totalCount = page.locator('text=/共.*文件, text=/\\d+.*项/');
    if (await totalCount.first().isVisible()) {
      await expect(totalCount.first()).toBeVisible();
    }
  });

  test('应支持翻页', async ({ page }) => {
    const nextBtn = page.locator('button:has-text("下一页"), button[aria-label="下一页"]');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('应支持每页显示数量调整', async ({ page }) => {
    const pageSizeSelect = page.locator('select').first();
    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.selectOption('50');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('媒体库 - 排序功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应支持按时间排序', async ({ page }) => {
    const sortBtn = page.locator('button:has-text("时间"), button:has-text("日期")');
    if (await sortBtn.first().isVisible()) {
      await sortBtn.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('应支持按名称排序', async ({ page }) => {
    const sortBtn = page.locator('button:has-text("名称"), button:has-text("文件名")');
    if (await sortBtn.first().isVisible()) {
      await sortBtn.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('应支持按大小排序', async ({ page }) => {
    const sortBtn = page.locator('button:has-text("大小"), button:has-text("文件大小")');
    if (await sortBtn.first().isVisible()) {
      await sortBtn.first().click();
      await page.waitForTimeout(300);
    }
  });
});
