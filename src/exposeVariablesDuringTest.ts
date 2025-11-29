import type { ConnectionsState } from './types/index.js';
import type { MeasurementsState } from './MeasurementsState.js';

interface ExposeParams {
    measurementsState: MeasurementsState;
    connectionsState: ConnectionsState;
}

// Extend Window interface for testing purposes
declare global {
    interface Window {
        bike: MeasurementsState;
        connectionsState: ConnectionsState;
    }
}

export function exposeVariablesDuringTest({
    measurementsState,
    connectionsState,
}: ExposeParams): void {
    // Always expose in non-production builds for testing purposes
    if (typeof window !== 'undefined') {
        window.bike = measurementsState;
        window.connectionsState = connectionsState;
    }
}
