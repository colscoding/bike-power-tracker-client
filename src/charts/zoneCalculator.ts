/**
 * Zone Calculator
 *
 * Calculates time spent in different power/heart rate zones.
 */

import type { ChartDataPoint, ZoneDistribution, PowerZone, HRZone } from './types';
import { POWER_ZONES, HR_ZONES } from './types';

/**
 * Calculate zone distribution for power data
 */
export function calculatePowerZoneDistribution(
    measurements: ChartDataPoint[],
    ftp: number = 200
): ZoneDistribution[] {
    return calculateZoneDistribution(measurements, POWER_ZONES, ftp);
}

/**
 * Calculate zone distribution for heart rate data
 */
export function calculateHRZoneDistribution(
    measurements: ChartDataPoint[],
    maxHR: number = 185
): ZoneDistribution[] {
    return calculateZoneDistribution(measurements, HR_ZONES, maxHR);
}

/**
 * Calculate zone distribution for any metric
 */
function calculateZoneDistribution(
    measurements: ChartDataPoint[],
    zones: (PowerZone | HRZone)[],
    referenceValue: number
): ZoneDistribution[] {
    // Initialize zone times
    const zoneTimes = zones.map(() => 0);
    let totalTime = 0;

    // Calculate time in each zone
    for (let i = 1; i < measurements.length; i++) {
        const value = measurements[i].value;
        if (value === null) continue;

        const duration = measurements[i].timestamp - measurements[i - 1].timestamp;
        if (duration <= 0) continue;

        totalTime += duration;
        const percentage = (value / referenceValue) * 100;

        // Find which zone this value belongs to
        for (let z = 0; z < zones.length; z++) {
            if (percentage >= zones[z].min && percentage < zones[z].max) {
                zoneTimes[z] += duration;
                break;
            }
        }
    }

    // Build distribution result
    return zones.map((zone, i) => ({
        name: zone.name,
        color: zone.color,
        time: zoneTimes[i],
        percentage: totalTime > 0 ? (zoneTimes[i] / totalTime) * 100 : 0,
    }));
}

/**
 * Format zone time in human-readable format
 */
export function formatZoneTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
}
