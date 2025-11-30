/**
 * Chart Types
 *
 * Type definitions for the charting system.
 */

/**
 * A single data point for the chart
 */
export interface ChartDataPoint {
    timestamp: number;
    value: number | null;
}

/**
 * Merged data point with all metrics
 */
export interface MergedDataPoint {
    timestamp: number;
    power: number | null;
    heartrate: number | null;
    cadence: number | null;
}

/**
 * Chart configuration options
 */
export interface ChartConfig {
    /** Duration of the live chart window in seconds */
    duration?: number;
    /** Refresh interval in milliseconds */
    refreshInterval?: number;
    /** Whether to show the power trace */
    showPower?: boolean;
    /** Whether to show the heart rate trace */
    showHeartrate?: boolean;
    /** Whether to show the cadence trace */
    showCadence?: boolean;
    /** Maximum power value for y-axis */
    maxPower?: number;
    /** Maximum heart rate value for y-axis */
    maxHeartrate?: number;
    /** Maximum cadence value for y-axis */
    maxCadence?: number;
}

/**
 * Default chart configuration
 */
export const DEFAULT_CHART_CONFIG: Required<ChartConfig> = {
    duration: 60,
    refreshInterval: 1000,
    showPower: true,
    showHeartrate: true,
    showCadence: true,
    maxPower: 500,
    maxHeartrate: 200,
    maxCadence: 150,
};

/**
 * Power zones based on FTP percentage
 */
export interface PowerZone {
    name: string;
    min: number;
    max: number;
    color: string;
}

/**
 * Standard power zones
 */
export const POWER_ZONES: PowerZone[] = [
    { name: 'Recovery', min: 0, max: 55, color: '#9E9E9E' },
    { name: 'Endurance', min: 55, max: 75, color: '#2196F3' },
    { name: 'Tempo', min: 75, max: 90, color: '#4CAF50' },
    { name: 'Threshold', min: 90, max: 105, color: '#FF9800' },
    { name: 'VO2 Max', min: 105, max: 120, color: '#F44336' },
    { name: 'Anaerobic', min: 120, max: 150, color: '#9C27B0' },
    { name: 'Neuromuscular', min: 150, max: Infinity, color: '#000000' },
];

/**
 * Heart rate zones based on max HR percentage
 */
export interface HRZone {
    name: string;
    min: number;
    max: number;
    color: string;
}

/**
 * Standard heart rate zones
 */
export const HR_ZONES: HRZone[] = [
    { name: 'Zone 1', min: 0, max: 60, color: '#9E9E9E' },
    { name: 'Zone 2', min: 60, max: 70, color: '#2196F3' },
    { name: 'Zone 3', min: 70, max: 80, color: '#4CAF50' },
    { name: 'Zone 4', min: 80, max: 90, color: '#FF9800' },
    { name: 'Zone 5', min: 90, max: 100, color: '#F44336' },
];

/**
 * Zone distribution result
 */
export interface ZoneDistribution {
    name: string;
    color: string;
    time: number;
    percentage: number;
}
