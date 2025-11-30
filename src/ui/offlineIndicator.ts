import { showNotification } from './notifications.js';

/**
 * Initialize offline status indicator and event handling
 */
export function initOfflineIndicator(): void {
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.innerHTML = '📡 Offline';
    indicator.style.display = 'none';
    document.body.appendChild(indicator);

    function updateStatus(): void {
        const isOffline = !navigator.onLine;
        indicator.style.display = isOffline ? 'flex' : 'none';
        document.body.classList.toggle('is-offline', isOffline);
    }

    window.addEventListener('online', () => {
        updateStatus();
        showNotification('Back online! Syncing data...', 'success');
        // Trigger any pending syncs
        window.dispatchEvent(new CustomEvent('app:online'));
    });

    window.addEventListener('offline', () => {
        updateStatus();
        showNotification("You're offline. Data will be saved locally.", 'warning');
    });

    // Set initial status
    updateStatus();
}
