import { createStore } from './createStore.js';
import { initialState } from './state.js';
import { createActions } from './actions.js';

import type { AppStoreState } from './state.js';
import type { Store } from './createStore.js';
import type { Actions } from './actions.js';

// Export types
export type { AppStoreState, ConnectionStatus, DeviceConnection } from './state.js';
export type { Store, Listener, Selector, Updater } from './createStore.js';
export type { Actions } from './actions.js';

// Export selectors
export * from './selectors.js';

// Create the singleton store instance
export const store: Store<AppStoreState> = createStore(initialState);

// Create bound actions
export const actions: Actions = createActions(store);

// Re-export utilities
export { createStore } from './createStore.js';
export { createInitialState } from './state.js';
export { createActions } from './actions.js';
