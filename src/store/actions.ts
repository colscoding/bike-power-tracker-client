import type { MetricType, NotificationType } from '../types/index.js';
import type { Store } from './createStore.js';
import type { AppStoreState, ConnectionStatus } from './state.js';
import { createInitialState } from './state.js';

export type AppStore = Store<AppStoreState>;

/**
 * Creates action functions for manipulating the store state.
 * Actions encapsulate state updates and provide a clean API.
 */
export function createActions(store: AppStore) {
    return {
        // ============ Workout Actions ============

        startWorkout: () => {
            const state = store.getState();
            if (state.workout.endTime) {
                // Resuming from paused state - adjust startTime
                const stoppedDuration = Date.now() - state.workout.endTime;
                store.setState({
                    workout: {
                        ...state.workout,
                        isRunning: true,
                        startTime: (state.workout.startTime ?? Date.now()) + stoppedDuration,
                        endTime: null,
                    },
                });
            } else {
                // Fresh start
                store.setState({
                    workout: {
                        ...state.workout,
                        isRunning: true,
                        startTime: Date.now(),
                        endTime: null,
                    },
                });
            }
        },

        stopWorkout: () => {
            store.setState((state) => ({
                workout: {
                    ...state.workout,
                    isRunning: false,
                    endTime: Date.now(),
                },
            }));
        },

        resetWorkout: () => {
            const initial = createInitialState();
            store.setState({
                workout: initial.workout,
                readings: initial.readings,
            });
        },

        updateElapsedTime: (seconds: number) => {
            store.setState((state) => ({
                workout: { ...state.workout, elapsedSeconds: seconds },
            }));
        },

        // Restore workout state (for resuming interrupted workouts)
        restoreWorkout: (startTime: number, endTime: number | null) => {
            store.setState((state) => ({
                workout: {
                    ...state.workout,
                    isRunning: false,
                    startTime,
                    endTime,
                },
            }));
        },

        // ============ Connection Actions ============

        setConnectionStatus: (type: MetricType, status: ConnectionStatus) => {
            store.setState((state) => ({
                connections: {
                    ...state.connections,
                    [type]: { ...state.connections[type], status },
                },
            }));
        },

        setConnected: (type: MetricType, disconnect: () => void) => {
            store.setState((state) => ({
                connections: {
                    ...state.connections,
                    [type]: { status: 'connected' as const, disconnect },
                },
            }));
        },

        disconnect: (type: MetricType) => {
            const state = store.getState();
            const connection = state.connections[type];

            // Call disconnect function if it exists
            if (connection.disconnect) {
                connection.disconnect();
            }

            store.setState((state) => ({
                connections: {
                    ...state.connections,
                    [type]: { status: 'disconnected', disconnect: null },
                },
                readings: {
                    ...state.readings,
                    [type]: null,
                },
            }));
        },

        // ============ Reading Actions ============

        updateReading: (type: MetricType, value: number) => {
            store.setState((state) => ({
                readings: { ...state.readings, [type]: value },
            }));
        },

        clearReading: (type: MetricType) => {
            store.setState((state) => ({
                readings: { ...state.readings, [type]: null },
            }));
        },

        // ============ UI Actions ============

        toggleMenu: () => {
            store.setState((state) => ({
                ui: { ...state.ui, menuOpen: !state.ui.menuOpen },
            }));
        },

        closeMenu: () => {
            store.setState((state) => ({
                ui: { ...state.ui, menuOpen: false },
            }));
        },

        showNotification: (message: string, type: NotificationType = 'info') => {
            store.setState((state) => ({
                ui: { ...state.ui, notification: { message, type } },
            }));
        },

        clearNotification: () => {
            store.setState((state) => ({
                ui: { ...state.ui, notification: null },
            }));
        },
    };
}

export type Actions = ReturnType<typeof createActions>;
