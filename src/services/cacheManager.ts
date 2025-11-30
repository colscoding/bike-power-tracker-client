import { showNotification } from '../ui/notifications.js';

interface StorageEstimate {
    used: number;
    quota: number;
    percent: number;
}

/**
 * Get the current cache/storage size usage
 */
export async function getCacheSize(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage ?? 0;
            const quota = estimate.quota ?? 1;
            return {
                used,
                quota,
                percent: Math.round((used / quota) * 100),
            };
        } catch (error) {
            console.error('Failed to get storage estimate:', error);
            return null;
        }
    }
    return null;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Clear old/unused caches
 */
export async function clearOldCaches(): Promise<void> {
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            const currentCaches = ['static-resources', 'images', 'fonts', 'google-fonts-cache'];

            for (const name of cacheNames) {
                if (!currentCaches.includes(name) && !name.startsWith('workbox-')) {
                    await caches.delete(name);
                    console.log(`Deleted old cache: ${name}`);
                }
            }
        } catch (error) {
            console.error('Failed to clear old caches:', error);
        }
    }
}

/**
 * Check storage quota and warn if getting full
 */
export async function checkStorageQuota(): Promise<void> {
    const size = await getCacheSize();

    if (size && size.percent > 80) {
        showNotification(
            `Storage is ${size.percent}% full. Consider clearing old data.`,
            'warning'
        );
    }
}

/**
 * Initialize cache manager - run periodic checks
 */
export function initCacheManager(): void {
    // Check storage quota on init
    checkStorageQuota();

    // Clear old caches on init
    clearOldCaches();

    // Check storage quota periodically (every 10 minutes)
    setInterval(checkStorageQuota, 10 * 60 * 1000);
}
