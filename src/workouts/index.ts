/**
 * Workouts Module
 * 
 * Training plans and structured workouts system.
 * This module is designed to be independent and pluggable.
 * 
 * @example
 * ```typescript
 * import { workoutLibrary, WorkoutController, getFtp } from './workouts';
 * 
 * // Get FTP setting
 * const ftp = getFtp();
 * 
 * // Select a workout
 * const workout = workoutLibrary[0];
 * 
 * // Create controller
 * const controller = new WorkoutController(workout, ftp);
 * 
 * // Subscribe to events
 * controller.subscribe((event, state) => {
 *     console.log(event, state);
 * });
 * 
 * // Start workout
 * controller.start();
 * ```
 */

// Types
export type {
    SegmentTarget,
    WorkoutSegment,
    WorkoutCategory,
    StructuredWorkout,
    ScheduledWorkout,
    TrainingWeek,
    PlanGoal,
    TrainingPlan,
    WorkoutSettings,
    PowerZoneStatus,
    WorkoutExecutionState,
    WorkoutEvent,
    WorkoutEventListener,
    PlanProgress,
    CompletedPlanWorkout,
} from './types';

export { DEFAULT_WORKOUT_SETTINGS } from './types';

// Workout Library
export {
    workoutLibrary,
    getWorkoutById,
    getWorkoutsByCategory,
    getCategories,
    formatDuration,
    calculateTargetPower,
} from './library';

// Training Plans
export {
    trainingPlans,
    getPlanById,
    getPlansByGoal,
    getAvailableGoals,
    getTotalWorkoutsInPlan,
    getDayName,
    getShortDayName,
} from './plans';

// Workout Controller
export {
    WorkoutController,
    createWorkoutController,
} from './WorkoutController';

// Audio Cues
export {
    AudioCues,
    getAudioCues,
    createAudioCues,
} from './audioCues';

// Settings
export {
    getWorkoutSettings,
    saveWorkoutSettings,
    getFtp,
    saveFtp,
    estimateFtpFrom20Min,
    estimateFtpFrom5Min,
    getPowerZones,
    getZoneForPower,
    getZoneColor,
    getIntensityColor,
    getPlanProgress,
    savePlanProgress,
    startPlan,
    completePlanWorkout,
    isPlanWorkoutCompleted,
    getPlanCompletionPercentage,
    resetPlanProgress,
} from './settings';

export type { PowerZones } from './settings';

// Components
export {
    WorkoutSelector,
    WorkoutDisplay,
    WorkoutProfile,
    registerWorkoutComponents,
} from './components';
