import { test, expect } from '@playwright/test';

test('power element should have initial value of "--"', async ({ page }) => {
    await page.goto('/');

    const powerElement = page.locator('#power');
    await expect(powerElement).toHaveText('--');
});

test('power element should show "--" when data is older than 5 seconds', async ({ page }) => {
    await page.goto('/');

    const powerElement = page.locator('#power');
    await expect(powerElement).toHaveText('--');

    // Inject old power data by manipulating the bike object
    await page.evaluate(() => {
        const oldTimestamp = Date.now() - 61000; // 61 seconds old
        window.bike = window.bike || { power: [] };
        window.bike.power = [{ timestamp: oldTimestamp, value: 200 }];
    });

    // Power should still show "--" because data is old
    await expect(powerElement).toHaveText('--');
});

test('power element should update from "--" to value when fresh data arrives', async ({ page }) => {
    await page.goto('/');

    const powerElement = page.locator('#power');
    await expect(powerElement).toHaveText('--');

    // Set connection state and add fresh data
    await page.evaluate(() => {
        window.connectionsState.power.isConnected = true;
        window.bike.power.push({ timestamp: Date.now(), value: 250 });
    });

    await expect(powerElement).toHaveText('250');
});

test('power should be "--" initially, then show value 0-3000 after clicking connect', async ({
    page,
}) => {
    await page.goto('/');

    const powerElement = page.locator('#power');

    // Power should initially be "--"
    await expect(powerElement).toHaveText('--');

    // Open the menu and click connect
    await page.locator('summary').click();
    await page.locator('#connectPower').click();

    // Wait for power to show a numeric value (not "--")
    await expect(powerElement).not.toHaveText('--', { timeout: 1000 });

    // Verify power is a number between 0 and 3000
    const powerText = await powerElement.textContent();
    const powerValue = parseInt(powerText);
    expect(powerValue).toBeGreaterThanOrEqual(0);
    expect(powerValue).toBeLessThanOrEqual(3000);
});

test('connect power button should toggle to disconnect and back', async ({ page }) => {
    await page.goto('/');

    // Open the menu
    await page.locator('summary').click();

    const connectButton = page.locator('#connectPower');
    const powerElement = page.locator('#power');

    // Initial state - button should say "Connect Power"
    await expect(connectButton).toContainText('Connect Power');
    await expect(powerElement).toHaveText('--');

    // Click to connect
    await connectButton.click();

    // After connecting - button should say "Disconnect Power" and data should show
    await expect(connectButton).toContainText('Disconnect Power');
    await expect(powerElement).not.toHaveText('--', { timeout: 1000 });

    const powerText = await powerElement.textContent();
    const powerValue = parseInt(powerText);
    expect(powerValue).toBeGreaterThanOrEqual(0);
    expect(powerValue).toBeLessThanOrEqual(3000);

    // Click to disconnect
    await connectButton.click();

    // After disconnecting - button should say "Connect Power" and value should return to "--"
    await expect(connectButton).toContainText('Connect Power');
    await expect(powerElement).toHaveText('--');
});
