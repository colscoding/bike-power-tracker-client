/**
 * Initialize service worker update notification
 */
export function initUpdatePrompt(): void {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // New service worker activated
            showUpdateNotification();
        });
    }
}

function showUpdateNotification(): void {
    // Don't show if already showing
    if (document.querySelector('.update-notification')) {
        return;
    }

    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <span>🎉 New version available!</span>
        <button id="update-now">Update Now</button>
        <button id="update-later">Later</button>
    `;

    document.body.appendChild(notification);

    document.getElementById('update-now')?.addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('update-later')?.addEventListener('click', () => {
        notification.remove();
    });
}
