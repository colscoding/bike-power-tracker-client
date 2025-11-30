import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createStore } from './createStore.js';
import { createInitialState } from './state.js';
import { createActions } from './actions.js';
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
    });
});
