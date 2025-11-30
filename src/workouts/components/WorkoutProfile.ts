/**
 * Workout Profile Component
 * 
 * Visual representation of a workout's structure using a canvas.
 * Shows segments as blocks with heights proportional to intensity.
 */

import { BaseComponent } from '../../components/base/BaseComponent';
import type { StructuredWorkout } from '../types';
import { getIntensityColor } from '../settings';

const STYLES = `
    :host {
        display: block;
    }

    .workout-profile {
        background: var(--color-surface, #f6f8fa);
        border-radius: var(--border-radius-md, 8px);
        padding: var(--spacing-sm, 8px);
        margin-bottom: var(--spacing-md, 16px);
    }

    .profile-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm, 8px);
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-text-secondary, #656d76);
    }

    canvas {
        width: 100%;
        height: 80px;
        display: block;
        border-radius: var(--border-radius-sm, 4px);
    }

    .zone-legend {
        display: flex;
        gap: var(--spacing-md, 16px);
        justify-content: center;
        margin-top: var(--spacing-sm, 8px);
        font-size: var(--font-size-xs, 0.75rem);
    }

    .zone-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
    }

    .zone-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
    }
`;

export class WorkoutProfile extends BaseComponent {
    private workout: StructuredWorkout | null = null;
    private currentPosition: number = 0;
    private canvas: HTMLCanvasElement | null = null;
    private resizeObserver: ResizeObserver | null = null;

    protected template(): string {
        if (!this.workout) {
            return `<div class="workout-profile" style="display: none;"></div>`;
        }

        return `
            <div class="workout-profile">
                <div class="profile-header">
                    <span>${this.workout.name}</span>
                    <span>${this.workout.segments.length} segments</span>
                </div>
                <canvas id="profile-canvas"></canvas>
                <div class="zone-legend">
                    <div class="zone-item">
                        <div class="zone-color" style="background: #4CAF50"></div>
                        <span>Z1-2</span>
                    </div>
                    <div class="zone-item">
                        <div class="zone-color" style="background: #FFEB3B"></div>
                        <span>Z3</span>
                    </div>
                    <div class="zone-item">
                        <div class="zone-color" style="background: #FF9800"></div>
                        <span>Z4</span>
                    </div>
                    <div class="zone-item">
                        <div class="zone-color" style="background: #FF5722"></div>
                        <span>Z5+</span>
                    </div>
                </div>
            </div>
        `;
    }

    protected styles(): string {
        return STYLES;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.setupResizeObserver();
    }

    protected cleanup(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    private setupResizeObserver(): void {
        this.resizeObserver = new ResizeObserver(() => {
            this.drawProfile();
        });

        const canvas = this.$<HTMLCanvasElement>('#profile-canvas');
        if (canvas) {
            this.resizeObserver.observe(canvas);
        }
    }

    protected setupEventListeners(): void {
        // Wait for next frame to ensure canvas is rendered
        requestAnimationFrame(() => {
            this.canvas = this.$<HTMLCanvasElement>('#profile-canvas');
            this.drawProfile();
        });
    }

    /**
     * Set the workout to display
     */
    public setWorkout(workout: StructuredWorkout): void {
        this.workout = workout;
        this.currentPosition = 0;
        this.render();
    }

    /**
     * Update the current position marker
     */
    public setPosition(seconds: number): void {
        this.currentPosition = seconds;
        this.drawProfile();
    }

    /**
     * Clear the profile
     */
    public clear(): void {
        this.workout = null;
        this.currentPosition = 0;
        this.render();
    }

    /**
     * Draw the workout profile on canvas
     */
    private drawProfile(): void {
        const canvas = this.canvas || this.$<HTMLCanvasElement>('#profile-canvas');
        if (!canvas || !this.workout) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with device pixel ratio for crisp rendering
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const totalDuration = this.workout.totalDuration;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw segments
        let x = 0;
        for (const segment of this.workout.segments) {
            const segmentWidth = (segment.duration / totalDuration) * width;
            const intensity = (segment.target.powerLow + segment.target.powerHigh) / 2;
            // Scale intensity: 0.4 = 20% height, 1.2 = 100% height
            const normalizedIntensity = Math.min(1, Math.max(0.2, (intensity - 0.2) / 1.0));
            const segmentHeight = normalizedIntensity * height;

            ctx.fillStyle = getIntensityColor(intensity);
            ctx.fillRect(x, height - segmentHeight, segmentWidth, segmentHeight);

            // Draw segment border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, height - segmentHeight, segmentWidth, segmentHeight);

            x += segmentWidth;
        }

        // Draw current position marker
        if (this.currentPosition > 0) {
            const markerX = (this.currentPosition / totalDuration) * width;

            // Draw vertical line
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(markerX, 0);
            ctx.lineTo(markerX, height);
            ctx.stroke();

            // Draw small triangle at top
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(markerX, 0);
            ctx.lineTo(markerX - 5, 8);
            ctx.lineTo(markerX + 5, 8);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Register the component
if (!customElements.get('workout-profile')) {
    customElements.define('workout-profile', WorkoutProfile);
}
