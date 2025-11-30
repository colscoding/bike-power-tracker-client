/**
 * Training Plans
 * 
 * Multi-week training plans with scheduled workouts.
 */

import type { TrainingPlan, PlanGoal } from './types';

/**
 * Sample training plans library
 */
export const trainingPlans: TrainingPlan[] = [
    {
        id: 'ftp-builder-4week',
        name: '4-Week FTP Builder',
        description: 'Build your functional threshold power over 4 weeks with progressive overload',
        goal: 'ftp-builder',
        weeksTotal: 4,
        weeks: [
            {
                weekNumber: 1,
                focus: 'Base Building',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-60' },
                    { dayOfWeek: 3, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 5, workoutId: 'endurance-60' },
                    { dayOfWeek: 6, workoutId: 'sweet-spot-intervals' },
                ],
            },
            {
                weekNumber: 2,
                focus: 'Load Week',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 3, workoutId: 'vo2max-30-30' },
                    { dayOfWeek: 5, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 6, workoutId: 'endurance-60' },
                ],
            },
            {
                weekNumber: 3,
                focus: 'Peak Week',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'vo2max-30-30' },
                    { dayOfWeek: 3, workoutId: 'threshold-2x20' },
                    { dayOfWeek: 4, workoutId: 'vo2max-30-30' },
                    { dayOfWeek: 6, workoutId: 'sweet-spot-intervals' },
                ],
            },
            {
                weekNumber: 4,
                focus: 'Recovery & Test',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-45' },
                    { dayOfWeek: 3, workoutId: 'recovery-30' },
                    { dayOfWeek: 6, workoutId: 'ftp-test-20' },
                ],
            },
        ],
    },
    {
        id: 'endurance-builder-4week',
        name: '4-Week Endurance Builder',
        description: 'Build your aerobic base with progressive endurance training',
        goal: 'endurance',
        weeksTotal: 4,
        weeks: [
            {
                weekNumber: 1,
                focus: 'Foundation',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-45' },
                    { dayOfWeek: 3, workoutId: 'endurance-45' },
                    { dayOfWeek: 5, workoutId: 'endurance-60' },
                ],
            },
            {
                weekNumber: 2,
                focus: 'Build',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-60' },
                    { dayOfWeek: 3, workoutId: 'endurance-45' },
                    { dayOfWeek: 5, workoutId: 'endurance-60' },
                    { dayOfWeek: 6, workoutId: 'recovery-30' },
                ],
            },
            {
                weekNumber: 3,
                focus: 'Load',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-60' },
                    { dayOfWeek: 3, workoutId: 'endurance-60' },
                    { dayOfWeek: 4, workoutId: 'recovery-30' },
                    { dayOfWeek: 6, workoutId: 'endurance-60' },
                ],
            },
            {
                weekNumber: 4,
                focus: 'Recovery',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-45' },
                    { dayOfWeek: 3, workoutId: 'recovery-30' },
                    { dayOfWeek: 5, workoutId: 'endurance-45' },
                ],
            },
        ],
    },
    {
        id: 'general-fitness-2week',
        name: '2-Week Fitness Starter',
        description: 'A simple 2-week plan to get started with structured training',
        goal: 'general-fitness',
        weeksTotal: 2,
        weeks: [
            {
                weekNumber: 1,
                focus: 'Introduction',
                workouts: [
                    { dayOfWeek: 2, workoutId: 'endurance-45' },
                    { dayOfWeek: 4, workoutId: 'recovery-30' },
                    { dayOfWeek: 6, workoutId: 'endurance-45' },
                ],
            },
            {
                weekNumber: 2,
                focus: 'Progress',
                workouts: [
                    { dayOfWeek: 2, workoutId: 'endurance-45' },
                    { dayOfWeek: 4, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 6, workoutId: 'endurance-60' },
                ],
            },
        ],
    },
];

/**
 * Get a training plan by ID
 */
export function getPlanById(id: string): TrainingPlan | undefined {
    return trainingPlans.find((p) => p.id === id);
}

/**
 * Get all training plans for a specific goal
 */
export function getPlansByGoal(goal: PlanGoal): TrainingPlan[] {
    return trainingPlans.filter((p) => p.goal === goal);
}

/**
 * Get all available plan goals
 */
export function getAvailableGoals(): PlanGoal[] {
    const goals = new Set(trainingPlans.map((p) => p.goal));
    return Array.from(goals);
}

/**
 * Get the total number of workouts in a plan
 */
export function getTotalWorkoutsInPlan(plan: TrainingPlan): number {
    return plan.weeks.reduce((sum, week) => sum + week.workouts.length, 0);
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || '';
}

/**
 * Get short day name from day of week number
 */
export function getShortDayName(dayOfWeek: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek] || '';
}
