/**
 * Charts Module
 *
 * Real-time and historical chart components for workout visualization.
 * Uses Chart.js loaded from CDN - no package.json dependencies required.
 *
 * @example
 * ```html
 * <!-- Live chart during workout -->
 * <live-chart duration="60"></live-chart>
 *
 * <!-- History chart for post-workout analysis -->
 * <history-chart></history-chart>
 *
 * <!-- Zone distribution chart -->
 * <zone-chart title="Power Zones"></zone-chart>
 * ```
 *
 * @example
 * ```typescript
 * import { LiveChart, HistoryChart, ZoneChart } from './charts';
 * import { calculatePowerZoneDistribution } from './charts';
 *
 * // Get the live chart element
 * const liveChart = document.querySelector('live-chart') as LiveChart;
 *
 * // Add data points during workout
 * liveChart.addPower(185);
 * liveChart.addHeartrate(145);
 * liveChart.addCadence(90);
 *
 * // For post-workout analysis
 * const historyChart = document.querySelector('history-chart') as HistoryChart;
 * historyChart.setData(mergedDataPoints);
 *
 * // For zone analysis
 * const zoneChart = document.querySelector('zone-chart') as ZoneChart;
 * const distribution = calculatePowerZoneDistribution(powerData, 200);
 * zoneChart.setDistribution(distribution);
 * ```
 */

// Types
export type {
    ChartDataPoint,
    MergedDataPoint,
    ChartConfig,
    PowerZone,
    HRZone,
    ZoneDistribution,
} from './types';

export { DEFAULT_CHART_CONFIG, POWER_ZONES, HR_ZONES } from './types';

// Chart loader utilities
export {
    loadChartJS,
    loadChartJSWithStreaming,
    isChartJSLoaded,
    getChartJS,
} from './chartLoader';

export type { ChartInstance, ChartConstructor } from './chartLoader';

// Zone calculations
export {
    calculatePowerZoneDistribution,
    calculateHRZoneDistribution,
    formatZoneTime,
} from './zoneCalculator';

// Components
export { LiveChart } from './LiveChart';
export { HistoryChart } from './HistoryChart';
export { ZoneChart } from './ZoneChart';

/**
 * Register all chart components
 * Components auto-register when imported, but this function ensures they're all loaded
 */
export function registerChartComponents(): void {
    import('./LiveChart');
    import('./HistoryChart');
    import('./ZoneChart');
}
