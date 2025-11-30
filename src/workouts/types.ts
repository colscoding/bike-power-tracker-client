/**
 * Workout Types for Training Plans and Structured Workouts
 * 
 * This module defines all TypeScript interfaces for the workout system.
 * Power targets use percentage of FTP (0.0-1.5+) for flexibility.
 */

/**
 * Target power and optional cadence for a workout segment
 */
export interface SegmentTarget {
    /** Lower bound power as fraction of FTP (e.g., 0.55 = 55% of FTP) */
    powerLow: number;
    /** Upper bound power as fraction of FTP */
    powerHigh: number;
    /** Optional lower bound cadence in RPM */
    cadenceLow?: number;
    /** Optional upper bound cadence in RPM */
    cadenceHigh?: number;
}

/**
 * A single segment/interval within a structured workout
 */
export interface WorkoutSegment {
    /** Display name (e.g., "Warm Up", "Sweet Spot 1") */
    name: string;
    /** Duration in seconds */
    duration: number;
    /** Power/cadence targets for this segment */
    target: SegmentTarget;
    /** Optional instructions shown during segment */
    instructions?: string;
}

/**
 * Workout category for filtering and display
 */
export type WorkoutCategory = 'endurance' | 'threshold' | 'vo2max' | 'recovery' | 'test';

/**
 * A structured workout definition
 */
export interface StructuredWorkout {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Description of the workout */
    description: string;
    /** Category for filtering */
    category: WorkoutCategory;
    /** Total duration in seconds */
    totalDuration: number;
    /** Estimated Training Stress Score */
    tss: number;
    /** Intensity Factor (average intensity as fraction of FTP) */
    intensityFactor: number;
    /** Ordered list of workout segments */
    segments: WorkoutSegment[];
}

/**
 * A workout scheduled within a training plan
 */
export interface ScheduledWorkout {
    /** Day of week (0 = Sunday, 6 = Saturday) */
    dayOfWeek: number;
    /** Reference to workout ID in library */
    workoutId: string;
    /** Whether this scheduled workout has been completed */
    completed?: boolean;
    /** Reference to the actual completed workout ID if done */
    completedWorkoutId?: string;
}

/**
 * A week within a training plan
 */
export interface TrainingWeek {
    /** Week number (1-indexed) */
    weekNumber: number;
    /** Focus description (e.g., "Base Building", "Recovery") */
    focus: string;
    /** Workouts scheduled for this week */
    workouts: ScheduledWorkout[];
}

/**
 * Training plan goal types
 */
export type PlanGoal = 'ftp-builder' | 'endurance' | 'race-prep' | 'general-fitness';

/**
 * A multi-week training plan
 */
export interface TrainingPlan {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Description of the plan */
    description: string;
    /** Goal/purpose of the plan */
    goal: PlanGoal;
    /** Total number of weeks */
    weeksTotal: number;
    /** Weekly workout schedules */
    weeks: TrainingWeek[];
}

/**
 * User settings for workouts
 */
export interface WorkoutSettings {
    /** Functional Threshold Power in watts */
    ftp: number;
    /** Maximum heart rate */
    maxHr: number;
    /** Enable audio cues via speech synthesis */
    audioCues: boolean;
    /** Enable countdown beeps */
    countdownBeeps: boolean;
    /** Enable vibration feedback */
    vibration: boolean;
}

/**
 * Default workout settings
 */
export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettings = {
    ftp: 200,
    maxHr: 185,
    audioCues: true,
    countdownBeeps: true,
    vibration: true,
};

/**
 * Power zone status relative to target
 */
export type PowerZoneStatus = 'low' | 'in-zone' | 'high';

/**
 * Current state during workout execution
 */
export interface WorkoutExecutionState {
    /** Current segment being executed */
    segment: WorkoutSegment;
    /** Next segment (if any) */
    nextSegment: WorkoutSegment | null;
    /** Index of current segment */
    segmentIndex: number;
    /** Seconds elapsed in current segment */
    segmentElapsed: number;
    /** Seconds remaining in current segment */
    segmentRemaining: number;
    /** Total seconds elapsed in workout */
    totalElapsed: number;
    /** Total seconds remaining in workout */
    totalRemaining: number;
    /** Progress through workout (0-1) */
    progress: number;
    /** Target power range in absolute watts */
    targetPowerRange: { low: number; high: number };
    /** Whether workout is currently running */
    isRunning: boolean;
}

/**
 * Events emitted by WorkoutController
 */
export type WorkoutEvent =
    | 'start'
    | 'pause'
    | 'resume'
    | 'tick'
    | 'segment-change'
    | 'complete'
    | 'countdown';

/**
 * Workout controller event listener
 */
export type WorkoutEventListener = (event: WorkoutEvent, state: WorkoutExecutionState) => void;

/**
 * Progress tracking for a training plan
 */
export interface PlanProgress {
    /** When the plan was started */
    startedAt: string | null;
    /** Current week (1-indexed) */
    currentWeek: number;
    /** List of completed workouts */
    completedWorkouts: CompletedPlanWorkout[];
}

/**
 * Record of a completed workout within a plan
 */
export interface CompletedPlanWorkout {
    /** Week number */
    weekNumber: number;
    /** Day of week */
    dayOfWeek: number;
    /** When it was completed */
    completedAt: string;
    /** Reference to the workout result */
    workoutResultId: string;
}
