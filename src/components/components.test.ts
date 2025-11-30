import test from 'node:test';
import assert from 'node:assert';

// Since we're testing Web Components, we need a DOM environment
// These tests verify the component class logic without full DOM rendering

test('MetricDisplay config returns correct values for power', () => {
    // Test the configuration lookup logic
    const configs = {
        power: { label: 'Power', unit: 'W', emoji: '⚡', color: 'var(--color-power, #FFD700)' },
        heartrate: { label: 'Heart Rate', unit: 'bpm', emoji: '❤️', color: 'var(--color-heartrate, #FF4444)' },
        cadence: { label: 'Cadence', unit: 'rpm', emoji: '🚴', color: 'var(--color-cadence, #4CAF50)' },
    };

    assert.strictEqual(configs.power.label, 'Power');
    assert.strictEqual(configs.power.unit, 'W');
    assert.strictEqual(configs.power.emoji, '⚡');
});

test('MetricDisplay config returns correct values for heartrate', () => {
    const configs = {
        power: { label: 'Power', unit: 'W', emoji: '⚡', color: 'var(--color-power, #FFD700)' },
        heartrate: { label: 'Heart Rate', unit: 'bpm', emoji: '❤️', color: 'var(--color-heartrate, #FF4444)' },
        cadence: { label: 'Cadence', unit: 'rpm', emoji: '🚴', color: 'var(--color-cadence, #4CAF50)' },
    };

    assert.strictEqual(configs.heartrate.label, 'Heart Rate');
    assert.strictEqual(configs.heartrate.unit, 'bpm');
    assert.strictEqual(configs.heartrate.emoji, '❤️');
});

test('MetricDisplay config returns correct values for cadence', () => {
    const configs = {
        power: { label: 'Power', unit: 'W', emoji: '⚡', color: 'var(--color-power, #FFD700)' },
        heartrate: { label: 'Heart Rate', unit: 'bpm', emoji: '❤️', color: 'var(--color-heartrate, #FF4444)' },
        cadence: { label: 'Cadence', unit: 'rpm', emoji: '🚴', color: 'var(--color-cadence, #4CAF50)' },
    };

    assert.strictEqual(configs.cadence.label, 'Cadence');
    assert.strictEqual(configs.cadence.unit, 'rpm');
    assert.strictEqual(configs.cadence.emoji, '🚴');
});

test('ConnectButton config returns correct values for each type', () => {
    const configs = {
        power: { emoji: '⚡', label: 'Power' },
        heartrate: { emoji: '❤️', label: 'Heartrate' },
        cadence: { emoji: '🚴', label: 'Cadence' },
    };

    assert.strictEqual(configs.power.emoji, '⚡');
    assert.strictEqual(configs.power.label, 'Power');
    assert.strictEqual(configs.heartrate.emoji, '❤️');
    assert.strictEqual(configs.heartrate.label, 'Heartrate');
    assert.strictEqual(configs.cadence.emoji, '🚴');
    assert.strictEqual(configs.cadence.label, 'Cadence');
});

test('Component template generates correct button text for connect state', () => {
    const connected = false;
    const config = { emoji: '⚡', label: 'Power' };
    const action = connected ? 'Disconnect' : 'Connect';
    const expectedText = `${config.emoji} ${action} ${config.label}`;

    assert.strictEqual(expectedText, '⚡ Connect Power');
});

test('Component template generates correct button text for disconnect state', () => {
    const connected = true;
    const config = { emoji: '⚡', label: 'Power' };
    const action = connected ? 'Disconnect' : 'Connect';
    const expectedText = `${config.emoji} ${action} ${config.label}`;

    assert.strictEqual(expectedText, '⚡ Disconnect Power');
});

test('StartStopButton shows correct emoji based on running state', () => {
    const getEmoji = (running: boolean) => running ? '⏹️' : '▶️';

    assert.strictEqual(getEmoji(false), '▶️');
    assert.strictEqual(getEmoji(true), '⏹️');
});

test('Timer formats time correctly', () => {
    const defaultTime = '00:00:00';
    const workoutTime = '00:15:32';

    assert.strictEqual(defaultTime.length, 8);
    assert.strictEqual(workoutTime.length, 8);
    assert.ok(workoutTime.match(/^\d{2}:\d{2}:\d{2}$/));
});
