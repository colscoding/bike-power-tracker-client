/**
 * Audio Cues
 * 
 * Provides audio feedback during workouts using speech synthesis.
 */

import type { WorkoutSegment, PowerZoneStatus } from './types';

/**
 * Audio cues service for workout announcements
 */
export class AudioCues {
    private enabled: boolean = true;
    private synth: SpeechSynthesis | null = null;
    private lastPowerWarningTime: number = 0;
    private readonly POWER_WARNING_COOLDOWN = 10000; // 10 seconds between warnings

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        }
    }

    /**
     * Check if speech synthesis is available
     */
    get isAvailable(): boolean {
        return this.synth !== null;
    }

    /**
     * Enable or disable audio cues
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Check if audio cues are enabled
     */
    get isEnabled(): boolean {
        return this.enabled && this.isAvailable;
    }

    /**
     * Speak a message
     */
    speak(text: string, priority: boolean = false): void {
        if (!this.isEnabled || !this.synth) return;

        // Cancel any ongoing speech if this is priority
        if (priority) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.volume = 1;

        this.synth.speak(utterance);
    }

    /**
     * Announce a new segment
     */
    announceSegment(segment: WorkoutSegment, nextSegment: WorkoutSegment | null): void {
        let message = segment.name;

        // Add duration
        if (segment.duration >= 60) {
            const mins = Math.floor(segment.duration / 60);
            const secs = segment.duration % 60;
            if (secs > 0) {
                message += `. ${mins} minutes ${secs} seconds.`;
            } else {
                message += `. ${mins} ${mins === 1 ? 'minute' : 'minutes'}.`;
            }
        } else {
            message += `. ${segment.duration} seconds.`;
        }

        // Add instructions if available
        if (segment.instructions) {
            message += ` ${segment.instructions}`;
        }

        this.speak(message, true);
    }

    /**
     * Countdown announcement
     */
    countdown(seconds: number): void {
        if (seconds <= 5 && seconds > 0) {
            this.speak(seconds.toString(), false);
        }
    }

    /**
     * Announce workout start
     */
    workoutStart(workoutName: string): void {
        this.speak(`Starting ${workoutName}. Let's go!`, true);
    }

    /**
     * Announce workout complete
     */
    workoutComplete(): void {
        this.speak('Workout complete. Great job!', true);
    }

    /**
     * Announce workout paused
     */
    workoutPaused(): void {
        this.speak('Workout paused.', false);
    }

    /**
     * Announce workout resumed
     */
    workoutResumed(): void {
        this.speak('Resuming workout.', false);
    }

    /**
     * Power zone warning (with cooldown to prevent spam)
     */
    powerWarning(status: PowerZoneStatus): void {
        const now = Date.now();
        if (now - this.lastPowerWarningTime < this.POWER_WARNING_COOLDOWN) {
            return;
        }

        if (status === 'low') {
            this.speak('Power too low. Increase effort.', false);
            this.lastPowerWarningTime = now;
        } else if (status === 'high') {
            this.speak('Power too high. Ease off a bit.', false);
            this.lastPowerWarningTime = now;
        }
    }

    /**
     * Announce halfway point
     */
    halfwayPoint(): void {
        this.speak('Halfway there!', false);
    }

    /**
     * Announce last interval
     */
    lastInterval(): void {
        this.speak('Last interval!', false);
    }

    /**
     * Cancel any ongoing speech
     */
    cancel(): void {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

// Singleton instance
let audioCuesInstance: AudioCues | null = null;

/**
 * Get the audio cues singleton
 */
export function getAudioCues(): AudioCues {
    if (!audioCuesInstance) {
        audioCuesInstance = new AudioCues();
    }
    return audioCuesInstance;
}

/**
 * Create a new audio cues instance (for testing)
 */
export function createAudioCues(): AudioCues {
    return new AudioCues();
}
