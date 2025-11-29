import { test, expect } from '@playwright/test';

test('time element should have initial value of "00:00:00"', async ({ page }) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    await expect(timeElement).toHaveText('00:00:00');
});

test('time element should start increasing after connecting and stop when disconnected', async ({
    page,
}) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    const startStopButton = page.locator('#startStop');

    // 1. Check initial state
    await expect(timeElement).toHaveText('00:00:00');

    // 2. Connect to a sensor
    await page.locator('summary').click();
    await page.locator('#connectPower').click();

    // 3. Click the start button to start the timer
    await startStopButton.click();

    // 4. Wait for timer to advance from 00:00:00
    await expect(timeElement).not.toHaveText('00:00:00', { timeout: 3000 });
    const firstTimeValue = await timeElement.textContent();
    expect(firstTimeValue).toMatch(/\d{2}:\d{2}:\d{2}/);

    // 5. Wait a bit longer and check that the timer has incremented
    await expect(async () => {
        const secondTimeValue = await timeElement.textContent();
        expect(secondTimeValue > firstTimeValue).toBe(true);
    }).toPass({ timeout: 3000 });

    // 6. Stop and check that the timer stops
    await startStopButton.click();
    const finalTimeValue = await timeElement.textContent();

    // Wait and verify time doesn't change
    await page.waitForTimeout(1500);
    await expect(timeElement).toHaveText(finalTimeValue);
});

test('metrics table should have paused styling when not running', async ({ page }) => {
    await page.goto('/');

    const metricsTable = page.locator('#metricsTable');
    const startStopButton = page.locator('#startStop');

    // Initially should have paused class
    await expect(metricsTable).toHaveClass('paused');

    // Start the workout
    await startStopButton.click();

    // Should not have paused class when running
    await expect(metricsTable).not.toHaveClass('paused');

    // Stop the workout
    await startStopButton.click();

    // Should have paused class again
    await expect(metricsTable).toHaveClass('paused');
});

test('start/stop button should start timer from stopped state', async ({ page }) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    const startStopButton = page.locator('#startStop');

    // Initial state
    await expect(timeElement).toHaveText('00:00:00');
    await expect(startStopButton).toHaveText('▶️');

    // Click start button
    await startStopButton.click();

    // Button should change to stop
    await expect(startStopButton).toHaveText('⏹️');

    // Verify timer is running
    await expect(timeElement).not.toHaveText('00:00:00', { timeout: 3000 });
    const timeValue = await timeElement.textContent();
    expect(timeValue).toMatch(/\d{2}:\d{2}:\d{2}/);
});

test('start/stop button should pause timer without resetting data', async ({ page }) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    const startStopButton = page.locator('#startStop');
    const powerElement = page.locator('#power');

    // Start the timer
    await startStopButton.click();
    await expect(startStopButton).toHaveText('⏹️');

    // Add some test data
    await page.evaluate(() => {
        window.bike.power = [
            { timestamp: Date.now(), value: 200 },
            { timestamp: Date.now(), value: 250 },
        ];
        window.connectionsState.power.isConnected = true;
    });

    // Wait for timer to advance
    await expect(timeElement).not.toHaveText('00:00:00', { timeout: 3000 });
    const timeBeforeStop = await timeElement.textContent();

    // Verify we have power data
    await expect(powerElement).toHaveText('250');

    // Click stop button
    await startStopButton.click();

    // Verify timer is NOT reset (shows stopped time)
    await expect(timeElement).toHaveText(timeBeforeStop);
    expect(timeBeforeStop).not.toBe('00:00:00');

    // Verify button changed to start
    await expect(startStopButton).toHaveText('▶️');

    // Verify power data is NOT cleared
    await expect(powerElement).toHaveText('250');

    // Verify measurements are NOT cleared
    const measurementsPreserved = await page.evaluate(() => {
        return window.bike.power.length === 2;
    });
    expect(measurementsPreserved).toBe(true);
});

test('stop should not disconnect sensors', async ({ page }) => {
    await page.goto('/');

    const startStopButton = page.locator('#startStop');

    // Start the workout
    await startStopButton.click();

    // Connect to power sensor
    await page.locator('summary').click();
    const connectPowerButton = page.locator('#connectPower');
    await connectPowerButton.click();

    // Verify power is connected
    await expect(connectPowerButton).toContainText('Disconnect Power');

    // Click stop
    await startStopButton.click();

    // Verify sensor is still connected
    await page.locator('summary').click();
    await expect(connectPowerButton).toContainText('Disconnect Power');
});

test('discard button should clear timer and measurements with confirmation', async ({ page }) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    const startStopButton = page.locator('#startStop');
    const discardButton = page.locator('#discardButton');

    // Start and add data
    await startStopButton.click();
    await page.evaluate(() => {
        window.bike.power = [{ timestamp: Date.now(), value: 200 }];
        window.connectionsState.power.isConnected = true;
    });

    // Wait for timer to advance
    await expect(timeElement).not.toHaveText('00:00:00', { timeout: 3000 });

    // Stop the workout
    await startStopButton.click();

    // Set up dialog handler to cancel
    page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Are you sure');
        await dialog.dismiss();
    });

    // Open menu and click discard (but cancel)
    await page.locator('summary').click();
    await discardButton.click();

    // Data should still be there
    const measurementsStillThere = await page.evaluate(() => {
        return window.bike.power.length === 1;
    });
    expect(measurementsStillThere).toBe(true);

    // Now confirm the discard
    page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Are you sure');
        await dialog.accept();
    });

    // Click discard again (and accept)
    await discardButton.click();

    // Verify timer is reset to 00:00:00
    await expect(timeElement).toHaveText('00:00:00');

    // Verify measurements are cleared
    const measurementsCleared = await page.evaluate(() => {
        return (
            window.bike.power.length === 0 &&
            window.bike.heartrate.length === 0 &&
            window.bike.cadence.length === 0
        );
    });
    expect(measurementsCleared).toBe(true);
});

test('discard button should reset state but not disconnect sensors', async ({ page }) => {
    await page.goto('/');

    const startStopButton = page.locator('#startStop');
    const discardButton = page.locator('#discardButton');

    // Start and connect sensor
    await startStopButton.click();
    await page.locator('summary').click();
    const connectPowerButton = page.locator('#connectPower');
    await connectPowerButton.click();

    // Verify power is connected
    await expect(connectPowerButton).toContainText('Disconnect Power');

    // Stop
    await startStopButton.click();

    // Set up dialog handler to accept
    page.once('dialog', async (dialog) => {
        await dialog.accept();
    });

    // Click discard
    await page.locator('summary').click();
    await discardButton.click();

    // Verify sensor is still connected after discard
    await page.locator('summary').click();
    await expect(connectPowerButton).toContainText('Disconnect Power');
});

test('resume after stop should continue from stopped time', async ({ page }) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    const startStopButton = page.locator('#startStop');

    // Start
    await startStopButton.click();

    // Wait for timer to advance
    await expect(timeElement).not.toHaveText('00:00:00', { timeout: 3000 });
    const timeBeforeStop = await timeElement.textContent();

    // Stop
    await startStopButton.click();

    // Wait while stopped and verify time doesn't change
    await page.waitForTimeout(1000);
    await expect(timeElement).toHaveText(timeBeforeStop);

    // Resume
    await startStopButton.click();

    // Wait for timer to advance beyond stopped time
    await expect(async () => {
        const timeAfterResume = await timeElement.textContent();
        expect(timeAfterResume > timeBeforeStop).toBe(true);
    }).toPass({ timeout: 3000 });
});

test('start/stop allows starting workout before connecting sensors', async ({ page }) => {
    await page.goto('/');

    const timeElement = page.locator('#time');
    const startStopButton = page.locator('#startStop');

    // Start timer before connecting any sensors
    await startStopButton.click();

    // Wait for timer to advance
    await expect(timeElement).not.toHaveText('00:00:00', { timeout: 3000 });
    const timeBeforeConnect = await timeElement.textContent();
    await expect(startStopButton).toHaveText('⏹️');

    // Now connect a sensor
    await page.locator('summary').click();
    await page.locator('#connectPower').click();

    // Verify timer is still running (not reset by sensor connection)
    await expect(async () => {
        const timeAfterConnect = await timeElement.textContent();
        expect(timeAfterConnect > timeBeforeConnect).toBe(true);
    }).toPass({ timeout: 2000 });
    await expect(startStopButton).toHaveText('⏹️');
});
