# Plan: Workout History & IndexedDB Storage

## Overview

Add persistent local storage for workout history using IndexedDB, enabling users to view past workouts, track progress over time, and resume incomplete sessions.

## Priority: High

## Effort: Medium (1-2 weeks)

## Type: Client-Only Feature

---

## Motivation

1. **Data Persistence**: Users lose all data on page refresh - frustrating for long workouts
2. **Workout History**: View past performances to track fitness progress
3. **Resume Workouts**: Continue interrupted workouts without data loss
4. **Offline-First**: Works without internet, aligns with PWA philosophy
5. **No Backend Required**: Keeps the app simple and privacy-focused

---

## Feature Requirements

### Must Have

- [ ] Auto-save workout data every 10 seconds during active workout
- [ ] Save completed workouts with metadata (date, duration, averages)
- [ ] List view of past workouts with basic stats
- [ ] View individual workout details
- [ ] Delete workouts
- [ ] Resume incomplete workout on app reopen

### Nice to Have

- [ ] Search/filter workouts by date range
- [ ] Workout comparison view
- [ ] Export all workout history as JSON backup
- [ ] Import workout history from backup

---

## Technical Design

### Database Schema (IndexedDB)

```javascript
// Database: BikeTrackerDB v1

// Object Store: workouts
{
  id: string,              // UUID
  status: 'active' | 'completed' | 'discarded',
  startTime: number,       // Unix timestamp
  endTime: number | null,
  duration: number,        // milliseconds

  // Raw measurements
  measurements: {
    power: Measurement[],
    heartrate: Measurement[],
    cadence: Measurement[]
  },

  // Computed summaries
  summary: {
    avgPower: number | null,
    maxPower: number | null,
    avgHeartrate: number | null,
    maxHeartrate: number | null,
    avgCadence: number | null,
    maxCadence: number | null,
    totalDataPoints: number
  },

  // Metadata
  createdAt: number,
  updatedAt: number
}

// Object Store: settings
{
  key: string,
  value: any
}
```

### New Files Structure

```
src/
├── db/
│   ├── index.ts              # Database initialization
│   ├── workouts.ts           # Workout CRUD operations
│   ├── settings.ts           # Settings storage
│   └── migrations.ts         # Schema migrations
├── services/
│   ├── workoutService.ts     # Business logic
│   └── autoSaveService.ts    # Auto-save timer
└── ui/
    ├── history.ts            # History view
    └── workoutDetail.ts      # Single workout view
```

### Database Module

```javascript
// src/db/index.js
const DB_NAME = 'BikeTrackerDB';
const DB_VERSION = 1;

export const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Workouts store with indexes
            if (!db.objectStoreNames.contains('workouts')) {
                const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
                workoutStore.createIndex('status', 'status', { unique: false });
                workoutStore.createIndex('startTime', 'startTime', { unique: false });
            }

            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    });
};
```

### Workout Service

```javascript
// src/services/workoutService.js
import { openDatabase } from '../db/index.js';
import { v4 as uuid } from 'uuid';

export class WorkoutService {
    constructor() {
        this.db = null;
        this.currentWorkoutId = null;
    }

    async init() {
        this.db = await openDatabase();
    }

    async startWorkout() {
        const workout = {
            id: uuid(),
            status: 'active',
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            measurements: { power: [], heartrate: [], cadence: [] },
            summary: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await this.saveWorkout(workout);
        this.currentWorkoutId = workout.id;
        return workout;
    }

    async saveWorkout(workout) {
        const tx = this.db.transaction('workouts', 'readwrite');
        const store = tx.objectStore('workouts');
        workout.updatedAt = Date.now();
        await store.put(workout);
    }

    async completeWorkout(measurementsState) {
        const workout = await this.getWorkout(this.currentWorkoutId);
        workout.status = 'completed';
        workout.endTime = Date.now();
        workout.duration = workout.endTime - workout.startTime;
        workout.measurements = {
            power: [...measurementsState.power],
            heartrate: [...measurementsState.heartrate],
            cadence: [...measurementsState.cadence],
        };
        workout.summary = this.calculateSummary(workout.measurements);

        await this.saveWorkout(workout);
        this.currentWorkoutId = null;
        return workout;
    }

    calculateSummary(measurements) {
        const avg = (arr) =>
            arr.length ? arr.reduce((a, b) => a + b.value, 0) / arr.length : null;
        const max = (arr) => (arr.length ? Math.max(...arr.map((m) => m.value)) : null);

        return {
            avgPower: avg(measurements.power),
            maxPower: max(measurements.power),
            avgHeartrate: avg(measurements.heartrate),
            maxHeartrate: max(measurements.heartrate),
            avgCadence: avg(measurements.cadence),
            maxCadence: max(measurements.cadence),
            totalDataPoints:
                measurements.power.length +
                measurements.heartrate.length +
                measurements.cadence.length,
        };
    }

    async getWorkoutHistory(limit = 50) {
        const tx = this.db.transaction('workouts', 'readonly');
        const store = tx.objectStore('workouts');
        const index = store.index('startTime');

        return new Promise((resolve) => {
            const workouts = [];
            const request = index.openCursor(null, 'prev'); // Newest first

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && workouts.length < limit) {
                    if (cursor.value.status === 'completed') {
                        workouts.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(workouts);
                }
            };
        });
    }

    async deleteWorkout(id) {
        const tx = this.db.transaction('workouts', 'readwrite');
        const store = tx.objectStore('workouts');
        await store.delete(id);
    }

    async getActiveWorkout() {
        const tx = this.db.transaction('workouts', 'readonly');
        const store = tx.objectStore('workouts');
        const index = store.index('status');

        return new Promise((resolve) => {
            const request = index.get('active');
            request.onsuccess = () => resolve(request.result || null);
        });
    }
}
```

### Auto-Save Service

```javascript
// src/services/autoSaveService.js
export class AutoSaveService {
    constructor(workoutService, measurementsState) {
        this.workoutService = workoutService;
        this.measurementsState = measurementsState;
        this.intervalId = null;
        this.saveInterval = 10000; // 10 seconds
    }

    start() {
        this.intervalId = setInterval(() => this.save(), this.saveInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async save() {
        if (!this.workoutService.currentWorkoutId) return;

        const workout = await this.workoutService.getWorkout(this.workoutService.currentWorkoutId);

        workout.measurements = {
            power: [...this.measurementsState.power],
            heartrate: [...this.measurementsState.heartrate],
            cadence: [...this.measurementsState.cadence],
        };
        workout.duration = Date.now() - workout.startTime;

        await this.workoutService.saveWorkout(workout);
        console.log('Auto-saved workout data');
    }
}
```

---

## UI Components

### History View (New Screen)

```html
<!-- Add to index.html -->
<div id="historyModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>📊 Workout History</h2>
            <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <div id="workoutList"></div>
        </div>
    </div>
</div>
```

```javascript
// src/ui/history.js
export function renderWorkoutHistory(workouts) {
    const container = document.getElementById('workoutList');

    if (workouts.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No workouts yet. Start your first workout!</p>';
        return;
    }

    container.innerHTML = workouts
        .map(
            (workout) => `
    <div class="workout-card" data-id="${workout.id}">
      <div class="workout-date">
        ${new Date(workout.startTime).toLocaleDateString()}
      </div>
      <div class="workout-duration">
        ${formatDuration(workout.duration)}
      </div>
      <div class="workout-stats">
        ${workout.summary.avgPower ? `⚡ ${Math.round(workout.summary.avgPower)}W` : ''}
        ${workout.summary.avgHeartrate ? `❤️ ${Math.round(workout.summary.avgHeartrate)}bpm` : ''}
        ${workout.summary.avgCadence ? `🚴 ${Math.round(workout.summary.avgCadence)}rpm` : ''}
      </div>
      <div class="workout-actions">
        <button class="view-btn">View</button>
        <button class="delete-btn">Delete</button>
      </div>
    </div>
  `
        )
        .join('');
}
```

---

## Integration with Existing Code

### Modified main.js

```javascript
import { WorkoutService } from './services/workoutService.js';
import { AutoSaveService } from './services/autoSaveService.js';

const workoutService = new WorkoutService();
await workoutService.init();

// Check for active workout on startup
const activeWorkout = await workoutService.getActiveWorkout();
if (activeWorkout) {
    const resume = confirm('You have an unfinished workout. Resume?');
    if (resume) {
        // Restore state from activeWorkout
        measurementsState.power = activeWorkout.measurements.power;
        measurementsState.heartrate = activeWorkout.measurements.heartrate;
        measurementsState.cadence = activeWorkout.measurements.cadence;
        workoutService.currentWorkoutId = activeWorkout.id;
    } else {
        await workoutService.deleteWorkout(activeWorkout.id);
    }
}

// Start auto-save when workout begins
const autoSave = new AutoSaveService(workoutService, measurementsState);

// Modify start button handler
startStopButton.addEventListener('click', async () => {
    if (!timeState.running) {
        await workoutService.startWorkout();
        autoSave.start();
    } else {
        autoSave.stop();
        await workoutService.completeWorkout(measurementsState);
    }
});
```

---

## Storage Considerations

### Size Limits

- IndexedDB typically allows 50% of free disk space
- A 1-hour workout with all sensors ≈ 500KB
- 100 workouts ≈ 50MB (very manageable)

### Data Cleanup

```javascript
// Optional: Clean up old workouts (keep last 100)
async cleanupOldWorkouts(keepCount = 100) {
  const all = await this.getWorkoutHistory(999999);
  if (all.length > keepCount) {
    const toDelete = all.slice(keepCount);
    for (const workout of toDelete) {
      await this.deleteWorkout(workout.id);
    }
  }
}
```

---

## Migration Path

1. **v1.0**: Basic save/load with auto-save
2. **v1.1**: History view with list and detail
3. **v1.2**: Export/import backup
4. **v1.3**: Workout comparison and trends

---

## Related Plans

- [Cloud Sync](./05-cloud-sync.md) - Optional sync to backend
- [Analytics Dashboard](./07-analytics-dashboard.md) - Charts and trends
- [Offline Improvements](./08-offline-improvements.md) - Better PWA support
