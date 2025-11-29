import type { AppSettings } from '../types/index.js';

export function initSettings(): void {
    const settingsButton = document.getElementById('settingsButton')!;
    const settingsModal = document.getElementById('settingsModal')!;
    const closeSettingsModal = document.getElementById('closeSettingsModal')!;
    const saveSettingsButton = document.getElementById('saveSettings')!;

    const settingPower = document.getElementById('settingPower') as HTMLInputElement;
    const settingCadence = document.getElementById('settingCadence') as HTMLInputElement;
    const settingHeartrate = document.getElementById('settingHeartrate') as HTMLInputElement;

    // Load settings from localStorage
    const loadSettings = (): void => {
        const settings: AppSettings = JSON.parse(
            localStorage.getItem('bpt-settings') || 'null'
        ) || {
            power: true,
            cadence: true,
            heartrate: true,
        };

        settingPower.checked = settings.power;
        settingCadence.checked = settings.cadence;
        settingHeartrate.checked = settings.heartrate;

        applySettings(settings);
    };

    // Save settings to localStorage
    const saveSettings = (): void => {
        const settings: AppSettings = {
            power: settingPower.checked,
            cadence: settingCadence.checked,
            heartrate: settingHeartrate.checked,
        };

        localStorage.setItem('bpt-settings', JSON.stringify(settings));
        applySettings(settings);
        closeModal();
    };

    // Apply settings to the UI
    const applySettings = (settings: AppSettings): void => {
        const toggleMetric = (metric: keyof AppSettings, isVisible: boolean): void => {
            const elements = document.querySelectorAll<HTMLElement>(`.metric-group-${metric}`);
            elements.forEach((el) => {
                el.style.display = isVisible ? 'flex' : 'none';
            });
        };

        toggleMetric('power', settings.power);
        toggleMetric('cadence', settings.cadence);
        toggleMetric('heartrate', settings.heartrate);
    };

    const openModal = (): void => {
        settingsModal.style.display = 'flex';
        // Close the main menu details element
        const details = document.querySelector('header details');
        if (details) {
            details.removeAttribute('open');
        }
    };

    const closeModal = (): void => {
        settingsModal.style.display = 'none';
    };

    // Event Listeners
    settingsButton.addEventListener('click', openModal);
    closeSettingsModal.addEventListener('click', closeModal);
    saveSettingsButton.addEventListener('click', saveSettings);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeModal();
        }
    });

    // Initialize
    loadSettings();
}
