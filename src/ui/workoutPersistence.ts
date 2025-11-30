import type { MeasurementsState } from '../MeasurementsState.js';
import type { TimeState } from '../types/index.js';
import { getWorkoutService } from '../services/workoutService.js';
import { AutoSaveService } from '../services/autoSaveService.js';
import { showNotification } from './notifications.js';

interface WorkoutPersistenceParams {
    measurementsState: MeasurementsState;
    timeState: TimeState;
}

/**
 * Initialize workout persistence with auto-save
 * This hooks into the start/stop button to manage workout state in IndexedDB
 */
export async function initWorkoutPersistence({
    measurementsState,
    timeState
}: WorkoutPersistenceParams): Promise<void> {
    const workoutService = getWorkoutService();
    await workoutService.init();

    const autoSave = new AutoSaveService(
        workoutService,
        measurementsState,
        timeState,
        10000 // Save every 10 seconds
    );

    // Check for active workout on startup
    const activeWorkout = await workoutService.getActiveWorkout();
    if (activeWorkout) {
        const resume = confirm(
            'You have an unfinished workout. Would you like to resume it?\n\n' +
            `Started: ${new Date(activeWorkout.startTime).toLocaleString()}\n` +
            `Data points: ${activeWorkout.measurements.power.length + activeWorkout.measurements.heartrate.length + activeWorkout.measurements.cadence.length}`
        );

        if (resume) {
            // Restore state from active workout
            measurementsState.power = [...activeWorkout.measurements.power];
            measurementsState.heartrate = [...activeWorkout.measurements.heartrate];
            measurementsState.cadence = [...activeWorkout.measurements.cadence];

            // Calculate how long the workout was running before it was interrupted
            const elapsedDuration = activeWorkout.duration || (Date.now() - activeWorkout.startTime);

            // Set time state to reflect the workout was in progress
            // We set startTime so that when resumed, the timer continues from where it left off
            timeState.startTime = Date.now() - elapsedDuration;
            timeState.endTime = Date.now(); // Set endTime so it shows as paused
            timeState.running = false;

            workoutService.setCurrentWorkoutId(activeWorkout.id);

            showNotification('Workout restored! Click play to continue.', 'success');
        } else {
            // Discard the old workout
            await workoutService.deleteWorkout(activeWorkout.id);
            showNotification('Previous workout discarded.', 'info');
        }
    }

    // Hook into start/stop button
    const startStopButton = document.getElementById('startStop')!;

    // Track the previous running state to detect changes
    let wasRunning = timeState.running;

    // Listen for clicks on start/stop button
    startStopButton.addEventListener('click', async () => {
        // The time.ts handler runs first (due to event listener order),
        // so by the time this runs, timeState.running has already been toggled
        const isNowRunning = timeState.running;

        if (isNowRunning && !wasRunning) {
            // Just started
            if (!workoutService.getCurrentWorkoutId()) {
                // Only start a new workout if we don't have one (fresh start)
                await workoutService.startWorkout();
            }
            autoSave.start();
        } else if (!isNowRunning && wasRunning) {
            // Just stopped
            await autoSave.saveNow();
            autoSave.stop();

            // Complete the workout
            if (timeState.startTime) {
                await workoutService.completeWorkout(measurementsState, timeState.startTime);
                console.log('Workout completed and saved');
            }
        }

        wasRunning = isNowRunning;
    });

    // Hook into discard button
    const discardButton = document.getElementById('discardButton');
    if (discardButton) {
        discardButton.addEventListener('click', async () => {
            // This runs after the menu.ts handler shows the confirm dialog
            // Only discard from DB if the workout was actually discarded
            // We check if measurements were cleared (which happens in menu.ts)
            setTimeout(async () => {
                if (measurementsState.power.length === 0 &&
                    measurementsState.heartrate.length === 0 &&
                    measurementsState.cadence.length === 0) {
                    autoSave.stop();
                    await workoutService.discardWorkout();
                    wasRunning = false;
                    console.log('Workout discarded from database');
                }
            }, 100);
        });
    }

    // Also save when page is about to unload (best effort)
    window.addEventListener('beforeunload', () => {
        if (autoSave.isRunning()) {
            autoSave.saveNow();
        }
    });

    // Save on visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && autoSave.isRunning()) {
            autoSave.saveNow();
        }
    });
}
