// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Offline functionality', () => {
    test('app works offline after initial load', async ({ page, context }) => {
        // Load app online first
        await page.goto('/');
        await expect(page.locator('#time')).toBeVisible();

        // Go offline
        await context.setOffline(true);

        // Reload should still work
        await page.reload();
        await expect(page.locator('#time')).toBeVisible();

        // Should show offline indicator
        await expect(page.locator('.offline-indicator')).toBeVisible();
    });

    test('shows offline indicator when going offline', async ({ page, context }) => {
        await page.goto('/');

        // Initially online - no indicator
        await expect(page.locator('.offline-indicator')).not.toBeVisible();

        // Go offline
        await context.setOffline(true);

        // Should show offline indicator
        await expect(page.locator('.offline-indicator')).toBeVisible();
        await expect(page.locator('.offline-indicator')).toContainText('Offline');

        // Go back online
        await context.setOffline(false);

        // Offline indicator should be hidden
        await expect(page.locator('.offline-indicator')).not.toBeVisible();
    });

    test('body has is-offline class when offline', async ({ page, context }) => {
        await page.goto('/');

        // Initially online
        await expect(page.locator('body')).not.toHaveClass(/is-offline/);

        // Go offline
        await context.setOffline(true);

        // Body should have is-offline class
        await expect(page.locator('body')).toHaveClass(/is-offline/);

        // Go back online
        await context.setOffline(false);

        // is-offline class should be removed
        await expect(page.locator('body')).not.toHaveClass(/is-offline/);
    });

    test('workout can be recorded offline', async ({ page, context }) => {
        await page.goto('/');
        await context.setOffline(true);

        // Start workout
        await page.click('#startStop');

        // Timer should be running (not showing 00:00:00)
        await page.waitForTimeout(1100); // Wait for at least 1 second
        await expect(page.locator('#time')).not.toHaveText('00:00:00');

        // Stop workout
        await page.click('#startStop');
    });

    test('export works offline', async ({ page, context }) => {
        await page.goto('/');

        // Start and stop a brief workout
        await page.click('#startStop');
        await page.waitForTimeout(1100);
        await page.click('#startStop');

        // Go offline
        await context.setOffline(true);

        // Open menu and try to export
        await page.click('summary');
        await expect(page.locator('#exportButton')).toBeVisible();

        // Export should be available (click triggers download)
        const downloadPromise = page.waitForEvent('download');
        await page.click('#exportButton');
        const download = await downloadPromise;

        // Verify download was initiated
        expect(download.suggestedFilename()).toContain('bike-power-tracker');
    });

    test('timer display shows correctly offline', async ({ page, context }) => {
        await page.goto('/');
        await context.setOffline(true);

        // Timer should still be visible and interactive
        await expect(page.locator('#time')).toBeVisible();
        await expect(page.locator('#time')).toHaveText('00:00:00');
    });
});

test.describe('PWA Install Experience', () => {
    test('install banner not shown on first load', async ({ page }) => {
        // Clear storage to simulate fresh user
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.reload();

        // Install banner should not be immediately visible
        await expect(page.locator('.install-banner')).not.toBeVisible();
    });
});
