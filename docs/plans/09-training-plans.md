# Plan: Training Plans & Structured Workouts

## Overview

Add support for structured training plans and guided workouts with target power zones, intervals, and workout instructions.

## Priority: Low

## Effort: Large (3-4 weeks)

## Type: Feature (Client-Only, Backend-Enhanced Optional)

---

## Motivation

1. **Guided Training**: Follow structured workouts instead of freeform riding
2. **Progression**: Multi-week training plans for goals (FTP improvement, endurance)
3. **Motivation**: Clear targets and visual progress
4. **Variety**: Library of different workout types
5. **Effectiveness**: Science-based training principles

---

## Feature Overview

### Workout Types

1. **Freeform** (Current) - No targets, just record
2. **Target Workout** - Single zone/power target for duration
3. **Interval Workout** - Alternating high/low intensity periods
4. **Structured Workout** - Complex multi-segment workouts
5. **Plan Workout** - Part of a multi-week training plan

---

## Workout Data Models

```javascript
// src/workouts/models.js

/**
 * @typedef {Object} WorkoutSegment
 * @property {string} name - "Warm up", "Work interval", etc.
 * @property {number} duration - seconds
 * @property {Object} target
 * @property {number} target.powerLow - Lower bound (watts or % FTP)
 * @property {number} target.powerHigh - Upper bound
 * @property {number} [target.cadenceLow]
 * @property {number} [target.cadenceHigh]
 * @property {string} [instructions] - Text shown during segment
 */

/**
 * @typedef {Object} Workout
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} category - 'endurance' | 'threshold' | 'vo2max' | 'recovery'
 * @property {number} totalDuration - seconds
 * @property {number} tss - Training Stress Score estimate
 * @property {number} intensityFactor - IF
 * @property {WorkoutSegment[]} segments
 */

/**
 * @typedef {Object} TrainingPlan
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} goal - 'ftp-builder' | 'endurance' | 'race-prep'
 * @property {number} weeksTotal
 * @property {TrainingWeek[]} weeks
 */

/**
 * @typedef {Object} TrainingWeek
 * @property {number} weekNumber
 * @property {string} focus - "Build", "Recovery", etc.
 * @property {ScheduledWorkout[]} workouts
 */

/**
 * @typedef {Object} ScheduledWorkout
 * @property {number} dayOfWeek - 0-6 (Sunday-Saturday)
 * @property {string} workoutId
 * @property {boolean} [completed]
 * @property {string} [completedWorkoutId] - Reference to actual workout
 */
```

---

## Sample Workouts Library

```javascript
// src/workouts/library.js

export const workoutLibrary = [
    {
        id: 'endurance-60',
        name: 'Endurance 60',
        description: 'One hour steady endurance ride at low intensity',
        category: 'endurance',
        totalDuration: 3600,
        tss: 50,
        intensityFactor: 0.65,
        segments: [
            {
                name: 'Warm Up',
                duration: 600,
                target: { powerLow: 0.45, powerHigh: 0.55 }, // % of FTP
                instructions: 'Easy spinning, gradually increase effort',
            },
            {
                name: 'Main Set',
                duration: 2700,
                target: { powerLow: 0.55, powerHigh: 0.7, cadenceLow: 85, cadenceHigh: 95 },
                instructions: 'Steady endurance pace, stay relaxed',
            },
            {
                name: 'Cool Down',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning, let your heart rate come down',
            },
        ],
    },
    {
        id: 'sweet-spot-intervals',
        name: 'Sweet Spot Intervals',
        description: '4x10 minute sweet spot intervals with 5 minute recovery',
        category: 'threshold',
        totalDuration: 4200,
        tss: 75,
        intensityFactor: 0.85,
        segments: [
            {
                name: 'Warm Up',
                duration: 600,
                target: { powerLow: 0.45, powerHigh: 0.55 },
                instructions: 'Easy spinning',
            },
            // Interval 1
            {
                name: 'Sweet Spot 1',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Hold steady, should feel hard but sustainable',
            },
            {
                name: 'Recovery 1',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning, recover for next interval',
            },
            // Interval 2
            {
                name: 'Sweet Spot 2',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Same effort as first interval',
            },
            {
                name: 'Recovery 2',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Recover well, halfway done!',
            },
            // Interval 3
            {
                name: 'Sweet Spot 3',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Stay focused, two more to go',
            },
            {
                name: 'Recovery 3',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Almost there, one more interval',
            },
            // Interval 4
            {
                name: 'Sweet Spot 4',
                duration: 600,
                target: { powerLow: 0.85, powerHigh: 0.95 },
                instructions: 'Last one! Give it your all',
            },
            {
                name: 'Cool Down',
                duration: 300,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Great job! Easy spin to finish',
            },
        ],
    },
    {
        id: 'vo2max-30-30',
        name: 'VO2max 30/30',
        description: '10x 30 second hard efforts with 30 second recovery',
        category: 'vo2max',
        totalDuration: 2100,
        tss: 55,
        intensityFactor: 0.95,
        segments: [
            {
                name: 'Warm Up',
                duration: 900,
                target: { powerLow: 0.5, powerHigh: 0.65 },
                instructions: 'Include a few 10-second accelerations',
            },
            // Generate 10 intervals
            ...Array.from({ length: 10 }, (_, i) => [
                {
                    name: `Hard ${i + 1}`,
                    duration: 30,
                    target: { powerLow: 1.1, powerHigh: 1.25 },
                    instructions: i === 9 ? 'Last one!' : 'Go hard!',
                },
                {
                    name: `Easy ${i + 1}`,
                    duration: 30,
                    target: { powerLow: 0.4, powerHigh: 0.5 },
                    instructions: 'Spin easy, recover',
                },
            ]).flat(),
            {
                name: 'Cool Down',
                duration: 600,
                target: { powerLow: 0.4, powerHigh: 0.5 },
                instructions: 'Easy spinning',
            },
        ],
    },
];

export function getWorkoutById(id) {
    return workoutLibrary.find((w) => w.id === id);
}

export function getWorkoutsByCategory(category) {
    return workoutLibrary.filter((w) => w.category === category);
}
```

---

## Training Plans

```javascript
// src/workouts/plans.js

export const trainingPlans = [
    {
        id: 'ftp-builder-4week',
        name: '4-Week FTP Builder',
        description: 'Build your functional threshold power over 4 weeks',
        goal: 'ftp-builder',
        weeksTotal: 4,
        weeks: [
            {
                weekNumber: 1,
                focus: 'Base Building',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-60' },
                    { dayOfWeek: 3, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 5, workoutId: 'endurance-60' },
                    { dayOfWeek: 6, workoutId: 'sweet-spot-intervals' },
                ],
            },
            {
                weekNumber: 2,
                focus: 'Load Week',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 3, workoutId: 'vo2max-30-30' },
                    { dayOfWeek: 5, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 6, workoutId: 'endurance-60' },
                ],
            },
            {
                weekNumber: 3,
                focus: 'Peak Week',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'vo2max-30-30' },
                    { dayOfWeek: 3, workoutId: 'sweet-spot-intervals' },
                    { dayOfWeek: 4, workoutId: 'vo2max-30-30' },
                    { dayOfWeek: 6, workoutId: 'sweet-spot-intervals' },
                ],
            },
            {
                weekNumber: 4,
                focus: 'Recovery & Test',
                workouts: [
                    { dayOfWeek: 1, workoutId: 'endurance-60' },
                    { dayOfWeek: 3, workoutId: 'endurance-60' },
                    { dayOfWeek: 6, workoutId: 'ftp-test-20' }, // FTP test at end
                ],
            },
        ],
    },
];
```

---

## Workout Execution UI

### Workout Selection Screen

```html
<div class="workout-library">
    <h2>Choose a Workout</h2>

    <div class="category-tabs">
        <button data-category="all" class="active">All</button>
        <button data-category="endurance">Endurance</button>
        <button data-category="threshold">Threshold</button>
        <button data-category="vo2max">VO2max</button>
        <button data-category="recovery">Recovery</button>
    </div>

    <div class="workout-list">
        <!-- Populated by JavaScript -->
    </div>

    <button id="start-freeform">Or ride freeform</button>
</div>
```

### During Workout Display

```
┌────────────────────────────────────────────────────────┐
│  Sweet Spot Intervals          00:15:32 / 01:10:00    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Current: Sweet Spot 2                            │ │
│  │ ████████████████░░░░░░░░░░░░░ 3:45 remaining    │ │
│  │ Next: Recovery 2 (5:00)                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Target: 170-190W              Your Power: 185W ✓     │
│                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│  │ ⚡ 185W │ │ ❤️ 156  │ │ 🚴 92   │                 │
│  └─────────┘ └─────────┘ └─────────┘                 │
│                                                        │
│  "Same effort as first interval"                       │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ Workout profile visualization                   │   │
│  │  ▓▓▓░░▓▓▓░░▓▓▓░░▓▓▓░░░░░░░░░░░░░░░            │   │
│  │      ↑ YOU ARE HERE                            │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Workout Controller

```javascript
// src/workouts/WorkoutController.js

export class WorkoutController {
    constructor(workout, ftp = 200) {
        this.workout = workout;
        this.ftp = ftp;
        this.currentSegmentIndex = 0;
        this.segmentElapsed = 0;
        this.totalElapsed = 0;
        this.isRunning = false;
        this.listeners = new Set();
    }

    get currentSegment() {
        return this.workout.segments[this.currentSegmentIndex];
    }

    get nextSegment() {
        return this.workout.segments[this.currentSegmentIndex + 1];
    }

    get segmentRemaining() {
        return this.currentSegment.duration - this.segmentElapsed;
    }

    get totalRemaining() {
        return this.workout.totalDuration - this.totalElapsed;
    }

    get progress() {
        return this.totalElapsed / this.workout.totalDuration;
    }

    get targetPowerRange() {
        const target = this.currentSegment.target;
        return {
            low: Math.round(target.powerLow * this.ftp),
            high: Math.round(target.powerHigh * this.ftp),
        };
    }

    start() {
        this.isRunning = true;
        this.notify('start');
    }

    pause() {
        this.isRunning = false;
        this.notify('pause');
    }

    resume() {
        this.isRunning = true;
        this.notify('resume');
    }

    tick() {
        if (!this.isRunning) return;

        this.segmentElapsed++;
        this.totalElapsed++;

        // Check if segment complete
        if (this.segmentElapsed >= this.currentSegment.duration) {
            this.advanceSegment();
        }

        this.notify('tick');
    }

    advanceSegment() {
        if (this.currentSegmentIndex < this.workout.segments.length - 1) {
            this.currentSegmentIndex++;
            this.segmentElapsed = 0;
            this.notify('segment-change');

            // Announce new segment
            this.announceSegment();
        } else {
            this.complete();
        }
    }

    complete() {
        this.isRunning = false;
        this.notify('complete');
    }

    isPowerInZone(currentPower) {
        const { low, high } = this.targetPowerRange;
        if (currentPower < low) return 'low';
        if (currentPower > high) return 'high';
        return 'in-zone';
    }

    announceSegment() {
        // Use speech synthesis for audio cues
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(this.currentSegment.name);
            speechSynthesis.speak(utterance);
        }
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(event) {
        this.listeners.forEach((listener) => listener(event, this.getState()));
    }

    getState() {
        return {
            segment: this.currentSegment,
            nextSegment: this.nextSegment,
            segmentIndex: this.currentSegmentIndex,
            segmentElapsed: this.segmentElapsed,
            segmentRemaining: this.segmentRemaining,
            totalElapsed: this.totalElapsed,
            totalRemaining: this.totalRemaining,
            progress: this.progress,
            targetPowerRange: this.targetPowerRange,
            isRunning: this.isRunning,
        };
    }
}
```

---

## Workout Profile Visualization

```javascript
// src/workouts/WorkoutProfile.js

export class WorkoutProfile {
    constructor(canvas, workout, ftp) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.workout = workout;
        this.ftp = ftp;
    }

    render(currentPosition = 0) {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        const totalDuration = this.workout.totalDuration;
        let x = 0;

        this.workout.segments.forEach((segment, i) => {
            const segmentWidth = (segment.duration / totalDuration) * width;
            const intensity = (segment.target.powerLow + segment.target.powerHigh) / 2;
            const segmentHeight = intensity * height;

            // Color based on zone
            this.ctx.fillStyle = this.getZoneColor(intensity);
            this.ctx.fillRect(x, height - segmentHeight, segmentWidth, segmentHeight);

            x += segmentWidth;
        });

        // Draw current position marker
        if (currentPosition > 0) {
            const markerX = (currentPosition / totalDuration) * width;
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(markerX, 0);
            this.ctx.lineTo(markerX, height);
            this.ctx.stroke();
        }
    }

    getZoneColor(intensity) {
        if (intensity < 0.55) return '#4CAF50'; // Z1 - Green
        if (intensity < 0.75) return '#8BC34A'; // Z2 - Light green
        if (intensity < 0.9) return '#FFEB3B'; // Z3 - Yellow
        if (intensity < 1.05) return '#FF9800'; // Z4 - Orange
        if (intensity < 1.2) return '#FF5722'; // Z5 - Deep orange
        return '#9C27B0'; // Z6+ - Purple
    }
}
```

---

## Audio Cues

```javascript
// src/workouts/audio.js

class AudioCues {
    constructor() {
        this.enabled = true;
        this.synth = window.speechSynthesis;
    }

    speak(text) {
        if (!this.enabled || !this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1;
        this.synth.speak(utterance);
    }

    announceSegment(segment, nextSegment) {
        let message = segment.name;

        if (segment.duration >= 60) {
            const mins = Math.floor(segment.duration / 60);
            message += `. ${mins} minutes.`;
        } else {
            message += `. ${segment.duration} seconds.`;
        }

        this.speak(message);
    }

    countdown(seconds) {
        if (seconds <= 5 && seconds > 0) {
            this.speak(seconds.toString());
        }
    }

    workoutComplete() {
        this.speak('Workout complete. Great job!');
    }

    powerWarning(status) {
        if (status === 'low') {
            this.speak('Power too low');
        } else if (status === 'high') {
            this.speak('Power too high');
        }
    }
}

export const audioCues = new AudioCues();
```

---

## User Settings for FTP

```javascript
// src/workouts/settings.js

const SETTINGS_KEY = 'workout-settings';

export function getWorkoutSettings() {
    const defaults = {
        ftp: 200, // Functional Threshold Power in watts
        maxHr: 185, // Maximum Heart Rate
        audioCues: true,
        countdownBeeps: true,
        vibration: true,
    };

    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

export function saveWorkoutSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// FTP test estimation from 20-minute power
export function estimateFTPFrom20Min(avgPower20Min) {
    return Math.round(avgPower20Min * 0.95);
}
```

---

## Plan Progress Tracking

```javascript
// src/workouts/planProgress.js

const PLAN_PROGRESS_KEY = 'training-plan-progress';

export class PlanTracker {
    constructor(planId) {
        this.planId = planId;
        this.progress = this.load();
    }

    load() {
        const saved = localStorage.getItem(PLAN_PROGRESS_KEY);
        const allProgress = saved ? JSON.parse(saved) : {};
        return (
            allProgress[this.planId] || {
                startedAt: null,
                currentWeek: 1,
                completedWorkouts: [],
            }
        );
    }

    save() {
        const saved = localStorage.getItem(PLAN_PROGRESS_KEY);
        const allProgress = saved ? JSON.parse(saved) : {};
        allProgress[this.planId] = this.progress;
        localStorage.setItem(PLAN_PROGRESS_KEY, JSON.stringify(allProgress));
    }

    startPlan() {
        this.progress.startedAt = new Date().toISOString();
        this.save();
    }

    completeWorkout(weekNumber, dayOfWeek, workoutResultId) {
        this.progress.completedWorkouts.push({
            weekNumber,
            dayOfWeek,
            completedAt: new Date().toISOString(),
            workoutResultId,
        });
        this.save();
    }

    isWorkoutCompleted(weekNumber, dayOfWeek) {
        return this.progress.completedWorkouts.some(
            (w) => w.weekNumber === weekNumber && w.dayOfWeek === dayOfWeek
        );
    }

    getCompletionPercentage(plan) {
        const totalWorkouts = plan.weeks.reduce((sum, week) => sum + week.workouts.length, 0);
        return Math.round((this.progress.completedWorkouts.length / totalWorkouts) * 100);
    }
}
```

---

## Implementation Phases

### Phase 1: Workout Library (1 week)

- Workout data models
- Sample workouts
- Workout selection UI

### Phase 2: Workout Execution (1 week)

- Workout controller
- Live power target display
- Segment transitions

### Phase 3: Audio & Visual (1 week)

- Workout profile visualization
- Audio cues with speech synthesis
- Vibration feedback

### Phase 4: Training Plans (1 week)

- Plan data models
- Plan calendar view
- Progress tracking

---

## Future Enhancements

- **Custom Workout Builder** - Create your own workouts
- **ERG Mode** - For smart trainers, auto-adjust resistance
- **Workout Sharing** - Share custom workouts with others
- **AI Coaching** - Adaptive plans based on performance

---

## Related Plans

- [Analytics Dashboard](./07-analytics-dashboard.md) - Track workout completion
- [Cloud Sync](./05-cloud-sync.md) - Sync plans across devices
- [Charts Visualization](./03-charts-visualization.md) - Power zone charts
