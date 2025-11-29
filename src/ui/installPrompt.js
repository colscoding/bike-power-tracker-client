let deferredPrompt = null;

export const initInstallPrompt = () => {
    if (import.meta.env.MODE === 'test') {
        return;
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();

        // Stash the event so it can be triggered later
        deferredPrompt = e;

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

const showInstallButton = () => {
    const installContainer = document.getElementById('installPrompt');
    if (installContainer) {
        installContainer.style.display = 'block';

        const installButton = document.getElementById('installButton');
        const dismissButton = document.getElementById('dismissInstall');

        const handleInstall = async () => {
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

        const handleDismiss = () => {
            hideInstallButton();
        };

        // Use { once: true } to automatically remove listener after first invocation
        installButton.addEventListener('click', handleInstall, { once: true });
        dismissButton.addEventListener('click', handleDismiss, { once: true });
    }
};

const hideInstallButton = () => {
    const installContainer = document.getElementById('installPrompt');
    if (installContainer) {
        installContainer.style.display = 'none';
    }
};
