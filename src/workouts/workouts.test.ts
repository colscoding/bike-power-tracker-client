/**
 * Workouts Module Tests
 * 
 * Comprehensive tests for the training plans and structured workouts system.
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// ============================================
// Types Tests
// ============================================

describe('Workout Types', () => {
    it('should export DEFAULT_WORKOUT_SETTINGS', async () => {
        const { DEFAULT_WORKOUT_SETTINGS } = await import('./types');

        assert.strictEqual(DEFAULT_WORKOUT_SETTINGS.ftp, 200);
        assert.strictEqual(DEFAULT_WORKOUT_SETTINGS.maxHr, 185);
        assert.strictEqual(DEFAULT_WORKOUT_SETTINGS.audioCues, true);
        assert.strictEqual(DEFAULT_WORKOUT_SETTINGS.countdownBeeps, true);
        assert.strictEqual(DEFAULT_WORKOUT_SETTINGS.vibration, true);
    });
});

// ============================================
// Library Tests
// ============================================

describe('Workout Library', () => {
    it('should have sample workouts', async () => {
        const { workoutLibrary } = await import('./library');

        assert.ok(Array.isArray(workoutLibrary));
        assert.ok(workoutLibrary.length >= 5);
    });

    it('should get workout by ID', async () => {
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60');
        assert.ok(workout);
        assert.strictEqual(workout.id, 'endurance-60');
        assert.strictEqual(workout.name, 'Endurance 60');
        assert.strictEqual(workout.category, 'endurance');
    });

    it('should return undefined for unknown workout ID', async () => {
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('nonexistent');
        assert.strictEqual(workout, undefined);
    });

    it('should filter workouts by category', async () => {
        const { getWorkoutsByCategory } = await import('./library');

        const endurance = getWorkoutsByCategory('endurance');
        assert.ok(endurance.length >= 2);
        endurance.forEach(w => assert.strictEqual(w.category, 'endurance'));

        const threshold = getWorkoutsByCategory('threshold');
        assert.ok(threshold.length >= 1);
        threshold.forEach(w => assert.strictEqual(w.category, 'threshold'));
    });

    it('should get all categories', async () => {
        const { getCategories } = await import('./library');

        const categories = getCategories();
        assert.ok(categories.includes('endurance'));
        assert.ok(categories.includes('threshold'));
        assert.ok(categories.includes('vo2max'));
        assert.ok(categories.includes('recovery'));
    });

    it('should format duration correctly', async () => {
        const { formatDuration } = await import('./library');

        assert.strictEqual(formatDuration(0), '0:00');
        assert.strictEqual(formatDuration(30), '0:30');
        assert.strictEqual(formatDuration(60), '1:00');
        assert.strictEqual(formatDuration(90), '1:30');
        assert.strictEqual(formatDuration(3600), '1:00:00');
        assert.strictEqual(formatDuration(3661), '1:01:01');
    });

    it('should calculate target power from FTP', async () => {
        const { calculateTargetPower } = await import('./library');

        assert.strictEqual(calculateTargetPower(1.0, 200), 200);
        assert.strictEqual(calculateTargetPower(0.5, 200), 100);
        assert.strictEqual(calculateTargetPower(0.85, 200), 170);
        assert.strictEqual(calculateTargetPower(1.2, 250), 300);
    });

    it('should have valid workout structure', async () => {
        const { workoutLibrary } = await import('./library');

        for (const workout of workoutLibrary) {
            assert.ok(workout.id, 'Workout must have id');
            assert.ok(workout.name, 'Workout must have name');
            assert.ok(workout.description, 'Workout must have description');
            assert.ok(workout.category, 'Workout must have category');
            assert.ok(workout.totalDuration > 0, 'Workout must have positive duration');
            assert.ok(workout.segments.length > 0, 'Workout must have segments');

            // Verify segments add up to total duration
            const segmentDuration = workout.segments.reduce((sum, s) => sum + s.duration, 0);
            assert.strictEqual(segmentDuration, workout.totalDuration,
                `${workout.id}: Segment durations should equal total duration`);

            // Verify each segment has required fields
            for (const segment of workout.segments) {
                assert.ok(segment.name, 'Segment must have name');
                assert.ok(segment.duration > 0, 'Segment must have positive duration');
                assert.ok(segment.target, 'Segment must have target');
                assert.ok(typeof segment.target.powerLow === 'number', 'Target must have powerLow');
                assert.ok(typeof segment.target.powerHigh === 'number', 'Target must have powerHigh');
                assert.ok(segment.target.powerLow <= segment.target.powerHigh,
                    'powerLow must be <= powerHigh');
            }
        }
    });
});

// ============================================
// Plans Tests
// ============================================

describe('Training Plans', () => {
    it('should have sample training plans', async () => {
        const { trainingPlans } = await import('./plans');

        assert.ok(Array.isArray(trainingPlans));
        assert.ok(trainingPlans.length >= 2);
    });

    it('should get plan by ID', async () => {
        const { getPlanById } = await import('./plans');

        const plan = getPlanById('ftp-builder-4week');
        assert.ok(plan);
        assert.strictEqual(plan.id, 'ftp-builder-4week');
        assert.strictEqual(plan.weeksTotal, 4);
    });

    it('should return undefined for unknown plan ID', async () => {
        const { getPlanById } = await import('./plans');

        const plan = getPlanById('nonexistent');
        assert.strictEqual(plan, undefined);
    });

    it('should filter plans by goal', async () => {
        const { getPlansByGoal } = await import('./plans');

        const ftpPlans = getPlansByGoal('ftp-builder');
        assert.ok(ftpPlans.length >= 1);
        ftpPlans.forEach(p => assert.strictEqual(p.goal, 'ftp-builder'));
    });

    it('should get available goals', async () => {
        const { getAvailableGoals } = await import('./plans');

        const goals = getAvailableGoals();
        assert.ok(goals.includes('ftp-builder'));
        assert.ok(goals.includes('endurance'));
    });

    it('should calculate total workouts in plan', async () => {
        const { getPlanById, getTotalWorkoutsInPlan } = await import('./plans');

        const plan = getPlanById('ftp-builder-4week');
        assert.ok(plan);

        const total = getTotalWorkoutsInPlan(plan);
        assert.ok(total > 0);

        // Manually count
        const expected = plan.weeks.reduce((sum, week) => sum + week.workouts.length, 0);
        assert.strictEqual(total, expected);
    });

    it('should get day names', async () => {
        const { getDayName, getShortDayName } = await import('./plans');

        assert.strictEqual(getDayName(0), 'Sunday');
        assert.strictEqual(getDayName(1), 'Monday');
        assert.strictEqual(getDayName(6), 'Saturday');

        assert.strictEqual(getShortDayName(0), 'Sun');
        assert.strictEqual(getShortDayName(1), 'Mon');
        assert.strictEqual(getShortDayName(6), 'Sat');
    });

    it('should have valid plan structure', async () => {
        const { trainingPlans, getPlanById } = await import('./plans');
        const { getWorkoutById } = await import('./library');

        for (const plan of trainingPlans) {
            assert.ok(plan.id, 'Plan must have id');
            assert.ok(plan.name, 'Plan must have name');
            assert.ok(plan.description, 'Plan must have description');
            assert.ok(plan.goal, 'Plan must have goal');
            assert.strictEqual(plan.weeks.length, plan.weeksTotal,
                'Weeks array length should match weeksTotal');

            // Verify weeks
            for (let i = 0; i < plan.weeks.length; i++) {
                const week = plan.weeks[i];
                assert.strictEqual(week.weekNumber, i + 1, 'Week numbers should be sequential');
                assert.ok(week.focus, 'Week must have focus');
                assert.ok(week.workouts.length > 0, 'Week must have workouts');

                // Verify scheduled workouts reference valid workouts
                for (const scheduled of week.workouts) {
                    assert.ok(scheduled.dayOfWeek >= 0 && scheduled.dayOfWeek <= 6,
                        'Day of week must be 0-6');
                    const workout = getWorkoutById(scheduled.workoutId);
                    assert.ok(workout, `Workout ${scheduled.workoutId} must exist in library`);
                }
            }
        }
    });
});

// ============================================
// WorkoutController Tests
// ============================================

describe('WorkoutController', () => {
    it('should create controller with workout and FTP', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        assert.ok(controller);
        assert.strictEqual(controller.currentWorkout, workout);
        assert.strictEqual(controller.getFtp(), 200);
        assert.strictEqual(controller.running, false);
    });

    it('should start and pause workout', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        controller.start();
        assert.strictEqual(controller.running, true);

        controller.pause();
        assert.strictEqual(controller.running, false);

        controller.resume();
        assert.strictEqual(controller.running, true);

        controller.destroy();
    });

    it('should toggle between pause and resume', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        controller.start();
        assert.strictEqual(controller.running, true);

        controller.toggle();
        assert.strictEqual(controller.running, false);

        controller.toggle();
        assert.strictEqual(controller.running, true);

        controller.destroy();
    });

    it('should get current and next segment', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        assert.deepStrictEqual(controller.currentSegment, workout.segments[0]);
        assert.deepStrictEqual(controller.nextSegment, workout.segments[1]);

        controller.destroy();
    });

    it('should calculate target power range', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        const range = controller.targetPowerRange;
        // First segment is warm up: 0.45-0.55 * 200 = 90-110
        assert.strictEqual(range.low, Math.round(0.45 * 200));
        assert.strictEqual(range.high, Math.round(0.55 * 200));

        controller.destroy();
    });

    it('should determine if power is in zone', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        // First segment: 90-110W
        assert.strictEqual(controller.isPowerInZone(50), 'low');
        assert.strictEqual(controller.isPowerInZone(100), 'in-zone');
        assert.strictEqual(controller.isPowerInZone(150), 'high');

        controller.destroy();
    });

    it('should subscribe to events', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        const events: string[] = [];
        const unsubscribe = controller.subscribe((event) => {
            events.push(event);
        });

        controller.start();
        controller.pause();
        controller.resume();

        assert.ok(events.includes('start'));
        assert.ok(events.includes('pause'));
        assert.ok(events.includes('resume'));

        unsubscribe();
        controller.destroy();
    });

    it('should tick and track time', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        controller.start();

        // Simulate ticks
        controller.tick();
        controller.tick();
        controller.tick();

        const state = controller.getState();
        assert.strictEqual(state.segmentElapsed, 3);
        assert.strictEqual(state.totalElapsed, 3);
        assert.ok(state.progress > 0);

        controller.destroy();
    });

    it('should advance segment when complete', async () => {
        const { WorkoutController } = await import('./WorkoutController');

        // Create a short workout for testing
        const shortWorkout = {
            id: 'test-short',
            name: 'Test Short',
            description: 'Test',
            category: 'test' as const,
            totalDuration: 5,
            tss: 1,
            intensityFactor: 0.5,
            segments: [
                { name: 'A', duration: 2, target: { powerLow: 0.5, powerHigh: 0.6 } },
                { name: 'B', duration: 3, target: { powerLow: 0.6, powerHigh: 0.7 } },
            ],
        };

        const controller = new WorkoutController(shortWorkout, 200);
        const events: string[] = [];

        controller.subscribe((event) => {
            events.push(event);
        });

        controller.start();

        // Tick through first segment
        controller.tick();
        controller.tick(); // Should advance to segment B

        assert.strictEqual(controller.currentSegment.name, 'B');
        assert.ok(events.includes('segment-change'));

        controller.destroy();
    });

    it('should complete workout when all segments done', async () => {
        const { WorkoutController } = await import('./WorkoutController');

        const shortWorkout = {
            id: 'test-short',
            name: 'Test Short',
            description: 'Test',
            category: 'test' as const,
            totalDuration: 3,
            tss: 1,
            intensityFactor: 0.5,
            segments: [
                { name: 'A', duration: 3, target: { powerLow: 0.5, powerHigh: 0.6 } },
            ],
        };

        const controller = new WorkoutController(shortWorkout, 200);
        const events: string[] = [];

        controller.subscribe((event) => {
            events.push(event);
        });

        controller.start();
        controller.tick();
        controller.tick();
        controller.tick(); // Should complete

        assert.ok(events.includes('complete'));
        assert.strictEqual(controller.running, false);

        controller.destroy();
    });

    it('should reset workout', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        controller.start();
        controller.tick();
        controller.tick();

        controller.reset();

        const state = controller.getState();
        assert.strictEqual(state.segmentElapsed, 0);
        assert.strictEqual(state.totalElapsed, 0);
        assert.strictEqual(state.segmentIndex, 0);
        assert.strictEqual(controller.running, false);

        controller.destroy();
    });

    it('should update FTP', async () => {
        const { WorkoutController } = await import('./WorkoutController');
        const { getWorkoutById } = await import('./library');

        const workout = getWorkoutById('endurance-60')!;
        const controller = new WorkoutController(workout, 200);

        controller.setFtp(250);
        assert.strictEqual(controller.getFtp(), 250);

        // Check target range updates
        const range = controller.targetPowerRange;
        assert.strictEqual(range.low, Math.round(0.45 * 250));

        controller.destroy();
    });

    it('should emit countdown in last 5 seconds', async () => {
        const { WorkoutController } = await import('./WorkoutController');

        const shortWorkout = {
            id: 'test-countdown',
            name: 'Test Countdown',
            description: 'Test',
            category: 'test' as const,
            totalDuration: 7,
            tss: 1,
            intensityFactor: 0.5,
            segments: [
                { name: 'A', duration: 7, target: { powerLow: 0.5, powerHigh: 0.6 } },
            ],
        };

        const controller = new WorkoutController(shortWorkout, 200);
        const events: string[] = [];

        controller.subscribe((event) => {
            events.push(event);
        });

        controller.start();
        // Tick to get into countdown zone (last 5 seconds)
        controller.tick(); // 1s, 6 remaining
        controller.tick(); // 2s, 5 remaining - countdown starts

        assert.ok(events.includes('countdown'));

        controller.destroy();
    });
});

// ============================================
// Settings Tests
// ============================================

describe('Workout Settings', () => {
    // Mock localStorage
    let storage: Map<string, string>;

    beforeEach(() => {
        storage = new Map();

        // @ts-ignore - mocking global
        globalThis.localStorage = {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
            clear: () => storage.clear(),
        };
    });

    it('should get default settings when none saved', async () => {
        const { getWorkoutSettings } = await import('./settings');
        const { DEFAULT_WORKOUT_SETTINGS } = await import('./types');

        const settings = getWorkoutSettings();
        assert.strictEqual(settings.ftp, DEFAULT_WORKOUT_SETTINGS.ftp);
        assert.strictEqual(settings.maxHr, DEFAULT_WORKOUT_SETTINGS.maxHr);
        assert.strictEqual(settings.audioCues, DEFAULT_WORKOUT_SETTINGS.audioCues);
    });

    it('should save and retrieve settings', async () => {
        const { getWorkoutSettings, saveWorkoutSettings } = await import('./settings');

        saveWorkoutSettings({ ftp: 250, audioCues: false });

        const settings = getWorkoutSettings();
        assert.strictEqual(settings.ftp, 250);
        assert.strictEqual(settings.audioCues, false);
        // Other defaults should be preserved
        assert.strictEqual(settings.vibration, true);
    });

    it('should save and retrieve FTP', async () => {
        const { getFtp, saveFtp } = await import('./settings');

        saveFtp(275);
        assert.strictEqual(getFtp(), 275);
    });

    it('should estimate FTP from 20-minute test', async () => {
        const { estimateFtpFrom20Min } = await import('./settings');

        // 20-min power of 250W -> FTP = 250 * 0.95 = 238
        assert.strictEqual(estimateFtpFrom20Min(250), 238);
        assert.strictEqual(estimateFtpFrom20Min(200), 190);
    });

    it('should estimate FTP from 5-minute test', async () => {
        const { estimateFtpFrom5Min } = await import('./settings');

        // 5-min power of 300W -> FTP = 300 * 0.85 = 255
        assert.strictEqual(estimateFtpFrom5Min(300), 255);
    });

    it('should calculate power zones', async () => {
        const { getPowerZones } = await import('./settings');

        const zones = getPowerZones(200);

        assert.strictEqual(zones.z1.name, 'Active Recovery');
        assert.strictEqual(zones.z1.max, 110); // 200 * 0.55
        assert.strictEqual(zones.z2.max, 150); // 200 * 0.75
        assert.strictEqual(zones.z4.name, 'Threshold');
    });

    it('should get zone for power', async () => {
        const { getZoneForPower } = await import('./settings');

        assert.strictEqual(getZoneForPower(50, 200), 1);
        assert.strictEqual(getZoneForPower(120, 200), 2);
        assert.strictEqual(getZoneForPower(160, 200), 3);
        assert.strictEqual(getZoneForPower(200, 200), 4);
        assert.strictEqual(getZoneForPower(230, 200), 5);
        assert.strictEqual(getZoneForPower(280, 200), 6);
        assert.strictEqual(getZoneForPower(350, 200), 7);
    });

    it('should get zone colors', async () => {
        const { getZoneColor } = await import('./settings');

        assert.ok(getZoneColor(1).startsWith('#'));
        assert.ok(getZoneColor(4).startsWith('#'));
        assert.ok(getZoneColor(7).startsWith('#'));
    });

    it('should get intensity colors', async () => {
        const { getIntensityColor } = await import('./settings');

        assert.ok(getIntensityColor(0.5).startsWith('#'));
        assert.ok(getIntensityColor(0.95).startsWith('#'));
        assert.ok(getIntensityColor(1.3).startsWith('#'));
    });
});

// ============================================
// Plan Progress Tests
// ============================================

describe('Plan Progress Tracking', () => {
    let storage: Map<string, string>;

    beforeEach(() => {
        storage = new Map();

        // @ts-ignore - mocking global
        globalThis.localStorage = {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
            clear: () => storage.clear(),
        };
    });

    it('should get empty progress for new plan', async () => {
        const { getPlanProgress } = await import('./settings');

        const progress = getPlanProgress('new-plan');
        assert.strictEqual(progress.startedAt, null);
        assert.strictEqual(progress.currentWeek, 1);
        assert.deepStrictEqual(progress.completedWorkouts, []);
    });

    it('should start a plan', async () => {
        const { startPlan, getPlanProgress } = await import('./settings');

        startPlan('test-plan');

        const progress = getPlanProgress('test-plan');
        assert.ok(progress.startedAt);
        assert.strictEqual(progress.currentWeek, 1);
    });

    it('should complete plan workouts', async () => {
        const { startPlan, completePlanWorkout, isPlanWorkoutCompleted } = await import('./settings');

        startPlan('test-plan');
        completePlanWorkout('test-plan', 1, 1, 'workout-result-123');

        assert.ok(isPlanWorkoutCompleted('test-plan', 1, 1));
        assert.ok(!isPlanWorkoutCompleted('test-plan', 1, 2));
    });

    it('should calculate plan completion percentage', async () => {
        const { startPlan, completePlanWorkout, getPlanCompletionPercentage } = await import('./settings');

        startPlan('test-plan');

        // 0 of 10 = 0%
        assert.strictEqual(getPlanCompletionPercentage('test-plan', 10), 0);

        completePlanWorkout('test-plan', 1, 1, 'result-1');
        completePlanWorkout('test-plan', 1, 3, 'result-2');

        // 2 of 10 = 20%
        assert.strictEqual(getPlanCompletionPercentage('test-plan', 10), 20);
    });

    it('should reset plan progress', async () => {
        const { startPlan, completePlanWorkout, resetPlanProgress, getPlanProgress } = await import('./settings');

        startPlan('test-plan');
        completePlanWorkout('test-plan', 1, 1, 'result-1');

        resetPlanProgress('test-plan');

        const progress = getPlanProgress('test-plan');
        assert.strictEqual(progress.startedAt, null);
        assert.deepStrictEqual(progress.completedWorkouts, []);
    });
});

// ============================================
// AudioCues Tests
// ============================================

describe('AudioCues', () => {
    it('should create audio cues instance', async () => {
        const { createAudioCues } = await import('./audioCues');

        const audio = createAudioCues();
        assert.ok(audio);
    });

    it('should check availability', async () => {
        const { createAudioCues } = await import('./audioCues');

        const audio = createAudioCues();
        // In Node.js, speech synthesis is not available
        assert.strictEqual(audio.isAvailable, false);
    });

    it('should enable and disable audio', async () => {
        const { createAudioCues } = await import('./audioCues');

        const audio = createAudioCues();

        audio.setEnabled(true);
        // isEnabled is false because synth is not available
        assert.strictEqual(audio.isEnabled, false);

        audio.setEnabled(false);
        assert.strictEqual(audio.isEnabled, false);
    });

    it('should get singleton instance', async () => {
        const { getAudioCues } = await import('./audioCues');

        const audio1 = getAudioCues();
        const audio2 = getAudioCues();

        assert.strictEqual(audio1, audio2);
    });
});

// ============================================
// Module Export Tests
// ============================================

describe('Module Exports', () => {
    it('should export all types and functions from core modules', async () => {
        // Test non-component exports separately to avoid HTMLElement issues in Node.js
        const types = await import('./types');
        assert.ok(types.DEFAULT_WORKOUT_SETTINGS);

        const library = await import('./library');
        assert.ok(library.workoutLibrary);
        assert.ok(typeof library.getWorkoutById === 'function');
        assert.ok(typeof library.getWorkoutsByCategory === 'function');
        assert.ok(typeof library.formatDuration === 'function');

        const plans = await import('./plans');
        assert.ok(plans.trainingPlans);
        assert.ok(typeof plans.getPlanById === 'function');
        assert.ok(typeof plans.getTotalWorkoutsInPlan === 'function');

        const controller = await import('./WorkoutController');
        assert.ok(typeof controller.WorkoutController === 'function');
        assert.ok(typeof controller.createWorkoutController === 'function');

        const audio = await import('./audioCues');
        assert.ok(typeof audio.getAudioCues === 'function');

        const settings = await import('./settings');
        assert.ok(typeof settings.getWorkoutSettings === 'function');
        assert.ok(typeof settings.getFtp === 'function');
        assert.ok(typeof settings.getPowerZones === 'function');
    });
});
