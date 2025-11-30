const DB_NAME = 'BikeTrackerDB';
const DB_VERSION = 1;

export const WORKOUTS_STORE = 'workouts';
export const SETTINGS_STORE = 'settings';

let dbInstance: IDBDatabase | null = null;

/**
 * Open the IndexedDB database, creating stores if needed
 */
export const openDatabase = (): Promise<IDBDatabase> => {
    // Return cached instance if available
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Workouts store with indexes
            if (!db.objectStoreNames.contains(WORKOUTS_STORE)) {
                const workoutStore = db.createObjectStore(WORKOUTS_STORE, { keyPath: 'id' });
                workoutStore.createIndex('status', 'status', { unique: false });
                workoutStore.createIndex('startTime', 'startTime', { unique: false });
            }

            // Settings store
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
            }
        };
    });
};

/**
 * Close the database connection
 */
export const closeDatabase = (): void => {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
};

/**
 * Get the database instance, opening it if needed
 */
export const getDatabase = async (): Promise<IDBDatabase> => {
    if (!dbInstance) {
        return openDatabase();
    }
    return dbInstance;
};
