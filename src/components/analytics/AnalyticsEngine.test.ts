import test, { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { AnalyticsEngine } from './AnalyticsEngine.js';
import type { Workout } from '../../types/index.js';

describe('AnalyticsEngine', () => {
    let engine: AnalyticsEngine;

    beforeEach(() => {
        engine = new AnalyticsEngine(200); // FTP = 200W
    });

    describe('calculateWorkoutSummary', () => {
        it('should calculate basic workout metrics', () => {
            const workout: Workout = {
                id: '1',
                status: 'completed',
                startTime: 1000,
                endTime: 61000, // 60 seconds
                duration: 60,
                measurements: {
                    power: [
                        { timestamp: 1000, value: 200 },
                        { timestamp: 2000, value: 220 },
                        { timestamp: 3000, value: 180 },
                    ],
                    heartrate: [
                        { timestamp: 1000, value: 140 },
                        { timestamp: 2000, value: 145 },
                        { timestamp: 3000, value: 150 },
                    ],
                    cadence: [
                        { timestamp: 1000, value: 90 },
                        { timestamp: 2000, value: 92 },
                        { timestamp: 3000, value: 88 },
                    ],
                },
                summary: null,
                createdAt: 1000,
                updatedAt: 1000,
            };

            const summary = engine.calculateWorkoutSummary(workout);

            assert.strictEqual(summary.id, '1');
            assert.strictEqual(summary.avgPower, 200); // (200+220+180)/3 = 200
            assert.strictEqual(summary.maxPower, 220);
            assert.strictEqual(summary.avgHeartrate, 145); // (140+145+150)/3 = 145
            assert.strictEqual(summary.maxHeartrate, 150);
            assert.strictEqual(summary.avgCadence, 90); // (90+92+88)/3 = 90
        });

        it('should handle empty measurements', () => {
            const workout: Workout = {
                id: '2',
                status: 'completed',
                startTime: 1000,
                endTime: 61000,
                duration: 60,
                measurements: {
                    power: [],
                    heartrate: [],
                    cadence: [],
                },
                summary: null,
                createdAt: 1000,
                updatedAt: 1000,
            };

            const summary = engine.calculateWorkoutSummary(workout);

            assert.strictEqual(summary.avgPower, 0);
            assert.strictEqual(summary.maxPower, 0);
            assert.strictEqual(summary.avgHeartrate, 0);
            assert.strictEqual(summary.avgCadence, 0);
        });
    });

    describe('calculateZones', () => {
        it('should categorize power values into zones', () => {
            // FTP = 200W
            // Z1: < 110W (55%)
            // Z2: 110-150W (55-75%)
            // Z3: 150-180W (75-90%)
            // Z4: 180-210W (90-105%)
            // Z5: 210-240W (105-120%)
            // Z6: > 240W (120%+)
            const powers = [100, 130, 160, 190, 220, 250];
            const zones = engine.calculateZones(powers);

            assert.strictEqual(zones.power.z1, 1); // 100W
            assert.strictEqual(zones.power.z2, 1); // 130W
            assert.strictEqual(zones.power.z3, 1); // 160W
            assert.strictEqual(zones.power.z4, 1); // 190W
            assert.strictEqual(zones.power.z5, 1); // 220W
            assert.strictEqual(zones.power.z6, 1); // 250W
        });
    });

    describe('calculateWork', () => {
        it('should calculate total work in kJ', () => {
            // 1000W for 1 second = 1000J = 1kJ
            const powers = Array(1000).fill(1000); // 1000W for 1000 seconds
            const work = engine.calculateWork(powers);

            assert.strictEqual(work, 1000); // 1000kJ
        });
    });

    describe('calculateNP', () => {
        it('should return average for small sample sizes', () => {
            const powers = [200, 210, 190];
            const np = engine.calculateNP(powers);

            assert.strictEqual(np, 200); // Average of small sample
        });

        it('should calculate normalized power for larger samples', () => {
            // Create 60 samples of constant 200W
            const powers = Array(60).fill(200);
            const np = engine.calculateNP(powers);

            // NP of constant power should equal that power
            assert.strictEqual(np, 200);
        });
    });

    describe('setFTP', () => {
        it('should update FTP and affect zone calculations', () => {
            engine.setFTP(300); // Higher FTP

            // 200W would now be in Z2 (67% of 300W) instead of Z4
            const powers = [200];
            const zones = engine.calculateZones(powers);

            assert.strictEqual(zones.power.z2, 1);
            assert.strictEqual(zones.power.z4, 0);
        });
    });
});
