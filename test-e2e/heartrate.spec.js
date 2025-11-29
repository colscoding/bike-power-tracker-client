import { test, expect } from '@playwright/test';

test('heartrate element should have initial value of "--"', async ({ page }) => {
    await page.goto('/');

    const heartrateElement = page.locator('#heartrate');
    await expect(heartrateElement).toHaveText('--');
});

test('heartrate should be "--" initially, then show value 1-299 after clicking connect', async ({
    page,
}) => {
    await page.goto('/');

    const heartrateElement = page.locator('#heartrate');

    // Heartrate should initially be "--"
    await expect(heartrateElement).toHaveText('--');

    // Open the menu and click connect
    await page.locator('summary').click();
    await page.locator('#connectHeartrate').click();

    // Wait for heartrate to show a numeric value
    await expect(heartrateElement).not.toHaveText('--', { timeout: 2000 });

    // Verify heartrate is a number between 1 and 299
    const heartrateText = await heartrateElement.textContent();
    const heartrateValue = parseInt(heartrateText);
    expect(heartrateValue).toBeGreaterThanOrEqual(1);
    expect(heartrateValue).toBeLessThan(300);
});

test('heartrate element should show "--" when data is older than 5 seconds', async ({ page }) => {
    await page.goto('/');

    const heartrateElement = page.locator('#heartrate');
    await expect(heartrateElement).toHaveText('--');

    // Inject old heartrate data
    await page.evaluate(() => {
        const oldTimestamp = Date.now() - 61000; // 61 seconds old
        window.bike = window.bike || { heartrate: [] };
        window.bike.heartrate = [{ timestamp: oldTimestamp, value: 150 }];
    });

    // Heartrate should still show "--" because data is old
    await expect(heartrateElement).toHaveText('--');
});

test('heartrate element should update from "--" to value when fresh data arrives', async ({
    page,
}) => {
    await page.goto('/');

    const heartrateElement = page.locator('#heartrate');
    await expect(heartrateElement).toHaveText('--');

    // Set connection state and add fresh data
    await page.evaluate(() => {
        window.connectionsState.heartrate.isConnected = true;
        window.bike.heartrate.push({ timestamp: Date.now(), value: 165 });
    });

    await expect(heartrateElement).toHaveText('165');
});
