import type { MetricType } from '../types/index.js';
import type { AppStoreState, ConnectionStatus } from './state.js';

// ============ Workout Selectors ============

export const selectIsRunning = (state: AppStoreState): boolean => state.workout.isRunning;

export const selectStartTime = (state: AppStoreState): number | null => state.workout.startTime;

export const selectEndTime = (state: AppStoreState): number | null => state.workout.endTime;

export const selectElapsedSeconds = (state: AppStoreState): number => state.workout.elapsedSeconds;

export const selectWorkoutState = (state: AppStoreState) => state.workout;

// ============ Connection Selectors ============

export const selectConnectionStatus =
    (type: MetricType) =>
        (state: AppStoreState): ConnectionStatus =>
            state.connections[type].status;

export const selectIsConnected =
    (type: MetricType) =>
        (state: AppStoreState): boolean =>
            state.connections[type].status === 'connected';

export const selectAnyConnected = (state: AppStoreState): boolean =>
    Object.values(state.connections).some((c) => c.status === 'connected');

export const selectAllConnections = (state: AppStoreState) => state.connections;

// ============ Reading Selectors ============

export const selectReading =
    (type: MetricType) =>
        (state: AppStoreState): number | null =>
            state.readings[type];

export const selectAllReadings = (state: AppStoreState) => state.readings;

// ============ UI Selectors ============

export const selectMenuOpen = (state: AppStoreState): boolean => state.ui.menuOpen;

export const selectNotification = (state: AppStoreState) => state.ui.notification;

// ============ Derived Selectors ============

export const selectWorkoutSummary = (state: AppStoreState) => ({
    isRunning: state.workout.isRunning,
    duration: state.workout.elapsedSeconds,
    hasData: Object.values(state.readings).some((r) => r !== null),
    connectedSensors: (Object.entries(state.connections) as [MetricType, { status: ConnectionStatus }][])
        .filter(([, c]) => c.status === 'connected')
        .map(([type]) => type),
});
