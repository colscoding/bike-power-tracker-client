/**
 * Workout Settings
 * 
 * Manages user settings for workouts including FTP, heart rate zones,
 * and audio/vibration preferences.
 */

import type { WorkoutSettings, PlanProgress } from './types';
import { DEFAULT_WORKOUT_SETTINGS } from './types';

const SETTINGS_KEY = 'workout-settings';
const PLAN_PROGRESS_KEY = 'training-plan-progress';

/**
 * Get workout settings from storage
 */
export function getWorkoutSettings(): WorkoutSettings {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            return { ...DEFAULT_WORKOUT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch {
        // Ignore parse errors
    }
    return { ...DEFAULT_WORKOUT_SETTINGS };
}

/**
 * Save workout settings to storage
 */
export function saveWorkoutSettings(settings: Partial<WorkoutSettings>): void {
    const current = getWorkoutSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

/**
 * Get FTP value
 */
export function getFtp(): number {
    return getWorkoutSettings().ftp;
}

/**
 * Save FTP value
 */
export function saveFtp(ftp: number): void {
    saveWorkoutSettings({ ftp });
}

/**
 * Estimate FTP from a 20-minute power test
 * FTP is approximately 95% of 20-minute average power
 */
export function estimateFtpFrom20Min(avgPower20Min: number): number {
    return Math.round(avgPower20Min * 0.95);
}

/**
 * Estimate FTP from a 5-minute power test (less accurate)
 * FTP is approximately 85% of 5-minute average power
 */
export function estimateFtpFrom5Min(avgPower5Min: number): number {
    return Math.round(avgPower5Min * 0.85);
}

/**
 * Calculate power zones based on FTP
 */
export interface PowerZones {
    z1: { min: number; max: number; name: string };
    z2: { min: number; max: number; name: string };
    z3: { min: number; max: number; name: string };
    z4: { min: number; max: number; name: string };
    z5: { min: number; max: number; name: string };
    z6: { min: number; max: number; name: string };
    z7: { min: number; max: number; name: string };
}

/**
 * Get power zones based on FTP
 */
export function getPowerZones(ftp: number): PowerZones {
    return {
        z1: { min: 0, max: Math.round(ftp * 0.55), name: 'Active Recovery' },
        z2: { min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75), name: 'Endurance' },
        z3: { min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.90), name: 'Tempo' },
        z4: { min: Math.round(ftp * 0.90), max: Math.round(ftp * 1.05), name: 'Threshold' },
        z5: { min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.20), name: 'VO2max' },
        z6: { min: Math.round(ftp * 1.20), max: Math.round(ftp * 1.50), name: 'Anaerobic' },
        z7: { min: Math.round(ftp * 1.50), max: Infinity, name: 'Neuromuscular' },
    };
}

/**
 * Get the zone number for a given power
 */
export function getZoneForPower(power: number, ftp: number): number {
    const zones = getPowerZones(ftp);
    if (power < zones.z1.max) return 1;
    if (power < zones.z2.max) return 2;
    if (power < zones.z3.max) return 3;
    if (power < zones.z4.max) return 4;
    if (power < zones.z5.max) return 5;
    if (power < zones.z6.max) return 6;
    return 7;
}

/**
 * Get zone color for visualization
 */
export function getZoneColor(zone: number): string {
    const colors: Record<number, string> = {
        1: '#4CAF50', // Green - Recovery
        2: '#8BC34A', // Light green - Endurance
        3: '#FFEB3B', // Yellow - Tempo
        4: '#FF9800', // Orange - Threshold
        5: '#FF5722', // Deep orange - VO2max
        6: '#E91E63', // Pink - Anaerobic
        7: '#9C27B0', // Purple - Neuromuscular
    };
    return colors[zone] || '#9E9E9E';
}

/**
 * Get zone color for intensity factor (as fraction of FTP)
 */
export function getIntensityColor(intensity: number): string {
    if (intensity < 0.55) return '#4CAF50'; // Z1 - Green
    if (intensity < 0.75) return '#8BC34A'; // Z2 - Light green
    if (intensity < 0.9) return '#FFEB3B'; // Z3 - Yellow
    if (intensity < 1.05) return '#FF9800'; // Z4 - Orange
    if (intensity < 1.2) return '#FF5722'; // Z5 - Deep orange
    if (intensity < 1.5) return '#E91E63'; // Z6 - Pink
    return '#9C27B0'; // Z7 - Purple
}

// ============================================
// Training Plan Progress Tracking
// ============================================

/**
 * Get all plan progress from storage
 */
function getAllPlanProgress(): Record<string, PlanProgress> {
    try {
        const saved = localStorage.getItem(PLAN_PROGRESS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Ignore parse errors
    }
    return {};
}

/**
 * Save all plan progress to storage
 */
function saveAllPlanProgress(progress: Record<string, PlanProgress>): void {
    localStorage.setItem(PLAN_PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Get progress for a specific plan
 */
export function getPlanProgress(planId: string): PlanProgress {
    const allProgress = getAllPlanProgress();
    return allProgress[planId] || {
        startedAt: null,
        currentWeek: 1,
        completedWorkouts: [],
    };
}

/**
 * Save progress for a specific plan
 */
export function savePlanProgress(planId: string, progress: PlanProgress): void {
    const allProgress = getAllPlanProgress();
    allProgress[planId] = progress;
    saveAllPlanProgress(allProgress);
}

/**
 * Start a training plan
 */
export function startPlan(planId: string): PlanProgress {
    const progress: PlanProgress = {
        startedAt: new Date().toISOString(),
        currentWeek: 1,
        completedWorkouts: [],
    };
    savePlanProgress(planId, progress);
    return progress;
}

/**
 * Mark a workout as completed in a plan
 */
export function completePlanWorkout(
    planId: string,
    weekNumber: number,
    dayOfWeek: number,
    workoutResultId: string
): void {
    const progress = getPlanProgress(planId);
    progress.completedWorkouts.push({
        weekNumber,
        dayOfWeek,
        completedAt: new Date().toISOString(),
        workoutResultId,
    });
    savePlanProgress(planId, progress);
}

/**
 * Check if a workout is completed in a plan
 */
export function isPlanWorkoutCompleted(
    planId: string,
    weekNumber: number,
    dayOfWeek: number
): boolean {
    const progress = getPlanProgress(planId);
    return progress.completedWorkouts.some(
        (w) => w.weekNumber === weekNumber && w.dayOfWeek === dayOfWeek
    );
}

/**
 * Get completion percentage for a plan
 */
export function getPlanCompletionPercentage(planId: string, totalWorkouts: number): number {
    if (totalWorkouts === 0) return 0;
    const progress = getPlanProgress(planId);
    return Math.round((progress.completedWorkouts.length / totalWorkouts) * 100);
}

/**
 * Reset progress for a plan
 */
export function resetPlanProgress(planId: string): void {
    const allProgress = getAllPlanProgress();
    delete allProgress[planId];
    saveAllPlanProgress(allProgress);
}
