# Plan: State Management Refactor

## Overview

Introduce a structured state management pattern to improve code organization, testability, and enable features like undo/redo.

## Priority: Medium

## Effort: Medium (1-2 weeks)

## Type: Code Architecture

---

## Motivation

1. **Current State is Scattered**: State lives in DOM, closures, and module variables
2. **Hard to Debug**: No single source of truth
3. **Difficult to Test**: State mutations are spread throughout
4. **Feature Enablement**: Proper state management enables undo/redo, time travel debugging
5. **Reactive UI**: Changes automatically propagate to UI

---

## Current State Locations

```
- elements.js      → DOM element references
- MeasurementsState → Workout measurements (well organized ✓)
- main.js          → isRunning, isPaused, startTime (scattered)
- connect-*.js     → Connection state (in closures)
- DOM              → Display values (implicit state)
```

---

## Proposed Architecture

### Simple Observable Store

```javascript
// src/store/createStore.js

export function createStore(initialState) {
    let state = structuredClone(initialState);
    const listeners = new Set();

    return {
        getState: () => state,

        setState: (updater) => {
            const prevState = state;
            state =
                typeof updater === 'function'
                    ? { ...state, ...updater(state) }
                    : { ...state, ...updater };

            listeners.forEach((listener) => listener(state, prevState));
        },

        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        // Select specific slice of state
        select: (selector) => selector(state),
    };
}
```

### Application State Shape

```javascript
// src/store/state.js

export const initialState = {
    // Workout state
    workout: {
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedTime: 0,
        elapsedSeconds: 0,
    },

    // Bluetooth connections
    connections: {
        power: { status: 'disconnected', device: null, characteristic: null },
        heartrate: { status: 'disconnected', device: null, characteristic: null },
        cadence: { status: 'disconnected', device: null, characteristic: null },
    },

    // Current sensor readings
    readings: {
        power: null,
        heartrate: null,
        cadence: null,
    },

    // UI state
    ui: {
        menuOpen: false,
        settingsOpen: false,
        exportModalOpen: false,
        notification: null,
    },

    // User settings
    settings: {
        wakeLockEnabled: true,
        autoPauseEnabled: false,
        measurementInterval: 1000,
    },
};
```

---

## Store Implementation

```javascript
// src/store/index.js

import { createStore } from './createStore.js';
import { initialState } from './state.js';

export const store = createStore(initialState);

// Action creators for common operations
export const actions = {
    // Workout actions
    startWorkout: () =>
        store.setState((state) => ({
            workout: {
                ...state.workout,
                isRunning: true,
                isPaused: false,
                startTime: Date.now(),
            },
        })),

    pauseWorkout: () =>
        store.setState((state) => ({
            workout: {
                ...state.workout,
                isPaused: true,
                pausedTime: Date.now(),
            },
        })),

    resumeWorkout: () =>
        store.setState((state) => ({
            workout: {
                ...state.workout,
                isPaused: false,
                pausedTime: 0,
            },
        })),

    stopWorkout: () =>
        store.setState({
            workout: initialState.workout,
        }),

    updateElapsedTime: (seconds) =>
        store.setState((state) => ({
            workout: { ...state.workout, elapsedSeconds: seconds },
        })),

    // Connection actions
    setConnectionStatus: (type, status) =>
        store.setState((state) => ({
            connections: {
                ...state.connections,
                [type]: { ...state.connections[type], status },
            },
        })),

    setDevice: (type, device, characteristic) =>
        store.setState((state) => ({
            connections: {
                ...state.connections,
                [type]: { status: 'connected', device, characteristic },
            },
        })),

    disconnect: (type) =>
        store.setState((state) => ({
            connections: {
                ...state.connections,
                [type]: { status: 'disconnected', device: null, characteristic: null },
            },
            readings: {
                ...state.readings,
                [type]: null,
            },
        })),

    // Reading actions
    updateReading: (type, value) =>
        store.setState((state) => ({
            readings: { ...state.readings, [type]: value },
        })),

    // UI actions
    toggleMenu: () =>
        store.setState((state) => ({
            ui: { ...state.ui, menuOpen: !state.ui.menuOpen },
        })),

    closeMenu: () =>
        store.setState((state) => ({
            ui: { ...state.ui, menuOpen: false },
        })),

    showNotification: (message, type = 'info') =>
        store.setState((state) => ({
            ui: { ...state.ui, notification: { message, type } },
        })),

    clearNotification: () =>
        store.setState((state) => ({
            ui: { ...state.ui, notification: null },
        })),

    // Settings actions
    updateSettings: (settings) =>
        store.setState((state) => ({
            settings: { ...state.settings, ...settings },
        })),
};
```

---

## Selectors

```javascript
// src/store/selectors.js

// Workout selectors
export const selectIsRunning = (state) => state.workout.isRunning;
export const selectIsPaused = (state) => state.workout.isPaused;
export const selectElapsedSeconds = (state) => state.workout.elapsedSeconds;

// Connection selectors
export const selectConnectionStatus = (type) => (state) => state.connections[type].status;

export const selectIsConnected = (type) => (state) =>
    state.connections[type].status === 'connected';

export const selectAnyConnected = (state) =>
    Object.values(state.connections).some((c) => c.status === 'connected');

// Reading selectors
export const selectReading = (type) => (state) => state.readings[type];
export const selectAllReadings = (state) => state.readings;

// Derived selectors
export const selectWorkoutSummary = (state) => ({
    duration: state.workout.elapsedSeconds,
    hasData: Object.values(state.readings).some((r) => r !== null),
    connectedSensors: Object.entries(state.connections)
        .filter(([_, c]) => c.status === 'connected')
        .map(([type]) => type),
});
```

---

## UI Bindings

```javascript
// src/store/bindings.js

import { store } from './index.js';
import { elements } from '../elements.js';

// Bind state to UI elements
export function setupBindings() {
    store.subscribe((state, prevState) => {
        // Update timer display
        if (state.workout.elapsedSeconds !== prevState.workout.elapsedSeconds) {
            elements.time.textContent = formatTime(state.workout.elapsedSeconds);
        }

        // Update start/stop button
        if (
            state.workout.isRunning !== prevState.workout.isRunning ||
            state.workout.isPaused !== prevState.workout.isPaused
        ) {
            elements.startStopButton.textContent = state.workout.isRunning
                ? state.workout.isPaused
                    ? '▶️'
                    : '⏹️'
                : '▶️';
        }

        // Update metric displays
        ['power', 'heartrate', 'cadence'].forEach((type) => {
            if (state.readings[type] !== prevState.readings[type]) {
                const el = elements[type];
                el.textContent = state.readings[type] ?? '--';
                el.parentElement.classList.toggle('paused', state.workout.isPaused);
            }
        });

        // Update connection buttons
        Object.entries(state.connections).forEach(([type, conn]) => {
            if (conn.status !== prevState.connections[type].status) {
                updateConnectionButton(type, conn.status);
            }
        });
    });
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateConnectionButton(type, status) {
    const button = document.querySelector(`[data-connect="${type}"]`);
    if (button) {
        button.classList.toggle('connected', status === 'connected');
        button.classList.toggle('connecting', status === 'connecting');
    }
}
```

---

## Middleware Support

```javascript
// src/store/middleware.js

// Logger middleware
export function createLoggerMiddleware() {
    return (store) => (next) => (action) => {
        console.group(action.type);
        console.log('prev state', store.getState());
        console.log('action', action);
        const result = next(action);
        console.log('next state', store.getState());
        console.groupEnd();
        return result;
    };
}

// Persistence middleware
export function createPersistMiddleware(key) {
    return (store) => (next) => (action) => {
        const result = next(action);
        const state = store.getState();

        // Only persist certain slices
        const toPersist = {
            settings: state.settings,
        };

        localStorage.setItem(key, JSON.stringify(toPersist));
        return result;
    };
}

// Apply middleware
export function applyMiddleware(store, ...middlewares) {
    middlewares.forEach((middleware) => {
        const original = store.setState;
        store.setState = (updater) => {
            middleware(store)(() => {})(updater);
            original.call(store, updater);
        };
    });
}
```

---

## Undo/Redo Support

```javascript
// src/store/history.js

export function withHistory(store, maxHistory = 50) {
    const history = [];
    let currentIndex = -1;

    // Subscribe to store changes
    store.subscribe((state, prevState) => {
        // Don't record if we're undoing/redoing
        if (store._isTimeTravel) return;

        // Remove any future states if we branched
        if (currentIndex < history.length - 1) {
            history.splice(currentIndex + 1);
        }

        // Add new state
        history.push(structuredClone(state));
        currentIndex = history.length - 1;

        // Limit history size
        if (history.length > maxHistory) {
            history.shift();
            currentIndex--;
        }
    });

    return {
        undo: () => {
            if (currentIndex > 0) {
                currentIndex--;
                store._isTimeTravel = true;
                store.setState(history[currentIndex]);
                store._isTimeTravel = false;
            }
        },

        redo: () => {
            if (currentIndex < history.length - 1) {
                currentIndex++;
                store._isTimeTravel = true;
                store.setState(history[currentIndex]);
                store._isTimeTravel = false;
            }
        },

        canUndo: () => currentIndex > 0,
        canRedo: () => currentIndex < history.length - 1,
    };
}
```

---

## Testing the Store

```javascript
// src/store/store.test.js

import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createStore } from './createStore.js';

describe('createStore', () => {
    it('should initialize with provided state', () => {
        const store = createStore({ count: 0 });
        assert.deepStrictEqual(store.getState(), { count: 0 });
    });

    it('should update state with object', () => {
        const store = createStore({ count: 0 });
        store.setState({ count: 1 });
        assert.deepStrictEqual(store.getState(), { count: 1 });
    });

    it('should update state with function', () => {
        const store = createStore({ count: 0 });
        store.setState((state) => ({ count: state.count + 1 }));
        assert.deepStrictEqual(store.getState(), { count: 1 });
    });

    it('should notify subscribers on state change', () => {
        const store = createStore({ count: 0 });
        const listener = mock.fn();

        store.subscribe(listener);
        store.setState({ count: 1 });

        assert.strictEqual(listener.mock.calls.length, 1);
        assert.deepStrictEqual(listener.mock.calls[0].arguments[0], { count: 1 });
        assert.deepStrictEqual(listener.mock.calls[0].arguments[1], { count: 0 });
    });

    it('should allow unsubscribing', () => {
        const store = createStore({ count: 0 });
        const listener = mock.fn();

        const unsubscribe = store.subscribe(listener);
        unsubscribe();
        store.setState({ count: 1 });

        assert.strictEqual(listener.mock.calls.length, 0);
    });

    it('should select state slice', () => {
        const store = createStore({ user: { name: 'Alice' }, count: 0 });
        const name = store.select((state) => state.user.name);
        assert.strictEqual(name, 'Alice');
    });
});
```

---

## Migration Path

### Phase 1: Add Store Alongside Existing Code

1. Create store infrastructure
2. Add bindings that mirror current state
3. Both systems run in parallel

### Phase 2: Migrate One Feature at a Time

1. Start with simple state (UI toggles)
2. Move to readings state
3. Then connection state
4. Finally workout state

### Phase 3: Remove Old Code

1. Remove old state variables
2. Clean up old event handlers
3. Test thoroughly

---

## Integration with MeasurementsState

Keep `MeasurementsState` as is—it's well designed for its purpose. The store handles app state, while `MeasurementsState` handles measurement data:

```javascript
import { store, actions } from './store/index.js';
import { MeasurementsState } from './MeasurementsState.js';

const measurements = new MeasurementsState();

// Bridge: When store readings update, add to measurements
store.subscribe((state, prevState) => {
    if (store.select((s) => s.workout.isRunning) && !store.select((s) => s.workout.isPaused)) {
        // Add current readings to measurements
        measurements.add({
            power: state.readings.power,
            heartrate: state.readings.heartrate,
            cadence: state.readings.cadence,
        });
    }
});
```

---

## Benefits Summary

| Aspect         | Before           | After                 |
| -------------- | ---------------- | --------------------- |
| State Location | Scattered        | Centralized           |
| Updates        | Imperative       | Declarative           |
| Testing        | Difficult        | Easy (pure functions) |
| Debugging      | console.log      | Time travel, logs     |
| New Features   | Lots of plumbing | Just add to state     |
| Type Safety    | None             | Easy to add types     |

---

## Related Plans

- [TypeScript Migration](./01-typescript-migration.md) - Type the store
- [Component Library](./04-component-library.md) - Connect components to store
