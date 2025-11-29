// Measurement types
export interface Measurement {
    timestamp: number;
    value: number;
}

export type MetricType = 'power' | 'heartrate' | 'cadence';

export interface MergedDataPoint {
    timestamp: number;
    power: number | null;
    heartrate: number | null;
    cadence: number | null;
}

// Connection types
export interface ConnectionState {
    isConnected: boolean;
    disconnect: (() => void) | null;
}

export interface ConnectionsState {
    power: ConnectionState;
    heartrate: ConnectionState;
    cadence: ConnectionState;
}

// Time state
export interface TimeState {
    running: boolean;
    startTime: number | null;
    endTime: number | null;
}

// Bluetooth sensor connection result
export interface SensorConnection {
    disconnect: () => void;
    addListener: (callback: (entry: Measurement) => void) => void;
}

// Settings
export interface AppSettings {
    power: boolean;
    cadence: boolean;
    heartrate: boolean;
}

// App state
export interface AppState {
    measurementsState: import('../MeasurementsState').MeasurementsState;
    connectionsState: ConnectionsState;
    timeState: TimeState;
}

// Element types
export interface MetricElements {
    display: HTMLElement | null;
    connect: HTMLElement | null;
}

export interface Elements {
    power: MetricElements;
    heartrate: MetricElements;
    cadence: MetricElements;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'error';
