/**
 * Workout Controller
 * 
 * Manages the execution of a structured workout, tracking segments,
 * timing, and notifying listeners of state changes.
 */

import type {
    StructuredWorkout,
    WorkoutSegment,
    WorkoutExecutionState,
    WorkoutEvent,
    WorkoutEventListener,
    PowerZoneStatus,
} from './types';

/**
 * Controller for executing structured workouts
 */
export class WorkoutController {
    private workout: StructuredWorkout;
    private ftp: number;
    private currentSegmentIndex: number = 0;
    private segmentElapsed: number = 0;
    private totalElapsed: number = 0;
    private isRunning: boolean = false;
    private listeners: Set<WorkoutEventListener> = new Set();
    private tickInterval: ReturnType<typeof setInterval> | null = null;

    constructor(workout: StructuredWorkout, ftp: number = 200) {
        this.workout = workout;
        this.ftp = ftp;
    }

    /**
     * Get the current segment
     */
    get currentSegment(): WorkoutSegment {
        return this.workout.segments[this.currentSegmentIndex];
    }

    /**
     * Get the next segment (if any)
     */
    get nextSegment(): WorkoutSegment | null {
        const nextIndex = this.currentSegmentIndex + 1;
        return nextIndex < this.workout.segments.length
            ? this.workout.segments[nextIndex]
            : null;
    }

    /**
     * Get remaining time in current segment
     */
    get segmentRemaining(): number {
        return Math.max(0, this.currentSegment.duration - this.segmentElapsed);
    }

    /**
     * Get remaining time in total workout
     */
    get totalRemaining(): number {
        return Math.max(0, this.workout.totalDuration - this.totalElapsed);
    }

    /**
     * Get workout progress (0-1)
     */
    get progress(): number {
        return this.totalElapsed / this.workout.totalDuration;
    }

    /**
     * Get target power range in absolute watts
     */
    get targetPowerRange(): { low: number; high: number } {
        const target = this.currentSegment.target;
        return {
            low: Math.round(target.powerLow * this.ftp),
            high: Math.round(target.powerHigh * this.ftp),
        };
    }

    /**
     * Get the workout being executed
     */
    get currentWorkout(): StructuredWorkout {
        return this.workout;
    }

    /**
     * Check if workout is running
     */
    get running(): boolean {
        return this.isRunning;
    }

    /**
     * Start the workout
     */
    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTicking();
        this.notify('start');
    }

    /**
     * Pause the workout
     */
    pause(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.stopTicking();
        this.notify('pause');
    }

    /**
     * Resume the workout
     */
    resume(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTicking();
        this.notify('resume');
    }

    /**
     * Toggle between pause and resume
     */
    toggle(): void {
        if (this.isRunning) {
            this.pause();
        } else {
            this.resume();
        }
    }

    /**
     * Reset the workout to the beginning
     */
    reset(): void {
        this.stopTicking();
        this.currentSegmentIndex = 0;
        this.segmentElapsed = 0;
        this.totalElapsed = 0;
        this.isRunning = false;
    }

    /**
     * Stop and destroy the controller
     */
    destroy(): void {
        this.stopTicking();
        this.listeners.clear();
    }

    /**
     * Called every second to update state
     */
    tick(): void {
        if (!this.isRunning) return;

        this.segmentElapsed++;
        this.totalElapsed++;

        // Check for countdown (last 5 seconds of segment)
        if (this.segmentRemaining <= 5 && this.segmentRemaining > 0) {
            this.notify('countdown');
        }

        // Check if segment complete
        if (this.segmentElapsed >= this.currentSegment.duration) {
            this.advanceSegment();
        } else {
            this.notify('tick');
        }
    }

    /**
     * Advance to the next segment
     */
    private advanceSegment(): void {
        if (this.currentSegmentIndex < this.workout.segments.length - 1) {
            this.currentSegmentIndex++;
            this.segmentElapsed = 0;
            this.notify('segment-change');
        } else {
            this.complete();
        }
    }

    /**
     * Complete the workout
     */
    private complete(): void {
        this.isRunning = false;
        this.stopTicking();
        this.notify('complete');
    }

    /**
     * Check if a power value is within the target zone
     */
    isPowerInZone(currentPower: number): PowerZoneStatus {
        const { low, high } = this.targetPowerRange;
        if (currentPower < low) return 'low';
        if (currentPower > high) return 'high';
        return 'in-zone';
    }

    /**
     * Subscribe to workout events
     */
    subscribe(listener: WorkoutEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of an event
     */
    private notify(event: WorkoutEvent): void {
        const state = this.getState();
        this.listeners.forEach((listener) => listener(event, state));
    }

    /**
     * Get the current execution state
     */
    getState(): WorkoutExecutionState {
        return {
            segment: this.currentSegment,
            nextSegment: this.nextSegment,
            segmentIndex: this.currentSegmentIndex,
            segmentElapsed: this.segmentElapsed,
            segmentRemaining: this.segmentRemaining,
            totalElapsed: this.totalElapsed,
            totalRemaining: this.totalRemaining,
            progress: this.progress,
            targetPowerRange: this.targetPowerRange,
            isRunning: this.isRunning,
        };
    }

    /**
     * Update the FTP value
     */
    setFtp(ftp: number): void {
        this.ftp = ftp;
    }

    /**
     * Get FTP value
     */
    getFtp(): number {
        return this.ftp;
    }

    /**
     * Start the tick interval
     */
    private startTicking(): void {
        if (this.tickInterval) return;
        this.tickInterval = setInterval(() => this.tick(), 1000);
    }

    /**
     * Stop the tick interval
     */
    private stopTicking(): void {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }
}

/**
 * Create a new workout controller
 */
export function createWorkoutController(workout: StructuredWorkout, ftp?: number): WorkoutController {
    return new WorkoutController(workout, ftp);
}
