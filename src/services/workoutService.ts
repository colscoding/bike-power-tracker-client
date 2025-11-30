import type { Measurement, Workout, WorkoutSummary } from '../types/index.js';
import type { MeasurementsState } from '../MeasurementsState.js';
import {
    saveWorkout,
    getWorkout,
    getActiveWorkout,
    deleteWorkout,
    getWorkoutHistory
} from '../db/workouts.js';
import { openDatabase } from '../db/index.js';

/**
 * Generate a UUID v4
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Calculate summary statistics for measurements
 */
function calculateSummary(measurements: {
    power: Measurement[];
    heartrate: Measurement[];
    cadence: Measurement[];
}): WorkoutSummary {
    const avg = (arr: Measurement[]): number | null =>
        arr.length ? arr.reduce((a, b) => a + b.value, 0) / arr.length : null;

    const max = (arr: Measurement[]): number | null =>
        arr.length ? Math.max(...arr.map(m => m.value)) : null;

    return {
        avgPower: avg(measurements.power),
        maxPower: max(measurements.power),
        avgHeartrate: avg(measurements.heartrate),
        maxHeartrate: max(measurements.heartrate),
        avgCadence: avg(measurements.cadence),
        maxCadence: max(measurements.cadence),
        totalDataPoints:
            measurements.power.length +
            measurements.heartrate.length +
            measurements.cadence.length,
    };
}

export class WorkoutService {
    private currentWorkoutId: string | null = null;
    private initialized = false;

    /**
     * Initialize the workout service (opens database)
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        await openDatabase();
        this.initialized = true;
    }

    /**
     * Get the current workout ID
     */
    getCurrentWorkoutId(): string | null {
        return this.currentWorkoutId;
    }

    /**
     * Set the current workout ID (used when resuming)
     */
    setCurrentWorkoutId(id: string | null): void {
        this.currentWorkoutId = id;
    }

    /**
     * Start a new workout
     */
    async startWorkout(): Promise<Workout> {
        await this.init();

        const workout: Workout = {
            id: generateId(),
            status: 'active',
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            measurements: { power: [], heartrate: [], cadence: [] },
            summary: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await saveWorkout(workout);
        this.currentWorkoutId = workout.id;
        return workout;
    }

    /**
     * Save current workout progress (for auto-save)
     */
    async saveProgress(measurementsState: MeasurementsState, startTime: number): Promise<void> {
        if (!this.currentWorkoutId) return;

        const workout = await getWorkout(this.currentWorkoutId);
        if (!workout) return;

        workout.measurements = {
            power: [...measurementsState.power],
            heartrate: [...measurementsState.heartrate],
            cadence: [...measurementsState.cadence],
        };
        workout.duration = Date.now() - startTime;

        await saveWorkout(workout);
        console.log('Auto-saved workout data');
    }

    /**
     * Complete the current workout
     */
    async completeWorkout(measurementsState: MeasurementsState, startTime: number): Promise<Workout | null> {
        if (!this.currentWorkoutId) return null;

        const workout = await getWorkout(this.currentWorkoutId);
        if (!workout) return null;

        workout.status = 'completed';
        workout.endTime = Date.now();
        workout.duration = workout.endTime - startTime;
        workout.measurements = {
            power: [...measurementsState.power],
            heartrate: [...measurementsState.heartrate],
            cadence: [...measurementsState.cadence],
        };
        workout.summary = calculateSummary(workout.measurements);

        await saveWorkout(workout);
        this.currentWorkoutId = null;
        return workout;
    }

    /**
     * Discard the current workout
     */
    async discardWorkout(): Promise<void> {
        if (!this.currentWorkoutId) return;

        await deleteWorkout(this.currentWorkoutId);
        this.currentWorkoutId = null;
    }

    /**
     * Get the active workout (if any)
     */
    async getActiveWorkout(): Promise<Workout | null> {
        await this.init();
        return getActiveWorkout();
    }

    /**
     * Get workout history
     */
    async getHistory(limit = 50): Promise<Workout[]> {
        await this.init();
        return getWorkoutHistory(limit);
    }

    /**
     * Delete a specific workout
     */
    async deleteWorkout(id: string): Promise<void> {
        await deleteWorkout(id);
    }
}

// Singleton instance
let workoutServiceInstance: WorkoutService | null = null;

/**
 * Get the singleton workout service instance
 */
export function getWorkoutService(): WorkoutService {
    if (!workoutServiceInstance) {
        workoutServiceInstance = new WorkoutService();
    }
    return workoutServiceInstance;
}
