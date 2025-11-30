import type { NotificationType } from '../types/index.js';

// Connection status for Bluetooth devices
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// Individual connection state
export interface DeviceConnection {
    status: ConnectionStatus;
    disconnect: (() => void) | null;
}

// All connections
export interface ConnectionsState {
    power: DeviceConnection;
    heartrate: DeviceConnection;
    cadence: DeviceConnection;
}

// Workout timer state
export interface WorkoutState {
    isRunning: boolean;
    startTime: number | null;
    endTime: number | null;
    elapsedSeconds: number;
}

// Current sensor readings (latest values)
export interface ReadingsState {
    power: number | null;
    heartrate: number | null;
    cadence: number | null;
}

// UI state
export interface UIState {
    menuOpen: boolean;
    notification: { message: string; type: NotificationType } | null;
}

// Complete application state shape
export interface AppStoreState {
    workout: WorkoutState;
    connections: ConnectionsState;
    readings: ReadingsState;
    ui: UIState;
}

// Initial state factory
export function createInitialState(): AppStoreState {
    return {
        workout: {
            isRunning: false,
            startTime: null,
            endTime: null,
            elapsedSeconds: 0,
        },
        connections: {
            power: { status: 'disconnected', disconnect: null },
            heartrate: { status: 'disconnected', disconnect: null },
            cadence: { status: 'disconnected', disconnect: null },
        },
        readings: {
            power: null,
            heartrate: null,
            cadence: null,
        },
        ui: {
            menuOpen: false,
            notification: null,
        },
    };
}

export const initialState = createInitialState();
