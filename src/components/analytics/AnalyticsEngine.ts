import type { Workout, Measurement } from '../../types/index.js';
import { getWorkoutHistory } from '../../db/workouts.js';

/**
 * Workout summary with calculated metrics
 */
export interface WorkoutSummary {
    id: string;
    date: Date;
    duration: number;
    avgPower: number;
    maxPower: number;
    normalizedPower: number;
    avgHeartrate: number;
    maxHeartrate: number;
    avgCadence: number;
    workKJ: number;
    zones: ZoneData;
}

/**
 * Power zone distribution
 */
export interface PowerZones {
    z1: number;
    z2: number;
    z3: number;
    z4: number;
    z5: number;
    z6: number;
}

export interface ZoneData {
    power: PowerZones;
}

/**
 * Trend data for a time period
 */
export interface TrendData {
    period: 'day' | 'week' | 'month';
    startDate: Date;
    endDate: Date;
    workoutCount: number;
    totalDuration: number;
    avgPower: number;
    avgHeartrate: number;
    totalWorkKJ: number;
}

/**
 * Personal record entry
 */
export interface PersonalRecord {
    type: string;
    value: number;
    date: Date;
    workoutId: string;
}

/**
 * Analytics engine for calculating workout metrics and trends
 */
export class AnalyticsEngine {
    private ftp: number;

    constructor(ftp = 200) {
        this.ftp = ftp;
    }

    /**
     * Set the Functional Threshold Power
     */
    setFTP(ftp: number): void {
        this.ftp = ftp;
    }

    /**
     * Get all workouts from the database
     */
    async getAllWorkouts(): Promise<Workout[]> {
        return getWorkoutHistory(999999);
    }

    /**
     * Calculate summary for a single workout
     */
    calculateWorkoutSummary(workout: Workout): WorkoutSummary {
        const powers = workout.measurements.power.map((m: Measurement) => m.value);
        const heartrates = workout.measurements.heartrate.map((m: Measurement) => m.value);
        const cadences = workout.measurements.cadence.map((m: Measurement) => m.value);

        const endTime = workout.endTime || Date.now();
        const duration = Math.floor((endTime - workout.startTime) / 1000);

        return {
            id: workout.id,
            date: new Date(workout.startTime),
            duration,
            avgPower: this.average(powers),
            maxPower: Math.max(...powers, 0),
            normalizedPower: this.calculateNP(powers),
            avgHeartrate: this.average(heartrates),
            maxHeartrate: Math.max(...heartrates, 0),
            avgCadence: this.average(cadences),
            workKJ: this.calculateWork(powers),
            zones: this.calculateZones(powers),
        };
    }

    /**
     * Calculate Normalized Power (NP)
     * 30-second rolling average raised to 4th power, averaged, then 4th root
     */
    calculateNP(powers: number[]): number {
        if (powers.length < 30) return this.average(powers);

        const rollingAvg: number[] = [];
        for (let i = 29; i < powers.length; i++) {
            const window = powers.slice(i - 29, i + 1);
            rollingAvg.push(this.average(window));
        }

        const raised = rollingAvg.map((p) => Math.pow(p, 4));
        const avgRaised = this.average(raised);
        return Math.round(Math.pow(avgRaised, 0.25));
    }

    /**
     * Calculate total work in kJ
     */
    calculateWork(powers: number[]): number {
        // Assuming 1 second intervals
        const joules = powers.reduce((sum, p) => sum + (p || 0), 0);
        return Math.round(joules / 1000);
    }

    /**
     * Calculate time in power zones
     */
    calculateZones(powers: number[]): ZoneData {
        const powerZones: PowerZones = {
            z1: 0, // Active Recovery (< 55%)
            z2: 0, // Endurance (55-75%)
            z3: 0, // Tempo (75-90%)
            z4: 0, // Threshold (90-105%)
            z5: 0, // VO2max (105-120%)
            z6: 0, // Anaerobic (> 120%)
        };

        powers.forEach((p) => {
            const pct = p / this.ftp;
            if (pct < 0.55) powerZones.z1++;
            else if (pct < 0.75) powerZones.z2++;
            else if (pct < 0.9) powerZones.z3++;
            else if (pct < 1.05) powerZones.z4++;
            else if (pct < 1.2) powerZones.z5++;
            else powerZones.z6++;
        });

        return { power: powerZones };
    }

    /**
     * Calculate trends over a period
     */
    async calculateTrends(
        period: 'day' | 'week' | 'month' = 'week',
        count = 8
    ): Promise<TrendData[]> {
        const workouts = await this.getAllWorkouts();
        const now = new Date();
        const trends: TrendData[] = [];

        for (let i = 0; i < count; i++) {
            const { startDate, endDate } = this.getPeriodBounds(now, period, i);

            const periodWorkouts = workouts.filter((w) => {
                const date = new Date(w.startTime);
                return date >= startDate && date < endDate;
            });

            const summaries = periodWorkouts.map((w) => this.calculateWorkoutSummary(w));

            trends.push({
                period,
                startDate,
                endDate,
                workoutCount: summaries.length,
                totalDuration: summaries.reduce((s, w) => s + w.duration, 0),
                avgPower: this.average(summaries.map((s) => s.avgPower).filter((v) => v > 0)),
                avgHeartrate: this.average(
                    summaries.map((s) => s.avgHeartrate).filter((v) => v > 0)
                ),
                totalWorkKJ: summaries.reduce((s, w) => s + w.workKJ, 0),
            });
        }

        return trends.reverse(); // Oldest first
    }

    /**
     * Find personal records
     */
    async findRecords(): Promise<PersonalRecord[]> {
        const workouts = await this.getAllWorkouts();
        const records: { [key: string]: PersonalRecord } = {};

        for (const workout of workouts) {
            const summary = this.calculateWorkoutSummary(workout);

            // Max power
            if (!records.maxPower || summary.maxPower > records.maxPower.value) {
                records.maxPower = {
                    type: 'maxPower',
                    value: summary.maxPower,
                    date: summary.date,
                    workoutId: workout.id,
                };
            }

            // Best average power (workouts > 20 min)
            if (summary.duration >= 1200) {
                if (!records.avgPower20 || summary.avgPower > records.avgPower20.value) {
                    records.avgPower20 = {
                        type: '20minPower',
                        value: summary.avgPower,
                        date: summary.date,
                        workoutId: workout.id,
                    };
                }
            }

            // Best NP
            if (!records.normalizedPower || summary.normalizedPower > records.normalizedPower.value) {
                records.normalizedPower = {
                    type: 'normalizedPower',
                    value: summary.normalizedPower,
                    date: summary.date,
                    workoutId: workout.id,
                };
            }

            // Best work output
            if (!records.totalWork || summary.workKJ > records.totalWork.value) {
                records.totalWork = {
                    type: 'totalWork',
                    value: summary.workKJ,
                    date: summary.date,
                    workoutId: workout.id,
                };
            }
        }

        return Object.values(records);
    }

    /**
     * Get aggregated zone data for all workouts
     */
    async getAggregatedZones(): Promise<ZoneData> {
        const workouts = await this.getAllWorkouts();
        const aggregated: PowerZones = {
            z1: 0,
            z2: 0,
            z3: 0,
            z4: 0,
            z5: 0,
            z6: 0,
        };

        for (const workout of workouts) {
            const summary = this.calculateWorkoutSummary(workout);
            aggregated.z1 += summary.zones.power.z1;
            aggregated.z2 += summary.zones.power.z2;
            aggregated.z3 += summary.zones.power.z3;
            aggregated.z4 += summary.zones.power.z4;
            aggregated.z5 += summary.zones.power.z5;
            aggregated.z6 += summary.zones.power.z6;
        }

        return { power: aggregated };
    }

    // Helper methods

    private average(arr: number[]): number {
        if (!arr.length) return 0;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }

    private getPeriodBounds(
        date: Date,
        period: 'day' | 'week' | 'month',
        offset: number
    ): { startDate: Date; endDate: Date } {
        const start = new Date(date);
        const end = new Date(date);

        if (period === 'day') {
            start.setDate(start.getDate() - offset);
            start.setHours(0, 0, 0, 0);
            end.setTime(start.getTime());
            end.setDate(end.getDate() + 1);
        } else if (period === 'week') {
            start.setDate(start.getDate() - offset * 7 - start.getDay());
            start.setHours(0, 0, 0, 0);
            end.setTime(start.getTime());
            end.setDate(end.getDate() + 7);
        } else if (period === 'month') {
            start.setMonth(start.getMonth() - offset, 1);
            start.setHours(0, 0, 0, 0);
            end.setTime(start.getTime());
            end.setMonth(end.getMonth() + 1);
        }

        return { startDate: start, endDate: end };
    }
}
