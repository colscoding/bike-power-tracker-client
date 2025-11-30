import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createStore } from './createStore.js';
import { createInitialState } from './state.js';
import { createActions } from './actions.js';
import {
    selectIsRunning,
    selectStartTime,
    selectEndTime,
    selectElapsedSeconds,
    selectWorkoutState,
    selectConnectionStatus,
    selectIsConnected,
    selectAnyConnected,
    selectAllConnections,
    selectReading,
    selectAllReadings,
    selectMenuOpen,
    selectNotification,
    selectWorkoutSummary,
} from './selectors.js';
import type { AppStoreState } from './state.js';
import type { Store } from './createStore.js';

describe('createStore', () => {
    it('should initialize with provided state', () => {
        const store = createStore({ count: 0 });
        assert.deepStrictEqual(store.getState(), { count: 0 });
    });

    it('should update state with object', () => {
        const store = createStore({ count: 0, name: 'test' });
        store.setState({ count: 1 });
        assert.deepStrictEqual(store.getState(), { count: 1, name: 'test' });
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

    it('should notify multiple subscribers', () => {
        const store = createStore({ count: 0 });
        const listener1 = mock.fn();
        const listener2 = mock.fn();

        store.subscribe(listener1);
        store.subscribe(listener2);
        store.setState({ count: 1 });

        assert.strictEqual(listener1.mock.calls.length, 1);
        assert.strictEqual(listener2.mock.calls.length, 1);
    });

    it('should preserve state immutability', () => {
        const store = createStore({ items: [1, 2, 3] });
        const originalState = store.getState();
        store.setState({ items: [4, 5, 6] });

        assert.deepStrictEqual(originalState.items, [1, 2, 3]);
        assert.deepStrictEqual(store.getState().items, [4, 5, 6]);
    });
});

describe('AppStore actions', () => {
    let store: Store<AppStoreState>;
    let actions: ReturnType<typeof createActions>;

    beforeEach(() => {
        store = createStore(createInitialState());
        actions = createActions(store);
    });

    describe('workout actions', () => {
        it('should start workout', () => {
            const beforeStart = Date.now();
            actions.startWorkout();
            const afterStart = Date.now();

            const state = store.getState();
            assert.strictEqual(state.workout.isRunning, true);
            assert.ok(state.workout.startTime! >= beforeStart);
            assert.ok(state.workout.startTime! <= afterStart);
            assert.strictEqual(state.workout.endTime, null);
        });

        it('should stop workout', () => {
            actions.startWorkout();
            const beforeStop = Date.now();
            actions.stopWorkout();
            const afterStop = Date.now();

            const state = store.getState();
            assert.strictEqual(state.workout.isRunning, false);
            assert.ok(state.workout.endTime! >= beforeStop);
            assert.ok(state.workout.endTime! <= afterStop);
        });

        it('should resume workout and adjust start time', () => {
            // Start workout
            actions.startWorkout();
            const originalStartTime = store.getState().workout.startTime!;

            // Stop workout (simulates pause)
            actions.stopWorkout();

            // Resume workout - the key is that endTime exists before resuming
            const endTimeBeforeResume = store.getState().workout.endTime;
            assert.ok(endTimeBeforeResume !== null, 'endTime should be set after stopping');

            actions.startWorkout();

            const state = store.getState();
            assert.strictEqual(state.workout.isRunning, true);
            assert.strictEqual(state.workout.endTime, null);
            // Start time should be adjusted forward to account for pause duration
            // The adjustment should make startTime >= originalStartTime
            assert.ok(
                state.workout.startTime! >= originalStartTime,
                `Adjusted start time ${state.workout.startTime} should be >= original ${originalStartTime}`
            );
        });

        it('should reset workout', () => {
            actions.startWorkout();
            actions.updateReading('power', 200);
            actions.resetWorkout();

            const state = store.getState();
            assert.strictEqual(state.workout.isRunning, false);
            assert.strictEqual(state.workout.startTime, null);
            assert.strictEqual(state.readings.power, null);
        });

        it('should update elapsed time', () => {
            actions.updateElapsedTime(120);
            assert.strictEqual(store.getState().workout.elapsedSeconds, 120);
        });

        it('should restore workout state', () => {
            const startTime = Date.now() - 3600000; // 1 hour ago
            const endTime = Date.now() - 1800000; // 30 min ago
            actions.restoreWorkout(startTime, endTime);

            const state = store.getState();
            assert.strictEqual(state.workout.isRunning, false);
            assert.strictEqual(state.workout.startTime, startTime);
            assert.strictEqual(state.workout.endTime, endTime);
        });
    });

    describe('connection actions', () => {
        it('should set connection status', () => {
            actions.setConnectionStatus('power', 'connecting');
            assert.strictEqual(store.getState().connections.power.status, 'connecting');
        });

        it('should set connected with disconnect function', () => {
            const disconnectFn = mock.fn();
            actions.setConnected('heartrate', disconnectFn);

            const state = store.getState();
            assert.strictEqual(state.connections.heartrate.status, 'connected');
            assert.strictEqual(state.connections.heartrate.disconnect, disconnectFn);
        });

        it('should disconnect and call disconnect function', () => {
            const disconnectFn = mock.fn();
            actions.setConnected('cadence', disconnectFn);
            actions.updateReading('cadence', 85);

            actions.disconnect('cadence');

            assert.strictEqual(disconnectFn.mock.calls.length, 1);
            assert.strictEqual(store.getState().connections.cadence.status, 'disconnected');
            assert.strictEqual(store.getState().connections.cadence.disconnect, null);
            assert.strictEqual(store.getState().readings.cadence, null);
        });

        it('should handle disconnect when no disconnect function exists', () => {
            // Set connecting status without a disconnect function
            actions.setConnectionStatus('power', 'connecting');

            // Should not throw when disconnecting
            actions.disconnect('power');

            assert.strictEqual(store.getState().connections.power.status, 'disconnected');
        });

        it('should transition through connection states', () => {
            // Start disconnected
            assert.strictEqual(store.getState().connections.power.status, 'disconnected');

            // Transition to connecting
            actions.setConnectionStatus('power', 'connecting');
            assert.strictEqual(store.getState().connections.power.status, 'connecting');

            // Transition to connected
            actions.setConnected('power', () => { });
            assert.strictEqual(store.getState().connections.power.status, 'connected');

            // Transition back to disconnected
            actions.disconnect('power');
            assert.strictEqual(store.getState().connections.power.status, 'disconnected');
        });
    });

    describe('reading actions', () => {
        it('should update reading', () => {
            actions.updateReading('power', 250);
            assert.strictEqual(store.getState().readings.power, 250);
        });

        it('should clear reading', () => {
            actions.updateReading('heartrate', 150);
            actions.clearReading('heartrate');
            assert.strictEqual(store.getState().readings.heartrate, null);
        });

        it('should update multiple readings independently', () => {
            actions.updateReading('power', 250);
            actions.updateReading('heartrate', 145);
            actions.updateReading('cadence', 85);

            const readings = store.getState().readings;
            assert.strictEqual(readings.power, 250);
            assert.strictEqual(readings.heartrate, 145);
            assert.strictEqual(readings.cadence, 85);
        });

        it('should overwrite previous reading value', () => {
            actions.updateReading('power', 200);
            actions.updateReading('power', 300);
            assert.strictEqual(store.getState().readings.power, 300);
        });
    });

    describe('UI actions', () => {
        it('should toggle menu', () => {
            assert.strictEqual(store.getState().ui.menuOpen, false);
            actions.toggleMenu();
            assert.strictEqual(store.getState().ui.menuOpen, true);
            actions.toggleMenu();
            assert.strictEqual(store.getState().ui.menuOpen, false);
        });

        it('should close menu', () => {
            actions.toggleMenu(); // open
            actions.closeMenu();
            assert.strictEqual(store.getState().ui.menuOpen, false);
        });

        it('should show notification', () => {
            actions.showNotification('Test message', 'success');
            const notification = store.getState().ui.notification;
            assert.deepStrictEqual(notification, { message: 'Test message', type: 'success' });
        });

        it('should clear notification', () => {
            actions.showNotification('Test', 'info');
            actions.clearNotification();
            assert.strictEqual(store.getState().ui.notification, null);
        });

        it('should show notification with default type', () => {
            actions.showNotification('Default type message');
            const notification = store.getState().ui.notification;
            assert.deepStrictEqual(notification, { message: 'Default type message', type: 'info' });
        });

        it('should overwrite previous notification', () => {
            actions.showNotification('First', 'info');
            actions.showNotification('Second', 'error');
            const notification = store.getState().ui.notification;
            assert.deepStrictEqual(notification, { message: 'Second', type: 'error' });
        });

        it('closeMenu should be idempotent', () => {
            // Close already closed menu
            actions.closeMenu();
            assert.strictEqual(store.getState().ui.menuOpen, false);

            // Open and close twice
            actions.toggleMenu();
            actions.closeMenu();
            actions.closeMenu();
            assert.strictEqual(store.getState().ui.menuOpen, false);
        });
    });
});

describe('Selectors', () => {
    let store: Store<AppStoreState>;
    let actions: ReturnType<typeof createActions>;

    beforeEach(() => {
        store = createStore(createInitialState());
        actions = createActions(store);
    });

    describe('workout selectors', () => {
        it('selectIsRunning should return workout running state', () => {
            assert.strictEqual(selectIsRunning(store.getState()), false);
            actions.startWorkout();
            assert.strictEqual(selectIsRunning(store.getState()), true);
        });

        it('selectStartTime should return workout start time', () => {
            assert.strictEqual(selectStartTime(store.getState()), null);
            actions.startWorkout();
            assert.ok(selectStartTime(store.getState()) !== null);
        });

        it('selectEndTime should return workout end time', () => {
            actions.startWorkout();
            assert.strictEqual(selectEndTime(store.getState()), null);
            actions.stopWorkout();
            assert.ok(selectEndTime(store.getState()) !== null);
        });

        it('selectElapsedSeconds should return elapsed seconds', () => {
            assert.strictEqual(selectElapsedSeconds(store.getState()), 0);
            actions.updateElapsedTime(300);
            assert.strictEqual(selectElapsedSeconds(store.getState()), 300);
        });

        it('selectWorkoutState should return entire workout object', () => {
            const workout = selectWorkoutState(store.getState());
            assert.strictEqual(workout.isRunning, false);
            assert.strictEqual(workout.startTime, null);
            assert.strictEqual(workout.endTime, null);
            assert.strictEqual(workout.elapsedSeconds, 0);
        });
    });

    describe('connection selectors', () => {
        it('selectConnectionStatus should return status for given type', () => {
            assert.strictEqual(selectConnectionStatus('power')(store.getState()), 'disconnected');
            actions.setConnectionStatus('power', 'connecting');
            assert.strictEqual(selectConnectionStatus('power')(store.getState()), 'connecting');
        });

        it('selectIsConnected should return true when connected', () => {
            assert.strictEqual(selectIsConnected('heartrate')(store.getState()), false);
            actions.setConnected('heartrate', () => { });
            assert.strictEqual(selectIsConnected('heartrate')(store.getState()), true);
        });

        it('selectAnyConnected should return true if any sensor connected', () => {
            assert.strictEqual(selectAnyConnected(store.getState()), false);
            actions.setConnected('cadence', () => { });
            assert.strictEqual(selectAnyConnected(store.getState()), true);
        });

        it('selectAllConnections should return all connection states', () => {
            const connections = selectAllConnections(store.getState());
            assert.ok('power' in connections);
            assert.ok('heartrate' in connections);
            assert.ok('cadence' in connections);
        });
    });

    describe('reading selectors', () => {
        it('selectReading should return reading for given type', () => {
            assert.strictEqual(selectReading('power')(store.getState()), null);
            actions.updateReading('power', 275);
            assert.strictEqual(selectReading('power')(store.getState()), 275);
        });

        it('selectAllReadings should return all readings', () => {
            actions.updateReading('power', 250);
            actions.updateReading('heartrate', 145);
            const readings = selectAllReadings(store.getState());
            assert.strictEqual(readings.power, 250);
            assert.strictEqual(readings.heartrate, 145);
            assert.strictEqual(readings.cadence, null);
        });
    });

    describe('UI selectors', () => {
        it('selectMenuOpen should return menu state', () => {
            assert.strictEqual(selectMenuOpen(store.getState()), false);
            actions.toggleMenu();
            assert.strictEqual(selectMenuOpen(store.getState()), true);
        });

        it('selectNotification should return current notification', () => {
            assert.strictEqual(selectNotification(store.getState()), null);
            actions.showNotification('Test', 'error');
            const notification = selectNotification(store.getState());
            assert.deepStrictEqual(notification, { message: 'Test', type: 'error' });
        });
    });

    describe('derived selectors', () => {
        it('selectWorkoutSummary should return workout summary object', () => {
            const summary = selectWorkoutSummary(store.getState());
            assert.strictEqual(summary.isRunning, false);
            assert.strictEqual(summary.duration, 0);
            assert.strictEqual(summary.hasData, false);
            assert.deepStrictEqual(summary.connectedSensors, []);
        });

        it('selectWorkoutSummary should reflect running state', () => {
            actions.startWorkout();
            actions.updateElapsedTime(120);
            const summary = selectWorkoutSummary(store.getState());
            assert.strictEqual(summary.isRunning, true);
            assert.strictEqual(summary.duration, 120);
        });

        it('selectWorkoutSummary should reflect hasData', () => {
            actions.updateReading('power', 200);
            const summary = selectWorkoutSummary(store.getState());
            assert.strictEqual(summary.hasData, true);
        });

        it('selectWorkoutSummary should list connected sensors', () => {
            actions.setConnected('power', () => { });
            actions.setConnected('heartrate', () => { });
            const summary = selectWorkoutSummary(store.getState());
            assert.ok(summary.connectedSensors.includes('power'));
            assert.ok(summary.connectedSensors.includes('heartrate'));
            assert.strictEqual(summary.connectedSensors.length, 2);
        });
    });
});
