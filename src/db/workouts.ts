import { getDatabase, WORKOUTS_STORE } from './index.js';
import type { Workout } from '../types/index.js';

/**
 * Save or update a workout in the database
 */
export const saveWorkout = async (workout: Workout): Promise<void> => {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(WORKOUTS_STORE, 'readwrite');
        const store = tx.objectStore(WORKOUTS_STORE);

        workout.updatedAt = Date.now();
        const request = store.put(workout);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get a workout by ID
 */
export const getWorkout = async (id: string): Promise<Workout | null> => {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(WORKOUTS_STORE, 'readonly');
        const store = tx.objectStore(WORKOUTS_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get the currently active workout (if any)
 */
export const getActiveWorkout = async (): Promise<Workout | null> => {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(WORKOUTS_STORE, 'readonly');
        const store = tx.objectStore(WORKOUTS_STORE);
        const index = store.index('status');
        const request = index.get('active');

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get completed workouts, ordered by startTime descending
 */
export const getWorkoutHistory = async (limit = 50): Promise<Workout[]> => {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(WORKOUTS_STORE, 'readonly');
        const store = tx.objectStore(WORKOUTS_STORE);
        const index = store.index('startTime');

        const workouts: Workout[] = [];
        const request = index.openCursor(null, 'prev'); // Newest first

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor && workouts.length < limit) {
                if (cursor.value.status === 'completed') {
                    workouts.push(cursor.value);
                }
                cursor.continue();
            } else {
                resolve(workouts);
            }
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete a workout by ID
 */
export const deleteWorkout = async (id: string): Promise<void> => {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(WORKOUTS_STORE, 'readwrite');
        const store = tx.objectStore(WORKOUTS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Clean up old workouts, keeping only the most recent ones
 */
export const cleanupOldWorkouts = async (keepCount = 100): Promise<number> => {
    const allWorkouts = await getWorkoutHistory(999999);

    if (allWorkouts.length <= keepCount) {
        return 0;
    }

    const toDelete = allWorkouts.slice(keepCount);
    for (const workout of toDelete) {
        await deleteWorkout(workout.id);
    }

    return toDelete.length;
};
