import { elements } from './elements.js';
import type { ConnectionsState, MetricType } from './types/index.js';
import type { MeasurementsState } from './MeasurementsState.js';

interface MetricsDisplayParams {
    connectionsState: ConnectionsState;
    measurementsState: MeasurementsState;
}

export const initMetricsDisplay = ({
    connectionsState,
    measurementsState,
}: MetricsDisplayParams): void => {
    const updateMetricDisplay = (key: MetricType): void => {
        const element = elements?.[key]?.display;
        if (!element || !connectionsState?.[key]) {
            return;
        }
        const emptyValue = '--';
        if (!connectionsState?.[key]?.isConnected) {
            element.textContent = emptyValue;
            return;
        }
        const arr = measurementsState[key];
        if (!Array.isArray(arr) || arr.length === 0) {
            element.textContent = emptyValue;
            return;
        }

        const latestMeasurement = arr[arr.length - 1];
        if (
            !latestMeasurement ||
            typeof latestMeasurement.value !== 'number' ||
            typeof latestMeasurement.timestamp !== 'number'
        ) {
            element.textContent = emptyValue;
            return;
        }
        const timeDiff = Date.now() - latestMeasurement.timestamp;
        // If data is older than 5 seconds, show as disconnected
        if (timeDiff > 5000) {
            element.textContent = emptyValue;
            return;
        }

        element.textContent = String(latestMeasurement.value);
    };

    const metricTypes: MetricType[] = ['power', 'heartrate', 'cadence'];
    // Start the event loop
    setInterval(() => {
        metricTypes.forEach(updateMetricDisplay);
    }, 100);
};
