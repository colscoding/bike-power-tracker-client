import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Measurement, WorkoutSummary } from '../types/index.js';

// Extract and test the pure functions from workoutService
// These are internal functions, but we can test their logic by recreating them

/**
 * Calculate summary statistics for measurements (copied from workoutService for testing)
 */
function calculateSummary(measurements: {
    power: Measurement[];
    heartrate: Measurement[];
    cadence: Measurement[];
}): WorkoutSummary {
    const avg = (arr: Measurement[]): number | null =>
        arr.length ? arr.reduce((a, b) => a + b.value, 0) / arr.length : null;

    const max = (arr: Measurement[]): number | null =>
        arr.length ? Math.max(...arr.map((m) => m.value)) : null;

    return {
        avgPower: avg(measurements.power),
        maxPower: max(measurements.power),
        avgHeartrate: avg(measurements.heartrate),
        maxHeartrate: max(measurements.heartrate),
        avgCadence: avg(measurements.cadence),
        maxCadence: max(measurements.cadence),
        totalDataPoints:
            measurements.power.length + measurements.heartrate.length + measurements.cadence.length,
    };
}

/**
 * Generate a UUID v4 (copied from workoutService for testing)
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

describe('calculateSummary', () => {
    it('should return null values for empty measurements', () => {
        const result = calculateSummary({
            power: [],
            heartrate: [],
            cadence: [],
        });

        assert.strictEqual(result.avgPower, null);
        assert.strictEqual(result.maxPower, null);
        assert.strictEqual(result.avgHeartrate, null);
        assert.strictEqual(result.maxHeartrate, null);
        assert.strictEqual(result.avgCadence, null);
        assert.strictEqual(result.maxCadence, null);
        assert.strictEqual(result.totalDataPoints, 0);
    });

    it('should calculate correct averages', () => {
        const result = calculateSummary({
            power: [
                { timestamp: 1000, value: 100 },
                { timestamp: 2000, value: 200 },
                { timestamp: 3000, value: 300 },
            ],
            heartrate: [
                { timestamp: 1000, value: 120 },
                { timestamp: 2000, value: 140 },
            ],
            cadence: [{ timestamp: 1000, value: 90 }],
        });

        assert.strictEqual(result.avgPower, 200); // (100 + 200 + 300) / 3
        assert.strictEqual(result.avgHeartrate, 130); // (120 + 140) / 2
        assert.strictEqual(result.avgCadence, 90); // only one value
    });

    it('should calculate correct max values', () => {
        const result = calculateSummary({
            power: [
                { timestamp: 1000, value: 100 },
                { timestamp: 2000, value: 350 },
                { timestamp: 3000, value: 200 },
            ],
            heartrate: [
                { timestamp: 1000, value: 120 },
                { timestamp: 2000, value: 185 },
                { timestamp: 3000, value: 160 },
            ],
            cadence: [
                { timestamp: 1000, value: 80 },
                { timestamp: 2000, value: 110 },
            ],
        });

        assert.strictEqual(result.maxPower, 350);
        assert.strictEqual(result.maxHeartrate, 185);
        assert.strictEqual(result.maxCadence, 110);
    });

    it('should calculate correct total data points', () => {
        const result = calculateSummary({
            power: [
                { timestamp: 1000, value: 100 },
                { timestamp: 2000, value: 200 },
            ],
            heartrate: [
                { timestamp: 1000, value: 120 },
                { timestamp: 2000, value: 140 },
                { timestamp: 3000, value: 150 },
            ],
            cadence: [{ timestamp: 1000, value: 90 }],
        });

        assert.strictEqual(result.totalDataPoints, 6); // 2 + 3 + 1
    });

    it('should handle single data point correctly', () => {
        const result = calculateSummary({
            power: [{ timestamp: 1000, value: 250 }],
            heartrate: [],
            cadence: [],
        });

        assert.strictEqual(result.avgPower, 250);
        assert.strictEqual(result.maxPower, 250);
        assert.strictEqual(result.totalDataPoints, 1);
    });

    it('should handle decimal averages', () => {
        const result = calculateSummary({
            power: [
                { timestamp: 1000, value: 100 },
                { timestamp: 2000, value: 101 },
            ],
            heartrate: [],
            cadence: [],
        });

        assert.strictEqual(result.avgPower, 100.5);
    });
});

describe('generateId', () => {
    it('should generate a valid UUID v4 format', () => {
        const id = generateId();

        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        assert.ok(uuidRegex.test(id), `Generated ID "${id}" does not match UUID v4 format`);
    });

    it('should generate unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(generateId());
        }
        assert.strictEqual(ids.size, 100, 'Generated IDs should be unique');
    });

    it('should always have version 4 in correct position', () => {
        for (let i = 0; i < 10; i++) {
            const id = generateId();
            // The 4 should be at position 14 (15th character, 0-indexed)
            assert.strictEqual(id[14], '4', `ID "${id}" should have 4 as version`);
        }
    });

    it('should have valid variant bits', () => {
        for (let i = 0; i < 10; i++) {
            const id = generateId();
            // The variant character should be at position 19 (20th character, 0-indexed)
            // and should be 8, 9, a, or b
            const variantChar = id[19];
            assert.ok(
                ['8', '9', 'a', 'b'].includes(variantChar),
                `ID "${id}" should have variant bits 8, 9, a, or b, got ${variantChar}`
            );
        }
    });

    it('should have correct length', () => {
        const id = generateId();
        assert.strictEqual(id.length, 36, 'UUID should be 36 characters long');
    });
});
