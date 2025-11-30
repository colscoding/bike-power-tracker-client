import { MeasurementsState } from './MeasurementsState.js';
import { store, actions } from './store/index.js';
import type { AppState, ConnectionsState, TimeState } from './types/index.js';

/**
 * Creates a reactive proxy for connectionsState that syncs with the store.
 * This provides backwards compatibility while using the new centralized store.
 */
function createConnectionsStateProxy(): ConnectionsState {
    type MetricTypeKey = 'power' | 'heartrate' | 'cadence';

    const createConnectionProxy = (type: MetricTypeKey) => {
        return {
            get isConnected(): boolean {
                return store.getState().connections[type].status === 'connected';
            },
            set isConnected(value: boolean) {
                if (value) {
                    actions.setConnectionStatus(type, 'connected');
                } else {
                    actions.setConnectionStatus(type, 'disconnected');
                }
            },
            get disconnect(): (() => void) | null {
                return store.getState().connections[type].disconnect;
            },
            set disconnect(fn: (() => void) | null) {
                if (fn) {
                    actions.setConnected(type, fn);
                } else {
                    actions.setConnectionStatus(type, 'disconnected');
                }
            },
        };
    };

    return {
        power: createConnectionProxy('power'),
        heartrate: createConnectionProxy('heartrate'),
        cadence: createConnectionProxy('cadence'),
    };
}

/**
 * Creates a reactive proxy for timeState that syncs with the store.
 */
function createTimeStateProxy(): TimeState {
    return {
        get running(): boolean {
            return store.getState().workout.isRunning;
        },
        set running(value: boolean) {
            if (value) {
                actions.startWorkout();
            } else {
                actions.stopWorkout();
            }
        },
        get startTime(): number | null {
            return store.getState().workout.startTime;
        },
        set startTime(value: number | null) {
            const state = store.getState();
            store.setState({
                workout: { ...state.workout, startTime: value },
            });
        },
        get endTime(): number | null {
            return store.getState().workout.endTime;
        },
        set endTime(value: number | null) {
            const state = store.getState();
            store.setState({
                workout: { ...state.workout, endTime: value },
            });
        },
    };
}

export const getInitState = (): AppState => {
    return {
        measurementsState: new MeasurementsState(),
        connectionsState: createConnectionsStateProxy(),
        timeState: createTimeStateProxy(),
    };
};
