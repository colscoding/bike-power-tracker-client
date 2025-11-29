# Plan: Enhanced Offline & PWA Improvements

## Overview

Improve the Progressive Web App (PWA) experience with better offline support, smarter caching, and enhanced installability.

## Priority: Medium
## Effort: Small-Medium (1 week)
## Type: Feature (Client-Only)

---

## Motivation

1. **Reliability**: App should work perfectly without network
2. **Performance**: Faster load times with smart caching
3. **User Experience**: Clear offline/online status indicators
4. **Data Safety**: Never lose workout data due to connectivity issues
5. **Install Experience**: Smooth PWA installation flow

---

## Current State

The app uses `vite-plugin-pwa` with workbox for basic service worker support:
- Static assets are cached
- Basic offline support exists
- No explicit offline data handling
- No sync when back online

---

## Improvements

### 1. Offline Status Indicator

```javascript
// src/ui/offlineIndicator.js

export function initOfflineIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'offline-indicator';
  indicator.innerHTML = '📡 Offline';
  indicator.style.display = 'none';
  document.body.appendChild(indicator);
  
  function updateStatus() {
    const isOffline = !navigator.onLine;
    indicator.style.display = isOffline ? 'flex' : 'none';
    document.body.classList.toggle('is-offline', isOffline);
  }
  
  window.addEventListener('online', () => {
    updateStatus();
    showNotification('Back online! Syncing data...', 'success');
    // Trigger any pending syncs
    dispatchEvent(new CustomEvent('app:online'));
  });
  
  window.addEventListener('offline', () => {
    updateStatus();
    showNotification('You\'re offline. Data will be saved locally.', 'warning');
  });
  
  updateStatus();
}
```

```css
/* Offline indicator styles */
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #f6c23e;
  color: #333;
  padding: 8px;
  text-align: center;
  font-size: 14px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

body.is-offline .requires-network {
  opacity: 0.5;
  pointer-events: none;
}
```

---

### 2. Enhanced Workbox Configuration

```javascript
// vite.config.js

import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bike Power Tracker',
        short_name: 'Power Tracker',
        description: 'Track cycling power, heart rate, and cadence',
        theme_color: '#2196F3',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['fitness', 'sports', 'health'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          { src: 'screenshots/main.png', sizes: '1080x1920', type: 'image/png' }
        ]
      },
      workbox: {
        // Cache strategies
        runtimeCaching: [
          {
            // Cache JavaScript and CSS with stale-while-revalidate
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            // Cache images with cache-first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          },
          {
            // Cache fonts
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          }
        ],
        // Precache important pages
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Skip waiting for immediate updates
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ]
};
```

---

### 3. Background Sync for Exports

When exporting while offline, queue the export and complete when back online:

```javascript
// src/services/backgroundSync.js

const SYNC_QUEUE_KEY = 'pending-exports';

export async function queueExport(data, format) {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  
  queue.push({
    id: Date.now(),
    data,
    format,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  
  // Register for background sync if supported
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('export-queue');
  }
}

export function getPendingExports() {
  return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
}

export function clearExport(id) {
  const queue = getPendingExports().filter(item => item.id !== id);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

// Process queue when online
window.addEventListener('app:online', async () => {
  const pending = getPendingExports();
  
  for (const item of pending) {
    try {
      await processExport(item);
      clearExport(item.id);
    } catch (error) {
      console.error('Failed to process export:', error);
    }
  }
});
```

---

### 4. Update Notification

```javascript
// src/ui/updatePrompt.js

export function initUpdatePrompt() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated
      showUpdateNotification();
    });
  }
}

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <span>🎉 New version available!</span>
    <button id="update-now">Update Now</button>
    <button id="update-later">Later</button>
  `;
  
  document.body.appendChild(notification);
  
  document.getElementById('update-now').addEventListener('click', () => {
    window.location.reload();
  });
  
  document.getElementById('update-later').addEventListener('click', () => {
    notification.remove();
  });
}
```

```css
.update-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2328;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10000;
}

.update-notification button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#update-now {
  background: #2196F3;
  color: white;
}

#update-later {
  background: transparent;
  color: #999;
}
```

---

### 5. Install Experience Improvement

Enhance the existing install prompt:

```javascript
// src/ui/installPrompt.js - Enhanced version

let deferredPrompt = null;
let installBanner = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Don't show immediately - wait for good moment
    // Show after first successful workout or after 3 app opens
    const openCount = parseInt(localStorage.getItem('app-opens') || '0') + 1;
    localStorage.setItem('app-opens', openCount.toString());
    
    if (openCount >= 3 && !localStorage.getItem('install-dismissed')) {
      showInstallBanner();
    }
  });
  
  // Track installation
  window.addEventListener('appinstalled', () => {
    hideInstallBanner();
    deferredPrompt = null;
    trackEvent('pwa_installed');
  });
}

function showInstallBanner() {
  if (installBanner) return;
  
  installBanner = document.createElement('div');
  installBanner.className = 'install-banner';
  installBanner.innerHTML = `
    <div class="install-content">
      <img src="/icons/icon-96.png" alt="App icon" class="install-icon">
      <div class="install-text">
        <strong>Install Bike Power Tracker</strong>
        <span>Add to home screen for the best experience</span>
      </div>
    </div>
    <div class="install-actions">
      <button id="install-yes">Install</button>
      <button id="install-no">Not now</button>
    </div>
  `;
  
  document.body.appendChild(installBanner);
  
  document.getElementById('install-yes').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        hideInstallBanner();
      }
    }
  });
  
  document.getElementById('install-no').addEventListener('click', () => {
    hideInstallBanner();
    localStorage.setItem('install-dismissed', 'true');
  });
}

function hideInstallBanner() {
  if (installBanner) {
    installBanner.remove();
    installBanner = null;
  }
}

// Also trigger install prompt after completing first workout
export function showInstallAfterWorkout() {
  if (deferredPrompt && !localStorage.getItem('install-dismissed')) {
    showInstallBanner();
  }
}
```

```css
.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.install-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.install-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.install-text {
  display: flex;
  flex-direction: column;
}

.install-text span {
  font-size: 12px;
  color: #666;
}

.install-actions {
  display: flex;
  gap: 8px;
}

#install-yes {
  background: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

#install-no {
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
```

---

### 6. Cache Size Management

```javascript
// src/services/cacheManager.js

export async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage,
      quota: estimate.quota,
      percent: Math.round((estimate.usage / estimate.quota) * 100)
    };
  }
  return null;
}

export async function clearOldCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const currentCaches = ['static-resources', 'images', 'fonts'];
    
    for (const name of cacheNames) {
      if (!currentCaches.includes(name)) {
        await caches.delete(name);
        console.log(`Deleted old cache: ${name}`);
      }
    }
  }
}

// Show warning if storage is getting full
export async function checkStorageQuota() {
  const size = await getCacheSize();
  
  if (size && size.percent > 80) {
    showNotification(
      `Storage is ${size.percent}% full. Consider clearing old data.`,
      'warning'
    );
  }
}
```

---

### 7. Persistent Storage Request

```javascript
// src/services/storage.js

export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    
    if (!isPersisted) {
      const result = await navigator.storage.persist();
      
      if (result) {
        console.log('Storage will not be cleared except by explicit user action');
      } else {
        console.log('Storage may be cleared by the browser');
      }
      
      return result;
    }
    
    return true;
  }
  
  return false;
}
```

---

## Testing Offline Behavior

### Manual Testing Checklist

1. **Initial Load Offline**
   - [ ] App loads from cache
   - [ ] All UI elements render
   - [ ] No network errors in console

2. **Start Workout Offline**
   - [ ] Can connect to Bluetooth sensors
   - [ ] Measurements are recorded
   - [ ] Timer works correctly

3. **Export Offline**
   - [ ] Can export to file (JSON, CSV, TCX)
   - [ ] File downloads correctly

4. **Coming Back Online**
   - [ ] Online indicator appears
   - [ ] Pending syncs process (if backend exists)

5. **Update While Offline**
   - [ ] App continues working
   - [ ] Update prompt shows when back online

### Playwright E2E Test

```javascript
// test-e2e/offline.spec.js

import { test, expect } from '@playwright/test';

test.describe('Offline functionality', () => {
  test('app works offline after initial load', async ({ page, context }) => {
    // Load app online first
    await page.goto('/');
    await expect(page.locator('#time')).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    
    // Reload should still work
    await page.reload();
    await expect(page.locator('#time')).toBeVisible();
    
    // Should show offline indicator
    await expect(page.locator('.offline-indicator')).toBeVisible();
  });
  
  test('workout can be recorded offline', async ({ page, context }) => {
    await page.goto('/');
    await context.setOffline(true);
    
    // Start workout
    await page.click('#startStopButton');
    
    // Timer should be running
    await expect(page.locator('#time')).not.toHaveText('00:00:00');
    
    // Stop workout
    await page.click('#startStopButton');
  });
});
```

---

## Implementation Phases

### Phase 1: Indicators & Notifications
- Offline status indicator
- Update notification
- Storage quota warning

### Phase 2: Enhanced Caching
- Workbox configuration improvements
- Cache size management
- Persistent storage request

### Phase 3: Install Experience
- Improved install prompt timing
- Better install UI
- Post-workout install suggestion

### Phase 4: Background Sync
- Export queue for offline
- Sync when back online
- Conflict handling

---

## Related Plans

- [Workout History](./02-workout-history.md) - Local storage for workouts
- [Cloud Sync](./05-cloud-sync.md) - Sync when online
