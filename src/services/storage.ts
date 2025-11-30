/**
 * Request persistent storage from the browser
 * This prevents the browser from automatically clearing the app's data
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persisted();

            if (!isPersisted) {
                const result = await navigator.storage.persist();

                if (result) {
                    console.log('Storage will not be cleared except by explicit user action');
                } else {
                    console.log('Storage may be cleared by the browser under storage pressure');
                }

                return result;
            }

            return true;
        } catch (error) {
            console.error('Failed to request persistent storage:', error);
            return false;
        }
    }

    return false;
}

/**
 * Check if storage is already persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persisted) {
        try {
            return await navigator.storage.persisted();
        } catch {
            return false;
        }
    }
    return false;
}

/**
 * Initialize storage service - request persistent storage
 */
export async function initStorage(): Promise<void> {
    await requestPersistentStorage();
}
