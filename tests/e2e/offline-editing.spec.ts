import { test, expect } from "@playwright/test";

test.describe("Offline Editing", () => {
  test.beforeEach(async ({ page }) => {
    // Start server in online mode
    await page.goto("/");
  });

  test("should persist edits to IndexedDB while offline", async ({ page, context }) => {
    // Navigate to a document
    await page.goto("/dashboard");
    await page.click('[href*="documents"]');

    // Make edits
    const editor = page.locator("[contenteditable]");
    await editor.click();
    await editor.fill("Test content");

    // Verify content is in IndexedDB
    const content = await page.evaluate(() => {
      return localStorage.getItem("document-content");
    });
    expect(content).toBeDefined();

    // Simulate offline
    await context.setOffline(true);

    // Make more edits
    await editor.fill("Test content updated");

    // Verify edits are still possible
    await expect(editor).toContainText("Test content updated");

    // Go back online
    await context.setOffline(false);

    // Verify sync status indicator shows syncing
    const syncStatus = page.locator('[data-testid="sync-status"]');
    await expect(syncStatus).toContainText(/syncing|online/i);
  });

  test("should restore content from IndexedDB on reload", async ({ page }) => {
    const testContent = "Offline persisted content";

    // Navigate to a document
    await page.goto("/dashboard");
    await page.click('[href*="documents"]');

    // Add content
    const editor = page.locator("[contenteditable]");
    await editor.click();
    await editor.fill(testContent);

    // Wait for IndexedDB persistence
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Verify content is restored
    await expect(editor).toContainText(testContent);
  });

  test("should sync pending operations when coming back online", async ({
    page,
    context,
  }) => {
    // Navigate to a document
    await page.goto("/dashboard");
    await page.click('[href*="documents"]');

    // Go offline
    await context.setOffline(true);

    // Make edits
    const editor = page.locator("[contenteditable]");
    await editor.click();
    await editor.fill("Offline edits");

    // Verify pending indicator
    const pendingStatus = page.locator('[data-testid="pending-operations"]');
    await expect(pendingStatus).toBeVisible();

    // Go online
    await context.setOffline(false);

    // Wait for sync to complete
    await page.waitForTimeout(2000);

    // Verify sync completed
    const syncStatus = page.locator('[data-testid="sync-status"]');
    await expect(syncStatus).toContainText("online");
  });
});
