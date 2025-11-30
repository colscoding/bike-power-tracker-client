const SYNC_QUEUE_KEY = 'pending-exports';

interface PendingExport {
    id: number;
    data: string;
    format: string;
    filename: string;
    createdAt: string;
}

/**
 * Queue an export for later processing when offline
 */
export async function queueExport(data: string, format: string, filename: string): Promise<void> {
    const queue = getPendingExports();

    queue.push({
        id: Date.now(),
        data,
        format,
        filename,
        createdAt: new Date().toISOString(),
    });

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            // @ts-expect-error - sync is not in standard TypeScript types
            await registration.sync?.register('export-queue');
        } catch (error) {
            console.warn('Background sync registration failed:', error);
        }
    }
}

/**
 * Get all pending exports from the queue
 */
export function getPendingExports(): PendingExport[] {
    try {
        return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Remove an export from the queue by ID
 */
export function clearExport(id: number): void {
    const queue = getPendingExports().filter((item) => item.id !== id);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Check if there are pending exports
 */
export function hasPendingExports(): boolean {
    return getPendingExports().length > 0;
}

/**
 * Process a pending export by downloading it
 */
function processExport(item: PendingExport): void {
    const blob = new Blob([item.data], { type: getMimeType(item.format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getMimeType(format: string): string {
    switch (format) {
        case 'json':
            return 'application/json';
        case 'csv':
            return 'text/csv';
        case 'tcx':
            return 'application/vnd.garmin.tcx+xml';
        default:
            return 'text/plain';
    }
}

/**
 * Initialize background sync event listener
 */
export function initBackgroundSync(): void {
    // Process queue when coming back online
    window.addEventListener('app:online', () => {
        processPendingExports();
    });

    // Also check on init if we're online and have pending exports
    if (navigator.onLine && hasPendingExports()) {
        processPendingExports();
    }
}

/**
 * Process all pending exports
 */
function processPendingExports(): void {
    const pending = getPendingExports();

    for (const item of pending) {
        try {
            processExport(item);
            clearExport(item.id);
        } catch (error) {
            console.error('Failed to process export:', error);
        }
    }
}
