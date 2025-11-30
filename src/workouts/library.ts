/**
 * Workout Library
 * 
 * Pre-defined structured workouts for various training goals.
 * All power targets are expressed as fractions of FTP (0.0-1.5+).
 */

import type { StructuredWorkout, WorkoutCategory, WorkoutSegment } from './types';

/**
 * Helper to create interval patterns
 */
function createIntervals(
    count: number,
    workName: string,
    workDuration: number,
    workTarget: { powerLow: number; powerHigh: number },
    workInstruction: string,
    restName: string,
    restDuration: number,
    restTarget: { powerLow: number; powerHigh: number },
    restInstruction: string
): WorkoutSegment[] {
    const segments: WorkoutSegment[] = [];
    for (let i = 0; i < count; i++) {
        const isLast = i === count - 1;
        segments.push({
            name: `${workName} ${i + 1}`,
            duration: workDuration,
            target: workTarget,
            instructions: isLast ? 'Last one!' : workInstruction,
        });
        // Don't add rest after the last work interval
        if (!isLast) {
            segments.push({
                name: `${restName} ${i + 1}`,
                duration: restDuration,
                target: restTarget,
                instructions: i === count - 2 ? 'Almost there, one more interval' : restInstruction,
            });
        }
    }
    return segments;
}

/**
 * Sample workout library
 */
export const workoutLibrary: StructuredWorkout[] = [
    {
        id: 'endurance-60',
        name: 'Endurance 60',
        description: 'One hour steady endurance ride at low intensity',
        category: 'endurance',
        totalDuration: 3600,
        tss: 50,
        intensityFactor: 0.65,
        segments: [
            {
                name: 'Warm Up',
                duration: 600,
                target: { powerLow: 0.45, powerHigh: 0.55 },
                instructions: 'Easy spinning, gradually increase effort',
            },
            {
                name: 'Main Set',
                duration: 2700,
                target: { powerLow: 0.55, powerHigh: 0.7, cadenceLow: 85, cadenceHigh: 95 },
                instructions: 'Steady endurance pace, stay relaxed',
            },
            {
                name: 'Cool Down',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning, let your heart rate come down',
            },
        ],
    },
    {
        id: 'endurance-45',
        name: 'Endurance 45',
        description: '45 minute steady endurance ride',
        category: 'endurance',
        totalDuration: 2700,
        tss: 38,
        intensityFactor: 0.65,
        segments: [
            {
                name: 'Warm Up',
                duration: 300,
                target: { powerLow: 0.45, powerHigh: 0.55 },
                instructions: 'Easy spinning to warm up',
            },
            {
                name: 'Main Set',
                duration: 2100,
                target: { powerLow: 0.55, powerHigh: 0.7, cadenceLow: 85, cadenceHigh: 95 },
                instructions: 'Steady endurance pace',
            },
            {
                name: 'Cool Down',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning',
            },
        ],
    },
    {
        id: 'sweet-spot-intervals',
        name: 'Sweet Spot Intervals',
        description: '4x10 minute sweet spot intervals with 5 minute recovery',
        category: 'threshold',
        totalDuration: 4200,
        tss: 75,
        intensityFactor: 0.85,
        segments: [
            {
                name: 'Warm Up',
                duration: 600,
                target: { powerLow: 0.45, powerHigh: 0.55 },
                instructions: 'Easy spinning',
            },
            {
                name: 'Sweet Spot 1',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Hold steady, should feel hard but sustainable',
            },
            {
                name: 'Recovery 1',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning, recover for next interval',
            },
            {
                name: 'Sweet Spot 2',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Same effort as first interval',
            },
            {
                name: 'Recovery 2',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Recover well, halfway done!',
            },
            {
                name: 'Sweet Spot 3',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Stay focused, two more to go',
            },
            {
                name: 'Recovery 3',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Almost there, one more interval',
            },
            {
                name: 'Sweet Spot 4',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Last one! Give it your all',
            },
            {
                name: 'Cool Down',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Great job! Easy spin to finish',
            },
        ],
    },
    {
        id: 'vo2max-30-30',
        name: 'VO2max 30/30',
        description: '10x 30 second hard efforts with 30 second recovery',
        category: 'vo2max',
        // 900 warmup + 10*30 hard + 9*30 rest + 600 cooldown = 900 + 300 + 270 + 600 = 2070
        totalDuration: 2070,
        tss: 55,
        intensityFactor: 0.95,
        segments: [
            {
                name: 'Warm Up',
                duration: 900,
                target: { powerLow: 0.5, powerHigh: 0.65 },
                instructions: 'Include a few 10-second accelerations',
            },
            ...createIntervals(
                10,
                'Hard',
                30,
                { powerLow: 1.1, powerHigh: 1.25 },
                'Go hard!',
                'Easy',
                30,
                { powerLow: 0.4, powerHigh: 0.5 },
                'Spin easy, recover'
            ),
            {
                name: 'Cool Down',
                duration: 600,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning',
            },
        ],
    },
    {
        id: 'recovery-30',
        name: 'Recovery Spin',
        description: '30 minute easy recovery ride',
        category: 'recovery',
        totalDuration: 1800,
        tss: 20,
        intensityFactor: 0.5,
        segments: [
            {
                name: 'Easy Spin',
                duration: 1800,
                target: { powerLow: 0.4, powerHigh: 0.55, cadenceLow: 80, cadenceHigh: 90 },
                instructions: 'Keep it very easy, focus on smooth pedaling',
            },
        ],
    },
    {
        id: 'threshold-2x20',
        name: 'Threshold 2x20',
        description: 'Classic 2x20 minute threshold intervals',
        category: 'threshold',
        totalDuration: 3600,
        tss: 80,
        intensityFactor: 0.9,
        segments: [
            {
                name: 'Warm Up',
                duration: 600,
                target: { powerLow: 0.5, powerHigh: 0.65 },
                instructions: 'Gradual warm up',
            },
            {
                name: 'Threshold 1',
                duration: 1200,
                target: { powerLow: 0.95, powerHigh: 1.05, cadenceLow: 85, cadenceHigh: 95 },
                instructions: 'Right at threshold, steady and controlled',
            },
            {
                name: 'Recovery',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Take it easy, prepare for second interval',
            },
            {
                name: 'Threshold 2',
                duration: 1200,
                target: { powerLow: 0.95, powerHigh: 1.05, cadenceLow: 85, cadenceHigh: 95 },
                instructions: 'Same effort, stay focused',
            },
            {
                name: 'Cool Down',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Excellent work! Easy spin',
            },
        ],
    },
    {
        id: 'ftp-test-20',
        name: '20-Minute FTP Test',
        description: 'Test your FTP with a 20-minute all-out effort',
        category: 'test',
        totalDuration: 2700,
        tss: 65,
        intensityFactor: 0.95,
        segments: [
            {
                name: 'Warm Up',
                duration: 600,
                target: { powerLow: 0.5, powerHigh: 0.65 },
                instructions: 'Easy spinning, getting ready',
            },
            {
                name: 'Opener 1',
                duration: 60,
                target: { powerLow: 0.9, powerHigh: 1.0 },
                instructions: 'First opener effort',
            },
            {
                name: 'Recovery',
                duration: 60,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spin',
            },
            {
                name: 'Opener 2',
                duration: 60,
                target: { powerLow: 1.0, powerHigh: 1.1 },
                instructions: 'Second opener, slightly harder',
            },
            {
                name: 'Recovery',
                duration: 120,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Recover fully before test',
            },
            {
                name: '20-Minute Test',
                duration: 1200,
                target: { powerLow: 0.95, powerHigh: 1.1 },
                instructions: 'Give it everything! Pace yourself for 20 minutes',
            },
            {
                name: 'Cool Down',
                duration: 600,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Great effort! Easy spinning to recover',
            },
        ],
    },
];

/**
 * Get a workout by its ID
 */
export function getWorkoutById(id: string): StructuredWorkout | undefined {
    return workoutLibrary.find((w) => w.id === id);
}

/**
 * Get all workouts of a specific category
 */
export function getWorkoutsByCategory(category: WorkoutCategory): StructuredWorkout[] {
    return workoutLibrary.filter((w) => w.category === category);
}

/**
 * Get all available workout categories
 */
export function getCategories(): WorkoutCategory[] {
    const categories = new Set(workoutLibrary.map((w) => w.category));
    return Array.from(categories);
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate target power in watts from FTP percentage
 */
export function calculateTargetPower(ftpPercentage: number, ftp: number): number {
    return Math.round(ftpPercentage * ftp);
}
