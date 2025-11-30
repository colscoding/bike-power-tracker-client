import { getEnvMode } from "../getEnv";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installBanner: HTMLElement | null = null;

const APP_OPENS_KEY = 'app-opens';
const INSTALL_DISMISSED_KEY = 'install-dismissed';

/**
 * Track an event (placeholder for analytics)
 */
function trackEvent(eventName: string): void {
    console.log(`Event tracked: ${eventName}`);
    // Future: integrate with analytics service
}

export const initInstallPrompt = (): void => {
    if (getEnvMode() === 'test') {
        return;
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();

        // Stash the event so it can be triggered later
        deferredPrompt = e as BeforeInstallPromptEvent;

        // Track app opens and show banner after 3 opens
        const openCount = parseInt(localStorage.getItem(APP_OPENS_KEY) || '0') + 1;
        localStorage.setItem(APP_OPENS_KEY, openCount.toString());

        if (openCount >= 3 && !localStorage.getItem(INSTALL_DISMISSED_KEY)) {
            showInstallBanner();
        }

        // Also show the install button in menu
        showInstallButton();
    });

    // Listen for the app installed event
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed successfully');
        deferredPrompt = null;
        hideInstallButton();
        hideInstallBanner();
        trackEvent('pwa_installed');
    });
};

/**
 * Show install banner after completing a workout
 * Call this from the workout completion logic
 */
export function showInstallAfterWorkout(): void {
    if (deferredPrompt && !localStorage.getItem(INSTALL_DISMISSED_KEY)) {
        showInstallBanner();
    }
}

function showInstallBanner(): void {
    if (installBanner) return;

    installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="install-content">
            <img src="./assets/icons/icon-96.png" alt="App icon" class="install-icon">
            <div class="install-text">
                <strong>Install Bike Power Tracker</strong>
                <span>Add to home screen for the best experience</span>
            </div>
        </div>
        <div class="install-actions">
            <button id="install-banner-yes">Install</button>
            <button id="install-banner-no">Not now</button>
        </div>
    `;

    document.body.appendChild(installBanner);

    document.getElementById('install-banner-yes')?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                hideInstallBanner();
            }
        }
    });

    document.getElementById('install-banner-no')?.addEventListener('click', () => {
        hideInstallBanner();
        localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    });
}

function hideInstallBanner(): void {
    if (installBanner) {
        installBanner.remove();
        installBanner = null;
    }
}

const showInstallButton = (): void => {
    const installContainer = document.getElementById('installPrompt');
    if (installContainer) {
        installContainer.style.display = 'block';

        const installButton = document.getElementById('installButton')!;
        const dismissButton = document.getElementById('dismissInstall')!;

        const handleInstall = async (): Promise<void> => {
            if (!deferredPrompt) {
                return;
            }

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);

            // Clear the deferredPrompt
            deferredPrompt = null;
            hideInstallButton();
        };

        const handleDismiss = (): void => {
            hideInstallButton();
        };

        // Use { once: true } to automatically remove listener after first invocation
        installButton.addEventListener('click', handleInstall, { once: true });
        dismissButton.addEventListener('click', handleDismiss, { once: true });
    }
};

const hideInstallButton = (): void => {
    const installContainer = document.getElementById('installPrompt');
    if (installContainer) {
        installContainer.style.display = 'none';
    }
};
