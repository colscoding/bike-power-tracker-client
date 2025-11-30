import { getEnvMode } from "../getEnv";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

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

        // Show the install button
        showInstallButton();
    });

    // Listen for the app installed event
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed successfully');
        deferredPrompt = null;
        hideInstallButton();
    });
};

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
