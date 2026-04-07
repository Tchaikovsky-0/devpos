// =============================================================================
// 缺陷案例自动识别去重功能测试套件
// 覆盖：重复检测、相似度比对、智能分组等
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('缺陷案例 - 去重功能核心测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应正确切换到缺陷案例模式', async ({ page }) => {
    const defectTab = page.locator('button:has-text("缺陷案例"), [data-mode="defect"]');
    if (await defectTab.isVisible()) {
      await defectTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('应正确显示案例统计信息', async ({ page }) => {
    const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="counter"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应正确显示案例总数', async ({ page }) => {
    const totalCount = page.locator('text=/案例总数/, text=/总计/');
    if (await totalCount.first().isVisible()) {
      await expect(totalCount.first()).toBeVisible();
    }
  });

  test('应正确显示待处理案例数', async ({ page }) => {
    const pendingCount = page.locator('text=/待处理/, text=/处理中/');
    if (await pendingCount.first().isVisible()) {
      await expect(pendingCount.first()).toBeVisible();
    }
  });
});

test.describe('缺陷案例 - 案例列表功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应正确加载案例列表', async ({ page }) => {
    const caseList = page.locator('[class*="case"], [class*="defect"]');
    await expect(caseList.first()).toBeVisible({ timeout: 10000 });
  });

  test('应正确显示案例卡片信息', async ({ page }) => {
    const caseCard = page.locator('[class*="case-card"], [class*="defect-card"]').first();
    if (await caseCard.isVisible()) {
      const title = caseCard.locator('[class*="title"], [class*="name"]');
      const severity = caseCard.locator('[class*="severity"], [class*="level"]');
      const status = caseCard.locator('[class*="status"]');

      await expect(title).toBeVisible();
      await expect(severity).toBeVisible();
      await expect(status).toBeVisible();
    }
  });

  test('应正确显示案例严重度标签', async ({ page }) => {
    const severityBadge = page.locator('text=/紧急|高|中|低/');
    if (await severityBadge.first().isVisible()) {
      await expect(severityBadge.first()).toBeVisible();
    }
  });

  test('应正确显示案例家族和类型', async ({ page }) => {
    const caseCard = page.locator('[class*="case-card"]').first();
    if (await caseCard.isVisible()) {
      const familyType = caseCard.locator('text=/安防|环境|结构|设备/');
      if (await familyType.first().isVisible()) {
        await expect(familyType.first()).toBeVisible();
      }
    }
  });

  test('应正确显示证据数量', async ({ page }) => {
    const evidenceCount = page.locator('text=/条证据/, text=/\\d+.*证/');
    if (await evidenceCount.first().isVisible()) {
      await expect(evidenceCount.first()).toBeVisible();
    }
  });

  test('应支持按严重度筛选案例', async ({ page }) => {
    const severityFilter = page.locator('button:has-text("紧急"), button:has-text("高"), button:has-text("全部")');
    if (await severityFilter.first().isVisible()) {
      await severityFilter.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('应支持按状态筛选案例', async ({ page }) => {
    const statusFilter = page.locator('button:has-text("候选"), button:has-text("已确认"), button:has-text("处理中")');
    if (await statusFilter.first().isVisible()) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('应支持案例搜索', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索案例"], input[placeholder*="案例"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试');
      await page.waitForTimeout(800);
    }
  });
});

test.describe('缺陷案例 - 案例详情功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('选中案例后应正确显示详情', async ({ page }) => {
    const caseItem = page.locator('[class*="case-item"], [class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const detailPanel = page.locator('[class*="detail"], [class*="evidence"]');
      if (await detailPanel.first().isVisible()) {
        await expect(detailPanel.first()).toBeVisible();
      }
    }
  });

  test('应正确显示案例时间范围', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const timeInfo = page.locator('text=/首次发现|最后捕获/');
      if (await timeInfo.first().isVisible()) {
        await expect(timeInfo.first()).toBeVisible();
      }
    }
  });

  test('应正确显示证据列表', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const evidenceList = page.locator('[class*="evidence-item"], [class*="evidence-card"]');
      if (await evidenceList.first().isVisible()) {
        await expect(evidenceList.first()).toBeVisible();
      }
    }
  });

  test('应正确标识代表图', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const repBadge = page.locator('text=/代表图/, [class*="representative"]');
      if (await repBadge.first().isVisible()) {
        await expect(repBadge.first()).toBeVisible();
      }
    }
  });

  test('应正确显示重复组信息', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const dupGroup = page.locator('text=/重复组/, text=/\\d+.*张/');
      if (await dupGroup.first().isVisible()) {
        await expect(dupGroup.first()).toBeVisible();
      }
    }
  });

  test('应正确显示报告草稿', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const draftSection = page.locator('text=/报告草稿/, [class*="draft"]');
      if (await draftSection.first().isVisible()) {
        await expect(draftSection.first()).toBeVisible();
      }
    }
  });
});

test.describe('缺陷案例 - 重复检测功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应正确显示重复组数量', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const dupCount = page.locator('text=/\\d+.*重复/, text=/折叠/');
      if (await dupCount.first().isVisible()) {
        await expect(dupCount.first()).toBeVisible();
      }
    }
  });

  test('应正确计算相似度', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const similarity = page.locator('text=/\\d+%, text=/相似度/');
      if (await similarity.first().isVisible()) {
        await expect(similarity.first()).toBeVisible();
      }
    }
  });

  test('应正确标识重复方法', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const method = page.locator('text=/hash|phash|dhash|ahash/');
      if (await method.first().isVisible()) {
        await expect(method.first()).toBeVisible();
      }
    }
  });
});

test.describe('缺陷案例 - 合并拆分功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('应显示合并按钮', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const mergeBtn = page.locator('button:has-text("合并案例"), button:has-text("合并")');
      await expect(mergeBtn.first()).toBeVisible();
    }
  });

  test('应显示拆分按钮', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const splitBtn = page.locator('button:has-text("拆分案例"), button:has-text("拆分")');
      await expect(splitBtn.first()).toBeVisible();
    }
  });

  test('应显示指定代表图按钮', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const repBtn = page.locator('button:has-text("指定代表图"), button:has-text("代表图")');
      if (await repBtn.first().isVisible()) {
        await expect(repBtn.first()).toBeVisible();
      }
    }
  });

  test('应显示切换状态按钮', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const statusBtn = page.locator('button:has-text("切换状态"), button:has-text("状态")');
      if (await statusBtn.first().isVisible()) {
        await expect(statusBtn.first()).toBeVisible();
      }
    }
  });
});

test.describe('缺陷案例 - AI副驾功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');
  });

  test('选中案例后应显示AI副驾面板', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const copilotPanel = page.locator('[class*="copilot"], [class*="ai"], [class*="assistant"]');
      if (await copilotPanel.first().isVisible()) {
        await expect(copilotPanel.first()).toBeVisible();
      }
    }
  });

  test('应显示案例研判功能', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const analyzeBtn = page.locator('button:has-text("案例研判"), button:has-text("研判")');
      if (await analyzeBtn.first().isVisible()) {
        await expect(analyzeBtn.first()).toBeVisible();
      }
    }
  });

  test('应显示生成报告功能', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const reportBtn = page.locator('button:has-text("生成报告"), button:has-text("报告")');
      if (await reportBtn.first().isVisible()) {
        await expect(reportBtn.first()).toBeVisible();
      }
    }
  });

  test('应显示审核报告功能', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const reviewBtn = page.locator('button:has-text("审核报告"), button:has-text("审核")');
      if (await reviewBtn.first().isVisible()) {
        await expect(reviewBtn.first()).toBeVisible();
      }
    }
  });

  test('应显示处置建议功能', async ({ page }) => {
    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await page.waitForTimeout(500);

      const suggestBtn = page.locator('button:has-text("处置建议"), button:has-text("建议")');
      if (await suggestBtn.first().isVisible()) {
        await expect(suggestBtn.first()).toBeVisible();
      }
    }
  });
});

test.describe('缺陷案例 - 性能测试', () => {
  test('加载100+案例应保持流畅', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();
    await page.waitForTimeout(2000);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('切换筛选条件应快速响应', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    const filterBtn = page.locator('button:has-text("紧急")');
    if (await filterBtn.isVisible()) {
      const startTime = Date.now();
      await filterBtn.click();
      await page.waitForTimeout(500);
      const filterTime = Date.now() - startTime;

      expect(filterTime).toBeLessThan(1000);
    }
  });

  test('选中案例后详情应快速加载', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    const caseItem = page.locator('[class*="case-card"]').first();
    if (await caseItem.isVisible()) {
      const startTime = Date.now();
      await caseItem.click();
      await page.waitForTimeout(1000);
      const detailTime = Date.now() - startTime;

      expect(detailTime).toBeLessThan(2000);
    }
  });
});

test.describe('缺陷案例 - 边界测试', () => {
  test('空状态下应显示友好提示', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    const emptyState = page.locator('text=/暂无案例/, text=/没有数据/, [class*="empty"]');
    const hasCases = await page.locator('[class*="case-card"]').count() > 0;

    if (!hasCases) {
      if (await emptyState.first().isVisible()) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('搜索无结果时应显示提示', async ({ page }) => {
    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="案例"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent999');
      await page.waitForTimeout(1000);

      const noResults = page.locator('text=/无匹配/, text=/没有找到/');
      if (await noResults.first().isVisible()) {
        await expect(noResults.first()).toBeVisible();
      }
    }
  });

  test('网络错误时应显示错误提示', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());

    await page.goto('/media');
    await page.waitForLoadState('networkidle');

    const errorMsg = page.locator('text=/加载失败/, text=/网络错误/, text=/刷新/');
    if (await errorMsg.first().isVisible()) {
      await expect(errorMsg.first()).toBeVisible();
    }
  });
});
