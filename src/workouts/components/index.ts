/**
 * Workout Components
 * 
 * Export all workout-related web components.
 */

export { WorkoutSelector } from './WorkoutSelector';
export { WorkoutDisplay } from './WorkoutDisplay';
export { WorkoutProfile } from './WorkoutProfile';

/**
 * Register all workout components
 * Call this function to ensure all components are registered
 */
export function registerWorkoutComponents(): void {
    // Components auto-register when imported, but this function
    // can be used to ensure they're all loaded
    import('./WorkoutSelector');
    import('./WorkoutDisplay');
    import('./WorkoutProfile');
}
