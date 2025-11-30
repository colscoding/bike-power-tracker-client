export type Listener<T> = (state: T, prevState: T) => void;
export type Selector<T, R> = (state: T) => R;
export type Updater<T> = Partial<T> | ((state: T) => Partial<T>);

export interface Store<T> {
    getState: () => T;
    setState: (updater: Updater<T>) => void;
    subscribe: (listener: Listener<T>) => () => void;
    select: <R>(selector: Selector<T, R>) => R;
}

/**
 * Creates a simple observable store for state management.
 * Follows a minimal, focused approach suitable for this application.
 */
export function createStore<T extends object>(initialState: T): Store<T> {
    let state = structuredClone(initialState);
    const listeners = new Set<Listener<T>>();

    return {
        getState: () => state,

        setState: (updater: Updater<T>) => {
            const prevState = state;
            const updates = typeof updater === 'function' ? updater(state) : updater;
            state = { ...state, ...updates };
            listeners.forEach((listener) => listener(state, prevState));
        },

        subscribe: (listener: Listener<T>) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },

        select: <R>(selector: Selector<T, R>): R => selector(state),
    };
}
