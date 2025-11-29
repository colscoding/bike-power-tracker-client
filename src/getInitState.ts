import { MeasurementsState } from './MeasurementsState.js';
import type { AppState } from './types/index.js';

export const getInitState = (): AppState => {
    return {
        measurementsState: new MeasurementsState(),
        connectionsState: {
            power: {
                isConnected: false,
                disconnect: null,
            },
            heartrate: {
                isConnected: false,
                disconnect: null,
            },
            cadence: {
                isConnected: false,
                disconnect: null,
            },
        },
        timeState: {
            running: false,
            startTime: null,
            endTime: null,
        },
    };
};
