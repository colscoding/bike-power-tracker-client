export const handleWakeLock = (): void => {
    // Keep screen awake during workout
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async (): Promise<void> => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen wake lock activated');

                // Re-request wake lock if page becomes visible again
                wakeLock.addEventListener('release', () => {
                    console.log('Screen wake lock released');
                });
            }
        } catch (err) {
            console.error('Wake lock request failed:', err);
        }
    };
    // Request wake lock when page loads
    if (document.visibilityState === 'visible') {
        requestWakeLock();
    }
    // Re-request wake lock when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }
    });
};
