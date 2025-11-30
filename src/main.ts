import './main.css';
import { initTimerDisplay } from './ui/time.js';
import { initDiscardButton, initExportButton } from './ui/menu.js';
import { initMetricsDisplay } from './initMetricsDisplay.js';
import { initConnectionButtons } from './initConnectionButtons.js';
import { getInitState } from './getInitState.js';
import { handleWakeLock } from './ui/wakeLock.js';
import { registerServiceWorker } from './ui/serviceWorker.js';
import { initInstallPrompt } from './ui/installPrompt.js';
import { initSettings } from './ui/settings.js';
import { exposeVariablesDuringTest } from './exposeVariablesDuringTest.js';
import { initOfflineIndicator } from './ui/offlineIndicator.js';
import { initUpdatePrompt } from './ui/updatePrompt.js';
import { initBackgroundSync } from './services/backgroundSync.js';
import { initCacheManager } from './services/cacheManager.js';
import { initStorage } from './services/storage.js';
import { initWorkoutPersistence } from './ui/workoutPersistence.js';
import { store, actions } from './store/index.js';

const { measurementsState, connectionsState, timeState } = getInitState();
exposeVariablesDuringTest({ measurementsState, connectionsState, store, actions });

initTimerDisplay(timeState);
initMetricsDisplay({ connectionsState, measurementsState });

initConnectionButtons({ connectionsState, measurementsState });
initDiscardButton({ measurementsState, timeState });
initExportButton(measurementsState);

handleWakeLock();
registerServiceWorker();
initInstallPrompt();
initSettings();

// Initialize offline/PWA improvements
initOfflineIndicator();
initUpdatePrompt();
initBackgroundSync();
initCacheManager();
initStorage();

// Initialize workout persistence (auto-save to IndexedDB)
initWorkoutPersistence({ measurementsState, timeState });
