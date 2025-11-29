import { test, expect } from '@playwright/test';

test('cadence element should have initial value of "--"', async ({ page }) => {
    await page.goto('/');

    const cadenceElement = page.locator('#cadence');
    await expect(cadenceElement).toHaveText('--');
});

test('cadence should be "--" initially, then show value 1-299 after clicking connect', async ({
    page,
}) => {
    await page.goto('/');

    const cadenceElement = page.locator('#cadence');

    // Cadence should initially be "--"
    await expect(cadenceElement).toHaveText('--');

    // Open the menu and click connect
    await page.locator('summary').click();
    await page.locator('#connectCadence').click();

    // Wait for cadence to show a numeric value
    await expect(cadenceElement).not.toHaveText('--', { timeout: 2000 });

    // Verify cadence is a number between 1 and 299
    const cadenceText = await cadenceElement.textContent();
    const cadenceValue = parseInt(cadenceText);
    expect(cadenceValue).toBeGreaterThanOrEqual(1);
    expect(cadenceValue).toBeLessThan(300);
});

test('cadence element should show "--" when data is older than 5 seconds', async ({ page }) => {
    await page.goto('/');

    const cadenceElement = page.locator('#cadence');
    await expect(cadenceElement).toHaveText('--');

    // Inject old cadence data
    await page.evaluate(() => {
        const oldTimestamp = Date.now() - 61000;
        window.bike = window.bike || { cadence: [] };
        window.bike.cadence = [{ timestamp: oldTimestamp, value: 90 }];
    });

    // Cadence should still show "--" because data is old
    await expect(cadenceElement).toHaveText('--');
});

test('cadence element should update from "--" to value when fresh data arrives', async ({
    page,
}) => {
    await page.goto('/');

    const cadenceElement = page.locator('#cadence');
    await expect(cadenceElement).toHaveText('--');

    // Set connection state and add fresh data
    await page.evaluate(() => {
        window.connectionsState.cadence.isConnected = true;
        window.bike.cadence.push({ timestamp: Date.now(), value: 95 });
    });

    await expect(cadenceElement).toHaveText('95');
});
