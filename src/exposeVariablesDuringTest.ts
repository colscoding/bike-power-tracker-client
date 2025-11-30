import type { ConnectionsState } from './types/index.js';
import type { MeasurementsState } from './MeasurementsState.js';
import type { Store } from './store/createStore.js';
import type { AppStoreState } from './store/state.js';
import type { Actions } from './store/actions.js';

interface ExposeParams {
    measurementsState: MeasurementsState;
    connectionsState: ConnectionsState;
    store?: Store<AppStoreState>;
    actions?: Actions;
}

// Extend Window interface for testing purposes
declare global {
    interface Window {
        bike: MeasurementsState;
        connectionsState: ConnectionsState;
        store?: Store<AppStoreState>;
        actions?: Actions;
    }
}

export function exposeVariablesDuringTest({
    measurementsState,
    connectionsState,
    store,
    actions,
}: ExposeParams): void {
    // Always expose in non-production builds for testing purposes
    if (typeof window !== 'undefined') {
        window.bike = measurementsState;
        window.connectionsState = connectionsState;
        if (store) window.store = store;
        if (actions) window.actions = actions;
    }
}
