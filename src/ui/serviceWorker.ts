// @ts-expect-error - vite-plugin-pwa virtual module
import { registerSW } from 'virtual:pwa-register';
import { getEnvDev, getEnvMode } from '../getEnv';

export const registerServiceWorker = (): void => {
    // Don't register service worker in development to avoid caching issues
    if (getEnvDev() === 'true') {
        console.log('Service Worker disabled in development mode');
        // Unregister existing service workers if any to ensure fresh content
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                    console.log('Unregistered existing service worker');
                }
            });
        }
        return;
    }

    // Register service worker for PWA functionality using vite-plugin-pwa
    if (getEnvMode() === 'test') {
        return;
    }

    const updateSW = registerSW({
        onNeedRefresh() {
            showUpdateNotification(updateSW);
        },
        onOfflineReady() {
            console.log('App ready to work offline');
        },
        onRegisteredSW(swUrl: string, registration: ServiceWorkerRegistration | undefined) {
            console.log('Service Worker registered successfully:', swUrl);

            // Check for updates periodically (every hour)
            if (registration) {
                setInterval(
                    () => {
                        registration.update();
                    },
                    60 * 60 * 1000
                );
            }
        },
        onRegisterError(error: Error) {
            console.log('Service Worker registration failed:', error);
        },
    });
};

const showUpdateNotification = (updateSW: (reloadPage?: boolean) => Promise<void>): void => {
    const updateContainer = document.getElementById('updateNotification');
    if (updateContainer) {
        updateContainer.style.display = 'block';

        const updateButton = document.getElementById('updateButton')!;
        updateButton.addEventListener(
            'click',
            () => {
                updateSW(true); // Force reload after update
            },
            { once: true }
        );

        const dismissUpdateButton = document.getElementById('dismissUpdate')!;
        dismissUpdateButton.addEventListener(
            'click',
            () => {
                updateContainer.style.display = 'none';
            },
            { once: true }
        );
    }
};
