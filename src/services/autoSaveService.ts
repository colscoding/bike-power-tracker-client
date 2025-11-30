import type { MeasurementsState } from '../MeasurementsState.js';
import type { TimeState } from '../types/index.js';
import { WorkoutService } from './workoutService.js';

export class AutoSaveService {
    private workoutService: WorkoutService;
    private measurementsState: MeasurementsState;
    private timeState: TimeState;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private saveInterval: number;

    constructor(
        workoutService: WorkoutService,
        measurementsState: MeasurementsState,
        timeState: TimeState,
        saveInterval = 10000 // 10 seconds default
    ) {
        this.workoutService = workoutService;
        this.measurementsState = measurementsState;
        this.timeState = timeState;
        this.saveInterval = saveInterval;
    }

    /**
     * Start auto-saving at the configured interval
     */
    start(): void {
        if (this.intervalId) {
            return; // Already running
        }

        this.intervalId = setInterval(() => this.save(), this.saveInterval);
        console.log(`Auto-save started (every ${this.saveInterval / 1000}s)`);
    }

    /**
     * Stop auto-saving
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Auto-save stopped');
        }
    }

    /**
     * Check if auto-save is running
     */
    isRunning(): boolean {
        return this.intervalId !== null;
    }

    /**
     * Perform a save
     */
    private async save(): Promise<void> {
        if (!this.workoutService.getCurrentWorkoutId()) {
            return;
        }

        if (!this.timeState.startTime) {
            return;
        }

        try {
            await this.workoutService.saveProgress(
                this.measurementsState,
                this.timeState.startTime
            );
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    /**
     * Trigger an immediate save (useful before stopping)
     */
    async saveNow(): Promise<void> {
        await this.save();
    }
}
